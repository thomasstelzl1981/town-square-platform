import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const DEFAULT_FROM = 'System of a Town <noreply@systemofatown.com>';

interface SystemMailRequest {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  context?: string; // e.g. "renovation_tender", "serien_email"
  from_override?: string; // e.g. "futureroom@systemofatown.com" — overrides user identity lookup
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }

    // Create service client for DB access
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify user via anon key client
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || SUPABASE_SERVICE_ROLE_KEY;
    const userClient = createClient(SUPABASE_URL, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const body: SystemMailRequest = await req.json();
    const { to, subject, html, text, context, from_override } = body;

    if (!to || !subject) {
      throw new Error('Missing required fields: to, subject');
    }

    let fromAddress = DEFAULT_FROM;
    let replyTo: string | undefined;

    // If from_override is provided, use it as desk sender (skip identity lookup)
    if (from_override) {
      fromAddress = `System of a Town <${from_override}>`;
      replyTo = from_override;
      console.log(`[sot-system-mail-send] Using from_override: ${from_override}`);
    } else {
      // Resolve outbound identity from user
      const { data: identityRows } = await supabase.rpc('get_active_outbound_identity', {
        p_user_id: user.id,
      });

      if (identityRows && identityRows.length > 0) {
        const identity = identityRows[0];
        const displayName = identity.display_name || 'Portal';
        fromAddress = `${displayName} <${identity.from_email}>`;
        replyTo = identity.from_email;
      }
    }

    console.log(`[sot-system-mail-send] context=${context || 'generic'} from=${fromAddress} to=${Array.isArray(to) ? to.join(',') : to}`);

    if (!RESEND_API_KEY) {
      console.warn('RESEND_API_KEY not configured — logging email only');
      console.log('=== EMAIL WOULD BE SENT ===');
      console.log('From:', fromAddress);
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('===========================');

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Email logged (RESEND_API_KEY not configured)',
          from: fromAddress,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send via Resend
    const recipients = Array.isArray(to) ? to : [to];
    const resendBody: Record<string, unknown> = {
      from: fromAddress,
      to: recipients,
      subject,
    };
    if (html) resendBody.html = html;
    if (text) resendBody.text = text;
    if (replyTo) resendBody.reply_to = replyTo;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resendBody),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error('Resend API error:', resendData);
      throw new Error(`Failed to send email: ${resendData.message || 'Unknown error'}`);
    }

    console.log('Email sent successfully:', resendData.id);

    return new Response(
      JSON.stringify({
        success: true,
        email_id: resendData.id,
        from: fromAddress,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in sot-system-mail-send:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
