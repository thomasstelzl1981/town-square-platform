/**
 * Shared helper: Send email via user's connected mail account (Google/Microsoft/SMTP)
 * with automatic Resend fallback if no account is connected.
 *
 * Extracted from sot-mail-send so all outbound functions can reuse the same logic.
 */

import nodemailer from 'https://esm.sh/nodemailer@6.9.9?target=deno';

export interface UserMailSendParams {
  supabase: any;            // Service-Role client
  userId: string;           // auth.users.id
  to: string[];
  subject: string;
  bodyHtml?: string;
  bodyText?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  resendFrom?: string;      // Fallback "from" for Resend (e.g. "Armstrong <no-reply@systemofatown.de>")
}

export interface UserMailSendResult {
  method: 'user_account' | 'resend' | 'skipped';
  messageId?: string;
  error?: string;
  accountEmail?: string;
}

/**
 * Try to send via user's default mail account, fall back to Resend, or skip.
 */
export async function sendViaUserAccountOrResend(params: UserMailSendParams): Promise<UserMailSendResult> {
  const { supabase, userId, to, subject, bodyHtml, bodyText, replyTo, cc, bcc, resendFrom } = params;

  // 1. Look up user's first mail account (table has no status/is_default columns)
  const { data: accounts } = await supabase
    .from('mail_accounts')
    .select('*')
    .eq('user_id', userId)
    .limit(1);

  const account = accounts?.[0];

  if (account) {
    // 2a. Send via connected account
    console.log(`[userMailSend] Sending via ${account.provider}: ${account.email_address}`);
    let result: { success: boolean; messageId?: string; error?: string };

    if (account.provider === 'google') {
      result = await sendGoogleMail(account, { to, cc, bcc, subject, bodyHtml, bodyText, replyTo });
    } else if (account.provider === 'microsoft') {
      result = await sendMicrosoftMail(account, { to, cc, bcc, subject, bodyHtml, bodyText, replyTo });
    } else if (account.provider === 'imap') {
      result = await sendSmtpMail(account, { to, cc, bcc, subject, bodyHtml, bodyText });
    } else {
      result = { success: false, error: `Unknown provider: ${account.provider}` };
    }

    if (result.success) {
      // Store in mail_messages (Sent folder) — best effort
      try {
        const snippet = bodyText
          ? bodyText.substring(0, 200).replace(/\s+/g, ' ').trim()
          : (bodyHtml ? stripHtmlTags(bodyHtml).substring(0, 200) : '');

        await supabase.from('mail_messages').insert({
          account_id: account.id,
          message_id: result.messageId || `sent_${Date.now()}`,
          folder: 'SENT',
          subject,
          from_address: account.email_address,
          from_name: account.display_name || account.email_address.split('@')[0],
          to_addresses: to,
          body_text: bodyText || null,
          body_html: bodyHtml || null,
          snippet: snippet || '(Kein Inhalt)',
          is_read: true,
          is_starred: false,
          has_attachments: false,
          received_at: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('[userMailSend] Could not store sent message:', e);
      }

      return { method: 'user_account', messageId: result.messageId, accountEmail: account.email_address };
    } else {
      console.warn(`[userMailSend] User account send failed, falling back to Resend: ${result.error}`);
      // Fall through to Resend
    }
  }

  // 2b. Fallback: Resend
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  if (!resendApiKey) {
    console.warn('[userMailSend] No mail account and no RESEND_API_KEY — skipping');
    return { method: 'skipped', error: 'No mail account and no RESEND_API_KEY' };
  }

  const fromAddr = resendFrom || 'Armstrong <no-reply@systemofatown.de>';
  try {
    const resendBody: Record<string, unknown> = {
      from: fromAddr,
      to,
      subject,
      html: bodyHtml || undefined,
      text: bodyText || undefined,
    };
    if (replyTo) resendBody.reply_to = replyTo;
    if (cc?.length) resendBody.cc = cc;
    if (bcc?.length) resendBody.bcc = bcc;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resendBody),
    });

    const data = await res.json();
    if (res.ok) {
      return { method: 'resend', messageId: data.id };
    } else {
      return { method: 'resend', error: data.message || JSON.stringify(data) };
    }
  } catch (e) {
    return { method: 'resend', error: (e as Error).message };
  }
}

// ─── Provider implementations (extracted from sot-mail-send) ───

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

interface EmailPayload {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  bodyHtml?: string;
  bodyText?: string;
  replyTo?: string;
}

async function sendSmtpMail(
  account: any,
  email: EmailPayload
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  let password: string;
  try {
    const credentials = JSON.parse(atob(account.credentials_vault_key));
    password = credentials.password;
    if (!password) throw new Error('Password not found');
  } catch (e) {
    return { success: false, error: 'Failed to decode credentials: ' + (e as Error).message };
  }

  const port = account.smtp_port || 587;
  try {
    const transporter = nodemailer.createTransport({
      host: account.smtp_host,
      port,
      secure: port === 465,
      auth: { user: account.email_address, pass: password },
      tls: { rejectUnauthorized: false },
    });

    const fromName = account.display_name || account.email_address.split('@')[0];
    const info = await transporter.sendMail({
      from: `"${fromName}" <${account.email_address}>`,
      to: email.to.join(', '),
      cc: email.cc?.join(', '),
      bcc: email.bcc?.join(', '),
      subject: email.subject,
      text: email.bodyText || '',
      html: email.bodyHtml,
    });
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    return { success: false, error: error.message || 'SMTP send failed' };
  }
}

async function sendGoogleMail(
  account: any,
  email: EmailPayload
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!account.access_token) return { success: false, error: 'No access token' };

  const body = email.bodyHtml || email.bodyText || '';
  const contentType = email.bodyHtml ? 'text/html' : 'text/plain';

  const rawMessage = [
    `From: ${account.email_address}`,
    `To: ${email.to.join(', ')}`,
    email.cc?.length ? `Cc: ${email.cc.join(', ')}` : '',
    email.bcc?.length ? `Bcc: ${email.bcc.join(', ')}` : '',
    `Subject: ${email.subject}`,
    `Content-Type: ${contentType}; charset=utf-8`,
    email.replyTo ? `Reply-To: ${email.replyTo}` : '',
    '',
    body,
  ].filter(Boolean).join('\r\n');

  const encodedMessage = btoa(unescape(encodeURIComponent(rawMessage)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${account.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: encodedMessage }),
  });

  if (!response.ok) {
    const errData = await response.json();
    return { success: false, error: errData.error?.message || `Gmail API error: ${response.status}` };
  }
  const data = await response.json();
  return { success: true, messageId: data.id };
}

async function sendMicrosoftMail(
  account: any,
  email: EmailPayload
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!account.access_token) return { success: false, error: 'No access token' };

  const message = {
    message: {
      subject: email.subject,
      body: { contentType: email.bodyHtml ? 'HTML' : 'Text', content: email.bodyHtml || email.bodyText || '' },
      toRecipients: email.to.map(e => ({ emailAddress: { address: e } })),
      ccRecipients: email.cc?.map(e => ({ emailAddress: { address: e } })) || [],
      bccRecipients: email.bcc?.map(e => ({ emailAddress: { address: e } })) || [],
      ...(email.replyTo ? { replyTo: [{ emailAddress: { address: email.replyTo } }] } : {}),
    },
    saveToSentItems: true,
  };

  const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
    method: 'POST',
    headers: { Authorization: `Bearer ${account.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    const errData = await response.json();
    return { success: false, error: errData.error?.message || `Graph API error: ${response.status}` };
  }
  return { success: true, messageId: `ms_${Date.now()}` };
}
