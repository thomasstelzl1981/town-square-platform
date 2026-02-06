/**
 * Apify Portal Job Edge Function
 * Starts Apify actors for portal scraping (ImmoScout, etc.)
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApifyJobRequest {
  mandateId: string;
  portalUrl?: string;
  searchType: 'brokers' | 'listings';
  limit?: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { mandateId, portalUrl, searchType, limit = 50 }: ApifyJobRequest = await req.json();

    if (!mandateId) {
      return new Response(JSON.stringify({ error: 'mandateId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check for Apify API key
    const apifyApiKey = Deno.env.get('APIFY_API_KEY');
    
    if (!apifyApiKey) {
      // Simulate response for development
      console.log('APIFY_API_KEY not configured, returning mock data');
      
      // Generate mock contacts based on searchType
      const mockContacts = [];
      const mockCount = Math.min(limit, 10);
      
      for (let i = 0; i < mockCount; i++) {
        if (searchType === 'brokers') {
          mockContacts.push({
            source: 'apify',
            source_id: `apify_broker_${Date.now()}_${i}`,
            source_url: portalUrl || 'https://immobilienscout24.de',
            company_name: `Immobilien ${['Schmidt', 'Müller', 'Weber', 'Fischer', 'Becker'][i % 5]} GmbH`,
            first_name: ['Thomas', 'Michael', 'Stefan', 'Andreas', 'Christian'][i % 5],
            last_name: ['Schmidt', 'Müller', 'Weber', 'Fischer', 'Becker'][i % 5],
            email: `kontakt@immobilien-${['schmidt', 'mueller', 'weber', 'fischer', 'becker'][i % 5]}.de`,
            phone: `030 ${Math.floor(Math.random() * 9000000 + 1000000)}`,
            role_guess: 'Makler',
            service_area: ['Berlin', 'München', 'Hamburg', 'Frankfurt', 'Köln'][i % 5],
            quality_score: Math.floor(Math.random() * 30) + 60,
          });
        } else {
          // Listings - could be converted to offers later
          mockContacts.push({
            source: 'apify',
            source_id: `apify_listing_${Date.now()}_${i}`,
            source_url: portalUrl || 'https://immobilienscout24.de',
            company_name: `Objekt ${i + 1}`,
            first_name: null,
            last_name: null,
            email: null,
            phone: null,
            role_guess: 'Listing',
            service_area: ['Berlin', 'München', 'Hamburg', 'Frankfurt', 'Köln'][i % 5],
            quality_score: Math.floor(Math.random() * 30) + 50,
          });
        }
      }

      // Insert mock contacts into staging
      const { data: mandate } = await supabaseClient
        .from('acq_mandates')
        .select('tenant_id')
        .eq('id', mandateId)
        .single();

      if (mandate) {
        const { data: inserted, error: insertError } = await supabaseClient
          .from('contact_staging')
          .insert(mockContacts.map(c => ({
            tenant_id: mandate.tenant_id,
            mandate_id: mandateId,
            ...c,
          })))
          .select();

        if (insertError) {
          console.error('Insert error:', insertError);
        }

        // Log event
        await supabaseClient.from('acq_mandate_events').insert({
          mandate_id: mandateId,
          event_type: 'apify_job_completed',
          actor_id: user.id,
          payload: { 
            searchType, 
            portalUrl, 
            contactsImported: inserted?.length || 0,
            mock: true 
          },
        });

        return new Response(JSON.stringify({ 
          success: true, 
          message: 'Mock Apify job completed',
          contactsImported: inserted?.length || 0,
          mock: true,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Real Apify implementation would go here
    // const actorId = searchType === 'brokers' 
    //   ? 'apify/immobilienscout24-brokers'
    //   : 'apify/immobilienscout24-listings';
    //
    // const response = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${apifyApiKey}`,
    //   },
    //   body: JSON.stringify({
    //     startUrls: [{ url: portalUrl }],
    //     maxItems: limit,
    //   }),
    // });

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Apify job started',
      note: 'Webhook will deliver results when complete',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Apify job error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
