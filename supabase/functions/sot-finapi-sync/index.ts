import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

/**
 * SOT FinAPI Sync — Real Integration
 *
 * Actions:
 *   connect  → Create FinAPI user, import bank connection
 *   sync     → Fetch transactions for a connection
 *   status   → Get connection status from DB
 */

const FINAPI_BASE = "https://sandbox.finapi.io";

interface FinAPIToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

// ─── Helper: FinAPI OAuth2 Token ───────────────────────────────
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

// ─── Helper: Create or reuse FinAPI user ───────────────────────
async function ensureFinAPIUser(
  clientToken: string,
  clientId: string,
  clientSecret: string,
  tenantId: string,
  sbAdmin: ReturnType<typeof createClient>,
): Promise<{ userId: string; password: string; userToken: string }> {
  // 1. Check DB first for an existing password
  const { data: existingConn } = await sbAdmin
    .from("finapi_connections")
    .select("finapi_user_id, finapi_user_password")
    .eq("tenant_id", tenantId)
    .not("finapi_user_password", "is", null)
    .limit(1)
    .maybeSingle();

  if (existingConn?.finapi_user_id && existingConn?.finapi_user_password) {
    // We have stored credentials — get a token and return
    console.log("[finapi] Reusing existing user:", existingConn.finapi_user_id);
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
  }

  // 2. No stored password — try to create a new user (with version suffix if needed)
  const baseId = `sot_${tenantId.replace(/-/g, "").substring(0, 20)}`;

  for (let version = 0; version < 5; version++) {
    const userId = version === 0 ? baseId : `${baseId}_v${version + 1}`;
    const password = crypto.randomUUID();

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

    if (createRes.ok) {
      console.log("[finapi] Created new user:", userId);
      const tokenData = await getUserToken(clientId, clientSecret, userId, password);
      return { userId, password, userToken: tokenData.access_token };
    }

    const createBody = await createRes.json();

    // User already exists — try next version
    if (createRes.status === 422 || createBody?.errors?.[0]?.code === "ENTITY_EXISTS") {
      console.log(`[finapi] User ${userId} already exists, trying next version...`);
      continue;
    }

    throw new Error(`Create FinAPI user failed (${createRes.status}): ${JSON.stringify(createBody)}`);
  }

  throw new Error("Could not create FinAPI user after 5 attempts");
}

// ─── Main Handler ──────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleCorsPreflightRequest(req);

  const corsHeaders = getCorsHeaders(req);
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const finapiClientId = Deno.env.get("FINAPI_CLIENT_ID");
    const finapiClientSecret = Deno.env.get("FINAPI_CLIENT_SECRET");

    if (!finapiClientId || !finapiClientSecret) {
      console.error("[sot-finapi-sync] FINAPI_CLIENT_ID or FINAPI_CLIENT_SECRET not set");
      return json({ error: "FinAPI credentials not configured. Please add FINAPI_CLIENT_ID and FINAPI_CLIENT_SECRET as secrets." }, 500);
    }

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

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
    const user = { id: claimsData.claims.sub as string };

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
      // ─────────────── STATUS ───────────────
      case "status": {
        const { data: connections } = await sbAdmin
          .from("finapi_connections")
          .select("*")
          .eq("tenant_id", tenantId);
        return json({ connections: connections || [] });
      }

      // ─────────────── CONNECT ──────────────
      case "connect": {
        const bankId = body.bankId || 280001; // Default: finAPI Test Bank

        // 1. Get client token
        const clientToken = await getClientToken(finapiClientId, finapiClientSecret);

        // 2. Ensure FinAPI user exists (checks DB first, creates new if orphaned)
        const finUser = await ensureFinAPIUser(
          clientToken.access_token,
          finapiClientId,
          finapiClientSecret,
          tenantId,
          sbAdmin,
        );

        const userAccessToken = finUser.userToken;
        const storedPassword = finUser.password;

        // 3. Import bank connection
        const importPayload = {
          bankId: Number(bankId),
          bankingInterface: "XS2A",
          loginCredentials: [
            { label: "Onlinebanking-ID", value: "demo" },
            { label: "PIN", value: "demo" },
          ],
        };

        console.log("[finapi-connect] Import payload:", JSON.stringify(importPayload));

        const importRes = await fetch(`${FINAPI_BASE}/api/v2/bankConnections/import`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${userAccessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(importPayload),
        });

        if (!importRes.ok) {
          const errBody = await importRes.text();
          console.error("[finapi-connect] Import failed:", importRes.status, errBody);
          return json({ error: "Bank import failed", details: errBody }, importRes.status);
        }

        const bankConn = await importRes.json();

        // 4. Save connection to DB
        const connData = {
          tenant_id: tenantId,
          status: bankConn.status || "COMPLETED",
          finapi_user_id: finUser.userId,
          finapi_user_password: storedPassword,
          finapi_connection_id: String(bankConn.id),
          bank_name: bankConn.bank?.name || `Bank ${bankId}`,
          bank_bic: bankConn.bank?.bic || null,
          iban_masked: bankConn.accounts?.[0]?.iban
            ? `****${bankConn.accounts[0].iban.slice(-4)}`
            : null,
        };

        const { data: savedConn, error: saveErr } = await sbAdmin
          .from("finapi_connections")
          .insert(connData)
          .select()
          .single();

        if (saveErr) {
          console.error("[finapi-connect] DB save error:", saveErr);
          return json({ error: "Connection saved in FinAPI but DB save failed" }, 500);
        }

        // 5. Create bank accounts from imported accounts
        if (bankConn.accounts?.length) {
          const accounts = bankConn.accounts.map((acc: Record<string, unknown>) => ({
            tenant_id: tenantId,
            account_name: acc.accountName || acc.iban || "Konto",
            iban: acc.iban || null,
            bic: acc.accountHolderName || null,
            bank_name: bankConn.bank?.name || null,
            account_type: "checking",
            owner_type: "person",
            owner_id: user.id,
            finapi_account_id: String(acc.id),
          }));

          await sbAdmin.from("msv_bank_accounts").insert(accounts);
        }

        return json({
          status: "connected",
          connection: savedConn,
          accounts_imported: bankConn.accounts?.length || 0,
        });
      }

      // ─────────────── SYNC ─────────────────
      case "sync": {
        const { connectionId } = body;
        if (!connectionId) return json({ error: "Missing connectionId" }, 400);

        // Get connection from DB
        const { data: conn } = await sbAdmin
          .from("finapi_connections")
          .select("*")
          .eq("id", connectionId)
          .eq("tenant_id", tenantId)
          .single();

        if (!conn) return json({ error: "Connection not found" }, 404);

        // Get user token
        const userToken = await getUserToken(
          finapiClientId,
          finapiClientSecret,
          conn.finapi_user_id!,
          conn.finapi_user_password!,
        );

        // Trigger update at FinAPI
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

        // Small delay to let async update process
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

        // Paginated transaction fetch
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

          if (!txRes.ok) {
            const errText = await txRes.text();
            console.error("[finapi-sync] Transaction fetch failed:", errText);
            break;
          }

          const txData = await txRes.json();
          const transactions = txData.transactions || [];

          if (!transactions.length) break;

          // Upsert transactions
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

          const { error: upsertErr } = await sbAdmin
            .from("finapi_transactions")
            .upsert(rows, { onConflict: "finapi_transaction_id" });

          if (upsertErr) {
            console.error("[finapi-sync] Upsert error:", upsertErr);
          }

          totalSynced += rows.length;

          // Check if more pages
          if (transactions.length < perPage) break;
          page++;
        }

        // Update last_sync_at
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
