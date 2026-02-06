/**
 * ExposeImageGallery - DMS-verknüpfte Bildergalerie für Verkaufsexposés
 * Zeigt Bilder aus document_links mit object_type='property' oder 'unit'
 * SSOT: Bilder kommen aus MOD-03 DMS, nicht aus MOD-06
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Image as ImageIcon, 
  Upload, 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink,
  Folder,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ExposeImageGalleryProps {
  propertyId: string;
  unitId?: string;
}

interface DocumentImage {
  id: string;
  name: string;
  file_path: string;
  mime_type: string;
}

const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];

const ExposeImageGallery = ({ propertyId, unitId }: ExposeImageGalleryProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Fetch images from document_links for this property/unit
  const { data: images = [], isLoading } = useQuery({
    queryKey: ['expose-images', propertyId, unitId],
    queryFn: async () => {
      // Get images linked to this property
      const { data: propertyImages } = await supabase
        .from('document_links')
        .select(`
          document_id,
          documents!inner (
            id,
            name,
            file_path,
            mime_type
          )
        `)
        .eq('object_type', 'property')
        .eq('object_id', propertyId)
        .in('documents.mime_type', IMAGE_MIME_TYPES);

      // Get images linked to this unit (if provided)
      let unitImages: any[] = [];
      if (unitId) {
        const { data } = await supabase
          .from('document_links')
          .select(`
            document_id,
            documents!inner (
              id,
              name,
              file_path,
              mime_type
            )
          `)
          .eq('object_type', 'unit')
          .eq('object_id', unitId)
          .in('documents.mime_type', IMAGE_MIME_TYPES);
        unitImages = data || [];
      }

      // Merge and deduplicate
      const allImages = [...(propertyImages || []), ...unitImages];
      const uniqueImages = allImages.reduce((acc, link) => {
        const doc = (link as any).documents;
        if (doc && !acc.some((img: DocumentImage) => img.id === doc.id)) {
          acc.push({
            id: doc.id,
            name: doc.name,
            file_path: doc.file_path,
            mime_type: doc.mime_type
          });
        }
        return acc;
      }, [] as DocumentImage[]);

      return uniqueImages;
    }
  });

  // Generate signed URLs for images
  const { data: signedUrls = {} } = useQuery({
    queryKey: ['expose-image-urls', images.map(i => i.id).join(',')],
    queryFn: async () => {
      if (images.length === 0) return {};
      
      const urlMap: Record<string, string> = {};
      
      for (const img of images) {
        if (img.file_path) {
          const { data } = await supabase.storage
            .from('tenant-documents')
            .createSignedUrl(img.file_path, 3600); // 1 hour
          if (data?.signedUrl) {
            urlMap[img.id] = data.signedUrl;
          }
        }
      }
      
      return urlMap;
    },
    enabled: images.length > 0
  });

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="col-span-2 row-span-2 aspect-[4/3]" />
            <Skeleton className="aspect-square" />
            <Skeleton className="aspect-square" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state - show placeholders
  if (images.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Bildergalerie
          </CardTitle>
          <CardDescription>Wählen Sie Bilder aus dem Datenraum für Ihr Exposé</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {/* Main Image Placeholder */}
            <Link 
              to={`/portal/immobilien/${propertyId}`}
              className="col-span-2 row-span-2 aspect-[4/3] bg-muted rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors cursor-pointer"
            >
              <Upload className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Bilder im Datenraum hochladen</p>
              <p className="text-xs text-muted-foreground mt-1">→ Immobilienakte öffnen</p>
            </Link>
            {/* Thumbnail Placeholders */}
            {[1, 2, 3, 4].map((i) => (
              <div 
                key={i}
                className="aspect-square bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/25"
              >
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
            <Folder className="h-3 w-3" />
            Bilder werden aus dem{' '}
            <Link to={`/portal/immobilien/${propertyId}`} className="text-primary hover:underline">
              Datenraum der Immobilie
            </Link>{' '}
            verknüpft (MOD-04 SSOT)
          </p>
        </CardContent>
      </Card>
    );
  }

  const mainImage = images[selectedIndex];
  const mainUrl = signedUrls[mainImage?.id];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Bildergalerie
            </CardTitle>
            <CardDescription>{images.length} Bilder aus dem Datenraum</CardDescription>
          </div>
          <Link 
            to={`/portal/immobilien/${propertyId}`}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <ExternalLink className="h-3 w-3" />
            Im Datenraum bearbeiten
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          {/* Main Image */}
          <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
            <DialogTrigger asChild>
              <button 
                className="col-span-2 row-span-2 aspect-[4/3] bg-muted rounded-lg overflow-hidden relative group cursor-pointer"
              >
                {mainUrl ? (
                  <img 
                    src={mainUrl} 
                    alt={mainImage.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 text-white text-sm font-medium">
                    Vergrößern
                  </span>
                </div>
                {images.length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    {selectedIndex + 1} / {images.length}
                  </div>
                )}
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl p-0 bg-black/95">
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 text-white hover:bg-white/20 z-10"
                  onClick={() => setLightboxOpen(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
                
                {mainUrl && (
                  <img 
                    src={mainUrl}
                    alt={mainImage.name}
                    className="w-full max-h-[80vh] object-contain"
                  />
                )}
                
                {images.length > 1 && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                      onClick={handlePrev}
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                      onClick={handleNext}
                    >
                      <ChevronRight className="h-6 w-6" />
                    </Button>
                  </>
                )}
                
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm px-3 py-1 rounded">
                  {mainImage.name}
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          {/* Thumbnails */}
          {images.slice(0, 4).map((img, index) => {
            const url = signedUrls[img.id];
            const isSelected = index === selectedIndex;
            
            return (
              <button
                key={img.id}
                onClick={() => setSelectedIndex(index)}
                className={`aspect-square bg-muted rounded-lg overflow-hidden transition-all ${
                  isSelected ? 'ring-2 ring-primary ring-offset-2' : 'hover:ring-1 hover:ring-muted-foreground/50'
                }`}
              >
                {url ? (
                  <img 
                    src={url}
                    alt={img.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </button>
            );
          })}
          
          {/* Show more indicator if > 4 images */}
          {images.length > 4 && (
            <button 
              onClick={() => setLightboxOpen(true)}
              className="aspect-square bg-muted rounded-lg flex items-center justify-center hover:bg-muted/80 transition-colors"
            >
              <span className="text-sm font-medium text-muted-foreground">
                +{images.length - 4} mehr
              </span>
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExposeImageGallery;
