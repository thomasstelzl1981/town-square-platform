/**
 * ZenQuotes Proxy Edge Function
 * 
 * Proxies requests to ZenQuotes API to avoid CORS issues.
 * Implements aggressive caching (24h) to respect rate limits.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory cache for the daily quote
let cachedQuote: { quote: string; author: string; cachedAt: number } | null = null;
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const now = Date.now();

    // Return cached quote if still valid
    if (cachedQuote && (now - cachedQuote.cachedAt) < CACHE_DURATION_MS) {
      console.log('Returning cached quote');
      return new Response(
        JSON.stringify({
          quote: cachedQuote.quote,
          author: cachedQuote.author,
          cached: true,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch fresh quote from ZenQuotes
    console.log('Fetching fresh quote from ZenQuotes');
    const response = await fetch('https://zenquotes.io/api/today', {
      headers: {
        'User-Agent': 'SOT-Dashboard/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`ZenQuotes API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data || !data[0]) {
      throw new Error('Invalid response from ZenQuotes');
    }

    const quote = data[0].q;
    const author = data[0].a;

    // Update cache
    cachedQuote = {
      quote,
      author,
      cachedAt: now,
    };

    return new Response(
      JSON.stringify({
        quote,
        author,
        cached: false,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('ZenQuotes proxy error:', error);
    
    // Return fallback quote on error
    return new Response(
      JSON.stringify({
        quote: "Der beste Weg, die Zukunft vorherzusagen, ist, sie zu gestalten.",
        author: "Peter Drucker",
        fallback: true,
        error: error.message,
      }),
      { 
        status: 200, // Return 200 with fallback to not break UI
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
