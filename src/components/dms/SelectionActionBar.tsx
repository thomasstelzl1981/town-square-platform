import { Button } from '@/components/ui/button';
import { Download, Eye, Trash2, FolderPlus, FolderInput, X } from 'lucide-react';
import { getFileIcon } from '@/components/dms/storageHelpers';
import type { FileManagerItem } from '@/components/dms/views/ListView';

interface SelectionActionBarProps {
  item: FileManagerItem;
  onOpen?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  onNewSubfolder?: () => void;
  onMove?: () => void;
  onClear: () => void;
  isDownloading?: boolean;
  isDeleting?: boolean;
  isMoving?: boolean;
}

export function SelectionActionBar({
  item,
  onOpen,
  onDownload,
  onDelete,
  onNewSubfolder,
  onMove,
  onClear,
  isDownloading,
  isDeleting,
  isMoving,
}: SelectionActionBarProps) {
  const Icon = item.type === 'folder' ? undefined : getFileIcon(item.mimeType);

  return (
    <div className="flex items-center gap-2 px-4 py-1.5 bg-primary/10 border-b border-primary/20 text-sm shrink-0">
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 text-muted-foreground hover:text-foreground"
        onClick={onClear}
      >
        <X className="h-3.5 w-3.5" />
      </Button>

      {Icon && <Icon className="h-4 w-4 text-primary shrink-0" />}
      <span className="font-medium truncate max-w-[200px]">{item.name}</span>

      <div className="flex-1" />

      {/* File actions */}
      {item.type === 'file' && onOpen && (
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5" onClick={onOpen}>
          <Eye className="h-3.5 w-3.5" />
          Öffnen
        </Button>
      )}
      {item.type === 'file' && onDownload && (
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5" onClick={onDownload} disabled={isDownloading}>
          <Download className="h-3.5 w-3.5" />
          Download
        </Button>
      )}

      {/* Move — both types */}
      {onMove && (
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5" onClick={onMove} disabled={isMoving}>
          <FolderInput className="h-3.5 w-3.5" />
          Verschieben
        </Button>
      )}

      {/* Folder actions */}
      {item.type === 'folder' && onNewSubfolder && (
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5" onClick={onNewSubfolder}>
          <FolderPlus className="h-3.5 w-3.5" />
          Unterordner
        </Button>
      )}

      {/* Delete — both types */}
      {onDelete && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={onDelete}
          disabled={isDeleting}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Löschen
        </Button>
      )}
    </div>
  );
}
