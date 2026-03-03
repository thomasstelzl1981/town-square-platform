/**
 * SOT Pet Deposit Checkout — Creates Stripe Checkout for 7.5% platform fee
 * 
 * ACCEPTS an existing case_id (case must already exist from Z3/Z2 create flow).
 * Looks up tenant_id from pet_service_cases (NOT pet_customers).
 * Returns stub response if Stripe is not configured.
 * 
 * POST { case_id: string, success_url?: string, cancel_url?: string }
 * Returns { checkout_url?: string, mode: 'stripe'|'stub', case_id, deposit_cents }
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PLATFORM_FEE_PCT = 7.5;
const MIN_DEPOSIT_CENTS = 500; // €5 minimum

function calculateDeposit(totalPriceCents: number): number {
  const raw = Math.round(totalPriceCents * PLATFORM_FEE_PCT / 100);
  return Math.max(raw, MIN_DEPOSIT_CENTS);
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // ─── Parse body ───
    const body = await req.json();
    const { case_id, success_url, cancel_url } = body;

    if (!case_id) return json({ error: "case_id required" }, 400);

    // ─── Load existing case (SSOT) ───
    const { data: serviceCase, error: caseErr } = await supabaseAdmin
      .from("pet_service_cases")
      .select("id, current_phase, total_price_cents, deposit_cents, customer_email, customer_name, provider_id, service_type, tenant_id, stripe_checkout_session_id")
      .eq("id", case_id)
      .single();

    if (caseErr || !serviceCase) {
      return json({ error: "Case nicht gefunden" }, 404);
    }

    // Validate phase: must be provider_selected or deposit_requested
    if (serviceCase.current_phase !== 'provider_selected' && serviceCase.current_phase !== 'deposit_requested') {
      return json({ error: `Checkout nicht möglich in Phase: ${serviceCase.current_phase}` }, 409);
    }

    // Validate pricing
    if (!serviceCase.total_price_cents || serviceCase.total_price_cents < 100) {
      return json({ error: "Kein gültiger Preis hinterlegt" }, 400);
    }

    const depositCents = calculateDeposit(serviceCase.total_price_cents);
    const email = serviceCase.customer_email;

    if (!email) {
      return json({ error: "Keine E-Mail-Adresse beim Kunden hinterlegt" }, 400);
    }

    // ─── Check if Stripe is configured ───
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      // STUB MODE: transition to deposit_requested but no Stripe
      if (serviceCase.current_phase !== 'deposit_requested') {
        const now = new Date().toISOString();
        await supabaseAdmin
          .from("pet_service_cases")
          .update({ current_phase: "deposit_requested", phase_entered_at: now, deposit_cents: depositCents })
          .eq("id", case_id);

        // Log event
        const idempotencyKey = `deposit_checkout_stub:${case_id}`;
        await supabaseAdmin.from("pet_lifecycle_events").insert({
          case_id,
          event_type: "deposit.checkout_created",
          phase_before: serviceCase.current_phase,
          phase_after: "deposit_requested",
          actor_id: null,
          actor_type: "customer",
          event_source: "edge_fn:deposit-checkout",
          idempotency_key: idempotencyKey,
          correlation_key: case_id,
          payload: { total_price_cents: serviceCase.total_price_cents, deposit_cents: depositCents, mode: 'stub' },
        });
      }

      return json({
        mode: 'stub',
        case_id,
        deposit_cents: depositCents,
        message: 'Payment aktuell deaktiviert. Bitte später erneut versuchen.',
      });
    }

    // ─── STRIPE MODE ───
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Look up provider name for Stripe line item
    const { data: provider } = await supabaseAdmin
      .from("pet_providers")
      .select("company_name")
      .eq("id", serviceCase.provider_id)
      .single();

    const providerName = provider?.company_name || "Pet Service Provider";
    const origin = req.headers.get("origin") || "https://systemofatown.lovable.app";

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ email, limit: 1 });
    const customerId = customers.data.length > 0 ? customers.data[0].id : undefined;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : email,
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: depositCents,
            product_data: {
              name: `Plattformgebühr – ${providerName}`,
              description: `7,5% Anzahlung (nicht erstattbar) für ${serviceCase.service_type}. Gesamtpreis: €${(serviceCase.total_price_cents / 100).toFixed(2)}`,
            },
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        case_id,
        provider_id: serviceCase.provider_id,
        service_type: serviceCase.service_type,
        total_price_cents: String(serviceCase.total_price_cents),
        deposit_cents: String(depositCents),
        plc_version: "1.0.0",
      },
      success_url: success_url || `${origin}/website/tierservice/mein-bereich?checkout=success&case_id=${case_id}`,
      cancel_url: cancel_url || `${origin}/website/tierservice/mein-bereich?checkout=cancel&case_id=${case_id}`,
    });

    // ─── Update case ───
    const now = new Date().toISOString();
    await supabaseAdmin
      .from("pet_service_cases")
      .update({
        current_phase: "deposit_requested",
        phase_entered_at: now,
        deposit_cents: depositCents,
        stripe_checkout_session_id: session.id,
      })
      .eq("id", case_id);

    // ─── Log lifecycle event ───
    const idempotencyKey = `deposit_checkout:${case_id}:${session.id}`;
    await supabaseAdmin.from("pet_lifecycle_events").insert({
      case_id,
      event_type: "deposit.checkout_created",
      phase_before: serviceCase.current_phase,
      phase_after: "deposit_requested",
      actor_id: null,
      actor_type: "customer",
      event_source: "edge_fn:deposit-checkout",
      idempotency_key: idempotencyKey,
      correlation_key: case_id,
      payload: {
        total_price_cents: serviceCase.total_price_cents,
        deposit_cents: depositCents,
        service_type: serviceCase.service_type,
        stripe_session_id: session.id,
        mode: 'stripe',
      },
    });

    return json({
      mode: 'stripe',
      checkout_url: session.url,
      session_id: session.id,
      case_id,
      deposit_cents: depositCents,
    });
  } catch (err) {
    console.error("sot-pet-deposit-checkout error:", err);
    return json({
      error: err instanceof Error ? err.message : "Internal server error",
    }, 500);
  }
});
