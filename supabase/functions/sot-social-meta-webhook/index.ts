import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  // Meta webhook verification (GET)
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    const VERIFY_TOKEN = Deno.env.get("META_VERIFY_TOKEN") || "kaufy_social_verify_2026";

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      return new Response(challenge, { status: 200, headers: corsHeaders });
    }
    return new Response("Forbidden", { status: 403, headers: corsHeaders });
  }

  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // POST — Leadgen event
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    console.log("Meta webhook payload:", JSON.stringify(body));

    // Process each entry
    const entries = body.entry || [];
    const results: any[] = [];

    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        if (change.field !== "leadgen") continue;

        const leadgenData = change.value || {};
        const { form_id, leadgen_id, page_id, ad_id, adgroup_id } = leadgenData;

        // Try to find mandate by form_id mapping
        // In production: look up publishing_meta->form_ids
        const { data: mandates } = await supabase
          .from("social_mandates")
          .select("id, tenant_id, partner_user_id")
          .eq("status", "live")
          .limit(1);

        const mandate = mandates?.[0];
        const tenantId = mandate?.tenant_id;

        if (!tenantId) {
          console.warn("No active mandate found for leadgen event");
          continue;
        }

        // Create lead
        const { data: lead, error: leadError } = await supabase
          .from("social_leads")
          .insert({
            tenant_id: tenantId,
            source: "meta_leadgen",
            mandate_id: mandate?.id || null,
            partner_user_id: mandate?.partner_user_id || null,
            platform: "facebook",
            meta_payload_raw: leadgenData,
            lead_data: {
              leadgen_id,
              form_id,
              page_id,
              ad_id,
              adgroup_id,
            },
            consent_flags: {},
            autoresponder_status: "not_sent",
            routed_to_zone2: !!mandate?.partner_user_id,
          })
          .select()
          .single();

        if (leadError) {
          console.error("Lead insert error:", leadError);
          continue;
        }

        // Create lead event
        await supabase.from("social_lead_events").insert({
          lead_id: lead.id,
          event_type: "webhook_received",
          payload: { raw: leadgenData, source: "meta_leadgen" },
        });

        if (mandate?.partner_user_id) {
          await supabase.from("social_lead_events").insert({
            lead_id: lead.id,
            event_type: "routed",
            payload: { partner_user_id: mandate.partner_user_id, mandate_id: mandate.id },
          });
        }

        results.push({ lead_id: lead.id, mandate_id: mandate?.id });
      }
    }

    return new Response(JSON.stringify({ success: true, processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("meta-webhook error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
