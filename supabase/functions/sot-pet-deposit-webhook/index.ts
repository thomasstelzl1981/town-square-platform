/**
 * SOT Pet Deposit Webhook — Stripe checkout.session.completed handler
 * 
 * SECURITY: fail-closed — if STRIPE_WEBHOOK_SECRET is not set, returns 503.
 * PATTERN: event_source + idempotency_key on all lifecycle events.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    // ─── FAIL-CLOSED: Both secrets MUST be present ───
    if (!stripeKey) {
      console.error("[PLC-WEBHOOK] STRIPE_SECRET_KEY not configured — webhook disabled");
      return new Response(JSON.stringify({ error: "Webhook disabled: missing STRIPE_SECRET_KEY" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!webhookSecret) {
      console.error("[PLC-WEBHOOK] STRIPE_WEBHOOK_SECRET not configured — webhook disabled (fail-closed)");
      return new Response(JSON.stringify({ error: "Webhook disabled: missing STRIPE_WEBHOOK_SECRET" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // ─── Verify webhook signature (mandatory) ───
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    if (!sig) {
      console.error("[PLC-WEBHOOK] Missing stripe-signature header");
      return new Response("Missing signature", { status: 403 });
    }

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, sig, webhookSecret);
    } catch (err) {
      console.error("[PLC-WEBHOOK] Signature verification failed:", err);
      return new Response("Invalid signature", { status: 403 });
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
    const paymentIntentId = (session.payment_intent as string) || null;

    if (!caseId) {
      console.error("[PLC-WEBHOOK] No case_id in session metadata", session.id);
      return new Response("Missing case_id", { status: 400 });
    }

    console.log(`[PLC-WEBHOOK] Processing payment for case ${caseId}, session ${session.id}`);

    // ─── DB Client ───
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const now = new Date().toISOString();

    // ─── Fetch current case ───
    const { data: currentCase, error: fetchError } = await supabase
      .from("pet_service_cases")
      .select("id, current_phase, deposit_cents")
      .eq("id", caseId)
      .single();

    if (fetchError || !currentCase) {
      console.error("[PLC-WEBHOOK] Case not found:", caseId, fetchError);
      return new Response("Case not found", { status: 404 });
    }

    // Idempotency: if already deposit_paid or beyond, skip
    if (currentCase.current_phase === "deposit_paid" || 
        currentCase.current_phase === "provider_confirmed" ||
        currentCase.current_phase === "checked_in") {
      console.log(`[PLC-WEBHOOK] Case ${caseId} already past deposit — idempotent skip`);
      return new Response(JSON.stringify({ received: true, already_processed: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ─── Phase transition: deposit_requested → deposit_paid ───
    const { error: updateError } = await supabase
      .from("pet_service_cases")
      .update({
        current_phase: "deposit_paid",
        phase_entered_at: now,
        deposit_paid_at: now,
        stripe_payment_intent_id: paymentIntentId,
        stripe_checkout_session_id: session.id,
      })
      .eq("id", caseId);

    if (updateError) {
      console.error("[PLC-WEBHOOK] Failed to update case:", updateError);
      return new Response("Update failed", { status: 500 });
    }

    // ─── Log lifecycle event with Controller Pattern compliance ───
    const idempotencyKey = `deposit_paid:${caseId}:${paymentIntentId || session.id}`;

    const { error: eventErr } = await supabase.from("pet_lifecycle_events").insert({
      case_id: caseId,
      event_type: "deposit.paid",
      phase_before: "deposit_requested",
      phase_after: "deposit_paid",
      actor_id: null,
      actor_type: "system",
      event_source: "webhook:stripe",
      idempotency_key: idempotencyKey,
      correlation_key: caseId,
      payload: {
        stripe_session_id: session.id,
        stripe_payment_intent: paymentIntentId,
        amount_cents: session.amount_total,
        currency: session.currency,
      },
    });

    if (eventErr) {
      // Handle idempotency duplicate as success (23505 = unique violation)
      if (eventErr.code === '23505') {
        console.log(`[PLC-WEBHOOK] Idempotent skip for event ${idempotencyKey}`);
      } else {
        console.error("[PLC-WEBHOOK] Event insert error:", eventErr);
      }
    }

    console.log(`[PLC-WEBHOOK] Case ${caseId} transitioned to deposit_paid`);

    return new Response(JSON.stringify({ received: true, case_id: caseId, phase: "deposit_paid" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[PLC-WEBHOOK] Error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
