import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, Euro } from 'lucide-react';
import type { TenancyStatus, LeaseType, DepositStatus, RentModel } from '@/types/immobilienakte';

interface EditableTenancyBlockProps {
  tenancyStatus: TenancyStatus;
  leaseType: LeaseType;
  tenantName?: string;
  startDate?: string;
  endDate?: string;
  rentColdEur?: number;
  nkAdvanceEur?: number;
  heatingAdvanceEur?: number;
  depositAmountEur?: number;
  depositStatus: DepositStatus;
  paymentDueDay?: number;
  rentModel: RentModel;
  nextRentAdjustmentDate?: string;
  onFieldChange: (field: string, value: any) => void;
}

const STATUS_CONFIG = {
  ACTIVE: { label: 'Aktiv', color: 'bg-green-600' },
  VACANT: { label: 'Leer', color: 'bg-red-500' },
  TERMINATING: { label: 'Kündigung', color: 'bg-amber-500' },
  ENDED: { label: 'Beendet', color: 'bg-gray-500' },
};

const LEASE_TYPES: { value: LeaseType; label: string }[] = [
  { value: 'unbefristet', label: 'Unbefristet' },
  { value: 'befristet', label: 'Befristet' },
  { value: 'staffel', label: 'Staffelmiete' },
  { value: 'index', label: 'Indexmiete' },
  { value: 'gewerbe', label: 'Gewerbe' },
];

const DEPOSIT_STATUSES: { value: DepositStatus; label: string }[] = [
  { value: 'PAID', label: 'Gezahlt' },
  { value: 'OPEN', label: 'Offen' },
  { value: 'PARTIAL', label: 'Teilweise' },
];

const RENT_MODELS: { value: RentModel; label: string }[] = [
  { value: 'FIX', label: 'Festmiete' },
  { value: 'INDEX', label: 'Indexmiete' },
  { value: 'STAFFEL', label: 'Staffelmiete' },
];

export function EditableTenancyBlock({
  tenancyStatus,
  leaseType,
  tenantName,
  startDate,
  endDate,
  rentColdEur,
  nkAdvanceEur,
  heatingAdvanceEur,
  depositAmountEur,
  depositStatus,
  paymentDueDay,
  rentModel,
  nextRentAdjustmentDate,
  onFieldChange,
}: EditableTenancyBlockProps) {
  const rentWarmEur = (rentColdEur || 0) + (nkAdvanceEur || 0) + (heatingAdvanceEur || 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Mietverhältnis
          </span>
          <Badge className={STATUS_CONFIG[tenancyStatus].color}>
            {STATUS_CONFIG[tenancyStatus].label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tenant Info */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Mieter (Name)</Label>
          <Input 
            value={tenantName || ''} 
            disabled
            className="bg-muted"
            placeholder="Wird über Kontakte verknüpft"
          />
        </div>

        {/* Contract Type & Dates */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Vertragsart</Label>
            <Select value={leaseType} onValueChange={(v) => onFieldChange('leaseType', v as LeaseType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEASE_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Mietbeginn</Label>
            <Input 
              type="date"
              value={startDate || ''} 
              onChange={(e) => onFieldChange('startDate', e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Mietende</Label>
            <Input 
              type="date"
              value={endDate || ''} 
              onChange={(e) => onFieldChange('endDate', e.target.value || undefined)}
            />
          </div>
        </div>

        {/* Rent Components */}
        <div className="pt-2 border-t">
          <div className="flex items-center gap-2 mb-3 text-muted-foreground">
            <Euro className="h-4 w-4" />
            <span className="text-xs font-medium">Miete</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Kaltmiete (€)</Label>
              <Input 
                type="number"
                step="0.01"
                value={rentColdEur || ''} 
                onChange={(e) => onFieldChange('rentColdEur', e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">NK-VZ (€)</Label>
              <Input 
                type="number"
                step="0.01"
                value={nkAdvanceEur || ''} 
                onChange={(e) => onFieldChange('nkAdvanceEur', e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Heiz-VZ (€)</Label>
              <Input 
                type="number"
                step="0.01"
                value={heatingAdvanceEur || ''} 
                onChange={(e) => onFieldChange('heatingAdvanceEur', e.target.value ? parseFloat(e.target.value) : undefined)}
              />
            </div>
          </div>
          <div className="mt-2 p-2 bg-muted rounded text-sm flex justify-between">
            <span className="font-medium">Warmmiete</span>
            <span className="text-primary font-medium">{rentWarmEur.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</span>
          </div>
        </div>

        {/* Deposit & Payment */}
        <div className="grid grid-cols-3 gap-4 pt-2 border-t">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Kaution (€)</Label>
            <Input 
              type="number"
              step="0.01"
              value={depositAmountEur || ''} 
              onChange={(e) => onFieldChange('depositAmountEur', e.target.value ? parseFloat(e.target.value) : undefined)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Kaution-Status</Label>
            <Select value={depositStatus} onValueChange={(v) => onFieldChange('depositStatus', v as DepositStatus)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEPOSIT_STATUSES.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Zahlungstag</Label>
            <Input 
              type="number"
              min={1}
              max={31}
              value={paymentDueDay || ''} 
              onChange={(e) => onFieldChange('paymentDueDay', e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="z.B. 1"
            />
          </div>
        </div>

        {/* Rent Adjustment */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Mietmodell</Label>
            <Select value={rentModel} onValueChange={(v) => onFieldChange('rentModel', v as RentModel)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RENT_MODELS.map(m => (
                  <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Nächste Anpassung frühestens</Label>
            <Input 
              type="date"
              value={nextRentAdjustmentDate || ''} 
              onChange={(e) => onFieldChange('nextRentAdjustmentDate', e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
