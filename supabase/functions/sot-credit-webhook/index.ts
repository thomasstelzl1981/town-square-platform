import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * SOT Credit Webhook
 *
 * Receives Stripe webhook events for credit top-up checkout sessions.
 * On checkout.session.completed → calls rpc_credit_topup() to add credits.
 *
 * Requires secrets: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
 */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeKey) {
      return json({ error: "Stripe not configured" }, 503);
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const body = await req.text();

    let event: Stripe.Event;

    // ─── Verify signature if webhook secret is set ───
    if (webhookSecret) {
      const sig = req.headers.get("stripe-signature");
      if (!sig) return json({ error: "Missing stripe-signature header" }, 400);

      try {
        event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
      } catch (err) {
        console.error("Webhook signature verification failed:", err.message);
        return json({ error: "Invalid signature" }, 400);
      }
    } else {
      // Dev mode: parse without verification (log warning)
      console.warn("⚠️ STRIPE_WEBHOOK_SECRET not set — accepting unverified webhook");
      event = JSON.parse(body) as Stripe.Event;
    }

    // ─── Handle checkout.session.completed ───
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const meta = session.metadata || {};

      const tenantId = meta.tenant_id;
      const credits = parseInt(meta.credits || "0", 10);
      const packageCode = meta.package_code || "unknown";

      if (!tenantId || credits < 1) {
        console.error("Invalid metadata in checkout session:", meta);
        return json({ error: "Invalid session metadata" }, 400);
      }

      console.log(`✅ Checkout completed: tenant=${tenantId}, credits=${credits}, package=${packageCode}`);

      // ─── Topup credits via RPC ───
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const sbAdmin = createClient(supabaseUrl, serviceKey);

      const { data, error } = await sbAdmin.rpc("rpc_credit_topup", {
        p_tenant_id: tenantId,
        p_credits: credits,
        p_ref_type: "stripe_checkout",
        p_ref_id: session.id,
      });

      if (error) {
        console.error("rpc_credit_topup failed:", error);
        return json({ error: "Credit topup failed" }, 500);
      }

      // ─── Log billing event ───
      await sbAdmin.from("armstrong_billing_events").insert({
        org_id: tenantId,
        action_code: `credit_topup_${packageCode}`,
        cost_model: "stripe_checkout",
        credits_charged: -credits, // negative = credit added
        cost_cents: -(session.amount_total || 0),
        action_run_id: null,
      });

      console.log(`💰 Credits topped up: +${credits} for tenant ${tenantId}`);
      return json({ received: true, credits_added: credits });
    }

    // ─── Other events: acknowledge ───
    return json({ received: true, type: event.type });
  } catch (err) {
    console.error("sot-credit-webhook error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
