/**
 * FolderDropTarget — Row-level external file drop wrapper
 * 
 * Wraps a folder row to enable native desktop file drops directly
 * onto a specific folder. Shows per-row highlight.
 */
import { useCallback, type ReactNode } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '@/lib/utils';

const ACCEPT = {
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
};

interface FolderDropTargetProps {
  folderId: string;
  onDropFiles: (files: File[], targetFolderId: string) => void;
  children: ReactNode;
  className?: string;
}

export function FolderDropTarget({ folderId, onDropFiles, children, className }: FolderDropTargetProps) {
  const handleDrop = useCallback((accepted: File[]) => {
    if (accepted.length > 0) {
      onDropFiles(accepted, folderId);
    }
  }, [folderId, onDropFiles]);

  const { getRootProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    noClick: true,
    noKeyboard: true,
    accept: ACCEPT,
  });

  return (
    <div
      {...getRootProps()}
      className={cn(
        'transition-all duration-150',
        isDragActive && 'ring-2 ring-primary bg-primary/10 rounded',
        className,
      )}
    >
      {children}
    </div>
  );
}
