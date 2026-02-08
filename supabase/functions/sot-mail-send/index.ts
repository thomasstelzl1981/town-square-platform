/**
 * SOT-MAIL-SEND Edge Function
 * 
 * Sends emails via connected mail accounts:
 * - IMAP: Uses SMTP via denomailer
 * - Google: Uses Gmail API
 * - Microsoft: Uses Graph API
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SmtpClient } from 'https://deno.land/x/smtp@v0.7.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface SendEmailRequest {
  accountId: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyHtml?: string;
  bodyText?: string;
  replyToMessageId?: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: SendEmailRequest = await req.json();
    const { accountId, to, cc, bcc, subject, bodyHtml, bodyText, replyToMessageId } = body;

    // Validate required fields
    if (!accountId || !to?.length || !subject) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: accountId, to, subject' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the mail account
    const { data: account, error: accountError } = await supabase
      .from('mail_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', user.id)
      .single();

    if (accountError || !account) {
      return new Response(
        JSON.stringify({ error: 'Account not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Sending email via ${account.provider}: ${account.email_address} -> ${to.join(', ')}`);

    let result: { success: boolean; messageId?: string; error?: string };

    if (account.provider === 'google') {
      result = await sendGoogleMail(account, { to, cc, bcc, subject, bodyHtml, bodyText, replyToMessageId });
    } else if (account.provider === 'microsoft') {
      result = await sendMicrosoftMail(account, { to, cc, bcc, subject, bodyHtml, bodyText, replyToMessageId });
    } else if (account.provider === 'imap') {
      result = await sendSmtpMail(account, { to, cc, bcc, subject, bodyHtml, bodyText });
    } else {
      result = { success: false, error: 'Unknown provider' };
    }

    if (result.success) {
      console.log(`Email sent successfully: ${result.messageId}`);
      return new Response(
        JSON.stringify({ success: true, messageId: result.messageId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      console.error(`Email send failed: ${result.error}`);
      return new Response(
        JSON.stringify({ error: result.error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    console.error('Mail send error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Send email via SMTP using deno-smtp
async function sendSmtpMail(
  account: any,
  email: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    bodyHtml?: string;
    bodyText?: string;
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  console.log(`SMTP send for ${account.email_address} via ${account.smtp_host}:${account.smtp_port}`);
  
  // Decode credentials from base64
  let password: string;
  try {
    const credentials = JSON.parse(atob(account.credentials_vault_key));
    password = credentials.password;
    if (!password) throw new Error('Password not found in credentials');
  } catch (e) {
    return { success: false, error: 'Failed to decode credentials: ' + (e as Error).message };
  }

  const client = new SmtpClient();
  const port = account.smtp_port || 587;

  try {
    console.log('Connecting to SMTP server...');
    
    // Connect based on port (465 = TLS, 587 = STARTTLS)
    if (port === 465) {
      await client.connectTLS({
        hostname: account.smtp_host,
        port: port,
        username: account.email_address,
        password: password,
      });
    } else {
      await client.connect({
        hostname: account.smtp_host,
        port: port,
        username: account.email_address,
        password: password,
      });
    }
    
    console.log('Connected, sending email...');

    const messageId = `<${Date.now()}.${Math.random().toString(36).substr(2, 9)}@${account.smtp_host}>`;
    const fromName = account.display_name || account.email_address.split('@')[0];

    // Build email content
    const content = email.bodyHtml 
      ? `Content-Type: text/html; charset=utf-8\r\n\r\n${email.bodyHtml}`
      : (email.bodyText || '');

    await client.send({
      from: `"${fromName}" <${account.email_address}>`,
      to: email.to,
      cc: email.cc,
      bcc: email.bcc,
      subject: email.subject,
      content: email.bodyText || '',
      html: email.bodyHtml,
    });

    await client.close();
    console.log('Email sent successfully');
    return { success: true, messageId };

  } catch (error: any) {
    console.error('SMTP send failed:', error);
    try {
      await client.close();
    } catch {
      // Ignore close errors
    }
    return { success: false, error: error.message || 'SMTP send failed' };
  }
}

// Send email via Gmail API
async function sendGoogleMail(
  account: any,
  email: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    bodyHtml?: string;
    bodyText?: string;
    replyToMessageId?: string;
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!account.access_token) {
    return { success: false, error: 'No access token available' };
  }

  // Build RFC 2822 email message
  const body = email.bodyHtml || email.bodyText || '';
  const contentType = email.bodyHtml ? 'text/html' : 'text/plain';
  
  let rawMessage = [
    `From: ${account.email_address}`,
    `To: ${email.to.join(', ')}`,
    email.cc?.length ? `Cc: ${email.cc.join(', ')}` : '',
    email.bcc?.length ? `Bcc: ${email.bcc.join(', ')}` : '',
    `Subject: ${email.subject}`,
    `Content-Type: ${contentType}; charset=utf-8`,
    email.replyToMessageId ? `In-Reply-To: ${email.replyToMessageId}` : '',
    '',
    body,
  ].filter(Boolean).join('\r\n');

  // Base64 encode for Gmail API
  const encodedMessage = btoa(unescape(encodeURIComponent(rawMessage)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${account.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encodedMessage }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    return { 
      success: false, 
      error: errorData.error?.message || `Gmail API error: ${response.status}` 
    };
  }

  const data = await response.json();
  return { success: true, messageId: data.id };
}

// Send email via Microsoft Graph API
async function sendMicrosoftMail(
  account: any,
  email: {
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    bodyHtml?: string;
    bodyText?: string;
    replyToMessageId?: string;
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!account.access_token) {
    return { success: false, error: 'No access token available' };
  }

  const message = {
    message: {
      subject: email.subject,
      body: {
        contentType: email.bodyHtml ? 'HTML' : 'Text',
        content: email.bodyHtml || email.bodyText || '',
      },
      toRecipients: email.to.map(e => ({ emailAddress: { address: e } })),
      ccRecipients: email.cc?.map(e => ({ emailAddress: { address: e } })) || [],
      bccRecipients: email.bcc?.map(e => ({ emailAddress: { address: e } })) || [],
    },
    saveToSentItems: true,
  };

  const response = await fetch(
    'https://graph.microsoft.com/v1.0/me/sendMail',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${account.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    return { 
      success: false, 
      error: errorData.error?.message || `Graph API error: ${response.status}` 
    };
  }

  return { success: true, messageId: `ms_${Date.now()}` };
}
