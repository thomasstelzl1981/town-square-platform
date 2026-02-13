/**
 * MandateUploadWidget — Wraps MandateCaseCard with drag-and-drop upload zone
 */
import * as React from 'react';
import { cn } from '@/lib/utils';
import { Upload, Loader2 } from 'lucide-react';
import { MandateCaseCard } from './MandateCaseCard';
import { useExposeUpload } from '@/hooks/useExposeUpload';

interface MandateUploadWidgetProps {
  mandate: {
    id: string;
    code: string;
    status: string;
    client_display_name?: string | null;
    asset_focus?: string[] | null;
    price_min?: number | null;
    price_max?: number | null;
    split_terms_confirmed_at?: string | null;
  };
  offerCount?: number;
  isSelected?: boolean;
  onClick?: () => void;
}

export function MandateUploadWidget({ mandate, offerCount, isSelected, onClick }: MandateUploadWidgetProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const { upload, phase, isUploading } = useExposeUpload();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await upload(files[0], mandate.id);
    }
  };

  return (
    <div
      className="relative"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={cn(
        isSelected && 'ring-2 ring-primary rounded-xl',
      )}>
        <MandateCaseCard
          mandate={mandate}
          offerCount={offerCount}
          isSelected={isSelected}
          onClick={onClick}
        />
      </div>

      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 rounded-xl bg-primary/20 border-2 border-dashed border-primary flex items-center justify-center z-10 backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-1 text-primary">
            <Upload className="h-6 w-6" />
            <span className="text-xs font-medium">Exposé ablegen</span>
          </div>
        </div>
      )}

      {/* Upload progress overlay */}
      {isUploading && (
        <div className="absolute inset-0 rounded-xl bg-background/80 flex items-center justify-center z-10 backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-1 text-primary">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-xs font-medium">
              {phase === 'uploading' ? 'Hochladen...' : 'KI-Analyse...'}
            </span>
          </div>
        </div>
      )}

      {/* Small upload hint icon */}
      {!isDragging && !isUploading && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-muted/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
          <Upload className="h-3 w-3 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
