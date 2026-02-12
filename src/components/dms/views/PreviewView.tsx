import { useState, useEffect } from 'react';
import { Folder, Download, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { getCachedSignedUrl } from '@/lib/imageCache';
import { toast } from 'sonner';
import { getFileIcon, formatFileSize, formatDateTime, formatType } from '@/components/dms/storageHelpers';
import type { FileManagerItem } from './ListView';

interface PreviewViewProps {
  items: FileManagerItem[];
  selectedItem: FileManagerItem | null;
  onSelectItem: (item: FileManagerItem) => void;
  onDownload: (documentId: string) => void;
  onDelete: (item: FileManagerItem) => void;
  onNavigateFolder: (nodeId: string) => void;
  isDownloading?: boolean;
}

export function PreviewView({ items, selectedItem, onSelectItem, onDownload, onDelete, onNavigateFolder, isDownloading }: PreviewViewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    async function loadPreview() {
      if (!selectedItem?.filePath || !selectedItem.mimeType?.startsWith('image/')) {
        setPreviewUrl(null);
        return;
      }
      const url = await getCachedSignedUrl(selectedItem.filePath);
      if (url) {
        setPreviewUrl(url);
      }
    }
    loadPreview();
  }, [selectedItem?.filePath, selectedItem?.mimeType]);

  const handleCopyPath = () => {
    if (selectedItem?.filePath) {
      navigator.clipboard.writeText(selectedItem.filePath);
      toast.success('Pfad kopiert');
    }
  };

  const Icon = selectedItem ? getFileIcon(selectedItem.mimeType) : getFileIcon();

  return (
    <div className="flex h-full">
      {/* Left: item list */}
      <div className="w-[240px] min-w-[240px] border-r border-border/30 flex flex-col">
        <ScrollArea className="flex-1">
          <div className="py-1">
            {items.map(item => {
              const isActive = selectedItem?.id === item.id;
              const ItemIcon = item.type === 'folder' ? Folder : getFileIcon(item.mimeType);
              return (
                <button
                  key={item.id}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/30 transition-colors',
                    isActive && 'bg-muted',
                  )}
                  onClick={() => {
                    if (item.type === 'folder' && item.nodeId) {
                      onNavigateFolder(item.nodeId);
                    } else {
                      onSelectItem(item);
                    }
                  }}
                >
                  <ItemIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm truncate flex-1">{item.name}</span>
                </button>
              );
            })}
            {items.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">Keine Elemente</p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right: preview */}
      <div className="flex-1 flex flex-col">
        {selectedItem && selectedItem.type === 'file' ? (
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              {/* Preview area */}
              <div className="aspect-video bg-muted/20 rounded-lg flex items-center justify-center overflow-hidden">
                {previewUrl ? (
                  <img src={previewUrl} alt={selectedItem.name} className="max-h-full max-w-full object-contain" />
                ) : (
                  <Icon className="h-16 w-16 text-muted-foreground/40" />
                )}
              </div>

              <Separator />

              {/* Metadata */}
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Dateiname</p>
                  <p className="font-medium">{selectedItem.name}</p>
                </div>
                <div className="flex gap-8">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Typ & Größe</p>
                    <p>{formatType(selectedItem.mimeType)} · {formatFileSize(selectedItem.size)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Erstellt am</p>
                  <p>{formatDateTime(selectedItem.createdAt)}</p>
                </div>
              </div>

              <Separator />

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => selectedItem.documentId && onDownload(selectedItem.documentId)} disabled={isDownloading}>
                  <Download className="h-4 w-4 mr-1.5" />
                  Download
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopyPath}>
                  <Copy className="h-4 w-4 mr-1.5" />
                  Pfad kopieren
                </Button>
              </div>

              <button
                onClick={() => onDelete(selectedItem)}
                className="text-sm text-destructive hover:underline"
              >
                Datei löschen
              </button>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p className="text-sm">Datei auswählen für Vorschau</p>
          </div>
        )}
      </div>
    </div>
  );
}
