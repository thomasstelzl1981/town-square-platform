import * as React from 'react';
import { Upload, X, File, Image, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in bytes
  disabled?: boolean;
  className?: string;
  label?: string;
  hint?: string;
  children?: React.ReactNode; // Custom trigger element
}

export function FileUploader({
  onFilesSelected,
  accept = '*',
  multiple = false,
  maxSize = 10 * 1024 * 1024, // 10MB default
  disabled = false,
  className,
  label = 'Dateien hier ablegen',
  hint = 'oder klicken zum Auswählen',
  children,
}: FileUploaderProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const validateFiles = (files: File[]): File[] => {
    const valid: File[] = [];
    for (const file of files) {
      if (file.size > maxSize) {
        setError(`${file.name} ist zu groß (max ${(maxSize / 1024 / 1024).toFixed(0)}MB)`);
        continue;
      }
      valid.push(file);
    }
    return valid;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    const validFiles = validateFiles(files);
    if (validFiles.length > 0) {
      setError(null);
      onFilesSelected(multiple ? validFiles : [validFiles[0]]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    const validFiles = validateFiles(files);
    if (validFiles.length > 0) {
      setError(null);
      onFilesSelected(validFiles);
    }
    // Reset input for re-upload of same file
    e.target.value = '';
  };

  // If children provided, use as custom trigger
  if (children) {
    return (
      <div className={className} onClick={() => !disabled && inputRef.current?.click()}>
        {children}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />
        {error && (
          <p className="mt-2 text-xs text-destructive">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors',
          isDragOver && 'border-primary bg-primary/5',
          !isDragOver && 'border-muted-foreground/25 hover:border-muted-foreground/50',
          disabled && 'cursor-not-allowed opacity-50',
          !disabled && 'cursor-pointer'
        )}
      >
        <Upload className={cn('h-8 w-8', isDragOver ? 'text-primary' : 'text-muted-foreground')} />
        <div className="text-center">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />
      </div>
      {error && (
        <p className="mt-2 text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}

interface FilePreviewProps {
  file: File | { name: string; size: number; type?: string };
  onRemove?: () => void;
  className?: string;
}

export function FilePreview({ file, onRemove, className }: FilePreviewProps) {
  const isImage = file.type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);
  const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');
  
  const Icon = isImage ? Image : isPdf ? FileText : File;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className={cn('flex items-center gap-3 rounded-md border p-3', className)}>
      <Icon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.name}</p>
        <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
      </div>
      {onRemove && (
        <Button variant="ghost" size="icon" onClick={onRemove} className="h-8 w-8 flex-shrink-0">
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
