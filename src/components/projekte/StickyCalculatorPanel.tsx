/**
 * Calculator Panel for Projekte Tab
 * MOD-13 PROJEKTE — P0 Redesign
 *
 * Inputs: Investitionskosten, Provision-Slider, Endkundenrendite-Slider, Preisanpassung +/-
 * Outputs: KPIs (Marge, Gewinn/Einheit), horizontal stacked BarChart
 */
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Calculator, Save, Minus, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import type { DemoUnit } from './demoProjectData';

interface CalculatedUnit extends DemoUnit {
  effective_price: number;
  effective_yield: number;
  effective_price_per_sqm: number;
  effective_provision: number;
}

interface StickyCalculatorPanelProps {
  investmentCosts: number;
  provisionRate: number;
  priceAdjustment: number;
  targetYield: number;
  units: CalculatedUnit[];
  onInvestmentCostsChange: (v: number) => void;
  onProvisionChange: (v: number) => void;
  onPriceAdjustment: (v: number) => void;
  onTargetYieldChange: (v: number) => void;
  isDemo?: boolean;
}

export function StickyCalculatorPanel({
  investmentCosts,
  provisionRate,
  priceAdjustment,
  targetYield,
  units,
  onInvestmentCostsChange,
  onProvisionChange,
  onPriceAdjustment,
  onTargetYieldChange,
  isDemo = false,
}: StickyCalculatorPanelProps) {
  const [costsDraft, setCostsDraft] = useState(investmentCosts.toLocaleString('de-DE'));

  const calc = useMemo(() => {
    const totalSale = units.reduce((s, u) => s + u.effective_price, 0);
    const provisionAbs = totalSale * provisionRate;
    const marginAbs = totalSale - investmentCosts - provisionAbs;
    const marginPct = totalSale > 0 ? (marginAbs / totalSale) * 100 : 0;
    const profitPerUnit = units.length > 0 ? marginAbs / units.length : 0;

    return { totalSale, provisionAbs, marginAbs, marginPct, profitPerUnit };
  }, [units, investmentCosts, provisionRate]);

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

  const handleSaveCosts = () => {
    const parsed = Number(costsDraft.replace(/\./g, '').replace(',', '.'));
    if (!isNaN(parsed) && parsed >= 0) {
      onInvestmentCostsChange(parsed);
    }
  };

  return (
    <Card className="glass-card shadow-card h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary" />
          Kalkulator
          {isDemo && (
            <Badge variant="outline" className="text-[10px] ml-auto">Demo</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {/* Investment Costs Input */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Investitionskosten</Label>
          <div className="flex gap-1.5">
            <Input
              value={costsDraft}
              onChange={(e) => setCostsDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveCosts()}
              className="h-8 text-xs font-medium tabular-nums"
              placeholder="z.B. 4.800.000"
            />
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 shrink-0"
              onClick={handleSaveCosts}
              title="Sichern"
            >
              <Save className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

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
          <div className="flex justify-between">
            <span className="text-muted-foreground">Gesamtverkauf</span>
            <span className="font-medium tabular-nums">{fmt(calc.totalSale)}</span>
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
              <div key={d.name} className="flex items-center gap-1 text-[9px] text-muted-foreground">
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
