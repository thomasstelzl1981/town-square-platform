/**
 * PortfolioSummaryModal — Kumulierte Portfolio-Visualisierung
 * 
 * Zeigt bei Klick auf die Summenzeile:
 * 1. Finanzierungs- und Vermögensübersicht
 * 2. Detaillierte Jahresübersicht (Tabelle)
 * 3. EÜR (Zwei-Spalten-Layout)
 * 4. Vermögensentwicklung (Chart)
 * 5. Zins/Tilgung Verlauf (Chart)
 */
import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  ComposedChart,
  AreaChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  Line,
  BarChart,
} from 'recharts';
import { 
  Calculator, 
  Settings2, 
  Plus, 
  Minus, 
  ChevronDown,
  Table2,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface PortfolioTotals {
  unitCount: number;
  propertyCount: number;
  totalArea: number;
  totalValue: number;
  totalIncome: number;
  totalDebt: number;
  totalAnnuity: number;
  netWealth: number;
  avgYield: number;
  avgInterestRate: number;
}

interface ProjectionRow {
  year: number;
  rent: number;
  interest: number;
  amortization: number;
  remainingDebt: number;
  propertyValue: number;
  wealth: number;
}

interface PortfolioSummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totals: PortfolioTotals | null;
  contextName?: string;
  marginalTaxRate?: number;
}

export function PortfolioSummaryModal({
  open,
  onOpenChange,
  totals,
  contextName,
  marginalTaxRate = 0.42,
}: PortfolioSummaryModalProps) {
  // Parameter-State (Plus/Minus Steuerung)
  const [appreciationRate, setAppreciationRate] = useState(2.0); // in %
  const [rentGrowthRate, setRentGrowthRate] = useState(2.0); // in %
  const [showAllYears, setShowAllYears] = useState(false);

  // Helper für Plus/Minus
  const adjustRate = (
    current: number, 
    delta: number, 
    setter: (v: number) => void
  ) => {
    const newVal = Math.max(0, Math.min(5, current + delta));
    setter(parseFloat(newVal.toFixed(1)));
  };

  // 40-Jahre Projektion berechnen
  const projectionData = useMemo(() => {
    if (!totals || totals.totalDebt === 0) return [];

    const data: ProjectionRow[] = [];
    let currentDebt = totals.totalDebt;
    let currentRent = totals.totalIncome;
    let currentValue = totals.totalValue;
    const annuity = totals.totalAnnuity;
    const interestRate = totals.avgInterestRate / 100;
    const appRate = appreciationRate / 100;
    const rentRate = rentGrowthRate / 100;

    // Jahr 0 (Ausgangssituation)
    data.push({
      year: 0,
      rent: currentRent,
      interest: 0,
      amortization: 0,
      remainingDebt: currentDebt,
      propertyValue: currentValue,
      wealth: currentValue - currentDebt,
    });

    for (let year = 1; year <= 40; year++) {
      // Zinsen für dieses Jahr
      const interest = currentDebt * interestRate;
      
      // Tilgung = Annuität - Zinsen (maximal Restschuld)
      const amortization = currentDebt > 0 
        ? Math.min(annuity - interest, currentDebt)
        : 0;
      
      // Restschuld reduzieren
      currentDebt = Math.max(0, currentDebt - amortization);
      
      // Wert- und Mietsteigerung anwenden
      currentValue *= (1 + appRate);
      currentRent *= (1 + rentRate);
      
      // Vermögen berechnen
      const wealth = currentValue - currentDebt;

      data.push({
        year,
        rent: currentRent,
        interest,
        amortization,
        remainingDebt: currentDebt,
        propertyValue: currentValue,
        wealth,
      });
    }

    return data;
  }, [totals, appreciationRate, rentGrowthRate]);

  // Finanzierungs-Kennzahlen
  const financingMetrics = useMemo(() => {
    if (!totals || projectionData.length === 0) return null;

    const totalInterest = projectionData.reduce((sum, row) => sum + row.interest, 0);
    const totalAmortization = projectionData.reduce((sum, row) => sum + row.amortization, 0);
    
    // Finde Jahr der Volltilgung
    const fullRepaymentYear = projectionData.find(row => row.remainingDebt === 0)?.year || 40;

    return {
      loanAmount: totals.totalDebt,
      duration: fullRepaymentYear,
      totalInterest,
      totalAmortization,
      debtAfter10: projectionData[10]?.remainingDebt || 0,
      debtAfter20: projectionData[20]?.remainingDebt || 0,
      wealthAfter10: projectionData[10]?.wealth || 0,
      wealthAfter20: projectionData[20]?.wealth || 0,
      finalValue: projectionData[40]?.propertyValue || 0,
      finalWealth: projectionData[40]?.wealth || 0,
    };
  }, [totals, projectionData]);

  // EÜR Monatlich
  const monthlyEUR = useMemo(() => {
    if (!totals) return null;

    const monthlyRent = totals.totalIncome / 12;
    const monthlyInterest = (totals.totalDebt * (totals.avgInterestRate / 100)) / 12;
    const monthlyAmortization = (totals.totalAnnuity / 12) - monthlyInterest;
    const monthlyNK = (totals.totalValue * 0.005) / 12;
    
    // AfA und Steuervorteil
    const annualAfa = totals.totalValue * 0.8 * 0.02;
    const annualDeductible = monthlyInterest * 12 + annualAfa;
    const taxableResult = totals.totalIncome - annualDeductible - (monthlyNK * 12);
    const monthlyTaxBenefit = taxableResult < 0 
      ? (Math.abs(taxableResult) * marginalTaxRate) / 12 
      : 0;

    const totalIncome = monthlyRent + monthlyTaxBenefit;
    const totalExpenses = monthlyNK + monthlyInterest + monthlyAmortization;
    const monthlyResult = totalIncome - totalExpenses;

    return {
      rent: monthlyRent,
      taxBenefit: monthlyTaxBenefit,
      totalIncome,
      nk: monthlyNK,
      interest: monthlyInterest,
      amortization: monthlyAmortization,
      totalExpenses,
      result: monthlyResult,
    };
  }, [totals, marginalTaxRate]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCurrencyShort = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)} Mio.`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}k`;
    }
    return formatCurrency(value);
  };

  if (!totals) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              <DialogTitle>Portfolio-Analyse</DialogTitle>
              {contextName && (
                <Badge variant="secondary">{contextName}</Badge>
              )}
            </div>
            
            {/* Parameter-Button (dezent) */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1">
                  <Settings2 className="h-3 w-3" />
                  {appreciationRate.toFixed(1)}% | {rentGrowthRate.toFixed(1)}%
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64" align="end">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block">
                      Wertzuwachs p.a.
                    </label>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => adjustRate(appreciationRate, -0.5, setAppreciationRate)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-medium w-12 text-center">
                        {appreciationRate.toFixed(1)}%
                      </span>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => adjustRate(appreciationRate, 0.5, setAppreciationRate)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block">
                      Mietsteigerung p.a.
                    </label>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => adjustRate(rentGrowthRate, -0.5, setRentGrowthRate)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-medium w-12 text-center">
                        {rentGrowthRate.toFixed(1)}%
                      </span>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-7 w-7"
                        onClick={() => adjustRate(rentGrowthRate, 0.5, setRentGrowthRate)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Finanzierung & Vermögensentwicklung Übersicht */}
          {financingMetrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Finanzierung</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <MetricRow label="Darlehenssumme" value={formatCurrency(financingMetrics.loanAmount)} />
                  <MetricRow label="Laufzeit (bis Volltilg.)" value={`${financingMetrics.duration} Jahre`} />
                  <MetricRow label="Zinsen gesamt" value={formatCurrency(financingMetrics.totalInterest)} className="text-destructive" />
                  <MetricRow label="Tilgung gesamt" value={formatCurrency(financingMetrics.totalAmortization)} className="text-blue-600" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Vermögensentwicklung</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <MetricRow label="Restschuld nach 10 Jahren" value={formatCurrency(financingMetrics.debtAfter10)} />
                  <MetricRow label="Restschuld nach 20 Jahren" value={formatCurrency(financingMetrics.debtAfter20)} />
                  <MetricRow label="Vermögenszuw. nach 10 J." value={formatCurrency(financingMetrics.wealthAfter10)} className="text-green-600" />
                  <MetricRow label="Vermögenszuw. nach 20 J." value={formatCurrency(financingMetrics.wealthAfter20)} className="text-green-600" />
                </CardContent>
              </Card>
            </div>
          )}

          {/* EÜR Monatlich (Zwei-Spalten) */}
          {monthlyEUR && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  Monatliche Übersicht
                  <Badge variant="outline" className="text-xs">
                    Steuersatz: {(marginalTaxRate * 100).toFixed(0)}%
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  {/* Einnahmen */}
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      Einnahmen
                    </h4>
                    <div className="space-y-1">
                      <EurRow label="Mieteinnahmen" value={monthlyEUR.rent} color="green" />
                      <EurRow label="Steuervorteil" value={monthlyEUR.taxBenefit} color="blue" />
                      <Separator className="my-2" />
                      <EurRow label="Summe" value={monthlyEUR.totalIncome} color="green" bold />
                    </div>
                  </div>
                  {/* Ausgaben */}
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                      <TrendingDown className="h-3 w-3 text-destructive" />
                      Ausgaben
                    </h4>
                    <div className="space-y-1">
                      <EurRow label="Nicht umlagef. NK" value={-monthlyEUR.nk} color="red" />
                      <EurRow label="Zins" value={-monthlyEUR.interest} color="red" />
                      <EurRow label="Tilgung" value={-monthlyEUR.amortization} color="blue" />
                      <Separator className="my-2" />
                      <EurRow label="Summe" value={-monthlyEUR.totalExpenses} color="red" bold />
                    </div>
                  </div>
                </div>
                <Separator className="my-4" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">= Monatliches Ergebnis</span>
                  <span className={`text-lg font-bold ${monthlyEUR.result >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                    {formatCurrency(monthlyEUR.result)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Detaillierte Jahresübersicht (Tabelle) */}
          {projectionData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Table2 className="h-4 w-4" />
                  Detaillierte Jahresübersicht
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Jahr</TableHead>
                        <TableHead className="text-right">Miete</TableHead>
                        <TableHead className="text-right text-destructive">Zinsen</TableHead>
                        <TableHead className="text-right text-blue-600">Tilgung</TableHead>
                        <TableHead className="text-right">Restschuld</TableHead>
                        <TableHead className="text-right">Objektwert</TableHead>
                        <TableHead className="text-right text-green-600">Vermögen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projectionData
                        .slice(1, showAllYears ? 41 : 11)
                        .map((row) => (
                          <TableRow key={row.year}>
                            <TableCell className="font-medium">{row.year}</TableCell>
                            <TableCell className="text-right">{formatCurrency(row.rent)}</TableCell>
                            <TableCell className="text-right text-destructive">{formatCurrency(row.interest)}</TableCell>
                            <TableCell className="text-right text-blue-600">{formatCurrency(row.amortization)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(row.remainingDebt)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(row.propertyValue)}</TableCell>
                            <TableCell className="text-right text-green-600 font-medium">{formatCurrency(row.wealth)}</TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
                {!showAllYears && projectionData.length > 11 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowAllYears(true)} 
                    className="w-full mt-2 text-xs"
                  >
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Alle 40 Jahre anzeigen
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Vermögensentwicklung Chart */}
          {projectionData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Vermögensentwicklung (40 Jahre)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={projectionData.slice(1)}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="year" 
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) => `${v}`}
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) => formatCurrencyShort(v)}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        formatCurrency(value),
                        name === 'propertyValue' ? 'Objektwert' :
                        name === 'remainingDebt' ? 'Restschuld' :
                        name === 'wealth' ? 'Vermögen' : name
                      ]}
                      labelFormatter={(label) => `Jahr ${label}`}
                    />
                    <Legend 
                      formatter={(value) => 
                        value === 'propertyValue' ? 'Objektwert' :
                        value === 'remainingDebt' ? 'Restschuld' :
                        value === 'wealth' ? 'Vermögen' : value
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="propertyValue"
                      name="propertyValue"
                      stroke="hsl(210, 70%, 50%)"
                      fill="hsl(210, 70%, 50%)"
                      fillOpacity={0.15}
                    />
                    <Area
                      type="monotone"
                      dataKey="wealth"
                      name="wealth"
                      stroke="hsl(142, 70%, 45%)"
                      fill="hsl(142, 70%, 45%)"
                      fillOpacity={0.3}
                    />
                    <Line
                      type="monotone"
                      dataKey="remainingDebt"
                      name="remainingDebt"
                      stroke="hsl(0, 70%, 50%)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Zins/Tilgung Balkendiagramm */}
          {projectionData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Zins- und Tilgungsverlauf</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={projectionData.slice(1, 31)}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="year" 
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        formatCurrency(value),
                        name === 'interest' ? 'Zinsen' : 'Tilgung'
                      ]}
                      labelFormatter={(label) => `Jahr ${label}`}
                    />
                    <Legend 
                      formatter={(value) => value === 'interest' ? 'Zinsen' : 'Tilgung'}
                    />
                    <Bar 
                      dataKey="interest" 
                      name="interest"
                      stackId="a" 
                      fill="hsl(0, 70%, 50%)" 
                    />
                    <Bar 
                      dataKey="amortization" 
                      name="amortization"
                      stackId="a" 
                      fill="hsl(210, 70%, 50%)" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper Components
function MetricRow({ 
  label, 
  value, 
  className = '' 
}: { 
  label: string; 
  value: string; 
  className?: string;
}) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${className}`}>{value}</span>
    </div>
  );
}

function EurRow({ 
  label, 
  value, 
  color, 
  bold = false 
}: { 
  label: string; 
  value: number; 
  color: 'green' | 'red' | 'blue';
  bold?: boolean;
}) {
  const formatValue = (v: number) => {
    const formatted = new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(Math.abs(v));
    return v < 0 ? `-${formatted}` : formatted;
  };

  const colorClass = {
    green: 'text-green-600',
    red: 'text-destructive',
    blue: 'text-blue-600',
  }[color];

  return (
    <div className={`flex justify-between items-center text-sm ${bold ? 'font-semibold' : ''}`}>
      <span>{label}</span>
      <span className={colorClass}>{formatValue(value)}</span>
    </div>
  );
}
