import { Button } from '@/components/ui/button';
import { Download, Trash2, X } from 'lucide-react';

interface BulkActionBarProps {
  count: number;
  onDownload: () => void;
  onDelete: () => void;
  onClear: () => void;
  isDownloading?: boolean;
  isDeleting?: boolean;
}

export function BulkActionBar({ count, onDownload, onDelete, onClear, isDownloading, isDeleting }: BulkActionBarProps) {
  if (count === 0) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-primary text-primary-foreground text-sm">
      <Button variant="ghost" size="icon" className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20" onClick={onClear}>
        <X className="h-3.5 w-3.5" />
      </Button>
      <span className="font-medium">{count} ausgewählt</span>
      <div className="flex-1" />
      <Button
        variant="ghost"
        size="sm"
        className="text-primary-foreground hover:bg-primary-foreground/20"
        onClick={() => {
          if (confirm(`${count} Dokument(e) wirklich löschen?`)) onDelete();
        }}
        disabled={isDeleting}
      >
        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
        Löschen
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="text-primary-foreground hover:bg-primary-foreground/20"
        onClick={onDownload}
        disabled={isDownloading}
      >
        <Download className="h-3.5 w-3.5 mr-1.5" />
        Herunterladen
      </Button>
    </div>
  );
}
