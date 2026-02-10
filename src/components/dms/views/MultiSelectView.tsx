import { Folder, File, FileText, Image, FileSpreadsheet } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import type { FileManagerItem } from './ListView';

interface MultiSelectViewProps {
  items: FileManagerItem[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onNavigateFolder: (nodeId: string) => void;
}

function getFileIcon(mime?: string) {
  if (!mime) return File;
  if (mime.startsWith('image/')) return Image;
  if (mime.includes('pdf')) return FileText;
  if (mime.includes('sheet') || mime.includes('excel')) return FileSpreadsheet;
  return File;
}

export function MultiSelectView({ items, selectedIds, onToggleSelect, onToggleSelectAll, onNavigateFolder }: MultiSelectViewProps) {
  const allSelected = items.length > 0 && selectedIds.size === items.length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2 bg-muted/30 border-b">
        <Checkbox checked={allSelected} onCheckedChange={onToggleSelectAll} />
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Alle {items.length} Elemente auswählen
        </span>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {items.map(item => {
            const isSelected = selectedIds.has(item.id);
            const Icon = item.type === 'folder' ? Folder : getFileIcon(item.mimeType);

            return (
              <div
                key={item.id}
                className={cn(
                  'relative flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors cursor-pointer',
                  isSelected ? 'border-primary bg-primary/5' : 'border-transparent hover:bg-muted/50',
                )}
                onClick={() => onToggleSelect(item.id)}
                onDoubleClick={() => {
                  if (item.type === 'folder' && item.nodeId) onNavigateFolder(item.nodeId);
                }}
              >
                <div className="absolute top-2 left-2">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggleSelect(item.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
                <Icon className="h-8 w-8 text-muted-foreground" />
                <span className="text-xs text-center truncate w-full">{item.name}</span>
              </div>
            );
          })}
        </div>
        {items.length === 0 && (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            Keine Elemente
          </div>
        )}
      </div>
    </div>
  );
}
