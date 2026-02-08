/**
 * SOT-MAIL-SYNC Edge Function
 * 
 * Synchronizes emails from connected mail accounts:
 * - Fetches new emails via IMAP or OAuth APIs
 * - Stores messages in mail_messages table
 * - Updates sync status
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface SyncRequest {
  accountId: string;
  folder?: string;
  limit?: number;
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
        // Google Gmail API sync
        syncedMessages = await syncGoogleMail(supabase, account, folder, limit);
      } else if (account.provider === 'microsoft') {
        // Microsoft Graph API sync
        syncedMessages = await syncMicrosoftMail(supabase, account, folder, limit);
      } else if (account.provider === 'imap') {
        // IMAP sync (placeholder - needs IMAP library)
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

// IMAP Mail sync (placeholder - needs IMAP library in Deno)
async function syncImapMail(
  supabase: any, 
  account: any, 
  folder: string, 
  limit: number
): Promise<number> {
  // IMAP sync would require an IMAP library like imapflow
  // For Deno edge functions, this is more complex due to TCP socket requirements
  // For now, return a message indicating IMAP sync needs additional setup
  
  console.log(`IMAP sync requested for ${account.email_address}`);
  console.log('IMAP direct sync requires additional server-side processing');
  
  // In a production environment, you would:
  // 1. Use a worker service with IMAP library support
  // 2. Or use a third-party email API (like Nylas, Context.io)
  // 3. Or proxy through a microservice with IMAP capabilities
  
  // For now, we'll just mark it as needing external processing
  throw new Error('IMAP sync requires external worker service - coming soon');
}
