import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Building2 } from 'lucide-react';
import type { PropertyCategory, PropertyStatus, ReportingRegime } from '@/types/immobilienakte';

interface EditableIdentityBlockProps {
  unitCode: string;
  propertyType?: string;
  category: PropertyCategory;
  status: PropertyStatus;
  saleEnabled: boolean;
  rentalManaged: boolean;
  reportingRegime: ReportingRegime;
  buildYear?: number;
  wegFlag?: boolean;
  meaOrTeNo?: string;
  onFieldChange: (field: string, value: any) => void;
}

const PROPERTY_TYPES = [
  { value: 'ETW', label: 'Eigentumswohnung' },
  { value: 'EFH', label: 'Einfamilienhaus' },
  { value: 'MFH', label: 'Mehrfamilienhaus' },
  { value: 'DHH', label: 'Doppelhaushälfte' },
  { value: 'RH', label: 'Reihenhaus' },
  { value: 'Gewerbe', label: 'Gewerbeobjekt' },
  { value: 'Grundstueck', label: 'Grundstück' },
];

const CATEGORIES: { value: PropertyCategory; label: string }[] = [
  { value: 'einzelobjekt', label: 'Einzelobjekt' },
  { value: 'globalobjekt', label: 'Globalobjekt (Mehrere Einheiten)' },
];

const STATUSES: { value: PropertyStatus; label: string }[] = [
  { value: 'aktiv', label: 'Aktiv' },
  { value: 'in_pruefung', label: 'In Prüfung' },
  { value: 'archiviert', label: 'Archiviert' },
  { value: 'verkauft', label: 'Verkauft' },
];

const REGIMES: { value: ReportingRegime; label: string }[] = [
  { value: 'VuV', label: 'V+V (Privat)' },
  { value: 'SuSa_BWA', label: 'SuSa/BWA (Gewerblich)' },
];

export function EditableIdentityBlock({
  unitCode,
  propertyType,
  category,
  status,
  saleEnabled,
  rentalManaged,
  reportingRegime,
  buildYear,
  wegFlag,
  meaOrTeNo,
  onFieldChange,
}: EditableIdentityBlockProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Identität & Stammdaten
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Read-only Code */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Akten-ID</Label>
            <Input value={unitCode} disabled className="font-mono bg-muted" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Baujahr</Label>
            <Input 
              type="number" 
              value={buildYear || ''} 
              onChange={(e) => onFieldChange('buildYear', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="z.B. 1985"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Objektart</Label>
            <Select value={propertyType || ''} onValueChange={(v) => onFieldChange('propertyType', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map(pt => (
                  <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Kategorie</Label>
            <Select value={category} onValueChange={(v) => onFieldChange('category', v as PropertyCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map(c => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Select value={status} onValueChange={(v) => onFieldChange('propertyStatus', v as PropertyStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Reporting</Label>
            <Select value={reportingRegime} onValueChange={(v) => onFieldChange('reportingRegime', v as ReportingRegime)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REGIMES.map(r => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Flags */}
        <div className="flex flex-wrap gap-6 pt-2 border-t">
          <div className="flex items-center gap-2">
            <Switch 
              id="sale-enabled"
              checked={saleEnabled} 
              onCheckedChange={(v) => onFieldChange('saleEnabled', v)} 
            />
            <Label htmlFor="sale-enabled" className="text-sm">Verkauf aktiv</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch 
              id="rental-managed"
              checked={rentalManaged} 
              onCheckedChange={(v) => onFieldChange('rentalManaged', v)} 
            />
            <Label htmlFor="rental-managed" className="text-sm">Vermietung verwaltet</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch 
              id="weg-flag"
              checked={wegFlag || false} 
              onCheckedChange={(v) => onFieldChange('wegFlag', v)} 
            />
            <Label htmlFor="weg-flag" className="text-sm">WEG</Label>
          </div>
        </div>

        {wegFlag && (
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">MEA/TE-Nr.</Label>
            <Input 
              value={meaOrTeNo || ''} 
              onChange={(e) => onFieldChange('teNumber', e.target.value)}
              placeholder="z.B. 42/1000"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
