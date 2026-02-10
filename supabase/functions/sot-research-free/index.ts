const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query_text, research_target } = await req.json();

    if (!query_text) {
      return new Response(
        JSON.stringify({ success: false, error: 'query_text is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Research free query:', query_text, 'target:', research_target);

    // STUB: Return mock data. Will be replaced with Firecrawl + AI summarization.
    const mockResult = {
      session_id: crypto.randomUUID(),
      result: {
        title: `Recherche: ${query_text.substring(0, 50)}`,
        summary_md: `**Zusammenfassung:** Dies ist ein Platzhalter für die KI-gestützte Recherche zu "${query_text}".\n\nDie vollständige Integration mit Firecrawl und KI-Summarisierung wird in der nächsten Phase implementiert.`,
        sources: [
          { title: 'Beispielquelle 1', url: 'https://example.com/1' },
          { title: 'Beispielquelle 2', url: 'https://example.com/2' },
        ],
        entities: [],
      },
    };

    return new Response(
      JSON.stringify({ success: true, data: mockResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in sot-research-free:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
