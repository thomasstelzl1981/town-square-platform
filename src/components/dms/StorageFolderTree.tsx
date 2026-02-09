/**
 * Recursive Folder Tree for DMS Storage
 * Displays all storage nodes with proper module-based hierarchy
 */
import { useState } from 'react';
import { 
  Folder, FolderOpen, ChevronRight, ChevronDown, Home, Inbox, Archive, 
  Building2, Landmark, AlertCircle, FileQuestion, MoreHorizontal, Image,
  Car, ShoppingCart, Hammer, FolderHeart, Trash2
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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

interface StorageFolderTreeProps {
  nodes: StorageNode[];
  properties?: PropertyInfo[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onCreateFolder?: () => void;
  onDeleteFolder?: (nodeId: string) => void;
}

// Icons for system folders
const SYSTEM_FOLDER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'inbox': Inbox,
  'user_files': FolderHeart,
  'archive': Archive,
  'needs_review': AlertCircle,
  'sonstiges': MoreHorizontal,
};

// Icons for module root folders
const MODULE_ROOT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'MOD_04_ROOT': Building2,      // Immobilien
  'MOD_06_ROOT': ShoppingCart,   // Verkauf
  'MOD_07_ROOT': Landmark,       // Finanzierung
  'MOD_16_ROOT': Hammer,         // Sanierung
  'MOD_17_ROOT': Car,            // Car-Management
};

// Legacy system folder icons (for backwards compatibility)
const LEGACY_SYSTEM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'immobilien': Building2,
  'finanzierung': Landmark,
  'bonitaetsunterlagen': FileQuestion,
};

// Property folder icons based on template/name
const PROPERTY_FOLDER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  '11_Fotos': Image,
  'Fotos': Image,
};

function getNodeIcon(node: StorageNode, isOpen: boolean) {
  // Module root folders
  if (node.template_id && MODULE_ROOT_ICONS[node.template_id]) {
    const Icon = MODULE_ROOT_ICONS[node.template_id];
    return <Icon className="h-4 w-4 text-primary" />;
  }
  
  // System folders
  if (node.node_type === 'system' && node.template_id) {
    const Icon = SYSTEM_FOLDER_ICONS[node.template_id] || LEGACY_SYSTEM_ICONS[node.template_id];
    if (Icon) return <Icon className="h-4 w-4" />;
  }
  
  // Property-specific folders (like Fotos)
  const propertyIcon = PROPERTY_FOLDER_ICONS[node.name];
  if (propertyIcon) {
    const Icon = propertyIcon;
    return <Icon className="h-4 w-4" />;
  }
  
  // Property dossier folders
  if (node.template_id === 'PROPERTY_DOSSIER_V1') {
    return <Building2 className="h-4 w-4" />;
  }
  
  // Vehicle dossier folders
  if (node.template_id === 'VEHICLE_DOSSIER_V1') {
    return <Car className="h-4 w-4" />;
  }
  
  // Listing dossier folders
  if (node.template_id === 'LISTING_DOSSIER_V1') {
    return <ShoppingCart className="h-4 w-4" />;
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
  onDeleteFolder,
  level = 0,
  expandedNodes,
  toggleExpanded,
}: {
  node: StorageNode;
  nodes: StorageNode[];
  properties?: PropertyInfo[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onDeleteFolder?: (nodeId: string) => void;
  level: number;
  expandedNodes: Set<string>;
  toggleExpanded: (nodeId: string) => void;
}) {
  const isSelected = selectedNodeId === node.id;
  const isExpanded = expandedNodes.has(node.id);
  
  // Get child nodes - simply all nodes with this node as parent
  const childNodes = nodes.filter(n => n.parent_id === node.id);
  const hasChildren = childNodes.length > 0;
  
  // Check if folder is deletable (not system, not module root, no children)
  const isSystemFolder = node.node_type === 'system' || node.template_id?.endsWith('_ROOT');
  const canDelete = !isSystemFolder && !hasChildren && onDeleteFolder;
  
  // Get display label
  const getDisplayLabel = (n: StorageNode) => {
    // For property dossiers, show property info if available
    if (n.property_id && properties) {
      const prop = properties.find(p => p.id === n.property_id);
      if (prop && n.template_id === 'PROPERTY_DOSSIER_V1') {
        return `${prop.code || ''} - ${prop.address}`.trim();
      }
    }
    return n.name;
  };
  
  // Sort children: system folders first, then by name
  const sortedChildren = [...childNodes].sort((a, b) => {
    // Module roots and system folders first
    if (a.node_type === 'system' && b.node_type !== 'system') return -1;
    if (a.node_type !== 'system' && b.node_type === 'system') return 1;
    if (a.template_id?.endsWith('_ROOT') && !b.template_id?.endsWith('_ROOT')) return -1;
    if (!a.template_id?.endsWith('_ROOT') && b.template_id?.endsWith('_ROOT')) return 1;
    // Then by name
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="group">
      <div
        className={cn(
          'w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-accent transition-colors cursor-pointer',
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
          {getDisplayLabel(node)}
        </span>
        
        {/* Delete button - only for non-system folders without children */}
        {canDelete && (
          <button
            onClick={(e) => { 
              e.stopPropagation(); 
              if (confirm(`Ordner "${node.name}" wirklich löschen?`)) {
                onDeleteFolder(node.id);
              }
            }}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-destructive transition-opacity"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
      
      {/* Render children recursively */}
      {isExpanded && sortedChildren.map(child => (
        <TreeNode
          key={child.id}
          node={child}
          nodes={nodes}
          properties={properties}
          selectedNodeId={selectedNodeId}
          onSelectNode={onSelectNode}
          onDeleteFolder={onDeleteFolder}
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
  onDeleteFolder,
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
  
  // Get root-level nodes: only those with parent_id = null
  // These include system folders and module roots
  const rootNodes = nodes.filter(n => n.parent_id === null);
  
  // Sort roots: Inbox first, then system folders, then module roots, then alphabetically
  const sortedRootNodes = [...rootNodes].sort((a, b) => {
    // Inbox always first
    if (a.template_id === 'inbox') return -1;
    if (b.template_id === 'inbox') return 1;
    
    // User files second
    if (a.template_id === 'user_files') return -1;
    if (b.template_id === 'user_files') return 1;
    
    // Module roots grouped together
    const aIsModuleRoot = a.template_id?.endsWith('_ROOT');
    const bIsModuleRoot = b.template_id?.endsWith('_ROOT');
    if (aIsModuleRoot && !bIsModuleRoot) return -1;
    if (!aIsModuleRoot && bIsModuleRoot) return 1;
    
    // Archive and Sonstiges last
    if (a.template_id === 'archive') return 1;
    if (b.template_id === 'archive') return -1;
    if (a.template_id === 'sonstiges') return 1;
    if (b.template_id === 'sonstiges') return -1;
    
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
              onDeleteFolder={onDeleteFolder}
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
