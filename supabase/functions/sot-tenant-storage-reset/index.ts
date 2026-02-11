import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logDataEvent } from "../_shared/ledger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Gate 1: Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify caller
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Gate 2: platform_admin check
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: isAdmin } = await adminClient.rpc("is_platform_admin", { _user_id: user.id });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden: platform_admin required" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Parse body
    const body = await req.json();
    const { tenant_id, confirm } = body;
    if (!tenant_id || !confirm) {
      return new Response(JSON.stringify({ error: "Bad Request: tenant_id and confirm required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Gate 3: tenant_mode = 'sandbox'
    const { data: org } = await adminClient.from("organizations").select("tenant_mode").eq("id", tenant_id).single();
    if (!org || org.tenant_mode !== "sandbox") {
      return new Response(JSON.stringify({ error: "Forbidden: only sandbox tenants can be reset" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Delete storage blobs
    const buckets = ["tenant-documents", "project-documents", "social-assets"];
    const results: Record<string, number> = {};

    for (const bucket of buckets) {
      try {
        const { data: files } = await adminClient.storage.from(bucket).list(`${tenant_id}/`, { limit: 1000 });
        if (files && files.length > 0) {
          const paths = files.map((f) => `${tenant_id}/${f.name}`);
          await adminClient.storage.from(bucket).remove(paths);
          results[bucket] = paths.length;
        } else {
          results[bucket] = 0;
        }
      } catch {
        results[bucket + "_error"] = -1;
      }
    }

    // acq-documents: lookup mandate IDs
    try {
      const { data: mandates } = await adminClient.from("acq_mandates").select("id").eq("tenant_id", tenant_id);
      if (mandates && mandates.length > 0) {
        let acqCount = 0;
        for (const m of mandates) {
          const { data: files } = await adminClient.storage.from("acq-documents").list(`${m.id}/`, { limit: 1000 });
          if (files && files.length > 0) {
            const paths = files.map((f) => `${m.id}/${f.name}`);
            await adminClient.storage.from("acq-documents").remove(paths);
            acqCount += paths.length;
          }
        }
        results["acq-documents"] = acqCount;
      }
    } catch {
      results["acq-documents_error"] = -1;
    }

    // DSGVO Ledger: storage reset completed
    await logDataEvent(adminClient, {
      tenant_id: tenant_id,
      zone: "Z1",
      actor_user_id: user.id,
      actor_role: "platform_admin",
      event_type: "tenant.reset.completed",
      direction: "delete",
      source: "system",
      entity_type: "tenant",
      payload: {
        tenant_id,
        reason: "storage_reset",
        correlation_id: crypto.randomUUID(),
        storage_deleted: results,
        duration_ms: 0,
      },
    }, req);

    return new Response(JSON.stringify({ success: true, deleted: results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
