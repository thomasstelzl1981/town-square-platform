import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { mandate_id } = await req.json();

    if (!mandate_id) {
      return new Response(JSON.stringify({ error: "mandate_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch mandate to get budget
    const { data: mandate, error: fetchError } = await supabase
      .from("social_mandates")
      .select("id, budget_total_cents, payment_status")
      .eq("id", mandate_id)
      .single();

    if (fetchError || !mandate) {
      return new Response(JSON.stringify({ error: "Mandate not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (mandate.payment_status === "paid") {
      return new Response(JSON.stringify({ error: "Already paid" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Stub: In production, create Stripe checkout session here
    const checkout_url = `https://checkout.stub.kaufy.dev/session/${mandate_id}`;
    const session_id = `stub_session_${Date.now()}`;

    // Update payment ref
    await supabase
      .from("social_mandates")
      .update({
        payment_ref: { session_id, checkout_url, provider: "stripe_stub" },
      })
      .eq("id", mandate_id);

    return new Response(JSON.stringify({
      success: true,
      checkout_url,
      session_id,
      amount_cents: mandate.budget_total_cents,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("payment-create error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
