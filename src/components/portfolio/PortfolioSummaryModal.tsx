/**
 * PortfolioSummaryModal — Kumulierte Portfolio-Visualisierung
 * 
 * Zeigt bei Klick auf die Summenzeile:
 * 1. 30-Jahres-Tilgungsverlauf (Chart)
 * 2. Kumulierte EÜR mit Steuervorteil
 */
import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { TrendingUp, TrendingDown, Wallet, PiggyBank, Calculator } from 'lucide-react';

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

interface PortfolioSummaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  totals: PortfolioTotals | null;
  contextName?: string;
  marginalTaxRate?: number; // Grenzsteuersatz aus Kontext (z.B. 0.42 für 42%)
}

export function PortfolioSummaryModal({
  open,
  onOpenChange,
  totals,
  contextName,
  marginalTaxRate = 0.42, // Default 42%
}: PortfolioSummaryModalProps) {
  // 30-Jahre Projektion
  const projectionData = useMemo(() => {
    if (!totals || totals.totalDebt === 0) return [];

    const years = [];
    let debt = totals.totalDebt;
    let equity = totals.totalValue - totals.totalDebt;
    const annualPayment = totals.totalAnnuity;
    const interestRate = totals.avgInterestRate / 100;
    const valueGrowthRate = 0.02; // 2% Wertzuwachs
    let currentValue = totals.totalValue;

    for (let year = 0; year <= 30; year++) {
      years.push({
        year: 2026 + year,
        verkehrswert: Math.round(currentValue),
        eigenkapital: Math.round(equity),
        restschuld: Math.max(0, Math.round(debt)),
      });

      const interest = debt * interestRate;
      const amortization = Math.min(annualPayment - interest, debt);
      debt = Math.max(0, debt - amortization);
      currentValue = currentValue * (1 + valueGrowthRate);
      equity = currentValue - debt;
    }
    return years;
  }, [totals]);

  // EÜR-Berechnung mit Steuervorteil
  const eurCalculation = useMemo(() => {
    if (!totals) return null;

    const annualIncome = totals.totalIncome;
    const annualInterest = totals.totalDebt * (totals.avgInterestRate / 100);
    const nonRecoverableNk = totals.totalValue * 0.005; // 0.5% nicht umlagefähige NK
    const annualAmortization = totals.totalAnnuity - annualInterest;
    
    // AfA geschätzt: 2% auf 80% des Wertes
    const estimatedAfa = totals.totalValue * 0.8 * 0.02;
    
    // Werbungskostenüberschuss (negative = steuerlicher Verlust)
    const werbungskosten = annualInterest + estimatedAfa + nonRecoverableNk;
    const werbungskostenUeberschuss = annualIncome - werbungskosten;
    
    // Steuervorteil = Grenzsteuersatz × negativer Überschuss
    const taxBenefit = werbungskostenUeberschuss < 0 
      ? Math.abs(werbungskostenUeberschuss) * marginalTaxRate 
      : 0;
    
    // Cashflow nach Steuer
    const cashflowBeforeTax = annualIncome - annualInterest - nonRecoverableNk - annualAmortization;
    const cashflowAfterTax = cashflowBeforeTax + taxBenefit;

    return {
      annualIncome,
      annualInterest,
      nonRecoverableNk,
      annualAmortization,
      estimatedAfa,
      werbungskostenUeberschuss,
      taxBenefit,
      cashflowBeforeTax,
      cashflowAfterTax,
    };
  }, [totals, marginalTaxRate]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (!totals) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Portfolio-Analyse
            {contextName && (
              <Badge variant="secondary" className="ml-2">{contextName}</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatBox 
              icon={TrendingUp} 
              label="Verkehrswert" 
              value={formatCurrency(totals.totalValue)} 
              variant="success"
            />
            <StatBox 
              icon={TrendingDown} 
              label="Restschuld" 
              value={formatCurrency(totals.totalDebt)} 
              variant="destructive"
            />
            <StatBox 
              icon={PiggyBank} 
              label="Netto-Vermögen" 
              value={formatCurrency(totals.netWealth)} 
              variant="primary"
            />
            <StatBox 
              icon={Wallet} 
              label="Mieteinnahmen p.a." 
              value={formatCurrency(totals.totalIncome)} 
            />
          </div>

          <Separator />

          {/* Tilgungsverlauf Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">30-Jahres Vermögensentwicklung</CardTitle>
            </CardHeader>
            <CardContent>
              {projectionData.length > 0 ? (
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
                      dataKey="eigenkapital"
                      name="Eigenkapital"
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
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Keine Finanzierungsdaten vorhanden
                </div>
              )}
            </CardContent>
          </Card>

          {/* EÜR Übersicht */}
          {eurCalculation && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  Einnahmen-Überschuss-Rechnung (EÜR) p.a.
                  <Badge variant="outline">Steuersatz: {(marginalTaxRate * 100).toFixed(0)}%</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <EurLine label="Mieteinnahmen" value={eurCalculation.annualIncome} type="income" />
                  <EurLine label="Zinskosten" value={-eurCalculation.annualInterest} type="expense" />
                  <EurLine label="Nicht umlagef. NK (0,5%)" value={-eurCalculation.nonRecoverableNk} type="expense" />
                  <EurLine label="AfA (geschätzt 2% auf Gebäude)" value={-eurCalculation.estimatedAfa} type="expense" />
                  <Separator />
                  <EurLine 
                    label="Werbungskostenüberschuss" 
                    value={eurCalculation.werbungskostenUeberschuss} 
                    type={eurCalculation.werbungskostenUeberschuss >= 0 ? 'income' : 'expense'} 
                    bold
                  />
                  {eurCalculation.taxBenefit > 0 && (
                    <EurLine 
                      label="→ Steuererstattung" 
                      value={eurCalculation.taxBenefit} 
                      type="benefit" 
                    />
                  )}
                  <Separator />
                  <EurLine label="Tilgung" value={-eurCalculation.annualAmortization} type="neutral" />
                  <EurLine 
                    label="Cashflow nach Steuer" 
                    value={eurCalculation.cashflowAfterTax} 
                    type={eurCalculation.cashflowAfterTax >= 0 ? 'income' : 'expense'} 
                    bold
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatBox({ 
  icon: Icon, 
  label, 
  value, 
  variant = 'default' 
}: { 
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  variant?: 'default' | 'success' | 'destructive' | 'primary';
}) {
  const iconColor = {
    default: 'text-muted-foreground',
    success: 'text-green-600',
    destructive: 'text-destructive',
    primary: 'text-primary',
  }[variant];

  return (
    <div className="p-3 rounded-lg bg-muted/50">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`h-4 w-4 ${iconColor}`} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="font-semibold">{value}</p>
    </div>
  );
}

function EurLine({ 
  label, 
  value, 
  type, 
  bold = false 
}: { 
  label: string;
  value: number;
  type: 'income' | 'expense' | 'benefit' | 'neutral';
  bold?: boolean;
}) {
  const formatCurrency = (v: number) => {
    const formatted = new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(Math.abs(v));
    return v < 0 ? `-${formatted}` : formatted;
  };

  const colorClass = {
    income: 'text-green-600',
    expense: 'text-destructive',
    benefit: 'text-blue-600',
    neutral: 'text-muted-foreground',
  }[type];

  return (
    <div className={`flex justify-between items-center ${bold ? 'font-semibold' : ''}`}>
      <span className="text-sm">{label}</span>
      <span className={`text-sm ${colorClass}`}>{formatCurrency(value)}</span>
    </div>
  );
}
