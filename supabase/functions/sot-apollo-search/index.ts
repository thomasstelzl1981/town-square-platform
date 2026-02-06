/**
 * SOT-APOLLO-SEARCH
 * 
 * Apollo.io API integration for contact/company search
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ApolloSearchParams {
  mandateId: string;
  query?: string;
  titles?: string[];
  industries?: string[];
  locations?: string[];
  companySize?: string;
  limit?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const APOLLO_API_KEY = Deno.env.get('APOLLO_API_KEY');

    if (!APOLLO_API_KEY) {
      // Return demo data if no API key
      return new Response(
        JSON.stringify({
          success: true,
          demo: true,
          message: 'APOLLO_API_KEY not configured - returning demo data',
          contacts: getDemoContacts(),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const params: ApolloSearchParams = await req.json();

    // Get mandate for tenant_id
    const { data: mandate } = await supabase
      .from('acq_mandates')
      .select('tenant_id, search_area')
      .eq('id', params.mandateId)
      .single();

    if (!mandate) {
      throw new Error('Mandate not found');
    }

    // Build Apollo search query
    const apolloQuery: Record<string, unknown> = {
      q_keywords: params.query || 'Immobilienmakler',
      per_page: params.limit || 25,
      person_titles: params.titles || ['Geschäftsführer', 'Inhaber', 'Makler', 'Vertriebsleiter'],
    };

    // Add location filter from mandate search_area or params
    const searchArea = mandate.search_area as Record<string, unknown>;
    if (params.locations?.length) {
      apolloQuery.person_locations = params.locations;
    } else if (searchArea?.cities) {
      apolloQuery.person_locations = searchArea.cities;
    } else if (searchArea?.states) {
      apolloQuery.person_locations = searchArea.states;
    }

    // Add industry filter
    if (params.industries?.length) {
      apolloQuery.organization_industries = params.industries;
    } else {
      apolloQuery.organization_industries = ['Real Estate', 'Real Estate Agents'];
    }

    // Call Apollo API
    const apolloResponse = await fetch('https://api.apollo.io/v1/mixed_people/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Api-Key': APOLLO_API_KEY,
      },
      body: JSON.stringify(apolloQuery),
    });

    if (!apolloResponse.ok) {
      const errorText = await apolloResponse.text();
      throw new Error(`Apollo API error: ${apolloResponse.status} - ${errorText}`);
    }

    const apolloData = await apolloResponse.json();
    const contacts = apolloData.people || [];

    // Transform and store in staging
    const stagingContacts = contacts.map((person: any) => ({
      tenant_id: mandate.tenant_id,
      mandate_id: params.mandateId,
      source: 'apollo',
      source_id: person.id,
      company_name: person.organization?.name,
      first_name: person.first_name,
      last_name: person.last_name,
      email: person.email,
      phone: person.phone_numbers?.[0]?.sanitized_number,
      website_url: person.organization?.website_url,
      role_guess: person.title?.includes('Makler') ? 'makler' : 
                  person.title?.includes('Geschäftsführer') ? 'eigentuemer' : 'makler',
      service_area: person.city || person.state,
      quality_score: person.email ? 70 : 50,
      enrichment_data: {
        apollo_id: person.id,
        title: person.title,
        linkedin_url: person.linkedin_url,
        organization: {
          name: person.organization?.name,
          industry: person.organization?.industry,
          website: person.organization?.website_url,
          employee_count: person.organization?.estimated_num_employees,
        },
      },
    }));

    // Insert into staging (skip duplicates by dedupe_key)
    if (stagingContacts.length > 0) {
      const { error: insertError } = await supabase
        .from('contact_staging')
        .upsert(stagingContacts, { 
          onConflict: 'dedupe_key',
          ignoreDuplicates: true,
        });

      if (insertError) {
        console.error('Failed to store contacts:', insertError);
      }
    }

    console.log('Apollo search complete:', { 
      query: params.query, 
      found: contacts.length,
      stored: stagingContacts.length,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        total: apolloData.pagination?.total_entries || contacts.length,
        contacts: stagingContacts,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sot-apollo-search:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Demo contacts for when API key is not configured
function getDemoContacts() {
  return [
    {
      source: 'apollo_demo',
      company_name: 'Musterhaus Immobilien GmbH',
      first_name: 'Max',
      last_name: 'Mustermann',
      email: 'max.mustermann@musterhaus-immo.de',
      phone: '+49 30 12345678',
      role_guess: 'makler',
      service_area: 'Berlin',
      quality_score: 75,
    },
    {
      source: 'apollo_demo',
      company_name: 'Beispiel Makler',
      first_name: 'Erika',
      last_name: 'Beispiel',
      email: 'e.beispiel@beispiel-makler.de',
      phone: '+49 89 87654321',
      role_guess: 'makler',
      service_area: 'München',
      quality_score: 70,
    },
    {
      source: 'apollo_demo',
      company_name: 'Norddeutsche Immobilien AG',
      first_name: 'Hans',
      last_name: 'Schmidt',
      email: 'h.schmidt@nordimmo.de',
      phone: '+49 40 11223344',
      role_guess: 'eigentuemer',
      service_area: 'Hamburg',
      quality_score: 80,
    },
  ];
}
