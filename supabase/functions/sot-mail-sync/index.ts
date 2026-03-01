/**
 * SOT-MAIL-SYNC Edge Function
 * 
 * Synchronizes emails from connected mail accounts:
 * - IMAP: Uses @workingdevshero/deno-imap with custom MIME parsing
 * - Google: Uses Gmail API
 * - Microsoft: Uses Graph API
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ImapClient } from 'jsr:@workingdevshero/deno-imap';
import { decode as decodeBase64 } from 'https://deno.land/std@0.168.0/encoding/base64.ts';
import { crypto } from 'https://deno.land/std@0.168.0/crypto/mod.ts';
import { encode as encodeHex } from 'https://deno.land/std@0.168.0/encoding/hex.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface SyncRequest {
  accountId: string;
  folder?: string;
  limit?: number;
}

// Maximum body size to store (500KB per field)
const MAX_BODY_SIZE = 500 * 1024;

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

    const body: SyncRequest = await req.json();
    const { accountId, folder = 'INBOX', limit = 50 } = body;

    if (!accountId) {
      return new Response(
        JSON.stringify({ error: 'Missing accountId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the mail account (explicit fields — never return tokens to client)
    const { data: account, error: accountError } = await supabase
      .from('mail_accounts')
      .select('id, tenant_id, user_id, provider, email_address, display_name, imap_host, imap_port, smtp_host, smtp_port, credentials_vault_key, access_token, refresh_token, token_expires_at, sync_status, sync_error, last_sync_at')
      .eq('id', accountId)
      .eq('user_id', user.id)
      .single();

    if (accountError || !account) {
      return new Response(
        JSON.stringify({ error: 'Account not found or access denied' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update sync status to 'syncing'
    await supabase
      .from('mail_accounts')
      .update({ sync_status: 'syncing' })
      .eq('id', accountId);

    console.log(`Starting sync for account ${account.email_address} (${account.provider})`);

    let syncedMessages = 0;
    let syncError: string | null = null;

    try {
      if (account.provider === 'google') {
        syncedMessages = await syncGoogleMail(supabase, account, folder, limit);
      } else if (account.provider === 'microsoft') {
        syncedMessages = await syncMicrosoftMail(supabase, account, folder, limit);
      } else if (account.provider === 'imap') {
        syncedMessages = await syncImapMail(supabase, account, folder, limit);
      }
    } catch (error: any) {
      console.error('Sync error:', error);
      syncError = error.message;
    }

    // Update sync status
    await supabase
      .from('mail_accounts')
      .update({ 
        sync_status: syncError ? 'error' : 'connected',
        sync_error: syncError,
        last_sync_at: new Date().toISOString(),
      })
      .eq('id', accountId);

    console.log(`Sync completed: ${syncedMessages} messages synced`);

    return new Response(
      JSON.stringify({ 
        success: !syncError, 
        syncedMessages,
        error: syncError,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Mail sync error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Decode RFC 2047 encoded words in headers (Subject, From name, etc.)
 * Handles =?charset?B?base64?= and =?charset?Q?quoted-printable?= patterns
 */
function decodeRfc2047(input: string): string {
  if (!input || !input.includes('=?')) return input;
  
  try {
    // Remove folding whitespace between adjacent encoded words
    const cleaned = input.replace(/\?=\s+=\?/g, '?==?');
    
    return cleaned.replace(/=\?([^?]+)\?([BbQq])\?([^?]*)\?=/g, (_match, charset, encoding, text) => {
      try {
        const enc = encoding.toUpperCase();
        if (enc === 'B') {
          // Base64 decoding
          const cleanedBase64 = text.replace(/\s/g, '');
          const bytes = decodeBase64(cleanedBase64);
          return new TextDecoder(charset, { fatal: false }).decode(bytes);
        } else if (enc === 'Q') {
          // Quoted-Printable decoding (RFC 2047 variant: _ = space)
          const qpText = text.replace(/_/g, ' ');
          const decoded = qpText.replace(/=([0-9A-Fa-f]{2})/g, (_, hex: string) => {
            return String.fromCharCode(parseInt(hex, 16));
          });
          // Re-decode bytes for proper charset handling
          const encoder = new TextEncoder();
          const bytes = encoder.encode(decoded);
          return new TextDecoder(charset, { fatal: false }).decode(bytes);
        }
        return text;
      } catch (e) {
        console.error('RFC 2047 decode chunk error:', e);
        return text;
      }
    });
  } catch (e) {
    console.error('RFC 2047 decode error:', e);
    return input;
  }
}

/**
 * Decode Quoted-Printable encoded string
 */
function decodeQuotedPrintable(input: string): string {
  return input
    // Handle soft line breaks (=\r\n or =\n)
    .replace(/=\r?\n/g, '')
    // Handle encoded characters (=XX where XX is hex)
    .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });
}

/**
 * Decode Base64 encoded string
 */
/**
 * Extract charset from Content-Type header value
 * e.g. "text/html; charset=iso-8859-1" -> "iso-8859-1"
 */
function extractCharset(contentTypeLine: string): string {
  const match = contentTypeLine.match(/charset=["']?([^"';\s]+)/i);
  return match ? match[1].toLowerCase() : 'utf-8';
}

/**
 * Decode bytes with a specific charset, falling back to utf-8
 */
function decodeWithCharset(bytes: Uint8Array, charset: string): string {
  try {
    return new TextDecoder(charset, { fatal: false }).decode(bytes);
  } catch {
    // Charset not supported by TextDecoder, fall back to utf-8
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  }
}

function decodeBase64Content(input: string, charset = 'utf-8'): string {
  try {
    const cleaned = input.replace(/\s/g, '');
    const bytes = decodeBase64(cleaned);
    return decodeWithCharset(bytes, charset);
  } catch (e) {
    console.error('Base64 decode error:', e);
    return input;
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
function decodeQPWithCharset(input: string, charset = 'utf-8'): string {
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

/**
 * Parse a MIME multipart message and extract text/html parts
 */
function parseMimeMessage(rawMessage: string): { text: string; html: string; hasAttachments: boolean } {
  let text = '';
  let html = '';
  let hasAttachments = false;

  const contentTypeMatch = rawMessage.match(/Content-Type:\s*multipart\/[^;]+;\s*boundary="?([^"\r\n]+)"?/i);
  
  if (contentTypeMatch) {
    const boundary = contentTypeMatch[1];
    const boundaryMarker = '--' + boundary;
    const parts = rawMessage.split(boundaryMarker);
    
    for (const part of parts) {
      if (!part.trim() || part.trim() === '--') continue;
      
      const partContentTypeFull = part.match(/Content-Type:\s*([^\r\n]+)/i)?.[1] || '';
      const partContentType = partContentTypeFull.split(';')[0].trim().toLowerCase();
      const charset = extractCharset(partContentTypeFull);
      const transferEncoding = part.match(/Content-Transfer-Encoding:\s*([^\r\n]+)/i)?.[1]?.trim().toLowerCase();
      const contentDisposition = part.match(/Content-Disposition:\s*([^;\r\n]+)/i)?.[1]?.trim().toLowerCase();
      
      if (contentDisposition === 'attachment' || part.match(/filename=/i)) {
        hasAttachments = true;
        continue;
      }
      
      const bodyMatch = part.match(/\r?\n\r?\n([\s\S]*)/);
      if (!bodyMatch) continue;
      
      let bodyContent = bodyMatch[1].trim();
      
      // Decode with charset awareness
      if (transferEncoding === 'quoted-printable') {
        bodyContent = decodeQPWithCharset(bodyContent, charset);
      } else if (transferEncoding === 'base64') {
        bodyContent = decodeBase64Content(bodyContent, charset);
      } else if (charset !== 'utf-8' && charset !== 'us-ascii') {
        // 7bit/8bit with non-UTF-8 charset — try re-decoding
        try {
          const bytes = new Uint8Array(bodyContent.length);
          for (let i = 0; i < bodyContent.length; i++) bytes[i] = bodyContent.charCodeAt(i) & 0xFF;
          bodyContent = decodeWithCharset(bytes, charset);
        } catch { /* keep as-is */ }
      }
      
      if (partContentType?.startsWith('multipart/')) {
        const nestedResult = parseMimeMessage(part);
        if (nestedResult.text && !text) text = nestedResult.text;
        if (nestedResult.html && !html) html = nestedResult.html;
        if (nestedResult.hasAttachments) hasAttachments = true;
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
      
      if (transferEncoding === 'quoted-printable') {
        bodyContent = decodeQPWithCharset(bodyContent, charset);
      } else if (transferEncoding === 'base64') {
        bodyContent = decodeBase64Content(bodyContent, charset);
      }
      
      if (contentType === 'text/html') {
        html = bodyContent;
      } else {
        text = bodyContent;
      }
    }
  }

  return { text, html, hasAttachments };
}

/**
 * Strip HTML tags from a string to create a plain text snippet
 */
function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Truncate string to max length
 */
function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen);
}

// IMAP Mail sync using @workingdevshero/deno-imap with manual MIME parsing

/**
 * Normalize email subject for thread grouping:
 * Strip Re:, Fwd:, AW:, WG:, Antwort:, Aw: prefixes (case-insensitive, repeated)
 */
function normalizeSubject(subject: string): string {
  return subject
    .replace(/^(\s*(Re|Fwd|Fw|AW|WG|Antwort|Aw|SV|VS)\s*:\s*)+/gi, '')
    .trim()
    .toLowerCase();
}

/**
 * Generate a deterministic thread_id for IMAP messages based on account_id + normalized subject.
 * Messages with the same normalized subject in the same account get the same thread_id.
 */
async function generateImapThreadId(accountId: string, subject: string): Promise<string> {
  const normalized = normalizeSubject(subject);
  if (!normalized || normalized === '(kein betreff)') {
    // Don't group messages with empty/no subject
    return `imap_single_${crypto.randomUUID()}`;
  }
  const input = `${accountId}::${normalized}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashHex = new TextDecoder().decode(encodeHex(new Uint8Array(hashBuffer)));
  return `imap_thread_${hashHex.substring(0, 16)}`;
}

// Map standard folder names to common IMAP folder names
const FOLDER_MAPPINGS: Record<string, string[]> = {
  'INBOX': ['INBOX'],
  'SENT': ['Sent', 'Sent Items', 'Sent Messages', 'Gesendet', 'INBOX.Sent', 'INBOX.Gesendet', 'Gesendete Objekte'],
  'DRAFTS': ['Drafts', 'Draft', 'Entwürfe', 'INBOX.Drafts', 'INBOX.Entwürfe'],
  'TRASH': ['Trash', 'Deleted', 'Deleted Items', 'Papierkorb', 'Gelöscht', 'INBOX.Trash', 'INBOX.Papierkorb'],
  'ARCHIVE': ['Archive', 'Archiv', 'All Mail', 'INBOX.Archive', 'INBOX.Archiv'],
  'SPAM': ['Spam', 'Junk', 'Junk E-Mail', 'INBOX.Spam', 'INBOX.Junk'],
};

async function syncImapMail(
  supabase: any, 
  account: any, 
  folder: string, 
  limit: number
): Promise<number> {
  console.log(`IMAP sync for ${account.email_address} on ${account.imap_host}:${account.imap_port}`);
  
  // Decode credentials from base64
  let password: string;
  try {
    const credentials = JSON.parse(atob(account.credentials_vault_key));
    password = credentials.password;
    if (!password) throw new Error('Password not found in credentials');
  } catch (e) {
    throw new Error('Failed to decode credentials: ' + (e as Error).message);
  }

  // Create IMAP client with timeout protection
  const client = new ImapClient({
    host: account.imap_host,
    port: account.imap_port || 993,
    tls: true,
    username: account.email_address,
    password: password,
  });

  // 25s timeout to avoid hitting the 60s edge function limit
  const timeoutMs = 25_000;
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), timeoutMs);

  try {
    console.log('Connecting to IMAP server...');
    await client.connect();
    console.log('Authenticating...');
    await client.authenticate();
    
    // Map the requested folder to possible IMAP folder names
    const normalizedFolder = folder.toUpperCase();
    const possibleFolders = FOLDER_MAPPINGS[normalizedFolder] || [folder];
    
    console.log(`Looking for folder: ${folder}, trying: ${possibleFolders.join(', ')}`);
    
    // Try each possible folder name until one works
    let mailbox: any = null;
    let actualFolderName = folder;
    
    for (const tryFolder of possibleFolders) {
      try {
        console.log(`Trying mailbox: ${tryFolder}`);
        mailbox = await client.selectMailbox(tryFolder);
        actualFolderName = tryFolder;
        console.log(`Successfully selected mailbox: ${tryFolder} (${mailbox.exists} messages)`);
        break;
      } catch (e) {
        console.log(`Mailbox ${tryFolder} not found, trying next...`);
      }
    }
    
    if (!mailbox) {
      console.log(`Could not find any matching mailbox for ${folder}`);
      await client.disconnect();
      return 0;
    }
    
    console.log(`Mailbox selected: ${actualFolderName} with ${mailbox.exists} messages`);

    if (!mailbox.exists || mailbox.exists === 0) {
      console.log('No messages in mailbox');
      await client.disconnect();
      return 0;
    }

    // Calculate range: fetch last N messages
    const total = mailbox.exists;
    const start = Math.max(1, total - limit + 1);
    const range = `${start}:${total}`;
    
    console.log(`Fetching messages ${range} with full content...`);

    // Fetch messages with envelope, flags, and attempt body via BODY[1] (most reliable single-part fetch)
    const messages = await client.fetch(range, {
      envelope: true,
      flags: true,
      uid: true,
      internalDate: true,
      bodyStructure: true,
      bodyParts: ['1'],
    });

    console.log(`Fetched ${messages.length} messages, parsing content...`);

    let synced = 0;
    for (const msg of messages) {
      try {
        const envelope = msg.envelope;
        if (!envelope) {
          console.log('Skipping message without envelope');
          continue;
        }

        // Extract from address
        const fromAddr = envelope.from?.[0];
        const fromEmail = fromAddr?.mailbox && fromAddr?.host 
          ? `${fromAddr.mailbox}@${fromAddr.host}` 
          : '';
        const fromName = decodeRfc2047(fromAddr?.name || '');

        // Extract to addresses
        const toAddrs = envelope.to?.map((addr: any) => 
          addr.mailbox && addr.host ? `${addr.mailbox}@${addr.host}` : ''
        ).filter(Boolean) || [];

        // Parse flags - normalize by removing backslashes
        const rawFlags = msg.flags || [];
        const normFlags = rawFlags.map((f: string) => f.replace(/^\\/, ''));
        const isRead = normFlags.includes('Seen') || rawFlags.includes('\\Seen');
        const isStarred = normFlags.includes('Flagged') || rawFlags.includes('\\Flagged');

        // Parse date
        let receivedAt: string;
        try {
          if (msg.internalDate) {
            receivedAt = new Date(msg.internalDate).toISOString();
          } else if (envelope.date) {
            receivedAt = new Date(envelope.date).toISOString();
          } else {
            receivedAt = new Date().toISOString();
          }
        } catch {
          receivedAt = new Date().toISOString();
        }

        // Parse MIME content — use inline BODY[1] from batch fetch first, then fallback strategies
        let bodyText = '';
        let bodyHtml = '';
        let snippet = '';
        let hasAttachments = false;
        
        // Check if timed out
        if (abortController.signal.aborted) {
          console.warn(`[UID ${msg.uid}] Timeout reached, stopping sync`);
          break;
        }

        // === Tier 0: Check inline BODY[1] from batch fetch ===
        // Detect charset + transfer-encoding from bodyStructure for proper decoding
        let tier0Charset = 'utf-8';
        let tier0Encoding = '';
        if (msg.bodyStructure) {
          try {
            const bs = msg.bodyStructure;
            // bodyStructure params may contain charset
            tier0Charset = extractCharsetFromBodyStructure(bs);
            tier0Encoding = (bs.encoding ?? bs.bodyEncoding ?? '').toLowerCase();
          } catch { /* ignore */ }
        }

        if (msg.bodyParts) {
          try {
            const part = msg.bodyParts?.get?.('1') || msg.bodyParts?.['1'];
            if (part) {
              let content: string;
              if (part instanceof Uint8Array) {
                content = decodeWithCharset(part, tier0Charset);
              } else {
                content = String(part);
              }
              // Apply transfer-encoding if not already decoded by library
              if (tier0Encoding === 'base64' && !content.includes('<') && content.match(/^[A-Za-z0-9+/=\s]+$/)) {
                content = decodeBase64Content(content, tier0Charset);
              } else if (tier0Encoding === 'quoted-printable' && content.includes('=')) {
                content = decodeQPWithCharset(content, tier0Charset);
              }
              if (content.length > 10) {
                if (content.includes('<html') || content.includes('<body') || content.includes('<div')) {
                  bodyHtml = truncate(content, MAX_BODY_SIZE);
                } else {
                  bodyText = truncate(content, MAX_BODY_SIZE);
                }
                console.log(`[UID ${msg.uid}] Inline BODY[1]: text=${bodyText.length}b, html=${bodyHtml.length}b`);
              }
            }
          } catch (e) {
            console.error(`[UID ${msg.uid}] Inline BODY[1] parse error:`, e);
          }
        }
        
        if (msg.uid && !bodyText && !bodyHtml) {
          // === Tier 1: Fetch BODY[TEXT] ===
          try {
            console.log(`[UID ${msg.uid}] Trying BODY[TEXT]...`);
            const fallbackMsgs = await client.fetch(`${msg.uid}`, { bodyParts: ['TEXT'] }, true);
            const fbMsg = fallbackMsgs?.[0];
            const textPart = fbMsg?.bodyParts?.get?.('TEXT') || fbMsg?.bodyParts?.TEXT;
            if (textPart) {
              const fbContent = (textPart instanceof Uint8Array) 
                ? new TextDecoder('utf-8', { fatal: false }).decode(textPart)
                : String(textPart);
              if (fbContent.length > 0) {
                const parsed = parseMimeMessage(fbContent);
                bodyText = truncate(parsed.text, MAX_BODY_SIZE);
                bodyHtml = truncate(parsed.html, MAX_BODY_SIZE);
                hasAttachments = parsed.hasAttachments;
                console.log(`[UID ${msg.uid}] BODY[TEXT]: text=${bodyText.length}b, html=${bodyHtml.length}b`);
              }
            }
          } catch (fb2Error) {
            console.error(`[UID ${msg.uid}] BODY[TEXT] fetch error:`, fb2Error);
          }
        }
          
        // === Tier 2: Nested MIME parts ===
        if (msg.uid && !bodyText && !bodyHtml) {
          for (const partId of ['1.1', '1.2', '2']) {
            try {
              const fallbackMsgs = await client.fetch(`${msg.uid}`, { bodyParts: [partId] }, true);
              const fbMsg = fallbackMsgs?.[0];
              const part = fbMsg?.bodyParts?.get?.(partId) || fbMsg?.bodyParts?.[partId];
              if (part) {
                const fbContent = (part instanceof Uint8Array) 
                  ? new TextDecoder('utf-8', { fatal: false }).decode(part)
                  : String(part);
                if (fbContent.length > 10) {
                  if (fbContent.includes('<html') || fbContent.includes('<body') || fbContent.includes('<div')) {
                    bodyHtml = truncate(fbContent, MAX_BODY_SIZE);
                  } else {
                    bodyText = truncate(fbContent, MAX_BODY_SIZE);
                  }
                  console.log(`[UID ${msg.uid}] BODY[${partId}]: text=${bodyText.length}b, html=${bodyHtml.length}b`);
                  if (bodyText || bodyHtml) break;
                }
              }
            } catch (fbError) {
              console.error(`[UID ${msg.uid}] BODY[${partId}] fetch error:`, fbError);
            }
          }
        }
        
        // === Tier 3: Full RFC822 as last resort ===
        if (msg.uid && !bodyText && !bodyHtml) {
          try {
            console.log(`[UID ${msg.uid}] Last resort: full RFC822...`);
            const rfcMsgs = await client.fetch(`${msg.uid}`, { full: true }, true);
            const rfcMsg = rfcMsgs?.[0];
            if (rfcMsg?.raw) {
              const rawMessage = (rfcMsg.raw instanceof Uint8Array)
                ? new TextDecoder('utf-8', { fatal: false }).decode(rfcMsg.raw)
                : String(rfcMsg.raw);
              if (rawMessage.length > 0) {
                const parsed = parseMimeMessage(rawMessage);
                bodyText = truncate(parsed.text, MAX_BODY_SIZE);
                bodyHtml = truncate(parsed.html, MAX_BODY_SIZE);
                hasAttachments = parsed.hasAttachments;
                console.log(`[UID ${msg.uid}] RFC822: text=${bodyText.length}b, html=${bodyHtml.length}b`);
              }
            }
          } catch (rfcError) {
            console.error(`[UID ${msg.uid}] RFC822 fetch error:`, rfcError);
          }
        }
        
        if (!bodyText && !bodyHtml) {
          console.warn(`[UID ${msg.uid}] ALL fetch tiers failed — body will be fetched on-demand. Subject: ${envelope.subject}`);
        }
        
        // Generate snippet from body content
        if (bodyText) {
          snippet = truncate(bodyText.replace(/\s+/g, ' ').trim(), 200);
        } else if (bodyHtml) {
          snippet = truncate(stripHtml(bodyHtml), 200);
        }

        // Decode subject with RFC 2047
        const decodedSubject = decodeRfc2047(envelope.subject || '') || '(Kein Betreff)';

        // Generate deterministic thread_id from normalized subject
        const imapThreadId = await generateImapThreadId(account.id, decodedSubject);

        // Upsert message with body content
        const { error } = await supabase
          .from('mail_messages')
          .upsert({
            account_id: account.id,
            message_id: msg.uid?.toString() || `imap_${Date.now()}_${synced}`,
            thread_id: imapThreadId,
            folder: folder.toUpperCase(),
            subject: decodedSubject,
            from_address: fromEmail,
            from_name: fromName,
            to_addresses: toAddrs,
            body_text: bodyText || null,
            body_html: bodyHtml || null,
            snippet: snippet || '(Kein Inhalt)',
            is_read: isRead,
            is_starred: isStarred,
            has_attachments: hasAttachments,
            received_at: receivedAt,
          }, {
            onConflict: 'account_id,message_id',
          });

        if (error) {
          console.error('Error upserting message:', error);
        } else {
          synced++;
        }
      } catch (msgError) {
        console.error('Error processing message:', msgError);
      }
    }

    await client.disconnect();
    clearTimeout(timeout);
    console.log(`IMAP sync complete: ${synced} messages synced`);
    return synced;

  } catch (error) {
    clearTimeout(timeout);
    console.error('IMAP sync failed:', error);
    try {
      await client.disconnect();
    } catch {
      // Ignore close errors
    }
    throw error;
  }
}

// Refresh Google access token using refresh_token
async function refreshGoogleToken(supabase: any, account: any): Promise<string> {
  const clientId = Deno.env.get('GOOGLE_DRIVE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_DRIVE_CLIENT_SECRET');

  if (!clientId || !clientSecret || !account.refresh_token) {
    throw new Error('Token refresh not possible — missing credentials or refresh token. Please reconnect Gmail.');
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
  if (!res.ok || !data.access_token) {
    console.error('[gmail] Token refresh failed:', data);
    throw new Error('Token refresh failed — please reconnect Gmail.');
  }

  const newExpiry = new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString();

  await supabase
    .from('mail_accounts')
    .update({
      access_token: data.access_token,
      token_expires_at: newExpiry,
      sync_status: 'connected',
      sync_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', account.id);

  console.log('[gmail] Token refreshed successfully');
  return data.access_token;
}

// Google Mail sync using Gmail API with automatic token refresh
async function syncGoogleMail(
  supabase: any, 
  account: any, 
  folder: string, 
  limit: number
): Promise<number> {
  let accessToken = account.access_token;

  if (!accessToken) {
    // Try to refresh if we have a refresh token
    if (account.refresh_token) {
      accessToken = await refreshGoogleToken(supabase, account);
    } else {
      throw new Error('No access token available');
    }
  }

  // Check if token is about to expire (1 min buffer)
  if (account.token_expires_at) {
    const expiresAt = new Date(account.token_expires_at).getTime();
    if (expiresAt < Date.now() + 60_000 && account.refresh_token) {
      console.log('[gmail] Token expiring soon, refreshing proactively...');
      accessToken = await refreshGoogleToken(supabase, account);
    }
  }

  // Fetch messages from Gmail API
  let response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${limit}&labelIds=${folder.toUpperCase()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  // Auto-refresh on 401
  if (response.status === 401 && account.refresh_token) {
    console.log('[gmail] Got 401, attempting token refresh...');
    await response.text(); // consume body
    accessToken = await refreshGoogleToken(supabase, account);
    response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${limit}&labelIds=${folder.toUpperCase()}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
  }

  if (!response.ok) {
    throw new Error(`Gmail API error: ${response.status}`);
  }

  const data = await response.json();
  const messages = data.messages || [];

  let synced = 0;
  for (const msg of messages.slice(0, limit)) {
    // Fetch full message details
    const detailResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    if (!detailResponse.ok) continue;

    const detail = await detailResponse.json();
    const headers = detail.payload?.headers || [];

    const getHeader = (name: string) => 
      headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value;

    // Upsert message
    const { error } = await supabase
      .from('mail_messages')
      .upsert({
        account_id: account.id,
        message_id: msg.id,
        thread_id: detail.threadId,
        folder: folder.toUpperCase(),
        subject: getHeader('Subject') || '(Kein Betreff)',
        from_address: getHeader('From')?.match(/<(.+)>/)?.[1] || getHeader('From') || '',
        from_name: getHeader('From')?.split('<')[0]?.trim() || '',
        to_addresses: [getHeader('To')],
        snippet: detail.snippet || '',
        is_read: !detail.labelIds?.includes('UNREAD'),
        is_starred: detail.labelIds?.includes('STARRED'),
        has_attachments: (detail.payload?.parts || []).some((p: any) => p.filename),
        received_at: new Date(parseInt(detail.internalDate)).toISOString(),
      }, {
        onConflict: 'account_id,message_id',
      });

    if (!error) synced++;
  }

  return synced;
}

// Microsoft Mail sync using Graph API
async function syncMicrosoftMail(
  supabase: any, 
  account: any, 
  folder: string, 
  limit: number
): Promise<number> {
  if (!account.access_token) {
    throw new Error('No access token available');
  }

  // Map folder names to Microsoft Graph folder IDs
  const folderMap: Record<string, string> = {
    'INBOX': 'inbox',
    'SENT': 'sentitems',
    'DRAFTS': 'drafts',
    'TRASH': 'deleteditems',
    'ARCHIVE': 'archive',
  };

  const graphFolder = folderMap[folder.toUpperCase()] || 'inbox';

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/mailFolders/${graphFolder}/messages?$top=${limit}&$orderby=receivedDateTime desc`,
    {
      headers: {
        Authorization: `Bearer ${account.access_token}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Access token expired - needs refresh');
    }
    throw new Error(`Microsoft Graph API error: ${response.status}`);
  }

  const data = await response.json();
  const messages = data.value || [];

  let synced = 0;
  for (const msg of messages) {
    // Upsert message
    const { error } = await supabase
      .from('mail_messages')
      .upsert({
        account_id: account.id,
        message_id: msg.id,
        thread_id: msg.conversationId,
        folder: folder.toUpperCase(),
        subject: msg.subject || '(Kein Betreff)',
        from_address: msg.from?.emailAddress?.address || '',
        from_name: msg.from?.emailAddress?.name || '',
        to_addresses: msg.toRecipients?.map((r: any) => r.emailAddress?.address) || [],
        snippet: msg.bodyPreview || '',
        is_read: msg.isRead,
        is_starred: msg.flag?.flagStatus === 'flagged',
        has_attachments: msg.hasAttachments,
        received_at: msg.receivedDateTime,
      }, {
        onConflict: 'account_id,message_id',
      });

    if (!error) synced++;
  }

  return synced;
}
