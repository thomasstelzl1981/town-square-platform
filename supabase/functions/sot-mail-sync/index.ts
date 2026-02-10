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
function decodeBase64Content(input: string): string {
  try {
    // Remove all whitespace from base64
    const cleaned = input.replace(/\s/g, '');
    const bytes = decodeBase64(cleaned);
    return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  } catch (e) {
    console.error('Base64 decode error:', e);
    return input;
  }
}

/**
 * Parse a MIME multipart message and extract text/html parts
 */
function parseMimeMessage(rawMessage: string): { text: string; html: string; hasAttachments: boolean } {
  let text = '';
  let html = '';
  let hasAttachments = false;

  // Check if it's a multipart message
  const contentTypeMatch = rawMessage.match(/Content-Type:\s*multipart\/[^;]+;\s*boundary="?([^"\r\n]+)"?/i);
  
  if (contentTypeMatch) {
    const boundary = contentTypeMatch[1];
    const boundaryMarker = '--' + boundary;
    
    // Split by boundary
    const parts = rawMessage.split(boundaryMarker);
    
    for (const part of parts) {
      if (!part.trim() || part.trim() === '--') continue;
      
      // Check content type of this part
      const partContentType = part.match(/Content-Type:\s*([^;\r\n]+)/i)?.[1]?.trim().toLowerCase();
      const transferEncoding = part.match(/Content-Transfer-Encoding:\s*([^\r\n]+)/i)?.[1]?.trim().toLowerCase();
      const contentDisposition = part.match(/Content-Disposition:\s*([^;\r\n]+)/i)?.[1]?.trim().toLowerCase();
      
      // Check if this is an attachment
      if (contentDisposition === 'attachment' || part.match(/filename=/i)) {
        hasAttachments = true;
        continue;
      }
      
      // Find the body (after double newline)
      const bodyMatch = part.match(/\r?\n\r?\n([\s\S]*)/);
      if (!bodyMatch) continue;
      
      let bodyContent = bodyMatch[1].trim();
      
      // Decode based on transfer encoding
      if (transferEncoding === 'quoted-printable') {
        bodyContent = decodeQuotedPrintable(bodyContent);
      } else if (transferEncoding === 'base64') {
        bodyContent = decodeBase64Content(bodyContent);
      }
      
      // Handle nested multipart
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
    // Not multipart - single part message
    const contentType = rawMessage.match(/Content-Type:\s*([^;\r\n]+)/i)?.[1]?.trim().toLowerCase() || 'text/plain';
    const transferEncoding = rawMessage.match(/Content-Transfer-Encoding:\s*([^\r\n]+)/i)?.[1]?.trim().toLowerCase();
    
    // Find body after headers (double newline)
    const bodyMatch = rawMessage.match(/\r?\n\r?\n([\s\S]*)/);
    if (bodyMatch) {
      let bodyContent = bodyMatch[1].trim();
      
      // Decode based on transfer encoding
      if (transferEncoding === 'quoted-printable') {
        bodyContent = decodeQuotedPrintable(bodyContent);
      } else if (transferEncoding === 'base64') {
        bodyContent = decodeBase64Content(bodyContent);
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

  // Create IMAP client
  const client = new ImapClient({
    host: account.imap_host,
    port: account.imap_port || 993,
    tls: true,
    username: account.email_address,
    password: password,
  });

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

    // Fetch messages with envelope, flags (without full body — we fetch body separately per-message)
    const messages = await client.fetch(range, {
      envelope: true,
      flags: true,
      uid: true,
      internalDate: true,
      bodyStructure: true,
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

        // Parse MIME content — fetch full RFC822 per message for reliable body extraction
        let bodyText = '';
        let bodyHtml = '';
        let snippet = '';
        let hasAttachments = false;
        
        if (msg.uid) {
          // === Tier 1: Fetch full RFC822 message (most reliable) ===
          try {
            console.log(`[UID ${msg.uid}] Fetching RFC822...`);
            const rfcMsgs = await client.fetch(`${msg.uid}`, {
              full: true,
            }, true); // UID-based fetch
            
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
          
          // === Tier 2: Fallback — fetch BODY[TEXT] via bodyParts ===
          if (!bodyText && !bodyHtml) {
            console.log(`[UID ${msg.uid}] RFC822 empty, trying BODY[TEXT]...`);
            try {
              const fallbackMsgs = await client.fetch(`${msg.uid}`, {
                bodyParts: ['TEXT'],
              }, true);
              
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
          
          // === Tier 3: Fallback — fetch BODY[1] and BODY[1.1] ===
          if (!bodyText && !bodyHtml) {
            console.log(`[UID ${msg.uid}] BODY[TEXT] empty, trying BODY[1] + BODY[1.1]...`);
            for (const partId of ['1', '1.1', '1.2', '2']) {
              try {
                const fallbackMsgs = await client.fetch(`${msg.uid}`, {
                  bodyParts: [partId],
                }, true);
                
                const fbMsg = fallbackMsgs?.[0];
                const part = fbMsg?.bodyParts?.get?.(partId) || fbMsg?.bodyParts?.[partId];
                
                if (part) {
                  const fbContent = (part instanceof Uint8Array) 
                    ? new TextDecoder('utf-8', { fatal: false }).decode(part)
                    : String(part);
                  
                  if (fbContent.length > 10) {
                    // Try to detect if it's HTML or text
                    if (fbContent.includes('<html') || fbContent.includes('<body') || fbContent.includes('<div')) {
                      bodyHtml = truncate(fbContent, MAX_BODY_SIZE);
                    } else {
                      // Could be transfer-encoded, try to parse as MIME
                      const parsed = parseMimeMessage(`Content-Type: text/plain\r\n\r\n${fbContent}`);
                      bodyText = truncate(parsed.text || fbContent, MAX_BODY_SIZE);
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
        }
        
        // Also try msg.raw from the initial fetch as last resort
        if (!bodyText && !bodyHtml && msg.raw) {
          try {
            const rawMessage = (msg.raw instanceof Uint8Array)
              ? new TextDecoder('utf-8', { fatal: false }).decode(msg.raw)
              : String(msg.raw);
            const parsed = parseMimeMessage(rawMessage);
            bodyText = truncate(parsed.text, MAX_BODY_SIZE);
            bodyHtml = truncate(parsed.html, MAX_BODY_SIZE);
            hasAttachments = parsed.hasAttachments;
            console.log(`[UID ${msg.uid}] initial raw fallback: text=${bodyText.length}b, html=${bodyHtml.length}b`);
          } catch (parseError) {
            console.error(`[UID ${msg.uid}] initial raw parse error:`, parseError);
          }
        }
        
        if (!bodyText && !bodyHtml) {
          console.warn(`[UID ${msg.uid}] ALL fetch tiers failed — no body content. Subject: ${envelope.subject}`);
        }
        
        // Generate snippet from body content
        if (bodyText) {
          snippet = truncate(bodyText.replace(/\s+/g, ' ').trim(), 200);
        } else if (bodyHtml) {
          snippet = truncate(stripHtml(bodyHtml), 200);
        }

        // Decode subject with RFC 2047
        const decodedSubject = decodeRfc2047(envelope.subject || '') || '(Kein Betreff)';

        // Upsert message with body content
        const { error } = await supabase
          .from('mail_messages')
          .upsert({
            account_id: account.id,
            message_id: msg.uid?.toString() || `imap_${Date.now()}_${synced}`,
            thread_id: envelope.messageId || null,
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
    console.log(`IMAP sync complete: ${synced} messages synced`);
    return synced;

  } catch (error) {
    console.error('IMAP sync failed:', error);
    try {
      await client.disconnect();
    } catch {
      // Ignore close errors
    }
    throw error;
  }
}

// Google Mail sync using Gmail API
async function syncGoogleMail(
  supabase: any, 
  account: any, 
  folder: string, 
  limit: number
): Promise<number> {
  if (!account.access_token) {
    throw new Error('No access token available');
  }

  // Fetch messages from Gmail API
  const response = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${limit}&labelIds=${folder.toUpperCase()}`,
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
    throw new Error(`Gmail API error: ${response.status}`);
  }

  const data = await response.json();
  const messages = data.messages || [];

  let synced = 0;
  for (const msg of messages.slice(0, limit)) {
    // Fetch full message details
    const detailResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`,
      {
        headers: {
          Authorization: `Bearer ${account.access_token}`,
        },
      }
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
