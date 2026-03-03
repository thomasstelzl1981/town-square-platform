import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Stripe from "https://esm.sh/stripe@18.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * SOT Pet Deposit Checkout
 *
 * Creates a Stripe Checkout Session for the 7.5% non-refundable platform fee.
 * Called from Z3 (Lennox) or Z2 (Caring/PetsCaring) booking flow.
 *
 * POST {
 *   provider_id: string,       // pet_customers provider ID
 *   service_type: string,      // 'pension' | 'grooming' | 'walking' | ...
 *   total_price_cents: number,  // full service price in cents
 *   scheduled_start?: string,
 *   scheduled_end?: string,
 *   pet_id?: string,
 *   customer_name?: string,
 *   customer_email?: string,    // required if not authenticated
 *   customer_notes?: string,
 *   success_url?: string,
 *   cancel_url?: string,
 * }
 *
 * Returns { checkout_url, session_id, case_id, deposit_cents }
 */

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
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return json({ error: "Stripe not configured" }, 503);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // ─── Auth (optional — Z3 guests allowed) ───
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    let userEmail: string | null = null;

    if (authHeader) {
      const sbUser = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: { user } } = await sbUser.auth.getUser();
      if (user) {
        userId = user.id;
        userEmail = user.email ?? null;
      }
    }

    // ─── Parse body ───
    const body = await req.json();
    const {
      provider_id,
      service_type,
      total_price_cents,
      scheduled_start,
      scheduled_end,
      pet_id,
      customer_name,
      customer_email,
      customer_notes,
      success_url,
      cancel_url,
    } = body;

    // Validation
    if (!provider_id) return json({ error: "provider_id required" }, 400);
    if (!service_type) return json({ error: "service_type required" }, 400);
    if (!total_price_cents || total_price_cents < 100) {
      return json({ error: "total_price_cents must be >= 100 (€1)" }, 400);
    }

    const email = userEmail || customer_email;
    if (!email) {
      return json({ error: "customer_email required for guest checkout" }, 400);
    }

    // ─── Calculate deposit ───
    const depositCents = calculateDeposit(total_price_cents);

    // ─── Create pet_service_cases record ───
    const { data: serviceCase, error: caseError } = await supabaseAdmin
      .from("pet_service_cases")
      .insert({
        customer_user_id: userId,
        customer_email: email,
        customer_name: customer_name || null,
        provider_id,
        service_type,
        pet_id: pet_id || null,
        current_phase: "deposit_requested",
        total_price_cents,
        deposit_cents: depositCents,
        scheduled_start: scheduled_start || null,
        scheduled_end: scheduled_end || null,
        customer_notes: customer_notes || null,
        // tenant_id comes from provider — look up
        tenant_id: "00000000-0000-0000-0000-000000000000", // placeholder, updated below
      })
      .select("id")
      .single();

    if (caseError) {
      console.error("Case creation error:", caseError);
      return json({ error: "Failed to create service case" }, 500);
    }

    // Look up provider's tenant_id and update case
    const { data: provider } = await supabaseAdmin
      .from("pet_customers")
      .select("tenant_id, business_name")
      .eq("id", provider_id)
      .single();

    if (provider?.tenant_id) {
      await supabaseAdmin
        .from("pet_service_cases")
        .update({ tenant_id: provider.tenant_id })
        .eq("id", serviceCase.id);
    }

    // ─── Log lifecycle event ───
    await supabaseAdmin.from("pet_lifecycle_events").insert({
      case_id: serviceCase.id,
      event_type: "deposit.checkout_created",
      phase_before: "provider_selected",
      phase_after: "deposit_requested",
      actor_id: userId,
      actor_type: userId ? "customer" : "customer",
      payload: { total_price_cents, deposit_cents: depositCents, service_type },
    });

    // ─── Create Stripe Checkout Session ───
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check for existing Stripe customer
    const customers = await stripe.customers.list({ email, limit: 1 });
    const customerId = customers.data.length > 0 ? customers.data[0].id : undefined;

    const providerName = provider?.business_name || "Pet Service Provider";
    const origin = req.headers.get("origin") || "https://systemofatown.lovable.app";

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
              description: `7,5% Anzahlung (nicht erstattbar) für ${service_type}. Gesamtpreis: €${(total_price_cents / 100).toFixed(2)}`,
            },
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        case_id: serviceCase.id,
        provider_id,
        service_type,
        total_price_cents: String(total_price_cents),
        deposit_cents: String(depositCents),
        plc_version: "1.0.0",
      },
      success_url: success_url || `${origin}/portal/pet-manager?checkout=success&case_id=${serviceCase.id}`,
      cancel_url: cancel_url || `${origin}/portal/pet-manager?checkout=cancel&case_id=${serviceCase.id}`,
    });

    // ─── Update case with Stripe session ID ───
    await supabaseAdmin
      .from("pet_service_cases")
      .update({ stripe_checkout_session_id: session.id })
      .eq("id", serviceCase.id);

    return json({
      checkout_url: session.url,
      session_id: session.id,
      case_id: serviceCase.id,
      deposit_cents: depositCents,
    });
  } catch (err) {
    console.error("sot-pet-deposit-checkout error:", err);
    return json({
      error: err instanceof Error ? err.message : "Internal server error",
    }, 500);
  }
});
