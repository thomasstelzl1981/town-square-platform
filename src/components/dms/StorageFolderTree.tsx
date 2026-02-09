/**
 * Recursive Folder Tree for DMS Storage — OneDrive Style
 * Uses STORAGE_MANIFEST as SSOT for all 20 modules with numbering
 */
import { useState } from 'react';
import {
  Folder, FolderOpen, ChevronRight, ChevronDown, Home, Inbox, Archive,
  Building2, Landmark, AlertCircle, FileQuestion, Image, MoreHorizontal,
  Car, ShoppingCart, Hammer, FolderHeart, Trash2, Sparkles, TrendingUp,
  FolderKanban, BookOpen, Users, UserCheck, Lightbulb, GraduationCap,
  Wrench, BarChart3, Sun, HomeIcon, Database,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSortedModules, getModuleDisplayName } from '@/config/storageManifest';

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

// Icons per module code
const MODULE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  MOD_01: Database,
  MOD_02: Sparkles,
  MOD_03: FolderOpen,
  MOD_04: Building2,
  MOD_05: FileQuestion,
  MOD_06: ShoppingCart,
  MOD_07: Landmark,
  MOD_08: TrendingUp,
  MOD_09: Users,
  MOD_10: UserCheck,
  MOD_11: Lightbulb,
  MOD_12: FolderKanban,
  MOD_13: BookOpen,
  MOD_14: MoreHorizontal,
  MOD_15: GraduationCap,
  MOD_16: Wrench,
  MOD_17: Car,
  MOD_18: BarChart3,
  MOD_19: Sun,
  MOD_20: HomeIcon,
};

const SYSTEM_FOLDER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  inbox: Inbox,
  user_files: FolderHeart,
  archive: Archive,
  needs_review: AlertCircle,
  sonstiges: MoreHorizontal,
  TRASH_ROOT: Trash2,
};

const PROPERTY_FOLDER_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  '11_Fotos': Image,
  Fotos: Image,
};

function getNodeIcon(node: StorageNode, isOpen: boolean) {
  // Module root — use module icon
  if (node.template_id?.endsWith('_ROOT') && node.module_code && MODULE_ICONS[node.module_code]) {
    const Icon = MODULE_ICONS[node.module_code];
    return <Icon className="h-4 w-4 text-primary" />;
  }
  // Trash
  if (node.template_id === 'TRASH_ROOT') return <Trash2 className="h-4 w-4 text-muted-foreground" />;
  // System folders
  if (node.node_type === 'system' && node.template_id && SYSTEM_FOLDER_ICONS[node.template_id]) {
    const Icon = SYSTEM_FOLDER_ICONS[node.template_id];
    return <Icon className="h-4 w-4" />;
  }
  // Property-specific
  if (PROPERTY_FOLDER_ICONS[node.name]) {
    const Icon = PROPERTY_FOLDER_ICONS[node.name];
    return <Icon className="h-4 w-4" />;
  }
  if (node.template_id === 'PROPERTY_DOSSIER_V1') return <Building2 className="h-4 w-4" />;
  if (node.template_id === 'VEHICLE_DOSSIER_V1') return <Car className="h-4 w-4" />;
  if (node.template_id === 'LISTING_DOSSIER_V1') return <ShoppingCart className="h-4 w-4" />;
  return isOpen ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />;
}

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
  displayLabel,
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
  displayLabel?: string;
}) {
  const isSelected = selectedNodeId === node.id;
  const isExpanded = expandedNodes.has(node.id);
  const childNodes = nodes.filter(n => n.parent_id === node.id);
  const hasChildren = childNodes.length > 0;
  const isSystemFolder = node.node_type === 'system' || node.template_id?.endsWith('_ROOT');
  const canDelete = !isSystemFolder && !hasChildren && onDeleteFolder;

  const getLabel = (n: StorageNode) => {
    if (n.property_id && properties) {
      const prop = properties.find(p => p.id === n.property_id);
      if (prop && n.template_id === 'PROPERTY_DOSSIER_V1') {
        return `${prop.code || ''} - ${prop.address}`.trim();
      }
    }
    return n.name;
  };

  const sortedChildren = [...childNodes].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="group/node">
      <div
        className={cn(
          'w-full flex items-center gap-1.5 px-2 py-1 rounded text-sm hover:bg-accent transition-colors cursor-pointer',
          isSelected && 'bg-accent font-medium',
        )}
        style={{ paddingLeft: `${8 + level * 14}px` }}
        onClick={() => onSelectNode(node.id)}
      >
        {hasChildren ? (
          <span
            onClick={(e) => { e.stopPropagation(); toggleExpanded(node.id); }}
            className="cursor-pointer hover:text-primary shrink-0"
          >
            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </span>
        ) : (
          <span className="w-3 shrink-0" />
        )}
        {getNodeIcon(node, isExpanded)}
        <span className="flex-1 text-left truncate text-xs">
          {displayLabel || getLabel(node)}
        </span>
        {canDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`Ordner "${node.name}" wirklich löschen?`)) onDeleteFolder(node.id);
            }}
            className="opacity-0 group-hover/node:opacity-100 p-0.5 rounded hover:bg-destructive/10 text-destructive transition-opacity shrink-0"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
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

  const rootNodes = nodes.filter(n => n.parent_id === null);

  // Categorize roots
  const systemTop = rootNodes.filter(n => n.template_id === 'inbox' || n.template_id === 'user_files');
  const systemBottom = rootNodes.filter(n =>
    n.template_id === 'needs_review' ||
    n.template_id === 'archive' ||
    n.template_id === 'sonstiges' ||
    n.template_id === 'TRASH_ROOT'
  );

  // Module roots — ordered by STORAGE_MANIFEST display_order
  const sortedModules = getSortedModules();
  const moduleRoots = sortedModules
    .map(cfg => rootNodes.find(n => n.template_id === cfg.root_template_id))
    .filter(Boolean) as StorageNode[];

  // Sort system top: inbox first, user_files second
  systemTop.sort((a, b) => {
    if (a.template_id === 'inbox') return -1;
    if (b.template_id === 'inbox') return 1;
    return 0;
  });

  // Sort system bottom: needs_review, archive, sonstiges, trash
  const bottomOrder = ['needs_review', 'archive', 'sonstiges', 'TRASH_ROOT'];
  systemBottom.sort((a, b) => {
    return (bottomOrder.indexOf(a.template_id || '') - bottomOrder.indexOf(b.template_id || ''));
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
        <div className="p-2 space-y-0.5">
          {/* All Documents */}
          <button
            className={cn(
              'w-full flex items-center gap-1.5 px-2 py-1 rounded text-sm hover:bg-accent transition-colors',
              selectedNodeId === null && 'bg-accent font-medium',
            )}
            onClick={() => onSelectNode(null)}
          >
            <span className="w-3" />
            <Home className="h-4 w-4 text-primary" />
            <span className="text-xs">Alle Dokumente</span>
          </button>

          {/* System top: Posteingang, Eigene Dateien */}
          {systemTop.map(node => (
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

          {/* Separator */}
          {moduleRoots.length > 0 && <Separator className="my-1.5" />}

          {/* Module roots with numbering */}
          {moduleRoots.map(node => (
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
              displayLabel={node.module_code ? getModuleDisplayName(node.module_code) : node.name}
            />
          ))}

          {/* Separator */}
          {systemBottom.length > 0 && <Separator className="my-1.5" />}

          {/* System bottom: Zur Prüfung, Archiv, Sonstiges, Papierkorb */}
          {systemBottom.map(node => (
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
