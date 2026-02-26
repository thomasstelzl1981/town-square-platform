/**
 * ImageSlotGrid — Reusable drag-and-drop image grid for slot-based uploads.
 *
 * Features:
 * - Drag & Drop via react-dropzone per slot
 * - Click-to-upload fallback
 * - Loading spinner per slot
 * - Hover overlay with "Ersetzen" / "Hinzufügen" action
 * - Configurable slot definitions
 * - DB-based image loading via document_links (with storage fallback)
 * - Multi-image carousel mode with navigation arrows and counter badge
 */

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2, ImagePlus, Trash2, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IMAGE_SLOT } from '@/config/designManifest';
import type { MultiImageEntry } from '@/hooks/useImageSlotUpload';

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
  /** Map of slotKey → display URL (signed URL or demo asset) — single-image mode */
  images: Record<string, string | null | undefined>;
  /** Called when a file is dropped/selected for a slot */
  onUpload: (slotKey: string, file: File) => void;
  /** Called when delete is triggered for a slot (single-image mode) */
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
  /** Enable multi-image mode (carousel per slot) */
  multiImage?: boolean;
  /** Multi-image data: slotKey → array of images */
  multiImages?: Record<string, MultiImageEntry[]>;
  /** Delete a specific image by document ID (multi-image mode) */
  onDeleteByDocId?: (documentId: string) => void;
}

function SingleSlot({
  slot,
  imageUrl,
  onUpload,
  onDelete,
  isUploading,
  disabled,
  slotHeight,
  multiImage,
  multiEntries,
  onDeleteByDocId,
}: {
  slot: ImageSlot;
  imageUrl: string | null | undefined;
  onUpload: (file: File) => void;
  onDelete?: () => void;
  isUploading: boolean;
  disabled: boolean;
  slotHeight: number;
  multiImage?: boolean;
  multiEntries?: MultiImageEntry[];
  onDeleteByDocId?: (documentId: string) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

  const images = multiImage && multiEntries && multiEntries.length > 0
    ? multiEntries
    : imageUrl ? [{ url: imageUrl, documentId: '' }] : [];

  const totalImages = images.length;
  const safeIndex = totalImages > 0 ? Math.min(activeIndex, totalImages - 1) : 0;
  const currentImage = images[safeIndex] ?? null;

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (disabled || isUploading) return;
    // In multi-image mode, upload all dropped files
    if (multiImage) {
      acceptedFiles.forEach(f => onUpload(f));
    } else if (acceptedFiles.length > 0) {
      onUpload(acceptedFiles[0]);
    }
  }, [onUpload, disabled, isUploading, multiImage]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    multiple: !!multiImage,
    disabled: disabled || isUploading,
    noKeyboard: true,
  });

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveIndex(i => (i - 1 + totalImages) % totalImages);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveIndex(i => (i + 1) % totalImages);
  };

  const handleDeleteCurrent = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (multiImage && currentImage?.documentId && onDeleteByDocId) {
      onDeleteByDocId(currentImage.documentId);
      // Adjust index after deletion
      setActiveIndex(i => Math.max(0, Math.min(i, totalImages - 2)));
    } else if (onDelete) {
      onDelete();
    }
  };

  return (
    <div className="relative group">
      <div
        {...getRootProps()}
        className={cn(
          'rounded-lg overflow-hidden border-2 border-dashed cursor-pointer transition-all',
          isDragActive && 'border-primary bg-primary/5 scale-[1.02]',
          currentImage && !isDragActive ? 'border-transparent' : 'border-muted-foreground/20 hover:border-primary/40',
          isUploading && 'opacity-50 pointer-events-none',
          disabled && 'cursor-default'
        )}
        style={{ height: slotHeight }}
      >
        <input {...getInputProps()} />

        {currentImage ? (
          <>
            <img src={currentImage.url} alt={slot.label} className="w-full h-full object-cover" />
            {/* Hover overlay */}
            {!disabled && !isUploading && (
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <div className="flex flex-col items-center gap-1 text-white">
                  {multiImage ? (
                    <>
                      <Plus className="h-5 w-5" />
                      <span className="text-[10px] font-medium">Hinzufügen</span>
                    </>
                  ) : (
                    <>
                      <ImagePlus className="h-5 w-5" />
                      <span className="text-[10px] font-medium">Ersetzen</span>
                    </>
                  )}
                </div>
                {(onDelete || (multiImage && onDeleteByDocId && currentImage.documentId)) && (
                  <button
                    type="button"
                    onClick={handleDeleteCurrent}
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

      {/* Navigation arrows for multi-image (only when >1 image) */}
      {multiImage && totalImages > 1 && !isUploading && (
        <>
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Counter badge for multi-image */}
      {multiImage && totalImages > 1 && (
        <span className="absolute top-1 right-1 bg-black/60 text-white text-[9px] font-medium px-1.5 py-0.5 rounded-full pointer-events-none z-10">
          {safeIndex + 1}/{totalImages}
        </span>
      )}

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
  multiImage = false,
  multiImages,
  onDeleteByDocId,
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
            multiImage={multiImage}
            multiEntries={multiImages?.[slot.key]}
            onDeleteByDocId={onDeleteByDocId}
          />
        ))}
      </div>
    </div>
  );
}
