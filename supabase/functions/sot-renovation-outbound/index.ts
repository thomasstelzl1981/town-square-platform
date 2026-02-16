import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendViaUserAccountOrResend } from "../_shared/userMailSend.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface OutboundRequest {
  service_case_id: string;
  provider: {
    name: string;
    email: string;
    phone?: string;
  };
  email: {
    to: string;
    subject: string;
    body: string;
    attachment_ids?: string[];
  };
  deadline?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Get auth header for user context
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Authorization header required');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error('Unauthorized');

    const {
      service_case_id,
      provider,
      email,
      deadline,
    }: OutboundRequest = await req.json();

    console.log(`Sending tender email for case ${service_case_id} to ${provider.email}`);

    // Verify service case exists
    const { data: serviceCase, error: caseError } = await supabase
      .from('service_cases')
      .select('id, tenant_id, tender_id, status')
      .eq('id', service_case_id)
      .single();

    if (caseError || !serviceCase) throw new Error('Service case not found');

    // Send via user account or Resend fallback
    const sendResult = await sendViaUserAccountOrResend({
      supabase,
      userId: user.id,
      to: [email.to],
      subject: email.subject,
      bodyText: email.body,
      resendFrom: 'Ausschreibung <noreply@systemofatown.de>',
    });

    if (sendResult.method === 'skipped') {
      console.warn('No mail account and no RESEND_API_KEY — logging email only');
    }

    console.log(`Email sent via ${sendResult.method}: ${sendResult.messageId || 'n/a'}`);

    // Update service case status
    await supabase
      .from('service_cases')
      .update({
        status: 'sent',
        deadline_offers: deadline || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', service_case_id);

    return new Response(
      JSON.stringify({
        success: true,
        email_id: sendResult.messageId,
        provider: provider.name,
        sent_via: sendResult.method,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in sot-renovation-outbound:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
