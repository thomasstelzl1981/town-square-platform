/**
 * R-5: Section D — Finanzierungsplan (Financing Plan)
 */
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PiggyBank, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SectionHeader, FormField, CurrencyInput, PercentInput } from './anfrageFormPrimitives';
import { fixedRatePeriodOptions, type FinanceRequestData } from './anfrageFormTypes';

interface Props {
  formData: Partial<FinanceRequestData>;
  updateField: <K extends keyof FinanceRequestData>(field: K, value: FinanceRequestData[K]) => void;
  isReadOnly: boolean;
  totalCosts: number;
  financingGap: number;
}

export function AnfrageFormSectionD({ formData, updateField, isReadOnly, totalCosts, financingGap }: Props) {
  return (
    <Card>
      <CardContent className="pt-6">
        <SectionHeader icon={PiggyBank} sectionLetter="D" title="Finanzierungsplan" description="Eigenkapital und Darlehenswunsch" />
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <FormField label="Eigenkapital" required hint="Guthaben, Bausparverträge, etc.">
              <CurrencyInput value={formData.equity_amount ?? null} onChange={(v) => updateField('equity_amount', v)} disabled={isReadOnly} />
            </FormField>
            <FormField label="Gewünschter Darlehensbetrag" required>
              <CurrencyInput value={formData.loan_amount_requested ?? null} onChange={(v) => updateField('loan_amount_requested', v)} disabled={isReadOnly} />
            </FormField>
          </div>

          {totalCosts > 0 && (
            <div className={cn(
              "p-4 rounded-lg border",
              financingGap === formData.loan_amount_requested ? "border-primary/30 bg-primary/5" : "border-muted-foreground/30 bg-muted"
            )}>
              <div className="flex items-center gap-2 text-sm">
                <Info className="h-4 w-4" />
                <span>
                  Finanzierungsbedarf: <strong>{financingGap.toLocaleString('de-DE')} €</strong>
                  {financingGap !== formData.loan_amount_requested && (
                    <span className="ml-2 text-muted-foreground">(Darlehenswunsch weicht ab)</span>
                  )}
                </span>
              </div>
            </div>
          )}

          <Separator className="my-4" />

          <div className="grid gap-6 md:grid-cols-3">
            <FormField label="Zinsbindung">
              <Select value={formData.fixed_rate_period_years?.toString() || ''} onValueChange={(v) => updateField('fixed_rate_period_years', v ? Number(v) : null)} disabled={isReadOnly}>
                <SelectTrigger><SelectValue placeholder="Wählen..." /></SelectTrigger>
                <SelectContent>{fixedRatePeriodOptions.map(opt => (<SelectItem key={opt.value} value={opt.value.toString()}>{opt.label}</SelectItem>))}</SelectContent>
              </Select>
            </FormField>
            <FormField label="Anfängliche Tilgung" hint="in % p.a.">
              <PercentInput value={formData.repayment_rate_percent ?? null} onChange={(v) => updateField('repayment_rate_percent', v)} placeholder="2,0" disabled={isReadOnly} />
            </FormField>
            <FormField label="Max. Monatsrate" hint="inkl. Zins & Tilgung">
              <CurrencyInput value={formData.max_monthly_rate ?? null} onChange={(v) => updateField('max_monthly_rate', v)} disabled={isReadOnly} />
            </FormField>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
