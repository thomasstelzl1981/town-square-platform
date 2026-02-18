import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * SOT Credit Preflight
 * 
 * Prüft ob ein Tenant genügend Credits hat, bevor eine kostenpflichtige Aktion ausgeführt wird.
 * 
 * Endpoints:
 *   GET  ?action=balance         → Aktuelles Guthaben abfragen
 *   POST { action: "preflight" } → Preflight-Check (reicht das Guthaben?)
 *   POST { action: "deduct" }    → Credits abziehen (nach erfolgreicher Aktion)
 *   POST { action: "topup" }     → Credits aufladen (Admin/Stripe)
 */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  try {
    // ─── Authenticate user ───
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing authorization" }, 401);
    }

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

    if (!profile?.active_tenant_id) {
      return json({ error: "No active tenant" }, 400);
    }

    const tenantId = profile.active_tenant_id;
    const sbAdmin = createClient(supabaseUrl, serviceKey);

    // ─── GET: Balance ───
    if (req.method === "GET") {
      const url = new URL(req.url);
      const action = url.searchParams.get("action");

      if (action === "balance") {
        const { data } = await sbAdmin.rpc("rpc_credit_preflight", {
          p_tenant_id: tenantId,
          p_required_credits: 0,
          p_action_code: "balance_check",
        });

        return json({
          tenant_id: tenantId,
          available_credits: data?.available_credits ?? 0,
          balance_details: data,
        });
      }

      return json({ error: "Unknown action" }, 400);
    }

    // ─── POST: Preflight / Deduct / Topup ───
    if (req.method === "POST") {
      const body = await req.json();
      const { action, credits, action_code, ref_type, ref_id } = body;

      if (action === "preflight") {
        if (!credits || credits < 0) {
          return json({ error: "Invalid credits amount" }, 400);
        }

        const { data, error } = await sbAdmin.rpc("rpc_credit_preflight", {
          p_tenant_id: tenantId,
          p_required_credits: credits,
          p_action_code: action_code || "unknown",
        });

        if (error) {
          console.error("Preflight RPC error:", error);
          return json({ error: "Preflight check failed" }, 500);
        }

        return json(data);
      }

      if (action === "deduct") {
        if (!credits || credits < 1) {
          return json({ error: "Invalid credits amount" }, 400);
        }

        const { data, error } = await sbAdmin.rpc("rpc_credit_deduct", {
          p_tenant_id: tenantId,
          p_credits: credits,
          p_action_code: action_code || "unknown",
          p_ref_type: ref_type || null,
          p_ref_id: ref_id || null,
        });

        if (error) {
          console.error("Deduct RPC error:", error);
          return json({ error: "Credit deduction failed" }, 500);
        }

        return json(data);
      }

      if (action === "topup") {
        if (!credits || credits < 1) {
          return json({ error: "Invalid credits amount" }, 400);
        }

        const { data, error } = await sbAdmin.rpc("rpc_credit_topup", {
          p_tenant_id: tenantId,
          p_credits: credits,
          p_ref_type: ref_type || "manual",
          p_ref_id: ref_id || null,
        });

        if (error) {
          console.error("Topup RPC error:", error);
          return json({ error: "Credit topup failed" }, 500);
        }

        return json(data);
      }

      return json({ error: "Unknown action. Use: preflight, deduct, topup" }, 400);
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (err) {
    console.error("sot-credit-preflight error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
