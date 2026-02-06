import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Nicht autorisiert' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify the user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Authentifizierung fehlgeschlagen' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { offerId, offerTitle } = await req.json();

    if (!offerId) {
      return new Response(JSON.stringify({ error: 'offerId ist erforderlich' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Creating data room for offer:', offerId, offerTitle);

    // 1. Get the offer to find tenant_id
    const { data: offer, error: offerError } = await supabase
      .from('acq_offers')
      .select('id, tenant_id, title, address')
      .eq('id', offerId)
      .single();

    if (offerError || !offer) {
      console.error('Offer not found:', offerError);
      return new Response(JSON.stringify({ error: 'Angebot nicht gefunden' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Find or create the Akquise root folder
    let akquiseRootId: string;
    
    const { data: existingRoot } = await supabase
      .from('storage_nodes')
      .select('id')
      .eq('tenant_id', offer.tenant_id)
      .eq('name', 'Akquise')
      .eq('node_type', 'folder')
      .is('parent_id', null)
      .single();

    if (existingRoot) {
      akquiseRootId = existingRoot.id;
    } else {
      // Create the Akquise root folder
      const { data: newRoot, error: rootError } = await supabase
        .from('storage_nodes')
        .insert({
          tenant_id: offer.tenant_id,
          name: 'Akquise',
          node_type: 'folder',
          parent_id: null,
          created_by: user.id,
        })
        .select()
        .single();

      if (rootError) {
        console.error('Failed to create root folder:', rootError);
        throw rootError;
      }
      akquiseRootId = newRoot.id;
    }

    // 3. Create the offer-specific folder
    const folderName = offerTitle || offer.title || offer.address || `Angebot ${offerId.slice(0, 8)}`;
    
    const { data: dataRoomFolder, error: folderError } = await supabase
      .from('storage_nodes')
      .insert({
        tenant_id: offer.tenant_id,
        name: folderName,
        node_type: 'folder',
        parent_id: akquiseRootId,
        object_type: 'acq_offer',
        object_id: offerId,
        created_by: user.id,
        metadata: {
          offer_id: offerId,
          created_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (folderError) {
      console.error('Failed to create data room folder:', folderError);
      throw folderError;
    }

    console.log('Data room folder created:', dataRoomFolder.id);

    // 4. Create standard subfolders
    const subfolders = [
      '01_Exposé',
      '02_Mietliste',
      '03_Grundbuch',
      '04_Energieausweis',
      '05_Fotos',
      '06_Korrespondenz',
      '07_Sonstiges',
    ];

    for (const subfolder of subfolders) {
      await supabase
        .from('storage_nodes')
        .insert({
          tenant_id: offer.tenant_id,
          name: subfolder,
          node_type: 'folder',
          parent_id: dataRoomFolder.id,
          created_by: user.id,
        });
    }

    // 5. Update the offer with the data room folder ID
    await supabase
      .from('acq_offers')
      .update({ data_room_folder_id: dataRoomFolder.id })
      .eq('id', offerId);

    console.log('Data room creation complete');

    return new Response(JSON.stringify({
      success: true,
      folderId: dataRoomFolder.id,
      folderName,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('sot-acq-create-dataroom error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
