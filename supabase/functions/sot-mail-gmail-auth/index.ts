/**
 * SOT-MAIL-GMAIL-AUTH Edge Function
 *
 * Dedicated Gmail OAuth flow — analogous to sot-cloud-sync for Google Drive.
 * Reuses the same Google Cloud credentials (GOOGLE_DRIVE_CLIENT_ID / GOOGLE_DRIVE_CLIENT_SECRET).
 *
 * Actions:
 *   POST init     → Build Google OAuth URL with Gmail scopes, return { authUrl }
 *   GET  callback → Exchange auth code for tokens, upsert mail_accounts, close popup
 *   POST refresh  → Refresh an expired access token
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/calendar",
  "https://www.googleapis.com/auth/contacts.readonly",
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
].join(" ");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const clientId = Deno.env.get("GOOGLE_DRIVE_CLIENT_ID");
  const clientSecret = Deno.env.get("GOOGLE_DRIVE_CLIENT_SECRET");

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  /** HTML page that posts a message to the opener and closes the popup. */
  const popupResultHtml = (success: boolean, errorMsg?: string) => {
    const messageObj = success
      ? { type: "gmail_auth_result", success: true }
      : { type: "gmail_auth_result", success: false, error: errorMsg || "unknown" };
    const messageJson = JSON.stringify(JSON.stringify(messageObj));
    const bodyText = success
      ? "Verbunden! Dieses Fenster schließt sich automatisch..."
      : `Fehler: ${errorMsg || "Unbekannt"}`;
    return new Response(
      `<!DOCTYPE html><html><head><title>Gmail Auth</title></head><body>
<script>
  if (window.opener) {
    window.opener.postMessage(${messageJson}, "*");
    window.close();
  } else {
    window.close();
  }
</script>
<p>${bodyText}</p>
</body></html>`,
      { status: 200, headers: { ...corsHeaders, "Content-Type": "text/html" } }
    );
  };

  try {
    const url = new URL(req.url);
    const sbAdmin = createClient(supabaseUrl, serviceKey);

    // Determine action
    let action: string;
    let body: Record<string, unknown> = {};

    if (req.method === "GET") {
      action = url.searchParams.get("action") || "callback";
    } else {
      body = await req.json().catch(() => ({}));
      action = (body.action as string) || "init";
    }

    const redirectUri = `${supabaseUrl}/functions/v1/sot-mail-gmail-auth?action=callback`;

    // ── CALLBACK — from Google redirect, no auth needed ──
    if (action === "callback") {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const error = url.searchParams.get("error");

      if (error) {
        console.error("[gmail-auth] OAuth error:", error);
        return popupResultHtml(false, error);
      }

      if (!code || !state || !clientId || !clientSecret) {
        return popupResultHtml(false, "missing_params");
      }

      // Decode state
      let stateData: { userId: string; tenantId: string };
      try {
        stateData = JSON.parse(atob(state));
      } catch {
        return popupResultHtml(false, "invalid_state");
      }

      // Exchange code for tokens
      const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.access_token) {
        console.error("[gmail-auth] Token exchange failed:", tokenData);
        return popupResultHtml(false, "token_exchange_failed");
      }

      // Get user info
      const userInfoRes = await fetch(GOOGLE_USERINFO_URL, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const userInfo = await userInfoRes.json();

      const expiresAt = new Date(
        Date.now() + (tokenData.expires_in || 3600) * 1000
      ).toISOString();

      // Upsert mail_accounts — use user_id + provider + email as conflict key
      // First check if account already exists
      const { data: existing } = await sbAdmin
        .from("mail_accounts")
        .select("id")
        .eq("user_id", stateData.userId)
        .eq("provider", "google")
        .eq("email_address", userInfo.email)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error: updateErr } = await sbAdmin
          .from("mail_accounts")
          .update({
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token || undefined,
            token_expires_at: expiresAt,
            display_name: userInfo.name || userInfo.email,
            sync_status: "connected",
            sync_error: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (updateErr) {
          console.error("[gmail-auth] Update error:", updateErr);
          return popupResultHtml(false, "db_error");
        }
      } else {
        // Insert new
        const { error: insertErr } = await sbAdmin
          .from("mail_accounts")
          .insert({
            user_id: stateData.userId,
            tenant_id: stateData.tenantId,
            provider: "google",
            email_address: userInfo.email,
            display_name: userInfo.name || userInfo.email,
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token || null,
            token_expires_at: expiresAt,
            sync_status: "connected",
          });

        if (insertErr) {
          console.error("[gmail-auth] Insert error:", insertErr);
          return popupResultHtml(false, "db_error");
        }
      }

      console.log(`[gmail-auth] Successfully connected Gmail for ${userInfo.email}`);
      return popupResultHtml(true);
    }

    // ── All other actions require auth ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing authorization" }, 401);
    }

    const sbUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: ue,
    } = await sbUser.auth.getUser();
    if (ue || !user) return json({ error: "Invalid user" }, 401);

    // Get tenant
    const { data: profile } = await sbUser
      .from("profiles")
      .select("active_tenant_id")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile?.active_tenant_id) return json({ error: "No active tenant" }, 400);
    const tenantId = profile.active_tenant_id;

    switch (action) {
      // ── INIT — Start OAuth flow ──
      case "init": {
        if (!clientId || !clientSecret) {
          return json(
            {
              error:
                "Gmail OAuth nicht konfiguriert. GOOGLE_DRIVE_CLIENT_ID und GOOGLE_DRIVE_CLIENT_SECRET fehlen.",
            },
            500
          );
        }

        const state = btoa(JSON.stringify({ userId: user.id, tenantId }));

        const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
        authUrl.searchParams.set("client_id", clientId);
        authUrl.searchParams.set("redirect_uri", redirectUri);
        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set("scope", GMAIL_SCOPES);
        authUrl.searchParams.set("access_type", "offline");
        authUrl.searchParams.set("prompt", "consent");
        authUrl.searchParams.set("state", state);

        return json({ authUrl: authUrl.toString() });
      }

      // ── REFRESH — Refresh expired token ──
      case "refresh": {
        const accountId = body.accountId as string;
        if (!accountId) return json({ error: "Missing accountId" }, 400);

        const { data: account } = await sbAdmin
          .from("mail_accounts")
          .select("id, user_id, provider, email_address, refresh_token, access_token, token_expires_at")
          .eq("id", accountId)
          .eq("user_id", user.id)
          .single();

        if (!account) return json({ error: "Account not found" }, 404);
        if (!account.refresh_token) {
          return json({ error: "No refresh token — reconnect required" }, 400);
        }

        const res = await fetch(GOOGLE_TOKEN_URL, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: clientId!,
            client_secret: clientSecret!,
            refresh_token: account.refresh_token,
            grant_type: "refresh_token",
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.access_token) {
          return json({ error: "Token refresh failed" }, 500);
        }

        const newExpiry = new Date(
          Date.now() + (data.expires_in || 3600) * 1000
        ).toISOString();

        await sbAdmin
          .from("mail_accounts")
          .update({
            access_token: data.access_token,
            token_expires_at: newExpiry,
            sync_status: "connected",
            sync_error: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", accountId);

        return json({ success: true, access_token: data.access_token });
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    console.error("[sot-mail-gmail-auth] Error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
