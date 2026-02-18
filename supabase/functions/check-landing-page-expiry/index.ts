import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Lock all expired preview landing pages
    const { data, error } = await supabase
      .from('landing_pages')
      .update({ status: 'locked', locked_at: new Date().toISOString() })
      .eq('status', 'preview')
      .lt('preview_expires_at', new Date().toISOString())
      .is('booked_at', null)
      .select('id, slug');

    if (error) throw error;

    const lockedCount = data?.length || 0;
    console.log(`Locked ${lockedCount} expired landing pages`);

    return new Response(
      JSON.stringify({ locked: lockedCount, pages: data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Error:', err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
