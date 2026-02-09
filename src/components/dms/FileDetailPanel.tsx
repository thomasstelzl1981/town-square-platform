import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Download, Trash2, X, FileText, Image, FileSpreadsheet, File } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

interface Document {
  id: string;
  public_id: string;
  name: string;
  file_path: string;
  mime_type: string;
  size_bytes: number;
  created_at: string;
  uploaded_by: string | null;
}

interface DocumentLink {
  id: string;
  document_id: string;
  node_id: string | null;
  object_type: string | null;
  object_id: string | null;
}

interface FileDetailPanelProps {
  document: Document;
  links: DocumentLink[];
  onClose: () => void;
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
  isDownloading?: boolean;
  isDeleting?: boolean;
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileIcon(mime: string) {
  if (mime.startsWith('image/')) return Image;
  if (mime.includes('pdf')) return FileText;
  if (mime.includes('sheet') || mime.includes('excel') || mime.includes('csv')) return FileSpreadsheet;
  return File;
}

export function FileDetailPanel({
  document: doc,
  links,
  onClose,
  onDownload,
  onDelete,
  isDownloading,
  isDeleting,
}: FileDetailPanelProps) {
  const Icon = getFileIcon(doc.mime_type);
  const ext = doc.mime_type.split('/')[1]?.toUpperCase() || doc.mime_type;

  return (
    <div className="border-l bg-card h-full flex flex-col w-full">
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between">
        <span className="font-medium text-sm truncate flex-1">Details</span>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* File icon + name */}
          <div className="flex flex-col items-center gap-2 py-4">
            <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center">
              <Icon className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-center text-sm break-all">{doc.name}</p>
            <Badge variant="secondary">{ext}</Badge>
          </div>

          <Separator />

          {/* Metadata */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Größe</span>
              <span>{formatFileSize(doc.size_bytes)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Hochgeladen</span>
              <span>{formatDistanceToNow(new Date(doc.created_at), { addSuffix: true, locale: de })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Datum</span>
              <span>{new Date(doc.created_at).toLocaleDateString('de-DE')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ID</span>
              <span className="font-mono text-xs text-muted-foreground">{doc.public_id}</span>
            </div>
          </div>

          <Separator />

          {/* Links */}
          <div>
            <span className="text-sm text-muted-foreground">Verknüpfungen</span>
            {links.length > 0 ? (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {links.map(link => (
                  <Badge key={link.id} variant="secondary" className="text-xs">
                    {link.object_type || 'Ordner'}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">Keine</p>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* Actions */}
      <div className="p-3 border-t flex gap-2">
        <Button
          className="flex-1"
          size="sm"
          onClick={() => onDownload(doc.id)}
          disabled={isDownloading}
        >
          <Download className="h-4 w-4 mr-1.5" />
          Download
        </Button>
        <Button
          variant="destructive"
          size="icon"
          className="h-8 w-8"
          onClick={() => {
            if (confirm('Dokument wirklich löschen?')) onDelete(doc.id);
          }}
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
