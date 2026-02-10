import { useState, useEffect } from 'react';
import { File, FileText, Image, FileSpreadsheet, Download, Copy, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { resolveStorageSignedUrl } from '@/lib/storage-url';
import { toast } from 'sonner';
import type { FileManagerItem } from './ListView';

interface PreviewViewProps {
  items: FileManagerItem[];
  selectedItem: FileManagerItem | null;
  onSelectItem: (item: FileManagerItem) => void;
  onDownload: (documentId: string) => void;
  onDelete: (item: FileManagerItem) => void;
  isDownloading?: boolean;
}

function getFileIcon(mime?: string) {
  if (!mime) return File;
  if (mime.startsWith('image/')) return Image;
  if (mime.includes('pdf')) return FileText;
  if (mime.includes('sheet') || mime.includes('excel')) return FileSpreadsheet;
  return File;
}

function formatFileSize(bytes?: number) {
  if (!bytes || bytes === 0) return '—';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PreviewView({ items, selectedItem, onSelectItem, onDownload, onDelete, isDownloading }: PreviewViewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const files = items.filter(i => i.type === 'file');

  useEffect(() => {
    async function loadPreview() {
      if (!selectedItem?.filePath || !selectedItem.mimeType?.startsWith('image/')) {
        setPreviewUrl(null);
        return;
      }
      const { data } = await supabase.storage
        .from('tenant-documents')
        .createSignedUrl(selectedItem.filePath, 300);
      if (data?.signedUrl) {
        setPreviewUrl(resolveStorageSignedUrl(data.signedUrl));
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

  const Icon = selectedItem ? getFileIcon(selectedItem.mimeType) : File;

  return (
    <div className="flex h-full">
      {/* Left: file list */}
      <div className="w-[240px] min-w-[240px] border-r flex flex-col">
        <ScrollArea className="flex-1">
          <div className="py-1">
            {files.map(item => {
              const isActive = selectedItem?.id === item.id;
              const ItemIcon = getFileIcon(item.mimeType);
              return (
                <button
                  key={item.id}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-muted/50 transition-colors',
                    isActive && 'bg-primary/10',
                  )}
                  onClick={() => onSelectItem(item)}
                >
                  <ItemIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</p>
                  </div>
                </button>
              );
            })}
            {files.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-8">Keine Dateien</p>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Right: preview */}
      <div className="flex-1 flex flex-col">
        {selectedItem ? (
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              {/* Preview area */}
              <div className="aspect-video bg-muted/30 rounded-lg flex items-center justify-center overflow-hidden">
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
                    <p>{selectedItem.mimeType || '—'} · {formatFileSize(selectedItem.size)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Erstellt am</p>
                  <p>{formatDate(selectedItem.createdAt)}</p>
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
