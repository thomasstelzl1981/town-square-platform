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
 */

import { useState, useCallback } from 'react';
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
  const [columnPath, setColumnPath] = useState<string[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const queryClient = useQueryClient();
  const { createDMS } = useRecordCardDMS();
  const universalUpload = useUniversalUpload();

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
    // SYNC: Keep selectedFolderId in sync so uploads target the visible folder
    setSelectedFolderId(nodeId);
  }, []);

  const handleSelectFile = useCallback((item: FileManagerItem) => {
    if (item.name) {
      toast.info(`Datei: ${item.name}`);
    }
  }, []);

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['entity-storage-root', tenantId, entityType, entityId] });
    queryClient.invalidateQueries({ queryKey: ['entity-storage-nodes', tenantId, entityType, entityId] });
    queryClient.invalidateQueries({ queryKey: ['entity-storage-doc-links'] });
    queryClient.invalidateQueries({ queryKey: ['entity-storage-docs'] });
  }, [queryClient, tenantId, entityType, entityId]);

  /**
   * Resolve the target folder for upload:
   * - If a subfolder is explicitly selected → use that
   * - Otherwise use last columnPath entry → use that
   * - Otherwise → use root folder
   */
  const resolveTargetFolderId = useCallback((): string | null => {
    // Explicit selection has priority
    if (selectedFolderId) {
      const node = allNodes.find(n => n.id === selectedFolderId);
      if (node) return selectedFolderId;
    }
    // Fallback to deepest columnPath entry
    if (columnPath.length > 0) {
      const lastSelectedId = columnPath[columnPath.length - 1];
      const node = allNodes.find(n => n.id === lastSelectedId);
      if (node) return lastSelectedId;
    }
    return rootFolder?.id || null;
  }, [selectedFolderId, columnPath, allNodes, rootFolder?.id]);

  /**
   * Get the display name of the target folder for UI feedback
   */
  const getTargetFolderName = useCallback((): string => {
    const targetId = resolveTargetFolderId();
    if (!targetId) return 'Datenraum';
    if (targetId === rootFolder?.id) return 'Datenraum';
    const node = allNodes.find(n => n.id === targetId);
    return node?.name || 'Datenraum';
  }, [resolveTargetFolderId, rootFolder?.id, allNodes]);

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

    const folderName = getTargetFolderName();

    // Upload files via useUniversalUpload (2-Phase Architecture)
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
      }
    }

    toast.success(
      droppedFiles.length === 1
        ? `"${droppedFiles[0].name}" in „${folderName}" hochgeladen`
        : `${droppedFiles.length} Dateien in „${folderName}" hochgeladen`
    );

    // Refresh the tree
    invalidateAll();
    universalUpload.reset();
  }, [resolveTargetFolderId, createDMS, entityType, entityId, tenantId, moduleCode, universalUpload, getTargetFolderName, invalidateAll]);

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
    } catch {
      toast.error('Download fehlgeschlagen');
    }
    setIsDownloading(false);
  }, []);

  // ── Delete file handler (full cleanup) ────────────────────────────────
  const handleDeleteFile = useCallback(async (item: FileManagerItem) => {
    if (!item.documentId) return;
    if (!confirm(`"${item.name}" wirklich löschen?`)) return;

    setIsDeleting(true);
    try {
      // 1. Get document for file_path
      const doc = documents.find(d => d.id === item.documentId);

      // 2. Delete document_links
      await supabase
        .from('document_links')
        .delete()
        .eq('document_id', item.documentId)
        .eq('tenant_id', tenantId);

      // 3. Delete storage_nodes file-node (if exists)
      if (doc?.file_path) {
        await supabase
          .from('storage_nodes')
          .delete()
          .eq('tenant_id', tenantId)
          .eq('node_type', 'file')
          .eq('storage_path', doc.file_path);
      }

      // 4. Soft-delete document record
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('documents')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', item.documentId);

      // 5. Delete storage blob
      if (doc?.file_path) {
        await supabase.storage.from('tenant-documents').remove([doc.file_path]);
      }

      toast.success(`"${item.name}" gelöscht`);
      invalidateAll();
    } catch (err) {
      console.error('Delete failed:', err);
      toast.error('Fehler beim Löschen');
    }
    setIsDeleting(false);
  }, [documents, tenantId, invalidateAll]);

  // ── Delete folder handler (with server-side guards) ───────────────────
  const handleDeleteFolder = useCallback(async (item: FileManagerItem) => {
    if (!item.nodeId) return;
    if (!confirm(`Ordner "${item.name}" wirklich löschen?`)) return;

    setIsDeleting(true);
    try {
      // Guard: Check for system folder (template_id ending with _ROOT)
      const node = allNodes.find(n => n.id === item.nodeId);
      if (node?.template_id?.endsWith('_ROOT')) {
        toast.error('Systemordner können nicht gelöscht werden');
        setIsDeleting(false);
        return;
      }

      // Guard: Check for child folders
      const childFolders = allNodes.filter(n => n.parent_id === item.nodeId);
      if (childFolders.length > 0) {
        toast.error('Ordner enthält Unterordner — bitte zuerst leeren');
        setIsDeleting(false);
        return;
      }

      // Guard: Check for files in folder
      const folderDocLinks = documentLinks.filter(l => l.node_id === item.nodeId);
      if (folderDocLinks.length > 0) {
        toast.error('Ordner enthält Dateien — bitte zuerst leeren');
        setIsDeleting(false);
        return;
      }

      // Safe to delete
      const { error } = await supabase
        .from('storage_nodes')
        .delete()
        .eq('id', item.nodeId)
        .eq('tenant_id', tenantId);

      if (error) throw error;

      toast.success(`Ordner "${item.name}" gelöscht`);
      
      // If we deleted the selected folder, go back
      if (selectedFolderId === item.nodeId) {
        setSelectedFolderId(null);
        setColumnPath([]);
      }
      
      invalidateAll();
    } catch (err) {
      console.error('Folder delete failed:', err);
      toast.error('Fehler beim Löschen des Ordners');
    }
    setIsDeleting(false);
  }, [allNodes, documentLinks, tenantId, selectedFolderId, invalidateAll]);

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
      // If parent_id is null in our mapped nodes, it's actually the root folder
      const mappedNode = allNodes.find(n => n.id === parentId);
      if (mappedNode && mappedNode.parent_id === null && parentId !== rootFolder?.id) {
        // This node was remapped — its real parent is rootFolder
        realParentId = parentId; // The node itself is correct, we're creating under it
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

  // Determine current target folder name for drop overlay
  const targetFolderName = getTargetFolderName();

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
    <FileDropZone
      onDrop={handleFileDrop}
      className={className}
      targetFolderName={targetFolderName}
    >
      <div className={cn(DESIGN.STORAGE.CONTAINER, DESIGN.STORAGE.MIN_HEIGHT, 'relative')}>
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
      </div>

      <NewFolderDialog
        open={showNewFolderDialog}
        onOpenChange={setShowNewFolderDialog}
        onCreateFolder={handleCreateFolder}
        isCreating={false}
      />
    </FileDropZone>
  );
}
