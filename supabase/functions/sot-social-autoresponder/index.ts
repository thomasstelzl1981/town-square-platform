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

    const { lead_id } = await req.json();

    if (!lead_id) {
      return new Response(JSON.stringify({ error: "lead_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch lead + mandate + partner info
    const { data: lead, error: leadError } = await supabase
      .from("social_leads")
      .select("*, social_mandates(partner_display_name, personalization)")
      .eq("id", lead_id)
      .single();

    if (leadError || !lead) {
      return new Response(JSON.stringify({ error: "Lead not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const leadData = lead.lead_data as any || {};
    const leadEmail = leadData.email;

    if (!leadEmail) {
      // Update status to failed
      await supabase
        .from("social_leads")
        .update({ autoresponder_status: "failed" })
        .eq("id", lead_id);

      await supabase.from("social_lead_events").insert({
        lead_id,
        event_type: "autoresponder_sent",
        payload: { status: "failed", reason: "no_email" },
      });

      return new Response(JSON.stringify({ success: false, reason: "no_email" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Stub: In production, send via Resend
    // From: Kaufy <noreply@kaufy.de>
    // Reply-To: Partner email
    const emailPayload = {
      to: leadEmail,
      from: "Kaufy <noreply@kaufy.de>",
      reply_to: (lead.social_mandates as any)?.personalization?.email || "info@kaufy.de",
      subject: "Vielen Dank für Ihr Interesse — Kaufy",
      body: `Sehr geehrte/r ${leadData.name || "Interessent/in"},\n\nvielen Dank für Ihr Interesse an einer Kapitalanlage-Immobilie. Ihr persönlicher Berater wird sich in Kürze bei Ihnen melden.\n\nMit freundlichen Grüßen,\nKaufy`,
    };

    console.log("Autoresponder email (stub):", JSON.stringify(emailPayload));

    // Update lead
    await supabase
      .from("social_leads")
      .update({ autoresponder_status: "sent" })
      .eq("id", lead_id);

    await supabase.from("social_lead_events").insert({
      lead_id,
      event_type: "autoresponder_sent",
      payload: { status: "sent", email_stub: emailPayload },
    });

    return new Response(JSON.stringify({ success: true, email_sent_to: leadEmail }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("autoresponder error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
