import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileUploader } from '@/components/shared/FileUploader';
import { EmptyDocuments } from '@/components/shared/EmptyState';
import { Loader2, Folder, FolderOpen, FileText, Upload, Download, Trash2, ChevronRight, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { useUniversalUpload } from '@/hooks/useUniversalUpload';

interface StorageNode {
  id: string;
  name: string;
  node_type: string;
  parent_id: string | null;
  property_id: string | null;
  unit_id: string | null;
  auto_created: boolean;
  children?: StorageNode[];
}

interface Document {
  id: string;
  name: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
  file_path: string;
}

interface DocumentLink {
  id: string;
  document_id: string;
  node_id: string | null;
  documents: Document;
}

interface DatenraumTabProps {
  propertyId: string;
  tenantId: string;
  propertyCode?: string; // Akten-ID (e.g., IMM-2026-00001) for structured storage paths
}

export function DatenraumTab({ propertyId, tenantId, propertyCode }: DatenraumTabProps) {
  const { activeOrganization } = useAuth();
  const queryClient = useQueryClient();
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [isUploading, setIsUploading] = useState(false);

  // Fetch folder structure for this property
  const { data: nodes, isLoading: nodesLoading } = useQuery({
    queryKey: ['storage-nodes', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('storage_nodes')
        .select('*')
        .eq('property_id', propertyId)
        .eq('tenant_id', tenantId)
        .order('name');
      
      if (error) throw error;
      return data as StorageNode[];
    },
    enabled: !!propertyId && !!tenantId,
  });

  // Fetch documents linked to this property
  const { data: documentLinks, isLoading: docsLoading } = useQuery({
    queryKey: ['document-links', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_links')
        .select(`
          id,
          document_id,
          node_id,
          documents (id, name, mime_type, size_bytes, created_at, file_path)
        `)
        .eq('object_id', propertyId)
        .eq('object_type', 'property')
        .eq('tenant_id', tenantId);
      
      if (error) throw error;
      return data as DocumentLink[];
    },
    enabled: !!propertyId && !!tenantId,
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
      } else if (!node.parent_id || !nodes.find(n => n.id === node.parent_id)) {
        roots.push(current);
      }
    });

    return roots;
  }, []);

  const tree = nodes ? buildTree(nodes) : [];

  // Get documents for selected folder
  const selectedDocuments = documentLinks?.filter(link => 
    selectedNodeId ? link.node_id === selectedNodeId : !link.node_id
  ).map(link => link.documents) || [];

  // Toggle folder expansion
  const toggleExpand = (nodeId: string) => {
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

  // Universal upload hook (direct to storage, no Edge Function roundtrip)
  const { upload: universalUpload } = useUniversalUpload();

  // Handle file upload
  const handleUpload = async (files: File[]) => {
    if (!activeOrganization) return;
    
    setIsUploading(true);
    let successCount = 0;

    for (const file of files) {
      try {
        const result = await universalUpload(file, {
          moduleCode: 'MOD_04',
          entityId: propertyId,
          objectType: 'property',
          objectId: propertyId,
          parentNodeId: selectedNodeId || undefined,
          source: 'datenraum',
        });

        if (result.error) throw new Error(result.error);
        successCount++;
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Fehler beim Upload von ${file.name}`);
      }
    }

    setIsUploading(false);
    
    if (successCount > 0) {
      toast.success(`${successCount} Datei(en) hochgeladen`);
      queryClient.invalidateQueries({ queryKey: ['document-links', propertyId] });
      queryClient.invalidateQueries({ queryKey: ['storage-nodes', propertyId] });
    }
  };

  // Handle document download
  const handleDownload = async (doc: Document) => {
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
          body: JSON.stringify({ document_id: doc.id }),
        }
      );

      if (!response.ok) throw new Error('Download URL konnte nicht erstellt werden');

      const { download_url } = await response.json();
      window.open(download_url, '_blank');
    } catch (error) {
      toast.error('Download fehlgeschlagen');
    }
  };

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Render folder tree node
  const renderNode = (node: StorageNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNodeId === node.id;
    const hasChildren = node.children && node.children.length > 0;
    const docCount = documentLinks?.filter(l => l.node_id === node.id).length || 0;

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-1 py-1.5 px-2 rounded cursor-pointer hover:bg-muted/50 ${
            isSelected ? 'bg-primary/10 text-primary' : ''
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => {
            setSelectedNodeId(node.id);
            if (hasChildren) toggleExpand(node.id);
          }}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0" />
            )
          ) : (
            <span className="w-4" />
          )}
          {isExpanded ? (
            <FolderOpen className="h-4 w-4 shrink-0 text-primary" />
          ) : (
            <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
          )}
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

  if (nodesLoading || docsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-[280px_1fr] gap-6">
      {/* Folder Tree */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Ordner</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[400px]">
            <div className="p-2">
              {/* Root level (all documents) */}
              <div
                className={`flex items-center gap-2 py-1.5 px-2 rounded cursor-pointer hover:bg-muted/50 ${
                  selectedNodeId === null ? 'bg-primary/10 text-primary' : ''
                }`}
                onClick={() => setSelectedNodeId(null)}
              >
                <Folder className="h-4 w-4 shrink-0" />
                <span className="text-sm">Alle Dokumente</span>
                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded ml-auto">
                  {documentLinks?.length || 0}
                </span>
              </div>
              
              {/* Folder tree */}
              {tree.map(node => renderNode(node))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Documents List + Upload Zone */}
      <div className="space-y-4">
        {/* Upload Zone */}
        <Card>
          <CardContent className="p-4">
            <FileUploader
              onFilesSelected={handleUpload}
              accept="*/*"
              multiple
              disabled={isUploading}
            >
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
                {isUploading ? (
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Wird hochgeladen...</span>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Dateien hier ablegen oder klicken zum Auswählen
                    </p>
                    {selectedNodeId && nodes?.find(n => n.id === selectedNodeId) && (
                      <p className="text-xs text-primary mt-1">
                        Zielordner: {nodes.find(n => n.id === selectedNodeId)?.name}
                      </p>
                    )}
                  </>
                )}
              </div>
            </FileUploader>
          </CardContent>
        </Card>

        {/* Documents Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {selectedNodeId 
                ? `Dokumente in "${nodes?.find(n => n.id === selectedNodeId)?.name || 'Ordner'}"`
                : 'Alle Dokumente'
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDocuments.length === 0 ? (
              <EmptyDocuments />
            ) : (
              <div className="space-y-2">
                {selectedDocuments.map(doc => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50"
                  >
                    <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatSize(doc.size_bytes)} • {format(new Date(doc.created_at), 'dd.MM.yyyy', { locale: de })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(doc)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
