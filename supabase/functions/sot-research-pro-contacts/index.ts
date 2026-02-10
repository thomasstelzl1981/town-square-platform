const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { company, domain, role, region, keywords, limit = 25 } = await req.json();

    console.log('Pro contact search:', { company, domain, role, region, keywords, limit });

    // STUB: Return mock candidates. Will be replaced with Apollo API.
    const mockCandidates = Array.from({ length: Math.min(limit, 10) }, (_, i) => ({
      id: crypto.randomUUID(),
      full_name: `Demo Kontakt ${i + 1}`,
      first_name: 'Demo',
      last_name: `Kontakt ${i + 1}`,
      role: role || 'Geschäftsführer',
      company: company || `Demo Firma ${i + 1} GmbH`,
      domain: domain || `demo${i + 1}.de`,
      location: region || 'München',
      email: `d***@demo${i + 1}.de`,
      phone: '',
      confidence: Math.round((0.7 + Math.random() * 0.3) * 100) / 100,
      status: 'new',
    }));

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          session_id: crypto.randomUUID(),
          candidates: mockCandidates,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in sot-research-pro-contacts:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
