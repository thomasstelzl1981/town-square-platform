import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * SOT Pet Deposit Webhook
 *
 * Handles Stripe webhook for checkout.session.completed.
 * Transitions pet_service_cases from deposit_requested → deposit_paid.
 * Logs event to pet_lifecycle_events.
 *
 * Stripe sends:
 *   metadata.case_id → identifies pet_service_cases row
 */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!stripeKey) {
      return new Response("Stripe not configured", { status: 503 });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // ─── Verify webhook signature ───
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    if (webhookSecret && sig) {
      try {
        event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
      } catch (err) {
        console.error("Webhook signature verification failed:", err);
        return new Response("Invalid signature", { status: 403 });
      }
    } else {
      // Fallback: parse without signature verification (dev mode)
      console.warn("STRIPE_WEBHOOK_SECRET not set — skipping signature verification");
      event = JSON.parse(body) as Stripe.Event;
    }

    // ─── Only handle checkout.session.completed ───
    if (event.type !== "checkout.session.completed") {
      return new Response(JSON.stringify({ received: true, ignored: event.type }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const caseId = session.metadata?.case_id;

    if (!caseId) {
      console.error("No case_id in session metadata", session.id);
      return new Response("Missing case_id", { status: 400 });
    }

    console.log(`[PLC-WEBHOOK] Processing payment for case ${caseId}, session ${session.id}`);

    // ─── Update pet_service_cases ───
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const now = new Date().toISOString();

    // Fetch current case to verify phase
    const { data: currentCase, error: fetchError } = await supabase
      .from("pet_service_cases")
      .select("id, current_phase, deposit_cents")
      .eq("id", caseId)
      .single();

    if (fetchError || !currentCase) {
      console.error("Case not found:", caseId, fetchError);
      return new Response("Case not found", { status: 404 });
    }

    // Idempotency: if already deposit_paid, skip
    if (currentCase.current_phase === "deposit_paid") {
      console.log(`[PLC-WEBHOOK] Case ${caseId} already in deposit_paid — idempotent skip`);
      return new Response(JSON.stringify({ received: true, already_processed: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Phase transition: deposit_requested → deposit_paid
    const { error: updateError } = await supabase
      .from("pet_service_cases")
      .update({
        current_phase: "deposit_paid",
        phase_entered_at: now,
        deposit_paid_at: now,
        stripe_payment_intent_id: session.payment_intent as string || null,
        stripe_checkout_session_id: session.id,
      })
      .eq("id", caseId);

    if (updateError) {
      console.error("Failed to update case:", updateError);
      return new Response("Update failed", { status: 500 });
    }

    // ─── Log lifecycle event ───
    await supabase.from("pet_lifecycle_events").insert({
      case_id: caseId,
      event_type: "deposit.paid",
      phase_before: "deposit_requested",
      phase_after: "deposit_paid",
      actor_id: null,
      actor_type: "system",
      payload: {
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent,
        amount_cents: session.amount_total,
        currency: session.currency,
      },
    });

    console.log(`[PLC-WEBHOOK] Case ${caseId} transitioned to deposit_paid`);

    return new Response(JSON.stringify({ received: true, case_id: caseId, phase: "deposit_paid" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("sot-pet-deposit-webhook error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
