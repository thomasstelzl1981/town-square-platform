/**
 * SOT-CALENDAR-SYNC Edge Function
 * 
 * Synchronizes calendar events with external providers:
 * - Google Calendar API
 * - Microsoft Graph Calendar API
 * 
 * Supports bidirectional sync:
 * - pull: Fetch events from external calendar
 * - push: Create event in external calendar
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface CalendarSyncRequest {
  action: 'pull' | 'push';
  accountId: string;
  eventId?: string;  // For push action
  startDate?: string;
  endDate?: string;
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

    const body: CalendarSyncRequest = await req.json();
    const { action, accountId, eventId, startDate, endDate } = body;

    if (!accountId || !action) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: accountId, action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the mail account (which has calendar access too)
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

    console.log(`Calendar ${action} for ${account.provider}: ${account.email_address}`);

    if (action === 'pull') {
      // Pull events from external calendar
      let events: any[] = [];
      
      if (account.provider === 'google') {
        events = await pullGoogleCalendar(account, startDate, endDate);
      } else if (account.provider === 'microsoft') {
        events = await pullMicrosoftCalendar(account, startDate, endDate);
      }

      // Upsert events into calendar_events
      let synced = 0;
      for (const event of events) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('active_tenant_id')
          .eq('id', user.id)
          .single();

        const externalIdField = account.provider === 'google' ? 'google_event_id' : 'microsoft_event_id';
        
        const { error } = await supabase
          .from('calendar_events')
          .upsert({
            tenant_id: profile?.active_tenant_id,
            created_by: user.id,
            title: event.title,
            description: event.description,
            start_at: event.start_at,
            end_at: event.end_at,
            all_day: event.all_day,
            location: event.location,
            [externalIdField]: event.external_id,
            synced_from: account.provider,
            synced_at: new Date().toISOString(),
            ical_uid: event.ical_uid,
          }, {
            onConflict: externalIdField,
          });

        if (!error) synced++;
      }

      return new Response(
        JSON.stringify({ success: true, syncedEvents: synced }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'push') {
      // Push local event to external calendar
      if (!eventId) {
        return new Response(
          JSON.stringify({ error: 'Missing eventId for push action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: event, error: eventError } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError || !event) {
        return new Response(
          JSON.stringify({ error: 'Event not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let externalId: string | null = null;

      if (account.provider === 'google') {
        externalId = await pushGoogleCalendar(account, event);
      } else if (account.provider === 'microsoft') {
        externalId = await pushMicrosoftCalendar(account, event);
      }

      if (externalId) {
        // Update event with external ID
        const externalIdField = account.provider === 'google' ? 'google_event_id' : 'microsoft_event_id';
        await supabase
          .from('calendar_events')
          .update({ 
            [externalIdField]: externalId,
            synced_from: account.provider,
            synced_at: new Date().toISOString(),
          })
          .eq('id', eventId);
      }

      return new Response(
        JSON.stringify({ success: !!externalId, externalId }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Calendar sync error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Pull events from Google Calendar
async function pullGoogleCalendar(
  account: any,
  startDate?: string,
  endDate?: string
): Promise<any[]> {
  if (!account.access_token) {
    throw new Error('No access token available');
  }

  const timeMin = startDate || new Date().toISOString();
  const timeMax = endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`,
    {
      headers: {
        Authorization: `Bearer ${account.access_token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Google Calendar API error: ${response.status}`);
  }

  const data = await response.json();
  return (data.items || []).map((item: any) => ({
    external_id: item.id,
    title: item.summary || '(Kein Titel)',
    description: item.description || null,
    start_at: item.start?.dateTime || item.start?.date,
    end_at: item.end?.dateTime || item.end?.date,
    all_day: !!item.start?.date,
    location: item.location || null,
    ical_uid: item.iCalUID,
  }));
}

// Push event to Google Calendar
async function pushGoogleCalendar(account: any, event: any): Promise<string | null> {
  if (!account.access_token) {
    throw new Error('No access token available');
  }

  const googleEvent = {
    summary: event.title,
    description: event.description,
    location: event.location,
    start: event.all_day 
      ? { date: event.start_at.split('T')[0] }
      : { dateTime: event.start_at, timeZone: 'Europe/Berlin' },
    end: event.all_day
      ? { date: (event.end_at || event.start_at).split('T')[0] }
      : { dateTime: event.end_at || event.start_at, timeZone: 'Europe/Berlin' },
  };

  const response = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${account.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(googleEvent),
    }
  );

  if (!response.ok) {
    console.error('Google Calendar push error:', await response.text());
    return null;
  }

  const data = await response.json();
  return data.id;
}

// Pull events from Microsoft Calendar
async function pullMicrosoftCalendar(
  account: any,
  startDate?: string,
  endDate?: string
): Promise<any[]> {
  if (!account.access_token) {
    throw new Error('No access token available');
  }

  const start = startDate || new Date().toISOString();
  const end = endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/me/calendarview?startDateTime=${encodeURIComponent(start)}&endDateTime=${encodeURIComponent(end)}`,
    {
      headers: {
        Authorization: `Bearer ${account.access_token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Microsoft Graph API error: ${response.status}`);
  }

  const data = await response.json();
  return (data.value || []).map((item: any) => ({
    external_id: item.id,
    title: item.subject || '(Kein Titel)',
    description: item.bodyPreview || null,
    start_at: item.start?.dateTime,
    end_at: item.end?.dateTime,
    all_day: item.isAllDay,
    location: item.location?.displayName || null,
    ical_uid: item.iCalUId,
  }));
}

// Push event to Microsoft Calendar
async function pushMicrosoftCalendar(account: any, event: any): Promise<string | null> {
  if (!account.access_token) {
    throw new Error('No access token available');
  }

  const msEvent = {
    subject: event.title,
    body: {
      contentType: 'Text',
      content: event.description || '',
    },
    start: {
      dateTime: event.start_at,
      timeZone: 'Europe/Berlin',
    },
    end: {
      dateTime: event.end_at || event.start_at,
      timeZone: 'Europe/Berlin',
    },
    isAllDay: event.all_day,
    location: event.location ? { displayName: event.location } : undefined,
  };

  const response = await fetch(
    'https://graph.microsoft.com/v1.0/me/events',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${account.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(msEvent),
    }
  );

  if (!response.ok) {
    console.error('Microsoft Calendar push error:', await response.text());
    return null;
  }

  const data = await response.json();
  return data.id;
}
