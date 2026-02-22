import { useCallback, type ReactNode } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface FileDropZoneProps {
  onDrop: (files: File[]) => void;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}

export function FileDropZone({ onDrop, disabled, children, className }: FileDropZoneProps) {
  const isMobile = useIsMobile();

  const handleDrop = useCallback((accepted: File[]) => {
    if (accepted.length > 0) onDrop(accepted);
  }, [onDrop]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    noClick: true,
    noKeyboard: true,
    noDrag: isMobile,
    disabled,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
  });

  return (
    <div {...getRootProps()} className={cn('relative', className)}>
      <input {...getInputProps()} />
      {children}

      {isDragActive && !isMobile && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-primary/5 border-2 border-dashed border-primary rounded-lg backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2 text-primary">
            <Upload className="h-10 w-10" />
            <p className="font-medium text-sm">Dateien hier ablegen</p>
          </div>
        </div>
      )}
    </div>
  );
}
