/**
 * InventoryInvestmentSimulation — Bestandsimmobilien-Simulation
 * 
 * Für existierende Immobilien mit bestehendem Darlehen.
 * 
 * Einstellbare Parameter (Slider):
 * - Wertzuwachs p.a.: 0% – 3%
 * - Mietsteigerung p.a.: 0% – 3%
 * 
 * Feste Parameter (aus DB):
 * - Kaufpreis, Verkehrswert, Restschuld, Zinssatz, Annuität
 * - AfA-Werte, Steuersatz aus Kontext
 */
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  Line,
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TrendingUp, Calculator, Percent, Building2 } from 'lucide-react';

interface SimulationData {
  // Property data
  purchasePrice: number;
  marketValue: number;
  annualRent: number;
  // Financing data
  outstandingBalance: number;
  interestRatePercent: number;
  annuityMonthly: number;
  // Accounting data
  buildingSharePercent: number;
  afaRatePercent: number;
  afaMethod: string;
  // Context/Tax data
  contextName?: string;
  marginalTaxRate: number;
}

interface InventoryInvestmentSimulationProps {
  data: SimulationData;
}

export function InventoryInvestmentSimulation({ data }: InventoryInvestmentSimulationProps) {
  // Slider state
  const [valueGrowth, setValueGrowth] = useState(2.0); // 2% default
  const [rentGrowth, setRentGrowth] = useState(1.5); // 1.5% default

  // Format helpers
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  // 40-year projection calculation
  const projectionData = useMemo(() => {
    const years = [];
    let currentValue = data.marketValue;
    let currentRent = data.annualRent;
    let debt = data.outstandingBalance;
    const annualAnnuity = data.annuityMonthly * 12;
    const interestRate = data.interestRatePercent / 100;
    const valueGrowthRate = valueGrowth / 100;
    const rentGrowthRate = rentGrowth / 100;

    for (let year = 0; year <= 40; year++) {
      const interest = debt * interestRate;
      const amortization = Math.min(annualAnnuity - interest, debt);
      const netWealth = currentValue - debt;

      years.push({
        year: 2026 + year,
        verkehrswert: Math.round(currentValue),
        restschuld: Math.max(0, Math.round(debt)),
        nettoVermoegen: Math.round(netWealth),
        miete: Math.round(currentRent),
        zins: Math.round(interest),
        tilgung: Math.round(amortization),
      });

      // Next year calculations
      debt = Math.max(0, debt - amortization);
      currentValue = currentValue * (1 + valueGrowthRate);
      currentRent = currentRent * (1 + rentGrowthRate);
    }

    return years;
  }, [data, valueGrowth, rentGrowth]);

  // Tax benefit calculation (Year 1)
  const taxBenefit = useMemo(() => {
    const buildingValue = data.purchasePrice * (data.buildingSharePercent / 100);
    const afaAmount = buildingValue * (data.afaRatePercent / 100);
    const interestCosts = data.outstandingBalance * (data.interestRatePercent / 100);
    const totalDeductions = afaAmount + interestCosts;
    const taxableResult = data.annualRent - totalDeductions;

    // If negative (loss), we get a tax benefit
    const benefit = taxableResult < 0 ? Math.abs(taxableResult) * data.marginalTaxRate : 0;

    return {
      afaAmount,
      interestCosts,
      totalDeductions,
      taxableResult,
      benefit,
    };
  }, [data]);

  // 10-year table (every 5 years + first few)
  const tableYears = [0, 1, 5, 10, 15, 20, 25, 30, 35, 40];
  const tableData = tableYears
    .map(idx => projectionData[idx])
    .filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header with context info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Investment-Simulation</h3>
          {data.contextName && (
            <Badge variant="secondary">{data.contextName}</Badge>
          )}
        </div>
        <Badge variant="outline">
          Steuersatz: {(data.marginalTaxRate * 100).toFixed(0)}%
        </Badge>
      </div>

      {/* Sliders */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Annahmen anpassen
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm">Wertzuwachs p.a.</label>
              <Badge variant="outline">{formatPercent(valueGrowth)}</Badge>
            </div>
            <Slider
              value={[valueGrowth]}
              onValueChange={([v]) => setValueGrowth(v)}
              min={0}
              max={5}
              step={0.1}
              className="w-full"
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm">Mietsteigerung p.a.</label>
              <Badge variant="outline">{formatPercent(rentGrowth)}</Badge>
            </div>
            <Slider
              value={[rentGrowth]}
              onValueChange={([v]) => setRentGrowth(v)}
              min={0}
              max={5}
              step={0.1}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Fixed Parameters Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <InfoBox label="Verkehrswert" value={formatCurrency(data.marketValue)} />
        <InfoBox label="Restschuld" value={formatCurrency(data.outstandingBalance)} />
        <InfoBox label="Zinssatz" value={formatPercent(data.interestRatePercent)} />
        <InfoBox label="AfA-Satz" value={`${data.afaRatePercent}% (${data.afaMethod})`} />
      </div>

      {/* Tax Benefit Box */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Steuervorteil Jahr 1</p>
              <p className="text-xs text-muted-foreground">
                AfA: {formatCurrency(taxBenefit.afaAmount)} + Zinsen: {formatCurrency(taxBenefit.interestCosts)}
                {' '}− Miete: {formatCurrency(data.annualRent)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-blue-600">
                {taxBenefit.benefit > 0 ? formatCurrency(taxBenefit.benefit) : '–'}
              </p>
              {taxBenefit.taxableResult < 0 && (
                <p className="text-xs text-muted-foreground">
                  Verlust: {formatCurrency(Math.abs(taxBenefit.taxableResult))}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 40-Year Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Vermögensentwicklung (40 Jahre)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={projectionData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => v.toString().slice(2)}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => `Jahr ${label}`}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="verkehrswert"
                name="Verkehrswert"
                stroke="hsl(var(--chart-1))"
                fill="hsl(var(--chart-1))"
                fillOpacity={0.2}
              />
              <Area
                type="monotone"
                dataKey="nettoVermoegen"
                name="Netto-Vermögen"
                stroke="hsl(var(--chart-2))"
                fill="hsl(var(--chart-2))"
                fillOpacity={0.3}
              />
              <Line
                type="monotone"
                dataKey="restschuld"
                name="Restschuld"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Projektionstabelle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jahr</TableHead>
                  <TableHead className="text-right">Verkehrswert</TableHead>
                  <TableHead className="text-right">Restschuld</TableHead>
                  <TableHead className="text-right">Netto-Vermögen</TableHead>
                  <TableHead className="text-right">Miete p.a.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.map((row) => (
                  <TableRow key={row.year}>
                    <TableCell className="font-medium">{row.year}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.verkehrswert)}</TableCell>
                    <TableCell className="text-right text-destructive">
                      {row.restschuld > 0 ? formatCurrency(row.restschuld) : '–'}
                    </TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      {formatCurrency(row.nettoVermoegen)}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(row.miete)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-muted/50">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
