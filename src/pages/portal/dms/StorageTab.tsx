/**
 * DMS Storage Tab — Supabase-Style Premium File Manager
 * Data layer only — delegates all UI to StorageFileManager
 */
import { useState, useEffect, useMemo } from 'react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { useUniversalUpload } from '@/hooks/useUniversalUpload';
import { UploadResultList } from '@/components/shared/UploadResultCard';
import { STORAGE_MANIFEST, getSortedModules, getModuleDisplayName } from '@/config/storageManifest';
import { StorageFileManager } from '@/components/dms/StorageFileManager';
import { downloadFromSignedUrl } from '@/lib/storage-url';

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

  // Documents for selected node (empty at root level)
  const { data: documents = [] } = useQuery({
    queryKey: ['documents', activeTenantId, selectedNodeId],
    queryFn: async (): Promise<Document[]> => {
      if (!activeTenantId || !selectedNodeId) return []; // FIX: no docs at root
      const { data: links } = await supabase
        .from('document_links')
        .select('document_id')
        .eq('tenant_id', activeTenantId)
        .eq('node_id', selectedNodeId);
      const docIds = (links || []).map(l => l.document_id);
      if (docIds.length === 0) return [];
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .in('id', docIds)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Document[];
    },
    enabled: !!activeTenantId,
  });

  // ALL documents + links (unfiltered) for ColumnView / MultiSelectView
  const { data: allDocuments = [] } = useQuery({
    queryKey: ['all-documents', activeTenantId],
    queryFn: async (): Promise<Document[]> => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: false });
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

  // ── Helper: invalidate all DMS queries ─────────────────────
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['documents'] });
    queryClient.invalidateQueries({ queryKey: ['all-documents'] });
    queryClient.invalidateQueries({ queryKey: ['document-links'] });
    queryClient.invalidateQueries({ queryKey: ['storage-nodes'] });
  };

  // ── Mutations (unified with EntityStorageTree — same RPCs) ──
  const { upload: universalUpload, uploadedFiles, clearUploadedFiles, progress: uploadProgress } = useUniversalUpload();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;
      const moduleCode = selectedNode?.module_code || 'MOD_03';
      const result = await universalUpload(file, {
        moduleCode,
        parentNodeId: selectedNodeId || undefined,
        objectType: selectedNode?.node_type === 'folder' ? 'storage_folder' : undefined,
        objectId: selectedNodeId || undefined,
        source: 'upload',
      });
      if (result.error) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      invalidateAll();
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
      await downloadFromSignedUrl(response.data.download_url, response.data.filename);
      return response.data;
    },
    onError: () => toast.error('Download fehlgeschlagen'),
  });

  // Unified file delete: server-side RPC (atomic cleanup)
  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      if (!activeTenantId) throw new Error('Kein Mandant');
      const { data: result, error: rpcError } = await supabase.rpc('delete_storage_file', {
        p_document_id: documentId,
        p_tenant_id: activeTenantId,
      });
      if (rpcError) throw new Error(rpcError.message);
      const response = result as { success: boolean; message: string; file_path?: string };
      if (!response.success) throw new Error(response.message);
      // Blob cleanup (client-side, needs storage auth)
      if (response.file_path) {
        await supabase.storage.from('tenant-documents').remove([response.file_path]);
      }
      return response;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success('Dokument gelöscht');
    },
    onError: (error: Error) => toast.error(error.message || 'Löschen fehlgeschlagen'),
  });

  // Unified folder delete: server-side RPC with 5 guards
  const deleteFolderMutation = useMutation({
    mutationFn: async (nodeId: string) => {
      if (!activeTenantId) throw new Error('Kein Mandant');
      const { data: result, error: rpcError } = await supabase.rpc('delete_storage_folder', {
        p_folder_id: nodeId,
        p_tenant_id: activeTenantId,
      });
      if (rpcError) throw new Error(rpcError.message);
      const response = result as { success: boolean; message: string };
      if (!response.success) throw new Error(response.message);
      return response;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success('Ordner gelöscht');
      if (selectedNodeId) setSelectedNodeId(null);
    },
    onError: (error: Error) => toast.error(error.message || 'Löschen fehlgeschlagen'),
  });

  const createFolderMutation = useMutation({
    mutationFn: async ({ name, parentId }: { name: string; parentId: string | null }) => {
      if (!activeTenantId) throw new Error('Kein Mandant');
      const parentNode = parentId ? nodes.find(n => n.id === parentId) : null;
      const { error } = await supabase.from('storage_nodes').insert({
        tenant_id: activeTenantId,
        parent_id: parentId,
        name,
        node_type: 'folder',
        module_code: parentNode?.module_code || 'MOD_03',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidateAll();
      toast.success('Ordner erstellt');
    },
    onError: () => toast.error('Ordner erstellen fehlgeschlagen'),
  });

  // ── Handlers ─────────────────────────────────────────────────
  const handleUploadFiles = (files: File[]) => files.forEach(file => uploadMutation.mutate(file));

  const handleBulkDownload = (ids: Set<string>) => {
    ids.forEach(id => downloadMutation.mutate(id));
  };

  const handleBulkDelete = async (ids: Set<string>) => {
    if (!activeTenantId) return;
    for (const id of ids) {
      const { data: result, error } = await supabase.rpc('delete_storage_file', {
        p_document_id: id,
        p_tenant_id: activeTenantId,
      });
      if (!error && result) {
        const response = result as { file_path?: string };
        if (response.file_path) {
          await supabase.storage.from('tenant-documents').remove([response.file_path]);
        }
      }
    }
    invalidateAll();
    toast.success(`${ids.size} Dokument(e) gelöscht`);
  };

  // ── Render ───────────────────────────────────────────────────
  return (
    <PageShell>
      <ModulePageHeader title="Dateien" description="Verwalte deine Dokumente und Ordner" />
      {/* Upload feedback */}
      {uploadedFiles.length > 0 && (
        <UploadResultList
          files={uploadedFiles}
          status={uploadProgress.status === 'analyzing' ? 'analyzing' : uploadProgress.status === 'done' ? 'done' : 'uploaded'}
          onClear={clearUploadedFiles}
          compact
        />
      )}

      <StorageFileManager
        nodes={nodes}
        documents={documents}
        allDocuments={allDocuments}
        documentLinks={documentLinks}
        selectedNodeId={selectedNodeId}
        onSelectNode={setSelectedNodeId}
        onUploadFiles={handleUploadFiles}
        onDownload={(id) => downloadMutation.mutate(id)}
        onDeleteDocument={(id) => deleteMutation.mutate(id)}
        onDeleteFolder={(id) => deleteFolderMutation.mutate(id)}
        onCreateFolder={(name, parentId) => createFolderMutation.mutate({ name, parentId })}
        onBulkDownload={handleBulkDownload}
        onBulkDelete={handleBulkDelete}
        isUploading={uploadMutation.isPending}
        isDownloading={downloadMutation.isPending}
        isDeleting={deleteMutation.isPending}
        isCreatingFolder={createFolderMutation.isPending}
      />
    </PageShell>
  );
}
