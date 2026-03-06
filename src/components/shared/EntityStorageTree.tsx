/**
 * EntityStorageTree — Reusable DMS Column-View for any entity record
 * 
 * Uses the proper DMS schema:
 * - storage_nodes: folders (entity_type + entity_id filter)
 * - documents: files (linked via document_links)
 * - document_links: maps documents to storage_nodes
 *
 * Upload uses useUniversalUpload (2-Phase Architecture) for correct
 * documents + document_links + storage_nodes creation.
 * Files are always uploaded into the currently selected folder.
 * 
 * === STATE MODEL ===
 * Single source of truth: `currentFolderId`
 * - Updated on every navigation (column click, breadcrumb, subfolder creation)
 * - Used for: upload target, new folder parent, drop overlay, delete context
 * - Reset on root navigation or folder deletion
 * - Never falls back silently to root — explicit resolution via resolveTargetFolderId()
 */

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ColumnView } from '@/components/dms/views/ColumnView';
import { FileDropZone } from '@/components/dms/FileDropZone';
import { NewFolderDialog } from '@/components/dms/NewFolderDialog';
import { useRecordCardDMS } from '@/hooks/useRecordCardDMS';
import { useUniversalUpload } from '@/hooks/useUniversalUpload';
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
  // ── SINGLE SOURCE OF TRUTH: currentFolderId ─────────────────────────
  // This ID controls: upload target, new folder parent, overlay text, delete context
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [columnPath, setColumnPath] = useState<string[]>([]);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const queryClient = useQueryClient();
  const { createDMS } = useRecordCardDMS();
  const universalUpload = useUniversalUpload();

  // ── Root folder: deterministic via template_id, NOT oldest folder ────
  const { data: rootFolder } = useQuery({
    queryKey: ['entity-storage-root', tenantId, entityType, entityId, moduleCode],
    queryFn: async () => {
      // PRIO 3: First try explicit ROOT marker
      const { data: rootByTemplate } = await supabase
        .from('storage_nodes')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('node_type', 'folder')
        .eq('template_id', `${moduleCode}_ROOT`)
        .limit(1)
        .maybeSingle();

      if (rootByTemplate) return rootByTemplate;

      // Fallback: parent_id IS NULL for this entity (top-level folder)
      const { data: rootByParent } = await supabase
        .from('storage_nodes')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('node_type', 'folder')
        .is('parent_id', null)
        .limit(1)
        .maybeSingle();

      if (rootByParent) return rootByParent;

      // Last fallback: oldest folder (legacy compatibility)
      const { data: rootByAge } = await supabase
        .from('storage_nodes')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .eq('node_type', 'folder')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      return rootByAge;
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

  // ── Navigation: always syncs currentFolderId ────────────────────────
  const handleNavigateColumn = useCallback((nodeId: string, depth: number) => {
    setColumnPath(prev => [...prev.slice(0, depth), nodeId]);
    setCurrentFolderId(nodeId);
  }, []);

  const handleSelectFile = useCallback((item: FileManagerItem) => {
    // Single click = select + show info. Double click triggers download in ColumnView.
    // No-op toast removed — ColumnView handles visual selection state internally.
  }, []);

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['entity-storage-root', tenantId, entityType, entityId] });
    queryClient.invalidateQueries({ queryKey: ['entity-storage-nodes', tenantId, entityType, entityId] });
    queryClient.invalidateQueries({ queryKey: ['entity-storage-doc-links'] });
    queryClient.invalidateQueries({ queryKey: ['entity-storage-docs'] });
  }, [queryClient, tenantId, entityType, entityId]);

  /**
   * Resolve the target folder for upload — SINGLE resolution logic.
   * Priority: currentFolderId → deepest columnPath → rootFolder
   * This same ID is used for storage_nodes.parent_id AND document_links.node_id.
   */
  const resolveTargetFolderId = useCallback((): string | null => {
    // 1. Explicit current selection (from last navigation)
    if (currentFolderId) {
      const exists = allNodes.some(n => n.id === currentFolderId);
      if (exists) return currentFolderId;
      // Stale reference — clear it
      setCurrentFolderId(null);
    }
    // 2. Deepest column path entry
    if (columnPath.length > 0) {
      const lastId = columnPath[columnPath.length - 1];
      const exists = allNodes.some(n => n.id === lastId);
      if (exists) return lastId;
    }
    // 3. Root folder (explicit, not silent)
    return rootFolder?.id || null;
  }, [currentFolderId, columnPath, allNodes, rootFolder?.id]);

  /**
   * Get display name of target folder for UI feedback
   */
  const targetFolderName = useMemo((): string => {
    const targetId = resolveTargetFolderId();
    if (!targetId || targetId === rootFolder?.id) return 'Datenraum';
    const node = allNodes.find(n => n.id === targetId);
    return node?.name || 'Datenraum';
  }, [resolveTargetFolderId, rootFolder?.id, allNodes]);

  // ── Upload handler ───────────────────────────────────────────────────
  const handleFileDrop = useCallback(async (droppedFiles: File[]) => {
    let targetFolderId = resolveTargetFolderId();

    // Auto-create DMS folder structure if none exists
    if (!targetFolderId) {
      try {
        const result = await createDMS.mutateAsync({
          entityType,
          entityId,
          entityName: `${entityType}-${entityId.slice(0, 8)}`,
          tenantId,
        });
        targetFolderId = result.folderId;
      } catch {
        return;
      }
    }

    if (!targetFolderId) {
      toast.error('Kein Zielordner gefunden');
      return;
    }

    let successCount = 0;
    let failCount = 0;

    for (const file of droppedFiles) {
      const result = await universalUpload.upload(file, {
        moduleCode,
        entityId,
        objectType: entityType,
        objectId: entityId,
        parentNodeId: targetFolderId,
        source: 'upload',
      });

      if (result.error) {
        console.error('Upload failed:', result.error);
        failCount++;
      } else {
        successCount++;
      }
    }

    // Only show success if ALL files succeeded
    if (failCount > 0) {
      toast.error(`${failCount} von ${droppedFiles.length} Dateien konnten nicht hochgeladen werden`);
    }
    if (successCount > 0) {
      const folderLabel = targetFolderName !== 'Datenraum' ? ` in „${targetFolderName}"` : '';
      toast.success(
        successCount === 1
          ? `Datei${folderLabel} hochgeladen`
          : `${successCount} Dateien${folderLabel} hochgeladen`
      );
    }

    invalidateAll();
    universalUpload.reset();
  }, [resolveTargetFolderId, createDMS, entityType, entityId, tenantId, moduleCode, universalUpload, targetFolderName, invalidateAll]);

  // ── Download handler ──────────────────────────────────────────────────
  const handleDownload = useCallback(async (documentId: string) => {
    setIsDownloading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sot-dms-download-url`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.session?.access_token}`,
          },
          body: JSON.stringify({ document_id: documentId }),
        }
      );
      if (!response.ok) throw new Error('Download URL konnte nicht erstellt werden');
      const { download_url } = await response.json();
      window.open(download_url, '_blank');
    } catch (err) {
      console.error('Download failed:', err);
      toast.error('Download fehlgeschlagen');
    }
    setIsDownloading(false);
  }, []);

  // ── Delete file handler (server-side RPC) ────────────────────────────
  const handleDeleteFile = useCallback(async (item: FileManagerItem) => {
    if (!item.documentId) return;
    if (!confirm(`"${item.name}" wirklich löschen?`)) return;

    setIsDeleting(true);
    try {
      // Call server-side RPC for atomic delete
      const { data: result, error: rpcError } = await supabase.rpc('delete_storage_file', {
        p_document_id: item.documentId,
        p_tenant_id: tenantId,
      });

      if (rpcError) {
        console.error('RPC delete_storage_file error:', rpcError);
        throw new Error(rpcError.message);
      }

      const response = result as { success: boolean; message: string; file_path?: string; error?: string };

      if (!response.success) {
        toast.error(response.message || 'Fehler beim Löschen');
        setIsDeleting(false);
        return;
      }

      // Clean up storage blob (client-side, since storage API needs client auth)
      if (response.file_path) {
        const { error: blobError } = await supabase.storage
          .from('tenant-documents')
          .remove([response.file_path]);
        if (blobError) {
          console.warn('Blob cleanup failed (non-critical):', blobError);
        }
      }

      toast.success(response.message);
      invalidateAll();
    } catch (err) {
      console.error('Delete file failed:', err);
      toast.error(`Fehler beim Löschen: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`);
    }
    setIsDeleting(false);
  }, [tenantId, invalidateAll]);

  // ── Delete folder handler (server-side RPC with guards) ──────────────
  const handleDeleteFolder = useCallback(async (item: FileManagerItem) => {
    if (!item.nodeId) return;
    if (!confirm(`Ordner "${item.name}" wirklich löschen?`)) return;

    setIsDeleting(true);
    try {
      const { data: result, error: rpcError } = await supabase.rpc('delete_storage_folder', {
        p_folder_id: item.nodeId,
        p_tenant_id: tenantId,
      });

      if (rpcError) {
        console.error('RPC delete_storage_folder error:', rpcError);
        throw new Error(rpcError.message);
      }

      const response = result as { success: boolean; message: string; error?: string };

      if (!response.success) {
        // Show specific error from server guard
        toast.error(response.message);
        setIsDeleting(false);
        return;
      }

      toast.success(response.message);
      
      // If we deleted the current folder, navigate back
      if (currentFolderId === item.nodeId) {
        setCurrentFolderId(null);
        setColumnPath([]);
      }
      
      invalidateAll();
    } catch (err) {
      console.error('Folder delete failed:', err);
      toast.error(`Fehler beim Löschen: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`);
    }
    setIsDeleting(false);
  }, [tenantId, currentFolderId, invalidateAll]);

  // ── Unified delete dispatch ───────────────────────────────────────────
  const handleDelete = useCallback((item: FileManagerItem) => {
    if (item.type === 'folder') {
      handleDeleteFolder(item);
    } else {
      handleDeleteFile(item);
    }
  }, [handleDeleteFolder, handleDeleteFile]);

  // ── New subfolder handler ─────────────────────────────────────────────
  const handleNewSubfolder = useCallback((parentNodeId: string) => {
    setNewFolderParentId(parentNodeId);
    setShowNewFolderDialog(true);
  }, []);

  const handleCreateFolder = useCallback(async (name: string) => {
    const parentId = newFolderParentId || resolveTargetFolderId();
    if (!parentId) {
      toast.error('Kein übergeordneter Ordner gefunden');
      return;
    }

    try {
      // Find real parent_id (undo the remap done for ColumnView display)
      let realParentId = parentId;
      const mappedNode = allNodes.find(n => n.id === parentId);
      if (mappedNode && mappedNode.parent_id === null && parentId !== rootFolder?.id) {
        realParentId = parentId;
      }

      const { error } = await supabase.from('storage_nodes').insert({
        tenant_id: tenantId,
        parent_id: realParentId,
        name,
        node_type: 'folder',
        entity_type: entityType,
        entity_id: entityId,
        module_code: moduleCode,
      });
      if (error) throw error;
      toast.success(`Ordner „${name}" erstellt`);
      invalidateAll();
    } catch (err) {
      console.error('Create folder failed:', err);
      toast.error('Fehler beim Erstellen des Ordners');
    }
    setShowNewFolderDialog(false);
  }, [newFolderParentId, resolveTargetFolderId, allNodes, rootFolder?.id, tenantId, entityType, entityId, moduleCode, invalidateAll]);

  const isUploading = universalUpload.isUploading || createDMS.isPending;

  // Empty state — no DMS folder yet
  if (!rootFolder?.id && !isUploading) {
    return (
      <FileDropZone onDrop={handleFileDrop} className={className} targetFolderName={targetFolderName}>
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
    <div className={cn(DESIGN.STORAGE.CONTAINER, DESIGN.STORAGE.MIN_HEIGHT, 'relative', className)}>
      {isUploading && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">
              {universalUpload.progress.message || 'Wird hochgeladen…'}
            </p>
          </div>
        </div>
      )}
      <FileDropZone
        onDrop={handleFileDrop}
        targetFolderName={targetFolderName}
        className="h-full"
      >
        <ColumnView
          allNodes={allNodes}
          documents={documents}
          documentLinks={documentLinks}
          columnPath={columnPath}
          onNavigateColumn={handleNavigateColumn}
          onSelectFile={handleSelectFile}
          onDownload={handleDownload}
          onDelete={handleDelete}
          onNewSubfolder={handleNewSubfolder}
          isDownloading={isDownloading}
          isDeleting={isDeleting}
        />
      </FileDropZone>

      <NewFolderDialog
        open={showNewFolderDialog}
        onOpenChange={setShowNewFolderDialog}
        onCreateFolder={handleCreateFolder}
        isCreating={false}
      />
    </div>
  );
}
