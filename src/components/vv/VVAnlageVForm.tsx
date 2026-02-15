/**
 * VVAnlageVForm — 6-section TabularForm for a single property's Anlage V data
 * Uses the Selbstauskunft TabularForm pattern (Label | Value)
 */
import { useState, useEffect } from 'react';
import { TabularFormWrapper, TabularFormRow, TabularFormSection } from '@/components/shared/TabularFormRow';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save, CheckCircle2 } from 'lucide-react';
import { calculatePropertyResult, calculateAfaBasis, calculateAfaAmount } from '@/engines/vvSteuer/engine';
import type { VVPropertyTaxData, VVAnnualManualData } from '@/engines/vvSteuer/spec';
import { cn } from '@/lib/utils';

interface VVAnlageVFormProps {
  taxData: VVPropertyTaxData;
  contextTaxNumber: string;
  onSave: (data: Partial<VVAnnualManualData>, taxRefNumber?: string, ownershipPercent?: number) => void;
  isSaving: boolean;
}

function fmt(n: number): string {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function VVAnlageVForm({ taxData, contextTaxNumber, onSave, isSaving }: VVAnlageVFormProps) {
  const [form, setForm] = useState<VVAnnualManualData>(taxData.manualData);
  const [taxRef, setTaxRef] = useState(taxData.taxReferenceNumber);
  const [ownershipPct, setOwnershipPct] = useState(taxData.ownershipSharePercent);

  useEffect(() => {
    setForm(taxData.manualData);
    setTaxRef(taxData.taxReferenceNumber);
    setOwnershipPct(taxData.ownershipSharePercent);
  }, [taxData.propertyId, taxData.manualData.id]);

  const setField = <K extends keyof VVAnnualManualData>(key: K, value: VVAnnualManualData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const numInput = (key: keyof VVAnnualManualData, placeholder = '0,00') => (
    <Input
      type="number"
      step="0.01"
      className="h-7 border-0 bg-transparent shadow-none focus-visible:ring-1 text-sm px-1 text-right w-32"
      value={form[key] as number || ''}
      onChange={e => setField(key, parseFloat(e.target.value) || 0)}
      placeholder={placeholder}
    />
  );

  // Calculate result with current form data
  const currentTaxData: VVPropertyTaxData = { ...taxData, manualData: form, ownershipSharePercent: ownershipPct, taxReferenceNumber: taxRef };
  const result = calculatePropertyResult(currentTaxData);
  const afaBasis = calculateAfaBasis(taxData.purchasePrice, taxData.acquisitionCosts, taxData.afa.buildingSharePercent);
  const afaAmount = calculateAfaAmount(afaBasis, taxData.afa.afaRatePercent);

  const handleSave = () => {
    onSave(form, taxRef, ownershipPct);
  };

  return (
    <div className="space-y-4">
      {/* Sektion 1: Identifikation */}
      <TabularFormWrapper>
        <TabularFormSection title="1. Identifikation" />
        <TabularFormRow label="Objektart">{taxData.propertyType}</TabularFormRow>
        <TabularFormRow label="Adresse">{taxData.address}, {taxData.postalCode} {taxData.city}</TabularFormRow>
        <TabularFormRow label="Baujahr">{taxData.yearBuilt || '—'}</TabularFormRow>
        <TabularFormRow label="FA-Aktenzeichen">
          <Input className="h-7 border-0 bg-transparent shadow-none focus-visible:ring-1 text-sm px-1 w-48" value={taxRef} onChange={e => setTaxRef(e.target.value)} placeholder="z.B. 123/456/78901" />
        </TabularFormRow>
        <TabularFormRow label="StNr Eigentümer">{contextTaxNumber || '—'}</TabularFormRow>
        <TabularFormRow label="Eigentumsanteil %">
          <Input type="number" className="h-7 border-0 bg-transparent shadow-none focus-visible:ring-1 text-sm px-1 text-right w-20" value={ownershipPct} onChange={e => setOwnershipPct(parseFloat(e.target.value) || 100)} />
        </TabularFormRow>
      </TabularFormWrapper>

      {/* Sektion 2: Einnahmen */}
      <TabularFormWrapper>
        <TabularFormSection title="2. Einnahmen" />
        <TabularFormRow label="Kaltmiete p.a.">
          <span className="text-sm text-right w-32 inline-block">{fmt(taxData.incomeAggregated.coldRentAnnual)} €</span>
          <Badge variant="outline" className="ml-2 text-[10px]">auto</Badge>
        </TabularFormRow>
        <TabularFormRow label="NK-Umlagen">
          <span className="text-sm text-right w-32 inline-block">{fmt(taxData.incomeAggregated.nkAdvanceAnnual)} €</span>
          <Badge variant="outline" className="ml-2 text-[10px]">auto</Badge>
        </TabularFormRow>
        <TabularFormRow label="NK-Nachzahlungen">
          <span className="text-sm text-right w-32 inline-block">{fmt(taxData.incomeAggregated.nkNachzahlung)} €</span>
          <Badge variant="outline" className="ml-2 text-[10px]">auto</Badge>
        </TabularFormRow>
        <TabularFormRow label="Sonstige Einnahmen">{numInput('incomeOther')}</TabularFormRow>
        <TabularFormRow label="Versicherungsentsch.">{numInput('incomeInsurancePayout')}</TabularFormRow>
        <TabularFormRow label="Summe Einnahmen">
          <span className="text-sm font-bold text-right w-32 inline-block">{fmt(result.totalIncome)} €</span>
        </TabularFormRow>
      </TabularFormWrapper>

      {/* Sektion 3: Werbungskosten */}
      <TabularFormWrapper>
        <TabularFormSection title="3. Werbungskosten" />
        {/* A) Finanzierung */}
        <TabularFormRow label="  A) Finanzierung" children={null} />
        <TabularFormRow label="Schuldzinsen">
          <span className="text-sm text-right w-32 inline-block">{fmt(taxData.financingAggregated.loanInterestAnnual)} €</span>
          <Badge variant="outline" className="ml-2 text-[10px]">auto</Badge>
        </TabularFormRow>
        <TabularFormRow label="Disagio">{numInput('costDisagio')}</TabularFormRow>
        <TabularFormRow label="Finanzierungskosten">{numInput('costFinancingFees')}</TabularFormRow>
        <TabularFormRow label="Zwischensumme Fin.">
          <span className="text-sm font-medium text-right w-32 inline-block">{fmt(result.costsBreakdown.financing.subtotal)} €</span>
        </TabularFormRow>

        {/* B) Bewirtschaftung */}
        <TabularFormRow label="  B) Bewirtschaftung" children={null} />
        <TabularFormRow label="Grundsteuer">
          <span className="text-sm text-right w-32 inline-block">{fmt(taxData.nkAggregated.grundsteuer)} €</span>
          <Badge variant="outline" className="ml-2 text-[10px]">auto</Badge>
        </TabularFormRow>
        <TabularFormRow label="Nicht umlf. NK">
          <span className="text-sm text-right w-32 inline-block">{fmt(taxData.nkAggregated.nonRecoverableCosts)} €</span>
          <Badge variant="outline" className="ml-2 text-[10px]">auto</Badge>
        </TabularFormRow>
        <TabularFormRow label="Instandhaltung">{numInput('costMaintenance')}</TabularFormRow>
        <TabularFormRow label="Verwalterkosten">{numInput('costManagementFee')}</TabularFormRow>
        <TabularFormRow label="Rechts-/Beratung">{numInput('costLegalAdvisory')}</TabularFormRow>
        <TabularFormRow label="Versicherungen">{numInput('costInsuranceNonRecoverable')}</TabularFormRow>
        <TabularFormRow label="Fahrtkosten">{numInput('costTravel')}</TabularFormRow>
        <TabularFormRow label="Kontogebühren">{numInput('costBankFees')}</TabularFormRow>
        <TabularFormRow label="Sonstige">{numInput('costOther')}</TabularFormRow>
        <TabularFormRow label="Zwischensumme Bew.">
          <span className="text-sm font-medium text-right w-32 inline-block">{fmt(result.costsBreakdown.operating.subtotal)} €</span>
        </TabularFormRow>

        {/* C) AfA */}
        <TabularFormRow label="  C) Abschreibung (AfA)" children={null} />
        <TabularFormRow label="AfA-Basis">
          <span className="text-sm text-right w-32 inline-block">{fmt(afaBasis)} €</span>
          <Badge variant="outline" className="ml-2 text-[10px]">berechnet</Badge>
        </TabularFormRow>
        <TabularFormRow label="AfA-Satz">
          <span className="text-sm text-right w-32 inline-block">{taxData.afa.afaRatePercent} %</span>
        </TabularFormRow>
        <TabularFormRow label="AfA-Betrag">
          <span className="text-sm text-right w-32 inline-block">{fmt(afaAmount)} €</span>
          <Badge variant="outline" className="ml-2 text-[10px]">berechnet</Badge>
        </TabularFormRow>

        <TabularFormRow label="Summe Werbungsk.">
          <span className="text-sm font-bold text-right w-32 inline-block">{fmt(result.totalCosts)} €</span>
        </TabularFormRow>
      </TabularFormWrapper>

      {/* Sektion 4: AfA-Stammdaten */}
      <TabularFormWrapper>
        <TabularFormSection title="4. AfA-Stammdaten" />
        <TabularFormRow label="Kaufpreis gesamt">
          <span className="text-sm text-right w-32 inline-block">{fmt(taxData.purchasePrice)} €</span>
        </TabularFormRow>
        <TabularFormRow label="Gebäudeanteil">
          <span className="text-sm text-right w-32 inline-block">{taxData.afa.buildingSharePercent} % = {fmt(taxData.purchasePrice * taxData.afa.buildingSharePercent / 100)} €</span>
        </TabularFormRow>
        <TabularFormRow label="Grundstücksanteil">
          <span className="text-sm text-right w-32 inline-block">{taxData.afa.landSharePercent} % = {fmt(taxData.purchasePrice * taxData.afa.landSharePercent / 100)} €</span>
        </TabularFormRow>
        <TabularFormRow label="Erwerbsnebenk. (Geb.)">
          <span className="text-sm text-right w-32 inline-block">{fmt(taxData.acquisitionCosts * taxData.afa.buildingSharePercent / 100)} €</span>
        </TabularFormRow>
        <TabularFormRow label="AfA-Beginn">
          <span className="text-sm">{taxData.afa.afaStartDate || '—'}</span>
        </TabularFormRow>
      </TabularFormWrapper>

      {/* Sektion 5: Sonderfälle */}
      <TabularFormWrapper>
        <TabularFormSection title="5. Sonderfälle" />
        <TabularFormRow label="Leerstand (Tage)">
          <Input type="number" className="h-7 border-0 bg-transparent shadow-none focus-visible:ring-1 text-sm px-1 text-right w-20" value={form.vacancyDays || ''} onChange={e => setField('vacancyDays', parseInt(e.target.value) || 0)} placeholder="0" />
        </TabularFormRow>
        <TabularFormRow label="Vermietungsabsicht">
          <Switch checked={form.vacancyIntentConfirmed} onCheckedChange={v => setField('vacancyIntentConfirmed', v)} />
        </TabularFormRow>
        <TabularFormRow label="Angehörigenmiete">
          <Switch checked={form.relativeRental} onCheckedChange={v => setField('relativeRental', v)} />
        </TabularFormRow>
        <TabularFormRow label="Denkmal-AfA">{numInput('heritageAfaAmount')}</TabularFormRow>
        <TabularFormRow label="Sonder-AfA">{numInput('specialAfaAmount')}</TabularFormRow>
      </TabularFormWrapper>

      {/* Sektion 6: Ergebnis */}
      <TabularFormWrapper>
        <TabularFormSection title="6. Ergebnis" />
        <TabularFormRow label="Einnahmen gesamt">
          <span className="text-sm font-semibold text-right w-32 inline-block">{fmt(result.totalIncome)} €</span>
        </TabularFormRow>
        <TabularFormRow label="Werbungskosten ges.">
          <span className="text-sm font-semibold text-right w-32 inline-block">{fmt(result.totalCosts)} €</span>
        </TabularFormRow>
        <TabularFormRow label="Überschuss / Verlust">
          <span className={cn(
            "text-base font-bold text-right w-32 inline-block",
            result.surplus >= 0 ? "text-green-600 dark:text-green-400" : "text-destructive"
          )}>
            {fmt(result.surplus)} €
          </span>
        </TabularFormRow>
      </TabularFormWrapper>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Bestätigt:</span>
          <Switch
            checked={form.confirmed}
            onCheckedChange={v => setField('confirmed', v)}
          />
          {form.confirmed && <CheckCircle2 className="h-4 w-4 text-green-500" />}
        </div>
        <Button onClick={handleSave} disabled={isSaving} size="sm">
          <Save className="h-4 w-4 mr-1" />
          {isSaving ? 'Speichert...' : 'Speichern'}
        </Button>
      </div>
    </div>
  );
}
