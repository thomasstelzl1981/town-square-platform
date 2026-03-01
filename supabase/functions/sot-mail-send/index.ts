/**
 * SOT-MAIL-SEND Edge Function
 * 
 * Sends emails via connected mail accounts:
 * - IMAP: Uses SMTP via nodemailer
 * - Google: Uses Gmail API
 * - Microsoft: Uses Graph API
 * 
 * After sending, the email is stored locally in mail_messages for the Sent folder.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// NOTE: Deno Edge runtime cannot resolve `npm:` specifiers without additional configuration.
// We load Nodemailer via esm.sh instead to keep this function buildable.
import nodemailer from 'https://esm.sh/nodemailer@6.9.9?target=deno';

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

    // Get the mail account (explicit fields — never expose tokens unnecessarily)
    const { data: account, error: accountError } = await supabase
      .from('mail_accounts')
      .select('id, tenant_id, user_id, provider, email_address, display_name, imap_host, imap_port, smtp_host, smtp_port, credentials_vault_key, access_token, refresh_token, token_expires_at')
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
      
      // Store the sent email in mail_messages for the SENT folder
      try {
        const sentAt = new Date().toISOString();
        const displayName = account.display_name || account.email_address.split('@')[0];
        
        // Create a snippet from body text
        const snippet = bodyText 
          ? bodyText.substring(0, 200).replace(/\s+/g, ' ').trim()
          : (bodyHtml ? stripHtmlTags(bodyHtml).substring(0, 200) : '');
        
        const { error: insertError } = await supabase
          .from('mail_messages')
          .insert({
            account_id: accountId,
            message_id: result.messageId || `sent_${Date.now()}`,
            folder: 'SENT',
            subject: subject,
            from_address: account.email_address,
            from_name: displayName,
            to_addresses: to,
            body_text: bodyText || null,
            body_html: bodyHtml || null,
            snippet: snippet || '(Kein Inhalt)',
            is_read: true, // Sent emails are always "read"
            is_starred: false,
            has_attachments: false,
            received_at: sentAt,
          });
        
        if (insertError) {
          console.error('Error storing sent email:', insertError);
          // Don't fail the request - email was sent successfully
        } else {
          console.log('Sent email stored in mail_messages');
        }
      } catch (storeError) {
        console.error('Error storing sent email:', storeError);
        // Don't fail the request - email was sent successfully
      }
      
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

// Simple HTML tag stripper for creating snippets
function stripHtmlTags(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

// Send email via SMTP using nodemailer
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

  const port = account.smtp_port || 587;

  try {
    // Create nodemailer transport
    const transporter = nodemailer.createTransport({
      host: account.smtp_host,
      port: port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user: account.email_address,
        pass: password,
      },
      tls: {
        // Do not fail on invalid certs
        rejectUnauthorized: false,
      },
    });

    console.log('Sending email via nodemailer...');

    const fromName = account.display_name || account.email_address.split('@')[0];

    // Send email
    const info = await transporter.sendMail({
      from: `"${fromName}" <${account.email_address}>`,
      to: email.to.join(', '),
      cc: email.cc?.join(', '),
      bcc: email.bcc?.join(', '),
      subject: email.subject,
      text: email.bodyText || '',
      html: email.bodyHtml,
    });

    console.log('Email sent successfully, messageId:', info.messageId);
    return { success: true, messageId: info.messageId };

  } catch (error: any) {
    console.error('SMTP send failed:', error);
    return { success: false, error: error.message || 'SMTP send failed' };
  }
}

// Refresh Google access token
async function refreshGoogleAccessToken(account: any): Promise<string> {
  const clientId = Deno.env.get('GOOGLE_DRIVE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_DRIVE_CLIENT_SECRET');
  if (!clientId || !clientSecret || !account.refresh_token) {
    throw new Error('Cannot refresh token — missing credentials');
  }
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: account.refresh_token,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) throw new Error('Token refresh failed');
  return data.access_token;
}

// Send email via Gmail API with automatic token refresh
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
  let accessToken = account.access_token;
  if (!accessToken && account.refresh_token) {
    try { accessToken = await refreshGoogleAccessToken(account); } catch (e: any) {
      return { success: false, error: e.message };
    }
  }
  if (!accessToken) return { success: false, error: 'No access token available' };

  // Build RFC 2822 email message
  const body = email.bodyHtml || email.bodyText || '';
  const contentType = email.bodyHtml ? 'text/html' : 'text/plain';
  
  const headers = [
    `From: ${account.email_address}`,
    `To: ${email.to.join(', ')}`,
    email.cc?.length ? `Cc: ${email.cc.join(', ')}` : '',
    email.bcc?.length ? `Bcc: ${email.bcc.join(', ')}` : '',
    `Subject: ${email.subject}`,
    `Content-Type: ${contentType}; charset=utf-8`,
    email.replyToMessageId ? `In-Reply-To: ${email.replyToMessageId}` : '',
  ].filter(Boolean).join('\r\n');

  const rawMessage = headers + '\r\n\r\n' + body;

  const encodedMessage = btoa(unescape(encodeURIComponent(rawMessage)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  let response = await fetch(
    'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ raw: encodedMessage }),
    }
  );

  // Auto-refresh on 401
  if (response.status === 401 && account.refresh_token) {
    await response.text();
    try { accessToken = await refreshGoogleAccessToken(account); } catch (e: any) {
      return { success: false, error: e.message };
    }
    response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw: encodedMessage }),
      }
    );
  }

  if (!response.ok) {
    const errorData = await response.json();
    return { success: false, error: errorData.error?.message || `Gmail API error: ${response.status}` };
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
