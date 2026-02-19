/**
 * useInsuranceDMS — Hook für automatische Versicherungs-DMS-Ordnerstruktur
 * 
 * Erstellt bei Versicherungsanlage automatisch:
 * 1. Root-Ordner (entity_type: 'insurance', entity_id)
 * 2. 5 Unterordner (01_Police bis 05_Sonstiges)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RECORD_CARD_TYPES } from '@/config/recordCardManifest';

interface CreateInsuranceDMSParams {
  insuranceId: string;
  insuranceName: string;
  tenantId: string;
}

export function useInsuranceDMS() {
  const queryClient = useQueryClient();
  const config = RECORD_CARD_TYPES.insurance;

  const createInsuranceDMSTree = useMutation({
    mutationFn: async ({ insuranceId, insuranceName, tenantId }: CreateInsuranceDMSParams) => {
      // Check if root folder already exists
      const { data: existing } = await supabase
        .from('storage_nodes')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('entity_type', 'insurance')
        .eq('entity_id', insuranceId)
        .eq('node_type', 'folder')
        .is('parent_id', null)
        .maybeSingle();

      if (existing?.id) return { rootFolderId: existing.id };

      // 1. Create root folder
      const { data: rootFolder, error: rootError } = await supabase
        .from('storage_nodes')
        .insert({
          tenant_id: tenantId,
          name: insuranceName,
          node_type: 'folder',
          module_code: config.moduleCode,
          entity_type: 'insurance',
          entity_id: insuranceId,
          parent_id: null,
          auto_created: true,
        } as any)
        .select('id')
        .single();

      if (rootError) throw rootError;

      // 2. Create subfolders from manifest
      const subfolders = config.dmsFolders.map(name => ({
        tenant_id: tenantId,
        name,
        node_type: 'folder',
        module_code: config.moduleCode,
        entity_type: 'insurance',
        entity_id: insuranceId,
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
      queryClient.invalidateQueries({ queryKey: ['entity-storage-root', vars.tenantId, 'insurance', vars.insuranceId] });
      queryClient.invalidateQueries({ queryKey: ['entity-storage-nodes', vars.tenantId, 'insurance', vars.insuranceId] });
    },
    onError: (error) => {
      console.error('Insurance DMS tree creation failed:', error);
    },
  });

  return { createInsuranceDMSTree };
}
