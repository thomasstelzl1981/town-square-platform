/**
 * VVAnlageVForm — 6-section TabularForm for a single property's Anlage V data
 * Uses the Selbstauskunft TabularForm pattern (Label | Value)
 * Includes AI plausibility check via sot-vv-prefill-check edge function
 * 
 * Override-Pattern: Auto-calculated values are shown as editable inputs.
 * Badge shows "auto" or "manuell". Reset button restores auto value.
 */
import { useState, useEffect, useCallback } from 'react';
import { TabularFormWrapper, TabularFormRow, TabularFormSection } from '@/components/shared/TabularFormRow';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Save, CheckCircle2, ShieldCheck, Loader2, AlertTriangle, Info, Lightbulb, X, RotateCcw, Banknote } from 'lucide-react';
import { calculatePropertyResult, calculateAfaBasis, calculateAfaAmount } from '@/engines/vvSteuer/engine';
import type { VVPropertyTaxData, VVAnnualManualData } from '@/engines/vvSteuer/spec';
import type { VVOverrides, VVPropertyTaxDataExtended, VVExpenseAggregation } from '@/hooks/useVVSteuerData';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VVAnlageVFormProps {
  taxData: VVPropertyTaxDataExtended;
  contextTaxNumber: string;
  onSave: (data: Partial<VVAnnualManualData>, overrides?: Partial<VVOverrides>, taxRefNumber?: string, ownershipPercent?: number) => void;
  isSaving: boolean;
}

interface PlausibilityResult {
  warnings: Array<{ field: string; message: string; severity: string }>;
  suggestions: Array<{ field: string; message: string; suggestedValue?: number }>;
  missingItems: Array<{ field: string; message: string }>;
  overallAssessment: string;
}

function fmt(n: number): string {
  return n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Editable auto-field with override/reset pattern */
function AutoField({ 
  label, autoValue, overrideValue, onChange, onReset, tooltip 
}: { 
  label?: string;
  autoValue: number; 
  overrideValue: number | null; 
  onChange: (v: number | null) => void;
  onReset: () => void;
  tooltip?: string;
}) {
  const isOverridden = overrideValue !== null;
  const displayValue = isOverridden ? overrideValue : autoValue;

  return (
    <div className="flex items-center gap-1">
      <Input
        type="number"
        step="0.01"
        className="h-7 border-0 bg-transparent shadow-none focus-visible:ring-1 text-sm px-1 text-right w-32"
        value={displayValue || ''}
        onChange={e => {
          const v = parseFloat(e.target.value);
          if (isNaN(v) || v === autoValue) {
            onChange(null); // Reset to auto
          } else {
            onChange(v);
          }
        }}
        placeholder="0,00"
      />
      <span className="text-sm text-muted-foreground">€</span>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant="outline" 
              className={cn(
                "ml-1 text-[10px] cursor-help",
                isOverridden ? "border-amber-400/50 text-amber-600 dark:text-amber-400" : "text-muted-foreground"
              )}
            >
              {isOverridden ? 'manuell' : 'auto'}
            </Badge>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[200px]">
            <p className="text-xs">
              {isOverridden 
                ? `Manuell überschrieben. Auto-Wert: ${fmt(autoValue)} €`
                : tooltip || 'Automatisch berechnet aus Vertragsdaten'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      {isOverridden && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-5 w-5 text-muted-foreground hover:text-foreground"
                onClick={onReset}
              >
                <RotateCcw className="h-3 w-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Auto-Wert wiederherstellen ({fmt(autoValue)} €)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

export function VVAnlageVForm({ taxData, contextTaxNumber, onSave, isSaving }: VVAnlageVFormProps) {
  const { activeTenantId } = useAuth();
  const [form, setForm] = useState<VVAnnualManualData>(taxData.manualData);
  const [overrides, setOverrides] = useState<VVOverrides>(taxData.overrides);
  const [taxRef, setTaxRef] = useState(taxData.taxReferenceNumber);
  const [ownershipPct, setOwnershipPct] = useState(taxData.ownershipSharePercent);
  const [plausibility, setPlausibility] = useState<PlausibilityResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [showPlausibility, setShowPlausibility] = useState(true);
  const [showExpenseBanner, setShowExpenseBanner] = useState(true);

  // Ist-Miete: actual rent payments for this property in the tax year
  const { data: actualRentTotal } = useQuery({
    queryKey: ['ist-miete', taxData.propertyId, activeTenantId],
    queryFn: async () => {
      if (!activeTenantId) return null;
      const { data: units } = await supabase
        .from('units')
        .select('id')
        .eq('property_id', taxData.propertyId)
        .eq('tenant_id', activeTenantId);
      if (!units?.length) return null;

      const unitIds = units.map(u => u.id);
      const { data: leases } = await supabase
        .from('leases')
        .select('id')
        .eq('tenant_id', activeTenantId)
        .in('unit_id', unitIds);
      if (!leases?.length) return null;

      const leaseIds = leases.map(l => l.id);
      const { data: payments } = await supabase
        .from('rent_payments')
        .select('amount')
        .in('lease_id', leaseIds)
        .gte('due_date', `${taxData.manualData.taxYear}-01-01`)
        .lte('due_date', `${taxData.manualData.taxYear}-12-31`)
        .in('status', ['paid', 'partial']);
      if (!payments?.length) return 0;
      return payments.reduce((s, p) => s + (p.amount || 0), 0);
    },
    enabled: !!activeTenantId && !!taxData.propertyId,
  });

  useEffect(() => {
    setForm(taxData.manualData);
    setOverrides(taxData.overrides);
    setTaxRef(taxData.taxReferenceNumber);
    setOwnershipPct(taxData.ownershipSharePercent);
    setPlausibility(null);
    setShowExpenseBanner(true);
  }, [taxData.propertyId, taxData.manualData.id]);

  const setField = <K extends keyof VVAnnualManualData>(key: K, value: VVAnnualManualData[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const setOverride = useCallback(<K extends keyof VVOverrides>(key: K, value: VVOverrides[K]) => {
    setOverrides(prev => ({ ...prev, [key]: value }));
  }, []);

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

  // Build resolved taxData for engine calculation using current overrides
  const resolvedTaxData: VVPropertyTaxData = {
    ...taxData,
    incomeAggregated: {
      coldRentAnnual: overrides.overrideColdRent ?? taxData.autoValues.coldRent,
      nkAdvanceAnnual: overrides.overrideNkAdvance ?? taxData.autoValues.nkAdvance,
      nkNachzahlung: overrides.overrideNkNachzahlung ?? taxData.autoValues.nkNachzahlung,
    },
    financingAggregated: {
      loanInterestAnnual: overrides.overrideLoanInterest ?? taxData.autoValues.loanInterest,
    },
    nkAggregated: {
      grundsteuer: overrides.overrideGrundsteuer ?? taxData.autoValues.grundsteuer,
      nonRecoverableCosts: overrides.overrideNonRecoverable ?? taxData.autoValues.nonRecoverable,
    },
    manualData: form,
    ownershipSharePercent: ownershipPct,
    taxReferenceNumber: taxRef,
  };

  const result = calculatePropertyResult(resolvedTaxData);
  const afaBasis = calculateAfaBasis(taxData.purchasePrice, taxData.acquisitionCosts, taxData.afa.buildingSharePercent);
  const afaAmount = calculateAfaAmount(afaBasis, taxData.afa.afaRatePercent);

  const handleSave = () => {
    onSave(form, overrides, taxRef, ownershipPct);
  };

  const handlePlausibilityCheck = async () => {
    setIsChecking(true);
    setShowPlausibility(true);
    try {
      const { data, error } = await supabase.functions.invoke('sot-vv-prefill-check', {
        body: {
          propertyName: taxData.propertyName,
          address: taxData.address,
          city: taxData.city,
          postalCode: taxData.postalCode,
          areaSqm: taxData.areaSqm ?? null,
          yearBuilt: taxData.yearBuilt,
          purchasePrice: taxData.purchasePrice,
          income: resolvedTaxData.incomeAggregated,
          costs: resolvedTaxData.nkAggregated,
          financing: resolvedTaxData.financingAggregated,
          afa: taxData.afa,
        },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      setPlausibility(data);
    } catch (e: any) {
      toast.error('Plausibilitätsprüfung fehlgeschlagen: ' + (e.message || 'Unbekannter Fehler'));
    } finally {
      setIsChecking(false);
    }
  };

  const applySuggestion = (field: string, value?: number) => {
    if (value === undefined) return;
    const fieldMap: Record<string, keyof VVAnnualManualData> = {
      costMaintenance: 'costMaintenance',
      costManagementFee: 'costManagementFee',
      costInsuranceNonRecoverable: 'costInsuranceNonRecoverable',
      costTravel: 'costTravel',
      costBankFees: 'costBankFees',
      costOther: 'costOther',
      costLegalAdvisory: 'costLegalAdvisory',
    };
    const formField = fieldMap[field];
    if (formField) {
      setField(formField, value);
      toast.success(`${field} auf ${fmt(value)} € gesetzt`);
    }
  };

  // Check if expense aggregation has any values to suggest
  const expAgg = taxData.expenseAggregation;
  const hasExpenseSuggestions = expAgg && Object.values(expAgg).some(v => v > 0);

  const applyExpenseSuggestion = (field: keyof VVExpenseAggregation) => {
    const value = expAgg[field];
    if (value > 0) {
      const formFieldMap: Record<keyof VVExpenseAggregation, keyof VVAnnualManualData> = {
        costMaintenance: 'costMaintenance',
        costInsuranceNonRecoverable: 'costInsuranceNonRecoverable',
        costManagementFee: 'costManagementFee',
        costLegalAdvisory: 'costLegalAdvisory',
        costTravel: 'costTravel',
        costBankFees: 'costBankFees',
        costOther: 'costOther',
      };
      setField(formFieldMap[field], value);
      toast.success(`Wert aus Zahlungsverkehr übernommen: ${fmt(value)} €`);
    }
  };

  const expenseLabels: Record<keyof VVExpenseAggregation, string> = {
    costMaintenance: 'Instandhaltung',
    costInsuranceNonRecoverable: 'Versicherungen',
    costManagementFee: 'Verwalterkosten',
    costLegalAdvisory: 'Rechts-/Beratung',
    costTravel: 'Fahrtkosten',
    costBankFees: 'Kontogebühren',
    costOther: 'Sonstige',
  };

  return (
    <div className="space-y-4">
      {/* Plausibility Banner */}
      {plausibility && showPlausibility && (
        <div className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span className="font-semibold text-sm">KI-Plausibilitätsprüfung</span>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowPlausibility(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {plausibility.overallAssessment && (
            <p className="text-sm text-muted-foreground">{plausibility.overallAssessment}</p>
          )}

          {plausibility.warnings.length > 0 && (
            <div className="space-y-1">
              {plausibility.warnings.map((w, i) => (
                <div key={i} className="flex items-start gap-2 text-sm p-2 rounded bg-destructive/10 text-destructive">
                  <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{w.message}</span>
                </div>
              ))}
            </div>
          )}

          {plausibility.suggestions.length > 0 && (
            <div className="space-y-1">
              {plausibility.suggestions.map((s, i) => (
                <div key={i} className="flex items-start justify-between gap-2 text-sm p-2 rounded bg-primary/10 text-primary">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{s.message}</span>
                  </div>
                  {s.suggestedValue !== undefined && (
                    <Button variant="outline" size="sm" className="h-6 text-xs shrink-0" onClick={() => applySuggestion(s.field, s.suggestedValue)}>
                      Übernehmen: {fmt(s.suggestedValue)} €
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {plausibility.missingItems.length > 0 && (
            <div className="space-y-1">
              {plausibility.missingItems.map((m, i) => (
                <div key={i} className="flex items-start gap-2 text-sm p-2 rounded bg-accent text-accent-foreground">
                  <Info className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{m.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Expense Aggregation Banner */}
      {hasExpenseSuggestions && showExpenseBanner && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-primary" />
              <span className="font-semibold text-sm">Vorschläge aus Zahlungsverkehr</span>
            </div>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowExpenseBanner(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Im Zahlungsverkehr wurden steuerlich relevante Ausgaben erfasst. Sie können diese Werte in die entsprechenden Felder übernehmen.
          </p>
          <div className="space-y-1">
            {(Object.keys(expenseLabels) as Array<keyof VVExpenseAggregation>).map(key => {
              const val = expAgg[key];
              if (val <= 0) return null;
              return (
                <div key={key} className="flex items-center justify-between gap-2 text-sm p-2 rounded bg-card">
                  <div className="flex items-center gap-2">
                    <Banknote className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{expenseLabels[key]}: <strong>{fmt(val)} €</strong></span>
                  </div>
                  <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => applyExpenseSuggestion(key)}>
                    Übernehmen
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sektion 1: Identifikation */}
      <TabularFormWrapper>
        <TabularFormSection title="1. Identifikation" />
        <TabularFormRow label="Objektart">{taxData.propertyType}</TabularFormRow>
        <TabularFormRow label="Adresse">{taxData.address}, {taxData.postalCode} {taxData.city}</TabularFormRow>
        <TabularFormRow label="Wohnfläche">{taxData.areaSqm ? `${taxData.areaSqm.toLocaleString('de-DE')} m²` : '—'}</TabularFormRow>
        <TabularFormRow label="Baujahr">{taxData.yearBuilt || '—'}</TabularFormRow>
        <TabularFormRow label="FA-Aktenzeichen">
          <Input className="h-7 border-0 bg-transparent shadow-none focus-visible:ring-1 text-sm px-1 w-48" value={taxRef} onChange={e => setTaxRef(e.target.value)} placeholder="z.B. 123/456/78901" />
        </TabularFormRow>
        <TabularFormRow label="StNr Eigentümer">{contextTaxNumber || '—'}</TabularFormRow>
        <TabularFormRow label="Eigentumsanteil %">
          <Input type="number" className="h-7 border-0 bg-transparent shadow-none focus-visible:ring-1 text-sm px-1 text-right w-20" value={ownershipPct} onChange={e => setOwnershipPct(parseFloat(e.target.value) || 100)} />
        </TabularFormRow>
      </TabularFormWrapper>

      {/* Sektion 2: Einnahmen — with override-pattern */}
      <TabularFormWrapper>
        <TabularFormSection title="2. Einnahmen" />
        <TabularFormRow label="Kaltmiete p.a.">
          <AutoField 
            autoValue={taxData.autoValues.coldRent}
            overrideValue={overrides.overrideColdRent}
            onChange={v => setOverride('overrideColdRent', v)}
            onReset={() => setOverride('overrideColdRent', null)}
            tooltip="Berechnet aus Mietverträgen (Kaltmiete × 12)"
          />
        </TabularFormRow>
        <TabularFormRow label="NK-Umlagen">
          <AutoField 
            autoValue={taxData.autoValues.nkAdvance}
            overrideValue={overrides.overrideNkAdvance}
            onChange={v => setOverride('overrideNkAdvance', v)}
            onReset={() => setOverride('overrideNkAdvance', null)}
            tooltip="Berechnet aus Mietverträgen (NK-Vorauszahlung × 12)"
          />
        </TabularFormRow>
        <TabularFormRow label="NK-Nachzahlungen">
          <AutoField 
            autoValue={taxData.autoValues.nkNachzahlung}
            overrideValue={overrides.overrideNkNachzahlung}
            onChange={v => setOverride('overrideNkNachzahlung', v)}
            onReset={() => setOverride('overrideNkNachzahlung', null)}
            tooltip="Aus NK-Abrechnung (Nachzahlungssaldo)"
          />
        </TabularFormRow>
        <TabularFormRow label="Sonstige Einnahmen">{numInput('incomeOther')}</TabularFormRow>
        <TabularFormRow label="Versicherungsentsch.">{numInput('incomeInsurancePayout')}</TabularFormRow>
        <TabularFormRow label="Summe Einnahmen">
          <span className="text-sm font-bold text-right w-32 inline-block">{fmt(result.totalIncome)} €</span>
        </TabularFormRow>
      </TabularFormWrapper>

      {/* Ist/Soll-Vergleich Warnung */}
      {actualRentTotal !== null && actualRentTotal !== undefined && (() => {
        const resolvedColdRent = overrides.overrideColdRent ?? taxData.autoValues.coldRent;
        const resolvedNkAdvance = overrides.overrideNkAdvance ?? taxData.autoValues.nkAdvance;
        const sollMiete = resolvedColdRent + resolvedNkAdvance;
        const abweichung = sollMiete - actualRentTotal;
        if (sollMiete > 0 && Math.abs(abweichung) > 50) {
          return (
            <div className={cn(
              "flex items-start gap-2 p-3 rounded-lg border text-sm",
              abweichung > 0
                ? "bg-destructive/5 border-destructive/20 text-destructive"
                : "bg-primary/5 border-primary/20 text-primary"
            )}>
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">
                  {abweichung > 0 ? 'Mietrückstand erkannt' : 'Überzahlung erkannt'}
                </p>
                <p className="text-xs mt-0.5 opacity-80">
                  Soll-Miete (Vertrag): {fmt(sollMiete)} € — Ist-Eingang (Zahlungen): {fmt(actualRentTotal)} € — Differenz: {fmt(Math.abs(abweichung))} €
                </p>
                <p className="text-xs mt-1 opacity-60">
                  Steuerlich wird die Soll-Miete lt. Vertrag angesetzt (§ 21 EStG). Die Ist-Zahlungen dienen nur der Kontrolle.
                </p>
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* Sektion 3: Werbungskosten — with override-pattern for auto-fields */}
      <TabularFormWrapper>
        <TabularFormSection title="3. Werbungskosten" />
        {/* A) Finanzierung */}
        <TabularFormRow label="  A) Finanzierung" children={null} />
        <TabularFormRow label="Schuldzinsen">
          <AutoField 
            autoValue={taxData.autoValues.loanInterest}
            overrideValue={overrides.overrideLoanInterest}
            onChange={v => setOverride('overrideLoanInterest', v)}
            onReset={() => setOverride('overrideLoanInterest', null)}
            tooltip="Berechnet aus Darlehensverträgen. Überschreiben Sie diesen Wert z.B. mit dem Betrag aus der Zinsbestätigung Ihrer Bank."
          />
        </TabularFormRow>
        <TabularFormRow label="Disagio">{numInput('costDisagio')}</TabularFormRow>
        <TabularFormRow label="Finanzierungskosten">{numInput('costFinancingFees')}</TabularFormRow>
        <TabularFormRow label="Zwischensumme Fin.">
          <span className="text-sm font-medium text-right w-32 inline-block">{fmt(result.costsBreakdown.financing.subtotal)} €</span>
        </TabularFormRow>

        {/* B) Bewirtschaftung */}
        <TabularFormRow label="  B) Bewirtschaftung" children={null} />
        <TabularFormRow label="Grundsteuer">
          <AutoField 
            autoValue={taxData.autoValues.grundsteuer}
            overrideValue={overrides.overrideGrundsteuer}
            onChange={v => setOverride('overrideGrundsteuer', v)}
            onReset={() => setOverride('overrideGrundsteuer', null)}
            tooltip="Aus NK-Abrechnung (Kostenart Grundsteuer)"
          />
        </TabularFormRow>
        <TabularFormRow label="Nicht umlf. NK">
          <AutoField 
            autoValue={taxData.autoValues.nonRecoverable}
            overrideValue={overrides.overrideNonRecoverable}
            onChange={v => setOverride('overrideNonRecoverable', v)}
            onReset={() => setOverride('overrideNonRecoverable', null)}
            tooltip="Aus NK-Abrechnung (nicht umlagefähige Kostenarten)"
          />
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
        <TabularFormRow label="AfA-Basis (Gebäude + ENK)">
          <span className="text-sm text-right w-32 inline-block">{fmt(afaBasis)} €</span>
          <Badge variant="outline" className="ml-2 text-[10px]">berechnet</Badge>
        </TabularFormRow>
        <TabularFormRow label="AfA-Satz">
          <div className="flex items-center gap-2">
            <span className="text-sm text-right w-32 inline-block">{taxData.afa.afaRatePercent} %</span>
            <span className="text-[10px] text-muted-foreground">
              {taxData.yearBuilt && taxData.yearBuilt >= 2023 ? '(§ 7 Abs. 4 EStG — 3%)' :
               taxData.yearBuilt && taxData.yearBuilt >= 1925 ? '(§ 7 Abs. 4 EStG — 2%)' :
               '(§ 7 Abs. 4 EStG — 2,5%)'}
            </span>
          </div>
        </TabularFormRow>
        <TabularFormRow label="AfA-Jahresbetrag">
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
          <span className="text-sm text-muted-foreground">Objekt bestätigt:</span>
          <Switch
            checked={form.confirmed}
            onCheckedChange={v => setField('confirmed', v)}
          />
          {form.confirmed && <CheckCircle2 className="h-4 w-4 text-primary" />}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePlausibilityCheck} disabled={isChecking}>
            {isChecking ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-1" />}
            {isChecking ? 'KI prüft Plausibilität…' : 'Plausibilität prüfen'}
          </Button>
          <Button onClick={handleSave} disabled={isSaving} size="sm">
            <Save className="h-4 w-4 mr-1" />
            {isSaving ? 'Wird gespeichert…' : 'Objekt speichern'}
          </Button>
        </div>
      </div>
    </div>
  );
}
