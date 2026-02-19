/**
 * useVorsorgeDMS — Hook für automatische Vorsorge-DMS-Ordnerstruktur
 * 
 * Erstellt bei Vorsorgeanlage automatisch:
 * 1. Root-Ordner (entity_type: 'vorsorge', entity_id)
 * 2. 4 Unterordner (01_Vertrag bis 04_Korrespondenz)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RECORD_CARD_TYPES } from '@/config/recordCardManifest';

interface CreateVorsorgeDMSParams {
  vorsorgeId: string;
  vorsorgeName: string;
  tenantId: string;
}

export function useVorsorgeDMS() {
  const queryClient = useQueryClient();
  const config = RECORD_CARD_TYPES.vorsorge;

  const createVorsorgeDMSTree = useMutation({
    mutationFn: async ({ vorsorgeId, vorsorgeName, tenantId }: CreateVorsorgeDMSParams) => {
      const { data: existing } = await supabase
        .from('storage_nodes')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('entity_type', 'vorsorge')
        .eq('entity_id', vorsorgeId)
        .eq('node_type', 'folder')
        .is('parent_id', null)
        .maybeSingle();

      if (existing?.id) return { rootFolderId: existing.id };

      const { data: rootFolder, error: rootError } = await supabase
        .from('storage_nodes')
        .insert({
          tenant_id: tenantId,
          name: vorsorgeName,
          node_type: 'folder',
          module_code: config.moduleCode,
          entity_type: 'vorsorge',
          entity_id: vorsorgeId,
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
        entity_type: 'vorsorge',
        entity_id: vorsorgeId,
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
      queryClient.invalidateQueries({ queryKey: ['entity-storage-root', vars.tenantId, 'vorsorge', vars.vorsorgeId] });
      queryClient.invalidateQueries({ queryKey: ['entity-storage-nodes', vars.tenantId, 'vorsorge', vars.vorsorgeId] });
    },
    onError: (error) => {
      console.error('Vorsorge DMS tree creation failed:', error);
    },
  });

  return { createVorsorgeDMSTree };
}
