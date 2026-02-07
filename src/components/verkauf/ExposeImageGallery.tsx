/**
 * ExposeImageGallery - Kompakte Bildergalerie für Verkaufsexposés
 * Features: Max 10 Bilder, Titelbild-Markierung, Sortierung
 * SSOT: Bilder kommen aus MOD-03 DMS, nicht aus MOD-06
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Image as ImageIcon, 
  Star, 
  Plus,
  ChevronLeft, 
  ChevronRight, 
  ExternalLink,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

interface ExposeImageGalleryProps {
  propertyId: string;
  unitId?: string;
}

interface DocumentImage {
  id: string;
  linkId: string;
  name: string;
  file_path: string;
  mime_type: string;
  is_title_image: boolean;
  display_order: number;
}

const MAX_IMAGES = 10;
const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];

const ExposeImageGallery = ({ propertyId, unitId }: ExposeImageGalleryProps) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const queryClient = useQueryClient();

  // Fetch images from document_links with display_order and is_title_image
  const { data: images = [], isLoading } = useQuery({
    queryKey: ['expose-images', propertyId, unitId],
    queryFn: async () => {
      // Get images linked to this property
      const { data: propertyImages } = await supabase
        .from('document_links')
        .select(`
          id,
          document_id,
          is_title_image,
          display_order,
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
            id,
            document_id,
            is_title_image,
            display_order,
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

      // Merge and deduplicate by document_id
      const allImages = [...(propertyImages || []), ...unitImages];
      const uniqueImages = allImages.reduce((acc, link) => {
        const doc = (link as any).documents;
        if (doc && !acc.some((img: DocumentImage) => img.id === doc.id)) {
          acc.push({
            id: doc.id,
            linkId: link.id,
            name: doc.name,
            file_path: doc.file_path,
            mime_type: doc.mime_type,
            is_title_image: link.is_title_image || false,
            display_order: link.display_order || 0
          });
        }
        return acc;
      }, [] as DocumentImage[]);

      // Sort: Title image first, then by display_order
      return uniqueImages.sort((a, b) => {
        if (a.is_title_image && !b.is_title_image) return -1;
        if (!a.is_title_image && b.is_title_image) return 1;
        return a.display_order - b.display_order;
      });
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
            .createSignedUrl(img.file_path, 3600);
          if (data?.signedUrl) {
            urlMap[img.id] = data.signedUrl;
          }
        }
      }
      
      return urlMap;
    },
    enabled: images.length > 0
  });

  // Mutation to set title image
  const setTitleImageMutation = useMutation({
    mutationFn: async (linkId: string) => {
      // First, unset any existing title image for this object
      const objectType = unitId ? 'unit' : 'property';
      const objectId = unitId || propertyId;
      
      await supabase
        .from('document_links')
        .update({ is_title_image: false })
        .eq('object_type', objectType)
        .eq('object_id', objectId);

      // Set the new title image
      const { error } = await supabase
        .from('document_links')
        .update({ is_title_image: true })
        .eq('id', linkId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expose-images'] });
      toast.success('Titelbild aktualisiert');
    },
    onError: () => {
      toast.error('Fehler beim Setzen des Titelbilds');
    }
  });

  const handlePrev = () => {
    setLightboxIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setLightboxIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="w-40 h-40 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Current lightbox image
  const lightboxImage = images[lightboxIndex];
  const lightboxUrl = signedUrls[lightboxImage?.id];

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Bildergalerie</CardTitle>
            <span className="text-sm text-muted-foreground">
              {images.length}/{MAX_IMAGES}
            </span>
          </div>
          <Link 
            to={`/portal/immobilien/${propertyId}`}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <ExternalLink className="h-3 w-3" />
            Im Datenraum
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <TooltipProvider delayDuration={300}>
          <div className="flex flex-wrap gap-3">
            {/* Image Thumbnails */}
            {images.map((img, index) => {
              const url = signedUrls[img.id];
              
              return (
                <div 
                  key={img.id}
                  className="relative group"
                >
                  <button
                    onClick={() => openLightbox(index)}
                    className="w-40 h-40 bg-muted rounded-lg overflow-hidden transition-all hover:ring-2 hover:ring-primary/50 focus:ring-2 focus:ring-primary"
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
                  
                  {/* Title Image Star */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!img.is_title_image) {
                            setTitleImageMutation.mutate(img.linkId);
                          }
                        }}
                        className={`absolute top-1 left-1 p-1 rounded-full transition-all ${
                          img.is_title_image 
                            ? 'bg-yellow-500 text-white' 
                            : 'bg-black/40 text-white/70 opacity-0 group-hover:opacity-100 hover:bg-black/60'
                        }`}
                      >
                        <Star className={`h-3 w-3 ${img.is_title_image ? 'fill-current' : ''}`} />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      {img.is_title_image ? 'Titelbild' : 'Als Titelbild setzen'}
                    </TooltipContent>
                  </Tooltip>
                </div>
              );
            })}
            
            {/* Add Image Button (if < MAX_IMAGES) */}
            {images.length < MAX_IMAGES && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    to={`/portal/immobilien/${propertyId}`}
                    className="w-40 h-40 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/80 transition-colors"
                  >
                    <Plus className="h-6 w-6 text-muted-foreground" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="top">
                  Bilder im Datenraum hinzufügen
                </TooltipContent>
              </Tooltip>
            )}
            
            {/* Empty state placeholders */}
            {images.length === 0 && (
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                  <div 
                    key={i}
                    className="w-40 h-40 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/25"
                  >
                    <ImageIcon className="h-5 w-5 text-muted-foreground/50" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </TooltipProvider>

        {/* Lightbox Dialog */}
        <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
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
              
              {lightboxUrl && (
                <img 
                  src={lightboxUrl}
                  alt={lightboxImage?.name}
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
              
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                <span className="bg-black/60 text-white text-sm px-3 py-1 rounded">
                  {lightboxImage?.name}
                </span>
                <span className="bg-black/60 text-white text-xs px-2 py-1 rounded">
                  {lightboxIndex + 1} / {images.length}
                </span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ExposeImageGallery;
