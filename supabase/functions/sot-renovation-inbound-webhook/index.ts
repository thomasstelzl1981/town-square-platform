import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-resend-webhook-signature',
};

interface ResendWebhookPayload {
  type: string;
  created_at: string;
  data: {
    from: string;
    to: string[];
    subject: string;
    text?: string;
    html?: string;
    attachments?: Array<{
      filename: string;
      content_type: string;
      content?: string;
    }>;
  };
}

// Extract tender ID from subject or body
function extractTenderId(subject: string | undefined, body: string | undefined): string | null {
  const patterns = [
    /TND-[A-Z0-9]+-\d{6}-\d+/i, // Standard format: TND-ORG-YYMMDD-SEQ
    /Tender-ID[:\s]+([A-Z0-9-]+)/i,
    /Ausschreibung[:\s]+([A-Z0-9-]+)/i,
  ];

  const textToSearch = `${subject || ''} ${body || ''}`;

  for (const pattern of patterns) {
    const match = textToSearch.match(pattern);
    if (match) {
      return match[0].startsWith('TND') ? match[0] : match[1];
    }
  }

  return null;
}

// Determine match confidence
function getMatchConfidence(
  tenderId: string | null, 
  method: string | null
): 'none' | 'low' | 'medium' | 'high' | 'exact' {
  if (!tenderId) return 'none';
  if (method === 'tender_id_subject') return 'exact';
  if (method === 'tender_id_body') return 'high';
  if (method === 'sender_email') return 'medium';
  return 'low';
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const RESEND_WEBHOOK_SECRET = Deno.env.get('RESEND_WEBHOOK_SECRET');

    // TODO: Verify webhook signature if secret is configured
    // const signature = req.headers.get('x-resend-webhook-signature');

    const payload: ResendWebhookPayload = await req.json();
    console.log('Received inbound webhook:', payload.type);

    // Only process email.received events
    if (payload.type !== 'email.received') {
      return new Response(
        JSON.stringify({ message: 'Event type not processed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const emailData = payload.data;

    // Extract tender ID
    const tenderIdFromSubject = extractTenderId(emailData.subject, undefined);
    const tenderIdFromBody = extractTenderId(undefined, emailData.text);
    const tenderId = tenderIdFromSubject || tenderIdFromBody;
    const matchMethod = tenderIdFromSubject 
      ? 'tender_id_subject' 
      : tenderIdFromBody 
        ? 'tender_id_body' 
        : null;

    console.log(`Extracted tender ID: ${tenderId} (method: ${matchMethod})`);

    // Try to find matching service case
    let serviceCaseId: string | null = null;
    let tenantId: string | null = null;

    if (tenderId) {
      const { data: serviceCase } = await supabase
        .from('service_cases')
        .select('id, tenant_id')
        .eq('tender_id', tenderId)
        .maybeSingle();

      if (serviceCase) {
        serviceCaseId = serviceCase.id;
        tenantId = serviceCase.tenant_id;
        console.log(`Matched to service case: ${serviceCaseId}`);
      }
    }

    // If no match by tender ID, try to match by sender email
    if (!serviceCaseId) {
      const senderEmail = emailData.from;
      const { data: provider } = await supabase
        .from('service_case_providers')
        .select('service_case_id, tenant_id')
        .eq('provider_email', senderEmail)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (provider) {
        serviceCaseId = provider.service_case_id;
        tenantId = provider.tenant_id;
        console.log(`Matched by sender email: ${serviceCaseId}`);
      }
    }

    // If still no tenant, we can't store (need tenant_id for RLS)
    if (!tenantId) {
      console.warn('Could not determine tenant for inbound email');
      // TODO: Route to system admin inbox or default tenant
      return new Response(
        JSON.stringify({ 
          message: 'Could not determine tenant', 
          tenderId,
          from: emailData.from,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse sender info
    const senderMatch = emailData.from.match(/^(.+?)\s*<(.+?)>$/);
    const senderName = senderMatch ? senderMatch[1].trim() : null;
    const senderEmail = senderMatch ? senderMatch[2] : emailData.from;

    // Store inbound record
    const { data: inbound, error: insertError } = await supabase
      .from('service_case_inbound')
      .insert({
        tenant_id: tenantId,
        service_case_id: serviceCaseId,
        sender_email: senderEmail,
        sender_name: senderName,
        subject: emailData.subject,
        body_text: emailData.text,
        body_html: emailData.html,
        matched_tender_id: tenderId,
        match_confidence: getMatchConfidence(tenderId, matchMethod),
        match_method: matchMethod,
        status: serviceCaseId ? 'matched' : 'pending',
        attachments: emailData.attachments?.map(a => ({
          filename: a.filename,
          content_type: a.content_type,
        })) || [],
        raw_payload: payload,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error storing inbound:', insertError);
      throw insertError;
    }

    console.log(`Stored inbound record: ${inbound.id}`);

    // If matched, update service case status
    if (serviceCaseId) {
      await supabase
        .from('service_cases')
        .update({ 
          status: 'offers_received',
          updated_at: new Date().toISOString(),
        })
        .eq('id', serviceCaseId)
        .eq('status', 'sent'); // Only update if still in 'sent' status

      // Update provider record if exists
      await supabase
        .from('service_case_providers')
        .update({
          response_received: true,
          response_inbound_id: inbound.id,
        })
        .eq('service_case_id', serviceCaseId)
        .eq('provider_email', senderEmail);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        inbound_id: inbound.id,
        matched: !!serviceCaseId,
        tender_id: tenderId,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in sot-renovation-inbound-webhook:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
