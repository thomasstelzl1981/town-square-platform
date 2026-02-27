import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LoanData {
  bank_name?: string | null;
  outstanding_balance_eur?: number | null;
  annuity_monthly_eur?: number | null;
  fixed_interest_end_date?: string | null;
  interest_rate_percent?: number | null;
  original_amount?: number | null;
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

    // CREATE Property
    if (action === "create") {
      const data: PropertyCreate = body.data;
      
      if (!data.address || !data.city) {
        return new Response(
          JSON.stringify({ error: "Address and city are required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Insert property (trigger will create default unit)
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

      // Set landlord_context_id if provided
      if (data.landlord_context_id) {
        insertData.landlord_context_id = data.landlord_context_id;
      }

      // Add annual_income if provided
      if (data.annual_income != null) {
        insertData.annual_income = data.annual_income;
      }

      // Handle multi-unit
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

      // Create loan if loan_data is provided (relaxed condition: any loan field triggers creation)
      let loanId: string | null = null;
      if (data.loan_data && (
        data.loan_data.bank_name || 
        data.loan_data.outstanding_balance_eur || 
        data.loan_data.annuity_monthly_eur ||
        data.loan_data.interest_rate_percent ||
        data.loan_data.original_amount
      )) {
        const loanInsert: Record<string, unknown> = {
          tenant_id: tenantId,
          property_id: property.id,
          unit_id: unit?.id || null,
          bank_name: data.loan_data.bank_name || "Unbekannt",
          loan_number: `IMPORT-${property.public_id || property.id.slice(0, 8)}`,
          scope: "PROPERTY",
          outstanding_balance_eur: data.loan_data.outstanding_balance_eur,
          annuity_monthly_eur: data.loan_data.annuity_monthly_eur,
          fixed_interest_end_date: data.loan_data.fixed_interest_end_date,
          interest_rate_percent: data.loan_data.interest_rate_percent,
          original_amount: data.loan_data.original_amount,
        };

        const { data: loan, error: loanError } = await supabaseAdmin
          .from("loans")
          .insert(loanInsert)
          .select("id")
          .single();

        if (loanError) {
          console.error("Loan create error (non-fatal):", loanError);
        } else {
          loanId = loan.id;
          console.log(`Loan created: ${loan.id} for property ${property.id}`);
        }
      }

      // Auto-create context_property_assignment if landlord_context_id provided
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

      // Log audit event
      await supabaseAdmin.from("audit_events").insert({
        actor_user_id: user.id,
        target_org_id: tenantId,
        event_type: "property.created",
        payload: {
          property_id: property.id,
          address: data.address,
          loan_created: !!loanId,
          annual_income: data.annual_income,
        },
      });

      console.log(`Property created: ${property.id} for tenant ${tenantId}${loanId ? ` with loan ${loanId}` : ""}`);

      return new Response(
        JSON.stringify({
          property_id: property.id,
          public_id: property.public_id,
          unit_id: unit?.id,
          unit_public_id: unit?.public_id,
          loan_id: loanId,
        }),
        { status: 201, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // UPDATE Property
    if (action === "update") {
      const { property_id, loan_data, ...updates }: PropertyUpdate = body.data;

      if (!property_id) {
        return new Response(
          JSON.stringify({ error: "property_id is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Verify ownership via RLS
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

    // LIST Properties
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

    // GET Single Property
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
      JSON.stringify({ error: "Invalid action. Use: create, update, list, get" }),
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
