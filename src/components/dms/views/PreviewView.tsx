import { useState, useEffect } from 'react';
import { Folder, Download, Copy, Brain, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getCachedSignedUrl } from '@/lib/imageCache';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
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
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionStatus, setExtractionStatus] = useState<string | null>(null);

  const isImage = selectedItem?.mimeType?.startsWith('image/');
  const isPdf = selectedItem?.mimeType === 'application/pdf' || selectedItem?.name?.endsWith('.pdf');
  const isExtractable = isPdf || isImage;

  // Load extraction status when item changes
  useEffect(() => {
    if (!selectedItem?.documentId) {
      setExtractionStatus(null);
      return;
    }
    supabase
      .from('documents')
      .select('extraction_status')
      .eq('id', selectedItem.documentId)
      .single()
      .then(({ data }) => {
        setExtractionStatus(data?.extraction_status || null);
      });
  }, [selectedItem?.documentId]);

  const handleExtract = async () => {
    if (!selectedItem?.documentId) return;
    setIsExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke('sot-storage-extract', {
        body: { documentId: selectedItem.documentId },
      });
      if (error) throw error;
      if (data?.error) {
        if (data.error === 'Insufficient credits') {
          toast.error(`Nicht genügend Credits (${data.available} verfügbar, ${data.required} benötigt)`);
        } else {
          toast.error(data.error);
        }
        return;
      }
      setExtractionStatus('completed');
      toast.success(`Dokument ausgelesen: ${data.chunks_created} Chunks, Konfidenz ${Math.round((data.confidence || 0) * 100)}%`);
    } catch (err) {
      console.error('Extraction error:', err);
      toast.error('Fehler bei der Dokumenten-Extraktion');
    } finally {
      setIsExtracting(false);
    }
  };

  useEffect(() => {
    async function loadPreview() {
      if (!selectedItem?.filePath || (!isImage && !isPdf)) {
        setPreviewUrl(null);
        return;
      }
      const url = await getCachedSignedUrl(selectedItem.filePath);
      if (url) {
        setPreviewUrl(url);
      }
    }
    loadPreview();
  }, [selectedItem?.filePath, selectedItem?.mimeType, isImage, isPdf]);

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
              <div className={cn("bg-muted/20 rounded-lg flex items-center justify-center overflow-hidden", isPdf ? "h-[500px]" : "aspect-video")}>
                {previewUrl && isImage ? (
                  <img src={previewUrl} alt={selectedItem.name} className="max-h-full max-w-full object-contain" />
                ) : previewUrl && isPdf ? (
                  <iframe src={previewUrl} title={selectedItem.name} className="w-full h-full rounded-lg border-0" />
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
              <div className="flex flex-wrap gap-2">
                {isExtractable && extractionStatus !== 'completed' && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleExtract}
                    disabled={isExtracting}
                  >
                    {isExtracting ? (
                      <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    ) : (
                      <Brain className="h-4 w-4 mr-1.5" />
                    )}
                    {isExtracting ? 'Wird ausgelesen…' : 'Dokument auslesen'}
                  </Button>
                )}
                {extractionStatus === 'completed' && (
                  <Badge variant="outline" className="text-emerald-600 border-emerald-300 gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Ausgelesen
                  </Badge>
                )}
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
