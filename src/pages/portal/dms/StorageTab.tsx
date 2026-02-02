/**
 * DMS Storage Tab — MOD-03
 * Tree-based folder navigation with system nodes
 */
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DataTable, FileUploader, DetailDrawer, EmptyState, type Column } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Folder, FolderOpen, File, Plus, Download, Trash2, Eye, 
  Link2, ChevronRight, ChevronDown, Home, Inbox, Archive, 
  Building2, Landmark, AlertCircle, FileQuestion, MoreHorizontal
} from 'lucide-react';
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

// System folder definitions
const SYSTEM_FOLDERS = [
  { key: 'inbox', name: 'Posteingang', icon: Inbox },
  { key: 'immobilien', name: 'Immobilien', icon: Building2 },
  { key: 'finanzierung', name: 'Finanzierung', icon: Landmark },
  { key: 'bonitaetsunterlagen', name: 'Bonitätsunterlagen', icon: FileQuestion },
  { key: 'needs_review', name: 'Zur Prüfung', icon: AlertCircle },
  { key: 'archive', name: 'Archiv', icon: Archive },
  { key: 'sonstiges', name: 'Sonstiges', icon: MoreHorizontal },
];

function getNodeIcon(node: StorageNode, isOpen: boolean) {
  if (node.node_type === 'system') {
    const systemFolder = SYSTEM_FOLDERS.find(f => f.key === node.template_id);
    if (systemFolder) {
      const Icon = systemFolder.icon;
      return <Icon className="h-4 w-4" />;
    }
  }
  return isOpen ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />;
}

export function StorageTab() {
  const { activeTenantId } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Fetch storage nodes (folders)
  const { data: nodes = [], isLoading: nodesLoading, refetch: refetchNodes } = useQuery({
    queryKey: ['storage-nodes', activeTenantId],
    queryFn: async (): Promise<StorageNode[]> => {
      if (!activeTenantId) return [];
      
      const { data, error } = await supabase
        .from('storage_nodes')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .order('node_type', { ascending: false })
        .order('name');
      
      if (error) throw error;
      return (data || []) as unknown as StorageNode[];
    },
    enabled: !!activeTenantId,
  });

  // Seed system nodes if they don't exist
  useEffect(() => {
    async function seedSystemNodes() {
      if (!activeTenantId || nodesLoading) return;
      
      // Check if any system nodes exist
      const systemNodes = nodes.filter(n => n.node_type === 'system');
      if (systemNodes.length >= SYSTEM_FOLDERS.length) return;
      
      try {
        const existingKeys = new Set(systemNodes.map(n => n.template_id));
        
        // Create missing system nodes
        const nodesToCreate = SYSTEM_FOLDERS
          .filter(f => !existingKeys.has(f.key))
          .map(f => ({
            tenant_id: activeTenantId,
            parent_id: null,
            name: f.name,
            node_type: 'system',
            template_id: f.key,
          }));
        
        if (nodesToCreate.length > 0) {
          await supabase.from('storage_nodes').insert(nodesToCreate);
          refetchNodes();
          toast.success('System-Ordner erstellt');
        }
      } catch (err) {
        console.error('Error seeding system nodes:', err);
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

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
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

  // Build tree structure
  const rootNodes = nodes.filter(n => n.parent_id === null);

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
        </div>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-12 gap-4 h-[calc(100vh-16rem)]">
      {/* Left: Folder Tree */}
      <div className="col-span-3 border rounded-lg bg-card">
        <div className="p-3 border-b flex items-center justify-between">
          <span className="font-medium text-sm">Ordner</span>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="h-[calc(100%-3rem)]">
          <div className="p-2 space-y-1">
            {/* All Documents */}
            <button
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-accent ${
                selectedNodeId === null ? 'bg-accent' : ''
              }`}
              onClick={() => setSelectedNodeId(null)}
            >
              <Home className="h-4 w-4 text-primary" />
              <span>Alle Dokumente</span>
            </button>

            {/* Folder Tree */}
            {rootNodes.map(node => {
              const isSelected = selectedNodeId === node.id;
              const isExpanded = expandedNodes.has(node.id);
              const childNodes = nodes.filter(n => n.parent_id === node.id);
              const hasChildren = childNodes.length > 0;

              return (
                <div key={node.id}>
                  <button
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-accent ${
                      isSelected ? 'bg-accent' : ''
                    }`}
                    onClick={() => setSelectedNodeId(node.id)}
                  >
                    {hasChildren ? (
                      <span onClick={(e) => { e.stopPropagation(); toggleNode(node.id); }} className="cursor-pointer">
                        {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                      </span>
                    ) : (
                      <span className="w-3" />
                    )}
                    {getNodeIcon(node, isExpanded)}
                    <span className="flex-1 text-left">{node.name}</span>
                  </button>
                  
                  {isExpanded && childNodes.map(child => (
                    <button
                      key={child.id}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 pl-8 rounded text-sm hover:bg-accent ${
                        selectedNodeId === child.id ? 'bg-accent' : ''
                      }`}
                      onClick={() => setSelectedNodeId(child.id)}
                    >
                      <Folder className="h-4 w-4" />
                      <span>{child.name}</span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </ScrollArea>
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
