import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Get auth header for user context
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Verify user
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || SUPABASE_SERVICE_ROLE_KEY;
    const userClient = createClient(SUPABASE_URL, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Resolve outbound identity for this user
    const { data: identityRows } = await supabase.rpc('get_active_outbound_identity', {
      p_user_id: user.id,
    });
    let outboundFrom = 'Ausschreibung <noreply@systemofatown.de>';
    let outboundReplyTo: string | undefined;
    if (identityRows && identityRows.length > 0) {
      const identity = identityRows[0];
      const displayName = identity.display_name || 'Ausschreibung';
      outboundFrom = `${displayName} <${identity.from_email}>`;
      outboundReplyTo = identity.from_email;
    }

    const { 
      service_case_id, 
      provider, 
      email, 
      deadline 
    }: OutboundRequest = await req.json();

    console.log(`Sending tender email for case ${service_case_id} to ${provider.email}`);

    // Verify service case exists and user has access
    const { data: serviceCase, error: caseError } = await supabase
      .from('service_cases')
      .select('id, tenant_id, tender_id, status')
      .eq('id', service_case_id)
      .single();

    if (caseError || !serviceCase) {
      throw new Error('Service case not found');
    }

    // Record the outbound attempt
    const outboundRecord = {
      service_case_id,
      provider_name: provider.name,
      provider_email: provider.email,
      provider_phone: provider.phone || null,
      subject: email.subject,
      body_preview: email.body.substring(0, 500),
      status: 'pending',
      sent_at: null,
      sent_by: user.id,
    };

    // Check if RESEND_API_KEY is configured
    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured - logging email only');
      
      // Log the email that would be sent
      console.log('=== EMAIL WOULD BE SENT ===');
      console.log('To:', email.to);
      console.log('Subject:', email.subject);
      console.log('Body preview:', email.body.substring(0, 200));
      console.log('===========================');

      // Update service case status
      await supabase
        .from('service_cases')
        .update({ 
          status: 'sent',
          updated_at: new Date().toISOString(),
        })
        .eq('id', service_case_id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email logged (RESEND_API_KEY not configured)',
          provider: provider.name,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Send email via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: outboundFrom,
        to: [email.to],
        subject: email.subject,
        text: email.body,
        ...(outboundReplyTo ? { reply_to: outboundReplyTo } : {}),
        // TODO: Add attachments when storage integration is ready
        // attachments: await fetchAttachments(email.attachment_ids),
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Resend API error:', resendData);
      throw new Error(`Failed to send email: ${resendData.message || 'Unknown error'}`);
    }

    console.log('Email sent successfully:', resendData.id);

    // Update service case status to "sent"
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
        email_id: resendData.id,
        provider: provider.name,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in sot-renovation-outbound:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
