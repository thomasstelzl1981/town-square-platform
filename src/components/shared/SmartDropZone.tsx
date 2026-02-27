/**
 * SmartDropZone — ChatGPT-style file upload zone
 * Shared component: Glow on drag, file preview after selection, seamless AI-processing transition.
 */
import { useCallback, useState } from 'react';
import { useDropzone, type Accept } from 'react-dropzone';
import { Upload, FileText, FileSpreadsheet, Image, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

export interface SmartDropZoneProps {
  /** Called with accepted files */
  onFiles: (files: File[]) => void;
  /** Disable interaction */
  disabled?: boolean;
  /** Accepted MIME types (react-dropzone Accept map) */
  accept?: Accept;
  /** Max number of files (default 10) */
  maxFiles?: number;
  /** Show selected files as preview chips */
  showPreview?: boolean;
  /** Custom helper text */
  helperText?: string;
  /** Supported formats label */
  formatsLabel?: string;
  /** Accent variant */
  variant?: 'primary' | 'amber' | 'cyan' | 'violet' | 'emerald' | 'teal';
  className?: string;
}

const VARIANT_STYLES: Record<string, { border: string; glow: string; text: string; bg: string }> = {
  primary: { border: 'border-primary', glow: 'shadow-[0_0_30px_-5px] shadow-primary/30', text: 'text-primary', bg: 'bg-primary/5' },
  amber:   { border: 'border-amber-400', glow: 'shadow-[0_0_30px_-5px] shadow-amber-400/30', text: 'text-amber-500', bg: 'bg-amber-500/5' },
  cyan:    { border: 'border-cyan-400', glow: 'shadow-[0_0_30px_-5px] shadow-cyan-400/30', text: 'text-cyan-500', bg: 'bg-cyan-500/5' },
  violet:  { border: 'border-violet-400', glow: 'shadow-[0_0_30px_-5px] shadow-violet-400/30', text: 'text-violet-500', bg: 'bg-violet-500/5' },
  emerald: { border: 'border-emerald-400', glow: 'shadow-[0_0_30px_-5px] shadow-emerald-400/30', text: 'text-emerald-500', bg: 'bg-emerald-500/5' },
  teal:    { border: 'border-teal-400', glow: 'shadow-[0_0_30px_-5px] shadow-teal-400/30', text: 'text-teal-500', bg: 'bg-teal-500/5' },
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return <Image className="h-4 w-4 text-muted-foreground shrink-0" />;
  if (type.includes('spreadsheet') || type.includes('excel') || type.includes('csv')) return <FileSpreadsheet className="h-4 w-4 text-muted-foreground shrink-0" />;
  return <FileText className="h-4 w-4 text-muted-foreground shrink-0" />;
}

export function SmartDropZone({
  onFiles,
  disabled,
  accept,
  maxFiles = 10,
  showPreview = true,
  helperText,
  formatsLabel = 'PDF, JPG, PNG, XLSX',
  variant = 'primary',
  className,
}: SmartDropZoneProps) {
  const isMobile = useIsMobile();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const v = VARIANT_STYLES[variant] || VARIANT_STYLES.primary;

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted.length === 0) return;
    setSelectedFiles(accepted);
    onFiles(accepted);
  }, [onFiles]);

  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled,
    maxFiles,
    noDrag: isMobile,
    accept,
  });

  return (
    <div className={cn('space-y-3', className)}>
      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300',
          disabled && 'opacity-50 pointer-events-none',
          isDragActive
            ? cn(v.border, v.glow, v.bg, 'scale-[1.02]')
            : 'border-border hover:border-primary/40 hover:bg-muted/20',
        )}
      >
        <input {...getInputProps()} />

        <div className="flex flex-col items-center gap-3">
          {isDragActive ? (
            <>
              <div className={cn('h-14 w-14 rounded-2xl flex items-center justify-center', v.bg)}>
                <Sparkles className={cn('h-7 w-7 animate-bounce', v.text)} />
              </div>
              <p className={cn('text-sm font-medium', v.text)}>Dateien hier ablegen</p>
            </>
          ) : (
            <>
              <div className="h-14 w-14 rounded-2xl bg-muted/30 flex items-center justify-center">
                <Upload className="h-7 w-7 text-muted-foreground/40" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {helperText || (isMobile ? 'Tippen zum Hochladen' : 'Datei auswählen oder hierher ziehen')}
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Unterstützt: {formatsLabel}
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* File preview chips */}
      {showPreview && selectedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedFiles.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/30 border border-border/30 text-sm animate-fade-in"
            >
              {getFileIcon(file.type)}
              <span className="truncate max-w-[160px]">{file.name}</span>
              <span className="text-muted-foreground/60 text-xs">{formatSize(file.size)}</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
