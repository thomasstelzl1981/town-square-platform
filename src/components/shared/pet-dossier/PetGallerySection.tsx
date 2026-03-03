/**
 * PetGallerySection — Photo gallery with upload support
 */
import { memo, useRef } from 'react';
import { SectionCard } from '@/components/shared/SectionCard';
import { Button } from '@/components/ui/button';
import { Camera, Plus } from 'lucide-react';

interface Props {
  galleryUrls: string[];
  readOnly: boolean;
  onUpload: (file: File) => void;
  petName: string;
}

export const PetGallerySection = memo(function PetGallerySection({ galleryUrls, readOnly, onUpload, petName }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
  };

  return (
    <SectionCard
      title="Fotogalerie"
      icon={Camera}
      headerAction={!readOnly ? (
        <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
          <Camera className="h-4 w-4 mr-1" />Hinzufügen
        </Button>
      ) : undefined}
    >
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      {galleryUrls.length === 0 && !readOnly ? (
        <div
          className="border-2 border-dashed border-border/50 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary/30 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <Camera className="h-10 w-10 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">Fotos von {petName} hinzufügen</p>
        </div>
      ) : galleryUrls.length === 0 ? (
        <p className="text-sm text-muted-foreground">Keine Fotos vorhanden</p>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {galleryUrls.map((url, i) => (
            <div key={i} className="aspect-square rounded-xl overflow-hidden bg-muted/30 border border-border/30">
              <img src={url} alt={`${petName} ${i + 1}`} className="w-full h-full object-cover" />
            </div>
          ))}
          {!readOnly && (
            <div
              className="aspect-square rounded-xl border-2 border-dashed border-border/50 flex items-center justify-center cursor-pointer hover:border-primary/30 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <Plus className="h-8 w-8 text-muted-foreground/50" />
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
});
