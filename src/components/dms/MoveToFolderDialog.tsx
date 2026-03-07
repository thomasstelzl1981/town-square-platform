/**
 * MoveToFolderDialog — Folder tree picker for moving files/folders
 * Reuses the recursive tree pattern from StorageFolderTree.
 */
import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Folder, FolderOpen, ChevronRight, ChevronDown, FolderInput } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getModuleDisplayName } from '@/config/storageManifest';

interface FolderNode {
  id: string;
  parent_id: string | null;
  name: string;
  template_id: string | null;
  module_code: string | null;
}

interface MoveToFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  folders: FolderNode[];
  /** IDs to exclude from the tree (e.g., the item being moved + its children) */
  excludeIds?: Set<string>;
  /** Current folder ID (shown as disabled/current) */
  currentFolderId?: string | null;
  onConfirm: (targetFolderId: string) => void;
  isMoving?: boolean;
  itemName?: string;
}

function getLabel(node: FolderNode) {
  return node.module_code && node.template_id?.endsWith('_ROOT')
    ? getModuleDisplayName(node.module_code)
    : node.name;
}

function FolderTreeItem({
  node,
  allFolders,
  excludeIds,
  currentFolderId,
  selectedId,
  onSelect,
  level,
  expandedIds,
  onToggle,
}: {
  node: FolderNode;
  allFolders: FolderNode[];
  excludeIds: Set<string>;
  currentFolderId?: string | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  level: number;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  const children = allFolders.filter(f => f.parent_id === node.id && !excludeIds.has(f.id));
  const hasChildren = children.length > 0;
  const isExpanded = expandedIds.has(node.id);
  const isSelected = selectedId === node.id;
  const isCurrent = currentFolderId === node.id;

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1.5 px-2 py-1.5 rounded cursor-pointer text-sm transition-colors',
          isSelected ? 'bg-primary/15 ring-1 ring-primary/30 font-medium' : 'hover:bg-muted/50',
          isCurrent && 'opacity-50',
        )}
        style={{ paddingLeft: `${8 + level * 16}px` }}
        onClick={() => !isCurrent && onSelect(node.id)}
      >
        {hasChildren ? (
          <button
            className="shrink-0 hover:text-primary"
            onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
          >
            {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
        ) : (
          <span className="w-3 shrink-0" />
        )}
        {isExpanded ? (
          <FolderOpen className="h-4 w-4 shrink-0 text-primary" />
        ) : (
          <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
        <span className="truncate">{getLabel(node)}</span>
        {isCurrent && <span className="text-xs text-muted-foreground ml-auto">(aktuell)</span>}
      </div>
      {isExpanded && children
        .sort((a, b) => getLabel(a).localeCompare(getLabel(b)))
        .map(child => (
          <FolderTreeItem
            key={child.id}
            node={child}
            allFolders={allFolders}
            excludeIds={excludeIds}
            currentFolderId={currentFolderId}
            selectedId={selectedId}
            onSelect={onSelect}
            level={level + 1}
            expandedIds={expandedIds}
            onToggle={onToggle}
          />
        ))}
    </div>
  );
}

export function MoveToFolderDialog({
  open,
  onOpenChange,
  folders,
  excludeIds = new Set(),
  currentFolderId,
  onConfirm,
  isMoving,
  itemName,
}: MoveToFolderDialogProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const rootFolders = useMemo(
    () => folders.filter(f => !f.parent_id && !excludeIds.has(f.id)),
    [folders, excludeIds],
  );

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    if (selectedId) {
      onConfirm(selectedId);
      setSelectedId(null);
    }
  };

  const handleOpenChange = (v: boolean) => {
    if (!v) setSelectedId(null);
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderInput className="h-5 w-5" />
            Verschieben{itemName ? `: ${itemName}` : ''}
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[320px] border rounded-md p-1">
          {rootFolders
            .sort((a, b) => getLabel(a).localeCompare(getLabel(b)))
            .map(node => (
              <FolderTreeItem
                key={node.id}
                node={node}
                allFolders={folders}
                excludeIds={excludeIds}
                currentFolderId={currentFolderId}
                selectedId={selectedId}
                onSelect={setSelectedId}
                level={0}
                expandedIds={expandedIds}
                onToggle={toggleExpand}
              />
            ))}
          {rootFolders.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">Keine Ordner verfügbar</p>
          )}
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isMoving}>
            Abbrechen
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedId || isMoving}>
            {isMoving ? 'Verschiebe…' : 'Hierhin verschieben'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
