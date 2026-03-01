/**
 * SOT-MAIL-SEARCH Edge Function
 * 
 * Server-side email search with filters and cursor-based pagination.
 * Supports: full-text ILIKE search, folder filter, unread/starred/attachments filters, date range.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface SearchRequest {
  accountIds: string[];
  q?: string;
  folder?: string;
  unreadOnly?: boolean;
  starredOnly?: boolean;
  hasAttachments?: boolean;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  cursor?: string; // received_at ISO timestamp for cursor-based pagination
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

    const body: SearchRequest = await req.json();
    const { 
      accountIds = [], 
      q, 
      folder, 
      unreadOnly, 
      starredOnly, 
      hasAttachments, 
      fromDate, 
      toDate, 
      limit = 50, 
      cursor 
    } = body;

    // RLS guard: verify all requested accounts belong to the authenticated user
    if (accountIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No accountIds provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: validAccounts } = await supabase
      .from('mail_accounts')
      .select('id')
      .eq('user_id', user.id)
      .in('id', accountIds);

    const validIds = (validAccounts || []).map((a: any) => a.id);
    if (validIds.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No valid accounts found' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build query
    let query = supabase
      .from('mail_messages')
      .select('*')
      .in('account_id', validIds)
      .order('received_at', { ascending: false })
      .limit(Math.min(limit, 100));

    // Folder filter
    if (folder) {
      query = query.eq('folder', folder.toUpperCase());
    }

    // Boolean filters
    if (unreadOnly) {
      query = query.eq('is_read', false);
    }
    if (starredOnly) {
      query = query.eq('is_starred', true);
    }
    if (hasAttachments) {
      query = query.eq('has_attachments', true);
    }

    // Date range
    if (fromDate) {
      query = query.gte('received_at', fromDate);
    }
    if (toDate) {
      query = query.lte('received_at', toDate);
    }

    // Cursor-based pagination
    if (cursor) {
      query = query.lt('received_at', cursor);
    }

    // Full-text search via ILIKE (sufficient for <10k messages per user)
    if (q && q.trim().length > 0) {
      const searchTerm = `%${q.trim()}%`;
      query = query.or(
        `subject.ilike.${searchTerm},from_address.ilike.${searchTerm},from_name.ilike.${searchTerm},snippet.ilike.${searchTerm}`
      );
    }

    const { data: messages, error: queryError } = await query;

    if (queryError) {
      console.error('Search query error:', queryError);
      return new Response(
        JSON.stringify({ error: 'Search failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determine next cursor for pagination
    const results = messages || [];
    const nextCursor = results.length === Math.min(limit, 100) && results.length > 0
      ? results[results.length - 1].received_at
      : null;

    return new Response(
      JSON.stringify({ 
        messages: results, 
        nextCursor,
        total: results.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Mail search error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
