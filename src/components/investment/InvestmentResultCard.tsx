import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Euro, Percent, PiggyBank, Building } from 'lucide-react';
import { CalculationResult } from '@/hooks/useInvestmentEngine';

interface Props {
  result: CalculationResult;
}

export function InvestmentResultCard({ result }: Props) {
  const { summary } = result;
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
  };

  const isPositiveCashFlow = summary.monthlyBurden < 0;

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span>Ergebnis der Berechnung</span>
          <Badge variant={isPositiveCashFlow ? 'default' : 'secondary'}>
            {isPositiveCashFlow ? 'Positiver Cashflow' : 'Zuschuss erforderlich'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Main Result */}
        <div className="mb-6 p-4 rounded-lg bg-muted/50 text-center">
          <p className="text-sm text-muted-foreground mb-1">Monatliche Belastung (nach Steuern)</p>
          <p className={`text-4xl font-bold ${isPositiveCashFlow ? 'text-green-600' : 'text-orange-600'}`}>
            {isPositiveCashFlow ? '+' : ''}{formatCurrency(Math.abs(summary.monthlyBurden))}
            <span className="text-lg font-normal text-muted-foreground">/Monat</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {isPositiveCashFlow 
              ? 'Sie erhalten monatlich diesen Betrag' 
              : 'Sie zahlen monatlich diesen Betrag'}
          </p>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Building className="h-4 w-4" />
              <span className="text-xs">Darlehen</span>
            </div>
            <p className="font-semibold">{formatCurrency(summary.loanAmount)}</p>
            <p className="text-xs text-muted-foreground">{summary.ltv}% Beleihung</p>
          </div>

          <div className="p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Percent className="h-4 w-4" />
              <span className="text-xs">Zinssatz</span>
            </div>
            <p className="font-semibold">{summary.interestRate}%</p>
            <p className="text-xs text-muted-foreground">{formatCurrency(summary.yearlyInterest)}/Jahr</p>
          </div>

          <div className="p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <PiggyBank className="h-4 w-4" />
              <span className="text-xs">Steuerersparnis</span>
            </div>
            <p className="font-semibold text-green-600">{formatCurrency(summary.yearlyTaxSavings)}</p>
            <p className="text-xs text-muted-foreground">pro Jahr</p>
          </div>

          <div className="p-3 rounded-lg bg-muted/30">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Rendite n. Steuern</span>
            </div>
            <p className={`font-semibold ${summary.roiAfterTax >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.roiAfterTax.toFixed(2)}%
            </p>
            <p className="text-xs text-muted-foreground">auf Eigenkapital</p>
          </div>
        </div>

        {/* Yearly Breakdown */}
        <div className="mt-6 pt-4 border-t">
          <h4 className="text-sm font-medium mb-3">Jährliche Übersicht</h4>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mieteinnahmen</span>
              <span className="font-medium text-green-600">+{formatCurrency(summary.yearlyRent)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Zinsen</span>
              <span className="font-medium text-red-600">-{formatCurrency(summary.yearlyInterest)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tilgung</span>
              <span className="font-medium">-{formatCurrency(summary.yearlyRepayment)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">AfA</span>
              <span className="font-medium">{formatCurrency(summary.yearlyAfa)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Steuerersparnis</span>
              <span className="font-medium text-green-600">+{formatCurrency(summary.yearlyTaxSavings)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ROI vor Steuern</span>
              <span className="font-medium">{summary.roiBeforeTax.toFixed(2)}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
