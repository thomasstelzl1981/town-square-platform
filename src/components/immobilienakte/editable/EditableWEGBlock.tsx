import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building, Calculator } from 'lucide-react';
import type { AllocationKey } from '@/types/immobilienakte';

interface EditableWEGBlockProps {
  wegFlag: boolean;
  meaShare?: number;
  meaTotal?: number;
  hausgeldMonthlyEur?: number;
  allocationKeyDefault: AllocationKey;
  periodCurrent?: string;
  lastSettlementDate?: string;
  lastSettlementBalanceEur?: number;
  allocatablePaEur?: number;
  nonAllocatablePaEur?: number;
  onFieldChange: (field: string, value: any) => void;
}

const ALLOCATION_KEYS: { value: AllocationKey; label: string }[] = [
  { value: 'SQM', label: 'Quadratmeter' },
  { value: 'PERSONS', label: 'Personenzahl' },
  { value: 'MEA', label: 'MEA' },
  { value: 'CONSUMPTION', label: 'Verbrauch' },
  { value: 'UNITS', label: 'Einheiten' },
];

export function EditableWEGBlock({
  wegFlag,
  meaShare,
  meaTotal,
  hausgeldMonthlyEur,
  allocationKeyDefault,
  periodCurrent,
  lastSettlementDate,
  lastSettlementBalanceEur,
  allocatablePaEur,
  nonAllocatablePaEur,
  onFieldChange,
}: EditableWEGBlockProps) {
  if (!wegFlag) {
    return (
      <Card>
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Building className="h-3.5 w-3.5" />
            WEG & Hausgeld
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3">
          <p className="text-xs text-muted-foreground">
            Kein Wohnungseigentum (WEG-Flag nicht aktiv).
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Building className="h-3.5 w-3.5" />
          WEG & Hausgeld
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-4 pb-3">
        {/* MEA */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">MEA Anteil</Label>
            <Input 
              type="number"
              step="0.0001"
              value={meaShare || ''} 
              onChange={(e) => onFieldChange('meaShare', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="z.B. 42.5"
              className="h-7 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">MEA Gesamt</Label>
            <Input 
              type="number"
              step="0.01"
              value={meaTotal || ''} 
              onChange={(e) => onFieldChange('meaTotal', e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="z.B. 1000"
              className="h-7 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Hausgeld mtl. (€)</Label>
            <Input 
              type="number"
              step="0.01"
              value={hausgeldMonthlyEur || ''} 
              onChange={(e) => onFieldChange('hausgeldMonthlyEur', e.target.value ? parseFloat(e.target.value) : undefined)}
              className="h-7 text-xs"
            />
          </div>
        </div>

        {/* Allocation */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Standard-Umlageschlüssel</Label>
            <Select value={allocationKeyDefault} onValueChange={(v) => onFieldChange('allocationKeyDefault', v as AllocationKey)}>
              <SelectTrigger className="h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ALLOCATION_KEYS.map(k => (
                  <SelectItem key={k.value} value={k.value}>{k.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Aktuelle Periode</Label>
            <Input 
              value={periodCurrent || ''} 
              disabled
              className="h-7 text-xs bg-muted"
              placeholder="Wird automatisch berechnet"
            />
          </div>
        </div>

        {/* Settlement */}
        <div className="pt-1 border-t">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground">
            <Calculator className="h-3.5 w-3.5" />
            <span className="text-[11px] font-medium">Letzte Abrechnung</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Abrechnungsdatum</Label>
              <Input 
                type="date"
                value={lastSettlementDate || ''} 
                onChange={(e) => onFieldChange('lastSettlementDate', e.target.value)}
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Saldo (€)</Label>
              <Input 
                type="number"
                step="0.01"
                value={lastSettlementBalanceEur || ''} 
                onChange={(e) => onFieldChange('lastSettlementBalanceEur', e.target.value ? parseFloat(e.target.value) : undefined)}
                placeholder="positiv = Nachzahlung"
                className="h-7 text-xs"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Umlagefähig p.a. (€)</Label>
              <Input 
                type="number"
                step="0.01"
                value={allocatablePaEur || ''} 
                onChange={(e) => onFieldChange('allocatablePaEur', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Nicht umlagefähig p.a. (€)</Label>
              <Input 
                type="number"
                step="0.01"
                value={nonAllocatablePaEur || ''} 
                onChange={(e) => onFieldChange('nonAllocatablePaEur', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="h-7 text-xs"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
