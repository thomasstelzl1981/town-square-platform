import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

/**
 * SOT Cloud Sync — P2.3/P2.4 (Scaffold)
 * 
 * Manages OAuth connections and file sync for:
 * - Google Drive (P2.3)
 * - Dropbox / OneDrive (P2.4)
 * 
 * Endpoints:
 *   POST /init    → Start OAuth flow (returns redirect URL)
 *   POST /callback → Handle OAuth callback (exchange code for tokens)
 *   POST /sync    → Trigger file sync for a connector
 *   GET  /status  → Get connector status
 * 
 * Cost: 1 Credit per synced file
 */

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
    const url = new URL(req.url);
    const body = req.method === "POST" ? await req.json() : {};
    const action = body.action || url.searchParams.get("action") || "status";

    switch (action) {
      case "status": {
        // List all connectors for tenant
        const { data: connectors } = await sbAdmin
          .from("cloud_sync_connectors")
          .select("*")
          .eq("tenant_id", tenantId);
        return json({ connectors: connectors || [] });
      }

      case "init": {
        const { provider } = body;
        if (!provider || !["google_drive", "dropbox", "onedrive"].includes(provider)) {
          return json({ error: "Invalid provider. Must be: google_drive, dropbox, onedrive" }, 400);
        }

        // Scaffold: OAuth URLs would be constructed here
        // For now, return placeholder indicating external setup needed
        const oauthUrls: Record<string, string> = {
          google_drive: "https://accounts.google.com/o/oauth2/v2/auth",
          dropbox: "https://www.dropbox.com/oauth2/authorize",
          onedrive: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
        };

        return json({
          status: "scaffold",
          message: `Cloud-Sync für ${provider} ist vorbereitet. OAuth2-Konfiguration erforderlich.`,
          provider,
          oauth_endpoint: oauthUrls[provider],
          required_secrets: [
            `${provider.toUpperCase()}_CLIENT_ID`,
            `${provider.toUpperCase()}_CLIENT_SECRET`,
          ],
          redirect_uri: `${supabaseUrl}/functions/v1/sot-cloud-sync?action=callback&provider=${provider}`,
        });
      }

      case "callback": {
        // Scaffold: Exchange auth code for tokens
        return json({
          status: "scaffold",
          message: "OAuth callback handler prepared. Awaiting client credentials configuration.",
        });
      }

      case "sync": {
        const { connectorId } = body;
        if (!connectorId) return json({ error: "Missing connectorId" }, 400);

        const { data: connector } = await sbAdmin
          .from("cloud_sync_connectors")
          .select("*")
          .eq("id", connectorId)
          .eq("tenant_id", tenantId)
          .single();

        if (!connector) return json({ error: "Connector not found" }, 404);
        if (connector.status !== "connected") {
          return json({ error: "Connector not connected. Please complete OAuth setup first." }, 400);
        }

        // Scaffold: File listing + download + extraction pipeline
        return json({
          status: "scaffold",
          message: `Sync für ${connector.provider} ist vorbereitet. Implementierung folgt nach OAuth-Setup.`,
          connector_id: connectorId,
          provider: connector.provider,
        });
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    console.error("[sot-cloud-sync] Error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
