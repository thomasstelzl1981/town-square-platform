/**
 * SOT-CONTACTS-SYNC Edge Function
 * 
 * Synchronizes contacts with external providers:
 * - Google People API
 * - Microsoft Graph Contacts API
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ContactsSyncRequest {
  accountId: string;
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

    const body: ContactsSyncRequest = await req.json();
    const { accountId, limit = 100 } = body;

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

    console.log(`Contacts sync for ${account.provider}: ${account.email_address}`);

    // Get user's tenant
    const { data: profile } = await supabase
      .from('profiles')
      .select('active_tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile?.active_tenant_id) {
      return new Response(
        JSON.stringify({ error: 'No active tenant' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let contacts: any[] = [];
    
    if (account.provider === 'google') {
      contacts = await fetchGoogleContacts(account, limit);
    } else if (account.provider === 'microsoft') {
      contacts = await fetchMicrosoftContacts(account, limit);
    } else {
      return new Response(
        JSON.stringify({ error: 'Contacts sync not supported for this provider' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Upsert contacts
    let synced = 0;
    const externalIdField = account.provider === 'google' ? 'google_contact_id' : 'microsoft_contact_id';

    for (const contact of contacts) {
      // Check if contact already exists
      const { data: existing } = await supabase
        .from('contacts')
        .select('id')
        .eq('tenant_id', profile.active_tenant_id)
        .eq(externalIdField, contact.external_id)
        .single();

      if (existing) {
        // Update existing contact
        const { error } = await supabase
          .from('contacts')
          .update({
            first_name: contact.first_name,
            last_name: contact.last_name,
            email: contact.email,
            phone: contact.phone,
            company: contact.company,
            synced_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (!error) synced++;
      } else {
        // Create new contact
        const { error } = await supabase
          .from('contacts')
          .insert({
            tenant_id: profile.active_tenant_id,
            first_name: contact.first_name,
            last_name: contact.last_name,
            email: contact.email,
            phone: contact.phone,
            company: contact.company,
            [externalIdField]: contact.external_id,
            synced_from: account.provider,
            synced_at: new Date().toISOString(),
            public_id: crypto.randomUUID().slice(0, 8),
          });

        if (!error) synced++;
      }
    }

    console.log(`Synced ${synced} contacts from ${account.provider}`);

    return new Response(
      JSON.stringify({ success: true, syncedContacts: synced }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Contacts sync error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Fetch contacts from Google People API
async function fetchGoogleContacts(account: any, limit: number): Promise<any[]> {
  if (!account.access_token) {
    throw new Error('No access token available');
  }

  const response = await fetch(
    `https://people.googleapis.com/v1/people/me/connections?pageSize=${limit}&personFields=names,emailAddresses,phoneNumbers,organizations`,
    {
      headers: {
        Authorization: `Bearer ${account.access_token}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Access token expired');
    }
    throw new Error(`Google People API error: ${response.status}`);
  }

  const data = await response.json();
  return (data.connections || []).map((person: any) => {
    const name = person.names?.[0] || {};
    const email = person.emailAddresses?.[0]?.value;
    const phone = person.phoneNumbers?.[0]?.value;
    const org = person.organizations?.[0]?.name;

    return {
      external_id: person.resourceName,
      first_name: name.givenName || '',
      last_name: name.familyName || '',
      email,
      phone,
      company: org,
    };
  }).filter((c: any) => c.first_name || c.last_name || c.email);
}

// Fetch contacts from Microsoft Graph API
async function fetchMicrosoftContacts(account: any, limit: number): Promise<any[]> {
  if (!account.access_token) {
    throw new Error('No access token available');
  }

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/contacts?$top=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${account.access_token}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Access token expired');
    }
    throw new Error(`Microsoft Graph API error: ${response.status}`);
  }

  const data = await response.json();
  return (data.value || []).map((contact: any) => ({
    external_id: contact.id,
    first_name: contact.givenName || '',
    last_name: contact.surname || '',
    email: contact.emailAddresses?.[0]?.address,
    phone: contact.mobilePhone || contact.businessPhones?.[0],
    company: contact.companyName,
  })).filter((c: any) => c.first_name || c.last_name || c.email);
}
