/**
 * ProjectAufteilerCalculation — Interactive Developer Calculation with Sliders
 * MOD-13 PROJEKTE — Block D
 * 
 * Pattern: Adapted from MOD-12 AufteilerCalculation
 * Start-Setup: 25% target margin, 3% commission default
 */
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Calculator, Loader2, RefreshCcw, Save, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import type { DevProject, DevProjectUnit } from '@/types/projekte';

interface ProjectAufteilerCalculationProps {
  project: DevProject;
  units: DevProjectUnit[];
}

interface CalcParams {
  purchasePrice: number;
  renovationBudget: number;
  targetYield: number;
  salesCommission: number;
  holdingPeriodMonths: number;
  ancillaryCostPercent: number;
  interestRate: number;
  equityPercent: number;
}

export function ProjectAufteilerCalculation({ project, units }: ProjectAufteilerCalculationProps) {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = React.useState(false);

  // Derive defaults from project + units
  const totalListPrice = units.reduce((sum, u) => sum + (u.list_price || 0), 0);
  const totalYearlyRent = units.reduce((sum, u) => sum + ((u.current_rent || 0) * 12), 0);

  // Start-Setup: If no purchase_price, use sum of unit list prices / 1.25 (25% margin target)
  const defaultPurchasePrice = project.purchase_price || Math.round(totalListPrice / 1.25 * 0.72); // rough estimate

  const [params, setParams] = React.useState<CalcParams>({
    purchasePrice: project.purchase_price || defaultPurchasePrice,
    renovationBudget: project.renovation_budget || 0,
    targetYield: 4.0,
    salesCommission: project.commission_rate_percent || 3.0,
    holdingPeriodMonths: project.holding_period_months || 24,
    ancillaryCostPercent: project.ancillary_cost_percent || 10,
    interestRate: 5.0,
    equityPercent: 30,
  });

  // Live calculation
  const calc = React.useMemo(() => {
    const {
      purchasePrice, renovationBudget, targetYield, salesCommission,
      holdingPeriodMonths, ancillaryCostPercent, interestRate, equityPercent
    } = params;

    // --- KOSTEN ---
    const ancillaryCosts = purchasePrice * (ancillaryCostPercent / 100);
    const totalAcquisitionCosts = purchasePrice + ancillaryCosts + renovationBudget;

    const loanAmount = totalAcquisitionCosts * (1 - equityPercent / 100);
    const equity = totalAcquisitionCosts * (equityPercent / 100);
    const interestCosts = loanAmount * (interestRate / 100) * (holdingPeriodMonths / 12);

    const rentIncome = totalYearlyRent * (holdingPeriodMonths / 12);
    const netCosts = totalAcquisitionCosts + interestCosts - rentIncome;

    // --- ERLÖSE ---
    // If units have list prices, use sum; otherwise derive from yield
    const salesPriceGross = totalListPrice > 0
      ? totalListPrice
      : (totalYearlyRent > 0 ? totalYearlyRent / (targetYield / 100) : 0);
    const salesCommissionAmount = salesPriceGross * (salesCommission / 100);
    const salesPriceNet = salesPriceGross - salesCommissionAmount;

    // --- ERGEBNIS ---
    const profit = salesPriceNet - netCosts;
    const profitMargin = netCosts > 0 ? (profit / netCosts) * 100 : 0;
    const roiOnEquity = equity > 0 ? (profit / equity) * 100 : 0;
    const profitPerUnit = units.length > 0 ? profit / units.length : 0;
    const avgUnitPrice = units.length > 0 ? salesPriceGross / units.length : 0;
    const breakEvenUnits = avgUnitPrice > 0
      ? Math.ceil(netCosts / (avgUnitPrice * (1 - salesCommission / 100)))
      : units.length;

    // --- SENSITIVITÄT ---
    const sensitivityData = [-0.5, 0, 0.5].map(delta => {
      const y = targetYield + delta;
      const sp = totalYearlyRent > 0 ? totalYearlyRent / (y / 100) : salesPriceGross;
      const comm = sp * (salesCommission / 100);
      const net = sp - comm;
      const prof = net - netCosts;
      return { yield: y, label: `${y.toFixed(1)}%`, salesPrice: sp, profit: prof };
    });

    return {
      ancillaryCosts, totalAcquisitionCosts, loanAmount, equity,
      interestCosts, rentIncome, netCosts,
      salesPriceGross, salesCommissionAmount, salesPriceNet,
      profit, profitMargin, roiOnEquity, profitPerUnit, breakEvenUnits,
      sensitivityData,
    };
  }, [params, totalListPrice, totalYearlyRent, units.length]);

  const fmt = (val: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update project with calculation inputs
      const { error: projError } = await supabase
        .from('dev_projects')
        .update({
          purchase_price: params.purchasePrice,
          renovation_budget: params.renovationBudget,
          commission_rate_percent: params.salesCommission,
          holding_period_months: params.holdingPeriodMonths,
          ancillary_cost_percent: params.ancillaryCostPercent,
          total_sale_target: Math.round(calc.salesPriceGross),
        })
        .eq('id', project.id);

      if (projError) throw projError;

      // Upsert active calculation
      const { error: calcError } = await supabase
        .from('dev_project_calculations')
        .upsert({
          project_id: project.id,
          calculation_name: 'Hauptkalkulation',
          purchase_price: params.purchasePrice,
          ancillary_cost_percent: params.ancillaryCostPercent,
          renovation_total: params.renovationBudget,
          sales_commission_percent: params.salesCommission,
          holding_period_months: params.holdingPeriodMonths,
          financing_rate_percent: params.interestRate,
          financing_ltv_percent: 100 - params.equityPercent,
          total_investment: calc.totalAcquisitionCosts,
          total_sale_proceeds: Math.round(calc.salesPriceGross),
          gross_profit: calc.profit,
          net_profit: Math.round(calc.profit - calc.interestCosts),
          profit_margin_percent: Math.round(calc.profitMargin * 100) / 100,
          annualized_return: params.holdingPeriodMonths > 0
            ? Math.round((calc.profitMargin / params.holdingPeriodMonths) * 12 * 100) / 100
            : 0,
          profit_per_unit: Math.round(calc.profitPerUnit),
          break_even_units: calc.breakEvenUnits,
          is_active: true,
          calculated_at: new Date().toISOString(),
        }, {
          onConflict: 'project_id,is_active',
          ignoreDuplicates: false,
        });

      if (calcError) {
        // Fallback: insert if upsert fails
        await supabase.from('dev_project_calculations').insert({
          project_id: project.id,
          calculation_name: 'Hauptkalkulation',
          purchase_price: params.purchasePrice,
          ancillary_cost_percent: params.ancillaryCostPercent,
          renovation_total: params.renovationBudget,
          sales_commission_percent: params.salesCommission,
          holding_period_months: params.holdingPeriodMonths,
          financing_rate_percent: params.interestRate,
          financing_ltv_percent: 100 - params.equityPercent,
          total_investment: calc.totalAcquisitionCosts,
          total_sale_proceeds: Math.round(calc.salesPriceGross),
          gross_profit: calc.profit,
          net_profit: Math.round(calc.profit - calc.interestCosts),
          profit_margin_percent: Math.round(calc.profitMargin * 100) / 100,
          annualized_return: params.holdingPeriodMonths > 0
            ? Math.round((calc.profitMargin / params.holdingPeriodMonths) * 12 * 100) / 100
            : 0,
          profit_per_unit: Math.round(calc.profitPerUnit),
          break_even_units: calc.breakEvenUnits,
          is_active: true,
          calculated_at: new Date().toISOString(),
        });
      }

      queryClient.invalidateQueries({ queryKey: ['dev-projects'] });
      toast.success('Kalkulation gespeichert');
    } catch (err) {
      toast.error('Fehler beim Speichern', {
        description: err instanceof Error ? err.message : 'Unbekannter Fehler',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setParams({
      purchasePrice: project.purchase_price || defaultPurchasePrice,
      renovationBudget: project.renovation_budget || 0,
      targetYield: 4.0,
      salesCommission: project.commission_rate_percent || 3.0,
      holdingPeriodMonths: project.holding_period_months || 24,
      ancillaryCostPercent: project.ancillary_cost_percent || 10,
      interestRate: 5.0,
      equityPercent: 30,
    });
  };

  return (
    <div className="space-y-6">
      {/* ── Stellschrauben (Sliders) ────────────────────────────── */}
      <Card className="glass-card shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Stellschrauben
          </CardTitle>
          <CardDescription>
            Passen Sie die Parameter an — die Kalkulation aktualisiert sich sofort
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 3 Sliders */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Target Yield */}
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <Label className="text-sm">Zielrendite Endkunde</Label>
                <span className="text-sm font-bold text-primary tabular-nums">
                  {params.targetYield.toFixed(1)}%
                </span>
              </div>
              <Slider
                value={[params.targetYield * 10]}
                min={25}
                max={80}
                step={1}
                onValueChange={([v]) => setParams(p => ({ ...p, targetYield: v / 10 }))}
                className="py-1"
              />
              <div className="text-xs text-muted-foreground">
                Faktor: {params.targetYield > 0 ? (100 / params.targetYield).toFixed(1) : '—'}x
              </div>
            </div>

            {/* Sales Commission */}
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <Label className="text-sm">Vertriebsprovision</Label>
                <span className="text-sm font-bold text-primary tabular-nums">
                  {params.salesCommission.toFixed(1)}%
                </span>
              </div>
              <Slider
                value={[params.salesCommission * 10]}
                min={10}
                max={150}
                step={5}
                onValueChange={([v]) => setParams(p => ({ ...p, salesCommission: v / 10 }))}
                className="py-1"
              />
            </div>

            {/* Holding Period */}
            <div className="space-y-3">
              <div className="flex justify-between items-baseline">
                <Label className="text-sm">Vertriebsdauer</Label>
                <span className="text-sm font-bold text-primary tabular-nums">
                  {params.holdingPeriodMonths} Monate
                </span>
              </div>
              <Slider
                value={[params.holdingPeriodMonths]}
                min={3}
                max={60}
                step={1}
                onValueChange={([v]) => setParams(p => ({ ...p, holdingPeriodMonths: v }))}
                className="py-1"
              />
            </div>
          </div>

          <Separator />

          {/* Input Fields */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="space-y-1.5 col-span-2 md:col-span-1">
              <Label className="text-xs text-muted-foreground">Kaufpreis (EUR)</Label>
              <Input
                type="number"
                value={params.purchasePrice || ''}
                onChange={(e) => setParams(p => ({ ...p, purchasePrice: parseFloat(e.target.value) || 0 }))}
                className="tabular-nums"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Sanierung (EUR)</Label>
              <Input
                type="number"
                value={params.renovationBudget || ''}
                onChange={(e) => setParams(p => ({ ...p, renovationBudget: parseFloat(e.target.value) || 0 }))}
                className="tabular-nums"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Nebenkosten (%)</Label>
              <Input
                type="number"
                value={params.ancillaryCostPercent}
                onChange={(e) => setParams(p => ({ ...p, ancillaryCostPercent: parseFloat(e.target.value) || 0 }))}
                className="tabular-nums"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Zinssatz (%)</Label>
              <Input
                type="number"
                value={params.interestRate}
                onChange={(e) => setParams(p => ({ ...p, interestRate: parseFloat(e.target.value) || 0 }))}
                className="tabular-nums"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">EK-Anteil (%)</Label>
              <Input
                type="number"
                value={params.equityPercent}
                onChange={(e) => setParams(p => ({ ...p, equityPercent: parseFloat(e.target.value) || 0 }))}
                className="tabular-nums"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Kosten vs. Erlöse (Side-by-Side) ──────────────────── */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* KOSTEN */}
        <Card className="glass-card shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-destructive flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-destructive" />
              Kosten
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kaufpreis</span>
                <span className="font-medium tabular-nums">{fmt(params.purchasePrice)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">+ Erwerbsnebenkosten</span>
                <span className="font-medium tabular-nums">{fmt(calc.ancillaryCosts)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">+ Sanierung</span>
                <span className="font-medium tabular-nums">{fmt(params.renovationBudget)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>= Investition gesamt</span>
                <span className="tabular-nums">{fmt(calc.totalAcquisitionCosts)}</span>
              </div>
              <div className="flex justify-between text-destructive">
                <span>+ Zinsen ({params.holdingPeriodMonths} Mo.)</span>
                <span className="font-medium tabular-nums">+{fmt(calc.interestCosts)}</span>
              </div>
              {totalYearlyRent > 0 && (
                <div className="flex justify-between text-status-success">
                  <span>− Mieteinnahmen</span>
                  <span className="font-medium tabular-nums">−{fmt(calc.rentIncome)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-base font-bold">
                <span>Gesamtkosten netto</span>
                <span className="tabular-nums">{fmt(calc.netCosts)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ERLÖSE */}
        <Card className="glass-card shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-status-success flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-status-success" />
              Erlöse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between font-semibold">
                <span>Verkaufserlös brutto</span>
                <span className="tabular-nums">{fmt(calc.salesPriceGross)}</span>
              </div>
              {totalYearlyRent > 0 && (
                <div className="text-xs text-muted-foreground text-right">
                  Jahresnettokaltmiete {fmt(totalYearlyRent)} × Faktor {params.targetYield > 0 ? (100 / params.targetYield).toFixed(1) : '—'}
                </div>
              )}
              <div className="flex justify-between text-destructive">
                <span>− Provision ({params.salesCommission.toFixed(1)}%)</span>
                <span className="font-medium tabular-nums">−{fmt(calc.salesCommissionAmount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-base font-bold text-status-success">
                <span>Verkaufserlös netto</span>
                <span className="tabular-nums">{fmt(calc.salesPriceNet)}</span>
              </div>
              <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
                <div className="flex justify-between text-muted-foreground">
                  <span>Gewinn/Einheit</span>
                  <span className="font-medium tabular-nums">{fmt(calc.profitPerUnit)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Break-Even</span>
                  <span className="font-medium tabular-nums">{calc.breakEvenUnits} von {units.length} Einheiten</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Hero Result Card ──────────────────────────────────── */}
      <Card className={`shadow-elevated border-2 transition-colors ${
        calc.profit >= 0 
          ? 'border-status-success/50 bg-status-success/5' 
          : 'border-destructive/50 bg-destructive/5'
      }`}>
        <CardContent className="py-8">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-sm text-muted-foreground mb-2">Gewinn</div>
              <div className={`text-kpi tabular-nums ${calc.profit >= 0 ? 'text-status-success' : 'text-destructive'}`}>
                {fmt(calc.profit)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-2">Marge</div>
              <div className={`text-kpi tabular-nums ${calc.profitMargin >= 0 ? 'text-status-success' : 'text-destructive'}`}>
                {calc.profitMargin.toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-2">ROI auf EK</div>
              <div className={`text-kpi tabular-nums ${calc.roiOnEquity >= 0 ? 'text-status-warn' : 'text-destructive'}`}>
                {calc.roiOnEquity.toFixed(1)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Sensitivitätsanalyse ──────────────────────────────── */}
      {totalYearlyRent > 0 && (
        <Card className="glass-card shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Sensitivitätsanalyse
            </CardTitle>
            <CardDescription>Gewinn bei verschiedenen Endkunden-Renditen</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={calc.sensitivityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip formatter={(value: number) => fmt(value)} />
                  <Bar dataKey="profit" name="Gewinn" radius={[4, 4, 0, 0]}>
                    {calc.sensitivityData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.profit >= 0 ? 'hsl(var(--status-success))' : 'hsl(var(--destructive))'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3 text-sm text-center">
              {calc.sensitivityData.map((item, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-muted/50">
                  <div className="text-xs text-muted-foreground">Bei {item.label}</div>
                  <div className={`font-semibold tabular-nums ${item.profit >= 0 ? 'text-status-success' : 'text-destructive'}`}>
                    {fmt(item.profit)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Save / Reset ─────────────────────────────────────── */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={handleReset} className="gap-2">
          <RefreshCcw className="h-4 w-4" />
          Zurücksetzen
        </Button>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Kalkulation speichern
        </Button>
      </div>
    </div>
  );
}
