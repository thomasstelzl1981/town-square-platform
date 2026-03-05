/**
 * R-5: Section C — Kostenzusammenstellung (Cost Breakdown)
 */
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calculator } from 'lucide-react';
import { SectionHeader, FormField, CurrencyInput } from './anfrageFormPrimitives';
import type { FinanceRequestData } from './anfrageFormTypes';

interface Props {
  formData: Partial<FinanceRequestData>;
  updateField: <K extends keyof FinanceRequestData>(field: K, value: FinanceRequestData[K]) => void;
  isReadOnly: boolean;
  totalCosts: number;
}

export function AnfrageFormSectionC({ formData, updateField, isReadOnly, totalCosts }: Props) {
  return (
    <Card>
      <CardContent className="pt-6">
        <SectionHeader icon={Calculator} sectionLetter="C" title="Kostenzusammenstellung" description="Alle Kosten für das Vorhaben" />
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <FormField label="Kaufpreis / Baukosten" required>
              <CurrencyInput value={formData.purchase_price ?? null} onChange={(v) => updateField('purchase_price', v)} placeholder="350.000" disabled={isReadOnly} />
            </FormField>
            <FormField label="Modernisierungskosten">
              <CurrencyInput value={formData.modernization_costs ?? null} onChange={(v) => updateField('modernization_costs', v)} placeholder="0" disabled={isReadOnly} />
            </FormField>
          </div>

          <Separator className="my-4" />

          <div className="grid gap-6 md:grid-cols-3">
            <FormField label="Notar & Grundbuch" hint="ca. 1,5–2%">
              <CurrencyInput value={formData.notary_costs ?? null} onChange={(v) => updateField('notary_costs', v)} disabled={isReadOnly} />
            </FormField>
            <FormField label="Grunderwerbsteuer" hint="3,5–6,5% je Bundesland">
              <CurrencyInput value={formData.transfer_tax ?? null} onChange={(v) => updateField('transfer_tax', v)} disabled={isReadOnly} />
            </FormField>
            <FormField label="Maklerprovision">
              <CurrencyInput value={formData.broker_fee ?? null} onChange={(v) => updateField('broker_fee', v)} disabled={isReadOnly} />
            </FormField>
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <span className="font-medium">Gesamtkosten</span>
              <span className="text-xl font-bold">{totalCosts.toLocaleString('de-DE')} €</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
