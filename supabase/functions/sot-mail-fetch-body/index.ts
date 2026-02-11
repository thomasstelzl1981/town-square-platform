/**
 * SOT-MAIL-FETCH-BODY Edge Function
 * 
 * On-demand body fetch for a single email via IMAP.
 * Called when the user opens an email that has no body content.
 * Uses multiple fetch strategies for maximum reliability.
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

function decodeQuotedPrintable(input: string): string {
  return input
    .replace(/=\r?\n/g, '')
    .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

function decodeBase64Content(input: string): string {
  try {
    const cleaned = input.replace(/\s/g, '');
    const bytes = decodeBase64(cleaned);
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
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
      
      const partContentType = part.match(/Content-Type:\s*([^;\r\n]+)/i)?.[1]?.trim().toLowerCase();
      const transferEncoding = part.match(/Content-Transfer-Encoding:\s*([^\r\n]+)/i)?.[1]?.trim().toLowerCase();
      const contentDisposition = part.match(/Content-Disposition:\s*([^;\r\n]+)/i)?.[1]?.trim().toLowerCase();
      
      if (contentDisposition === 'attachment') continue;
      
      const bodyMatch = part.match(/\r?\n\r?\n([\s\S]*)/);
      if (!bodyMatch) continue;
      
      let bodyContent = bodyMatch[1].trim();
      
      if (transferEncoding === 'quoted-printable') {
        bodyContent = decodeQuotedPrintable(bodyContent);
      } else if (transferEncoding === 'base64') {
        bodyContent = decodeBase64Content(bodyContent);
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
    const contentType = rawMessage.match(/Content-Type:\s*([^;\r\n]+)/i)?.[1]?.trim().toLowerCase() || 'text/plain';
    const transferEncoding = rawMessage.match(/Content-Transfer-Encoding:\s*([^\r\n]+)/i)?.[1]?.trim().toLowerCase();
    
    const bodyMatch = rawMessage.match(/\r?\n\r?\n([\s\S]*)/);
    if (bodyMatch) {
      let bodyContent = bodyMatch[1].trim();
      if (transferEncoding === 'quoted-printable') bodyContent = decodeQuotedPrintable(bodyContent);
      else if (transferEncoding === 'base64') bodyContent = decodeBase64Content(bodyContent);
      
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

    // Get the message and its account
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

    // Decode credentials
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

    const client = new ImapClient({
      host: account.imap_host,
      port: account.imap_port || 993,
      tls: true,
      username: account.email_address,
      password: password,
    });

    let bodyText = '';
    let bodyHtml = '';
    let snippet = '';

    try {
      await client.connect();
      await client.authenticate();

      // Try to select the mailbox
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

      // Strategy 1: bodyParts ['1'] — first MIME part
      try {
        console.log(`[fetch-body] Strategy 1: BODY[1]`);
        const msgs = await client.fetch(`${messageUid}`, { bodyParts: ['1'] }, true);
        const msg = msgs?.[0];
        const part = msg?.bodyParts?.get?.('1') || msg?.bodyParts?.['1'];
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

      // Strategy 4: try nested MIME parts ['1.1', '1.2', '2']
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
    }

    // Generate snippet
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
      console.warn(`[fetch-body] All strategies failed for message ${messageId}`);
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
