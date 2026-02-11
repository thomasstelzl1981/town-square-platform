import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logDataEvent } from "../_shared/ledger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const THROTTLE_MS = 500; // ~2 per second

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Authorization header required');

    // Verify user
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || SUPABASE_SERVICE_ROLE_KEY;
    const userClient = createClient(SUPABASE_URL, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) throw new Error('Unauthorized');

    const { campaign_id } = await req.json();
    if (!campaign_id) throw new Error('campaign_id required');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Load campaign
    const { data: campaign, error: campErr } = await supabase
      .from('mail_campaigns')
      .select('*')
      .eq('id', campaign_id)
      .eq('user_id', user.id)
      .single();

    if (campErr || !campaign) throw new Error('Campaign not found or not owned by user');
    if (campaign.status !== 'draft') throw new Error(`Campaign status is ${campaign.status}, expected draft`);

    // Set status to sending
    await supabase.from('mail_campaigns').update({ status: 'sending' }).eq('id', campaign_id);

    // Load recipients
    const { data: recipients, error: recErr } = await supabase
      .from('mail_campaign_recipients')
      .select('*')
      .eq('campaign_id', campaign_id)
      .eq('delivery_status', 'queued');

    if (recErr) throw new Error('Failed to load recipients');
    if (!recipients || recipients.length === 0) throw new Error('No queued recipients');

    // Load outbound identity
    const { data: identityRows } = await supabase.rpc('get_active_outbound_identity', {
      p_user_id: user.id,
    });

    let fromAddress = 'System of a Town <noreply@systemofatown.com>';
    let replyTo: string | undefined;

    if (identityRows && identityRows.length > 0) {
      const identity = identityRows[0];
      const displayName = identity.display_name || 'Portal';
      fromAddress = `${displayName} <${identity.from_email}>`;
      replyTo = identity.from_email;
    }

    // Load signature if needed
    let signature = '';
    if (campaign.include_signature) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('email_signature')
        .eq('id', user.id)
        .single();
      if (profileData?.email_signature) {
        signature = `\n\n---\n${profileData.email_signature}`;
      }
    }

    // Load attachments for link insertion
    const { data: attachments } = await supabase
      .from('mail_campaign_attachments')
      .select('*')
      .eq('campaign_id', campaign_id);

    let attachmentLinks = '';
    if (attachments && attachments.length > 0) {
      const links: string[] = [];
      for (const att of attachments) {
        const { data: signedUrl } = await supabase.storage
          .from('tenant-documents')
          .createSignedUrl(att.storage_path, 7 * 24 * 60 * 60); // 7 days
        if (signedUrl?.signedUrl) {
          links.push(`📎 ${att.filename}: ${signedUrl.signedUrl}`);
        }
      }
      if (links.length > 0) {
        attachmentLinks = `\n\n--- Anhänge ---\n${links.join('\n')}`;
      }
    }

    console.log(`[sot-serien-email-send] Sending ${recipients.length} emails for campaign ${campaign_id}`);

    let sentCount = 0;
    let failedCount = 0;

    for (const recipient of recipients) {
      try {
        // Replace placeholders
        let subject = campaign.subject_template || '';
        let body = campaign.body_template || '';

        const replacements: Record<string, string> = {
          '{{first_name}}': recipient.first_name || '',
          '{{last_name}}': recipient.last_name || '',
          '{{company}}': recipient.company || '',
          '{{city}}': recipient.city || '',
        };

        for (const [placeholder, value] of Object.entries(replacements)) {
          subject = subject.replaceAll(placeholder, value);
          body = body.replaceAll(placeholder, value);
        }

        // Append signature and attachment links
        const fullBody = body + attachmentLinks + signature;

        if (!RESEND_API_KEY) {
          // Log-only mode
          console.log(`[LOG] To: ${recipient.email}, Subject: ${subject}`);
          await supabase.from('mail_campaign_recipients').update({
            delivery_status: 'sent',
            sent_at: new Date().toISOString(),
          }).eq('id', recipient.id);
          sentCount++;
        } else {
          // Send via Resend
          const resendBody: Record<string, unknown> = {
            from: fromAddress,
            to: [recipient.email],
            subject,
            text: fullBody,
          };
          if (replyTo) resendBody.reply_to = replyTo;

          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${RESEND_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(resendBody),
          });

          if (res.ok) {
            await supabase.from('mail_campaign_recipients').update({
              delivery_status: 'sent',
              sent_at: new Date().toISOString(),
            }).eq('id', recipient.id);
            sentCount++;
          } else {
            const errData = await res.json();
            await supabase.from('mail_campaign_recipients').update({
              delivery_status: 'failed',
              error: errData.message || 'Send failed',
            }).eq('id', recipient.id);
            failedCount++;
          }
        }

        // Throttle
        if (THROTTLE_MS > 0) {
          await new Promise(r => setTimeout(r, THROTTLE_MS));
        }
      } catch (err) {
        await supabase.from('mail_campaign_recipients').update({
          delivery_status: 'failed',
          error: err instanceof Error ? err.message : 'Unknown error',
        }).eq('id', recipient.id);
        failedCount++;
      }
    }

    // Update campaign
    const finalStatus = failedCount === recipients.length ? 'failed' : 'sent';
    await supabase.from('mail_campaigns').update({
      status: finalStatus,
      sent_at: new Date().toISOString(),
      sent_count: sentCount,
      failed_count: failedCount,
      recipients_count: recipients.length,
    }).eq('id', campaign_id);

    // DSGVO Ledger
    await logDataEvent(supabase, {
      zone: "Z2",
      actor_user_id: user.id,
      event_type: "outbound.email.sent",
      direction: "egress",
      source: "resend",
      entity_type: "mail_campaign",
      entity_id: campaign_id,
      payload: {
        campaign_id,
        recipient_count: recipients.length,
        status: finalStatus,
      },
    }, req);

    return new Response(
      JSON.stringify({
        success: true,
        sent_count: sentCount,
        failed_count: failedCount,
        total: recipients.length,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in sot-serien-email-send:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
