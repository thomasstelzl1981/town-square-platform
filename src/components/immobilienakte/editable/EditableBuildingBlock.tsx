import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Home, Thermometer, Zap } from 'lucide-react';
import type { UsageType, HeatingType, EnergySource } from '@/types/immobilienakte';

interface EditableBuildingBlockProps {
  usageType: UsageType;
  areaLivingSqm: number;
  areaUsableSqm?: number;
  roomsCount?: number;
  bathroomsCount?: number;
  floor?: number;
  unitNumber?: string;
  heatingType?: string;
  energySource?: string;
  energyCertType?: string;
  energyCertValue?: number;
  energyCertValidUntil?: string;
  featuresTags?: string[];
  onFieldChange: (field: string, value: any) => void;
}

const USAGE_TYPES: { value: UsageType; label: string }[] = [
  { value: 'wohnen', label: 'Wohnen' },
  { value: 'gewerbe', label: 'Gewerbe' },
  { value: 'mischnutzung', label: 'Mischnutzung' },
];

const HEATING_TYPES = [
  { value: 'zentralheizung', label: 'Zentralheizung' },
  { value: 'etagenheizung', label: 'Etagenheizung' },
  { value: 'fernwaerme', label: 'Fernwärme' },
  { value: 'waermepumpe', label: 'Wärmepumpe' },
  { value: 'sonstige', label: 'Sonstige' },
];

const ENERGY_SOURCES = [
  { value: 'gas', label: 'Gas' },
  { value: 'oel', label: 'Öl' },
  { value: 'strom', label: 'Strom' },
  { value: 'pellets', label: 'Pellets' },
  { value: 'solar', label: 'Solar' },
  { value: 'fernwaerme', label: 'Fernwärme' },
  { value: 'sonstige', label: 'Sonstige' },
];

const ENERGY_CERT_TYPES = [
  { value: 'bedarfsausweis', label: 'Bedarfsausweis' },
  { value: 'verbrauchsausweis', label: 'Verbrauchsausweis' },
];

export function EditableBuildingBlock({
  usageType,
  areaLivingSqm,
  areaUsableSqm,
  roomsCount,
  bathroomsCount,
  floor,
  unitNumber,
  heatingType,
  energySource,
  energyCertType,
  energyCertValue,
  energyCertValidUntil,
  featuresTags,
  onFieldChange,
}: EditableBuildingBlockProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Home className="h-4 w-4" />
          Gebäude & Flächen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Usage & Areas */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Nutzung</Label>
            <Select value={usageType} onValueChange={(v) => onFieldChange('usageType', v as UsageType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {USAGE_TYPES.map(u => (
                  <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Wohnfläche (m²)</Label>
            <Input 
              type="number"
              step="0.01"
              value={areaLivingSqm || ''} 
              onChange={(e) => onFieldChange('areaLivingSqm', e.target.value ? parseFloat(e.target.value) : 0)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Nutzfläche (m²)</Label>
            <Input 
              type="number"
              step="0.01"
              value={areaUsableSqm || ''} 
              onChange={(e) => onFieldChange('areaUsableSqm', e.target.value ? parseFloat(e.target.value) : undefined)}
            />
          </div>
        </div>

        {/* Rooms */}
        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Zimmer</Label>
            <Input 
              type="number"
              step="0.5"
              value={roomsCount || ''} 
              onChange={(e) => onFieldChange('roomsCount', e.target.value ? parseFloat(e.target.value) : undefined)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Bäder</Label>
            <Input 
              type="number"
              value={bathroomsCount || ''} 
              onChange={(e) => onFieldChange('bathroomsCount', e.target.value ? parseInt(e.target.value) : undefined)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Etage</Label>
            <Input 
              type="number"
              value={floor || ''} 
              onChange={(e) => onFieldChange('floor', e.target.value ? parseInt(e.target.value) : undefined)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Whg.-Nr.</Label>
            <Input 
              value={unitNumber || ''} 
              onChange={(e) => onFieldChange('unitNumber', e.target.value)}
              placeholder="z.B. 4.OG links"
            />
          </div>
        </div>

        {/* Heating & Energy */}
        <div className="pt-2 border-t">
          <div className="flex items-center gap-2 mb-3 text-muted-foreground">
            <Thermometer className="h-4 w-4" />
            <span className="text-xs font-medium">Heizung & Energie</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Heizart</Label>
              <Select value={heatingType || ''} onValueChange={(v) => onFieldChange('heatingType', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {HEATING_TYPES.map(h => (
                    <SelectItem key={h.value} value={h.value}>{h.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Energieträger</Label>
              <Select value={energySource || ''} onValueChange={(v) => onFieldChange('energySource', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Auswählen..." />
                </SelectTrigger>
                <SelectContent>
                  {ENERGY_SOURCES.map(e => (
                    <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Energy Certificate */}
        <div className="pt-2 border-t">
          <div className="flex items-center gap-2 mb-3 text-muted-foreground">
            <Zap className="h-4 w-4" />
            <span className="text-xs font-medium">Energieausweis</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Typ</Label>
              <Select value={energyCertType || ''} onValueChange={(v) => onFieldChange('energyCertType', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="–" />
                </SelectTrigger>
                <SelectContent>
                  {ENERGY_CERT_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Wert (kWh/m²a)</Label>
              <Input 
                type="number"
                step="0.1"
                value={energyCertValue || ''} 
                onChange={(e) => onFieldChange('energyCertValue', e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Gültig bis</Label>
              <Input 
                type="date"
                value={energyCertValidUntil || ''} 
                onChange={(e) => onFieldChange('energyCertValidUntil', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Features (simplified) */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Ausstattung (kommagetrennt)</Label>
          <Input 
            value={featuresTags?.join(', ') || ''} 
            onChange={(e) => onFieldChange('featuresTags', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
            placeholder="Balkon, Aufzug, Keller, ..."
          />
        </div>
      </CardContent>
    </Card>
  );
}
