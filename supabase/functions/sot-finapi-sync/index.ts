import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

/**
 * SOT FinAPI Sync — P2.5 (Scaffold)
 * 
 * PSD2 Bank-Connect via FinAPI:
 *   POST /connect   → Initiate bank connection
 *   POST /sync      → Sync transactions for a connection
 *   POST /match     → Auto-match transactions to contracts
 *   GET  /status    → Get connection status
 * 
 * Cost: 4 Credits per account sync, 2 Credits per auto-match batch
 */

const SYNC_CREDITS = 4;
const MATCH_CREDITS = 2;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleCorsPreflightRequest(req);

  const corsHeaders = getCorsHeaders(req);
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    const sbUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: ue } = await sbUser.auth.getUser();
    if (ue || !user) return json({ error: "Invalid user" }, 401);

    const { data: profile } = await sbUser
      .from("profiles")
      .select("active_tenant_id")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile?.active_tenant_id) return json({ error: "No active tenant" }, 400);
    const tenantId = profile.active_tenant_id;

    const sbAdmin = createClient(supabaseUrl, serviceKey);
    const body = req.method === "POST" ? await req.json() : {};
    const action = body.action || "status";

    switch (action) {
      case "status": {
        const { data: connections } = await sbAdmin
          .from("finapi_connections")
          .select("*")
          .eq("tenant_id", tenantId);
        return json({ connections: connections || [] });
      }

      case "connect": {
        // Scaffold: FinAPI bank connection flow
        return json({
          status: "scaffold",
          message: "FinAPI Bank-Connect ist vorbereitet. FinAPI API-Credentials erforderlich.",
          required_secrets: ["FINAPI_CLIENT_ID", "FINAPI_CLIENT_SECRET"],
          required_license: "§34f GewO (Finanzanlagenvermittlung)",
          cost_per_sync: `${SYNC_CREDITS} Credits (${SYNC_CREDITS * 0.25}€)`,
          documentation: "https://docs.finapi.io/",
        });
      }

      case "sync": {
        const { connectionId } = body;
        if (!connectionId) return json({ error: "Missing connectionId" }, 400);

        // Credit preflight
        const { data: preflight } = await sbAdmin.rpc("rpc_credit_preflight", {
          p_tenant_id: tenantId,
          p_required_credits: SYNC_CREDITS,
          p_action_code: "finapi_sync",
        });
        if (!preflight?.allowed) {
          return json({ error: "Insufficient credits", required: SYNC_CREDITS }, 402);
        }

        return json({
          status: "scaffold",
          message: "Transaction-Sync vorbereitet. Awaiting FinAPI credentials.",
          connection_id: connectionId,
          credits_required: SYNC_CREDITS,
        });
      }

      case "match": {
        // Auto-match transactions to contracts
        const { connectionId } = body;
        if (!connectionId) return json({ error: "Missing connectionId" }, 400);

        // Credit preflight for matching
        const { data: preflight } = await sbAdmin.rpc("rpc_credit_preflight", {
          p_tenant_id: tenantId,
          p_required_credits: MATCH_CREDITS,
          p_action_code: "auto_matching",
        });
        if (!preflight?.allowed) {
          return json({ error: "Insufficient credits", required: MATCH_CREDITS }, 402);
        }

        return json({
          status: "scaffold",
          message: "Auto-Matching (Doc→Vertrag) vorbereitet. 2 Credits pro Match-Batch.",
          connection_id: connectionId,
          credits_required: MATCH_CREDITS,
        });
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    console.error("[sot-finapi-sync] Error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
