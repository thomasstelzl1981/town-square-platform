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
  // Address fields kept for AI generation context but NOT rendered here
  street?: string;
  houseNumber?: string;
  postalCode?: string;
  city?: string;
  locationLabel?: string;
  description?: string;
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
      const address = `${street || ''} ${houseNumber || ''}`.trim();
      
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
    } catch (err: unknown) {
      console.error('Error generating description:', err);
      toast.error('KI-Generierung fehlgeschlagen');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <MapPin className="h-3.5 w-3.5" />
          Lage & Objektbeschreibung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-4 pb-3">
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">Lagebezeichnung</Label>
          <Input 
            value={locationLabel || ''} 
            onChange={(e) => onFieldChange('locationLabel', e.target.value)}
            placeholder="z.B. Altbau am Prenzlauer Berg"
            className="h-7 text-xs"
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-[11px] text-muted-foreground">Objektbeschreibung</Label>
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
            rows={4}
            className="text-xs"
          />
        </div>
      </CardContent>
    </Card>
  );
}
