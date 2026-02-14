/**
 * Calculator Panel for Projekte Tab
 * MOD-13 PROJEKTE — P0 Redesign
 *
 * Inputs: Investitionskosten, Gesamtverkaufspreis (Ziel), Provision-Slider, Endkundenrendite-Slider, Preisanpassung +/-
 * Outputs: KPIs (Marge, Gewinn/Einheit), horizontal stacked BarChart
 * Persistence: Saves both values to dev_projects table
 */
import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calculator, Save, Minus, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { DemoUnit } from './demoProjectData';

interface CalculatedUnit extends DemoUnit {
  effective_price: number;
  effective_yield: number;
  effective_price_per_sqm: number;
  effective_provision: number;
}

interface StickyCalculatorPanelProps {
  investmentCosts: number;
  totalSaleTarget: number;
  provisionRate: number;
  priceAdjustment: number;
  targetYield: number;
  units: CalculatedUnit[];
  onInvestmentCostsChange: (v: number) => void;
  onTotalSaleTargetChange: (v: number) => void;
  onProvisionChange: (v: number) => void;
  onPriceAdjustment: (v: number) => void;
  onTargetYieldChange: (v: number) => void;
  isDemo?: boolean;
  projectId: string;
}

export function StickyCalculatorPanel({
  investmentCosts,
  totalSaleTarget,
  provisionRate,
  priceAdjustment,
  targetYield,
  units,
  onInvestmentCostsChange,
  onTotalSaleTargetChange,
  onProvisionChange,
  onPriceAdjustment,
  onTargetYieldChange,
  isDemo = false,
  projectId,
}: StickyCalculatorPanelProps) {
  const [costsDraft, setCostsDraft] = useState(investmentCosts.toLocaleString('de-DE'));
  const [saleDraft, setSaleDraft] = useState(totalSaleTarget > 0 ? totalSaleTarget.toLocaleString('de-DE') : '');

  // Sync drafts when props change (e.g. project switch)
  useEffect(() => {
    setCostsDraft(investmentCosts.toLocaleString('de-DE'));
  }, [investmentCosts]);

  useEffect(() => {
    setSaleDraft(totalSaleTarget > 0 ? totalSaleTarget.toLocaleString('de-DE') : '');
  }, [totalSaleTarget]);

  const parseGermanNumber = (s: string): number => {
    const parsed = Number(s.replace(/\./g, '').replace(',', '.'));
    return isNaN(parsed) ? -1 : parsed;
  };

  const calc = useMemo(() => {
    const sumUnits = units.reduce((s, u) => s + u.effective_price, 0);
    const totalSale = totalSaleTarget > 0 ? totalSaleTarget : sumUnits;
    const provisionAbs = totalSale * provisionRate;
    const marginAbs = totalSale - investmentCosts - provisionAbs;
    const marginPct = investmentCosts > 0 ? (marginAbs / investmentCosts) * 100 : 0;
    const profitPerUnit = units.length > 0 ? marginAbs / units.length : 0;

    return { totalSale, sumUnits, provisionAbs, marginAbs, marginPct, profitPerUnit };
  }, [units, investmentCosts, totalSaleTarget, provisionRate]);

  // Stacked bar data — single row with 3 segments
  const barData = useMemo(() => {
    const total = investmentCosts + Math.max(0, calc.provisionAbs) + Math.max(0, calc.marginAbs);
    if (total <= 0) return [{ name: 'Split', invest: 100, provision: 0, marge: 0 }];
    return [{
      name: 'Split',
      invest: (investmentCosts / total) * 100,
      provision: (Math.max(0, calc.provisionAbs) / total) * 100,
      marge: (Math.max(0, calc.marginAbs) / total) * 100,
    }];
  }, [investmentCosts, calc.provisionAbs, calc.marginAbs]);

  const legendItems = [
    { name: 'Investitionskosten', color: 'hsl(var(--muted-foreground))' },
    { name: 'Provision', color: 'hsl(var(--chart-4))' },
    { name: 'Marge', color: 'hsl(var(--primary))' },
  ];

  const fmt = (v: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

  const handleSave = async () => {
    const parsedCosts = parseGermanNumber(costsDraft);
    const parsedSale = saleDraft.trim() === '' ? 0 : parseGermanNumber(saleDraft);

    if (parsedCosts < 0) {
      toast.error('Ungültiger Wert für Investitionskosten');
      return;
    }
    if (parsedSale < 0) {
      toast.error('Ungültiger Wert für Gesamtverkaufspreis');
      return;
    }

    onInvestmentCostsChange(parsedCosts);
    onTotalSaleTargetChange(parsedSale);

    // Persist to DB (skip for demo)
    if (!isDemo && projectId) {
      const { error } = await supabase
        .from('dev_projects')
        .update({
          purchase_price: parsedCosts,
          total_sale_target: parsedSale,
        })
        .eq('id', projectId);

      if (error) {
        console.error('Save failed:', error);
        toast.error('Speichern fehlgeschlagen');
      } else {
        toast.success('Kalkulationsdaten gespeichert');
      }
    } else {
      toast.success('Werte übernommen (Demo)');
    }
  };

  return (
    <Card className="glass-card shadow-card h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary" />
          Kalkulator
          {isDemo && (
            <Badge variant="outline" className="text-xs ml-auto">Demo</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {/* Investment Costs Input */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Investitionskosten</Label>
          <Input
            value={costsDraft}
            onChange={(e) => setCostsDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            className="h-8 text-xs font-medium tabular-nums"
            placeholder="z.B. 4.800.000"
          />
        </div>

        {/* Total Sale Target Input */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Gesamtverkaufspreis (Ziel)</Label>
          <Input
            value={saleDraft}
            onChange={(e) => setSaleDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            className="h-8 text-xs font-medium tabular-nums"
            placeholder="leer = Summe Einheiten"
          />
        </div>

        {/* Single Save Button for both fields */}
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2"
          onClick={handleSave}
        >
          <Save className="h-3.5 w-3.5" />
          Sichern
        </Button>

        {/* Provision Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-baseline">
            <Label className="text-xs text-muted-foreground">Provision (brutto)</Label>
            <span className="text-xs font-bold text-primary tabular-nums">{(provisionRate * 100).toFixed(1)}%</span>
          </div>
          <Slider
            value={[provisionRate * 100]}
            min={5}
            max={15}
            step={0.5}
            onValueChange={([v]) => onProvisionChange(v / 100)}
          />
        </div>

        {/* Target Yield Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-baseline">
            <Label className="text-xs text-muted-foreground">Endkundenrendite</Label>
            <span className="text-xs font-bold text-primary tabular-nums">{(targetYield * 100).toFixed(1)}%</span>
          </div>
          <Slider
            value={[targetYield * 100]}
            min={2}
            max={8}
            step={0.1}
            onValueChange={([v]) => onTargetYieldChange(v / 100)}
          />
        </div>

        {/* Price Adjustment Stepper */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Preisanpassung</Label>
          <div className="flex items-center justify-center gap-3">
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              onClick={() => onPriceAdjustment(Math.max(-20, priceAdjustment - 1))}
              disabled={priceAdjustment <= -20}
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <span className={`text-sm font-bold tabular-nums min-w-[50px] text-center ${priceAdjustment > 0 ? 'text-emerald-600' : priceAdjustment < 0 ? 'text-destructive' : ''}`}>
              {priceAdjustment > 0 ? '+' : ''}{priceAdjustment}%
            </span>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8"
              onClick={() => onPriceAdjustment(Math.min(20, priceAdjustment + 1))}
              disabled={priceAdjustment >= 20}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <Separator />

        {/* KPI Grid */}
        <div className="space-y-1.5 text-xs">
          {totalSaleTarget > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Zielverkaufspreis</span>
              <span className="font-medium tabular-nums text-primary">{fmt(totalSaleTarget)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Summe Einheiten</span>
            <span className="font-medium tabular-nums">{fmt(calc.sumUnits)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Gesamtverkauf</span>
            <span className="font-medium tabular-nums font-semibold">{fmt(calc.totalSale)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Investitionskosten</span>
            <span className="font-medium tabular-nums">{fmt(investmentCosts)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Provision ({(provisionRate * 100).toFixed(1)}%)</span>
            <span className="font-medium tabular-nums text-amber-600">{fmt(calc.provisionAbs)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>Marge</span>
            <span className={calc.marginPct >= 15 ? 'text-emerald-600' : calc.marginPct >= 0 ? 'text-amber-600' : 'text-destructive'}>
              {fmt(calc.marginAbs)} ({calc.marginPct.toFixed(1)}%)
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Gewinn / Einheit</span>
            <span className="font-medium tabular-nums">{fmt(calc.profitPerUnit)}</span>
          </div>
        </div>

        <Separator />

        {/* Horizontal stacked bar chart */}
        <div>
          <div className="h-[40px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <XAxis type="number" hide domain={[0, 100]} />
                <YAxis type="category" dataKey="name" hide />
                <Tooltip
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                  contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                />
                <Bar dataKey="invest" stackId="a" fill="hsl(var(--muted-foreground))" radius={[4, 0, 0, 4]} name="Investitionskosten" />
                <Bar dataKey="provision" stackId="a" fill="hsl(var(--chart-4))" radius={0} name="Provision" />
                <Bar dataKey="marge" stackId="a" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Marge" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-3 mt-1">
            {legendItems.map((d) => (
              <div key={d.name} className="flex items-center gap-1 text-xs text-muted-foreground">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                {d.name}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
