import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ── Normalizers ──────────────────────────────────────────────────────────

/** Parse money-like strings: "1.294.020", "55.000,00", "1,294,020.00", plain numbers */
function parseMoneyLike(raw: unknown): number | null {
  if (raw == null) return null;
  if (typeof raw === "number") return isFinite(raw) ? raw : null;
  const s = String(raw).trim();
  if (!s) return null;

  // Detect de-DE: dots as thousands, comma as decimal  (e.g. "1.294.020,50")
  const deMatch = s.match(/^-?\d{1,3}(\.\d{3})*(,\d+)?$/);
  if (deMatch) {
    const cleaned = s.replace(/\./g, "").replace(",", ".");
    const n = parseFloat(cleaned);
    return isFinite(n) ? n : null;
  }

  // Detect en-US: commas as thousands, dot as decimal (e.g. "1,294,020.50")
  const enMatch = s.match(/^-?\d{1,3}(,\d{3})*(\.\d+)?$/);
  if (enMatch) {
    const cleaned = s.replace(/,/g, "");
    const n = parseFloat(cleaned);
    return isFinite(n) ? n : null;
  }

  // Plain number with optional comma decimal (e.g. "55000,00" or "55000.00")
  const plain = s.replace(",", ".");
  const n = parseFloat(plain);
  return isFinite(n) ? n : null;
}

/** Parse date-like strings: ISO "2030-12-31", German "31.12.2030", or null */
function parseDateLike(raw: unknown): string | null {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;

  // ISO format
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : s;
  }

  // German DD.MM.YYYY
  const deMatch = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (deMatch) {
    const [, day, month, year] = deMatch;
    const iso = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : iso;
  }

  return null;
}

// ── Interfaces ───────────────────────────────────────────────────────────

interface LoanData {
  bank_name?: string | null;
  outstanding_balance_eur?: number | string | null;
  annuity_monthly_eur?: number | string | null;
  fixed_interest_end_date?: string | null;
  interest_rate_percent?: number | string | null;
  original_amount?: number | string | null;
}

interface PropertyCreate {
  address: string;
  city: string;
  postal_code?: string;
  country?: string;
  property_type?: string;
  usage_type?: string;
  total_area_sqm?: number;
  year_built?: number;
  purchase_price?: number;
  market_value?: number;
  annual_income?: number;
  description?: string;
  units_count?: number;
  loan_data?: LoanData;
  landlord_context_id?: string;
}

interface PropertyUpdate extends Partial<PropertyCreate> {
  property_id: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid user" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: profile } = await supabaseUser
      .from("profiles")
      .select("active_tenant_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.active_tenant_id) {
      return new Response(
        JSON.stringify({ error: "No active tenant" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tenantId = profile.active_tenant_id;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();
    const action = body.action || "create";

    // ── Helper: create or upsert a loan for a given property ──
    async function upsertLoan(
      propertyId: string,
      unitId: string | null,
      loanData: LoanData,
      publicId: string | null,
    ): Promise<{ loan_status: "created" | "skipped" | "failed"; loan_id?: string; loan_error?: string; loan_input_debug?: Record<string, unknown> }> {
      // Normalize all loan fields
      const outstandingBalance = parseMoneyLike(loanData.outstanding_balance_eur);
      const annuityMonthly = parseMoneyLike(loanData.annuity_monthly_eur);
      const interestRate = parseMoneyLike(loanData.interest_rate_percent);
      const originalAmount = parseMoneyLike(loanData.original_amount);
      const fixedInterestEnd = parseDateLike(loanData.fixed_interest_end_date);

      const hasAnyValue = loanData.bank_name || outstandingBalance || annuityMonthly || interestRate || originalAmount;

      if (!hasAnyValue) {
        return { loan_status: "skipped", loan_input_debug: { reason: "no_valid_fields_after_normalization" } };
      }

      const loanInsert: Record<string, unknown> = {
        tenant_id: tenantId,
        property_id: propertyId,
        unit_id: unitId,
        bank_name: loanData.bank_name || "Unbekannt",
        loan_number: `IMPORT-${publicId || propertyId.slice(0, 8)}`,
        scope: "PROPERTY",
        outstanding_balance_eur: outstandingBalance,
        annuity_monthly_eur: annuityMonthly,
        fixed_interest_end_date: fixedInterestEnd,
        interest_rate_percent: interestRate,
        original_amount: originalAmount,
      };

      const { data: loan, error: loanError } = await supabaseAdmin
        .from("loans")
        .insert(loanInsert)
        .select("id")
        .single();

      if (loanError) {
        console.error("Loan create error:", loanError);
        return {
          loan_status: "failed",
          loan_error: loanError.message,
          loan_input_debug: {
            bank: loanData.bank_name,
            balance_raw: loanData.outstanding_balance_eur,
            balance_parsed: outstandingBalance,
            annuity_raw: loanData.annuity_monthly_eur,
            annuity_parsed: annuityMonthly,
            date_raw: loanData.fixed_interest_end_date,
            date_parsed: fixedInterestEnd,
          },
        };
      }

      console.log(`Loan created: ${loan.id} for property ${propertyId}`);
      return { loan_status: "created", loan_id: loan.id };
    }

    // ── CREATE Property ──
    if (action === "create") {
      const data: PropertyCreate = body.data;
      
      if (!data.address || !data.city) {
        return new Response(
          JSON.stringify({ error: "Address and city are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const insertData: Record<string, unknown> = {
        tenant_id: tenantId,
        address: data.address,
        city: data.city,
        postal_code: data.postal_code,
        country: data.country || "DE",
        property_type: data.property_type || "apartment",
        usage_type: data.usage_type || "residential",
        total_area_sqm: data.total_area_sqm,
        year_built: data.year_built,
        purchase_price: data.purchase_price,
        market_value: data.market_value,
        description: data.description,
        status: "active",
      };

      if (data.landlord_context_id) {
        insertData.landlord_context_id = data.landlord_context_id;
      }

      const parsedAnnualIncome = parseMoneyLike(data.annual_income);
      if (parsedAnnualIncome != null) {
        insertData.annual_income = parsedAnnualIncome;
      }

      if (data.units_count && data.units_count > 1) {
        insertData.multi_unit_enabled = true;
      }

      const { data: property, error: propError } = await supabaseAdmin
        .from("properties")
        .insert(insertData)
        .select("id, public_id, address, city")
        .single();

      if (propError) {
        console.error("Property create error:", propError);
        return new Response(
          JSON.stringify({ error: "Failed to create property" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get the auto-created unit
      const { data: unit } = await supabaseAdmin
        .from("units")
        .select("id, public_id, unit_number")
        .eq("property_id", property.id)
        .maybeSingle();

      // Create loan
      let loanResult: { loan_status: string; loan_id?: string; loan_error?: string; loan_input_debug?: Record<string, unknown> } = { loan_status: "skipped" };
      if (data.loan_data) {
        loanResult = await upsertLoan(property.id, unit?.id || null, data.loan_data, property.public_id);
      }

      // Auto-create context_property_assignment
      if (data.landlord_context_id) {
        const { error: assignError } = await supabaseAdmin
          .from("context_property_assignment")
          .insert({
            tenant_id: tenantId,
            context_id: data.landlord_context_id,
            property_id: property.id,
          });

        if (assignError) {
          console.error("Context assignment error (non-fatal):", assignError);
        } else {
          console.log(`Context assignment created: property ${property.id} → context ${data.landlord_context_id}`);
        }
      }

      // Audit
      await supabaseAdmin.from("audit_events").insert({
        actor_user_id: user.id,
        target_org_id: tenantId,
        event_type: "property.created",
        payload: {
          property_id: property.id,
          address: data.address,
          loan_status: loanResult.loan_status,
          annual_income: data.annual_income,
        },
      });

      console.log(`Property created: ${property.id} for tenant ${tenantId} | loan_status=${loanResult.loan_status}`);

      return new Response(
        JSON.stringify({
          property_id: property.id,
          public_id: property.public_id,
          unit_id: unit?.id,
          unit_public_id: unit?.public_id,
          loan_id: loanResult.loan_id || null,
          loan_status: loanResult.loan_status,
          loan_error: loanResult.loan_error || null,
          loan_input_debug: loanResult.loan_input_debug || null,
        }),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── LOAN-ONLY UPSERT — match existing property, create/update loan ──
    if (action === "loan-upsert") {
      const data = body.data;

      if (!data.address || !data.city) {
        return new Response(
          JSON.stringify({ error: "Address and city are required for matching" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Match by address + postal_code + city + tenant
      let query = supabaseAdmin
        .from("properties")
        .select("id, public_id, address, city")
        .eq("tenant_id", tenantId)
        .ilike("address", data.address)
        .ilike("city", data.city);

      if (data.postal_code) {
        query = query.eq("postal_code", data.postal_code);
      }

      const { data: matches, error: matchError } = await query;

      if (matchError || !matches || matches.length === 0) {
        return new Response(
          JSON.stringify({
            loan_status: "failed",
            loan_error: `No matching property found for ${data.address}, ${data.city}`,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const property = matches[0];

      // Get unit
      const { data: unit } = await supabaseAdmin
        .from("units")
        .select("id")
        .eq("property_id", property.id)
        .maybeSingle();

      // Delete existing IMPORT loans to avoid duplicates
      await supabaseAdmin
        .from("loans")
        .delete()
        .eq("property_id", property.id)
        .eq("tenant_id", tenantId)
        .like("loan_number", "IMPORT-%");

      let loanResult: { loan_status: string; loan_id?: string; loan_error?: string; loan_input_debug?: Record<string, unknown> } = { loan_status: "skipped" };
      if (data.loan_data) {
        loanResult = await upsertLoan(property.id, unit?.id || null, data.loan_data, property.public_id);
      }

      return new Response(
        JSON.stringify({
          property_id: property.id,
          public_id: property.public_id,
          matched: true,
          loan_id: loanResult.loan_id || null,
          loan_status: loanResult.loan_status,
          loan_error: loanResult.loan_error || null,
          loan_input_debug: loanResult.loan_input_debug || null,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── UPDATE Property ──
    if (action === "update") {
      const { property_id, loan_data, ...updates }: PropertyUpdate = body.data;

      if (!property_id) {
        return new Response(
          JSON.stringify({ error: "property_id is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: existing } = await supabaseUser
        .from("properties")
        .select("id")
        .eq("id", property_id)
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (!existing) {
        return new Response(
          JSON.stringify({ error: "Property not found or access denied" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: property, error: updateError } = await supabaseAdmin
        .from("properties")
        .update(updates)
        .eq("id", property_id)
        .eq("tenant_id", tenantId)
        .select("id, public_id, address, city, status")
        .single();

      if (updateError) {
        console.error("Property update error:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update property" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await supabaseAdmin.from("audit_events").insert({
        actor_user_id: user.id,
        target_org_id: tenantId,
        event_type: "property.updated",
        payload: { property_id, updates: Object.keys(updates) },
      });

      console.log(`Property updated: ${property_id}`);

      return new Response(
        JSON.stringify({ property }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── LIST Properties ──
    if (action === "list") {
      const { data: properties, error: listError } = await supabaseUser
        .from("properties")
        .select(`
          id, public_id, address, city, postal_code, 
          property_type, usage_type, status, 
          total_area_sqm, market_value, annual_income,
          created_at, updated_at
        `)
        .eq("tenant_id", tenantId)
        .order("created_at", { ascending: false });

      if (listError) {
        return new Response(
          JSON.stringify({ error: "Failed to list properties" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ properties, count: properties?.length || 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── GET Single Property ──
    if (action === "get") {
      const { property_id } = body;

      const { data: property, error: getError } = await supabaseUser
        .from("properties")
        .select(`
          *,
          units (id, public_id, unit_number, area_sqm, rooms, floor, status)
        `)
        .eq("id", property_id)
        .eq("tenant_id", tenantId)
        .maybeSingle();

      if (getError || !property) {
        return new Response(
          JSON.stringify({ error: "Property not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ property }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use: create, update, list, get, loan-upsert" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Property CRUD error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
