/**
 * ProviderGallery — Image gallery with lightbox for pet provider detail
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { PawPrint, ChevronLeft, ChevronRight } from 'lucide-react';

interface ProviderGalleryProps {
  galleryImages: string[];
  coverImageUrl?: string;
}

export function ProviderGallery({ galleryImages, coverImageUrl }: ProviderGalleryProps) {
  const allImages = galleryImages.length > 0 ? galleryImages : coverImageUrl ? [coverImageUrl] : [];
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {allImages.length > 0 ? (
            <div className="relative w-full aspect-[4/3]">
              <button onClick={() => setLightboxIndex(galleryIndex)} className="w-full h-full focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-lg">
                <img src={allImages[galleryIndex]} alt={`Bild ${galleryIndex + 1}`} className="w-full h-full object-cover" />
              </button>
              {allImages.length > 1 && (
                <>
                  <Button variant="ghost" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background/90 rounded-full" onClick={() => setGalleryIndex((galleryIndex - 1 + allImages.length) % allImages.length)}>
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background/90 rounded-full" onClick={() => setGalleryIndex((galleryIndex + 1) % allImages.length)}>
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                  <span className="absolute bottom-2 right-2 text-xs bg-background/70 px-2 py-1 rounded">{galleryIndex + 1} / {allImages.length}</span>
                </>
              )}
            </div>
          ) : (
            <div className="w-full aspect-[4/3] bg-gradient-to-br from-muted/40 to-muted/10 flex items-center justify-center">
              <PawPrint className="h-16 w-16 text-muted-foreground/20" />
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={lightboxIndex !== null} onOpenChange={() => setLightboxIndex(null)}>
        <DialogContent className="max-w-3xl p-2 bg-background/95 backdrop-blur">
          {lightboxIndex !== null && allImages[lightboxIndex] && (
            <div className="relative">
              <img src={allImages[lightboxIndex]} alt={`Galeriebild ${lightboxIndex + 1}`} className="w-full max-h-[80vh] object-contain rounded-lg" />
              {allImages.length > 1 && (
                <>
                  <Button variant="ghost" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background/90" onClick={() => setLightboxIndex((lightboxIndex - 1 + allImages.length) % allImages.length)}>
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/70 hover:bg-background/90" onClick={() => setLightboxIndex((lightboxIndex + 1) % allImages.length)}>
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </>
              )}
              <span className="absolute bottom-2 right-2 text-xs bg-background/70 px-2 py-1 rounded">{lightboxIndex + 1} / {allImages.length}</span>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
