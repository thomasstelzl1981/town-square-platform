/**
 * useRecordCardDMS — Hook für automatische DMS-Ordner + Sortierkachel Erstellung
 * 
 * Bei Neuanlage einer Akte:
 * 1. DMS-Ordner in storage_nodes erstellen
 * 2. Sortierkachel in inbox_sort_containers erstellen
 * 3. Sortierregeln in inbox_sort_rules erstellen
 */

import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RECORD_CARD_TYPES, type RecordCardEntityType } from '@/config/recordCardManifest';
import { toast } from 'sonner';

interface CreateDMSParams {
  entityType: RecordCardEntityType;
  entityId: string;
  entityName: string;
  tenantId: string;
  /** Keywords für automatische Sortierung */
  keywords?: string[];
}

export function useRecordCardDMS() {
  const createDMS = useMutation({
    mutationFn: async ({ entityType, entityId, entityName, tenantId, keywords }: CreateDMSParams) => {
      const config = RECORD_CARD_TYPES[entityType];
      if (!config) throw new Error(`Unknown entity type: ${entityType}`);

      // 1. Find module root folder
      const { data: rootFolder } = await supabase
        .from('storage_nodes')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('module_code', config.moduleCode)
        .is('parent_id', null)
        .eq('node_type', 'folder')
        .maybeSingle();

      // 2. Create DMS folder (storage_node)
      const { data: folder, error: folderError } = await supabase
        .from('storage_nodes')
        .insert({
          tenant_id: tenantId,
          name: entityName,
          node_type: 'folder',
          module_code: config.moduleCode,
          entity_type: entityType,
          entity_id: entityId,
          parent_id: rootFolder?.id || null,
          auto_created: true,
        } as any)
        .select('id')
        .single();

      if (folderError) throw folderError;

      // 2b. Create DMS subfolders from manifest
      if (config.dmsFolders.length > 0) {
        const subfolders = config.dmsFolders.map(name => ({
          tenant_id: tenantId,
          name,
          node_type: 'folder',
          module_code: config.moduleCode,
          entity_type: entityType,
          entity_id: entityId,
          parent_id: folder.id,
          auto_created: true,
        }));

        await supabase
          .from('storage_nodes')
          .insert(subfolders as any);
      }

      // 3. Create sort container (inbox_sort_containers)
      const { data: container, error: containerError } = await supabase
        .from('inbox_sort_containers')
        .insert({
          tenant_id: tenantId,
          name: entityName,
          is_enabled: true,
          entity_type: entityType,
          entity_id: entityId,
        } as any)
        .select('id')
        .single();

      if (containerError) throw containerError;

      // 4. Create sort rules (inbox_sort_rules)
      const sortKeywords = keywords?.filter(Boolean) || [entityName];
      if (sortKeywords.length > 0) {
        await supabase
          .from('inbox_sort_rules')
          .insert({
            container_id: container.id,
            field: 'subject',
            operator: 'contains',
            keywords_json: sortKeywords,
          } as any);
      }

      return { folderId: folder.id, containerId: container.id };
    },
    onSuccess: (_, vars) => {
      toast.success(`Datenraum für "${vars.entityName}" erstellt`);
    },
    onError: (error) => {
      console.error('DMS creation failed:', error);
      toast.error('Datenraum konnte nicht erstellt werden');
    },
  });

  const uploadFile = useMutation({
    mutationFn: async ({ file, entityType, entityId, tenantId, folderId }: {
      file: File;
      entityType: RecordCardEntityType;
      entityId: string;
      tenantId: string;
      folderId: string;
    }) => {
      const config = RECORD_CARD_TYPES[entityType];
      const storagePath = `${tenantId}/${config.moduleCode}/${entityId}/${file.name}`;

      // Upload to blob storage
      const { error: uploadError } = await supabase.storage
        .from('tenant-documents')
        .upload(storagePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Create storage_node entry
      const { error: nodeError } = await supabase
        .from('storage_nodes')
        .insert({
          tenant_id: tenantId,
          name: file.name,
          node_type: 'file',
          module_code: config.moduleCode,
          entity_type: entityType,
          entity_id: entityId,
          parent_id: folderId,
          file_path: storagePath,
          mime_type: file.type,
          file_size: file.size,
        } as any);

      if (nodeError) throw nodeError;

      return storagePath;
    },
    onSuccess: (_, vars) => {
      toast.success(`"${vars.file.name}" hochgeladen`);
    },
    onError: () => {
      toast.error('Upload fehlgeschlagen');
    },
  });

  return { createDMS, uploadFile };
}
