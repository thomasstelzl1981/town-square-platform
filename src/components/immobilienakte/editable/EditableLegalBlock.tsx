import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Scale, Euro } from 'lucide-react';

interface EditableLegalBlockProps {
  landRegisterCourt?: string;
  landRegisterOf?: string;
  landRegisterSheet?: string;
  landRegisterVolume?: string;
  parcelNumber?: string;
  teNumber?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  marketValue?: number;
  acquisitionCosts?: number;
  onFieldChange: (field: string, value: any) => void;
}

export function EditableLegalBlock({
  landRegisterCourt,
  landRegisterOf,
  landRegisterSheet,
  landRegisterVolume,
  parcelNumber,
  teNumber,
  purchaseDate,
  purchasePrice,
  marketValue,
  acquisitionCosts,
  onFieldChange,
}: EditableLegalBlockProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Scale className="h-4 w-4" />
          Grundbuch & Erwerb
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Land Register */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Amtsgericht</Label>
            <Input 
              value={landRegisterCourt || ''} 
              onChange={(e) => onFieldChange('landRegisterCourt', e.target.value)}
              placeholder="z.B. Charlottenburg"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Grundbuch von</Label>
            <Input 
              value={landRegisterOf || ''} 
              onChange={(e) => onFieldChange('landRegisterOf', e.target.value)}
              placeholder="z.B. Wilmersdorf"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Blatt</Label>
            <Input 
              value={landRegisterSheet || ''} 
              onChange={(e) => onFieldChange('landRegisterSheet', e.target.value)}
              placeholder="z.B. 12345"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Band</Label>
            <Input 
              value={landRegisterVolume || ''} 
              onChange={(e) => onFieldChange('landRegisterVolume', e.target.value)}
              placeholder="z.B. 78"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Flurstück</Label>
            <Input 
              value={parcelNumber || ''} 
              onChange={(e) => onFieldChange('parcelNumber', e.target.value)}
              placeholder="z.B. 123/4"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">TE-Nummer (Wohnungseigentum)</Label>
          <Input 
            value={teNumber || ''} 
            onChange={(e) => onFieldChange('teNumber', e.target.value)}
            placeholder="z.B. 42/1000"
          />
        </div>

        {/* Acquisition */}
        <div className="pt-2 border-t">
          <div className="flex items-center gap-2 mb-3 text-muted-foreground">
            <Euro className="h-4 w-4" />
            <span className="text-xs font-medium">Erwerb</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Notartermin</Label>
              <Input 
                type="date"
                value={purchaseDate || ''} 
                onChange={(e) => onFieldChange('purchaseDate', e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Kaufpreis (€)</Label>
              <Input 
                type="number"
                step="0.01"
                value={purchasePrice || ''} 
                onChange={(e) => onFieldChange('purchasePrice', e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Verkehrswert (€)</Label>
              <Input 
                type="number"
                step="0.01"
                value={marketValue || ''} 
                onChange={(e) => onFieldChange('marketValue', e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Erwerbsnebenkosten (€)</Label>
              <Input 
                type="number"
                step="0.01"
                value={acquisitionCosts || ''} 
                onChange={(e) => onFieldChange('acquisitionCosts', e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
