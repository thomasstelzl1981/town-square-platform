import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalculationResult } from '@/hooks/useInvestmentEngine';
import { Receipt, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HaushaltsrechnungProps {
  result: CalculationResult;
  variant?: 'compact' | 'detailed';
  showMonthly?: boolean;
  className?: string;
}

export function Haushaltsrechnung({ 
  result, 
  variant = 'detailed', 
  showMonthly = true,
  className 
}: HaushaltsrechnungProps) {
  const { summary, projection } = result;
  const year1 = projection[0];
  
  const formatCurrency = (value: number, showSign = false) => {
    const formatted = new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0 
    }).format(Math.abs(value));
    
    if (showSign) {
      return value >= 0 ? `+${formatted}` : `-${formatted}`;
    }
    return formatted;
  };

  const isPositive = summary.monthlyBurden <= 0;
  const monthlyDisplay = Math.abs(summary.monthlyBurden);

  if (variant === 'compact') {
    return (
      <div className={cn("p-4 rounded-lg border", className, isPositive ? 'bg-green-50 border-green-200' : 'bg-muted/50')}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground">Monatliche Belastung</p>
            <p className={cn("text-2xl font-bold", isPositive ? 'text-green-600' : 'text-foreground')}>
              {isPositive ? '+' : '-'}{formatCurrency(monthlyDisplay)}/Mo
            </p>
          </div>
          <div className={cn("p-3 rounded-full", isPositive ? 'bg-green-100' : 'bg-muted')}>
            {isPositive ? (
              <TrendingUp className="h-6 w-6 text-green-600" />
            ) : (
              <TrendingDown className="h-6 w-6 text-muted-foreground" />
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {isPositive 
            ? 'Sie verdienen jeden Monat mit dieser Immobilie' 
            : 'Monatlicher Zuschuss erforderlich'}
        </p>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Receipt className="h-4 w-4" />
          Haushaltsrechnung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Einnahmen */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Einnahmen
          </h4>
          <div className="flex justify-between py-1.5 border-b">
            <span className="text-sm">Mieteinnahmen {showMonthly && <span className="text-muted-foreground">(×12)</span>}</span>
            <span className="text-sm font-medium text-green-600">
              +{formatCurrency(year1?.rent || summary.yearlyRent)}
              {showMonthly && <span className="text-xs text-muted-foreground ml-1">({formatCurrency((year1?.rent || summary.yearlyRent) / 12)}/Mo)</span>}
            </span>
          </div>
        </div>

        {/* Ausgaben */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Ausgaben
          </h4>
          <div className="flex justify-between py-1.5 border-b">
            <span className="text-sm">Darlehensrate (Zins + Tilgung)</span>
            <span className="text-sm font-medium text-red-600">
              -{formatCurrency(summary.yearlyInterest + summary.yearlyRepayment)}
              {showMonthly && <span className="text-xs text-muted-foreground ml-1">({formatCurrency((summary.yearlyInterest + summary.yearlyRepayment) / 12)}/Mo)</span>}
            </span>
          </div>
          <div className="flex justify-between py-1.5 border-b text-muted-foreground">
            <span className="text-xs pl-4">davon Zinsen</span>
            <span className="text-xs">{formatCurrency(summary.yearlyInterest)}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b text-muted-foreground">
            <span className="text-xs pl-4">davon Tilgung</span>
            <span className="text-xs">{formatCurrency(summary.yearlyRepayment)}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b">
            <span className="text-sm">Verwaltung / Hausgeld</span>
            <span className="text-sm font-medium text-red-600">
              -{formatCurrency(300)}
            </span>
          </div>
        </div>

        {/* Steuereffekt */}
        <div>
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
            Steuereffekt
          </h4>
          <div className="flex justify-between py-1.5 border-b text-muted-foreground">
            <span className="text-xs">AfA (Abschreibung)</span>
            <span className="text-xs">{formatCurrency(summary.yearlyAfa)} (Abzug)</span>
          </div>
          <div className="flex justify-between py-1.5 border-b">
            <span className="text-sm">Steuerersparnis</span>
            <span className="text-sm font-medium text-green-600">
              +{formatCurrency(summary.yearlyTaxSavings)}
              {showMonthly && <span className="text-xs text-muted-foreground ml-1">({formatCurrency(summary.yearlyTaxSavings / 12)}/Mo)</span>}
            </span>
          </div>
        </div>

        {/* Ergebnis */}
        <div className={cn(
          "p-4 rounded-lg mt-4",
          isPositive ? 'bg-green-50 border border-green-200' : 'bg-muted/50'
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PiggyBank className={cn("h-5 w-5", isPositive ? 'text-green-600' : 'text-muted-foreground')} />
              <span className="font-semibold">NETTO-BELASTUNG</span>
            </div>
            <div className="text-right">
              <p className={cn("text-2xl font-bold", isPositive ? 'text-green-600' : 'text-foreground')}>
                {isPositive ? '+' : ''}{formatCurrency(summary.monthlyBurden)}/Mo
              </p>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(summary.monthlyBurden * 12)}/Jahr
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {isPositive 
              ? '✓ Sie verdienen jeden Monat mit dieser Immobilie.' 
              : 'Monatlicher Eigenanteil nach Steuervorteil'}
          </p>
        </div>

        {/* ROI Info */}
        <div className="grid grid-cols-2 gap-4 pt-3 border-t text-center">
          <div>
            <p className="text-xs text-muted-foreground">ROI vor Steuern</p>
            <p className="font-semibold">{summary.roiBeforeTax.toFixed(2)}%</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">ROI nach Steuern</p>
            <p className={cn("font-semibold", summary.roiAfterTax >= 0 ? 'text-green-600' : 'text-red-600')}>
              {summary.roiAfterTax.toFixed(2)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
