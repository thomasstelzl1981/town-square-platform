/**
 * DMS Storage Tab — MOD-03
 * Tree-based folder navigation with system nodes
 * Displays full recursive hierarchy including property subfolders
 */
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DataTable, FileUploader, DetailDrawer, EmptyState, type Column } from '@/components/shared';
import { StorageFolderTree } from '@/components/dms/StorageFolderTree';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { File, Plus, Download, Eye, Link2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

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

// System folder definitions for seeding (legacy - now handled by DB trigger)
// Kept for backwards compatibility only
const SYSTEM_FOLDERS = [
  { key: 'inbox', name: 'Posteingang' },
  { key: 'user_files', name: 'Eigene Dateien' },
  { key: 'needs_review', name: 'Zur Prüfung' },
  { key: 'archive', name: 'Archiv' },
  { key: 'sonstiges', name: 'Sonstiges' },
];

// Module root folders (now handled by DB trigger)
const MODULE_ROOT_FOLDERS = [
  { key: 'MOD_04_ROOT', name: 'Immobilien', module_code: 'MOD_04' },
  { key: 'MOD_06_ROOT', name: 'Verkauf', module_code: 'MOD_06' },
  { key: 'MOD_07_ROOT', name: 'Finanzierung', module_code: 'MOD_07' },
  { key: 'MOD_16_ROOT', name: 'Sanierung', module_code: 'MOD_16' },
  { key: 'MOD_17_ROOT', name: 'Car-Management', module_code: 'MOD_17' },
];

export function StorageTab() {
  const { activeTenantId } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Fetch storage nodes (ALL folders, not just root)
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

  // Fetch properties for display labels
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

  // Seed system and module root nodes if they don't exist
  // Note: This is now primarily handled by DB trigger, but kept for backwards compatibility
  useEffect(() => {
    async function seedSystemNodes() {
      if (!activeTenantId || nodesLoading) return;
      
      // Check if module roots exist (new architecture)
      const existingTemplates = new Set(nodes.map(n => n.template_id));
      const hasModuleRoots = MODULE_ROOT_FOLDERS.every(f => existingTemplates.has(f.key));
      
      // If module roots exist, we're on the new architecture - no need to seed
      if (hasModuleRoots) return;
      
      try {
        const nodesToCreate: any[] = [];
        
        // Create missing system nodes
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
        
        // Create missing module root folders
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
  }, [activeTenantId, nodes, nodesLoading, refetchNodes]);

  // Fetch documents for selected node (or all if none selected)
  const { data: documents = [], isLoading: docsLoading } = useQuery({
    queryKey: ['documents', activeTenantId, selectedNodeId],
    queryFn: async (): Promise<Document[]> => {
      if (!activeTenantId) return [];
      
      // First get document links for this node
      let docIds: string[] = [];
      
      if (selectedNodeId) {
        const { data: links } = await supabase
          .from('document_links')
          .select('document_id')
          .eq('tenant_id', activeTenantId)
          .eq('node_id', selectedNodeId);
        
        docIds = (links || []).map(l => l.document_id);
        
        // If no documents linked, return empty
        if (docIds.length === 0) return [];
      }
      
      // Build query
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

  // Fetch document links
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

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error('Not authenticated');

      const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;
      
      const response = await supabase.functions.invoke('sot-dms-upload-url', {
        body: {
          filename: file.name,
          mime_type: file.type,
          size_bytes: file.size,
          folder: selectedNode?.template_id || undefined,
        },
      });

      if (response.error) throw response.error;
      const { upload_url, document_id } = response.data;

      const uploadResponse = await fetch(upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadResponse.ok) throw new Error('Upload failed');

      // Create document link if folder is selected
      if (selectedNodeId && document_id) {
        await supabase.from('document_links').insert({
          tenant_id: activeTenantId,
          document_id: document_id,
          node_id: selectedNodeId,
        });
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      queryClient.invalidateQueries({ queryKey: ['document-links'] });
      toast.success('Dokument hochgeladen');
    },
    onError: (error) => {
      console.error('Upload error:', error);
      toast.error('Upload fehlgeschlagen');
    },
  });

  // Download mutation
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

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const { error } = await supabase.from('documents').delete().eq('id', documentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Dokument gelöscht');
      setIsDrawerOpen(false);
      setSelectedDocument(null);
    },
    onError: () => toast.error('Löschen fehlgeschlagen'),
  });

  const handleFileSelect = (files: File[]) => {
    files.forEach(file => uploadMutation.mutate(file));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Get links for a document
  const getDocumentLinks = (docId: string) => documentLinks.filter(l => l.document_id === docId);

  const columns: Column<Document>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (_, doc) => (
        <div className="flex items-center gap-2">
          <File className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{doc.name}</span>
          {getDocumentLinks(doc.id).length > 0 && (
            <Badge variant="secondary" className="text-xs">
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
        <span className="text-muted-foreground text-sm">
          {doc.mime_type.split('/')[1]?.toUpperCase() || doc.mime_type}
        </span>
      ),
    },
    {
      key: 'size_bytes',
      header: 'Größe',
      render: (_, doc) => formatFileSize(doc.size_bytes),
    },
    {
      key: 'created_at',
      header: 'Hochgeladen',
      render: (_, doc) => formatDistanceToNow(new Date(doc.created_at), { addSuffix: true, locale: de }),
    },
    {
      key: 'actions',
      header: '',
      render: (_, doc) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); downloadMutation.mutate(doc.id); }}>
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setSelectedDocument(doc); setIsDrawerOpen(true); }}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={(e) => { 
              e.stopPropagation(); 
              if (confirm('Dokument wirklich löschen?')) {
                deleteMutation.mutate(doc.id); 
              }
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-12 gap-4 h-[calc(100vh-16rem)]">
      {/* Left: Folder Tree - Using new recursive component */}
      <div className="col-span-3">
        <StorageFolderTree
          nodes={nodes}
          properties={properties}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
        />
      </div>

      {/* Center: Document List */}
      <div className="col-span-9 border rounded-lg bg-card flex flex-col">
        <div className="p-3 border-b">
          <div className="flex items-center gap-2">
            <Input placeholder="Dokumente suchen..." className="max-w-xs h-8" />
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
        </div>

        <div className="flex-1 overflow-auto">
          {documents.length === 0 ? (
            <EmptyState
              icon={File}
              title={selectedNodeId ? 'Keine Dokumente in diesem Ordner' : 'Keine Dokumente'}
              description={selectedNodeId ? 'Laden Sie Dokumente in diesen Ordner hoch' : 'Laden Sie Ihr erstes Dokument hoch'}
            />
          ) : (
            <DataTable
              data={documents}
              columns={columns}
              isLoading={docsLoading}
              onRowClick={(doc) => { setSelectedDocument(doc); setIsDrawerOpen(true); }}
            />
          )}
        </div>
      </div>

      {/* Right: Detail Drawer */}
      <DetailDrawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} title={selectedDocument?.name || 'Dokument'}>
        {selectedDocument && (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground">Dateiname</label>
              <p className="font-medium">{selectedDocument.name}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Typ</label>
              <p>{selectedDocument.mime_type}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Größe</label>
              <p>{formatFileSize(selectedDocument.size_bytes)}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Hochgeladen</label>
              <p>{new Date(selectedDocument.created_at).toLocaleDateString('de-DE')}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">ID</label>
              <p className="font-mono text-xs">{selectedDocument.public_id}</p>
            </div>

            {/* Document Links */}
            <div>
              <label className="text-sm text-muted-foreground">Verknüpfungen</label>
              {getDocumentLinks(selectedDocument.id).length > 0 ? (
                <div className="space-y-1 mt-1">
                  {getDocumentLinks(selectedDocument.id).map(link => (
                    <Badge key={link.id} variant="secondary" className="mr-1">
                      {link.object_type || 'Ordner'}: {link.object_id?.slice(0, 8) || link.node_id?.slice(0, 8)}...
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Keine Verknüpfungen</p>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                className="flex-1"
                onClick={() => downloadMutation.mutate(selectedDocument.id)}
                disabled={downloadMutation.isPending}
              >
                <Download className="h-4 w-4 mr-2" />
                Herunterladen
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => deleteMutation.mutate(selectedDocument.id)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
