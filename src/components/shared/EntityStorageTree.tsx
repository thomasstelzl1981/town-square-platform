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

import { useState, useCallback, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ColumnView } from '@/components/dms/views/ColumnView';
import { SelectionActionBar } from '@/components/dms/SelectionActionBar';
import { FileDropZone } from '@/components/dms/FileDropZone';
import { NewFolderDialog } from '@/components/dms/NewFolderDialog';
import { RenameFolderDialog } from '@/components/dms/RenameFolderDialog';
import { MoveToFolderDialog } from '@/components/dms/MoveToFolderDialog';
import { DndStorageProvider } from '@/components/dms/DndStorageProvider';
import { isItemMutable } from '@/components/dms/folderGuards';
import { useRecordCardDMS } from '@/hooks/useRecordCardDMS';
import { useStorageMove } from '@/hooks/useStorageMove';
import { useUniversalUpload } from '@/hooks/useUniversalUpload';
import { useStorageKeyboard } from '@/hooks/useStorageKeyboard';
import { DESIGN } from '@/config/designManifest';
import { cn } from '@/lib/utils';
import { Upload, Loader2, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import type { RecordCardEntityType } from '@/config/recordCardManifest';
import type { FileManagerItem } from '@/components/dms/views/ListView';
import { downloadFromSignedUrl } from '@/lib/storage-url';
import { isPreviewableMime } from '@/components/dms/storageHelpers';

interface EntityStorageTreeProps {
  tenantId: string;
  entityType: RecordCardEntityType;
  entityId: string;
  moduleCode: string;
  className?: string;
}

export function EntityStorageTree({ tenantId, entityType, entityId, moduleCode, className }: EntityStorageTreeProps) {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [columnPath, setColumnPath] = useState<string[]>([]);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [showMoveDialog, setShowMoveDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renameTarget, setRenameTarget] = useState<FileManagerItem | null>(null);
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FileManagerItem | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { createDMS } = useRecordCardDMS();
  const universalUpload = useUniversalUpload();

  // ── Root folder ─────────────────────────────────────────────────────
  const { data: rootFolder } = useQuery({
    queryKey: ['entity-storage-root', tenantId, entityType, entityId, moduleCode],
    queryFn: async () => {
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

  // All folder nodes
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
      
      return (data || []).map(n => ({
        ...n,
        parent_id: n.id === rootFolder.id ? null : (n.parent_id === rootFolder.id ? null : n.parent_id),
        template_id: n.id === rootFolder.id ? `${moduleCode}_ROOT` : n.template_id,
      }));
    },
    enabled: !!rootFolder?.id,
  });

  // Document links
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

  // Documents
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

  // ── Navigation ──────────────────────────────────────────────────────
  const handleNavigateColumn = useCallback((nodeId: string, depth: number) => {
    setColumnPath(prev => [...prev.slice(0, depth), nodeId]);
    setCurrentFolderId(nodeId);
  }, []);

  const handleSelectFile = useCallback((_item: FileManagerItem) => {
    // Single click = select + show info
  }, []);

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['entity-storage-root', tenantId, entityType, entityId] });
    queryClient.invalidateQueries({ queryKey: ['entity-storage-nodes', tenantId, entityType, entityId] });
    queryClient.invalidateQueries({ queryKey: ['entity-storage-doc-links'] });
    queryClient.invalidateQueries({ queryKey: ['entity-storage-docs'] });
  }, [queryClient, tenantId, entityType, entityId]);

  const { moveFile, moveFolder, isMoving } = useStorageMove(tenantId, invalidateAll);

  const resolveTargetFolderId = useCallback((): string | null => {
    if (currentFolderId) {
      const exists = allNodes.some(n => n.id === currentFolderId);
      if (exists) return currentFolderId;
      setCurrentFolderId(null);
    }
    if (columnPath.length > 0) {
      const lastId = columnPath[columnPath.length - 1];
      const exists = allNodes.some(n => n.id === lastId);
      if (exists) return lastId;
    }
    return rootFolder?.id || null;
  }, [currentFolderId, columnPath, allNodes, rootFolder?.id]);

  const targetFolderName = useMemo((): string => {
    const targetId = resolveTargetFolderId();
    if (!targetId || targetId === rootFolder?.id) return 'Datenraum';
    const node = allNodes.find(n => n.id === targetId);
    return node?.name || 'Datenraum';
  }, [resolveTargetFolderId, rootFolder?.id, allNodes]);

  // ── Upload handler ──────────────────────────────────────────────────
  const handleFileDrop = useCallback(async (droppedFiles: File[]) => {
    let targetFolderId = resolveTargetFolderId();

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

  // ── Upload to specific folder (folder-exact drop) ────────────────────
  const handleUploadToFolder = useCallback(async (files: File[], targetFolderId: string) => {
    let successCount = 0;
    let failCount = 0;
    const targetNode = allNodes.find(n => n.id === targetFolderId);
    const folderLabel = targetNode?.name || 'Ordner';

    for (const file of files) {
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

    if (failCount > 0) {
      toast.error(`${failCount} Dateien konnten nicht hochgeladen werden`);
    }
    if (successCount > 0) {
      toast.success(
        successCount === 1
          ? `Datei in „${folderLabel}" hochgeladen`
          : `${successCount} Dateien in „${folderLabel}" hochgeladen`
      );
    }

    invalidateAll();
    universalUpload.reset();
  }, [allNodes, universalUpload, moduleCode, entityId, entityType, invalidateAll]);

  // ── Download handler ────────────────────────────────────────────────
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
      const { download_url, filename } = await response.json();
      await downloadFromSignedUrl(download_url, filename);
    } catch (err) {
      console.error('Download failed:', err);
      toast.error('Download fehlgeschlagen');
    }
    setIsDownloading(false);
  }, []);

  // ── Delete file handler ─────────────────────────────────────────────
  const handleDeleteFile = useCallback(async (item: FileManagerItem) => {
    if (!item.documentId) return;
    if (!confirm(`"${item.name}" wirklich löschen?`)) return;

    setIsDeleting(true);
    try {
      const { data: result, error: rpcError } = await supabase.rpc('delete_storage_file', {
        p_document_id: item.documentId,
        p_tenant_id: tenantId,
      });

      if (rpcError) throw new Error(rpcError.message);

      const response = result as { success: boolean; message: string; file_path?: string; error?: string };

      if (!response.success) {
        toast.error(response.message || 'Fehler beim Löschen');
        setIsDeleting(false);
        return;
      }

      if (response.file_path) {
        const { error: blobError } = await supabase.storage
          .from('tenant-documents')
          .remove([response.file_path]);
        if (blobError) console.warn('Blob cleanup failed (non-critical):', blobError);
      }

      toast.success(response.message);
      setSelectedItem(null);
      invalidateAll();
    } catch (err) {
      console.error('Delete file failed:', err);
      toast.error(`Fehler beim Löschen: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`);
    }
    setIsDeleting(false);
  }, [tenantId, invalidateAll]);

  // ── Delete folder handler ───────────────────────────────────────────
  const handleDeleteFolder = useCallback(async (item: FileManagerItem) => {
    if (!item.nodeId) return;
    if (!isItemMutable(item)) {
      toast.error('Systemordner können nicht gelöscht werden');
      return;
    }
    if (!confirm(`Ordner "${item.name}" wirklich löschen?`)) return;

    setIsDeleting(true);
    try {
      const { data: result, error: rpcError } = await supabase.rpc('delete_storage_folder', {
        p_folder_id: item.nodeId,
        p_tenant_id: tenantId,
      });

      if (rpcError) throw new Error(rpcError.message);

      const response = result as { success: boolean; message: string; error?: string };

      if (!response.success) {
        toast.error(response.message);
        setIsDeleting(false);
        return;
      }

      toast.success(response.message);
      setSelectedItem(null);
      
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

  // ── Unified delete dispatch ─────────────────────────────────────────
  const handleDelete = useCallback((item: FileManagerItem) => {
    if (item.type === 'folder') {
      handleDeleteFolder(item);
    } else {
      handleDeleteFile(item);
    }
  }, [handleDeleteFolder, handleDeleteFile]);

  // ── Rename handler ──────────────────────────────────────────────────
  const handleRenameClick = useCallback((item: FileManagerItem) => {
    setRenameTarget(item);
    setShowRenameDialog(true);
  }, []);

  const handleRenameConfirm = useCallback(async (newName: string) => {
    if (!renameTarget?.nodeId) return;
    setIsRenaming(true);
    try {
      const { error } = await supabase
        .from('storage_nodes')
        .update({ name: newName })
        .eq('id', renameTarget.nodeId)
        .eq('tenant_id', tenantId);
      if (error) throw error;
      toast.success(`Ordner umbenannt zu „${newName}"`);
      setShowRenameDialog(false);
      setRenameTarget(null);
      setSelectedItem(null);
      invalidateAll();
    } catch (err) {
      console.error('Rename failed:', err);
      toast.error('Umbenennen fehlgeschlagen');
    }
    setIsRenaming(false);
  }, [renameTarget, tenantId, invalidateAll]);

  // ── New subfolder ───────────────────────────────────────────────────
  const handleNewSubfolder = useCallback((parentNodeId: string) => {
    setNewFolderParentId(parentNodeId);
    setShowNewFolderDialog(true);
  }, []);

  // ── New folder at current level ─────────────────────────────────────
  const handleNewFolderAtCurrentLevel = useCallback(() => {
    const targetParent = resolveTargetFolderId();
    setNewFolderParentId(targetParent);
    setShowNewFolderDialog(true);
  }, [resolveTargetFolderId]);

  const handleCreateFolder = useCallback(async (name: string) => {
    const parentId = newFolderParentId || resolveTargetFolderId();
    if (!parentId) {
      toast.error('Kein übergeordneter Ordner gefunden');
      return;
    }

    try {
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

  // ── Keyboard shortcuts ──────────────────────────────────────────────
  useStorageKeyboard({
    selectedItem,
    onDelete: handleDelete,
    onOpen: (item) => {
      if (item.type === 'file' && item.documentId) {
        handleDownload(item.documentId);
      }
    },
    onClearSelection: () => setSelectedItem(null),
    containerRef,
  });

  const handleSelectedItemChange = useCallback((item: FileManagerItem | null) => {
    setSelectedItem(item);
  }, []);

  const isUploading = universalUpload.isUploading || createDMS.isPending;
  const selectedItemMutable = selectedItem ? isItemMutable(selectedItem) : true;

  // Empty state
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
    <div
      ref={containerRef}
      tabIndex={0}
      className={cn(DESIGN.STORAGE.CONTAINER, DESIGN.STORAGE.MIN_HEIGHT, 'relative outline-none flex flex-col', className)}
    >
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

      {/* Header with new folder button */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/30 shrink-0">
        <span className="text-xs text-muted-foreground font-medium">Datenraum</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleNewFolderAtCurrentLevel}
            >
              <FolderPlus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">Neuer Ordner</TooltipContent>
        </Tooltip>
      </div>

      {/* Selection action bar */}
      {selectedItem && (
        <SelectionActionBar
          item={selectedItem}
          onOpen={selectedItem.type === 'file' && selectedItem.documentId ? () => handleDownload(selectedItem.documentId!) : undefined}
          onDownload={selectedItem.type === 'file' && selectedItem.documentId ? () => handleDownload(selectedItem.documentId!) : undefined}
          onDelete={() => handleDelete(selectedItem)}
          onNewSubfolder={selectedItem.type === 'folder' && selectedItem.nodeId ? () => handleNewSubfolder(selectedItem.nodeId!) : undefined}
          onMove={() => setShowMoveDialog(true)}
          onRename={selectedItem.type === 'folder' ? () => handleRenameClick(selectedItem) : undefined}
          onClear={() => setSelectedItem(null)}
          isDownloading={isDownloading}
          isDeleting={isDeleting}
          isMoving={isMoving}
          isMutable={selectedItemMutable}
        />
      )}

      <FileDropZone
        onDrop={handleFileDrop}
        targetFolderName={targetFolderName}
        className="flex-1 min-h-0"
      >
        <DndStorageProvider onMoveFile={moveFile} onMoveFolder={moveFolder}>
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
            onRename={handleRenameClick}
            onUploadToFolder={handleUploadToFolder}
            onSelectedItemChange={handleSelectedItemChange}
            isDownloading={isDownloading}
            isDeleting={isDeleting}
            enableDnd
          />
        </DndStorageProvider>
      </FileDropZone>

      <NewFolderDialog
        open={showNewFolderDialog}
        onOpenChange={setShowNewFolderDialog}
        onCreateFolder={handleCreateFolder}
        isCreating={false}
      />

      <RenameFolderDialog
        open={showRenameDialog}
        onOpenChange={setShowRenameDialog}
        currentName={renameTarget?.name || ''}
        onRename={handleRenameConfirm}
        isRenaming={isRenaming}
      />

      <MoveToFolderDialog
        open={showMoveDialog}
        onOpenChange={setShowMoveDialog}
        folders={allNodes.map(n => ({
          id: n.id,
          parent_id: n.parent_id,
          name: n.name,
          template_id: n.template_id,
          module_code: n.module_code,
        }))}
        excludeIds={selectedItem?.type === 'folder' && selectedItem.nodeId ? new Set([selectedItem.nodeId]) : undefined}
        currentFolderId={currentFolderId}
        itemName={selectedItem?.name}
        isMoving={isMoving}
        onConfirm={async (targetFolderId) => {
          if (!selectedItem) return;
          let success = false;
          if (selectedItem.type === 'file' && selectedItem.documentId) {
            success = await moveFile(selectedItem.documentId, targetFolderId);
          } else if (selectedItem.type === 'folder' && selectedItem.nodeId) {
            success = await moveFolder(selectedItem.nodeId, targetFolderId);
          }
          if (success) {
            setShowMoveDialog(false);
            setSelectedItem(null);
          }
        }}
      />
    </div>
  );
}
