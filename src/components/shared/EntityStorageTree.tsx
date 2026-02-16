/**
 * EntityStorageTree — Reusable DMS Column-View for any entity record
 * 
 * Uses the proper DMS schema:
 * - storage_nodes: folders (entity_type + entity_id filter)
 * - documents: files (linked via document_links)
 * - document_links: maps documents to storage_nodes
 */

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ColumnView } from '@/components/dms/views/ColumnView';
import { FileDropZone } from '@/components/dms/FileDropZone';
import { useRecordCardDMS } from '@/hooks/useRecordCardDMS';
import { DESIGN } from '@/config/designManifest';
import { cn } from '@/lib/utils';
import { Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { RecordCardEntityType } from '@/config/recordCardManifest';
import type { FileManagerItem } from '@/components/dms/views/ListView';

interface EntityStorageTreeProps {
  tenantId: string;
  entityType: RecordCardEntityType;
  entityId: string;
  moduleCode: string;
  className?: string;
}

export function EntityStorageTree({ tenantId, entityType, entityId, moduleCode, className }: EntityStorageTreeProps) {
  const [columnPath, setColumnPath] = useState<string[]>([]);
  const queryClient = useQueryClient();
  const { createDMS, uploadFile } = useRecordCardDMS();

  // Find entity root folder
  const { data: rootFolder } = useQuery({
    queryKey: ['entity-storage-root', tenantId, entityType, entityId],
    queryFn: async () => {
      const { data } = await supabase
        .from('storage_nodes')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('node_type', 'folder')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!tenantId && !!entityId,
  });

  // Load all folder nodes under the entity
  const { data: allNodes = [] } = useQuery({
    queryKey: ['entity-storage-nodes', tenantId, entityType, entityId, rootFolder?.id],
    queryFn: async () => {
      if (!rootFolder?.id) return [];
      const { data } = await supabase
        .from('storage_nodes')
        .select('id, parent_id, name, node_type, module_code, template_id, created_at')
        .eq('tenant_id', tenantId)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('node_type', 'folder')
        .order('name');
      
      // Remap root's parent_id to null for ColumnView
      return (data || []).map(n => ({
        ...n,
        parent_id: n.id === rootFolder.id ? null : (n.parent_id === rootFolder.id ? null : n.parent_id),
        template_id: n.id === rootFolder.id ? `${moduleCode}_ROOT` : n.template_id,
      }));
    },
    enabled: !!rootFolder?.id,
  });

  // Load document_links for nodes in this entity
  const nodeIds = allNodes.map(n => n.id);
  const { data: documentLinks = [] } = useQuery({
    queryKey: ['entity-storage-doc-links', nodeIds],
    queryFn: async () => {
      if (nodeIds.length === 0) return [];
      const { data } = await supabase
        .from('document_links')
        .select('id, document_id, node_id')
        .eq('tenant_id', tenantId)
        .in('node_id', nodeIds);
      return data || [];
    },
    enabled: nodeIds.length > 0,
  });

  // Load documents referenced by links
  const docIds = documentLinks.map(l => l.document_id);
  const { data: documents = [] } = useQuery({
    queryKey: ['entity-storage-docs', docIds],
    queryFn: async () => {
      if (docIds.length === 0) return [];
      const { data } = await supabase
        .from('documents')
        .select('id, name, mime_type, size_bytes, created_at, public_id, file_path')
        .in('id', docIds)
        .is('deleted_at', null);
      return data || [];
    },
    enabled: docIds.length > 0,
  });

  const handleNavigateColumn = useCallback((nodeId: string, depth: number) => {
    setColumnPath(prev => [...prev.slice(0, depth), nodeId]);
  }, []);

  const handleSelectFile = useCallback((item: FileManagerItem) => {
    if (item.name) {
      toast.info(`Datei: ${item.name}`);
    }
  }, []);

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['entity-storage-root', tenantId, entityType, entityId] });
    queryClient.invalidateQueries({ queryKey: ['entity-storage-nodes', tenantId, entityType, entityId] });
  }, [queryClient, tenantId, entityType, entityId]);

  const handleFileDrop = useCallback(async (droppedFiles: File[]) => {
    let folderId = rootFolder?.id;

    // Auto-create DMS folder if none exists
    if (!folderId) {
      try {
        const result = await createDMS.mutateAsync({
          entityType,
          entityId,
          entityName: `${entityType}-${entityId.slice(0, 8)}`,
          tenantId,
        });
        folderId = result.folderId;
      } catch {
        return;
      }
    }

    // Upload files
    for (const file of droppedFiles) {
      await uploadFile.mutateAsync({
        file,
        entityType,
        entityId,
        tenantId,
        folderId: folderId!,
      });
    }

    invalidateAll();
  }, [rootFolder?.id, entityType, entityId, tenantId, createDMS, uploadFile, invalidateAll]);

  const isUploading = uploadFile.isPending || createDMS.isPending;

  // Empty state — no DMS folder yet
  if (!rootFolder?.id && !isUploading) {
    return (
      <FileDropZone onDrop={handleFileDrop} className={className}>
        <div className={cn(DESIGN.STORAGE.CONTAINER, DESIGN.STORAGE.MIN_HEIGHT, 'flex items-center justify-center')}>
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Upload className="h-8 w-8 opacity-40" />
            <p className="text-sm">Dateien hierher ziehen oder klicken zum Hochladen</p>
            <p className="text-xs opacity-60">Der Datenraum wird automatisch erstellt</p>
          </div>
        </div>
      </FileDropZone>
    );
  }

  return (
    <FileDropZone onDrop={handleFileDrop} className={className}>
      <div className={cn(DESIGN.STORAGE.CONTAINER, DESIGN.STORAGE.MIN_HEIGHT, 'relative')}>
        {isUploading && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        <ColumnView
          allNodes={allNodes}
          documents={documents}
          documentLinks={documentLinks}
          columnPath={columnPath}
          onNavigateColumn={handleNavigateColumn}
          onSelectFile={handleSelectFile}
        />
      </div>
    </FileDropZone>
  );
}
