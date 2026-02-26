/**
 * ImageSlotGrid — Reusable drag-and-drop image grid for slot-based uploads.
 *
 * Features:
 * - Drag & Drop via react-dropzone per slot
 * - Click-to-upload fallback
 * - Loading spinner per slot
 * - Hover overlay with "Ersetzen" action
 * - Configurable slot definitions
 * - DB-based image loading via document_links (with storage fallback)
 */

import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2, ImagePlus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IMAGE_SLOT } from '@/config/designManifest';

export interface ImageSlot {
  /** Unique key for this slot, e.g. 'hero', 'exterior' */
  key: string;
  /** Display label, e.g. 'Hero-Bild' */
  label: string;
  /** Optional description tooltip */
  desc?: string;
}

export interface ImageSlotGridProps {
  /** Slot definitions */
  slots: ImageSlot[];
  /** Map of slotKey → display URL (signed URL or demo asset) */
  images: Record<string, string | null | undefined>;
  /** Called when a file is dropped/selected for a slot */
  onUpload: (slotKey: string, file: File) => void;
  /** Called when delete is triggered for a slot */
  onDelete?: (slotKey: string) => void;
  /** Currently uploading slot key */
  uploadingSlot: string | null;
  /** Disable all interactions (e.g. demo mode) */
  disabled?: boolean;
  /** Grid columns, default IMAGE_SLOT.COLUMNS_DEFAULT */
  columns?: number;
  /** Slot height in px, default IMAGE_SLOT.HEIGHT */
  slotHeight?: number;
  /** Optional title above the grid (replaces hardcoded "Projektbilder") */
  title?: string;
}

function SingleSlot({
  slot,
  imageUrl,
  onUpload,
  onDelete,
  isUploading,
  disabled,
  slotHeight,
}: {
  slot: ImageSlot;
  imageUrl: string | null | undefined;
  onUpload: (file: File) => void;
  onDelete?: () => void;
  isUploading: boolean;
  disabled: boolean;
  slotHeight: number;
}) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0 && !disabled && !isUploading) {
      onUpload(acceptedFiles[0]);
    }
  }, [onUpload, disabled, isUploading]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    multiple: false,
    disabled: disabled || isUploading,
    noKeyboard: true,
  });

  return (
    <div className="relative group">
      <div
        {...getRootProps()}
        className={cn(
          'rounded-lg overflow-hidden border-2 border-dashed cursor-pointer transition-all',
          isDragActive && 'border-primary bg-primary/5 scale-[1.02]',
          imageUrl && !isDragActive ? 'border-transparent' : 'border-muted-foreground/20 hover:border-primary/40',
          isUploading && 'opacity-50 pointer-events-none',
          disabled && 'cursor-default'
        )}
        style={{ height: slotHeight }}
      >
        <input {...getInputProps()} />

        {imageUrl ? (
          <>
            <img src={imageUrl} alt={slot.label} className="w-full h-full object-cover" />
            {/* Hover overlay for replace/delete */}
            {!disabled && !isUploading && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <div className="flex flex-col items-center gap-1 text-white">
                  <ImagePlus className="h-5 w-5" />
                  <span className="text-[10px] font-medium">Ersetzen</span>
                </div>
                {onDelete && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete();
                    }}
                    className="flex flex-col items-center gap-1 text-white hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                    <span className="text-[10px] font-medium">Löschen</span>
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-1 text-muted-foreground/50">
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : isDragActive ? (
              <Upload className="h-6 w-6 text-primary" />
            ) : (
              <Upload className="h-6 w-6" />
            )}
            <span className="text-[10px]">{isDragActive ? 'Ablegen' : slot.label}</span>
          </div>
        )}
      </div>

      {/* Slot label badge */}
      <span className="absolute top-1 left-1 bg-background/80 backdrop-blur-sm text-[9px] font-medium px-1.5 py-0.5 rounded pointer-events-none">
        {slot.label}
      </span>
    </div>
  );
}

export function ImageSlotGrid({
  slots,
  images,
  onUpload,
  onDelete,
  uploadingSlot,
  disabled = false,
  columns = IMAGE_SLOT.COLUMNS_DEFAULT,
  slotHeight = IMAGE_SLOT.HEIGHT,
  title,
}: ImageSlotGridProps) {
  return (
    <div className={title ? 'border-t pt-4' : ''}>
      {title && (
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          {title}
        </p>
      )}
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: `repeat(${Math.min(columns, slots.length)}, minmax(0, 1fr))` }}
      >
        {slots.map((slot) => (
          <SingleSlot
            key={slot.key}
            slot={slot}
            imageUrl={images[slot.key]}
            onUpload={(file) => onUpload(slot.key, file)}
            onDelete={onDelete ? () => onDelete(slot.key) : undefined}
            isUploading={uploadingSlot === slot.key}
            disabled={disabled}
            slotHeight={slotHeight}
          />
        ))}
      </div>
    </div>
  );
}
