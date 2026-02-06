/**
 * Quick Calculator Tool
 * 
 * Simplified Bestand (Hold) and Aufteiler (Partition) calculators
 */

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, Building2, Scissors, TrendingUp, Wallet, Percent, PiggyBank } from 'lucide-react';
import { calculateBestandKPIs, calculateAufteilerKPIs, type BestandCalcResult, type AufteilerCalcResult } from '@/hooks/useAcqTools';
import { formatCurrency } from '@/lib/formatters';

export function QuickCalcTool() {
  const [activeCalc, setActiveCalc] = React.useState<'bestand' | 'aufteiler'>('bestand');

  // Bestand state
  const [bestandInputs, setBestandInputs] = React.useState({
    purchasePrice: 1000000,
    monthlyRent: 5000,
    equity: 200000,
    interestRate: 3.5,
    repaymentRate: 2,
    managementCostPercent: 25,
    ancillaryCostPercent: 10,
  });
  const [bestandResult, setBestandResult] = React.useState<BestandCalcResult | null>(null);

  // Aufteiler state
  const [aufteilerInputs, setAufteilerInputs] = React.useState({
    purchasePrice: 1500000,
    unitsCount: 10,
    avgUnitSalePrice: 200000,
    renovationCostPerUnit: 15000,
    salesCommissionPercent: 3,
    holdingPeriodMonths: 24,
    ancillaryCostPercent: 10,
  });
  const [aufteilerResult, setAufteilerResult] = React.useState<AufteilerCalcResult | null>(null);

  const handleBestandCalc = () => {
    const result = calculateBestandKPIs(bestandInputs);
    setBestandResult(result);
  };

  const handleAufteilerCalc = () => {
    const result = calculateAufteilerKPIs(aufteilerInputs);
    setAufteilerResult(result);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Quick-Kalkulatoren
        </CardTitle>
        <CardDescription>
          Schnelle Investment-Berechnung für Bestand und Aufteilung
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeCalc} onValueChange={(v) => setActiveCalc(v as 'bestand' | 'aufteiler')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bestand" className="gap-2">
              <Building2 className="h-4 w-4" />
              Bestandskalkulation
            </TabsTrigger>
            <TabsTrigger value="aufteiler" className="gap-2">
              <Scissors className="h-4 w-4" />
              Aufteilerkalkulation
            </TabsTrigger>
          </TabsList>

          {/* Bestand Tab */}
          <TabsContent value="bestand" className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Kaufpreis (€)</Label>
                <Input
                  type="number"
                  value={bestandInputs.purchasePrice}
                  onChange={(e) => setBestandInputs({ ...bestandInputs, purchasePrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Monatsmiete (€)</Label>
                <Input
                  type="number"
                  value={bestandInputs.monthlyRent}
                  onChange={(e) => setBestandInputs({ ...bestandInputs, monthlyRent: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Eigenkapital (€)</Label>
                <Input
                  type="number"
                  value={bestandInputs.equity}
                  onChange={(e) => setBestandInputs({ ...bestandInputs, equity: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Zinssatz (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={bestandInputs.interestRate}
                  onChange={(e) => setBestandInputs({ ...bestandInputs, interestRate: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tilgung (%)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={bestandInputs.repaymentRate}
                  onChange={(e) => setBestandInputs({ ...bestandInputs, repaymentRate: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Nebenkosten (%)</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={bestandInputs.ancillaryCostPercent}
                  onChange={(e) => setBestandInputs({ ...bestandInputs, ancillaryCostPercent: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <Button onClick={handleBestandCalc} className="w-full">
              <Calculator className="h-4 w-4 mr-2" />
              Berechnen
            </Button>

            {bestandResult && (
              <div className="grid gap-4 md:grid-cols-4">
                <ResultCard
                  icon={<TrendingUp className="h-5 w-5 text-green-500" />}
                  label="Brutto-Rendite"
                  value={`${bestandResult.grossYield}%`}
                />
                <ResultCard
                  icon={<TrendingUp className="h-5 w-5 text-blue-500" />}
                  label="Netto-Rendite"
                  value={`${bestandResult.netYield}%`}
                />
                <ResultCard
                  icon={<Wallet className="h-5 w-5 text-purple-500" />}
                  label="Cash-Flow mtl."
                  value={formatCurrency(bestandResult.monthlyCashflow)}
                  highlight={bestandResult.monthlyCashflow >= 0}
                />
                <ResultCard
                  icon={<Percent className="h-5 w-5 text-orange-500" />}
                  label="Cash-on-Cash"
                  value={`${bestandResult.cashOnCash}%`}
                />
                <ResultCard
                  icon={<PiggyBank className="h-5 w-5 text-cyan-500" />}
                  label="Multiplikator"
                  value={`${bestandResult.multiplier}x`}
                />
                <ResultCard
                  icon={<Building2 className="h-5 w-5 text-gray-500" />}
                  label="LTV"
                  value={`${bestandResult.ltv}%`}
                />
                <ResultCard
                  icon={<TrendingUp className="h-5 w-5 text-yellow-500" />}
                  label="DSCR"
                  value={bestandResult.dscr.toFixed(2)}
                  highlight={bestandResult.dscr >= 1.2}
                />
                <ResultCard
                  icon={<Wallet className="h-5 w-5 text-gray-500" />}
                  label="Jährliches NOI"
                  value={formatCurrency(bestandResult.noi)}
                />
              </div>
            )}
          </TabsContent>

          {/* Aufteiler Tab */}
          <TabsContent value="aufteiler" className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Kaufpreis gesamt (€)</Label>
                <Input
                  type="number"
                  value={aufteilerInputs.purchasePrice}
                  onChange={(e) => setAufteilerInputs({ ...aufteilerInputs, purchasePrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Anzahl Einheiten</Label>
                <Input
                  type="number"
                  value={aufteilerInputs.unitsCount}
                  onChange={(e) => setAufteilerInputs({ ...aufteilerInputs, unitsCount: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label>∅ Verkaufspreis/WE (€)</Label>
                <Input
                  type="number"
                  value={aufteilerInputs.avgUnitSalePrice}
                  onChange={(e) => setAufteilerInputs({ ...aufteilerInputs, avgUnitSalePrice: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Sanierungskosten/WE (€)</Label>
                <Input
                  type="number"
                  value={aufteilerInputs.renovationCostPerUnit}
                  onChange={(e) => setAufteilerInputs({ ...aufteilerInputs, renovationCostPerUnit: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Verkaufsprovision (%)</Label>
                <Input
                  type="number"
                  step="0.5"
                  value={aufteilerInputs.salesCommissionPercent}
                  onChange={(e) => setAufteilerInputs({ ...aufteilerInputs, salesCommissionPercent: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Haltedauer (Monate)</Label>
                <Input
                  type="number"
                  value={aufteilerInputs.holdingPeriodMonths}
                  onChange={(e) => setAufteilerInputs({ ...aufteilerInputs, holdingPeriodMonths: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <Button onClick={handleAufteilerCalc} className="w-full">
              <Calculator className="h-4 w-4 mr-2" />
              Berechnen
            </Button>

            {aufteilerResult && (
              <div className="grid gap-4 md:grid-cols-4">
                <ResultCard
                  icon={<PiggyBank className="h-5 w-5 text-green-500" />}
                  label="Bruttogewinn"
                  value={formatCurrency(aufteilerResult.grossProfit)}
                  highlight={aufteilerResult.grossProfit > 0}
                />
                <ResultCard
                  icon={<Percent className="h-5 w-5 text-blue-500" />}
                  label="Gewinnmarge"
                  value={`${aufteilerResult.profitMarginPercent}%`}
                />
                <ResultCard
                  icon={<TrendingUp className="h-5 w-5 text-purple-500" />}
                  label="Annualisierte Rendite"
                  value={`${aufteilerResult.annualizedReturn}%`}
                />
                <ResultCard
                  icon={<Building2 className="h-5 w-5 text-orange-500" />}
                  label="Preis pro WE"
                  value={formatCurrency(aufteilerResult.pricePerUnit)}
                />
                <ResultCard
                  icon={<Wallet className="h-5 w-5 text-cyan-500" />}
                  label="Gewinn pro WE"
                  value={formatCurrency(aufteilerResult.profitPerUnit)}
                />
                <ResultCard
                  icon={<Scissors className="h-5 w-5 text-gray-500" />}
                  label="Verkaufserlös gesamt"
                  value={formatCurrency(aufteilerResult.totalSaleProceeds)}
                />
                <ResultCard
                  icon={<Calculator className="h-5 w-5 text-gray-500" />}
                  label="Gesamtkosten"
                  value={formatCurrency(aufteilerResult.totalCosts)}
                />
                <ResultCard
                  icon={<TrendingUp className="h-5 w-5 text-gray-500" />}
                  label="Haltedauer"
                  value={`${aufteilerResult.holdingPeriodMonths} Mon.`}
                />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function ResultCard({ 
  icon, 
  label, 
  value, 
  highlight 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`p-4 rounded-lg border ${highlight === true ? 'bg-green-50 border-green-200' : highlight === false ? 'bg-red-50 border-red-200' : 'bg-muted'}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
