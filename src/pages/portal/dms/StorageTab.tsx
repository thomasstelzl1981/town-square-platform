import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DataTable, FileUploader, DetailDrawer, EmptyState, type Column } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Folder, FolderOpen, File, Plus, Download, Trash2, Eye, 
  ChevronRight, ChevronDown, Inbox, Home, Building2, Users 
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface StorageNode {
  id: string;
  name: string;
  node_type: string;
  parent_id: string | null;
  property_id: string | null;
  unit_id: string | null;
  auto_created: boolean;
  sort_index: number;
  children?: StorageNode[];
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
  documents: Document;
}

export function StorageTab() {
  const { activeTenantId } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  // Fetch storage_nodes for folder tree
  const { data: nodes = [], isLoading: nodesLoading } = useQuery({
    queryKey: ['storage-nodes', activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('storage_nodes')
        .select('*')
        .eq('tenant_id', activeTenantId)
        .order('sort_index');
      
      if (error) throw error;
      return data as StorageNode[];
    },
    enabled: !!activeTenantId,
  });

  // Fetch document_links with documents for selected node
  const { data: documentLinks = [], isLoading: docsLoading } = useQuery({
    queryKey: ['document-links-by-node', activeTenantId, selectedNodeId],
    queryFn: async () => {
      if (!activeTenantId) return [];
      
      let query = supabase
        .from('document_links')
        .select(`
          id,
          document_id,
          node_id,
          documents (id, public_id, name, file_path, mime_type, size_bytes, created_at, uploaded_by)
        `)
        .eq('tenant_id', activeTenantId);
      
      // Filter by selected node (null = all/unassigned)
      if (selectedNodeId) {
        query = query.eq('node_id', selectedNodeId);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return (data || []).filter(link => link.documents) as DocumentLink[];
    },
    enabled: !!activeTenantId,
  });

  // Build tree structure
  const buildTree = useCallback((nodes: StorageNode[]): StorageNode[] => {
    const nodeMap = new Map<string, StorageNode>();
    const roots: StorageNode[] = [];

    nodes.forEach(node => {
      nodeMap.set(node.id, { ...node, children: [] });
    });

    nodes.forEach(node => {
      const current = nodeMap.get(node.id)!;
      if (node.parent_id && nodeMap.has(node.parent_id)) {
        nodeMap.get(node.parent_id)!.children!.push(current);
      } else if (!node.parent_id) {
        roots.push(current);
      }
    });

    // Sort children by sort_index
    const sortChildren = (node: StorageNode) => {
      if (node.children) {
        node.children.sort((a, b) => (a.sort_index || 0) - (b.sort_index || 0));
        node.children.forEach(sortChildren);
      }
    };
    roots.forEach(sortChildren);
    roots.sort((a, b) => (a.sort_index || 0) - (b.sort_index || 0));

    return roots;
  }, []);

  const tree = buildTree(nodes);

  // Get documents for current view
  const documents = documentLinks.map(link => link.documents);

  // Toggle folder expansion
  const toggleExpand = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  // Find inbox node for uploads (by name since node_type constraint only allows 'folder')
  const findInboxNode = (): StorageNode | undefined => {
    return nodes.find(n => n.name.toLowerCase() === 'posteingang' || n.name.toLowerCase() === 'inbox');
  };

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('sot-dms-upload-url', {
        body: {
          filename: file.name,
          mime_type: file.type,
          size_bytes: file.size,
          folder: 'dms',
        },
      });

      if (response.error) throw response.error;
      const { upload_url, document_id } = response.data;

      // Upload file
      const uploadResponse = await fetch(upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadResponse.ok) throw new Error('Upload failed');

      // Create document_link with inbox node or selected node
      const targetNodeId = selectedNodeId || findInboxNode()?.id || null;
      
      await supabase.from('document_links').insert({
        tenant_id: activeTenantId,
        document_id: document_id,
        node_id: targetNodeId,
      });

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-links-by-node'] });
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
      queryClient.invalidateQueries({ queryKey: ['document-links-by-node'] });
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

  // Get icon for node type (check by name since node_type is constrained to 'folder')
  const getNodeIcon = (node: StorageNode, isExpanded: boolean) => {
    const nameLower = node.name.toLowerCase();
    if (nameLower === 'posteingang' || nameLower === 'inbox') return <Inbox className="h-4 w-4 text-primary" />;
    if (node.property_id) return <Building2 className="h-4 w-4 text-primary" />;
    if (nameLower.includes('bonität') || nameLower.includes('kunde')) return <Users className="h-4 w-4 text-primary" />;
    return isExpanded ? <FolderOpen className="h-4 w-4 text-primary" /> : <Folder className="h-4 w-4 text-muted-foreground" />;
  };

  // Render folder tree node
  const renderNode = (node: StorageNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNodeId === node.id;
    const hasChildren = node.children && node.children.length > 0;
    
    // Count documents in this node
    const docCount = documentLinks.filter(l => l.node_id === node.id).length;

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-1 py-1.5 px-2 rounded cursor-pointer hover:bg-muted/50 ${
            isSelected ? 'bg-primary/10 text-primary' : ''
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => setSelectedNodeId(node.id)}
        >
          {hasChildren ? (
            <button 
              onClick={(e) => toggleExpand(node.id, e)}
              className="p-0.5 hover:bg-muted rounded"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 shrink-0" />
              )}
            </button>
          ) : (
            <span className="w-5" />
          )}
          {getNodeIcon(node, isExpanded)}
          <span className="text-sm truncate flex-1">{node.name}</span>
          {docCount > 0 && (
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              {docCount}
            </span>
          )}
        </div>
        {isExpanded && node.children?.map(child => renderNode(child, level + 1))}
      </div>
    );
  };

  const columns: Column<Document>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (_, doc) => (
        <div className="flex items-center gap-2">
          <File className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{doc.name}</span>
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

  const isLoading = nodesLoading || docsLoading;

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
          <div className="p-2">
            {/* Root: All Documents */}
            <div
              className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-muted/50 ${
                selectedNodeId === null ? 'bg-primary/10 text-primary' : ''
              }`}
              onClick={() => setSelectedNodeId(null)}
            >
              <Home className="h-4 w-4" />
              <span className="text-sm">Alle Dokumente</span>
              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded ml-auto">
                {documentLinks.length}
              </span>
            </div>
            
            {/* Tree */}
            {tree.length > 0 ? (
              tree.map(node => renderNode(node))
            ) : (
              <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                Keine Ordner vorhanden
              </div>
            )}
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
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
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
              title={selectedNodeId ? "Keine Dokumente in diesem Ordner" : "Keine Dokumente"}
              description="Laden Sie Ihr erstes Dokument hoch"
            />
          ) : (
            <DataTable
              data={documents}
              columns={columns}
              isLoading={isLoading}
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
            <div className="flex gap-2 pt-4">
              <Button className="flex-1" onClick={() => downloadMutation.mutate(selectedDocument.id)} disabled={downloadMutation.isPending}>
                <Download className="h-4 w-4 mr-2" />
                Herunterladen
              </Button>
              <Button variant="destructive" size="icon" onClick={() => deleteMutation.mutate(selectedDocument.id)} disabled={deleteMutation.isPending}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
