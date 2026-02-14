import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const { action } = body;

    // ── ACTION: ingest ──
    // Bridge script pushes measurements here
    if (action === "ingest") {
      const { connector_id, pv_plant_id, tenant_id, current_power_w, energy_today_kwh, energy_month_kwh, source } = body;

      if (!pv_plant_id || current_power_w === undefined) {
        return new Response(JSON.stringify({ error: "pv_plant_id and current_power_w required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Insert measurement
      const { error: insertErr } = await supabase.from("pv_measurements").insert({
        pv_plant_id,
        tenant_id: tenant_id || null,
        current_power_w: Math.round(current_power_w),
        energy_today_kwh: energy_today_kwh ?? null,
        energy_month_kwh: energy_month_kwh ?? null,
        source: source || "sma_webconnect",
      });

      if (insertErr) {
        console.error("Insert measurement error:", insertErr);
        return new Response(JSON.stringify({ error: insertErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Update connector status
      if (connector_id) {
        await supabase
          .from("pv_connectors")
          .update({ status: "connected", last_sync_at: new Date().toISOString(), last_error: null })
          .eq("id", connector_id);
      }

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── ACTION: status ──
    // Update connector status (connected/offline/error)
    if (action === "status") {
      const { connector_id, status, last_error } = body;
      if (!connector_id || !status) {
        return new Response(JSON.stringify({ error: "connector_id and status required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const updates: Record<string, unknown> = { status };
      if (last_error !== undefined) updates.last_error = last_error;
      if (status === "connected") updates.last_sync_at = new Date().toISOString();

      const { error } = await supabase.from("pv_connectors").update(updates).eq("id", connector_id);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── ACTION: test ──
    // Health check endpoint
    if (action === "test") {
      return new Response(JSON.stringify({ ok: true, message: "PV Connector Bridge is running" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("PV Connector Bridge error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
