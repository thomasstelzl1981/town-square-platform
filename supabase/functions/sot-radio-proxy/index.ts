/**
 * Radio Browser Proxy Edge Function
 * 
 * Proxies requests to Radio Browser API to avoid CORS issues in preview iframe.
 * Implements 1h in-memory cache.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface CachedData {
  stations: unknown[];
  cachedAt: number;
}

let cache: CachedData | null = null;
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

const SERVERS = [
  'https://de1.api.radio-browser.info',
  'https://nl1.api.radio-browser.info',
  'https://at1.api.radio-browser.info',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse limit from request body or default to 10
    let limit = 10;
    try {
      const body = await req.json();
      if (body?.limit && typeof body.limit === 'number' && body.limit > 0 && body.limit <= 50) {
        limit = body.limit;
      }
    } catch {
      // No body or invalid JSON, use default
    }

    const now = Date.now();

    // Return cached if valid
    if (cache && (now - cache.cachedAt) < CACHE_DURATION_MS) {
      return new Response(
        JSON.stringify({ stations: cache.stations.slice(0, limit), cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try servers in order
    for (const server of SERVERS) {
      try {
        const response = await fetch(`${server}/json/stations/topvote/50`, {
          headers: { 'User-Agent': 'SOT-Dashboard/1.0' },
        });

        if (response.ok) {
          const data = await response.json();
          const stations = data.filter((s: { url_resolved?: string }) => s.url_resolved);

          cache = { stations, cachedAt: now };

          return new Response(
            JSON.stringify({ stations: stations.slice(0, limit), cached: false }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } catch (e) {
        console.warn(`Radio server ${server} failed:`, e);
        continue;
      }
    }

    throw new Error('All Radio Browser servers unavailable');
  } catch (error) {
    console.error('Radio proxy error:', error);

    // Return empty with error info (don't break UI)
    return new Response(
      JSON.stringify({
        stations: [],
        error: error.message,
        fallback: true,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
