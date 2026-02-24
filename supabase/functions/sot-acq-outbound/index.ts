/**
 * SOT-ACQ-OUTBOUND
 * 
 * Sends outreach emails via user mail account (preferred) or Resend fallback.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { sendViaUserAccountOrResend } from "../_shared/userMailSend.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface SendRequest {
  mandateId: string;
  contactId?: string;
  contactIds?: string[];
  templateCode: string;
  variables: Record<string, string>;
  bulk?: boolean;
}

interface CustomSendRequest {
  mode: 'custom';
  offerId?: string;
  mandateId?: string;
  toEmail: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Resolve user from auth header (needed for user-account send)
    let userId: string | null = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    const rawBody = await req.json();

    // ── CUSTOM MODE: Send pre-composed email (e.g. from PreisvorschlagDialog) ──
    if (rawBody.mode === 'custom') {
      const { toEmail, subject, bodyHtml, bodyText, mandateId: mId, offerId } = rawBody as CustomSendRequest;
      if (!toEmail || !subject) throw new Error('toEmail and subject are required for custom mode');

      const replyTo = mId ? `acq+${mId}@incoming.systemofatown.de` : undefined;

      const sendResult = await sendViaUserAccountOrResend({
        supabase,
        userId: userId || '',
        to: [toEmail],
        subject,
        bodyHtml,
        bodyText: bodyText || '',
        replyTo,
        resendFrom: 'System of a Town <noreply@systemofatown.de>',
      });

      // Log to acq_outbound_messages if mandateId exists
      if (mId) {
        await supabase.from('acq_outbound_messages').insert([{
          mandate_id: mId,
          contact_id: mId, // placeholder — no contact_id in custom mode
          template_code: 'custom_proposal',
          subject,
          body_html: bodyHtml,
          body_text: bodyText || '',
          status: sendResult.error ? 'failed' : 'sent',
          sent_at: sendResult.error ? null : new Date().toISOString(),
          sent_via: sendResult.method,
          resend_message_id: sendResult.messageId || null,
          error_message: sendResult.error || null,
        }]).select();
      }

      return new Response(
        JSON.stringify({ success: !sendResult.error, method: sendResult.method, error: sendResult.error }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ── TEMPLATE MODE (existing flow) ──
    const body: SendRequest = rawBody;
    const { mandateId, contactId, contactIds, templateCode, variables, bulk } = body;

    // Get mandate for context
    const { data: mandate } = await supabase
      .from('acq_mandates')
      .select('code, profile_text_email')
      .eq('id', mandateId)
      .single();

    // Get template
    const { data: template, error: templateError } = await supabase
      .from('acq_email_templates')
      .select('*')
      .eq('code', templateCode)
      .single();

    if (templateError || !template) {
      throw new Error(`Template ${templateCode} not found`);
    }

    // Determine contacts to send to
    const targetContactIds = bulk && contactIds ? contactIds : contactId ? [contactId] : [];
    if (targetContactIds.length === 0) throw new Error('No contacts specified');

    // Get contacts
    const { data: contacts, error: contactError } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, email, company')
      .in('id', targetContactIds);

    if (contactError || !contacts?.length) throw new Error('Contacts not found');

    const results = [];

    for (const contact of contacts) {
      if (!contact.email) {
        console.warn(`Contact ${contact.id} has no email, skipping`);
        continue;
      }

      // Render template
      const allVariables = {
        ...variables,
        firstName: contact.first_name || '',
        lastName: contact.last_name || '',
        company: contact.company || '',
        mandateCode: mandate?.code || '',
      };

      let subject = template.subject_template;
      let bodyHtml = template.body_html_template;
      let bodyText = template.body_text_template || '';

      for (const [key, value] of Object.entries(allVariables)) {
        const placeholder = `{{${key}}}`;
        subject = subject.replace(new RegExp(placeholder, 'g'), value);
        bodyHtml = bodyHtml.replace(new RegExp(placeholder, 'g'), value);
        bodyText = bodyText.replace(new RegExp(placeholder, 'g'), value);
      }

      // Create outbound record
      const { data: outbound, error: insertError } = await supabase
        .from('acq_outbound_messages')
        .insert([{
          mandate_id: mandateId,
          contact_id: contact.id,
          template_code: templateCode,
          subject,
          body_html: bodyHtml,
          body_text: bodyText,
          status: 'sending',
        }])
        .select()
        .single();

      if (insertError) {
        console.error('Failed to create outbound record:', insertError);
        continue;
      }

      const replyTo = `acq+${mandateId}+${contact.id}@incoming.systemofatown.de`;

      // Send via user account or Resend fallback
      const sendResult = userId
        ? await sendViaUserAccountOrResend({
            supabase,
            userId,
            to: [contact.email],
            subject,
            bodyHtml,
            bodyText,
            replyTo,
            resendFrom: 'System of a Town <noreply@systemofatown.de>',
          })
        : await sendViaUserAccountOrResend({
            supabase,
            userId: '', // no user — will skip to Resend
            to: [contact.email],
            subject,
            bodyHtml,
            bodyText,
            replyTo,
            resendFrom: 'System of a Town <noreply@systemofatown.de>',
          });

      if (sendResult.method !== 'skipped' && !sendResult.error) {
        await supabase
          .from('acq_outbound_messages')
          .update({
            status: 'sent',
            resend_message_id: sendResult.messageId || null,
            sent_at: new Date().toISOString(),
            sent_via: sendResult.method,
          })
          .eq('id', outbound.id);

        results.push({ contactId: contact.id, status: 'sent', method: sendResult.method, messageId: sendResult.messageId });
      } else {
        await supabase
          .from('acq_outbound_messages')
          .update({
            status: sendResult.method === 'skipped' ? 'queued' : 'failed',
            error_message: sendResult.error || null,
          })
          .eq('id', outbound.id);

        results.push({ contactId: contact.id, status: sendResult.method === 'skipped' ? 'queued' : 'failed', error: sendResult.error });
      }

      // Log audit event
      await supabase.from('acq_mandate_events').insert([{
        mandate_id: mandateId,
        event_type: 'email_sent',
        payload: {
          contact_id: contact.id,
          template_code: templateCode,
          outbound_id: outbound.id,
          sent_via: sendResult.method,
        },
      }]);
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sot-acq-outbound:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
