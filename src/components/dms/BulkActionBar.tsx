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
    <div className="flex items-center gap-3 px-3 py-2 bg-primary/5 border-b text-sm">
      <span className="font-medium text-primary">{count} ausgewählt</span>
      <div className="flex-1" />
      <Button variant="outline" size="sm" onClick={onDownload} disabled={isDownloading}>
        <Download className="h-3.5 w-3.5 mr-1.5" />
        Herunterladen
      </Button>
      <Button
        variant="outline"
        size="sm"
        className="text-destructive border-destructive/30 hover:bg-destructive/10"
        onClick={() => {
          if (confirm(`${count} Dokument(e) wirklich löschen?`)) onDelete();
        }}
        disabled={isDeleting}
      >
        <Trash2 className="h-3.5 w-3.5 mr-1.5" />
        Löschen
      </Button>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClear}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
