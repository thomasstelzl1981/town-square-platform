import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MapPin } from 'lucide-react';

interface EditableAddressBlockProps {
  street: string;
  houseNumber?: string;
  postalCode: string;
  city: string;
  locationLabel?: string;
  locationNotes?: string;
  latitude?: number;
  longitude?: number;
  onFieldChange: (field: string, value: any) => void;
}

export function EditableAddressBlock({
  street,
  houseNumber,
  postalCode,
  city,
  locationLabel,
  locationNotes,
  latitude,
  longitude,
  onFieldChange,
}: EditableAddressBlockProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Adresse & Lage
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
          <Label className="text-xs text-muted-foreground">Lage-Notizen</Label>
          <Textarea 
            value={locationNotes || ''} 
            onChange={(e) => onFieldChange('locationNotes', e.target.value)}
            placeholder="Infrastruktur, ÖPNV, Besonderheiten..."
            rows={2}
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
