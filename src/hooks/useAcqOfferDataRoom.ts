/**
 * useAcqOfferDataRoom — Lazy Tree Creation for Akquise Offers
 * 
 * Creates a structured folder tree for an offer ONLY when documents
 * are requested (Preisvorschlag / Unterlagen anfordern).
 * 
 * Tree structure (under MOD_12_ROOT):
 *   {offer_title}/
 *     01_Expose/
 *     02_Unterlagen/
 *     03_Bewertung/
 * 
 * Also links the folder to acq_offers.data_room_folder_id
 */
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export function useAcqOfferDataRoom() {
  const { activeTenantId } = useAuth();

  const ensureOfferDataRoom = useCallback(async (offerId: string, offerTitle?: string) => {
    if (!activeTenantId) return null;

    try {
      // 1. Check if data_room_folder_id already exists
      const { data: offer } = await supabase
        .from('acq_offers')
        .select('data_room_folder_id, title')
        .eq('id', offerId)
        .single();

      if (offer?.data_room_folder_id) {
        return offer.data_room_folder_id; // Already created
      }

      const folderName = offerTitle || offer?.title || `Objekt ${offerId.substring(0, 8)}`;

      // 2. Find MOD_12_ROOT
      const { data: rootNode } = await supabase
        .from('storage_nodes')
        .select('id')
        .eq('tenant_id', activeTenantId)
        .eq('template_id', 'MOD_12_ROOT')
        .maybeSingle();

      if (!rootNode?.id) {
        console.warn('MOD_12_ROOT not found, cannot create data room');
        return null;
      }

      // 3. Create offer folder under root
      const { data: offerFolder, error: folderError } = await supabase
        .from('storage_nodes')
        .insert({
          tenant_id: activeTenantId,
          parent_id: rootNode.id,
          name: folderName,
          node_type: 'folder',
          module_code: 'MOD_12',
        })
        .select('id')
        .single();

      if (folderError) throw folderError;

      // 4. Create subfolders
      const subFolders = ['01_Expose', '02_Unterlagen', '03_Bewertung'];
      await supabase.from('storage_nodes').insert(
        subFolders.map((name) => ({
          tenant_id: activeTenantId,
          parent_id: offerFolder.id,
          name,
          node_type: 'folder' as const,
          module_code: 'MOD_12',
        }))
      );

      // 5. Link data room to offer
      await supabase
        .from('acq_offers')
        .update({ data_room_folder_id: offerFolder.id } as any)
        .eq('id', offerId);

      // 6. Move existing exposé files from 01_Expose (flat) into the new subfolder
      const { data: exposeSubFolder } = await supabase
        .from('storage_nodes')
        .select('id')
        .eq('parent_id', offerFolder.id)
        .eq('name', '01_Expose')
        .maybeSingle();

      if (exposeSubFolder?.id) {
        // Find offer documents to match storage_paths
        const { data: offerDocs } = await supabase
          .from('acq_offer_documents')
          .select('storage_path, file_name')
          .eq('offer_id', offerId);

        if (offerDocs?.length) {
          const storagePaths = offerDocs.map((d) => d.storage_path);
          
          // Find matching file nodes in the flat 01_Expose folder under root
          const { data: flatExposeFolder } = await supabase
            .from('storage_nodes')
            .select('id')
            .eq('tenant_id', activeTenantId)
            .eq('parent_id', rootNode.id)
            .eq('name', '01_Expose')
            .eq('node_type', 'folder')
            .maybeSingle();

          if (flatExposeFolder?.id) {
            const { data: fileNodes } = await supabase
              .from('storage_nodes')
              .select('id')
              .eq('parent_id', flatExposeFolder.id)
              .in('storage_path', storagePaths);

            if (fileNodes?.length) {
              // Move files to the new offer-specific 01_Expose subfolder
              for (const node of fileNodes) {
                await supabase
                  .from('storage_nodes')
                  .update({ parent_id: exposeSubFolder.id })
                  .eq('id', node.id);
              }
            }
          }
        }
      }

      return offerFolder.id;
    } catch (error: any) {
      console.error('Data room creation error:', error);
      toast.error('Datenraum konnte nicht erstellt werden');
      return null;
    }
  }, [activeTenantId]);

  return { ensureOfferDataRoom };
}
