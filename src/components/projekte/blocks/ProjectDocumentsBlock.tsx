/**
 * Project Documents Block (Block F)
 * DMS Integration for Project Documents
 * MOD-13 PROJEKTE
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, Folder, ChevronRight, ChevronDown, 
  Upload, File, Image, FileSpreadsheet, FolderOpen,
  ExternalLink
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import type { DevProject } from '@/types/projekte';

interface StorageNode {
  id: string;
  parent_id: string | null;
  name: string;
  node_type: 'folder' | 'file';
  size_bytes: number | null;
  mime_type: string | null;
  dev_project_id: string | null;
  dev_project_unit_id: string | null;
}

interface TreeNode extends StorageNode {
  children: TreeNode[];
}

interface ProjectDocumentsBlockProps {
  project: DevProject;
}

function buildTree(nodes: StorageNode[], parentId: string | null = null): TreeNode[] {
  return nodes
    .filter(n => n.parent_id === parentId)
    .map(n => ({
      ...n,
      children: buildTree(nodes, n.id),
    }))
    .sort((a, b) => {
      // Folders first, then alphabetically
      if (a.node_type !== b.node_type) {
        return a.node_type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
}

function getFileIcon(mimeType: string | null): React.ComponentType<{ className?: string }> {
  if (!mimeType) return File;
  if (mimeType.startsWith('image/')) return Image;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileSpreadsheet;
  if (mimeType.includes('pdf')) return FileText;
  return File;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function TreeNodeItem({ node, level = 0 }: { node: TreeNode; level?: number }) {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const FileIcon = getFileIcon(node.mime_type);

  const isFolder = node.node_type === 'folder';
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 cursor-pointer text-sm",
          level === 0 && "font-medium"
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => isFolder && setIsExpanded(!isExpanded)}
      >
        {isFolder ? (
          <>
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )
            ) : (
              <span className="w-4" />
            )}
            {isExpanded ? (
              <FolderOpen className="h-4 w-4 text-yellow-600" />
            ) : (
              <Folder className="h-4 w-4 text-yellow-600" />
            )}
          </>
        ) : (
          <>
            <span className="w-4" />
            <FileIcon className="h-4 w-4 text-blue-600" />
          </>
        )}
        <span className="flex-1 truncate">{node.name}</span>
        {!isFolder && node.size_bytes && (
          <span className="text-xs text-muted-foreground">
            {formatFileSize(node.size_bytes)}
          </span>
        )}
        {isFolder && hasChildren && (
          <Badge variant="secondary" className="text-xs">
            {node.children.length}
          </Badge>
        )}
      </div>
      {isFolder && isExpanded && hasChildren && (
        <div>
          {node.children.map((child) => (
            <TreeNodeItem key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ProjectDocumentsBlock({ project }: ProjectDocumentsBlockProps) {
  // Fetch storage nodes for this project
  const { data: nodes = [], isLoading } = useQuery({
    queryKey: ['project-storage-nodes', project.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('storage_nodes')
        .select('id, parent_id, name, node_type, size_bytes, mime_type, dev_project_id, dev_project_unit_id')
        .eq('dev_project_id', project.id)
        .order('name');
      
      if (error) throw error;
      return data as unknown as StorageNode[];
    },
    enabled: !!project.id,
  });

  // Build tree structure
  const rootNodes = nodes.filter(n => 
    n.parent_id === null || 
    !nodes.some(parent => parent.id === n.parent_id)
  );
  
  const tree = buildTree(nodes, rootNodes[0]?.parent_id || null);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <CardTitle>F. Dokumente</CardTitle>
          <Badge variant="secondary">{nodes.filter(n => n.node_type === 'file').length} Dateien</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <ExternalLink className="h-4 w-4 mr-1" />
            Im DMS öffnen
          </Button>
          <Button size="sm">
            <Upload className="h-4 w-4 mr-1" />
            Hochladen
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Lade Dokumentenstruktur...
          </div>
        ) : tree.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Keine DMS-Struktur gefunden</p>
            <p className="text-sm">Die Ordnerstruktur wird bei Projektanlage automatisch erstellt.</p>
          </div>
        ) : (
          <div className="border rounded-lg p-2 max-h-[400px] overflow-auto">
            {tree.map((node) => (
              <TreeNodeItem key={node.id} node={node} />
            ))}
          </div>
        )}

        {/* DMS Structure Info */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
          <p className="font-medium mb-1">Ordnerstruktur:</p>
          <code className="text-xs">
            /{project.project_code}/Allgemein/ (Exposé, Grundbuch, ...)
            <br />
            /{project.project_code}/Einheiten/WE-XXX/ (Grundriss, Mietvertrag, Kaufvertrag)
          </code>
        </div>
      </CardContent>
    </Card>
  );
}
