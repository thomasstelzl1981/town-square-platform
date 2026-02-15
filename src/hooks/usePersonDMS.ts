/**
 * usePersonDMS — Hook für automatische Personen-DMS-Ordnerstruktur
 * 
 * Erstellt bei Personenanlage automatisch:
 * 1. Root-Ordner (entity_type: 'person', entity_id: person.id)
 * 2. 8 Unterordner für persönliche Dokumente
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const PERSON_DMS_FOLDERS = [
  '01_Personalausweis',
  '02_Reisepass',
  '03_Geburtsurkunde',
  '04_Ehevertrag',
  '05_Testament',
  '06_Patientenverfuegung',
  '07_Vorsorgevollmacht',
  '08_Sonstiges',
];

interface CreatePersonDMSParams {
  personId: string;
  personName: string;
  tenantId: string;
}

export function usePersonDMS() {
  const queryClient = useQueryClient();

  const createPersonDMSTree = useMutation({
    mutationFn: async ({ personId, personName, tenantId }: CreatePersonDMSParams) => {
      // Check if root folder already exists
      const { data: existing } = await supabase
        .from('storage_nodes')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('entity_type', 'person')
        .eq('entity_id', personId)
        .eq('node_type', 'folder')
        .is('parent_id', null)
        .maybeSingle();

      if (existing?.id) {
        // Already exists, skip
        return { rootFolderId: existing.id };
      }

      // 1. Create root folder
      const { data: rootFolder, error: rootError } = await supabase
        .from('storage_nodes')
        .insert({
          tenant_id: tenantId,
          name: personName,
          node_type: 'folder',
          module_code: 'MOD_01',
          entity_type: 'person',
          entity_id: personId,
          parent_id: null,
          auto_created: true,
        } as any)
        .select('id')
        .single();

      if (rootError) throw rootError;

      // 2. Create all subfolders
      const subfolders = PERSON_DMS_FOLDERS.map(name => ({
        tenant_id: tenantId,
        name,
        node_type: 'folder',
        module_code: 'MOD_01',
        entity_type: 'person',
        entity_id: personId,
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
      // Invalidate EntityStorageTree queries
      queryClient.invalidateQueries({ queryKey: ['entity-storage-root', vars.tenantId, 'person', vars.personId] });
      queryClient.invalidateQueries({ queryKey: ['entity-storage-nodes', vars.tenantId, 'person', vars.personId] });
    },
    onError: (error) => {
      console.error('Person DMS tree creation failed:', error);
    },
  });

  return { createPersonDMSTree };
}
