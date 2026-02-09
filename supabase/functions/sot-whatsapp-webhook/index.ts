/**
 * SOT-WHATSAPP-WEBHOOK — Inbound WhatsApp Message Handler
 * 
 * Handles Meta WABA webhook verification (GET) and inbound messages (POST).
 * - Tenant lookup via phone_number_id
 * - Conversation upsert
 * - Message storage
 * - Owner-Control gate check
 * - Auto-Reply trigger (if enabled)
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
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // =========================================================================
    // GET: Webhook Verification (Meta sends this during setup)
    // =========================================================================
    if (req.method === "GET") {
      const url = new URL(req.url);
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");

      const verifyToken = Deno.env.get("WHATSAPP_VERIFY_TOKEN");

      if (mode === "subscribe" && token === verifyToken) {
        console.log("[WhatsApp Webhook] Verification successful");
        return new Response(challenge, { status: 200 });
      }

      console.error("[WhatsApp Webhook] Verification failed — token mismatch");
      return new Response("Forbidden", { status: 403 });
    }

    // =========================================================================
    // POST: Inbound Message Processing
    // =========================================================================
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
    }

    const body = await req.json();

    // Service client for DB writes (no user context in webhooks)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse Meta WABA payload
    const entries = body?.entry ?? [];
    let processedCount = 0;

    for (const entry of entries) {
      const changes = entry?.changes ?? [];
      for (const change of changes) {
        const value = change?.value;
        if (!value || value.messaging_product !== "whatsapp") continue;

        const phoneNumberId = value.metadata?.phone_number_id;
        if (!phoneNumberId) continue;

        // Tenant lookup
        const { data: account, error: accountError } = await supabase
          .from("whatsapp_accounts")
          .select("id, tenant_id, system_phone_e164")
          .eq("phone_number_id", phoneNumberId)
          .single();

        if (accountError || !account) {
          console.error("[WhatsApp Webhook] Unknown phone_number_id:", phoneNumberId);
          continue;
        }

        const tenantId = account.tenant_id;

        // Process messages
        const messages = value.messages ?? [];
        for (const msg of messages) {
          const fromE164 = msg.from?.startsWith("+") ? msg.from : `+${msg.from}`;
          const toE164 = account.system_phone_e164;
          const contactName = value.contacts?.[0]?.profile?.name ?? null;

          // Upsert conversation
          const { data: conv } = await supabase
            .from("whatsapp_conversations")
            .upsert(
              {
                tenant_id: tenantId,
                wa_contact_e164: fromE164,
                contact_name: contactName,
                last_message_at: new Date().toISOString(),
              },
              { onConflict: "tenant_id,wa_contact_e164" }
            )
            .select("id")
            .single();

          if (!conv) continue;

          // Check Owner-Control
          const { data: ownerSettings } = await supabase
            .from("whatsapp_user_settings")
            .select("user_id, owner_control_e164, auto_reply_enabled, auto_reply_text")
            .eq("tenant_id", tenantId)
            .eq("owner_control_e164", fromE164)
            .maybeSingle();

          const isOwnerControl = !!ownerSettings;

          // Update conversation owner_control flag
          if (isOwnerControl) {
            await supabase
              .from("whatsapp_conversations")
              .update({ is_owner_control: true })
              .eq("id", conv.id);
          }

          // Determine message type and body
          const msgType = msg.type ?? "text";
          const bodyText = msg.text?.body ?? msg.caption ?? null;
          const mediaCount = ["image", "document", "audio", "video"].includes(msgType) ? 1 : 0;

          // Deduplicate by wa_message_id
          if (msg.id) {
            const { data: existing } = await supabase
              .from("whatsapp_messages")
              .select("id")
              .eq("wa_message_id", msg.id)
              .maybeSingle();

            if (existing) {
              console.log("[WhatsApp Webhook] Duplicate message, skipping:", msg.id);
              continue;
            }
          }

          // Store message
          const { data: storedMsg } = await supabase
            .from("whatsapp_messages")
            .insert({
              tenant_id: tenantId,
              conversation_id: conv.id,
              direction: "in",
              from_e164: fromE164,
              to_e164: toE164,
              body_text: bodyText,
              message_type: msgType,
              media_count: mediaCount,
              owner_control_command: isOwnerControl,
              wa_message_id: msg.id ?? null,
              status: "received",
              raw_payload: msg,
            })
            .select("id")
            .single();

          if (!storedMsg) continue;

          // Update unread count
          await supabase.rpc("increment_field", {
            row_id: conv.id,
            table_name: "whatsapp_conversations",
            field_name: "unread_count",
            increment_by: 1,
          }).then(() => {}).catch(() => {
            // Fallback: direct update if RPC doesn't exist
            supabase
              .from("whatsapp_conversations")
              .update({ unread_count: (conv as any).unread_count ? (conv as any).unread_count + 1 : 1 })
              .eq("id", conv.id);
          });

          // Handle media (trigger download if media present)
          if (mediaCount > 0 && msg[msgType]?.id) {
            // Async media download — fire and forget
            try {
              await supabase.functions.invoke("sot-whatsapp-media", {
                body: {
                  wa_media_id: msg[msgType].id,
                  tenant_id: tenantId,
                  message_id: storedMsg.id,
                  mime_type: msg[msgType]?.mime_type ?? "application/octet-stream",
                  file_name: msg[msgType]?.filename ?? `whatsapp_${msgType}_${Date.now()}`,
                },
              });
            } catch (e) {
              console.error("[WhatsApp Webhook] Media download trigger failed:", e);
            }
          }

          // Owner-Control: Log command event
          if (isOwnerControl && bodyText) {
            await supabase
              .from("armstrong_command_events")
              .insert({
                tenant_id: tenantId,
                user_id: ownerSettings!.user_id,
                source: "whatsapp",
                source_message_id: storedMsg.id,
                action_code: "ARM.MOD02.WA_COMMAND_EXECUTE",
                status: "planned",
              });

            console.log("[WhatsApp Webhook] Owner-Control command logged for processing");
          }

          // Auto-Reply for non-owner messages
          if (!isOwnerControl) {
            // Check if any user in tenant has auto-reply enabled
            const { data: autoReplySettings } = await supabase
              .from("whatsapp_user_settings")
              .select("auto_reply_enabled, auto_reply_text")
              .eq("tenant_id", tenantId)
              .eq("auto_reply_enabled", true)
              .limit(1)
              .maybeSingle();

            if (autoReplySettings?.auto_reply_enabled && autoReplySettings.auto_reply_text) {
              // Check loop protection: max 1 auto-reply per conversation per 30 min
              const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
              const { data: recentAutoReply } = await supabase
                .from("whatsapp_messages")
                .select("id")
                .eq("conversation_id", conv.id)
                .eq("direction", "out")
                .eq("status", "sent")
                .gte("created_at", thirtyMinAgo)
                .limit(1)
                .maybeSingle();

              if (!recentAutoReply) {
                // Send auto-reply via send function
                try {
                  await supabase.functions.invoke("sot-whatsapp-send", {
                    body: {
                      conversation_id: conv.id,
                      text: autoReplySettings.auto_reply_text,
                      tenant_id: tenantId,
                      is_auto_reply: true,
                    },
                  });
                } catch (e) {
                  console.error("[WhatsApp Webhook] Auto-reply failed:", e);
                }
              }
            }
          }

          processedCount++;
        }

        // Process status updates (delivery receipts)
        const statuses = value.statuses ?? [];
        for (const status of statuses) {
          if (status.id) {
            const newStatus = status.status === "sent" ? "sent"
              : status.status === "delivered" ? "delivered"
              : status.status === "read" ? "read"
              : status.status === "failed" ? "failed"
              : null;

            if (newStatus) {
              await supabase
                .from("whatsapp_messages")
                .update({ status: newStatus })
                .eq("wa_message_id", status.id);
            }
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: processedCount }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[WhatsApp Webhook] Error:", error);
    // Always return 200 to Meta to prevent webhook deactivation
    return new Response(
      JSON.stringify({ success: false, error: "Internal error" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
