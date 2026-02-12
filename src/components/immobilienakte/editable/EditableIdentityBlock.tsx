import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, ExternalLink } from 'lucide-react';
import { StatusIndicator, type ModuleStatus } from './StatusIndicator';
import type { PropertyStatus, ReportingRegime } from '@/types/immobilienakte';

interface EditableIdentityBlockProps {
  unitCode: string;
  propertyType?: string;
  status: PropertyStatus;
  saleEnabled: boolean;
  rentalManaged: boolean;
  reportingRegime: ReportingRegime;
  buildYear?: number;
  wegFlag?: boolean;
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

// Helper to derive module status from boolean flags
function getModuleStatus(isEnabled: boolean): ModuleStatus {
  return isEnabled ? 'active' : 'inactive';
}

export function EditableIdentityBlock({
  unitCode,
  propertyType,
  status,
  saleEnabled,
  rentalManaged,
  reportingRegime,
  buildYear,
  wegFlag,
  onFieldChange,
}: EditableIdentityBlockProps) {
  return (
    <Card>
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Building2 className="h-3.5 w-3.5" />
          Identität & Stammdaten
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-4 pb-3">
        {/* Row 1: Code + Baujahr */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Akten-ID</Label>
            <Input value={unitCode} disabled className="h-7 text-xs font-mono bg-muted" />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Baujahr</Label>
            <Input 
              type="number" 
              value={buildYear || ''} 
              onChange={(e) => onFieldChange('buildYear', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="z.B. 1985"
              className="h-7 text-xs"
            />
          </div>
        </div>

        {/* Row 2: Objektart + Status */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Objektart</Label>
            <Select value={propertyType || ''} onValueChange={(v) => onFieldChange('propertyType', v)}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue placeholder="Auswählen..." />
              </SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map(pt => (
                  <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Status</Label>
            <Select value={status} onValueChange={(v) => onFieldChange('propertyStatus', v as PropertyStatus)}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 3: Reporting + WEG in one row */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Reporting</Label>
            <Select value={reportingRegime} onValueChange={(v) => onFieldChange('reportingRegime', v as ReportingRegime)}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REGIMES.map(r => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">WEG</Label>
            <Select 
              value={wegFlag ? 'ja' : 'nein'} 
              onValueChange={(v) => onFieldChange('wegFlag', v === 'ja')}
            >
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ja">Ja</SelectItem>
                <SelectItem value="nein">Nein</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Module Status — compact single line */}
        <div className="flex items-center gap-4 pt-1 border-t text-xs">
          <span className="text-muted-foreground">Module:</span>
          <StatusIndicator label="Verkauf" status={getModuleStatus(saleEnabled)} />
          <StatusIndicator label="Vermietung" status={getModuleStatus(rentalManaged)} />
        </div>
      </CardContent>
    </Card>
  );
}
