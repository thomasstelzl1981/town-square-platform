/**
 * AufteilerCalculation — Flip/Partition Calculation (V3 — uses CalcShared)
 * 6 inline-editable sections: Erwerb → Bau → Bauherr → Finanzierung → Exit → Ergebnis + Matrix
 */
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Loader2, RefreshCcw, Save } from 'lucide-react';
import { useRunCalcAufteiler } from '@/hooks/useAcqOffers';
import { calcAufteilerFull } from '@/engines/akquiseCalc/engine';
import type { AufteilerFullParams } from '@/engines/akquiseCalc/spec';
import { DESIGN } from '@/config/designManifest';
import { cn } from '@/lib/utils';
import {
  NumberedSectionCard, EditField, ComputedField, SubtotalRow,
  TotalBanner, ResultBanner, PercentField, fmtCur, fmtSqm,
} from './CalcShared';

interface AufteilerCalculationProps {
  offerId?: string;
  initialData: {
    purchasePrice: number;
    yearlyRent: number;
    units?: number;
    areaSqm?: number;
  };
  temporary?: boolean;
  ancillaryCostPercent?: number;
}

export function AufteilerCalculation({ offerId, initialData, temporary = false, ancillaryCostPercent }: AufteilerCalculationProps) {
  const runCalc = useRunCalcAufteiler();
  const [params, setParams] = React.useState<AufteilerFullParams>({
    purchasePrice: initialData.purchasePrice,
    yearlyRent: initialData.yearlyRent,
    targetYield: 4.0,
    salesCommission: 8.0,
    holdingPeriodMonths: 24,
    ancillaryCostPercent: ancillaryCostPercent ?? 10,
    interestRate: 5.0,
    equityPercent: 30,
    projectCosts: 0,
    renovationCosts: 0,
    partitioningCosts: 0,
    constructionAncillaryPercent: 15,
    marketingCosts: 0,
    projectManagementCosts: 0,
    disagio: 0,
    areaSqm: initialData.areaSqm || 0,
    garageSaleProceeds: 0,
  });

  const set = (key: keyof AufteilerFullParams, v: number) => setParams(p => ({ ...p, [key]: v }));
  const calc = React.useMemo(() => calcAufteilerFull(params), [params]);
  const fb = calc.financingBreakdown;

  const handleSave = () => {
    if (!offerId || temporary) return;
    runCalc.mutate({ offerId, params: params as unknown as Record<string, unknown> });
  };

  return (
    <div className="space-y-3">
      {/* ═══ 1. GRUNDERWERBSKOSTEN ═══ */}
      <NumberedSectionCard number={1} title="Grunderwerbskosten">
        <EditField label="Kaufpreis" value={params.purchasePrice} onChange={v => set('purchasePrice', v)} suffix="€" />
        <ComputedField label={`Erwerbsnebenkosten (${params.ancillaryCostPercent.toFixed(1)}%)`} value={fmtCur(calc.ancillaryCosts)} hint="aus PLZ-Mapping" />
        <SubtotalRow label="Summe Grunderwerb" value={calc.totalAcquisitionCosts} />
      </NumberedSectionCard>

      {/* ═══ 2. BAU-/SANIERUNGSKOSTEN ═══ */}
      <NumberedSectionCard number={2} title="Bau- / Sanierungskosten">
        <EditField label="Sanierung / Renovierung" value={params.renovationCosts ?? 0} onChange={v => set('renovationCosts', v)} suffix="€" />
        <EditField label="Teilung / WEG-Begründung" value={params.partitioningCosts ?? 0} onChange={v => set('partitioningCosts', v)} suffix="€" />
        <PercentField
          label="Baunebenkosten"
          percent={params.constructionAncillaryPercent ?? 0}
          onPercentChange={v => set('constructionAncillaryPercent', v)}
          computedAmount={calc.constructionAncillaryCosts}
        />
        <SubtotalRow label="Summe Bau/NK" value={calc.totalConstructionCosts} sqmValue={params.areaSqm ? fmtSqm(calc.totalConstructionCosts / (params.areaSqm || 1)) : undefined} />
      </NumberedSectionCard>

      {/* ═══ 3. BAUHERRENAUFGABEN ═══ */}
      <NumberedSectionCard number={3} title="Bauherrenaufgaben">
        <EditField label="Projektmanagement" value={params.projectManagementCosts ?? 0} onChange={v => set('projectManagementCosts', v)} suffix="€" />
        <EditField label="Marketing / PR" value={params.marketingCosts ?? 0} onChange={v => set('marketingCosts', v)} suffix="€" />
        <div className="flex items-center justify-between py-1.5">
          <div className="flex-1">
            <span className="text-sm">Vertriebsprovision</span>
            <span className="text-xs text-muted-foreground ml-2">{params.salesCommission.toFixed(1)}%</span>
          </div>
          <div className="w-48">
            <Slider value={[params.salesCommission * 10]} min={30} max={150} step={5} onValueChange={([v]) => set('salesCommission', v / 10)} />
          </div>
        </div>
        <SubtotalRow label="Summe Bauherren" value={calc.totalDeveloperCosts + calc.salesCommissionAmount} />
      </NumberedSectionCard>

      {/* ═══ 4. FINANZIERUNG ═══ */}
      <NumberedSectionCard number={4} title="Finanzierung">
        <div className="flex items-center justify-between py-1.5">
          <div className="flex-1">
            <span className="text-sm">Eigenkapitalquote</span>
            <span className="text-xs text-muted-foreground ml-2">{params.equityPercent}%</span>
          </div>
          <div className="w-48">
            <Slider value={[params.equityPercent]} min={0} max={100} step={5} onValueChange={([v]) => set('equityPercent', v)} />
          </div>
        </div>
        <ComputedField label="Eigenkapital" value={fmtCur(calc.equity)} />
        <ComputedField label="Fremdkapital gesamt" value={fmtCur(calc.loanAmount)} />
        <Separator className="my-1" />
        <div className="flex items-center justify-between py-1.5">
          <div className="flex-1"><span className="text-sm">Zinssatz p.a.</span></div>
          <div className="flex items-center gap-1.5">
            <Input type="number" value={params.interestRate} onChange={e => set('interestRate', parseFloat(e.target.value) || 0)} className="w-20 h-7 text-right text-sm font-medium" step={0.1} />
            <span className="text-xs text-muted-foreground w-4">%</span>
          </div>
        </div>
        <div className="flex items-center justify-between py-1.5">
          <div className="flex-1">
            <span className="text-sm">Haltedauer</span>
            <span className="text-xs text-muted-foreground ml-2">{params.holdingPeriodMonths} Monate</span>
          </div>
          <div className="w-48">
            <Slider value={[params.holdingPeriodMonths]} min={6} max={48} step={1} onValueChange={([v]) => set('holdingPeriodMonths', v)} />
          </div>
        </div>
        <Separator className="my-1" />
        <ComputedField label="Zinsen Grunderwerb" value={`+${fmtCur(fb.interestAcquisition)}`} className="text-destructive" hint={`${params.holdingPeriodMonths} Mo.`} />
        <ComputedField label="Zinsen Baukosten" value={`+${fmtCur(fb.interestConstruction)}`} className="text-destructive" hint="Ø 50% Abruf" />
        <EditField label="Disagio / Bankgebühren" value={params.disagio ?? 0} onChange={v => set('disagio', v)} suffix="€" />
        
        <SubtotalRow label="Summe Finanzierung" value={fb.totalFinancingCosts} />
      </NumberedSectionCard>

      {/* ═══ GESAMTINVESTITION ═══ */}
      <TotalBanner
        value={calc.totalInvestmentGross}
        sqmValue={params.areaSqm ? fmtSqm(calc.costPerSqm) : undefined}
      />

      {/* ═══ 5. EXIT / ERLÖSE ═══ */}
      <NumberedSectionCard number={5} title="Exit / Erlöse">
        <div className="flex items-center justify-between py-1.5">
          <div className="flex-1">
            <span className="text-sm">Zielrendite Endkunde</span>
            <span className="text-xs text-muted-foreground ml-2">{params.targetYield.toFixed(1)}% · Faktor {calc.factor > 0 ? calc.factor.toFixed(1) + 'x' : '–'}</span>
          </div>
          <div className="w-48">
            <Slider value={[params.targetYield * 10]} min={25} max={70} step={1} onValueChange={([v]) => set('targetYield', v / 10)} />
          </div>
        </div>
        <ComputedField label="→ Verkauf Wohnungen (brutto)" value={fmtCur(calc.salesPriceGross)} />
        <ComputedField label={`− Vertriebsprovision (${params.salesCommission.toFixed(1)}%)`} value={`−${fmtCur(calc.salesCommissionAmount)}`} className="text-destructive" />
        <EditField label="+ Garagen / Stellplätze" value={params.garageSaleProceeds ?? 0} onChange={v => set('garageSaleProceeds', v)} suffix="€" />
        <ComputedField label="+ Mieterlöse Haltedauer" value={`+${fmtCur(calc.rentIncome)}`} className="text-emerald-500" />
        <SubtotalRow label="Gesamterlös" value={calc.totalRevenue} />
      </NumberedSectionCard>

      {/* ═══ ERGEBNIS ═══ */}
      <ResultBanner
        positive={calc.profit >= 0}
        items={[
          { label: 'Gewinn', value: fmtCur(calc.profit) },
          { label: 'Gewinnmarge', value: `${calc.profitMargin.toFixed(1)}%` },
          { label: 'ROI auf EK', value: `${calc.roiOnEquity.toFixed(1)}%`, color: calc.roiOnEquity >= 0 ? 'text-amber-500' : 'text-destructive' },
        ]}
      />

      {/* ═══ ALTERNATIVENMATRIX (3×3) ═══ */}
      {calc.alternativenMatrix.length > 0 && (
        <Card className={DESIGN.CARD.BASE}>
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className={cn(DESIGN.TYPOGRAPHY.CARD_TITLE, 'text-sm')}>
              Alternativenmatrix
            </CardTitle>
            <p className="text-xs text-muted-foreground">Baukosten ±10% × Verkaufspreis ±10%</p>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="text-left py-1.5 px-2 text-muted-foreground font-medium">Bau \ Verkauf</th>
                    <th className="text-center py-1.5 px-2 text-muted-foreground font-medium">−10%</th>
                    <th className="text-center py-1.5 px-2 text-muted-foreground font-medium bg-muted/30">Plan</th>
                    <th className="text-center py-1.5 px-2 text-muted-foreground font-medium">+10%</th>
                  </tr>
                </thead>
                <tbody>
                  {[0, 3, 6].map(rowStart => {
                    const cells = calc.alternativenMatrix.slice(rowStart, rowStart + 3);
                    const rowLabel = cells[0]?.constructionLabel || '';
                    const isBaseRow = rowStart === 3;
                    return (
                      <tr key={rowStart} className={isBaseRow ? 'bg-muted/20' : ''}>
                        <td className="py-2 px-2 font-medium text-muted-foreground">{rowLabel}</td>
                        {cells.map((cell, ci) => {
                          const isCenter = isBaseRow && ci === 1;
                          return (
                            <td key={ci} className={cn(
                              'py-2 px-2 text-center',
                              isCenter && 'bg-muted/30 ring-1 ring-primary/20 rounded',
                            )}>
                              <div className={cn('font-semibold tabular-nums', cell.profit >= 0 ? 'text-emerald-600' : 'text-destructive')}>
                                {fmtCur(cell.profit)}
                              </div>
                              <div className="text-muted-foreground">{cell.margin.toFixed(1)}%</div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save / Reset Buttons */}
      {!temporary && offerId && (
        <div className="flex justify-end gap-3">
          <Button variant="outline" size="sm">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Zurücksetzen
          </Button>
          <Button size="sm" onClick={handleSave} disabled={runCalc.isPending}>
            {runCalc.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Kalkulation speichern
          </Button>
        </div>
      )}

      {temporary && (
        <Card className={cn(DESIGN.CARD.BASE, DESIGN.INFO_BANNER.WARNING)}>
          <CardContent className="py-3">
            <p className="text-xs text-muted-foreground">
              <strong>Hinweis:</strong> Diese Kalkulation wird nicht gespeichert.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AufteilerCalculation;
