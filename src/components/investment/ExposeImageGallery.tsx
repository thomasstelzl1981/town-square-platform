/**
 * ExposeImageGallery — Read-Only Bildergalerie für Investment-Exposés
 * 
 * Features:
 * - Lädt Bilder via document_links → documents
 * - Prev/Next Navigation
 * - Dot-Indikatoren
 * - Fallback-Icon wenn keine Bilder
 */
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, ChevronRight, Building2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolveStorageSignedUrl } from '@/lib/storage-url';

interface ListingImage {
  id: string;
  name: string;
  url: string;
  is_cover: boolean;
}

interface ExposeImageGalleryProps {
  propertyId: string;
  listingId?: string;
  className?: string;
  aspectRatio?: 'video' | 'square' | '4/3';
}

export function ExposeImageGallery({
  propertyId,
  listingId,
  className,
  aspectRatio = 'video',
}: ExposeImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch images via document_links
  const { data: images = [], isLoading } = useQuery({
    queryKey: ['expose-gallery-images', propertyId],
    queryFn: async () => {
      const { data: links, error } = await supabase
        .from('document_links')
        .select(
          `
          display_order,
          is_title_image,
          documents!inner (
            id,
            name,
            file_path,
            mime_type
          )
        `
        )
        .eq('object_type', 'property')
        .eq('object_id', propertyId)
        .order('is_title_image', { ascending: false })
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Images query error:', error);
        return [];
      }

      // NOTE: Join-filters on documents.* are inconsistent in PostgREST.
      // We therefore filter client-side for reliability.
      const imageLinks = (links || []).filter((link: any) => {
        const doc = link.documents as any;
        return !!doc?.file_path && String(doc?.mime_type || '').startsWith('image/');
      });

      // Generate signed URLs
      const imagePromises = imageLinks.map(async (link: any) => {
        const doc = link.documents as any;
        const { data: urlData, error: urlError } = await supabase.storage
          .from('tenant-documents')
          .createSignedUrl(doc.file_path, 3600);

        if (urlError) {
          console.warn('Signed URL error:', urlError);
        }

        return {
          id: doc.id,
          name: doc.name,
          url: resolveStorageSignedUrl(urlData?.signedUrl),
          is_cover: link.is_title_image || false,
        } satisfies ListingImage;
      });

      const resolvedImages = await Promise.all(imagePromises);

      // Sort: cover image first
      return resolvedImages
        .filter((img) => !!img.url)
        .sort((a, b) => {
          if (a.is_cover && !b.is_cover) return -1;
          if (!a.is_cover && b.is_cover) return 1;
          return 0;
        });
    },
    enabled: !!propertyId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const aspectClasses = {
    video: 'aspect-video',
    square: 'aspect-square',
    '4/3': 'aspect-[4/3]',
  };

  const activeImage = images[currentIndex];

  // If current image is missing (e.g., data changed), snap back to 0
  useEffect(() => {
    if (currentIndex > 0 && currentIndex >= images.length) {
      setCurrentIndex(0);
    }
  }, [images.length, currentIndex]);

  if (isLoading) {
    return (
      <div
        className={cn(
          aspectClasses[aspectRatio],
          'rounded-xl overflow-hidden bg-muted flex items-center justify-center',
          className
        )}
      >
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div
        className={cn(
          aspectClasses[aspectRatio],
          'rounded-xl overflow-hidden bg-muted flex items-center justify-center',
          className
        )}
      >
        <Building2 className="w-16 h-16 text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className={cn(aspectClasses[aspectRatio], 'relative rounded-xl overflow-hidden bg-muted group', className)}>
      {/* Current Image */}
      <img
        src={activeImage?.url}
        alt={activeImage?.name || 'Objektbild'}
        className="w-full h-full object-cover"
        loading="lazy"
        decoding="async"
      />

      {/* Navigation Buttons */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goToPrevious();
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-foreground/40 text-background flex items-center justify-center hover:bg-foreground/55 transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Vorheriges Bild"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              goToNext();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-foreground/40 text-background flex items-center justify-center hover:bg-foreground/55 transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Nächstes Bild"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Dot Indicators */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={cn(
                  'w-2 h-2 rounded-full transition-colors',
                  idx === currentIndex ? 'bg-background' : 'bg-background/60 hover:bg-background/80'
                )}
                aria-label={`Bild ${idx + 1}`}
              />
            ))}
          </div>

          {/* Image Counter */}
          <div className="absolute top-3 right-3 px-2 py-1 rounded bg-foreground/40 text-background text-xs">
            {currentIndex + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
}
