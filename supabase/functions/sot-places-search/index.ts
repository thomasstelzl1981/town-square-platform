import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface SearchRequest {
  query: string;
  location?: string;
  radius?: number; // in meters
  type?: string; // e.g., "plumber", "electrician"
}

interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
  geometry?: {
    location: { lat: number; lng: number };
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const GOOGLE_PLACES_API_KEY =
      Deno.env.get('GOOGLE_PLACES_API_KEY') ??
      Deno.env.get('GOOGLE_MAPS_API_KEY') ??
      Deno.env.get('VITE_GOOGLE_MAPS_API_KEY') ??
      '';

    if (!GOOGLE_PLACES_API_KEY) {
      console.warn(
        'No Google API key configured (GOOGLE_PLACES_API_KEY / GOOGLE_MAPS_API_KEY) - returning mock data',
      );
      // Return mock data for development/testing
      return new Response(
        JSON.stringify({
          results: [
            {
              place_id: 'mock_1',
              name: 'Mustermann Sanitär GmbH',
              formatted_address: 'Musterstraße 1, 10115 Berlin',
              phone_number: '+49 30 12345678',
              website: 'https://example.com',
              rating: 4.5,
              user_ratings_total: 42,
              types: ['plumber', 'establishment'],
            },
            {
              place_id: 'mock_2',
              name: 'Berlin Handwerk Service',
              formatted_address: 'Hauptstraße 25, 10117 Berlin',
              phone_number: '+49 30 87654321',
              rating: 4.2,
              user_ratings_total: 28,
              types: ['general_contractor', 'establishment'],
            },
            {
              place_id: 'mock_3',
              name: 'Sanitär Express 24h',
              formatted_address: 'Nebenweg 12, 10119 Berlin',
              phone_number: '+49 30 11223344',
              website: 'https://sanitaer-express.example.com',
              rating: 4.8,
              user_ratings_total: 156,
              types: ['plumber', 'establishment'],
            },
          ],
          status: 'MOCK_DATA',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const { query, location, radius = 25000 }: SearchRequest = await req.json();

    if (!query) {
      throw new Error('Search query is required');
    }

    console.log(`Searching for: "${query}" near "${location || 'default'}"`);

    // Step 1: Text Search to find places
    const searchUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
    searchUrl.searchParams.set('query', query);
    searchUrl.searchParams.set('key', GOOGLE_PLACES_API_KEY);
    searchUrl.searchParams.set('language', 'de');
    searchUrl.searchParams.set('region', 'de');
    
    if (radius) {
      searchUrl.searchParams.set('radius', radius.toString());
    }

    const searchResponse = await fetch(searchUrl.toString());
    const searchData = await searchResponse.json();

    if (searchData.status !== 'OK' && searchData.status !== 'ZERO_RESULTS') {
      console.error('Places API error:', searchData);
      throw new Error(`Places API error: ${searchData.status}`);
    }

    const results: PlaceResult[] = [];

    // Step 2: Get details for each place (limited to first 10)
    const places = (searchData.results || []).slice(0, 10);
    
    for (const place of places) {
      try {
        const detailsUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
        detailsUrl.searchParams.set('place_id', place.place_id);
        detailsUrl.searchParams.set('key', GOOGLE_PLACES_API_KEY);
        detailsUrl.searchParams.set('fields', 'place_id,name,formatted_address,formatted_phone_number,website,rating,user_ratings_total,types,geometry');
        detailsUrl.searchParams.set('language', 'de');

        const detailsResponse = await fetch(detailsUrl.toString());
        const detailsData = await detailsResponse.json();

        if (detailsData.status === 'OK' && detailsData.result) {
          const detail = detailsData.result;
          results.push({
            place_id: detail.place_id,
            name: detail.name,
            formatted_address: detail.formatted_address,
            phone_number: detail.formatted_phone_number,
            website: detail.website,
            rating: detail.rating,
            user_ratings_total: detail.user_ratings_total,
            types: detail.types,
            geometry: detail.geometry,
          });
        }
      } catch (detailError) {
        console.error(`Error fetching details for ${place.place_id}:`, detailError);
        // Still include basic info from search
        results.push({
          place_id: place.place_id,
          name: place.name,
          formatted_address: place.formatted_address,
          rating: place.rating,
          user_ratings_total: place.user_ratings_total,
          types: place.types,
        });
      }
    }

    console.log(`Found ${results.length} results`);

    return new Response(
      JSON.stringify({ 
        results,
        status: searchData.status,
        total: results.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in sot-places-search:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        results: [],
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
