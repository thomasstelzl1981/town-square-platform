/**
 * SOT-MAIL-FETCH-BODY Edge Function
 * 
 * On-demand body fetch for a single email via IMAP.
 * Called when the user opens an email that has no body content.
 * Uses multiple fetch strategies with charset awareness and auto-retry.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ImapClient } from 'jsr:@workingdevshero/deno-imap';
import { decode as decodeBase64 } from 'https://deno.land/std@0.168.0/encoding/base64.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MAX_BODY_SIZE = 500 * 1024;

/** Extract charset from Content-Type header */
function extractCharset(contentTypeLine: string): string {
  const match = contentTypeLine.match(/charset=["']?([^"';\s]+)/i);
  return match ? match[1].toLowerCase() : 'utf-8';
}

/** Decode bytes with a specific charset, falling back to utf-8 */
function decodeWithCharset(bytes: Uint8Array, charset: string): string {
  try {
    return new TextDecoder(charset, { fatal: false }).decode(bytes);
  } catch {
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  }
}

/**
 * Extract charset from bodyStructure, handling various deno-imap property names
 */
function extractCharsetFromBodyStructure(bs: any): string {
  if (!bs) return 'utf-8';
  const params = bs.parameters ?? bs.params ?? bs.parameter ?? {};
  const charset = params.charset ?? params.CHARSET ?? params.Charset ?? '';
  if (charset) return charset.toLowerCase();
  if (Array.isArray(bs.extensionData)) {
    for (let i = 0; i < bs.extensionData.length - 1; i++) {
      if (String(bs.extensionData[i]).toLowerCase() === 'charset') {
        return String(bs.extensionData[i + 1]).toLowerCase();
      }
    }
  }
  return 'utf-8';
}

/**
 * Decode QP content with charset awareness — byte-based version
 */
function decodeQuotedPrintable(input: string, charset = 'utf-8'): string {
  const noSoftBreaks = input.replace(/=\r?\n/g, '');
  const byteValues: number[] = [];
  let i = 0;
  while (i < noSoftBreaks.length) {
    if (noSoftBreaks[i] === '=' && i + 2 < noSoftBreaks.length) {
      const hex = noSoftBreaks.slice(i + 1, i + 3);
      if (/^[0-9A-Fa-f]{2}$/.test(hex)) {
        byteValues.push(parseInt(hex, 16));
        i += 3;
        continue;
      }
    }
    byteValues.push(noSoftBreaks.charCodeAt(i) & 0xFF);
    i++;
  }
  const bytes = new Uint8Array(byteValues);
  return decodeWithCharset(bytes, charset);
}

function decodeBase64Content(input: string, charset = 'utf-8'): string {
  try {
    const cleaned = input.replace(/\s/g, '');
    const bytes = decodeBase64(cleaned);
    return decodeWithCharset(bytes, charset);
  } catch {
    return input;
  }
}

function parseMimeMessage(rawMessage: string): { text: string; html: string } {
  let text = '';
  let html = '';

  const contentTypeMatch = rawMessage.match(/Content-Type:\s*multipart\/[^;]+;\s*boundary="?([^"\r\n]+)"?/i);
  
  if (contentTypeMatch) {
    const boundary = contentTypeMatch[1];
    const parts = rawMessage.split('--' + boundary);
    
    for (const part of parts) {
      if (!part.trim() || part.trim() === '--') continue;
      
      const partContentTypeFull = part.match(/Content-Type:\s*([^\r\n]+)/i)?.[1] || '';
      const partContentType = partContentTypeFull.split(';')[0].trim().toLowerCase();
      const charset = extractCharset(partContentTypeFull);
      const transferEncoding = part.match(/Content-Transfer-Encoding:\s*([^\r\n]+)/i)?.[1]?.trim().toLowerCase();
      const contentDisposition = part.match(/Content-Disposition:\s*([^;\r\n]+)/i)?.[1]?.trim().toLowerCase();
      
      if (contentDisposition === 'attachment') continue;
      
      const bodyMatch = part.match(/\r?\n\r?\n([\s\S]*)/);
      if (!bodyMatch) continue;
      
      let bodyContent = bodyMatch[1].trim();
      
      if (transferEncoding === 'quoted-printable') {
        bodyContent = decodeQuotedPrintable(bodyContent, charset);
      } else if (transferEncoding === 'base64') {
        bodyContent = decodeBase64Content(bodyContent, charset);
      } else if (charset !== 'utf-8' && charset !== 'us-ascii') {
        try {
          const bytes = new Uint8Array(bodyContent.length);
          for (let i = 0; i < bodyContent.length; i++) bytes[i] = bodyContent.charCodeAt(i) & 0xFF;
          bodyContent = decodeWithCharset(bytes, charset);
        } catch { /* keep as-is */ }
      }
      
      if (partContentType?.startsWith('multipart/')) {
        const nested = parseMimeMessage(part);
        if (nested.text && !text) text = nested.text;
        if (nested.html && !html) html = nested.html;
      } else if (partContentType === 'text/plain') {
        if (!text) text = bodyContent;
      } else if (partContentType === 'text/html') {
        if (!html) html = bodyContent;
      }
    }
  } else {
    const contentTypeFull = rawMessage.match(/Content-Type:\s*([^\r\n]+)/i)?.[1] || 'text/plain';
    const contentType = contentTypeFull.split(';')[0].trim().toLowerCase();
    const charset = extractCharset(contentTypeFull);
    const transferEncoding = rawMessage.match(/Content-Transfer-Encoding:\s*([^\r\n]+)/i)?.[1]?.trim().toLowerCase();
    
    const bodyMatch = rawMessage.match(/\r?\n\r?\n([\s\S]*)/);
    if (bodyMatch) {
      let bodyContent = bodyMatch[1].trim();
      if (transferEncoding === 'quoted-printable') bodyContent = decodeQuotedPrintable(bodyContent, charset);
      else if (transferEncoding === 'base64') bodyContent = decodeBase64Content(bodyContent, charset);
      
      if (contentType === 'text/html') html = bodyContent;
      else text = bodyContent;
    }
  }

  return { text, html };
}

function stripHtml(html: string): string {
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

function truncate(str: string, maxLen: number): string {
  return str.length <= maxLen ? str : str.substring(0, maxLen);
}

/** Core fetch logic — extracted for retry */
async function attemptFetchBody(
  account: any,
  password: string,
  messageUid: string,
  folder: string,
): Promise<{ bodyText: string; bodyHtml: string }> {
  const client = new ImapClient({
    host: account.imap_host,
    port: account.imap_port || 993,
    tls: true,
    username: account.email_address,
    password: password,
  });

  let bodyText = '';
  let bodyHtml = '';

  // 20s timeout
  const timeoutId = setTimeout(() => {
    try { client.disconnect(); } catch { /* ignore */ }
  }, 20_000);

  try {
    await client.connect();
    await client.authenticate();

    const FOLDER_MAPPINGS: Record<string, string[]> = {
      'INBOX': ['INBOX'],
      'SENT': ['Sent', 'Sent Items', 'Gesendet', 'INBOX.Sent'],
      'DRAFTS': ['Drafts', 'INBOX.Drafts'],
      'TRASH': ['Trash', 'Deleted Items', 'Papierkorb', 'INBOX.Trash'],
      'ARCHIVE': ['Archive', 'Archiv', 'INBOX.Archive'],
      'SPAM': ['Spam', 'Junk', 'INBOX.Spam'],
    };

    const possibleFolders = FOLDER_MAPPINGS[folder] || [folder];
    let mailboxSelected = false;

    for (const tryFolder of possibleFolders) {
      try {
        await client.selectMailbox(tryFolder);
        mailboxSelected = true;
        console.log(`[fetch-body] Selected mailbox: ${tryFolder}`);
        break;
      } catch {
        // try next
      }
    }

    if (!mailboxSelected) {
      throw new Error(`Could not select mailbox for folder ${folder}`);
    }

    // Strategy 1: bodyParts ['1']
    try {
      console.log(`[fetch-body] Strategy 1: BODY[1]`);
      const msgs = await client.fetch(`${messageUid}`, { bodyParts: ['1'], bodyStructure: true }, true);
      const msg = msgs?.[0];
      const part = msg?.bodyParts?.get?.('1') || msg?.bodyParts?.['1'];
      if (part) {
        // Extract charset from bodyStructure
        let charset = 'utf-8';
        let encoding = '';
        if (msg?.bodyStructure) {
          charset = extractCharsetFromBodyStructure(msg.bodyStructure);
          encoding = (msg.bodyStructure.encoding ?? msg.bodyStructure.bodyEncoding ?? '').toLowerCase();
        }

        let content = (part instanceof Uint8Array) 
          ? decodeWithCharset(part, charset)
          : String(part);
        
        // Apply transfer-encoding if raw
        if (encoding === 'base64' && content.match(/^[A-Za-z0-9+/=\s]+$/)) {
          content = decodeBase64Content(content, charset);
        } else if (encoding === 'quoted-printable' && content.includes('=')) {
          content = decodeQuotedPrintable(content, charset);
        }

        if (content.length > 10) {
          if (content.includes('<html') || content.includes('<body') || content.includes('<div')) {
            bodyHtml = truncate(content, MAX_BODY_SIZE);
          } else {
            bodyText = truncate(content, MAX_BODY_SIZE);
          }
          console.log(`[fetch-body] Strategy 1 success: text=${bodyText.length}b, html=${bodyHtml.length}b`);
        }
      }
    } catch (e) {
      console.error(`[fetch-body] Strategy 1 failed:`, e);
    }

    // Strategy 2: bodyParts ['TEXT']
    if (!bodyText && !bodyHtml) {
      try {
        console.log(`[fetch-body] Strategy 2: BODY[TEXT]`);
        const msgs = await client.fetch(`${messageUid}`, { bodyParts: ['TEXT'] }, true);
        const msg = msgs?.[0];
        const part = msg?.bodyParts?.get?.('TEXT') || msg?.bodyParts?.TEXT;
        if (part) {
          const content = (part instanceof Uint8Array)
            ? new TextDecoder('utf-8', { fatal: false }).decode(part)
            : String(part);
          if (content.length > 10) {
            const parsed = parseMimeMessage(content);
            bodyText = truncate(parsed.text, MAX_BODY_SIZE);
            bodyHtml = truncate(parsed.html, MAX_BODY_SIZE);
            console.log(`[fetch-body] Strategy 2 success: text=${bodyText.length}b, html=${bodyHtml.length}b`);
          }
        }
      } catch (e) {
        console.error(`[fetch-body] Strategy 2 failed:`, e);
      }
    }

    // Strategy 3: full RFC822
    if (!bodyText && !bodyHtml) {
      try {
        console.log(`[fetch-body] Strategy 3: full RFC822`);
        const msgs = await client.fetch(`${messageUid}`, { full: true }, true);
        const msg = msgs?.[0];
        if (msg?.raw) {
          const rawMessage = (msg.raw instanceof Uint8Array)
            ? new TextDecoder('utf-8', { fatal: false }).decode(msg.raw)
            : String(msg.raw);
          if (rawMessage.length > 0) {
            const parsed = parseMimeMessage(rawMessage);
            bodyText = truncate(parsed.text, MAX_BODY_SIZE);
            bodyHtml = truncate(parsed.html, MAX_BODY_SIZE);
            console.log(`[fetch-body] Strategy 3 success: text=${bodyText.length}b, html=${bodyHtml.length}b`);
          }
        }
      } catch (e) {
        console.error(`[fetch-body] Strategy 3 failed:`, e);
      }
    }

    // Strategy 4: nested MIME parts
    if (!bodyText && !bodyHtml) {
      for (const partId of ['1.1', '1.2', '2']) {
        try {
          console.log(`[fetch-body] Strategy 4: BODY[${partId}]`);
          const msgs = await client.fetch(`${messageUid}`, { bodyParts: [partId] }, true);
          const msg = msgs?.[0];
          const part = msg?.bodyParts?.get?.(partId) || msg?.bodyParts?.[partId];
          if (part) {
            const content = (part instanceof Uint8Array)
              ? new TextDecoder('utf-8', { fatal: false }).decode(part)
              : String(part);
            if (content.length > 10) {
              if (content.includes('<html') || content.includes('<body') || content.includes('<div')) {
                bodyHtml = truncate(content, MAX_BODY_SIZE);
              } else {
                bodyText = truncate(content, MAX_BODY_SIZE);
              }
              console.log(`[fetch-body] Strategy 4[${partId}] success: text=${bodyText.length}b, html=${bodyHtml.length}b`);
              if (bodyText || bodyHtml) break;
            }
          }
        } catch (e) {
          console.error(`[fetch-body] Strategy 4[${partId}] failed:`, e);
        }
      }
    }

    await client.disconnect();
  } catch (imapError) {
    console.error(`[fetch-body] IMAP error:`, imapError);
    try { await client.disconnect(); } catch { /* ignore */ }
  } finally {
    clearTimeout(timeoutId);
  }

  return { bodyText, bodyHtml };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { messageId, uid } = await req.json();
    if (!messageId) {
      return new Response(JSON.stringify({ error: 'Missing messageId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: message, error: msgError } = await supabase
      .from('mail_messages')
      .select('*, mail_accounts!inner(*)')
      .eq('id', messageId)
      .single();

    if (msgError || !message) {
      return new Response(JSON.stringify({ error: 'Message not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const account = (message as any).mail_accounts;
    if (account.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (account.provider !== 'imap') {
      return new Response(JSON.stringify({ error: 'On-demand fetch only supported for IMAP' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let password: string;
    try {
      const credentials = JSON.parse(atob(account.credentials_vault_key));
      password = credentials.password;
      if (!password) throw new Error('No password');
    } catch {
      return new Response(JSON.stringify({ error: 'Failed to decode credentials' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const messageUid = uid || message.message_id;
    const folder = message.folder || 'INBOX';

    console.log(`[fetch-body] Fetching body for UID ${messageUid} in ${folder}`);

    // Attempt 1
    let { bodyText, bodyHtml } = await attemptFetchBody(account, password, messageUid, folder);

    // Auto-retry once after 2s if first attempt failed
    if (!bodyText && !bodyHtml) {
      console.log(`[fetch-body] First attempt failed, retrying after 2s...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      const retry = await attemptFetchBody(account, password, messageUid, folder);
      bodyText = retry.bodyText;
      bodyHtml = retry.bodyHtml;
    }

    // Generate snippet
    let snippet = '';
    if (bodyText) {
      snippet = truncate(bodyText.replace(/\s+/g, ' ').trim(), 200);
    } else if (bodyHtml) {
      snippet = truncate(stripHtml(bodyHtml), 200);
    }

    // Update the message in the database
    if (bodyText || bodyHtml) {
      const updateData: any = {};
      if (bodyText) updateData.body_text = bodyText;
      if (bodyHtml) updateData.body_html = bodyHtml;
      if (snippet) updateData.snippet = snippet;

      const { error: updateError } = await supabase
        .from('mail_messages')
        .update(updateData)
        .eq('id', messageId);

      if (updateError) {
        console.error(`[fetch-body] DB update error:`, updateError);
      } else {
        console.log(`[fetch-body] Updated message ${messageId} with body content`);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        body_text: bodyText || null, 
        body_html: bodyHtml || null, 
        snippet: snippet || null 
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    } else {
      console.warn(`[fetch-body] All strategies failed (incl. retry) for message ${messageId}`);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Could not fetch email body after trying all strategies' 
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

  } catch (error: any) {
    console.error('[fetch-body] Error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});