/**
 * useVehicleDMS — Hook für automatische Fahrzeug-DMS-Ordnerstruktur
 * 
 * Erstellt bei Fahrzeuganlage automatisch:
 * 1. Root-Ordner (entity_type: 'vehicle', entity_id)
 * 2. 5 Unterordner (01_Zulassung bis 05_Sonstiges)
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RECORD_CARD_TYPES } from '@/config/recordCardManifest';

interface CreateVehicleDMSParams {
  vehicleId: string;
  vehicleName: string;
  tenantId: string;
}

export function useVehicleDMS() {
  const queryClient = useQueryClient();
  const config = RECORD_CARD_TYPES.vehicle;

  const createVehicleDMSTree = useMutation({
    mutationFn: async ({ vehicleId, vehicleName, tenantId }: CreateVehicleDMSParams) => {
      const { data: existing } = await supabase
        .from('storage_nodes')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('entity_type', 'vehicle')
        .eq('entity_id', vehicleId)
        .eq('node_type', 'folder')
        .is('parent_id', null)
        .maybeSingle();

      if (existing?.id) return { rootFolderId: existing.id };

      const { data: rootFolder, error: rootError } = await supabase
        .from('storage_nodes')
        .insert({
          tenant_id: tenantId,
          name: vehicleName,
          node_type: 'folder',
          module_code: config.moduleCode,
          entity_type: 'vehicle',
          entity_id: vehicleId,
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
        entity_type: 'vehicle',
        entity_id: vehicleId,
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
      queryClient.invalidateQueries({ queryKey: ['entity-storage-root', vars.tenantId, 'vehicle', vars.vehicleId] });
      queryClient.invalidateQueries({ queryKey: ['entity-storage-nodes', vars.tenantId, 'vehicle', vars.vehicleId] });
    },
    onError: (error) => {
      console.error('Vehicle DMS tree creation failed:', error);
    },
  });

  return { createVehicleDMSTree };
}
