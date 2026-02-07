import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { MapPin, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EditableAddressBlockProps {
  street: string;
  houseNumber?: string;
  postalCode: string;
  city: string;
  locationLabel?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  // Property data for AI generation
  propertyType?: string;
  buildYear?: number;
  totalAreaSqm?: number;
  heatingType?: string;
  energySource?: string;
  renovationYear?: number;
  onFieldChange: (field: string, value: any) => void;
}

export function EditableAddressBlock({
  street,
  houseNumber,
  postalCode,
  city,
  locationLabel,
  description,
  latitude,
  longitude,
  propertyType,
  buildYear,
  totalAreaSqm,
  heatingType,
  energySource,
  renovationYear,
  onFieldChange,
}: EditableAddressBlockProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateDescription = async () => {
    setIsGenerating(true);
    try {
      const address = `${street} ${houseNumber || ''}`.trim();
      
      const { data, error } = await supabase.functions.invoke('sot-expose-description', {
        body: { 
          property: {
            address,
            city,
            postal_code: postalCode,
            property_type: propertyType,
            year_built: buildYear,
            total_area_sqm: totalAreaSqm,
            heating_type: heatingType,
            energy_source: energySource,
            renovation_year: renovationYear,
          }
        }
      });
      
      if (error) throw error;
      
      if (data?.description) {
        onFieldChange('description', data.description);
        toast.success('Objektbeschreibung generiert');
      }
    } catch (err: any) {
      console.error('Error generating description:', err);
      toast.error('KI-Generierung fehlgeschlagen');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Lage & Beschreibung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs text-muted-foreground">Straße</Label>
            <Input 
              value={street} 
              onChange={(e) => onFieldChange('street', e.target.value)}
              placeholder="Musterstraße"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Hausnr.</Label>
            <Input 
              value={houseNumber || ''} 
              onChange={(e) => onFieldChange('houseNumber', e.target.value)}
              placeholder="12a"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">PLZ</Label>
            <Input 
              value={postalCode} 
              onChange={(e) => onFieldChange('postalCode', e.target.value)}
              placeholder="12345"
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs text-muted-foreground">Ort</Label>
            <Input 
              value={city} 
              onChange={(e) => onFieldChange('city', e.target.value)}
              placeholder="Berlin"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Lagebezeichnung (z.B. "Altbau am Prenzlauer Berg")</Label>
          <Input 
            value={locationLabel || ''} 
            onChange={(e) => onFieldChange('locationLabel', e.target.value)}
            placeholder="Optionale Kurzbezeichnung"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground">Objektbeschreibung</Label>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleGenerateDescription}
              disabled={isGenerating}
              className="h-6 px-2 text-xs"
            >
              {isGenerating ? (
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <Sparkles className="h-3 w-3 mr-1" />
              )}
              KI-Generieren
            </Button>
          </div>
          <Textarea 
            value={description || ''} 
            onChange={(e) => onFieldChange('description', e.target.value)}
            placeholder="Strukturierte Beschreibung zu Lage, Mikrolage und Objekteigenschaften..."
            rows={5}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Breitengrad</Label>
            <Input 
              type="number"
              step="any"
              value={latitude || ''} 
              onChange={(e) => onFieldChange('latitude', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="52.5200"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Längengrad</Label>
            <Input 
              type="number"
              step="any"
              value={longitude || ''} 
              onChange={(e) => onFieldChange('longitude', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="13.4050"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
