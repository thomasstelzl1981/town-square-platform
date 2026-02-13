/**
 * AufteilerCalculation — Flip/Partition Calculation
 * CI-konform: DESIGN Tokens für Farben, Typografie, Cards
 */
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calculator, TrendingUp, Loader2, RefreshCcw, ArrowRight, Euro } from 'lucide-react';
import { useRunCalcAufteiler } from '@/hooks/useAcqOffers';
import { DESIGN } from '@/config/designManifest';
import { cn } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

interface AufteilerCalculationProps {
  offerId?: string;
  initialData: {
    purchasePrice: number;
    yearlyRent: number;
    units?: number;
    areaSqm?: number;
  };
  temporary?: boolean;
}

interface CalcParams {
  purchasePrice: number;
  yearlyRent: number;
  targetYield: number;
  salesCommission: number;
  holdingPeriodMonths: number;
  ancillaryCostPercent: number;
  interestRate: number;
  equityPercent: number;
  projectCosts: number;
}

export function AufteilerCalculation({ offerId, initialData, temporary = false }: AufteilerCalculationProps) {
  const runCalc = useRunCalcAufteiler();
  
  const [params, setParams] = React.useState<CalcParams>({
    purchasePrice: initialData.purchasePrice,
    yearlyRent: initialData.yearlyRent,
    targetYield: 4.0,
    salesCommission: 8.0,
    holdingPeriodMonths: 24,
    ancillaryCostPercent: 10,
    interestRate: 5.0,
    equityPercent: 30,
    projectCosts: 0,
  });

  const calculation = React.useMemo(() => {
    const {
      purchasePrice, yearlyRent, targetYield, salesCommission,
      holdingPeriodMonths, ancillaryCostPercent, interestRate,
      equityPercent, projectCosts
    } = params;

    const ancillaryCosts = purchasePrice * (ancillaryCostPercent / 100);
    const totalAcquisitionCosts = purchasePrice + ancillaryCosts + projectCosts;
    const loanAmount = totalAcquisitionCosts * (1 - equityPercent / 100);
    const equity = totalAcquisitionCosts * (equityPercent / 100);
    const interestCosts = loanAmount * (interestRate / 100) * (holdingPeriodMonths / 12);
    const rentIncome = yearlyRent * (holdingPeriodMonths / 12);
    const netCosts = totalAcquisitionCosts + interestCosts - rentIncome;

    const salesPriceGross = yearlyRent / (targetYield / 100);
    const factor = salesPriceGross / yearlyRent;
    const salesCommissionAmount = salesPriceGross * (salesCommission / 100);
    const salesPriceNet = salesPriceGross - salesCommissionAmount;

    const profit = salesPriceNet - netCosts;
    const profitMargin = salesPriceNet > 0 ? (profit / salesPriceNet) * 100 : 0;
    const roiOnEquity = equity > 0 ? (profit / equity) * 100 : 0;

    const sensitivityData = [
      { yield: targetYield - 0.5, label: `${(targetYield - 0.5).toFixed(1)}%` },
      { yield: targetYield, label: `${targetYield.toFixed(1)}%` },
      { yield: targetYield + 0.5, label: `${(targetYield + 0.5).toFixed(1)}%` },
    ].map(item => {
      const price = yearlyRent / (item.yield / 100);
      const comm = price * (salesCommission / 100);
      const net = price - comm;
      const prof = net - netCosts;
      return { ...item, salesPrice: price, profit: prof };
    });

    return {
      ancillaryCosts, totalAcquisitionCosts, loanAmount, equity,
      interestCosts, rentIncome, netCosts,
      salesPriceGross, factor, salesCommissionAmount, salesPriceNet,
      profit, profitMargin, roiOnEquity, sensitivityData,
    };
  }, [params]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

  const handleSave = () => {
    if (!offerId || temporary) return;
    runCalc.mutate({ offerId, params: params as unknown as Record<string, unknown> });
  };

  return (
    <div className="space-y-6">
      {/* Sliders */}
      <Card className={DESIGN.CARD.BASE}>
        <CardHeader>
          <CardTitle className={cn(DESIGN.TYPOGRAPHY.CARD_TITLE, 'flex items-center gap-2')}>
            <Calculator className="h-5 w-5" />
            Stellschrauben
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Zielrendite Endkunde</Label>
                <span className={DESIGN.TYPOGRAPHY.BODY + ' font-medium'}>{params.targetYield.toFixed(1)}%</span>
              </div>
              <Slider value={[params.targetYield * 10]} min={30} max={60} step={1} onValueChange={([v]) => setParams(p => ({ ...p, targetYield: v / 10 }))} />
              <div className={DESIGN.TYPOGRAPHY.HINT}>Faktor: {(100 / params.targetYield).toFixed(1)}x</div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Vertriebsprovision</Label>
                <span className={DESIGN.TYPOGRAPHY.BODY + ' font-medium'}>{params.salesCommission.toFixed(1)}%</span>
              </div>
              <Slider value={[params.salesCommission * 10]} min={30} max={150} step={5} onValueChange={([v]) => setParams(p => ({ ...p, salesCommission: v / 10 }))} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Vertriebsdauer</Label>
                <span className={DESIGN.TYPOGRAPHY.BODY + ' font-medium'}>{params.holdingPeriodMonths} Monate</span>
              </div>
              <Slider value={[params.holdingPeriodMonths]} min={6} max={48} step={1} onValueChange={([v]) => setParams(p => ({ ...p, holdingPeriodMonths: v }))} />
            </div>
          </div>

          <Separator />

          <div className="grid md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label className={DESIGN.TYPOGRAPHY.HINT}>Erwerbsnebenkosten (%)</Label>
              <Input type="number" value={params.ancillaryCostPercent} onChange={(e) => setParams(p => ({ ...p, ancillaryCostPercent: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div className="space-y-1">
              <Label className={DESIGN.TYPOGRAPHY.HINT}>Zinssatz p.a. (%)</Label>
              <Input type="number" value={params.interestRate} onChange={(e) => setParams(p => ({ ...p, interestRate: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div className="space-y-1">
              <Label className={DESIGN.TYPOGRAPHY.HINT}>Eigenkapitalanteil (%)</Label>
              <Input type="number" value={params.equityPercent} onChange={(e) => setParams(p => ({ ...p, equityPercent: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div className="space-y-1">
              <Label className={DESIGN.TYPOGRAPHY.HINT}>Projektkosten (EUR)</Label>
              <Input type="number" value={params.projectCosts} onChange={(e) => setParams(p => ({ ...p, projectCosts: parseFloat(e.target.value) || 0 }))} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Costs Section */}
      <Card className={DESIGN.CARD.BASE}>
        <CardHeader>
          <CardTitle className={cn(DESIGN.TYPOGRAPHY.CARD_TITLE, 'text-destructive')}>Kosten</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Kaufpreis</span>
              <span className="font-medium">{formatCurrency(params.purchasePrice)}</span>
            </div>
            <div className="flex justify-between">
              <span>Erwerbsnebenkosten</span>
              <span className="font-medium">{formatCurrency(calculation.ancillaryCosts)}</span>
            </div>
            <div className="flex justify-between">
              <span>Projektkosten</span>
              <span className="font-medium">{formatCurrency(params.projectCosts)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Ankaufskosten gesamt</span>
              <span>{formatCurrency(calculation.totalAcquisitionCosts)}</span>
            </div>
            <div className="flex justify-between text-destructive">
              <span>+ Zinskosten ({params.holdingPeriodMonths} Mo.)</span>
              <span className="font-medium">+{formatCurrency(calculation.interestCosts)}</span>
            </div>
            <div className="flex justify-between text-emerald-500">
              <span>− Mieteinnahmen ({params.holdingPeriodMonths} Mo.)</span>
              <span className="font-medium">−{formatCurrency(calculation.rentIncome)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Gesamtkosten netto</span>
              <span>{formatCurrency(calculation.netCosts)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Section */}
      <Card className={DESIGN.CARD.BASE}>
        <CardHeader>
          <CardTitle className={cn(DESIGN.TYPOGRAPHY.CARD_TITLE, 'text-emerald-500')}>Erlöse</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span>Jahressollmiete</span>
              <span className="font-medium">{formatCurrency(params.yearlyRent)}</span>
            </div>
            <div className="flex justify-between">
              <span>Zielrendite Käufer</span>
              <span className="font-medium">{params.targetYield.toFixed(1)}%</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Verkaufserlös brutto</span>
              <span>{formatCurrency(calculation.salesPriceGross)}</span>
            </div>
            <div className={cn(DESIGN.TYPOGRAPHY.HINT, 'text-right')}>
              = Miete / Rendite, Faktor {calculation.factor.toFixed(1)}x
            </div>
            <div className="flex justify-between text-destructive">
              <span>− Vertriebsprovision ({params.salesCommission}%)</span>
              <span className="font-medium">−{formatCurrency(calculation.salesCommissionAmount)}</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold text-emerald-500">
              <span>Verkaufserlös netto</span>
              <span>{formatCurrency(calculation.salesPriceNet)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Result */}
      <Card className={cn(
        DESIGN.CARD.BASE,
        'border-2',
        calculation.profit >= 0 ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-destructive bg-destructive/5'
      )}>
        <CardContent className="py-6">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className={DESIGN.TYPOGRAPHY.MUTED + ' mb-1'}>Gewinn</div>
              <div className={cn(DESIGN.TYPOGRAPHY.VALUE, calculation.profit >= 0 ? 'text-emerald-500' : 'text-destructive')}>
                {formatCurrency(calculation.profit)}
              </div>
            </div>
            <div>
              <div className={DESIGN.TYPOGRAPHY.MUTED + ' mb-1'}>Gewinnmarge auf Erlös</div>
              <div className={cn(DESIGN.TYPOGRAPHY.VALUE, calculation.profitMargin >= 0 ? 'text-emerald-500' : 'text-destructive')}>
                {calculation.profitMargin.toFixed(1)}%
              </div>
            </div>
            <div>
              <div className={DESIGN.TYPOGRAPHY.MUTED + ' mb-1'}>ROI auf EK</div>
              <div className={cn(DESIGN.TYPOGRAPHY.VALUE, calculation.roiOnEquity >= 0 ? 'text-amber-500' : 'text-destructive')}>
                {calculation.roiOnEquity.toFixed(1)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sensitivity Analysis */}
      <Card className={DESIGN.CARD.BASE}>
        <CardHeader>
          <CardTitle className={DESIGN.TYPOGRAPHY.CARD_TITLE}>Sensitivitätsanalyse</CardTitle>
          <CardDescription className={DESIGN.TYPOGRAPHY.HINT}>Auswirkung der Zielrendite auf den Gewinn</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={calculation.sensitivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="profit" name="Gewinn">
                  {calculation.sensitivityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? 'hsl(var(--chart-2))' : 'hsl(var(--destructive))'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4 text-sm text-center">
            {calculation.sensitivityData.map((item, idx) => (
              <div key={idx} className="p-2 rounded bg-muted/50">
                <div className="text-muted-foreground">Bei {item.label} Rendite</div>
                <div className={cn('font-semibold', item.profit >= 0 ? 'text-emerald-500' : 'text-destructive')}>
                  {formatCurrency(item.profit)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      {!temporary && offerId && (
        <div className="flex justify-end gap-3">
          <Button variant="outline">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Zurücksetzen
          </Button>
          <Button onClick={handleSave} disabled={runCalc.isPending}>
            {runCalc.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Kalkulation speichern
          </Button>
        </div>
      )}

      {temporary && (
        <Card className={cn(DESIGN.CARD.BASE, DESIGN.INFO_BANNER.WARNING)}>
          <CardContent className="py-3">
            <p className={DESIGN.TYPOGRAPHY.MUTED}>
              <strong>Hinweis:</strong> Diese Kalkulation wird nicht gespeichert. 
              Um sie zu speichern, erstellen Sie einen Objekteingang.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AufteilerCalculation;
