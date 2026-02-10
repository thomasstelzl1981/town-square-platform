import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ListView } from './ListView';
import type { FileManagerItem } from './ListView';
import type { SortField, SortDir } from '@/components/dms/StorageToolbar';

interface PathNavigatorViewProps {
  currentPath: string;
  items: FileManagerItem[];
  selectedIds: Set<string>;
  sortField: SortField;
  sortDir: SortDir;
  onSortChange: (field: SortField, dir: SortDir) => void;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onNavigateFolder: (nodeId: string) => void;
  onNavigatePath: (path: string) => void;
  onDownload: (documentId: string) => void;
  onPreview: (item: FileManagerItem) => void;
  onDelete: (item: FileManagerItem) => void;
  onNewSubfolder: (parentNodeId: string) => void;
  isDownloading?: boolean;
  isDeleting?: boolean;
}

export function PathNavigatorView({
  currentPath,
  items,
  selectedIds,
  sortField,
  sortDir,
  onSortChange,
  onToggleSelect,
  onToggleSelectAll,
  onNavigateFolder,
  onNavigatePath,
  onDownload,
  onPreview,
  onDelete,
  onNewSubfolder,
  isDownloading,
  isDeleting,
}: PathNavigatorViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editPath, setEditPath] = useState(currentPath);

  const handleSetPath = () => {
    onNavigatePath(editPath);
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Path editor */}
      <div className="px-4 py-3 border-b bg-muted/20">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              value={editPath}
              onChange={(e) => setEditPath(e.target.value)}
              className="flex-1 font-mono text-sm h-8"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') handleSetPath(); if (e.key === 'Escape') setIsEditing(false); }}
            />
            <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
              Abbrechen
            </Button>
            <Button size="sm" onClick={handleSetPath}>
              Pfad setzen
            </Button>
          </div>
        ) : (
          <button
            className="font-mono text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => { setEditPath(currentPath); setIsEditing(true); }}
          >
            {currentPath || '/'}
          </button>
        )}
      </div>

      {/* List below */}
      <div className="flex-1">
        <ListView
          items={items}
          selectedIds={selectedIds}
          sortField={sortField}
          sortDir={sortDir}
          onSortChange={onSortChange}
          onToggleSelect={onToggleSelect}
          onToggleSelectAll={onToggleSelectAll}
          onNavigateFolder={onNavigateFolder}
          onDownload={onDownload}
          onPreview={onPreview}
          onDelete={onDelete}
          onNewSubfolder={onNewSubfolder}
          isDownloading={isDownloading}
          isDeleting={isDeleting}
        />
      </div>
    </div>
  );
}
