import { MoreVertical, Download, Eye, FolderOpen, Trash2, FolderPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FileRowMenuProps {
  type: 'folder' | 'file';
  onDownload?: () => void;
  onPreview?: () => void;
  onOpen?: () => void;
  onDelete?: () => void;
  onNewSubfolder?: () => void;
  isDownloading?: boolean;
  isDeleting?: boolean;
}

export function FileRowMenu({
  type,
  onDownload,
  onPreview,
  onOpen,
  onDelete,
  onNewSubfolder,
  isDownloading,
  isDeleting,
}: FileRowMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover/row:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {type === 'folder' && onOpen && (
          <DropdownMenuItem onClick={onOpen}>
            <FolderOpen className="h-4 w-4 mr-2" />
            Öffnen
          </DropdownMenuItem>
        )}
        {type === 'folder' && onNewSubfolder && (
          <DropdownMenuItem onClick={onNewSubfolder}>
            <FolderPlus className="h-4 w-4 mr-2" />
            Neuer Unterordner
          </DropdownMenuItem>
        )}
        {type === 'file' && onPreview && (
          <DropdownMenuItem onClick={onPreview}>
            <Eye className="h-4 w-4 mr-2" />
            Vorschau
          </DropdownMenuItem>
        )}
        {type === 'file' && onDownload && (
          <DropdownMenuItem onClick={onDownload} disabled={isDownloading}>
            <Download className="h-4 w-4 mr-2" />
            Herunterladen
          </DropdownMenuItem>
        )}
        {onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              disabled={isDeleting}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Löschen
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
