/**
 * SOT-MAIL-SYNC Edge Function
 * 
 * Synchronizes emails from connected mail accounts:
 * - IMAP: Uses @workingdevshero/deno-imap with mailparser for MIME parsing
 * - Google: Uses Gmail API
 * - Microsoft: Uses Graph API
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ImapClient } from 'jsr:@workingdevshero/deno-imap';
import { simpleParser } from 'npm:mailparser@3.6.6';

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

// IMAP Mail sync using @workingdevshero/deno-imap with mailparser
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
    console.log('Connected, selecting mailbox:', folder);
    
    // Select mailbox
    const mailbox = await client.selectMailbox(folder);
    console.log(`Mailbox selected: ${mailbox.exists} messages exist`);

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

    // Fetch messages with envelope, flags, and FULL raw content
    // Using 'full: true' to get msg.raw (Uint8Array) which we parse with mailparser
    const messages = await client.fetch(range, {
      envelope: true,
      flags: true,
      uid: true,
      internalDate: true,
      bodyStructure: true,
      full: true, // This gives us msg.raw containing the complete RFC822 message
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
        const fromName = fromAddr?.name || '';

        // Extract to addresses
        const toAddrs = envelope.to?.map((addr: any) => 
          addr.mailbox && addr.host ? `${addr.mailbox}@${addr.host}` : ''
        ).filter(Boolean) || [];

        // Parse flags - normalize by removing backslashes
        // The deno-imap library returns flags like 'Seen' instead of '\\Seen'
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

        // Parse MIME content using mailparser
        let bodyText = '';
        let bodyHtml = '';
        let snippet = '';
        let hasAttachments = false;
        
        if (msg.raw) {
          try {
            // msg.raw is a Uint8Array containing the full RFC822 message
            const parsed = await simpleParser(msg.raw);
            
            // Extract text content
            if (parsed.text) {
              bodyText = truncate(parsed.text, MAX_BODY_SIZE);
            }
            
            // Extract HTML content
            if (parsed.html && typeof parsed.html === 'string') {
              bodyHtml = truncate(parsed.html, MAX_BODY_SIZE);
            }
            
            // Check for attachments
            if (parsed.attachments && parsed.attachments.length > 0) {
              hasAttachments = true;
            }
            
            console.log(`Parsed message UID ${msg.uid}: text=${bodyText.length}b, html=${bodyHtml.length}b`);
          } catch (parseError) {
            console.error(`Error parsing MIME for UID ${msg.uid}:`, parseError);
            // Fallback: try to decode raw as string
            try {
              const decoder = new TextDecoder('utf-8', { fatal: false });
              const rawText = decoder.decode(msg.raw);
              bodyText = truncate(rawText, MAX_BODY_SIZE);
            } catch {
              console.error('Fallback text decode also failed');
            }
          }
        } else {
          console.log(`No raw content for UID ${msg.uid}`);
        }
        
        // Generate snippet from body content
        if (bodyText) {
          snippet = truncate(bodyText.replace(/\s+/g, ' ').trim(), 200);
        } else if (bodyHtml) {
          snippet = truncate(stripHtml(bodyHtml), 200);
        }

        // Upsert message with body content
        const { error } = await supabase
          .from('mail_messages')
          .upsert({
            account_id: account.id,
            message_id: msg.uid?.toString() || `imap_${Date.now()}_${synced}`,
            thread_id: envelope.messageId || null,
            folder: folder.toUpperCase(),
            subject: envelope.subject || '(Kein Betreff)',
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
