/**
 * RecordCardGallery — 4-Foto Grid für den Open-State der RecordCard
 */

import { RECORD_CARD } from '@/config/designManifest';
import { Plus } from 'lucide-react';

interface RecordCardGalleryProps {
  photos: string[];
  onPhotosChange?: (photos: string[]) => void;
  maxPhotos?: number;
}

export function RecordCardGallery({ photos, onPhotosChange, maxPhotos = 4 }: RecordCardGalleryProps) {
  const slots = Array.from({ length: maxPhotos }, (_, i) => photos[i] || null);

  return (
    <div className={RECORD_CARD.GALLERY}>
      {slots.map((url, i) => (
        url ? (
          <img
            key={i}
            src={url}
            alt={`Foto ${i + 1}`}
            className={RECORD_CARD.GALLERY_IMG}
          />
        ) : (
          i === photos.length && onPhotosChange ? (
            <div
              key={i}
              className="aspect-square rounded-lg border-2 border-dashed border-border/40 flex items-center justify-center cursor-pointer hover:border-primary/40 transition-colors"
            >
              <Plus className="h-5 w-5 text-muted-foreground" />
            </div>
          ) : (
            <div
              key={i}
              className="aspect-square rounded-lg bg-muted/20"
            />
          )
        )
      ))}
    </div>
  );
}
