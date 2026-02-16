/**
 * SOT-ACQ-INBOUND-WEBHOOK
 * 
 * Resend Inbound Email Webhook — Deterministic routing to mandates
 * 
 * Routing Priority:
 * 1. Token from Reply-To (acq+{mandate}+{contact}@...)
 * 2. Email match to known contacts
 * 3. Thread/In-Reply-To header matching
 * 4. AI fallback (if confidence low → needs_routing)
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { verifyRequestSignature } from "../_shared/webhook-validation.ts";

interface ResendInboundPayload {
  id: string;
  from: string;
  to: string[];
  subject: string;
  text: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: string; // base64
    content_type: string;
  }>;
  headers: Record<string, string>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    // Verify webhook signature
    const rawBody = await req.text();
    const isValidSignature = await verifyRequestSignature(req, rawBody, 'RESEND_WEBHOOK_SECRET');
    
    if (!isValidSignature) {
      console.error('Invalid webhook signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const payload: ResendInboundPayload = JSON.parse(rawBody);
    console.log('Inbound email received:', { from: payload.from, subject: payload.subject });

    let mandateId: string | null = null;
    let contactId: string | null = null;
    let routingMethod: string | null = null;
    let routingConfidence = 0;
    let needsRouting = true;
    let inReplyToMessageId: string | null = null;

    // ========================================
    // 1. Try Token-based routing from To address
    // ========================================
    const toAddress = payload.to?.[0] || '';
    const tokenMatch = toAddress.match(/acq\+([a-f0-9-]+)\+([a-f0-9-]+)@/i);
    
    if (tokenMatch) {
      mandateId = tokenMatch[1];
      contactId = tokenMatch[2];
      routingMethod = 'token';
      routingConfidence = 100;
      needsRouting = false;
      console.log('Token routing:', { mandateId, contactId });
    }

    // ========================================
    // 2. Try X-Acq-Token header
    // ========================================
    if (!mandateId && payload.headers?.['x-acq-token']) {
      const headerToken = payload.headers['x-acq-token'];
      const { data: outbound } = await supabase
        .from('acq_outbound_messages')
        .select('mandate_id, contact_id, id')
        .eq('routing_token', headerToken)
        .single();

      if (outbound) {
        mandateId = outbound.mandate_id;
        contactId = outbound.contact_id;
        inReplyToMessageId = outbound.id;
        routingMethod = 'token';
        routingConfidence = 100;
        needsRouting = false;
        console.log('Header token routing:', { mandateId, contactId });
      }
    }

    // ========================================
    // 3. Try email match
    // ========================================
    const fromEmail = payload.from.match(/<([^>]+)>/)?.[1] || payload.from;
    
    if (!mandateId) {
      // Find contact by email
      const { data: contact } = await supabase
        .from('contacts')
        .select('id')
        .eq('email', fromEmail)
        .single();

      if (contact) {
        contactId = contact.id;

        // Find recent outbound to this contact
        const { data: recentOutbound } = await supabase
          .from('acq_outbound_messages')
          .select('mandate_id, id')
          .eq('contact_id', contact.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (recentOutbound) {
          mandateId = recentOutbound.mandate_id;
          inReplyToMessageId = recentOutbound.id;
          routingMethod = 'email_match';
          routingConfidence = 85;
          needsRouting = false;
          console.log('Email match routing:', { mandateId, contactId });
        }
      }
    }

    // ========================================
    // 4. Try In-Reply-To/References header
    // ========================================
    if (!mandateId && payload.headers?.['in-reply-to']) {
      const inReplyTo = payload.headers['in-reply-to'];
      const { data: outbound } = await supabase
        .from('acq_outbound_messages')
        .select('mandate_id, contact_id, id')
        .eq('resend_message_id', inReplyTo)
        .single();

      if (outbound) {
        mandateId = outbound.mandate_id;
        contactId = outbound.contact_id;
        inReplyToMessageId = outbound.id;
        routingMethod = 'thread';
        routingConfidence = 90;
        needsRouting = false;
        console.log('Thread routing:', { mandateId, contactId });
      }
    }

    // ========================================
    // 5. Low confidence → needs manual routing
    // ========================================
    if (routingConfidence < 80) {
      needsRouting = true;
      routingMethod = routingMethod || 'ai_fallback';
    }

    // ========================================
    // Store attachments if any
    // ========================================
    const attachmentsMeta: Array<{ filename: string; storage_path: string; mime_type: string }> = [];

    if (payload.attachments?.length) {
      for (const att of payload.attachments) {
        try {
          const bytes = Uint8Array.from(atob(att.content), c => c.charCodeAt(0));
          const storagePath = `inbound/${payload.id}/${att.filename}`;

          await supabase.storage
            .from('acq-documents')
            .upload(storagePath, bytes, {
              contentType: att.content_type,
            });

          attachmentsMeta.push({
            filename: att.filename,
            storage_path: storagePath,
            mime_type: att.content_type,
          });
        } catch (uploadError) {
          console.error('Failed to upload attachment:', att.filename, uploadError);
        }
      }
    }

    // ========================================
    // Create inbound record
    // ========================================
    const { data: inbound, error: insertError } = await supabase
      .from('acq_inbound_messages')
      .insert([{
        mandate_id: mandateId,
        contact_id: contactId,
        resend_inbound_id: payload.id,
        from_email: fromEmail,
        to_email: toAddress,
        subject: payload.subject,
        body_text: payload.text,
        body_html: payload.html,
        attachments: attachmentsMeta,
        routing_method: routingMethod,
        routing_confidence: routingConfidence,
        needs_routing: needsRouting,
        in_reply_to_message_id: inReplyToMessageId,
        received_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (insertError) {
      console.error('Failed to store inbound message:', insertError);
      throw insertError;
    }

    // ========================================
    // Update outbound status if reply
    // ========================================
    if (inReplyToMessageId) {
      await supabase
        .from('acq_outbound_messages')
        .update({
          status: 'replied',
          replied_at: new Date().toISOString(),
        })
        .eq('id', inReplyToMessageId);
    }

    // ========================================
    // Log audit event if mandate found
    // ========================================
    if (mandateId) {
      await supabase.from('acq_mandate_events').insert([{
        mandate_id: mandateId,
        event_type: 'email_replied',
        payload: {
          inbound_id: inbound.id,
          from_email: fromEmail,
          subject: payload.subject,
          routing_method: routingMethod,
        },
      }]);
    }

    // ========================================
    // Auto-create acq_offers from routed inbound
    // ========================================
    let offerId: string | null = null;
    if (mandateId && !needsRouting) {
      try {
        // Get tenant_id from the mandate
        const { data: mandate } = await supabase
          .from('acq_mandates')
          .select('tenant_id')
          .eq('id', mandateId)
          .single();

        const { data: offer, error: offerError } = await supabase
          .from('acq_offers')
          .insert([{
            mandate_id: mandateId,
            tenant_id: mandate?.tenant_id || null,
            title: payload.subject || 'E-Mail-Eingang',
            source_type: 'inbound_email',
            source_inbound_id: inbound.id,
            source_contact_id: contactId,
            status: 'new',
            notes: payload.text?.substring(0, 500) || null,
          }])
          .select('id')
          .single();

        if (offerError) {
          console.error('Failed to create offer from inbound:', offerError);
        } else {
          offerId = offer.id;
          console.log('Auto-created offer from inbound:', offerId);

          // Link attachments as offer documents
          for (const att of attachmentsMeta) {
            await supabase.from('acq_offer_documents').insert([{
              offer_id: offerId,
              tenant_id: mandate?.tenant_id || null,
              file_name: att.filename,
              storage_path: att.storage_path,
              mime_type: att.mime_type,
              document_type: 'expose',
            }]);
          }

          // Trigger AI extraction if PDF attachments exist
          const pdfAttachments = attachmentsMeta.filter(a => 
            a.mime_type === 'application/pdf'
          );
          if (pdfAttachments.length > 0) {
            try {
              await fetch(`${SUPABASE_URL}/functions/v1/sot-acq-offer-extract`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
                },
                body: JSON.stringify({ offerId, storagePath: pdfAttachments[0].storage_path }),
              });
              console.log('Triggered AI extraction for offer:', offerId);
            } catch (extractError) {
              console.error('Failed to trigger extraction:', extractError);
            }
          }

          // Log offer creation event
          await supabase.from('acq_mandate_events').insert([{
            mandate_id: mandateId,
            event_type: 'offer_created',
            payload: {
              offer_id: offerId,
              source: 'inbound_email',
              inbound_id: inbound.id,
            },
          }]);
        }
      } catch (offerCreateError) {
        console.error('Error in offer creation flow:', offerCreateError);
      }
    }

    console.log('Inbound stored:', { 
      id: inbound.id, 
      mandateId, 
      needsRouting,
      routingMethod,
      attachments: attachmentsMeta.length,
      offerId,
    });

    return new Response(
      JSON.stringify({ success: true, id: inbound.id, needsRouting }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sot-acq-inbound-webhook:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
