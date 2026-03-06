/**
 * ValuationPhotoGrid — 8-Slot Drag-and-Drop Photo Grid for Valuation Objects
 * Uses react-dropzone for uploads and CachedImage for display.
 */
import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Plus, X, ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CachedImage } from '@/components/ui/cached-image';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ValuationPhotoGridProps {
  propertyId: string;
  tenantId: string;
  /** Already-uploaded photo paths in storage */
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
  bucket?: string;
  className?: string;
}

export function ValuationPhotoGrid({
  propertyId,
  tenantId,
  photos,
  onPhotosChange,
  maxPhotos = 8,
  bucket = 'tenant-documents',
  className,
}: ValuationPhotoGridProps) {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const remaining = maxPhotos - photos.length;
    if (remaining <= 0) {
      toast.error(`Maximal ${maxPhotos} Fotos erlaubt`);
      return;
    }

    const filesToUpload = acceptedFiles.slice(0, remaining);
    setUploading(true);

    try {
      const newPaths: string[] = [];

      for (const file of filesToUpload) {
        const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const storagePath = `${tenantId}/properties/${propertyId}/photos/${crypto.randomUUID()}.${ext}`;

        const { error } = await supabase.storage
          .from(bucket)
          .upload(storagePath, file, { contentType: file.type, upsert: false });

        if (error) {
          console.error('Photo upload error:', error);
          toast.error(`Upload fehlgeschlagen: ${file.name}`);
          continue;
        }

        newPaths.push(storagePath);
      }

      if (newPaths.length > 0) {
        onPhotosChange([...photos, ...newPaths]);
        toast.success(`${newPaths.length} Foto${newPaths.length > 1 ? 's' : ''} hochgeladen`);
      }
    } catch (e) {
      console.error('Photo upload error:', e);
      toast.error('Upload fehlgeschlagen');
    } finally {
      setUploading(false);
    }
  }, [photos, maxPhotos, propertyId, tenantId, bucket, onPhotosChange]);

  const handleRemove = useCallback(async (index: number) => {
    const path = photos[index];
    if (!path) return;

    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) {
      console.error('Photo delete error:', error);
      toast.error('Foto konnte nicht gelöscht werden');
      return;
    }

    const updated = photos.filter((_, i) => i !== index);
    onPhotosChange(updated);
  }, [photos, bucket, onPhotosChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.heic'] },
    multiple: true,
    disabled: uploading || photos.length >= maxPhotos,
    noClick: false,
  });

  const slots = Array.from({ length: maxPhotos }, (_, i) => i);

  return (
    <div className={cn('space-y-3', className)}>
      <div className="grid grid-cols-4 gap-3">
        {slots.map((idx) => {
          const photoPath = photos[idx];

          if (photoPath) {
            return (
              <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border bg-muted/20 group">
                <CachedImage
                  filePath={photoPath}
                  alt={`Objektfoto ${idx + 1}`}
                  className="w-full h-full object-cover"
                  bucket={bucket}
                />
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemove(idx); }}
                  className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          }

          // First empty slot = upload trigger
          if (idx === photos.length) {
            return (
              <div
                key={idx}
                {...getRootProps()}
                className={cn(
                  'aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-colors',
                  isDragActive
                    ? 'border-primary bg-primary/5'
                    : 'border-border/40 hover:border-primary/40 hover:bg-muted/10'
                )}
              >
                <input {...getInputProps()} />
                {uploading ? (
                  <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                ) : (
                  <>
                    <Plus className="h-5 w-5 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground mt-1">Foto</span>
                  </>
                )}
              </div>
            );
          }

          // Remaining empty slots
          return (
            <div key={idx} className="aspect-square rounded-xl border border-border/20 bg-muted/10 flex items-center justify-center">
              <ImageIcon className="h-4 w-4 text-muted-foreground/30" />
            </div>
          );
        })}
      </div>

      {photos.length > 0 && (
        <p className="text-[10px] text-muted-foreground text-center">
          {photos.length} / {maxPhotos} Fotos · Drag-and-Drop oder klicken zum Hinzufügen
        </p>
      )}
    </div>
  );
}
