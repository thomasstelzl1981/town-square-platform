import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logDataEvent } from "../_shared/ledger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Types ──

interface RegistryEntry {
  name: string;
  city?: string;
  postal_code?: string;
  legal_form?: string;
  registry_id?: string;
  registry_type?: string;
  erlaubnis_typ?: string;
  address?: string;
}

interface ImportRequest {
  source: "bafin_register" | "ihk_register";
  tenant_id: string;
  entries: RegistryEntry[];
  category_code: string;
}

// ── Strategy mapping ──

const STRATEGY_MAP: Record<string, string> = {
  bank_retail: "BANK_BAFIN",
  bank_private: "BANK_BAFIN",
  insurance_broker_34d: "IHK_REGISTER",
  financial_broker_34f: "IHK_REGISTER",
  fee_advisor_34h: "IHK_REGISTER",
  mortgage_broker_34i: "IHK_REGISTER",
  loan_broker: "IHK_REGISTER",
};

// ── Pending steps per strategy ──

function getPendingSteps(strategyCode: string): Record<string, unknown>[] {
  if (strategyCode === "BANK_BAFIN") {
    return [
      { step: "google_enrich", provider: "google_places", purpose: "enrichment", estimatedCostEur: 0.003 },
      { step: "web_scrape", provider: "firecrawl", purpose: "verification", estimatedCostEur: 0.005 },
    ];
  }
  if (strategyCode === "IHK_REGISTER") {
    return [
      { step: "google_verify", provider: "google_places", purpose: "enrichment", estimatedCostEur: 0.003 },
      { step: "web_scrape", provider: "firecrawl", purpose: "verification", estimatedCostEur: 0.005 },
    ];
  }
  return [];
}

// ── Main handler ──

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: ImportRequest = await req.json();
    const { source, tenant_id, entries, category_code } = body;

    if (!source || !tenant_id || !entries || !Array.isArray(entries) || !category_code) {
      return new Response(
        JSON.stringify({ error: "source, tenant_id, category_code, and entries[] required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (entries.length > 500) {
      return new Response(
        JSON.stringify({ error: "Max 500 entries per import batch" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const strategyCode = STRATEGY_MAP[category_code] || "GOOGLE_FIRECRAWL";
    const pendingSteps = getPendingSteps(strategyCode);

    let imported = 0;
    let skippedDuplicates = 0;
    let errors = 0;
    const importedIds: string[] = [];

    for (const entry of entries) {
      try {
        // Check for duplicates by name + city
        const { data: existing } = await supabaseAdmin
          .from("contacts")
          .select("id")
          .eq("tenant_id", tenant_id)
          .ilike("company_name", entry.name)
          .eq("city", entry.city || "")
          .limit(1);

        if (existing && existing.length > 0) {
          skippedDuplicates++;
          continue;
        }

        // Insert contact
        const { data: newContact, error: insertErr } = await supabaseAdmin
          .from("contacts")
          .insert({
            tenant_id,
            company_name: entry.name,
            city: entry.city || null,
            postal_code: entry.postal_code || null,
            address_line: entry.address || null,
            source: source,
            category: category_code,
            quality_status: "candidate",
            confidence_score: 30,
            source_refs: {
              registry_id: entry.registry_id,
              registry_type: entry.registry_type || source,
              erlaubnis_typ: entry.erlaubnis_typ,
              legal_form: entry.legal_form,
            },
          })
          .select("id")
          .single();

        if (insertErr || !newContact) {
          console.error("Insert error:", insertErr);
          errors++;
          continue;
        }

        // Create strategy ledger entry with discovery step already completed
        const discoveryStep = {
          step: source === "bafin_register" ? "bafin_import" : "ihk_scrape",
          provider: source === "bafin_register" ? "bafin_csv" : "ihk_register",
          executedAt: new Date().toISOString(),
          costEur: source === "bafin_register" ? 0 : 0.02,
          fieldsFound: ["name", "city", entry.postal_code ? "postal_code" : null, entry.registry_id ? "registry_id" : null].filter(Boolean),
          fieldsMissing: ["email", "phone", "website"],
          rawConfidence: 30,
          notes: `Imported from ${source}`,
        };

        await supabaseAdmin.from("contact_strategy_ledger").insert({
          contact_id: newContact.id,
          tenant_id,
          category_code,
          strategy_code: strategyCode,
          steps_completed: [discoveryStep],
          steps_pending: pendingSteps,
          data_gaps: ["email", "phone", "website"],
          total_cost_eur: discoveryStep.costEur,
          quality_score: 30,
          last_step_at: new Date().toISOString(),
        });

        importedIds.push(newContact.id);
        imported++;
      } catch (err) {
        console.error("Entry processing error:", err);
        errors++;
      }
    }

    // Log to data event ledger
    await logDataEvent(supabaseAdmin, {
      tenant_id,
      zone: "Z1",
      event_type: "registry_import",
      direction: "ingress",
      source: `sot-registry-import/${source}`,
      entity_type: "contact",
      payload: {
        source,
        category_code,
        total_entries: entries.length,
        imported,
        skipped_duplicates: skippedDuplicates,
        errors,
      },
    }, req);

    return new Response(
      JSON.stringify({
        success: true,
        source,
        category_code,
        strategy_code: strategyCode,
        total_entries: entries.length,
        imported,
        skipped_duplicates: skippedDuplicates,
        errors,
        imported_contact_ids: importedIds,
        next_action: imported > 0
          ? `${imported} Kontakte importiert. Nächster Schritt: Enrichment via ${pendingSteps[0]?.provider || 'manual'}`
          : "Keine neuen Kontakte importiert.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Registry import error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
