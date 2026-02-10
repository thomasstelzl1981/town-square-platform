/**
 * Calculator Panel for Projekte Tab
 * MOD-13 PROJEKTE — P0 Redesign
 *
 * Inputs: Investitionskosten, Provision-Slider, Preisanpassung +/-
 * Outputs: PieChart, KPIs (Marge, Gewinn/Einheit, Ø Rendite)
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
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
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
  units: CalculatedUnit[];
  onInvestmentCostsChange: (v: number) => void;
  onProvisionChange: (v: number) => void;
  onPriceAdjustment: (v: number) => void;
  isDemo?: boolean;
}

export function StickyCalculatorPanel({
  investmentCosts,
  provisionRate,
  priceAdjustment,
  units,
  onInvestmentCostsChange,
  onProvisionChange,
  onPriceAdjustment,
  isDemo = false,
}: StickyCalculatorPanelProps) {
  const [costsDraft, setCostsDraft] = useState(investmentCosts.toLocaleString('de-DE'));

  const calc = useMemo(() => {
    const totalSale = units.reduce((s, u) => s + u.effective_price, 0);
    const provisionAbs = totalSale * provisionRate;
    const marginAbs = totalSale - investmentCosts - provisionAbs;
    const marginPct = totalSale > 0 ? (marginAbs / totalSale) * 100 : 0;
    const profitPerUnit = units.length > 0 ? marginAbs / units.length : 0;
    const avgYield = units.length > 0
      ? units.reduce((s, u) => s + u.effective_yield, 0) / units.length
      : 0;
    const costsPct = totalSale > 0 ? (investmentCosts / totalSale) * 100 : 0;
    const provPct = provisionRate * 100;

    return { totalSale, provisionAbs, marginAbs, marginPct, profitPerUnit, avgYield, costsPct, provPct };
  }, [units, investmentCosts, provisionRate]);

  const pieData = [
    { name: 'Investitionskosten', value: Math.max(0, investmentCosts), color: 'hsl(var(--muted-foreground))' },
    { name: 'Provision', value: Math.max(0, calc.provisionAbs), color: 'hsl(var(--chart-4))' },
    { name: 'Marge', value: Math.max(0, calc.marginAbs), color: 'hsl(var(--primary))' },
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
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Calculator className="h-4 w-4 text-primary" />
          Kalkulator
          {isDemo && (
            <Badge variant="outline" className="text-[10px] ml-auto">Demo</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Investment Costs Input */}
        <div className="space-y-1.5">
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
        <div className="space-y-2">
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

        {/* Price Adjustment Stepper */}
        <div className="space-y-1.5">
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

        {/* Pie Chart */}
        <div className="h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={65}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => fmt(value)}
                contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-3 -mt-2">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1 text-[9px] text-muted-foreground">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                {d.name}
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* KPI Grid */}
        <div className="space-y-2 text-xs">
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
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ø Endkundenrendite</span>
            <span className="font-medium tabular-nums">{calc.avgYield.toFixed(2)} %</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
