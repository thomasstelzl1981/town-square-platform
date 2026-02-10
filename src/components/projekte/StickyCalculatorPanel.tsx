/**
 * Sticky Calculator Panel - Right sidebar for Projekte Tab
 * MOD-13 PROJEKTE
 * 
 * Defaults: Provision 10%, Marge 20%, Selbstkosten 70%
 * Shows demo values when no project selected
 */
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Calculator, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface StickyCalculatorPanelProps {
  totalSaleTarget?: number;
  purchasePrice?: number;
  renovationBudget?: number;
  commissionRate?: number;
  unitsCount?: number;
  isDemo?: boolean;
}

export function StickyCalculatorPanel({
  totalSaleTarget = 2500000,
  purchasePrice = 1750000,
  renovationBudget = 0,
  commissionRate = 10,
  unitsCount = 8,
  isDemo = false,
}: StickyCalculatorPanelProps) {
  const [provision, setProvision] = useState(commissionRate);
  const [targetMargin, setTargetMargin] = useState(20);

  const calc = useMemo(() => {
    const totalCosts = purchasePrice + renovationBudget;
    const selfCostPercent = totalSaleTarget > 0 ? (totalCosts / totalSaleTarget) * 100 : 70;
    const provisionAmount = totalSaleTarget * (provision / 100);
    const marginAmount = totalSaleTarget - totalCosts - provisionAmount;
    const actualMarginPercent = totalSaleTarget > 0 ? (marginAmount / totalSaleTarget) * 100 : 0;
    const profitPerUnit = unitsCount > 0 ? marginAmount / unitsCount : 0;
    
    return {
      selfCostPercent: Math.round(selfCostPercent),
      provisionAmount,
      marginAmount,
      actualMarginPercent,
      profitPerUnit,
      totalCosts,
    };
  }, [totalSaleTarget, purchasePrice, renovationBudget, provision, unitsCount]);

  const fmt = (v: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

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
        {/* Provision Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <Label className="text-xs text-muted-foreground">Provision</Label>
            <span className="text-xs font-bold text-primary tabular-nums">{provision.toFixed(0)}%</span>
          </div>
          <Slider
            value={[provision]}
            min={1}
            max={15}
            step={0.5}
            onValueChange={([v]) => setProvision(v)}
          />
        </div>

        {/* Target Margin Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-baseline">
            <Label className="text-xs text-muted-foreground">Zielmarge</Label>
            <span className="text-xs font-bold text-primary tabular-nums">{targetMargin}%</span>
          </div>
          <Slider
            value={[targetMargin]}
            min={5}
            max={40}
            step={1}
            onValueChange={([v]) => setTargetMargin(v)}
          />
        </div>

        <Separator />

        {/* KPI Grid */}
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Verkaufsziel</span>
            <span className="font-medium tabular-nums">{fmt(totalSaleTarget)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Selbstkosten ({calc.selfCostPercent}%)</span>
            <span className="font-medium tabular-nums">{fmt(calc.totalCosts)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Provision ({provision}%)</span>
            <span className="font-medium tabular-nums text-amber-600">{fmt(calc.provisionAmount)}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>Marge</span>
            <span className={calc.actualMarginPercent >= targetMargin ? 'text-emerald-600' : 'text-destructive'}>
              {fmt(calc.marginAmount)} ({calc.actualMarginPercent.toFixed(1)}%)
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Gewinn / Einheit</span>
            <span className="font-medium tabular-nums">{fmt(calc.profitPerUnit)}</span>
          </div>
        </div>

        {/* Visual Bar */}
        <div className="space-y-1">
          <div className="h-3 rounded-full overflow-hidden flex bg-muted">
            <div
              className="bg-muted-foreground/30 h-full transition-all"
              style={{ width: `${calc.selfCostPercent}%` }}
              title={`Selbstkosten ${calc.selfCostPercent}%`}
            />
            <div
              className="bg-amber-500/60 h-full transition-all"
              style={{ width: `${provision}%` }}
              title={`Provision ${provision}%`}
            />
            <div
              className="bg-primary h-full transition-all"
              style={{ width: `${Math.max(0, calc.actualMarginPercent)}%` }}
              title={`Marge ${calc.actualMarginPercent.toFixed(1)}%`}
            />
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground">
            <span>Kosten</span>
            <span>Provision</span>
            <span>Marge</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
