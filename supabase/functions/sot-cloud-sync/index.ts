import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

/**
 * SOT Cloud Sync — Google Drive Integration
 *
 * Actions:
 *   POST init       → Build Google OAuth URL, return redirect
 *   GET  callback   → Exchange auth code for tokens, store in DB, redirect to app
 *   POST folders    → List Google Drive folders for picker
 *   POST sync       → Delta-sync files from Drive folder into DMS
 *   POST disconnect → Revoke tokens + delete connector
 *   GET  status     → List connectors for tenant
 */

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_DRIVE_API = "https://www.googleapis.com/drive/v3";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
const GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke";

Deno.serve(async (req) => {
  // Handle CORS preflight — and also GET callback from Google OAuth
  if (req.method === "OPTIONS") return handleCorsPreflightRequest(req);

  const corsHeaders = getCorsHeaders(req);
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

  /** Return an HTML page that posts a message to the opener and closes itself (popup flow),
   *  or redirects if opened as a full page. */
  const popupResultHtml = (success: boolean, errorMsg?: string) => {
    const messageObj = success
      ? { type: "cloud_sync_result", success: true }
      : { type: "cloud_sync_result", success: false, error: errorMsg || "unknown" };
    const messageJson = JSON.stringify(JSON.stringify(messageObj)); // double-stringify for safe JS embedding
    const fallbackParam = success ? "cloud_sync_success=true" : `cloud_sync_error=${encodeURIComponent(errorMsg || "unknown")}`;
    const bodyText = success ? "Verbunden! Dieses Fenster schließt sich automatisch..." : `Fehler: ${errorMsg || "Unbekannt"}`;
    return new Response(
      `<!DOCTYPE html><html><head><title>Cloud Sync</title></head><body>
<script>
  if (window.opener) {
    window.opener.postMessage(${messageJson}, "*");
    window.close();
  } else {
    var base = document.referrer || "/";
    window.location.href = base + (base.indexOf("?") >= 0 ? "&" : "?") + "${fallbackParam}";
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

    // Determine action — callback comes as GET with query params
    let action: string;
    let body: Record<string, unknown> = {};

    if (req.method === "GET") {
      action = url.searchParams.get("action") || "status";
    } else {
      body = await req.json().catch(() => ({}));
      action = (body.action as string) || "status";
    }

    // ── CALLBACK — no auth needed (comes from Google redirect) ──
    if (action === "callback") {
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const error = url.searchParams.get("error");

      if (error) {
        console.error("[cloud-sync] OAuth error:", error);
        return popupResultHtml(false, error);
      }

      if (!code || !state || !clientId || !clientSecret) {
        return json({ error: "Missing code, state, or OAuth credentials" }, 400);
      }

      // Decode state: base64 of JSON { tenantId, userId, returnUrl }
      let stateData: { tenantId: string; userId: string; returnUrl: string };
      try {
        stateData = JSON.parse(atob(state));
      } catch {
        return json({ error: "Invalid state parameter" }, 400);
      }

      const redirectUri = `${supabaseUrl}/functions/v1/sot-cloud-sync?action=callback&provider=google_drive`;

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
        console.error("[cloud-sync] Token exchange failed:", tokenData);
        return popupResultHtml(false, "token_exchange_failed");
      }

      // Get user info from Google
      const userInfoRes = await fetch(GOOGLE_USERINFO_URL, {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const userInfo = await userInfoRes.json();

      const expiresAt = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000).toISOString();

      // Upsert connector
      const { error: upsertErr } = await sbAdmin
        .from("cloud_sync_connectors")
        .upsert(
          {
            tenant_id: stateData.tenantId,
            provider: "google_drive",
            status: "connected",
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token || null,
            token_expires_at: expiresAt,
            account_email: userInfo.email || null,
            account_name: userInfo.name || null,
            error_message: null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "tenant_id,provider" }
        );

      if (upsertErr) {
        console.error("[cloud-sync] Upsert error:", upsertErr);
        return popupResultHtml(false, "db_error");
      }

      return popupResultHtml(true);
    }

    // ── All other actions require auth ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.warn("[cloud-sync] Missing Authorization header for action:", action);
      // Graceful degradation for status — return empty list instead of 401
      if (action === "status") {
        return json({ connectors: [] });
      }
      return json({ error: "Missing authorization" }, 401);
    }

    const sbUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await sbUser.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) return json({ error: "Invalid user" }, 401);
    const user = { id: claimsData.claims.sub as string, email: claimsData.claims.email as string };

    const { data: profile } = await sbUser
      .from("profiles")
      .select("active_tenant_id")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile?.active_tenant_id) return json({ error: "No active tenant" }, 400);
    const tenantId = profile.active_tenant_id;

    switch (action) {
      // ── STATUS ──
      case "status": {
        const { data: connectors } = await sbAdmin
          .from("cloud_sync_connectors")
          .select("id,provider,status,account_email,account_name,remote_folder_id,remote_folder_name,last_sync_at,last_sync_files_count,error_message,token_expires_at")
          .eq("tenant_id", tenantId);
        return json({ connectors: connectors || [] });
      }

      // ── INIT — Start OAuth flow ──
      case "init": {
        if (!clientId || !clientSecret) {
          return json({ error: "Google Drive OAuth nicht konfiguriert. GOOGLE_DRIVE_CLIENT_ID und GOOGLE_DRIVE_CLIENT_SECRET fehlen." }, 500);
        }

        const returnUrl = (body.returnUrl as string) || `${url.origin}`;
        const state = btoa(JSON.stringify({ tenantId, userId: user.id, returnUrl }));
        const redirectUri = `${supabaseUrl}/functions/v1/sot-cloud-sync?action=callback&provider=google_drive`;

        const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
        authUrl.searchParams.set("client_id", clientId);
        authUrl.searchParams.set("redirect_uri", redirectUri);
        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set("scope", "https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile");
        authUrl.searchParams.set("access_type", "offline");
        authUrl.searchParams.set("prompt", "consent");
        authUrl.searchParams.set("state", state);

        return json({ redirect_url: authUrl.toString() });
      }

      // ── FOLDERS — List Drive folders ──
      case "folders": {
        const connector = await getConnector(sbAdmin, tenantId, "google_drive");
        if (!connector) return json({ error: "Google Drive nicht verbunden" }, 404);

        const accessToken = await ensureFreshToken(sbAdmin, connector, clientId!, clientSecret!);
        const parentId = (body.parentId as string) || "root";

        const q = `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
        const res = await fetch(
          `${GOOGLE_DRIVE_API}/files?q=${encodeURIComponent(q)}&fields=files(id,name)&orderBy=name&pageSize=100`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const data = await res.json();
        return json({ folders: data.files || [] });
      }

      // ── SET FOLDER — Save selected folder ──
      case "set_folder": {
        const folderId = body.folderId as string;
        const folderName = body.folderName as string;
        if (!folderId || !folderName) return json({ error: "Missing folderId or folderName" }, 400);

        await sbAdmin
          .from("cloud_sync_connectors")
          .update({ remote_folder_id: folderId, remote_folder_name: folderName, updated_at: new Date().toISOString() })
          .eq("tenant_id", tenantId)
          .eq("provider", "google_drive");

        return json({ success: true });
      }

      // ── SYNC — Download files from Drive ──
      case "sync": {
        const connector = await getConnector(sbAdmin, tenantId, "google_drive");
        if (!connector) return json({ error: "Google Drive nicht verbunden" }, 404);
        if (!connector.remote_folder_id) return json({ error: "Kein Ordner ausgewählt. Bitte wählen Sie zuerst einen Google Drive Ordner." }, 400);

        const accessToken = await ensureFreshToken(sbAdmin, connector, clientId!, clientSecret!);

        // Create sync log entry
        const { data: syncLog } = await sbAdmin
          .from("cloud_sync_log")
          .insert({ tenant_id: tenantId, connector_id: connector.id, status: "running" })
          .select("id")
          .single();

        try {
          // List files in folder (delta-sync via modifiedTime)
          let query = `'${connector.remote_folder_id}' in parents and trashed=false and mimeType!='application/vnd.google-apps.folder'`;
          if (connector.last_sync_at) {
            query += ` and modifiedTime > '${connector.last_sync_at}'`;
          }

          const listRes = await fetch(
            `${GOOGLE_DRIVE_API}/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,modifiedTime)&orderBy=modifiedTime&pageSize=50`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          const listData = await listRes.json();
          const files = listData.files || [];

          let filesSynced = 0;

          for (const file of files) {
            try {
              // Download file content
              const downloadRes = await fetch(
                `${GOOGLE_DRIVE_API}/files/${file.id}?alt=media`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
              );
              if (!downloadRes.ok) {
                console.error(`[cloud-sync] Failed to download ${file.name}:`, downloadRes.status);
                continue;
              }

              const fileBlob = await downloadRes.blob();
              const storagePath = `${tenantId}/CLOUD_SYNC/${file.name}`;

              // Upload to storage
              const { error: uploadErr } = await sbAdmin.storage
                .from("tenant-documents")
                .upload(storagePath, fileBlob, {
                  contentType: file.mimeType || "application/octet-stream",
                  upsert: true,
                });

              if (uploadErr) {
                console.error(`[cloud-sync] Upload error for ${file.name}:`, uploadErr);
                continue;
              }

              // Create document record
              const publicId = crypto.randomUUID().slice(0, 8);
              await sbAdmin.from("documents").insert({
                tenant_id: tenantId,
                name: file.name,
                file_path: storagePath,
                mime_type: file.mimeType || "application/octet-stream",
                size_bytes: parseInt(file.size || "0"),
                uploaded_by: user.id,
                public_id: publicId,
                source: "cloud_sync",
                extraction_status: "pending",
              });

              filesSynced++;
            } catch (fileErr) {
              console.error(`[cloud-sync] Error syncing file ${file.name}:`, fileErr);
            }
          }

          // Update connector
          await sbAdmin
            .from("cloud_sync_connectors")
            .update({
              last_sync_at: new Date().toISOString(),
              last_sync_files_count: filesSynced,
              error_message: null,
              updated_at: new Date().toISOString(),
            })
            .eq("id", connector.id);

          // Update sync log
          if (syncLog) {
            await sbAdmin
              .from("cloud_sync_log")
              .update({ status: "completed", files_synced: filesSynced, completed_at: new Date().toISOString() })
              .eq("id", syncLog.id);
          }

          return json({ success: true, files_synced: filesSynced, total_available: files.length });
        } catch (syncErr) {
          console.error("[cloud-sync] Sync error:", syncErr);
          if (syncLog) {
            await sbAdmin
              .from("cloud_sync_log")
              .update({ status: "failed", error_message: String(syncErr), completed_at: new Date().toISOString() })
              .eq("id", syncLog.id);
          }
          return json({ error: "Sync fehlgeschlagen" }, 500);
        }
      }

      // ── DISCONNECT ──
      case "disconnect": {
        const connector = await getConnector(sbAdmin, tenantId, "google_drive");
        if (!connector) return json({ error: "Kein Google Drive Connector gefunden" }, 404);

        // Revoke token at Google
        if (connector.access_token) {
          try {
            await fetch(`${GOOGLE_REVOKE_URL}?token=${connector.access_token}`, { method: "POST" });
          } catch { /* ignore revoke errors */ }
        }

        await sbAdmin
          .from("cloud_sync_connectors")
          .update({
            status: "not_connected",
            access_token: null,
            refresh_token: null,
            token_expires_at: null,
            account_email: null,
            account_name: null,
            remote_folder_id: null,
            remote_folder_name: null,
            last_sync_at: null,
            last_sync_files_count: 0,
            error_message: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", connector.id);

        return json({ success: true });
      }

      // ── LIST FILES — List files in cloud folder without downloading ──
      case "list_files": {
        const connector = await getConnector(sbAdmin, tenantId, "google_drive");
        if (!connector) return json({ error: "Google Drive nicht verbunden" }, 404);
        if (!connector.remote_folder_id) return json({ error: "Kein Ordner ausgewählt" }, 400);

        const accessToken = await ensureFreshToken(sbAdmin, connector, clientId!, clientSecret!);

        let allFiles: Array<Record<string, unknown>> = [];
        let pageToken: string | undefined;

        do {
          const q = `'${connector.remote_folder_id}' in parents and trashed=false and mimeType!='application/vnd.google-apps.folder'`;
          let url = `${GOOGLE_DRIVE_API}/files?q=${encodeURIComponent(q)}&fields=nextPageToken,files(id,name,mimeType,size,modifiedTime)&orderBy=name&pageSize=100`;
          if (pageToken) url += `&pageToken=${encodeURIComponent(pageToken)}`;

          const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
          const data = await res.json();
          allFiles = allFiles.concat(data.files || []);
          pageToken = data.nextPageToken;
        } while (pageToken);

        return json({ files: allFiles, total: allFiles.length });
      }

      // ── ANALYZE CLOUD — Download + parse files directly from cloud ──
      case "analyze_cloud": {
        const connector = await getConnector(sbAdmin, tenantId, "google_drive");
        if (!connector) return json({ error: "Google Drive nicht verbunden" }, 404);
        if (!connector.remote_folder_id) return json({ error: "Kein Ordner ausgewählt" }, 400);

        const accessToken = await ensureFreshToken(sbAdmin, connector, clientId!, clientSecret!);
        const requestedFileIds = (body.fileIds as string[] | undefined);

        // List files
        let q = `'${connector.remote_folder_id}' in parents and trashed=false and mimeType!='application/vnd.google-apps.folder'`;
        const listRes = await fetch(
          `${GOOGLE_DRIVE_API}/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,size,modifiedTime)&orderBy=name&pageSize=100`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        const listData = await listRes.json();
        let files = listData.files || [];

        // Filter to requested IDs if provided
        if (requestedFileIds && requestedFileIds.length > 0) {
          const idSet = new Set(requestedFileIds);
          files = files.filter((f: Record<string, unknown>) => idSet.has(f.id as string));
        }

        let filesProcessed = 0;
        let filesFailed = 0;

        for (const file of files) {
          try {
            // Download
            const downloadRes = await fetch(
              `${GOOGLE_DRIVE_API}/files/${file.id}?alt=media`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            if (!downloadRes.ok) { filesFailed++; continue; }

            const fileBlob = await downloadRes.blob();
            const storagePath = `${tenantId}/CLOUD_SYNC/${file.name}`;

            // Upload to storage
            const { error: uploadErr } = await sbAdmin.storage
              .from("tenant-documents")
              .upload(storagePath, fileBlob, {
                contentType: file.mimeType || "application/octet-stream",
                upsert: true,
              });
            if (uploadErr) { filesFailed++; continue; }

            // Create document record
            const publicId = crypto.randomUUID().slice(0, 8);
            await sbAdmin.from("documents").insert({
              tenant_id: tenantId,
              name: file.name,
              file_path: storagePath,
              mime_type: file.mimeType || "application/octet-stream",
              size_bytes: parseInt(file.size || "0"),
              uploaded_by: user.id,
              public_id: publicId,
              source: "cloud_sync",
              extraction_status: "pending",
            });

            filesProcessed++;
          } catch (err) {
            console.error(`[cloud-sync] analyze_cloud error for ${file.name}:`, err);
            filesFailed++;
          }
        }

        // Update connector last sync
        await sbAdmin
          .from("cloud_sync_connectors")
          .update({
            last_sync_at: new Date().toISOString(),
            last_sync_files_count: filesProcessed,
            updated_at: new Date().toISOString(),
          })
          .eq("id", connector.id);

        return json({
          success: true,
          files_processed: filesProcessed,
          files_failed: filesFailed,
          total_available: files.length,
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

// ── Helpers ──

async function getConnector(sbAdmin: ReturnType<typeof createClient>, tenantId: string, provider: string) {
  const { data } = await sbAdmin
    .from("cloud_sync_connectors")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("provider", provider)
    .maybeSingle();
  return data;
}

async function ensureFreshToken(
  sbAdmin: ReturnType<typeof createClient>,
  connector: Record<string, unknown>,
  clientId: string,
  clientSecret: string
): Promise<string> {
  const expiresAt = connector.token_expires_at ? new Date(connector.token_expires_at as string) : null;
  const isExpired = !expiresAt || expiresAt.getTime() < Date.now() + 60_000; // 1min buffer

  if (!isExpired && connector.access_token) {
    return connector.access_token as string;
  }

  if (!connector.refresh_token) {
    throw new Error("Token abgelaufen und kein Refresh-Token vorhanden. Bitte erneut verbinden.");
  }

  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: connector.refresh_token as string,
      grant_type: "refresh_token",
    }),
  });

  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error("Token-Erneuerung fehlgeschlagen. Bitte erneut verbinden.");
  }

  const newExpiry = new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString();
  await sbAdmin
    .from("cloud_sync_connectors")
    .update({ access_token: data.access_token, token_expires_at: newExpiry, updated_at: new Date().toISOString() })
    .eq("id", connector.id as string);

  return data.access_token;
}
