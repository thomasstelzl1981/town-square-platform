/**
 * Recursive Folder Tree for DMS Storage
 * Displays all storage nodes with proper nesting
 */
import { useState } from 'react';
import { 
  Folder, FolderOpen, ChevronRight, ChevronDown, Home, Inbox, Archive, 
  Building2, Landmark, AlertCircle, FileQuestion, MoreHorizontal, Image
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

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

interface PropertyInfo {
  id: string;
  code: string | null;
  address: string;
}

interface StorageFolderTreeProps {
  nodes: StorageNode[];
  properties?: PropertyInfo[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onCreateFolder?: () => void;
}

// System folder definitions with icons
const SYSTEM_FOLDER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'inbox': Inbox,
  'immobilien': Building2,
  'finanzierung': Landmark,
  'bonitaetsunterlagen': FileQuestion,
  'needs_review': AlertCircle,
  'archive': Archive,
  'sonstiges': MoreHorizontal,
};

// Property folder icons based on template/name
const PROPERTY_FOLDER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  '11_Fotos': Image,
  'Fotos': Image,
};

function getNodeIcon(node: StorageNode, isOpen: boolean) {
  // System folders
  if (node.node_type === 'system' && node.template_id) {
    const Icon = SYSTEM_FOLDER_ICONS[node.template_id];
    if (Icon) return <Icon className="h-4 w-4" />;
  }
  
  // Property-specific folders (like Fotos)
  const propertyIcon = PROPERTY_FOLDER_ICONS[node.name];
  if (propertyIcon) {
    const Icon = propertyIcon;
    return <Icon className="h-4 w-4" />;
  }
  
  // Property root folders
  if (node.property_id && !node.parent_id) {
    return <Building2 className="h-4 w-4" />;
  }
  
  // Default folder icon
  return isOpen ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />;
}

// Recursive tree node component
function TreeNode({
  node,
  nodes,
  properties,
  selectedNodeId,
  onSelectNode,
  level = 0,
  expandedNodes,
  toggleExpanded,
}: {
  node: StorageNode;
  nodes: StorageNode[];
  properties?: PropertyInfo[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  level: number;
  expandedNodes: Set<string>;
  toggleExpanded: (nodeId: string) => void;
}) {
  const isSelected = selectedNodeId === node.id;
  const isExpanded = expandedNodes.has(node.id);
  
  // Get child nodes
  const childNodes = nodes.filter(n => n.parent_id === node.id);
  
  // For "Immobilien" system folder, also get property root nodes
  const isImmobilienFolder = node.node_type === 'system' && node.template_id === 'immobilien';
  const propertyRootNodes = isImmobilienFolder 
    ? nodes.filter(n => n.property_id && !n.parent_id && n.node_type !== 'system')
    : [];
  
  const allChildren = [...childNodes, ...propertyRootNodes];
  const hasChildren = allChildren.length > 0;
  
  // Get property info for display
  const getPropertyLabel = (n: StorageNode) => {
    if (n.property_id && properties) {
      const prop = properties.find(p => p.id === n.property_id);
      if (prop) {
        return `${prop.code || ''} - ${prop.address}`.trim();
      }
    }
    return n.name;
  };

  return (
    <div>
      <button
        className={cn(
          'w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-accent transition-colors',
          isSelected && 'bg-accent',
        )}
        style={{ paddingLeft: `${8 + level * 16}px` }}
        onClick={() => onSelectNode(node.id)}
      >
        {hasChildren ? (
          <span 
            onClick={(e) => { e.stopPropagation(); toggleExpanded(node.id); }} 
            className="cursor-pointer hover:text-primary"
          >
            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </span>
        ) : (
          <span className="w-3" />
        )}
        {getNodeIcon(node, isExpanded)}
        <span className="flex-1 text-left truncate">
          {node.property_id ? getPropertyLabel(node) : node.name}
        </span>
      </button>
      
      {/* Render children recursively */}
      {isExpanded && allChildren.map(child => (
        <TreeNode
          key={child.id}
          node={child}
          nodes={nodes}
          properties={properties}
          selectedNodeId={selectedNodeId}
          onSelectNode={onSelectNode}
          level={level + 1}
          expandedNodes={expandedNodes}
          toggleExpanded={toggleExpanded}
        />
      ))}
    </div>
  );
}

export function StorageFolderTree({
  nodes,
  properties = [],
  selectedNodeId,
  onSelectNode,
  onCreateFolder,
}: StorageFolderTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  
  const toggleExpanded = (nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };
  
  // Get only root-level system nodes (no parent_id and type 'system')
  const rootNodes = nodes.filter(n => n.parent_id === null && n.node_type === 'system');
  
  // Sort: system folders first, then by name
  const sortedRootNodes = [...rootNodes].sort((a, b) => {
    // Inbox first
    if (a.template_id === 'inbox') return -1;
    if (b.template_id === 'inbox') return 1;
    // Then by name
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="border rounded-lg bg-card h-full flex flex-col">
      <div className="p-3 border-b flex items-center justify-between">
        <span className="font-medium text-sm">Ordner</span>
        {onCreateFolder && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCreateFolder}>
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {/* All Documents */}
          <button
            className={cn(
              'w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-accent transition-colors',
              selectedNodeId === null && 'bg-accent',
            )}
            onClick={() => onSelectNode(null)}
          >
            <span className="w-3" />
            <Home className="h-4 w-4 text-primary" />
            <span>Alle Dokumente</span>
          </button>

          {/* Recursive Folder Tree */}
          {sortedRootNodes.map(node => (
            <TreeNode
              key={node.id}
              node={node}
              nodes={nodes}
              properties={properties}
              selectedNodeId={selectedNodeId}
              onSelectNode={onSelectNode}
              level={0}
              expandedNodes={expandedNodes}
              toggleExpanded={toggleExpanded}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
