/**
 * BestandCalculation — 30-Year Hold Projection (Unified Card Layout)
 * Uses CalcShared primitives for consistent UI with AufteilerCalculation.
 */
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Loader2, RefreshCcw, Save } from 'lucide-react';
import { useRunCalcBestand } from '@/hooks/useAcqOffers';
import { calcBestandFull } from '@/engines/akquiseCalc/engine';
import type { BestandFullParams } from '@/engines/akquiseCalc/spec';
import { DESIGN } from '@/config/designManifest';
import { cn } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ComposedChart, Line, Bar,
} from 'recharts';
import { MobileChartWrapper } from '@/components/shared/MobileChartWrapper';
import {
  NumberedSectionCard, EditField, ComputedField, SubtotalRow,
  TotalBanner, ResultBanner, PercentField, fmtCur, fmtSqm,
} from './CalcShared';

interface BestandCalculationProps {
  offerId?: string;
  initialData: {
    purchasePrice: number;
    monthlyRent: number;
    units?: number;
    areaSqm?: number;
  };
  temporary?: boolean;
  hideQuickAnalysis?: boolean;
  ancillaryCostPercent?: number;
}

export function BestandCalculation({ offerId, initialData, temporary = false, ancillaryCostPercent }: BestandCalculationProps) {
  const runCalc = useRunCalcBestand();
  const [params, setParams] = React.useState<BestandFullParams>({
    purchasePrice: initialData.purchasePrice,
    monthlyRent: initialData.monthlyRent,
    equityPercent: 20,
    interestRate: 4.0,
    repaymentRate: 2.0,
    rentIncreaseRate: 2.0,
    valueIncreaseRate: 2.0,
    managementCostPercent: 25,
    maintenancePercent: 1.0,
    ancillaryCostPercent: ancillaryCostPercent ?? 10,
    renovationCosts: 0,
    constructionAncillaryPercent: 15,
    areaSqm: initialData.areaSqm || 0,
  });

  const set = (key: keyof BestandFullParams, v: number) => setParams(p => ({ ...p, [key]: v }));
  const calc = React.useMemo(() => calcBestandFull(params), [params]);

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
        <SubtotalRow label="Summe Grunderwerb" value={params.purchasePrice + calc.ancillaryCosts} />
      </NumberedSectionCard>

      {/* ═══ 2. SANIERUNG / MODERNISIERUNG ═══ */}
      <NumberedSectionCard number={2} title="Sanierung / Modernisierung">
        <EditField label="Sanierung / Renovierung" value={params.renovationCosts ?? 0} onChange={v => set('renovationCosts', v)} suffix="€" />
        <PercentField
          label="Baunebenkosten"
          percent={params.constructionAncillaryPercent ?? 15}
          onPercentChange={v => set('constructionAncillaryPercent', v)}
          computedAmount={calc.constructionAncillaryCosts}
        />
        <SubtotalRow
          label="Summe Bau/NK"
          value={calc.totalConstructionCosts}
          sqmValue={params.areaSqm ? fmtSqm(calc.totalConstructionCosts / (params.areaSqm || 1)) : undefined}
        />
      </NumberedSectionCard>

      {/* ═══ 3. FINANZIERUNG ═══ */}
      <NumberedSectionCard number={3} title="Finanzierung">
        {/* Eigenkapitalquote slider */}
        <div className="flex items-center justify-between py-1.5">
          <div className="flex-1">
            <span className="text-sm">Eigenkapitalquote</span>
            <span className="text-xs text-muted-foreground ml-2">{params.equityPercent}%</span>
          </div>
          <div className="w-48">
            <Slider value={[params.equityPercent]} min={5} max={50} step={1} onValueChange={([v]) => set('equityPercent', v)} />
          </div>
        </div>
        <ComputedField label="Eigenkapital" value={fmtCur(calc.equity)} />
        <ComputedField label="Fremdkapital" value={fmtCur(calc.loanAmount)} />
        <Separator className="my-1" />
        {/* Zinssatz */}
        <div className="flex items-center justify-between py-1.5">
          <div className="flex-1"><span className="text-sm">Zinssatz p.a.</span></div>
          <div className="flex items-center gap-1.5">
            <Input type="number" value={params.interestRate} onChange={e => set('interestRate', parseFloat(e.target.value) || 0)} className="w-20 h-7 text-right text-sm font-medium" step={0.1} />
            <span className="text-xs text-muted-foreground w-4">%</span>
          </div>
        </div>
        {/* Tilgung */}
        <div className="flex items-center justify-between py-1.5">
          <div className="flex-1"><span className="text-sm">Tilgung p.a.</span></div>
          <div className="flex items-center gap-1.5">
            <Input type="number" value={params.repaymentRate} onChange={e => set('repaymentRate', parseFloat(e.target.value) || 0)} className="w-20 h-7 text-right text-sm font-medium" step={0.1} />
            <span className="text-xs text-muted-foreground w-4">%</span>
          </div>
        </div>
        <Separator className="my-1" />
        <ComputedField label="Annuität p.a." value={fmtCur(calc.yearlyAnnuity)} />
        <ComputedField label="Rate mtl." value={fmtCur(calc.monthlyRate)} />
        <SubtotalRow label="Summe Finanzierung" value={calc.yearlyAnnuity} />
      </NumberedSectionCard>

      {/* ═══ GESAMTINVESTITION ═══ */}
      <TotalBanner
        value={calc.totalInvestment}
        sqmValue={params.areaSqm ? fmtSqm(calc.costPerSqm) : undefined}
      />

      {/* ═══ 4. KALKULATION (BEWIRTSCHAFTUNG) ═══ */}
      <NumberedSectionCard number={4} title="Bewirtschaftung">
        {/* Verwaltungskosten */}
        <div className="flex items-center justify-between py-1.5">
          <div className="flex-1">
            <span className="text-sm">Verwaltungskosten</span>
            <span className="text-xs text-muted-foreground ml-2">{params.managementCostPercent}%</span>
          </div>
          <div className="w-48">
            <Slider value={[params.managementCostPercent]} min={10} max={40} step={1} onValueChange={([v]) => set('managementCostPercent', v)} />
          </div>
        </div>
        {/* Instandhaltung */}
        <div className="flex items-center justify-between py-1.5">
          <div className="flex-1">
            <span className="text-sm">Instandhaltung</span>
            <span className="text-xs text-muted-foreground ml-2">{params.maintenancePercent.toFixed(1)}%</span>
          </div>
          <div className="w-48">
            <Slider value={[params.maintenancePercent * 10]} min={5} max={30} step={1} onValueChange={([v]) => set('maintenancePercent', v / 10)} />
          </div>
        </div>
        {/* Mietsteigerung */}
        <div className="flex items-center justify-between py-1.5">
          <div className="flex-1">
            <span className="text-sm">Mietsteigerung p.a.</span>
            <span className="text-xs text-muted-foreground ml-2">{params.rentIncreaseRate.toFixed(1)}%</span>
          </div>
          <div className="w-48">
            <Slider value={[params.rentIncreaseRate * 10]} min={0} max={50} step={1} onValueChange={([v]) => set('rentIncreaseRate', v / 10)} />
          </div>
        </div>
        {/* Wertsteigerung */}
        <div className="flex items-center justify-between py-1.5">
          <div className="flex-1">
            <span className="text-sm">Wertsteigerung p.a.</span>
            <span className="text-xs text-muted-foreground ml-2">{params.valueIncreaseRate.toFixed(1)}%</span>
          </div>
          <div className="w-48">
            <Slider value={[params.valueIncreaseRate * 10]} min={0} max={50} step={1} onValueChange={([v]) => set('valueIncreaseRate', v / 10)} />
          </div>
        </div>
        <Separator className="my-1" />
        <ComputedField label="NOI mtl." value={fmtCur(calc.noiMonthly)} className="text-emerald-500" />
        <ComputedField label="Ausgaben mtl." value={fmtCur(calc.monthlyExpenses)} className="text-destructive" />
        <SubtotalRow label="Cashflow mtl." value={calc.monthlyCashflow} />
      </NumberedSectionCard>

      {/* ═══ ERGEBNIS ═══ */}
      <ResultBanner
        positive={calc.monthlyCashflow >= 0}
        items={[
          { label: 'Bruttorendite', value: `${calc.grossYield.toFixed(2)}%` },
          { label: 'Cashflow mtl.', value: fmtCur(calc.monthlyCashflow) },
          { label: 'Cash-on-Cash', value: `${calc.cashOnCash.toFixed(1)}%`, color: calc.cashOnCash >= 0 ? 'text-amber-500' : 'text-destructive' },
          { label: 'ROI auf EK', value: `${calc.roi.toFixed(1)}%`, color: 'text-amber-500' },
        ]}
      />

      {/* ═══ 5. PROJEKTION (Charts) ═══ */}
      <NumberedSectionCard number={5} title="Projektion (30 Jahre)">
        {/* Tilgungsplan */}
        <MobileChartWrapper
          title="Tilgungsplan"
          mobileKPIs={[
            { label: 'Volltilgung', value: `${calc.fullRepaymentYear} J.`, color: 'text-primary' },
            { label: 'Zinsen ges.', value: fmtCur(calc.totalInterest), color: 'text-destructive' },
            { label: 'Tilgung ges.', value: fmtCur(calc.totalRepayment), color: 'text-primary' },
          ]}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={calc.yearlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis yAxisId="left" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => fmtCur(value)} labelFormatter={(label) => `Jahr ${label}`} />
                <Legend />
                <Bar yAxisId="left" dataKey="interest" stackId="a" fill="hsl(var(--destructive))" name="Zinsen" />
                <Bar yAxisId="left" dataKey="repayment" stackId="a" fill="hsl(var(--primary))" name="Tilgung" />
                <Line yAxisId="right" type="monotone" dataKey="remainingDebt" stroke="hsl(var(--muted-foreground))" strokeWidth={2} name="Restschuld" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </MobileChartWrapper>

        <Separator className="my-4" />

        {/* Vermögensentwicklung */}
        <MobileChartWrapper
          title="Vermögensentwicklung"
          mobileKPIs={[
            { label: 'Vermögen 10J', value: fmtCur(calc.wealth10), color: 'text-emerald-500' },
            { label: 'Vermögen 20J', value: fmtCur(calc.wealth20), color: 'text-emerald-500' },
            { label: 'Wert 40J', value: fmtCur(calc.value40), color: 'text-primary' },
          ]}
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={calc.yearlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                <Tooltip formatter={(value: number) => fmtCur(value)} labelFormatter={(label) => `Jahr ${label}`} />
                <Legend />
                <Area type="monotone" dataKey="propertyValue" fill="hsl(var(--primary))" fillOpacity={0.3} stroke="hsl(var(--primary))" name="Objektwert" />
                <Area type="monotone" dataKey="remainingDebt" fill="hsl(var(--destructive))" fillOpacity={0.3} stroke="hsl(var(--destructive))" name="Restschuld" />
                <Area type="monotone" dataKey="equity" fill="hsl(var(--chart-2))" fillOpacity={0.5} stroke="hsl(var(--chart-2))" name="Netto-Vermögen" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </MobileChartWrapper>
      </NumberedSectionCard>

      {/* Save / Reset Buttons */}
      {!temporary && offerId && (
        <div className="flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={() => setParams(p => ({ ...p }))}>
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

export default BestandCalculation;
