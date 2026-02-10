const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { candidate_ids } = await req.json();

    if (!candidate_ids || !Array.isArray(candidate_ids) || candidate_ids.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'candidate_ids[] is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Import candidates:', candidate_ids.length);

    // STUB: Will implement credit check, dedup, upsert to contacts, credit_ledger entries
    const mockResult = {
      contacts: candidate_ids.map((id: string) => ({ id: crypto.randomUUID(), candidate_id: id })),
      credits_consumed: candidate_ids.length,
      duplicates_skipped: 0,
    };

    return new Response(
      JSON.stringify({ success: true, data: mockResult }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in sot-contacts-import:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
