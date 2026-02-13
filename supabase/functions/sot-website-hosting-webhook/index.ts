/**
 * sot-website-hosting-webhook — Stripe webhook for hosting subscriptions
 * Updates hosting_contracts status based on Stripe events
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.text();
    // In production, verify Stripe signature here
    const event = JSON.parse(body);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const subscriptionId = event.data?.object?.subscription || event.data?.object?.id;
    if (!subscriptionId) {
      console.log("No subscription ID in event");
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let newStatus: string | null = null;

    switch (event.type) {
      case "invoice.paid":
        newStatus = "active";
        break;
      case "invoice.payment_failed":
        newStatus = "payment_failed";
        break;
      case "customer.subscription.deleted":
        newStatus = "cancelled";
        break;
      case "customer.subscription.paused":
        newStatus = "suspended";
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    if (newStatus) {
      // Update hosting contract
      const { data: contract, error: updateError } = await supabase
        .from("hosting_contracts")
        .update({
          status: newStatus,
          ...(newStatus === "cancelled" ? { cancelled_at: new Date().toISOString() } : {}),
        })
        .eq("stripe_subscription_id", subscriptionId)
        .select("website_id")
        .single();

      if (updateError) {
        console.error("Contract update error:", updateError);
      } else if (contract && (newStatus === "suspended" || newStatus === "cancelled")) {
        // Suspend website delivery
        await supabase
          .from("tenant_websites")
          .update({ status: "suspended" })
          .eq("id", contract.website_id);
        console.log(`Website ${contract.website_id} suspended due to ${newStatus}`);
      } else if (contract && newStatus === "active") {
        // Re-enable if previously suspended
        const { data: website } = await supabase
          .from("tenant_websites")
          .select("status")
          .eq("id", contract.website_id)
          .single();
        if (website?.status === "suspended") {
          await supabase
            .from("tenant_websites")
            .update({ status: "published" })
            .eq("id", contract.website_id);
        }
      }

      console.log(`Hosting contract updated: subscription=${subscriptionId} status=${newStatus}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Webhook processing failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
