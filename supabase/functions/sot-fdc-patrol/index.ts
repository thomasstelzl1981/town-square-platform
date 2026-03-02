import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logDataEvent } from "../_shared/ledger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * sot-fdc-patrol — Finance Data Controller Patrol
 *
 * Runs structural integrity checks per tenant.
 * Upserts repair actions idempotently (unique open constraint).
 * NOT scheduled by default — call manually or schedule later.
 */
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all tenants with finance data
    const { data: tenants, error: tenantErr } = await supabaseAdmin
      .from("finance_data_registry")
      .select("tenant_id")
      .limit(1000);

    if (tenantErr) throw tenantErr;

    const uniqueTenants = [...new Set((tenants || []).map((t: any) => t.tenant_id))];
    const results: { tenant_id: string; actions_created: number; errors: string[] }[] = [];

    for (const tenantId of uniqueTenants) {
      const tenantResult = { tenant_id: tenantId, actions_created: 0, errors: [] as string[] };

      try {
        // Load registry for this tenant
        const { data: registry } = await supabaseAdmin
          .from("finance_data_registry")
          .select("*")
          .eq("tenant_id", tenantId)
          .eq("status", "active");

        const { data: links } = await supabaseAdmin
          .from("finance_entity_links")
          .select("*")
          .eq("tenant_id", tenantId);

        const reg = registry || [];
        const lnk = links || [];

        // Simple structural checks (subset of full engine — no SSOT snapshot needed)
        const actionsToInsert: any[] = [];

        // Rule: accounts without owner
        for (const r of reg.filter((r: any) => r.entity_type === "account" && !r.owner_person_id)) {
          actionsToInsert.push({
            tenant_id: tenantId,
            severity: "warn",
            code: "ACCOUNT_OWNER_MISSING",
            scope_key: "",
            entity_type: "account",
            entity_id: r.entity_id,
            message: "Einem Bankkonto ist kein Inhaber zugeordnet.",
            status: "open",
            owner_role: "user",
          });
        }

        // Rule: contracts without owner
        for (const r of reg.filter((r: any) =>
          ["insurance_sach", "insurance_kv", "vorsorge"].includes(r.entity_type) && !r.owner_person_id
        )) {
          actionsToInsert.push({
            tenant_id: tenantId,
            severity: "warn",
            code: "CONTRACT_OWNER_MISSING",
            scope_key: "",
            entity_type: r.entity_type,
            entity_id: r.entity_id,
            message: "Einem Vertrag ist kein Inhaber zugeordnet.",
            status: "open",
            owner_role: "user",
          });
        }

        // Rule: mortgages without property
        for (const r of reg.filter((r: any) => r.entity_type === "mortgage" && !r.linked_property_id)) {
          actionsToInsert.push({
            tenant_id: tenantId,
            severity: "warn",
            code: "LOAN_PROPERTY_LINK_MISSING",
            scope_key: "",
            entity_type: "mortgage",
            entity_id: r.entity_id,
            message: "Ein Immobiliendarlehen ist keiner Immobilie zugeordnet.",
            status: "open",
            owner_role: "user",
          });
        }

        // Idempotent upsert (unique constraint handles dedup)
        for (const action of actionsToInsert) {
          const { error: insertErr } = await supabaseAdmin
            .from("finance_repair_actions")
            .insert(action);

          // 23505 = unique_violation → already exists, skip
          if (insertErr && !insertErr.message?.includes("23505")) {
            tenantResult.errors.push(insertErr.message);
          } else if (!insertErr) {
            tenantResult.actions_created++;
          }
        }
      } catch (err: any) {
        tenantResult.errors.push(err.message || "Unknown error");
      }

      results.push(tenantResult);
    }

    // Log patrol run
    await logDataEvent(supabaseAdmin, {
      zone: "Z2",
      event_type: "finance.patrol.completed",
      direction: "mutate",
      source: "cron:sot-fdc-patrol",
      payload: {
        tenants_processed: uniqueTenants.length,
        total_actions: results.reduce((s, r) => s + r.actions_created, 0),
      },
    }, req);

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("[FDC-PATROL] Fatal error:", err);
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
