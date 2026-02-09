/**
 * NASA APOD (Astronomy Picture of the Day) Edge Function
 * 
 * Fetches the daily astronomy picture from NASA.
 * Uses DEMO_KEY by default (30 req/hour) or custom key if configured.
 * Implements 24h caching.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// In-memory cache
let cachedAPOD: {
  title: string;
  explanation: string;
  url: string;
  hdurl?: string;
  media_type: string;
  date: string;
  copyright?: string;
  cachedAt: number;
} | null = null;

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const now = Date.now();

    // Return cached APOD if still valid
    if (cachedAPOD && (now - cachedAPOD.cachedAt) < CACHE_DURATION_MS) {
      console.log('Returning cached APOD');
      return new Response(
        JSON.stringify({ ...cachedAPOD, cached: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use custom API key if available, otherwise DEMO_KEY
    const apiKey = Deno.env.get('NASA_APOD_API_KEY') || 'DEMO_KEY';
    
    console.log('Fetching fresh APOD from NASA');
    const response = await fetch(
      `https://api.nasa.gov/planetary/apod?api_key=${apiKey}`,
      {
        headers: {
          'User-Agent': 'SOT-Dashboard/1.0',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('NASA API error:', response.status, errorText);
      throw new Error(`NASA API error: ${response.status}`);
    }

    const data = await response.json();

    // Update cache
    cachedAPOD = {
      title: data.title,
      explanation: data.explanation,
      url: data.url,
      hdurl: data.hdurl,
      media_type: data.media_type,
      date: data.date,
      copyright: data.copyright,
      cachedAt: now,
    };

    return new Response(
      JSON.stringify({ ...cachedAPOD, cached: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('NASA APOD error:', error);
    
    // Return fallback content on error
    return new Response(
      JSON.stringify({
        title: "Astronomie-Bild nicht verfügbar",
        explanation: "Das tägliche NASA-Bild konnte nicht geladen werden. Bitte versuchen Sie es später erneut.",
        url: null,
        media_type: 'image',
        date: new Date().toISOString().split('T')[0],
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
