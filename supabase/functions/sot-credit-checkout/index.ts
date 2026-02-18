import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * SOT Credit Checkout
 *
 * Creates a Stripe Checkout Session for a credit top-up package.
 *
 * POST { package_code: "starter" | "standard" | "power", success_url, cancel_url }
 */

const PACKAGES: Record<string, { label: string; credits: number; price_cents: number }> = {
  starter:  { label: "Starter – 50 Credits",   credits: 50,  price_cents: 1250 },
  standard: { label: "Standard – 100 Credits",  credits: 100, price_cents: 2500 },
  power:    { label: "Power – 500 Credits",      credits: 500, price_cents: 12500 },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return json({ error: "Stripe not configured. Please add the STRIPE_SECRET_KEY secret." }, 503);
    }

    // ─── Auth ───
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

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

    // ─── Validate package ───
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    const body = await req.json();
    const { package_code, success_url, cancel_url } = body;

    const pkg = PACKAGES[package_code];
    if (!pkg) {
      return json({ error: `Unknown package: ${package_code}. Valid: ${Object.keys(PACKAGES).join(", ")}` }, 400);
    }

    // ─── Create Stripe Checkout Session ───
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: pkg.price_cents,
            product_data: {
              name: pkg.label,
              description: `${pkg.credits} Credits für Armstrong & Services`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        tenant_id: profile.active_tenant_id,
        user_id: user.id,
        package_code,
        credits: String(pkg.credits),
      },
      customer_email: user.email,
      success_url: success_url || `${req.headers.get("origin")}/portal/armstrong?checkout=success`,
      cancel_url: cancel_url || `${req.headers.get("origin")}/portal/armstrong?checkout=cancel`,
    });

    return json({ checkout_url: session.url, session_id: session.id });
  } catch (err) {
    console.error("sot-credit-checkout error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
