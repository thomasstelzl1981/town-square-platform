import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Landmark, Percent } from 'lucide-react';

interface EditableFinancingBlockProps {
  bankName?: string;
  loanNumber?: string;
  originalAmountEur?: number;
  outstandingBalanceEur?: number;
  outstandingBalanceAsof?: string;
  interestRatePercent?: number;
  fixedInterestEndDate?: string;
  annuityMonthlyEur?: number;
  repaymentRatePercent?: number;
  specialRepaymentRight?: { enabled: boolean; amountEur?: number };
  contactPerson?: { name?: string; phone?: string; email?: string };
  onFieldChange: (field: string, value: any) => void;
}

export function EditableFinancingBlock({
  bankName,
  loanNumber,
  originalAmountEur,
  outstandingBalanceEur,
  outstandingBalanceAsof,
  interestRatePercent,
  fixedInterestEndDate,
  annuityMonthlyEur,
  repaymentRatePercent,
  specialRepaymentRight,
  contactPerson,
  onFieldChange,
}: EditableFinancingBlockProps) {
  return (
    <Card>
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Landmark className="h-3.5 w-3.5" />
          Finanzierung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 px-4 pb-3">
        {/* Bank Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Bank</Label>
            <Input 
              value={bankName || ''} 
              onChange={(e) => onFieldChange('bankName', e.target.value)}
              placeholder="z.B. Sparkasse"
              className="h-7 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Darlehens-Nr.</Label>
            <Input 
              value={loanNumber || ''} 
              onChange={(e) => onFieldChange('loanNumber', e.target.value)}
              placeholder="z.B. 12345678"
              className="h-7 text-xs"
            />
          </div>
        </div>

        {/* Amounts */}
        <div className="grid grid-cols-2 gap-3 pt-1 border-t">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Urspr. Darlehen (€)</Label>
            <Input 
              type="number"
              step="0.01"
              value={originalAmountEur || ''} 
              onChange={(e) => onFieldChange('originalAmountEur', e.target.value ? parseFloat(e.target.value) : undefined)}
              className="h-7 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Restschuld (€)</Label>
            <Input 
              type="number"
              step="0.01"
              value={outstandingBalanceEur || ''} 
              onChange={(e) => onFieldChange('outstandingBalanceEur', e.target.value ? parseFloat(e.target.value) : undefined)}
              className="h-7 text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Restschuld per</Label>
            <Input 
              type="date"
              value={outstandingBalanceAsof || ''} 
              onChange={(e) => onFieldChange('outstandingBalanceAsof', e.target.value)}
              className="h-7 text-xs"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[11px] text-muted-foreground">Rate mtl. (€)</Label>
            <Input 
              type="number"
              step="0.01"
              value={annuityMonthlyEur || ''} 
              onChange={(e) => onFieldChange('annuityMonthlyEur', e.target.value ? parseFloat(e.target.value) : undefined)}
              className="h-7 text-xs"
            />
          </div>
        </div>

        {/* Interest */}
        <div className="pt-1 border-t">
          <div className="flex items-center gap-2 mb-2 text-muted-foreground">
            <Percent className="h-3.5 w-3.5" />
            <span className="text-[11px] font-medium">Zinskonditionen</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Zinssatz (%)</Label>
              <Input 
                type="number"
                step="0.01"
                value={interestRatePercent || ''} 
                onChange={(e) => onFieldChange('interestRatePercent', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Tilgung (%)</Label>
              <Input 
                type="number"
                step="0.01"
                value={repaymentRatePercent || ''} 
                onChange={(e) => onFieldChange('repaymentRatePercent', e.target.value ? parseFloat(e.target.value) : undefined)}
                className="h-7 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Zinsbindung bis</Label>
              <Input 
                type="date"
                value={fixedInterestEndDate || ''} 
                onChange={(e) => onFieldChange('fixedInterestEndDate', e.target.value)}
                className="h-7 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Special Repayment */}
        <div className="space-y-1">
          <Label className="text-[11px] text-muted-foreground">Sondertilgungsrecht p.a. (€)</Label>
          <Input 
            type="number"
            step="0.01"
            value={specialRepaymentRight?.amountEur || ''} 
            onChange={(e) => onFieldChange('specialRepaymentRight', { 
              enabled: !!e.target.value, 
              amountEur: e.target.value ? parseFloat(e.target.value) : undefined 
            })}
            placeholder="z.B. 10000"
            className="h-7 text-xs"
          />
        </div>

        {/* Contact */}
        <div className="pt-1 border-t">
          <Label className="text-[11px] text-muted-foreground mb-1 block">Ansprechpartner Bank</Label>
          <div className="grid grid-cols-3 gap-3">
            <Input 
              value={contactPerson?.name || ''} 
              onChange={(e) => onFieldChange('loanContactPerson', { ...contactPerson, name: e.target.value })}
              placeholder="Name"
              className="h-7 text-xs"
            />
            <Input 
              value={contactPerson?.phone || ''} 
              onChange={(e) => onFieldChange('loanContactPerson', { ...contactPerson, phone: e.target.value })}
              placeholder="Telefon"
              className="h-7 text-xs"
            />
            <Input 
              type="email"
              value={contactPerson?.email || ''} 
              onChange={(e) => onFieldChange('loanContactPerson', { ...contactPerson, email: e.target.value })}
              placeholder="E-Mail"
              className="h-7 text-xs"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
