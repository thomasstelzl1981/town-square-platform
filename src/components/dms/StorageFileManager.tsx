/**
 * StorageFileManager — Supabase-style premium file manager
 * Single card container with 5 view modes, toolbar, and status bar.
 * Mobile: Dropbox-style with FAB, simplified toolbar, list-only view.
 */
import { useState, useMemo, useRef, useCallback } from 'react';
import { Plus, Upload, FolderPlus } from 'lucide-react';
import { StorageToolbar, type ViewMode, type SortField, type SortDir } from './StorageToolbar';
import { ListView, type FileManagerItem } from './views/ListView';
import { ColumnView } from './views/ColumnView';
import { PreviewView } from './views/PreviewView';
import { MultiSelectView } from './views/MultiSelectView';
import { PathNavigatorView } from './views/PathNavigatorView';
import { BulkActionBar } from './BulkActionBar';
import { NewFolderDialog } from './NewFolderDialog';
import { FileDropZone } from './FileDropZone';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getModuleDisplayName } from '@/config/storageManifest';
import { useIsMobile } from '@/hooks/use-mobile';

interface StorageNode {
  id: string;
  tenant_id: string;
  parent_id: string | null;
  name: string;
  node_type: string;
  template_id: string | null;
  scope_hint: string | null;
  property_id: string | null;
  unit_id: string | null;
  module_code: string | null;
  created_at: string;
}

interface Document {
  id: string;
  public_id: string;
  name: string;
  file_path: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
  uploaded_by: string | null;
}

interface DocumentLink {
  id: string;
  document_id: string;
  node_id: string | null;
  object_type: string | null;
  object_id: string | null;
}

interface StorageFileManagerProps {
  nodes: StorageNode[];
  documents: Document[];
  allDocuments: Document[];
  documentLinks: DocumentLink[];
  onUploadFiles: (files: File[]) => void;
  onDownload: (documentId: string) => void;
  onDeleteDocument: (documentId: string) => void;
  onDeleteFolder: (nodeId: string) => void;
  onCreateFolder: (name: string, parentId: string | null) => void;
  onBulkDownload: (ids: Set<string>) => void;
  onBulkDelete: (ids: Set<string>) => void;
  isUploading?: boolean;
  isDownloading?: boolean;
  isDeleting?: boolean;
  isCreatingFolder?: boolean;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
}

import { formatFileSize } from './storageHelpers';

export function StorageFileManager({
  nodes,
  documents,
  allDocuments,
  documentLinks,
  onUploadFiles,
  onDownload,
  onDeleteDocument,
  onDeleteFolder,
  onCreateFolder,
  onBulkDownload,
  onBulkDelete,
  isUploading,
  isDownloading,
  isDeleting,
  isCreatingFolder,
  selectedNodeId,
  onSelectNode,
}: StorageFileManagerProps) {
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [previewItem, setPreviewItem] = useState<FileManagerItem | null>(null);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);
  const [columnPath, setColumnPath] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Force list view on mobile
  const effectiveViewMode = isMobile ? 'list' : viewMode;

  // Breadcrumb segments
  const breadcrumbSegments = useMemo(() => {
    if (!selectedNodeId) return [];
    const segments: { id: string; label: string }[] = [];
    let current = nodes.find(n => n.id === selectedNodeId);
    while (current) {
      const label = current.module_code && current.template_id?.endsWith('_ROOT')
        ? getModuleDisplayName(current.module_code)
        : current.name;
      segments.unshift({ id: current.id, label });
      current = current.parent_id ? nodes.find(n => n.id === current!.parent_id) : undefined;
    }
    return segments;
  }, [selectedNodeId, nodes]);

  // Build items for current folder
  const items = useMemo(() => {
    const childFolders = nodes
      .filter(n => n.parent_id === selectedNodeId)
      .map((n): FileManagerItem => ({
        id: `node_${n.id}`,
        name: n.module_code && n.template_id?.endsWith('_ROOT')
          ? getModuleDisplayName(n.module_code)
          : n.name,
        type: 'folder',
        createdAt: n.created_at,
        nodeId: n.id,
        childCount: nodes.filter(c => c.parent_id === n.id).length,
        moduleCode: n.module_code || undefined,
        templateId: n.template_id || undefined,
      }));

    const fileItems = documents.map((d): FileManagerItem => ({
      id: `doc_${d.id}`,
      name: d.name,
      type: 'file',
      size: d.size_bytes,
      mimeType: d.mime_type,
      createdAt: d.created_at,
      documentId: d.id,
      filePath: d.file_path,
      publicId: d.public_id,
    }));

    const all = [...childFolders, ...fileItems];

    all.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      let cmp = 0;
      switch (sortField) {
        case 'name': cmp = a.name.localeCompare(b.name); break;
        case 'size': cmp = (a.size || 0) - (b.size || 0); break;
        case 'type': cmp = (a.mimeType || '').localeCompare(b.mimeType || ''); break;
        case 'created_at': cmp = a.createdAt.localeCompare(b.createdAt); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return all;
  }, [nodes, documents, selectedNodeId, sortField, sortDir]);

  const totalSize = useMemo(() =>
    documents.reduce((acc, d) => acc + d.size_bytes, 0),
    [documents],
  );

  const currentPathStr = useMemo(() =>
    breadcrumbSegments.map(s => s.label).join(' / '),
    [breadcrumbSegments],
  );

  // Handlers
  const handleSortChange = (field: SortField, dir: SortDir) => {
    setSortField(field);
    setSortDir(dir);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map(i => i.id)));
    }
  };

  const handleNavigateFolder = useCallback((nodeId: string) => {
    onSelectNode(nodeId);
    setSelectedIds(new Set());
    setPreviewItem(null);
  }, [onSelectNode]);

  const handleDelete = (item: FileManagerItem) => {
    const name = item.name;
    if (!confirm(`"${name}" wirklich löschen?`)) return;
    if (item.type === 'folder' && item.nodeId) {
      onDeleteFolder(item.nodeId);
    } else if (item.documentId) {
      onDeleteDocument(item.documentId);
    }
  };

  const handleNewSubfolder = (parentNodeId: string) => {
    setNewFolderParentId(parentNodeId);
    setShowNewFolderDialog(true);
  };

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) onUploadFiles(files);
    e.target.value = '';
  };

  const handleBulkDownload = () => {
    const docIds = new Set<string>();
    selectedIds.forEach(id => {
      const item = items.find(i => i.id === id);
      if (item?.documentId) docIds.add(item.documentId);
    });
    onBulkDownload(docIds);
  };

  const handleBulkDelete = () => {
    const docIds = new Set<string>();
    selectedIds.forEach(id => {
      const item = items.find(i => i.id === id);
      if (item?.documentId) docIds.add(item.documentId);
    });
    onBulkDelete(docIds);
    setSelectedIds(new Set());
  };

  const handleColumnNavigate = (nodeId: string, depth: number) => {
    setColumnPath(prev => [...prev.slice(0, depth), nodeId]);
  };

  const handleNavigatePath = (path: string) => {
    const parts = path.split('/').map(s => s.trim()).filter(Boolean);
    let currentId: string | null = null;
    for (const part of parts) {
      const match = nodes.find(n => n.parent_id === currentId && n.name.toLowerCase().includes(part.toLowerCase()));
      if (match) currentId = match.id;
      else break;
    }
    if (currentId) onSelectNode(currentId);
  };

  return (
    <FileDropZone onDrop={onUploadFiles} disabled={isUploading} className="h-full">
      <div className={`rounded-2xl bg-muted/30 dark:bg-muted/10 border border-border/40 shadow-sm overflow-hidden flex flex-col relative ${isMobile ? 'h-[calc(100vh-8rem)]' : 'h-[calc(100vh-12rem)]'}`}>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xls,.xlsx,.webp"
          onChange={handleFileInputChange}
        />

        {/* Toolbar */}
        <StorageToolbar
          breadcrumbSegments={breadcrumbSegments}
          viewMode={effectiveViewMode}
          sortField={sortField}
          sortDir={sortDir}
          onNavigate={(nodeId) => { onSelectNode(nodeId); setSelectedIds(new Set()); setPreviewItem(null); }}
          onViewModeChange={setViewMode}
          onSortChange={handleSortChange}
          onUploadClick={handleUploadClick}
          onNewFolderClick={() => { setNewFolderParentId(selectedNodeId); setShowNewFolderDialog(true); }}
          isUploading={isUploading}
        />

        {/* Bulk action bar */}
        {selectedIds.size > 0 && (
          <BulkActionBar
            count={selectedIds.size}
            onDownload={handleBulkDownload}
            onDelete={handleBulkDelete}
            onClear={() => setSelectedIds(new Set())}
            isDownloading={isDownloading}
          />
        )}

        {/* Content */}
        <div className="flex-1 min-h-0">
          {effectiveViewMode === 'list' && (
            <ListView
              items={items}
              selectedIds={selectedIds}
              sortField={sortField}
              sortDir={sortDir}
              onSortChange={handleSortChange}
              onToggleSelect={handleToggleSelect}
              onToggleSelectAll={handleToggleSelectAll}
              onNavigateFolder={handleNavigateFolder}
              onDownload={onDownload}
              onPreview={setPreviewItem}
              onDelete={handleDelete}
              onNewSubfolder={handleNewSubfolder}
              isDownloading={isDownloading}
              isDeleting={isDeleting}
            />
          )}

          {effectiveViewMode === 'columns' && (
            <ColumnView
              allNodes={nodes}
              documents={allDocuments}
              documentLinks={documentLinks}
              columnPath={columnPath}
              onNavigateColumn={handleColumnNavigate}
              onSelectFile={setPreviewItem}
              onDownload={onDownload}
              onDelete={handleDelete}
              onNewSubfolder={handleNewSubfolder}
              isDownloading={isDownloading}
              isDeleting={isDeleting}
            />
          )}

          {effectiveViewMode === 'preview' && (
            <PreviewView
              items={items}
              selectedItem={previewItem}
              onSelectItem={setPreviewItem}
              onDownload={onDownload}
              onDelete={handleDelete}
              onNavigateFolder={handleNavigateFolder}
              isDownloading={isDownloading}
            />
          )}

          {effectiveViewMode === 'multiselect' && (
            <MultiSelectView
              items={items}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
              onToggleSelectAll={handleToggleSelectAll}
              onNavigateFolder={handleNavigateFolder}
            />
          )}

          {effectiveViewMode === 'navigator' && (
            <PathNavigatorView
              currentPath={currentPathStr}
              items={items}
              selectedIds={selectedIds}
              sortField={sortField}
              sortDir={sortDir}
              onSortChange={handleSortChange}
              onToggleSelect={handleToggleSelect}
              onToggleSelectAll={handleToggleSelectAll}
              onNavigateFolder={handleNavigateFolder}
              onNavigatePath={handleNavigatePath}
              onDownload={onDownload}
              onPreview={setPreviewItem}
              onDelete={handleDelete}
              onNewSubfolder={handleNewSubfolder}
              isDownloading={isDownloading}
              isDeleting={isDeleting}
            />
          )}
        </div>

        {/* Status bar */}
        <div className="px-4 py-2 border-t border-border/30 text-xs text-muted-foreground flex items-center gap-2">
          <span>{items.length} Elemente</span>
          <span>·</span>
          <span>{formatFileSize(totalSize)}</span>
        </div>

        {/* Mobile FAB */}
        {isMobile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                className="absolute bottom-14 right-4 h-14 w-14 rounded-full shadow-lg z-10"
              >
                <Plus className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-48">
              <DropdownMenuItem onClick={handleUploadClick} disabled={isUploading}>
                <Upload className="h-4 w-4 mr-2" />
                Datei hochladen
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setNewFolderParentId(selectedNodeId); setShowNewFolderDialog(true); }}>
                <FolderPlus className="h-4 w-4 mr-2" />
                Neuer Ordner
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* New folder dialog */}
        <NewFolderDialog
          open={showNewFolderDialog}
          onOpenChange={setShowNewFolderDialog}
          onCreateFolder={(name) => {
            onCreateFolder(name, newFolderParentId);
            setShowNewFolderDialog(false);
          }}
          isCreating={isCreatingFolder}
        />
      </div>
    </FileDropZone>
  );
}
