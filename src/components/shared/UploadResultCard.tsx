/**
 * UploadResultCard — Displays an uploaded file with preview link and status.
 *
 * Part of the 2-Phase Upload Contract:
 * Shows immediately after Phase 1 (file uploaded + registered),
 * then updates status during Phase 2 (AI analysis).
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText, Image, FileSpreadsheet, File,
  ExternalLink, Loader2, CheckCircle2, X,
  Sparkles,
} from 'lucide-react';
import type { UploadedFileInfo } from '@/hooks/useUniversalUpload';

interface UploadResultCardProps {
  file: UploadedFileInfo;
  /** Current status of the upload pipeline */
  status?: 'uploaded' | 'analyzing' | 'done' | 'error';
  /** Allow removing the card */
  onRemove?: () => void;
  /** Compact mode for inline lists */
  compact?: boolean;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return <Image className="h-4 w-4 text-blue-500" />;
  if (mimeType === 'application/pdf') return <FileText className="h-4 w-4 text-red-500" />;
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv'))
    return <FileSpreadsheet className="h-4 w-4 text-green-500" />;
  return <File className="h-4 w-4 text-muted-foreground" />;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'uploaded':
      return (
        <Badge variant="outline" className="text-xs bg-green-500/10 text-green-700 border-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Hochgeladen
        </Badge>
      );
    case 'analyzing':
      return (
        <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-700 border-amber-200">
          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          Wird analysiert
        </Badge>
      );
    case 'done':
      return (
        <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-700 border-blue-200">
          <Sparkles className="h-3 w-3 mr-1" />
          Analyse fertig
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-xs bg-green-500/10 text-green-700 border-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Hochgeladen
        </Badge>
      );
  }
}

export function UploadResultCard({ file, status = 'uploaded', onRemove, compact = false }: UploadResultCardProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md text-sm">
        {getFileIcon(file.mimeType)}
        <span className="truncate flex-1 font-medium">{file.fileName}</span>
        <span className="text-muted-foreground text-xs">{formatFileSize(file.fileSize)}</span>
        <StatusBadge status={status} />
        {file.previewUrl && (
          <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
            <a href={file.previewUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3" />
            </a>
          </Button>
        )}
        {onRemove && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onRemove}>
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50">
      <div className="flex-shrink-0 h-10 w-10 rounded-md bg-background flex items-center justify-center border">
        {getFileIcon(file.mimeType)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{file.fileName}</span>
          <StatusBadge status={status} />
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-muted-foreground">{formatFileSize(file.fileSize)}</span>
          {file.previewUrl && (
            <a
              href={file.previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              Vorschau
            </a>
          )}
        </div>
      </div>
      {onRemove && (
        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={onRemove}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

/**
 * UploadResultList — Renders a list of UploadResultCards.
 * Use this in any upload zone to show files after Phase 1.
 */
export function UploadResultList({
  files,
  status = 'uploaded',
  onClear,
  compact = false,
}: {
  files: UploadedFileInfo[];
  status?: 'uploaded' | 'analyzing' | 'done' | 'error';
  onClear?: () => void;
  compact?: boolean;
}) {
  if (files.length === 0) return null;

  return (
    <div className="space-y-2 mt-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          {files.length} Datei{files.length !== 1 ? 'en' : ''} hochgeladen
        </span>
        {onClear && (
          <Button variant="ghost" size="sm" className="text-xs h-6" onClick={onClear}>
            Liste leeren
          </Button>
        )}
      </div>
      {files.map((file) => (
        <UploadResultCard
          key={file.documentId}
          file={file}
          status={status}
          compact={compact}
        />
      ))}
    </div>
  );
}

export default UploadResultCard;
