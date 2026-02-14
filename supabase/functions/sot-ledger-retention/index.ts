/**
 * sot-ledger-retention — Purges data_event_ledger rows older than retention period.
 * Auth: platform_admin OR X-Cron-Secret header matching CRON_SECRET env var.
 * Default retention: 180 days.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logDataEvent } from "../_shared/ledger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startMs = Date.now();

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const cronSecret = Deno.env.get("CRON_SECRET");

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    let actorId = "cron";
    let actorRole = "system";
    let isCronAuth = false;

    // Auth path 1: X-Cron-Secret header (for pg_cron automated calls)
    const reqCronSecret = req.headers.get("x-cron-secret");
    if (cronSecret && reqCronSecret === cronSecret) {
      isCronAuth = true;
    }

    // Auth path 2: Service-role key in Authorization (for pg_cron via net.http_post)
    const authHeader = req.headers.get("Authorization");
    const bearerToken = authHeader?.replace("Bearer ", "");
    if (!isCronAuth && bearerToken === serviceRoleKey) {
      isCronAuth = true;
    }

    if (!isCronAuth) {
      // Auth path 3: User auth (platform_admin)
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user }, error: authError } = await userClient.auth.getUser();
      if (authError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: isAdmin } = await adminClient.rpc("is_platform_admin", { _user_id: user.id });
      if (!isAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden: platform_admin required" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      actorId = user.id;
      actorRole = "platform_admin";
    }

    // Parse body
    const body = await req.json().catch(() => ({}));
    const retentionDays = body.retention_days || 180;
    const correlationId = body.correlation_id || crypto.randomUUID();

    // Execute retention delete
    const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();

    const { data: countResult } = await adminClient
      .from("data_event_ledger")
      .select("id", { count: "exact", head: true })
      .lt("created_at", cutoffDate);

    const { error: deleteError } = await adminClient
      .from("data_event_ledger")
      .delete()
      .lt("created_at", cutoffDate);

    if (deleteError) {
      throw new Error(`Delete failed: ${deleteError.message}`);
    }

    // Get oldest remaining
    const { data: oldest } = await adminClient
      .from("data_event_ledger")
      .select("created_at")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    const durationMs = Date.now() - startMs;
    const deletedCount = countResult?.length ?? 0;

    // Log the purge event
    await logDataEvent(adminClient, {
      zone: "Z1",
      actor_user_id: actorId,
      actor_role: actorRole,
      event_type: "data.purge.executed",
      direction: "delete",
      source: isCronAuth ? "cron" : "manual",
      payload: {
        reason: "retention",
        correlation_id: correlationId,
        deleted_count: deletedCount,
        oldest_remaining: oldest?.created_at || null,
        retention_days: retentionDays,
        duration_ms: durationMs,
      },
    }, req);

    return new Response(JSON.stringify({
      success: true,
      deleted_count: deletedCount,
      retention_days: retentionDays,
      cutoff_date: cutoffDate,
      oldest_remaining: oldest?.created_at || null,
      duration_ms: durationMs,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
