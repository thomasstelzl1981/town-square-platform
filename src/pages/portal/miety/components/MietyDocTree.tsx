/**
 * MietyDocTree — Simple document tree for the home dossier
 */
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronRight, ChevronDown, Folder, FolderOpen, File } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TreeNode {
  id: string;
  name: string;
  parent_id: string | null;
  node_type: string;
  module_code: string | null;
}

interface MietyDocTreeProps {
  homeId: string;
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
}

export function MietyDocTree({ homeId, selectedFolderId, onSelectFolder }: MietyDocTreeProps) {
  const { activeTenantId } = useAuth();
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const { data: nodes = [] } = useQuery({
    queryKey: ['miety-storage-nodes', activeTenantId],
    queryFn: async (): Promise<TreeNode[]> => {
      if (!activeTenantId) return [];
      const { data, error } = await supabase
        .from('storage_nodes')
        .select('id, name, parent_id, node_type, module_code')
        .eq('tenant_id', activeTenantId)
        .order('name');
      if (error) throw error;
      return (data || []) as unknown as TreeNode[];
    },
    enabled: !!activeTenantId,
  });

  // Find MOD_20 root
  const mod20Root = nodes.find(n => n.module_code === 'MOD_20' && !n.parent_id);
  
  // Expand MOD_20 root by default
  useEffect(() => {
    if (mod20Root && !expandedIds.has(mod20Root.id)) {
      setExpandedIds(prev => new Set([...prev, mod20Root.id]));
    }
  }, [mod20Root?.id]);

  function getChildren(parentId: string) {
    return nodes.filter(n => n.parent_id === parentId);
  }

  function toggleExpand(id: string) {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function renderNode(node: TreeNode, depth: number) {
    const children = getChildren(node.id);
    const isFolder = node.node_type === 'folder';
    const isExpanded = expandedIds.has(node.id);
    const isSelected = selectedFolderId === node.id;

    return (
      <div key={node.id}>
        <button
          onClick={() => {
            if (isFolder) {
              toggleExpand(node.id);
              onSelectFolder(node.id);
            }
          }}
          className={cn(
            'flex items-center gap-1.5 w-full text-left py-1 px-2 rounded text-sm hover:bg-muted/50 transition-colors',
            isSelected && 'bg-primary/10 text-primary font-medium',
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {isFolder && children.length > 0 ? (
            isExpanded ? <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" />
          ) : (
            <span className="w-3.5" />
          )}
          {isFolder ? (
            isExpanded ? <FolderOpen className="h-4 w-4 text-primary/70 flex-shrink-0" /> : <Folder className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          ) : (
            <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          )}
          <span className="truncate">{node.name}</span>
        </button>
        {isExpanded && children.map(c => renderNode(c, depth + 1))}
      </div>
    );
  }

  if (!mod20Root) {
    return (
      <div className="p-4 text-sm text-muted-foreground text-center">
        Kein DMS-Ordner vorhanden
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="py-2">
        {renderNode(mod20Root, 0)}
      </div>
    </ScrollArea>
  );
}
