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
  entries?: RegistryEntry[];
  category_code: string;
  // BaFin CSV mode: raw CSV string instead of parsed entries
  csv_content?: string;
  csv_delimiter?: string;
}

// ── BaFin CSV Parser ──
// BaFin CSV format (semicolon-delimited):
// Lfd.Nr;BaFin-ID;Bezeichnung;Art;Sitz/Niederlassung;PLZ;Land

function parseBafinCsv(csvContent: string, delimiter = ";"): RegistryEntry[] {
  const lines = csvContent.split("\n").map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return []; // Need header + at least one row

  const header = lines[0].split(delimiter).map(h => h.trim().toLowerCase());

  // Find column indices by common BaFin header names
  const nameIdx = header.findIndex(h => h.includes("bezeichnung") || h.includes("name") || h.includes("institut"));
  const idIdx = header.findIndex(h => h.includes("bafin-id") || h.includes("bafin_id") || h.includes("lfd"));
  const typeIdx = header.findIndex(h => h.includes("art") || h.includes("rechtsform") || h.includes("typ"));
  const cityIdx = header.findIndex(h => h.includes("sitz") || h.includes("niederlassung") || h.includes("ort") || h.includes("city"));
  const plzIdx = header.findIndex(h => h.includes("plz") || h.includes("postal"));
  const countryIdx = header.findIndex(h => h.includes("land") || h.includes("country"));

  if (nameIdx === -1) {
    console.error("BaFin CSV: Could not find name column. Headers:", header);
    return [];
  }

  const entries: RegistryEntry[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(delimiter).map(c => c.trim());
    
    const name = cols[nameIdx];
    if (!name) continue;

    // Skip non-German entries if country column exists
    if (countryIdx >= 0) {
      const country = cols[countryIdx]?.toLowerCase();
      if (country && country !== "de" && country !== "deutschland" && country !== "germany") continue;
    }

    entries.push({
      name,
      city: cityIdx >= 0 ? cols[cityIdx] || undefined : undefined,
      postal_code: plzIdx >= 0 ? cols[plzIdx] || undefined : undefined,
      legal_form: typeIdx >= 0 ? cols[typeIdx] || undefined : undefined,
      registry_id: idIdx >= 0 ? cols[idIdx] || undefined : undefined,
      registry_type: "bafin_register",
    });
  }

  console.log(`BaFin CSV parsed: ${entries.length} entries from ${lines.length - 1} rows`);
  return entries;
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
    const { source, tenant_id, category_code, csv_delimiter } = body;
    let { entries } = body;

    if (!source || !tenant_id || !category_code) {
      return new Response(
        JSON.stringify({ error: "source, tenant_id, and category_code required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── BaFin CSV mode: parse CSV content into entries ──
    if (body.csv_content && source === "bafin_register") {
      entries = parseBafinCsv(body.csv_content, csv_delimiter || ";");
      if (entries.length === 0) {
        return new Response(
          JSON.stringify({ error: "CSV parsing produced 0 valid entries. Check format (semicolon-delimited, must have 'Bezeichnung' column)" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (!entries || !Array.isArray(entries) || entries.length === 0) {
      return new Response(
        JSON.stringify({ error: "entries[] required (or csv_content for BaFin)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (entries.length > 1000) {
      return new Response(
        JSON.stringify({ error: "Max 1000 entries per import batch" }),
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
          .ilike("company", entry.name)
          .eq("city", entry.city || "")
          .limit(1);

        if (existing && existing.length > 0) {
          skippedDuplicates++;
          continue;
        }

        // Generate a public_id for the contact
        const publicId = `REG-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        // Insert contact — contacts table uses 'company' not 'company_name',
        // 'street' not 'address_line', and requires first_name, last_name, public_id
        const { data: newContact, error: insertErr } = await supabaseAdmin
          .from("contacts")
          .insert({
            tenant_id,
            company: entry.name,
            first_name: "",  // Required field — empty for company-only imports
            last_name: entry.name, // Use company name as last_name for display
            city: entry.city || null,
            postal_code: entry.postal_code || null,
            street: entry.address || null,
            category: category_code,
            quality_status: "candidate",
            confidence_score: 30,
            public_id: publicId,
            synced_from: source,
            notes: [
              entry.registry_id ? `Registry-ID: ${entry.registry_id}` : null,
              entry.legal_form ? `Rechtsform: ${entry.legal_form}` : null,
              entry.erlaubnis_typ ? `Erlaubnis: ${entry.erlaubnis_typ}` : null,
            ].filter(Boolean).join(', ') || null,
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
