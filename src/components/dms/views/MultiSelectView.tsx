import { Folder } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { getFileIcon, formatFileSize } from '@/components/dms/storageHelpers';
import type { FileManagerItem } from './ListView';

interface MultiSelectViewProps {
  items: FileManagerItem[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onNavigateFolder: (nodeId: string) => void;
}

export function MultiSelectView({ items, selectedIds, onToggleSelect, onToggleSelectAll, onNavigateFolder }: MultiSelectViewProps) {
  const allSelected = items.length > 0 && selectedIds.size === items.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < items.length;

  return (
    <div className="flex flex-col h-full">
      {/* Header bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-muted/20 border-b border-border/30">
        <Checkbox
          checked={allSelected}
          // @ts-ignore - indeterminate support
          indeterminate={someSelected}
          onCheckedChange={onToggleSelectAll}
        />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {selectedIds.size > 0
            ? `${selectedIds.size} von ${items.length} ausgewählt`
            : `Alle ${items.length} Elemente auswählen`}
        </span>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="py-1">
          {items.map(item => {
            const isSelected = selectedIds.has(item.id);
            const Icon = item.type === 'folder' ? Folder : getFileIcon(item.mimeType);

            return (
              <div
                key={item.id}
                className={cn(
                  'flex items-center gap-3 px-4 py-2 hover:bg-muted/30 transition-colors cursor-pointer',
                  isSelected && 'bg-primary/5',
                )}
                onClick={() => onToggleSelect(item.id)}
                onDoubleClick={() => {
                  if (item.type === 'folder' && item.nodeId) onNavigateFolder(item.nodeId);
                }}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => onToggleSelect(item.id)}
                  onClick={(e) => e.stopPropagation()}
                  className={cn(isSelected && 'border-primary data-[state=checked]:bg-primary')}
                />
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="flex-1 text-sm truncate">{item.name}</span>
                {item.type === 'file' && item.size && (
                  <span className="text-xs text-muted-foreground shrink-0">{formatFileSize(item.size)}</span>
                )}
              </div>
            );
          })}
          {items.length === 0 && (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              Keine Elemente
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
