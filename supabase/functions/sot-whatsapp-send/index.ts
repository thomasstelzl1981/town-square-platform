/**
 * SOT-WHATSAPP-SEND — Outbound WhatsApp Message Sender
 * 
 * Sends text messages via Meta WhatsApp Business API.
 * Can be called by authenticated users (reply from portal) or internally (auto-reply).
 * 
 * @version 1.0.0
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversation_id, text, tenant_id: bodyTenantId, is_auto_reply } = await req.json();

    if (!conversation_id || !text) {
      return new Response(
        JSON.stringify({ error: "conversation_id and text are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Determine tenant_id: from body (internal call) or from auth context
    let tenantId = bodyTenantId;

    if (!tenantId) {
      // User-authenticated call: extract user and tenant
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data: { user } } = await userClient.auth.getUser();
        if (user) {
          const { data: membership } = await supabase
            .from("organization_members")
            .select("organization_id")
            .eq("user_id", user.id)
            .limit(1)
            .single();
          tenantId = membership?.organization_id;
        }
      }
    }

    if (!tenantId) {
      return new Response(
        JSON.stringify({ error: "Could not determine tenant" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get conversation
    const { data: conv } = await supabase
      .from("whatsapp_conversations")
      .select("id, wa_contact_e164, tenant_id")
      .eq("id", conversation_id)
      .eq("tenant_id", tenantId)
      .single();

    if (!conv) {
      return new Response(
        JSON.stringify({ error: "Conversation not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get WABA account for this tenant
    const { data: account } = await supabase
      .from("whatsapp_accounts")
      .select("phone_number_id, system_phone_e164, access_token_ref")
      .eq("tenant_id", tenantId)
      .single();

    if (!account) {
      return new Response(
        JSON.stringify({ error: "WhatsApp account not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get access token from secrets
    const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN") ?? account.access_token_ref;

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "WhatsApp access token not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Send via Meta WABA API
    const recipientPhone = conv.wa_contact_e164.replace("+", "");
    const metaResponse = await fetch(
      `https://graph.facebook.com/v21.0/${account.phone_number_id}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: recipientPhone,
          type: "text",
          text: { body: text },
        }),
      }
    );

    const metaData = await metaResponse.json();

    if (!metaResponse.ok) {
      console.error("[WhatsApp Send] Meta API error:", metaData);

      // Store as failed message
      await supabase.from("whatsapp_messages").insert({
        tenant_id: tenantId,
        conversation_id: conv.id,
        direction: "out",
        from_e164: account.system_phone_e164,
        to_e164: conv.wa_contact_e164,
        body_text: text,
        message_type: "text",
        status: "failed",
      });

      return new Response(
        JSON.stringify({ error: "Failed to send message", details: metaData }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const waMessageId = metaData?.messages?.[0]?.id ?? null;

    // Store outbound message
    const { data: storedMsg } = await supabase
      .from("whatsapp_messages")
      .insert({
        tenant_id: tenantId,
        conversation_id: conv.id,
        direction: "out",
        from_e164: account.system_phone_e164,
        to_e164: conv.wa_contact_e164,
        body_text: text,
        message_type: "text",
        wa_message_id: waMessageId,
        status: "sent",
      })
      .select("id")
      .single();

    // Update conversation last_message_at
    await supabase
      .from("whatsapp_conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", conv.id);

    return new Response(
      JSON.stringify({
        success: true,
        message_id: storedMsg?.id,
        wa_message_id: waMessageId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[WhatsApp Send] Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
