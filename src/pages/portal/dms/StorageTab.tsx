/**
 * DMS Storage Tab — MOD-03 — OneDrive-Style File Manager
 * 3-Panel Layout: Tree | Files | Detail
 * SSOT: STORAGE_MANIFEST for all 20 modules
 */
import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DataTable, FileUploader, EmptyState, type Column } from '@/components/shared';
import { StorageFolderTree } from '@/components/dms/StorageFolderTree';
import { StorageBreadcrumb } from '@/components/dms/StorageBreadcrumb';
import { FileDetailPanel } from '@/components/dms/FileDetailPanel';
import { FileDropZone } from '@/components/dms/FileDropZone';
import { BulkActionBar } from '@/components/dms/BulkActionBar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { File, Plus, Download, Trash2, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { useUniversalUpload } from '@/hooks/useUniversalUpload';
import { UploadResultList } from '@/components/shared/UploadResultCard';
import { STORAGE_MANIFEST, getSortedModules, getModuleDisplayName } from '@/config/storageManifest';

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

interface PropertyInfo {
  id: string;
  code: string | null;
  address: string;
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

// System + module folders to seed (derived from STORAGE_MANIFEST SSOT)
const SYSTEM_FOLDERS = [
  { key: 'inbox', name: 'Posteingang' },
  { key: 'user_files', name: 'Eigene Dateien' },
  { key: 'needs_review', name: 'Zur Prüfung' },
  { key: 'archive', name: 'Archiv' },
  { key: 'sonstiges', name: 'Sonstiges' },
];

function buildModuleRootFolders() {
  return [
    ...getSortedModules().map(cfg => ({
      key: cfg.root_template_id,
      name: cfg.root_name,
      module_code: cfg.module_code,
    })),
    { key: 'TRASH_ROOT', name: 'Papierkorb', module_code: 'SYSTEM' },
  ];
}

export function StorageTab() {
  const { activeTenantId } = useAuth();
  const queryClient = useQueryClient();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());

  const MODULE_ROOT_FOLDERS = useMemo(() => buildModuleRootFolders(), []);

  // ── Queries ──────────────────────────────────────────────────
  const { data: nodes = [], isLoading: nodesLoading, refetch: refetchNodes } = useQuery({
    queryKey: ['storage-nodes', activeTenantId],
    queryFn: async (): Promise<StorageNode[]> => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('storage_nodes')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .order('name');
      if (error) throw error;
      return (data || []) as unknown as StorageNode[];
    },
    enabled: !!activeTenantId,
  });

  const { data: properties = [] } = useQuery({
    queryKey: ['properties-for-tree', activeTenantId],
    queryFn: async (): Promise<PropertyInfo[]> => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('properties')
        .select('id, code, address')
        .eq('tenant_id', activeTenantId);
      if (error) throw error;
      return data as PropertyInfo[];
    },
    enabled: !!activeTenantId,
  });

  // Seed system + module root nodes
  useEffect(() => {
    async function seedSystemNodes() {
      if (!activeTenantId || nodesLoading) return;
      const existingTemplates = new Set(nodes.map(n => n.template_id));
      const hasAllRoots = MODULE_ROOT_FOLDERS.every(f => existingTemplates.has(f.key));
      if (hasAllRoots) return;

      try {
        const nodesToCreate: any[] = [];
        SYSTEM_FOLDERS.forEach(f => {
          if (!existingTemplates.has(f.key)) {
            nodesToCreate.push({
              tenant_id: activeTenantId,
              parent_id: null,
              name: f.name,
              node_type: 'system',
              template_id: f.key,
              module_code: 'SYSTEM',
            });
          }
        });
        MODULE_ROOT_FOLDERS.forEach(f => {
          if (!existingTemplates.has(f.key)) {
            nodesToCreate.push({
              tenant_id: activeTenantId,
              parent_id: null,
              name: f.name,
              node_type: 'folder',
              template_id: f.key,
              module_code: f.module_code,
            });
          }
        });
        if (nodesToCreate.length > 0) {
          await supabase.from('storage_nodes').insert(nodesToCreate);
          refetchNodes();
          toast.success('Ordnerstruktur erstellt');
        }
      } catch (err) {
        console.error('Error seeding nodes:', err);
      }
    }
    seedSystemNodes();
  }, [activeTenantId, nodes, nodesLoading, refetchNodes, MODULE_ROOT_FOLDERS]);

  // Documents for selected node
  const { data: documents = [], isLoading: docsLoading } = useQuery({
    queryKey: ['documents', activeTenantId, selectedNodeId],
    queryFn: async (): Promise<Document[]> => {
      if (!activeTenantId) return [];
      let docIds: string[] = [];
      if (selectedNodeId) {
        const { data: links } = await supabase
          .from('document_links')
          .select('document_id')
          .eq('tenant_id', activeTenantId)
          .eq('node_id', selectedNodeId);
        docIds = (links || []).map(l => l.document_id);
        if (docIds.length === 0) return [];
      }
      let query = supabase
        .from('documents')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: false });
      if (selectedNodeId && docIds.length > 0) {
        query = query.in('id', docIds);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data as Document[];
    },
    enabled: !!activeTenantId,
  });

  const { data: documentLinks = [] } = useQuery({
    queryKey: ['document-links', activeTenantId],
    queryFn: async (): Promise<DocumentLink[]> => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('document_links')
        .select('id, document_id, node_id, object_type, object_id')
        .eq('tenant_id', activeTenantId);
      if (error) throw error;
      return (data || []) as DocumentLink[];
    },
    enabled: !!activeTenantId,
  });

  // ── Mutations ────────────────────────────────────────────────
  const { upload: universalUpload, uploadedFiles, clearUploadedFiles, progress: uploadProgress } = useUniversalUpload();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;
      const moduleCode = selectedNode?.module_code || 'MOD_03';
      const result = await universalUpload(file, {
        moduleCode,
        parentNodeId: selectedNodeId || undefined,
        source: 'dms',
      });
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document-links'] });
      queryClient.invalidateQueries({ queryKey: ['storage-nodes'] });
      toast.success('Dokument hochgeladen');
    },
    onError: () => toast.error('Upload fehlgeschlagen'),
  });

  const downloadMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await supabase.functions.invoke('sot-dms-download-url', {
        body: { document_id: documentId },
      });
      if (response.error) throw response.error;
      window.open(response.data.download_url, '_blank');
      return response.data;
    },
    onError: () => toast.error('Download fehlgeschlagen'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const { error } = await supabase.from('documents').delete().eq('id', documentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Dokument gelöscht');
      setSelectedDocId(null);
    },
    onError: () => toast.error('Löschen fehlgeschlagen'),
  });

  const deleteFolderMutation = useMutation({
    mutationFn: async (nodeId: string) => {
      const { data: links } = await supabase
        .from('document_links')
        .select('id')
        .eq('node_id', nodeId)
        .limit(1);
      if (links && links.length > 0) throw new Error('Ordner enthält noch Dokumente');
      const { error } = await supabase.from('storage_nodes').delete().eq('id', nodeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-nodes'] });
      toast.success('Ordner gelöscht');
      if (selectedNodeId) setSelectedNodeId(null);
    },
    onError: (error: Error) => toast.error(error.message || 'Löschen fehlgeschlagen'),
  });

  // ── Helpers ──────────────────────────────────────────────────
  const handleFileSelect = (files: File[]) => files.forEach(file => uploadMutation.mutate(file));
  const handleDropFiles = (files: File[]) => files.forEach(file => uploadMutation.mutate(file));

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getDocumentLinks = (docId: string) => documentLinks.filter(l => l.document_id === docId);

  // Breadcrumb path
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

  // Selection
  const toggleDocSelection = (docId: string) => {
    setSelectedDocIds(prev => {
      const next = new Set(prev);
      if (next.has(docId)) next.delete(docId);
      else next.add(docId);
      return next;
    });
  };

  const toggleAllDocs = () => {
    if (selectedDocIds.size === documents.length) {
      setSelectedDocIds(new Set());
    } else {
      setSelectedDocIds(new Set(documents.map(d => d.id)));
    }
  };

  const handleBulkDownload = () => {
    selectedDocIds.forEach(id => downloadMutation.mutate(id));
  };

  const handleBulkDelete = async () => {
    for (const id of selectedDocIds) {
      await supabase.from('documents').delete().eq('id', id);
    }
    queryClient.invalidateQueries({ queryKey: ['documents'] });
    setSelectedDocIds(new Set());
    toast.success(`${selectedDocIds.size} Dokument(e) gelöscht`);
  };

  const selectedDocument = selectedDocId ? documents.find(d => d.id === selectedDocId) : null;
  const showDetailPanel = !!selectedDocument;

  // ── Columns ──────────────────────────────────────────────────
  const columns: Column<Document>[] = [
    {
      key: 'select',
      header: '',
      render: (_, doc) => (
        <Checkbox
          checked={selectedDocIds.has(doc.id)}
          onCheckedChange={() => toggleDocSelection(doc.id)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
    },
    {
      key: 'name',
      header: 'Name',
      render: (_, doc) => (
        <div className="flex items-center gap-2">
          <File className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-medium truncate">{doc.name}</span>
          {getDocumentLinks(doc.id).length > 0 && (
            <Badge variant="secondary" className="text-xs shrink-0">
              <Link2 className="h-3 w-3 mr-1" />
              {getDocumentLinks(doc.id).length}
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'mime_type',
      header: 'Typ',
      render: (_, doc) => (
        <span className="text-muted-foreground text-xs">
          {doc.mime_type.split('/')[1]?.toUpperCase() || doc.mime_type}
        </span>
      ),
    },
    {
      key: 'size_bytes',
      header: 'Größe',
      render: (_, doc) => <span className="text-xs">{formatFileSize(doc.size_bytes)}</span>,
    },
    {
      key: 'created_at',
      header: 'Hochgeladen',
      render: (_, doc) => (
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(doc.created_at), { addSuffix: true, locale: de })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (_, doc) => (
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); downloadMutation.mutate(doc.id); }}>
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Dokument wirklich löschen?')) deleteMutation.mutate(doc.id);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-16rem)]">
      {/* Toolbar */}
      <div className="flex items-center gap-3 pb-3 border-b mb-3">
        <StorageBreadcrumb segments={breadcrumbSegments} onNavigate={setSelectedNodeId} />
        <div className="flex-1" />
        <FileUploader
          onFilesSelected={handleFileSelect}
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.xls,.xlsx"
          maxSize={10 * 1024 * 1024}
          className="w-auto"
        >
          <Button size="sm" disabled={uploadMutation.isPending}>
            <Plus className="h-4 w-4 mr-1" />
            Hochladen
          </Button>
        </FileUploader>
      </div>

      {/* Upload feedback */}
      {uploadedFiles.length > 0 && (
        <div className="pb-2">
          <UploadResultList
            files={uploadedFiles}
            status={uploadProgress.status === 'analyzing' ? 'analyzing' : uploadProgress.status === 'done' ? 'done' : 'uploaded'}
            onClear={clearUploadedFiles}
            compact
          />
        </div>
      )}

      {/* 3-Panel Layout */}
      <div className="flex gap-3 flex-1 min-h-0">
        {/* Left: Folder Tree */}
        <div className="w-64 shrink-0">
          <StorageFolderTree
            nodes={nodes}
            properties={properties}
            selectedNodeId={selectedNodeId}
            onSelectNode={(id) => {
              setSelectedNodeId(id);
              setSelectedDocId(null);
              setSelectedDocIds(new Set());
            }}
            onDeleteFolder={(nodeId) => deleteFolderMutation.mutate(nodeId)}
          />
        </div>

        {/* Center: File List with Drop Zone */}
        <FileDropZone onDrop={handleDropFiles} disabled={uploadMutation.isPending} className="flex-1 min-w-0">
          <div className="border rounded-lg bg-card h-full flex flex-col">
            {/* Bulk actions */}
            <BulkActionBar
              count={selectedDocIds.size}
              onDownload={handleBulkDownload}
              onDelete={handleBulkDelete}
              onClear={() => setSelectedDocIds(new Set())}
              isDownloading={downloadMutation.isPending}
            />

            <div className="flex-1 overflow-auto">
              {documents.length === 0 ? (
                <EmptyState
                  icon={File}
                  title={selectedNodeId ? 'Keine Dokumente in diesem Ordner' : 'Keine Dokumente'}
                  description={selectedNodeId ? 'Dateien hierher ziehen oder hochladen' : 'Wähle einen Ordner oder lade Dokumente hoch'}
                />
              ) : (
                <DataTable
                  data={documents}
                  columns={columns}
                  isLoading={docsLoading}
                  onRowClick={(doc) => setSelectedDocId(doc.id)}
                />
              )}
            </div>
          </div>
        </FileDropZone>

        {/* Right: Detail Panel */}
        {showDetailPanel && selectedDocument && (
          <div className="w-72 shrink-0">
            <FileDetailPanel
              document={selectedDocument}
              links={getDocumentLinks(selectedDocument.id)}
              onClose={() => setSelectedDocId(null)}
              onDownload={(id) => downloadMutation.mutate(id)}
              onDelete={(id) => deleteMutation.mutate(id)}
              isDownloading={downloadMutation.isPending}
              isDeleting={deleteMutation.isPending}
            />
          </div>
        )}
      </div>
    </div>
  );
}
