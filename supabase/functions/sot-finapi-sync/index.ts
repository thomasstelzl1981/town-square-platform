import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

/**
 * SOT FinAPI Sync — Web Form 2.0 Flow
 *
 * Actions:
 *   connect  → Create FinAPI user, create Web Form for bank connection import
 *   poll     → Check Web Form status, import accounts on COMPLETED
 *   sync     → Fetch transactions for an existing connection
 *   status   → Get connections from DB
 */

const FINAPI_BASE = "https://sandbox.finapi.io";
const FINAPI_WEBFORM_BASE = "https://webform-sandbox.finapi.io";

interface FinAPIToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// ─── Helper: FinAPI OAuth2 Tokens ─────────────────────────────
async function getClientToken(clientId: string, clientSecret: string): Promise<FinAPIToken> {
  const res = await fetch(`${FINAPI_BASE}/api/v2/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Client token failed (${res.status}): ${text}`);
  }
  return res.json();
}

async function getUserToken(
  clientId: string,
  clientSecret: string,
  username: string,
  password: string,
): Promise<FinAPIToken> {
  const res = await fetch(`${FINAPI_BASE}/api/v2/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "password",
      client_id: clientId,
      client_secret: clientSecret,
      username,
      password,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`User token failed (${res.status}): ${text}`);
  }
  return res.json();
}

// ─── Helper: Ensure FinAPI user exists ────────────────────────
async function ensureFinAPIUser(
  clientToken: string,
  clientId: string,
  clientSecret: string,
  tenantId: string,
  sbAdmin: ReturnType<typeof createClient>,
): Promise<{ userId: string; password: string; userToken: string }> {
  // Check DB for existing credentials
  const { data: existingConn } = await sbAdmin
    .from("finapi_connections")
    .select("finapi_user_id, finapi_user_password")
    .eq("tenant_id", tenantId)
    .not("finapi_user_password", "is", null)
    .limit(1)
    .maybeSingle();

  if (existingConn?.finapi_user_id && existingConn?.finapi_user_password) {
    console.log("[finapi] Reusing existing user:", existingConn.finapi_user_id);
    try {
      const tokenData = await getUserToken(
        clientId, clientSecret,
        existingConn.finapi_user_id,
        existingConn.finapi_user_password,
      );
      return {
        userId: existingConn.finapi_user_id,
        password: existingConn.finapi_user_password,
        userToken: tokenData.access_token,
      };
    } catch (err) {
      console.warn("[finapi] Stored credentials invalid, creating new user:", err.message);
    }
  }

  // Create new user with unique timestamp-based ID
  const baseId = `sot_${tenantId.replace(/-/g, "").substring(0, 16)}`;
  const uniqueSuffix = Date.now().toString(36);
  const userId = `${baseId}_${uniqueSuffix}`;
  const password = crypto.randomUUID();

  console.log("[finapi] Creating new user:", userId);

  const createRes = await fetch(`${FINAPI_BASE}/api/v2/users`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${clientToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: userId,
      password,
      email: `${userId}@sot.internal`,
      isAutoUpdateEnabled: false,
    }),
  });

  if (!createRes.ok) {
    const createBody = await createRes.text();
    throw new Error(`Create FinAPI user failed (${createRes.status}): ${createBody}`);
  }

  console.log("[finapi] Created new user:", userId);
  const tokenData = await getUserToken(clientId, clientSecret, userId, password);
  return { userId, password, userToken: tokenData.access_token };
}

// ─── Main Handler ─────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleCorsPreflightRequest(req);

  const corsHeaders = getCorsHeaders(req);
  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const finapiClientId = Deno.env.get("FINAPI_CLIENT_ID");
  const finapiClientSecret = Deno.env.get("FINAPI_CLIENT_SECRET");

  if (!finapiClientId || !finapiClientSecret) {
    return json({ error: "FinAPI credentials not configured" }, 500);
  }

  try {
    // ── Auth ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    const token = authHeader.replace("Bearer ", "");
    const sbUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsErr } = await sbUser.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims?.sub) return json({ error: "Invalid user" }, 401);
    const userId = claimsData.claims.sub as string;

    const { data: profile } = await sbUser
      .from("profiles")
      .select("active_tenant_id")
      .eq("id", userId)
      .maybeSingle();
    if (!profile?.active_tenant_id) return json({ error: "No active tenant" }, 400);
    const tenantId = profile.active_tenant_id;

    const sbAdmin = createClient(supabaseUrl, serviceKey);
    const body = req.method === "POST" ? await req.json() : {};
    const action = body.action || "status";

    switch (action) {
      // ─────────────── STATUS ───────────────
      case "status": {
        const { data: connections } = await sbAdmin
          .from("finapi_connections")
          .select("*")
          .eq("tenant_id", tenantId);
        return json({ connections: connections || [] });
      }

      // ─────────────── CONNECT (Web Form 2.0) ──────────────
      case "connect": {
        const bankId = body.bankId || 280001;

        // 1. Get client token
        const clientTokenData = await getClientToken(finapiClientId, finapiClientSecret);

        // 2. Ensure FinAPI user
        const finUser = await ensureFinAPIUser(
          clientTokenData.access_token,
          finapiClientId,
          finapiClientSecret,
          tenantId,
          sbAdmin,
        );

        // 3. Create Web Form for bank connection import
        // Web Form 2.0 endpoint is on a SEPARATE host
        const webFormPayload: Record<string, unknown> = {};
        if (bankId) {
          webFormPayload.bankId = Number(bankId);
        }

        console.log("[finapi-connect] Creating Web Form with payload:", JSON.stringify(webFormPayload));

        const webFormRes = await fetch(`${FINAPI_WEBFORM_BASE}/api/webForms/bankConnectionImport`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${finUser.userToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(webFormPayload),
        });

        if (!webFormRes.ok) {
          const errBody = await webFormRes.text();
          console.error("[finapi-connect] Web Form creation failed:", webFormRes.status, errBody);
          return json({ error: "Web Form creation failed", details: errBody }, webFormRes.status);
        }

        const webFormData = await webFormRes.json();
        console.log("[finapi-connect] Web Form created:", JSON.stringify(webFormData));

        // 4. Save connection stub to DB (status = PENDING)
        const connData = {
          tenant_id: tenantId,
          status: "PENDING",
          finapi_user_id: finUser.userId,
          finapi_user_password: finUser.password,
          finapi_connection_id: null,
          bank_name: `Bank ${bankId}`,
          web_form_id: webFormData.id,
        };

        await sbAdmin
          .from("finapi_connections")
          .insert(connData);

        return json({
          status: "web_form_created",
          webFormUrl: webFormData.url,
          webFormId: webFormData.id,
        });
      }

      // ─────────────── POLL (Web Form Status) ──────────────
      case "poll": {
        const { webFormId } = body;
        if (!webFormId) return json({ error: "Missing webFormId" }, 400);

        // Get connection from DB to retrieve user credentials
        const { data: conn } = await sbAdmin
          .from("finapi_connections")
          .select("*")
          .eq("tenant_id", tenantId)
          .eq("web_form_id", webFormId)
          .maybeSingle();

        if (!conn) return json({ error: "Connection not found for this web form" }, 404);

        // Get user token
        const userTokenData = await getUserToken(
          finapiClientId,
          finapiClientSecret,
          conn.finapi_user_id!,
          conn.finapi_user_password!,
        );

        // Check Web Form status
        const statusRes = await fetch(`${FINAPI_WEBFORM_BASE}/api/webForms/${webFormId}`, {
          headers: {
            Authorization: `Bearer ${userTokenData.access_token}`,
          },
        });

        if (!statusRes.ok) {
          const errText = await statusRes.text();
          console.error("[finapi-poll] Status check failed:", statusRes.status, errText);
          return json({ error: "Status check failed", details: errText }, statusRes.status);
        }

        const statusData = await statusRes.json();
        console.log("[finapi-poll] Web Form status:", statusData.status);

        if (statusData.status === "COMPLETED") {
          // Extract bankConnectionId from payload
          const bankConnectionId = statusData.payload?.bankConnectionId;
          console.log("[finapi-poll] Bank connection ID:", bankConnectionId);

          if (bankConnectionId) {
            // Fetch accounts from FinAPI
            const accountsRes = await fetch(
              `${FINAPI_BASE}/api/v2/accounts?bankConnectionIds=${bankConnectionId}`,
              {
                headers: { Authorization: `Bearer ${userTokenData.access_token}` },
              },
            );

            let accountsImported = 0;
            if (accountsRes.ok) {
              const accountsData = await accountsRes.json();
              const accounts = accountsData.accounts || [];

              if (accounts.length) {
                const rows = accounts.map((acc: Record<string, unknown>) => ({
                  tenant_id: tenantId,
                  account_name: (acc as any).accountName || (acc as any).iban || "Konto",
                  iban: (acc as any).iban || null,
                  bic: (acc as any).accountHolderName || null,
                  bank_name: (acc as any).bankName || conn.bank_name || null,
                  account_type: "checking",
                  owner_type: "person",
                  owner_id: userId,
                  finapi_account_id: String(acc.id),
                }));

                await sbAdmin.from("msv_bank_accounts").insert(rows);
                accountsImported = rows.length;
              }
            }

            // Update connection in DB
            await sbAdmin
              .from("finapi_connections")
              .update({
                status: "COMPLETED",
                finapi_connection_id: String(bankConnectionId),
              })
              .eq("id", conn.id);

            return json({
              status: "connected",
              accounts_imported: accountsImported,
            });
          }

          // COMPLETED but no bankConnectionId
          await sbAdmin
            .from("finapi_connections")
            .update({ status: "COMPLETED" })
            .eq("id", conn.id);

          return json({ status: "connected", accounts_imported: 0 });
        }

        if (statusData.status === "NOT_YET_OPENED" || statusData.status === "OPENED") {
          return json({ status: "pending" });
        }

        if (statusData.status === "ABORTED" || statusData.status === "FAILED") {
          await sbAdmin
            .from("finapi_connections")
            .update({ status: statusData.status })
            .eq("id", conn.id);
          return json({ status: "failed", reason: statusData.status });
        }

        return json({ status: "unknown", rawStatus: statusData.status });
      }

      // ─────────────── SYNC ─────────────────
      case "sync": {
        const { connectionId } = body;
        if (!connectionId) return json({ error: "Missing connectionId" }, 400);

        const { data: conn } = await sbAdmin
          .from("finapi_connections")
          .select("*")
          .eq("id", connectionId)
          .eq("tenant_id", tenantId)
          .single();

        if (!conn) return json({ error: "Connection not found" }, 404);

        const userToken = await getUserToken(
          finapiClientId,
          finapiClientSecret,
          conn.finapi_user_id!,
          conn.finapi_user_password!,
        );

        // Trigger update
        await fetch(`${FINAPI_BASE}/api/v2/bankConnections/update`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${userToken.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            bankConnectionId: Number(conn.finapi_connection_id),
          }),
        });

        await new Promise((r) => setTimeout(r, 2000));

        // Fetch transactions
        const accountIds = await sbAdmin
          .from("msv_bank_accounts")
          .select("finapi_account_id")
          .eq("tenant_id", tenantId);

        const accountIdList = (accountIds.data || [])
          .map((a) => a.finapi_account_id)
          .filter(Boolean);

        if (!accountIdList.length) {
          return json({ status: "no_accounts", transactions_synced: 0 });
        }

        let page = 1;
        let totalSynced = 0;
        const perPage = 500;

        while (true) {
          const txUrl = new URL(`${FINAPI_BASE}/api/v2/transactions`);
          txUrl.searchParams.set("accountIds", accountIdList.join(","));
          txUrl.searchParams.set("page", String(page));
          txUrl.searchParams.set("perPage", String(perPage));
          txUrl.searchParams.set("order", "finapiBookingDate,desc");

          const txRes = await fetch(txUrl.toString(), {
            headers: { Authorization: `Bearer ${userToken.access_token}` },
          });

          if (!txRes.ok) break;

          const txData = await txRes.json();
          const transactions = txData.transactions || [];
          if (!transactions.length) break;

          const rows = transactions.map((tx: Record<string, unknown>) => ({
            tenant_id: tenantId,
            connection_id: connectionId,
            finapi_transaction_id: String(tx.id),
            booking_date: tx.finapiBookingDate || tx.bankBookingDate || new Date().toISOString().split("T")[0],
            value_date: tx.valueDate || null,
            amount: tx.amount,
            currency: (tx.currency as string) || "EUR",
            counterpart_name: tx.counterpartName || null,
            counterpart_iban: tx.counterpartIban || null,
            purpose: tx.purpose || null,
            bank_booking_key: tx.bankBookingKey || null,
            match_status: "unmatched",
          }));

          await sbAdmin
            .from("finapi_transactions")
            .upsert(rows, { onConflict: "finapi_transaction_id" });

          totalSynced += rows.length;
          if (transactions.length < perPage) break;
          page++;
        }

        await sbAdmin
          .from("finapi_connections")
          .update({
            last_sync_at: new Date().toISOString(),
            last_sync_transactions: totalSynced,
            status: "COMPLETED",
          })
          .eq("id", connectionId);

        return json({ status: "synced", transactions_synced: totalSynced });
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err) {
    console.error("[sot-finapi-sync] Error:", err);
    return json({ error: err.message || "Internal server error" }, 500);
  }
});
