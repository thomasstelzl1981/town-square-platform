import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface SearchRequest {
  query: string;
  location?: string;
  radius?: number;
  type?: string;
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
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const GOOGLE_API_KEY =
      Deno.env.get('GOOGLE_PLACES_API_KEY') ??
      Deno.env.get('GOOGLE_MAPS_API_KEY') ??
      Deno.env.get('VITE_GOOGLE_MAPS_API_KEY') ??
      '';

    if (!GOOGLE_API_KEY) {
      console.warn('No Google API key configured — returning mock data');
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

    // --- Places API (New) — single request with all details ---
    const fieldMask = [
      'places.id',
      'places.displayName',
      'places.formattedAddress',
      'places.nationalPhoneNumber',
      'places.internationalPhoneNumber',
      'places.websiteUri',
      'places.rating',
      'places.userRatingCount',
      'places.types',
      'places.location',
    ].join(',');

    const searchBody: Record<string, unknown> = {
      textQuery: query,
      languageCode: 'de',
      regionCode: 'DE',
      maxResultCount: 10,
    };

    // Optional: location bias
    if (location) {
      // If location looks like "lat,lng" we can use it directly
      const latLngMatch = location.match(/^([-\d.]+),\s*([-\d.]+)$/);
      if (latLngMatch) {
        searchBody.locationBias = {
          circle: {
            center: {
              latitude: parseFloat(latLngMatch[1]),
              longitude: parseFloat(latLngMatch[2]),
            },
            radius: radius,
          },
        };
      }
    }

    const apiResponse = await fetch(
      'https://places.googleapis.com/v1/places:searchText',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_API_KEY,
          'X-Goog-FieldMask': fieldMask,
        },
        body: JSON.stringify(searchBody),
      },
    );

    const apiData = await apiResponse.json();

    if (!apiResponse.ok) {
      console.error('Places API (New) error:', JSON.stringify(apiData));
      throw new Error(
        `Places API error: ${apiData.error?.message || apiResponse.status}`,
      );
    }

    // Map the new API response to our existing PlaceResult shape
    const results: PlaceResult[] = (apiData.places || []).map((p: any) => ({
      place_id: p.id || '',
      name: p.displayName?.text || '',
      formatted_address: p.formattedAddress || '',
      phone_number: p.internationalPhoneNumber || p.nationalPhoneNumber || undefined,
      website: p.websiteUri || undefined,
      rating: p.rating ?? undefined,
      user_ratings_total: p.userRatingCount ?? undefined,
      types: p.types || [],
      geometry: p.location
        ? { location: { lat: p.location.latitude, lng: p.location.longitude } }
        : undefined,
    }));

    console.log(`Found ${results.length} results`);

    return new Response(
      JSON.stringify({
        results,
        status: 'OK',
        total: results.length,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
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
      },
    );
  }
});
