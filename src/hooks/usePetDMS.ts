/**
 * usePetDMS — Hook für automatische Haustier-DMS-Ordnerstruktur
 * 
 * Erstellt bei Haustieranlage automatisch:
 * 1. Root-Ordner (entity_type: 'pet', entity_id)
 * 2. 4 Unterordner (01_Impfpass bis 04_Sonstiges)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RECORD_CARD_TYPES } from '@/config/recordCardManifest';

interface CreatePetDMSParams {
  petId: string;
  petName: string;
  tenantId: string;
}

export function usePetDMS() {
  const queryClient = useQueryClient();
  const config = RECORD_CARD_TYPES.pet;

  const createPetDMSTree = useMutation({
    mutationFn: async ({ petId, petName, tenantId }: CreatePetDMSParams) => {
      const { data: existing } = await supabase
        .from('storage_nodes')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('entity_type', 'pet')
        .eq('entity_id', petId)
        .eq('node_type', 'folder')
        .is('parent_id', null)
        .maybeSingle();

      if (existing?.id) return { rootFolderId: existing.id };

      const { data: rootFolder, error: rootError } = await supabase
        .from('storage_nodes')
        .insert({
          tenant_id: tenantId,
          name: petName,
          node_type: 'folder',
          module_code: config.moduleCode,
          entity_type: 'pet',
          entity_id: petId,
          parent_id: null,
          auto_created: true,
        } as any)
        .select('id')
        .single();

      if (rootError) throw rootError;

      const subfolders = config.dmsFolders.map(name => ({
        tenant_id: tenantId,
        name,
        node_type: 'folder',
        module_code: config.moduleCode,
        entity_type: 'pet',
        entity_id: petId,
        parent_id: rootFolder.id,
        auto_created: true,
      }));

      const { error: subError } = await supabase
        .from('storage_nodes')
        .insert(subfolders as any);

      if (subError) throw subError;

      return { rootFolderId: rootFolder.id };
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['entity-storage-root', vars.tenantId, 'pet', vars.petId] });
      queryClient.invalidateQueries({ queryKey: ['entity-storage-nodes', vars.tenantId, 'pet', vars.petId] });
    },
    onError: (error) => {
      console.error('Pet DMS tree creation failed:', error);
    },
  });

  return { createPetDMSTree };
}
