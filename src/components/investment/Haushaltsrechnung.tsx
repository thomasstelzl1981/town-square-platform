import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalculationResult } from '@/hooks/useInvestmentEngine';
import { Receipt, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface HaushaltsrechnungProps {
  result: CalculationResult;
  variant?: 'compact' | 'detailed' | 'ledger';
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
  const isMobile = useIsMobile();
  
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

  // Mobile: Hide per-month details in line items to avoid line breaks
  const shouldShowMonthlyDetail = showMonthly && !isMobile;

  // T-Konto / Adenauer-Kreuz Variante
  if (variant === 'ledger') {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Haushaltsrechnung
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          {/* T-Konto Grid */}
          <div className="grid md:grid-cols-2 gap-0 border rounded-lg overflow-hidden">
            {/* Linke Spalte: Einnahmen */}
            <div className="p-4 bg-green-50/50 dark:bg-green-950/20 border-l-4 border-l-green-500">
              <h4 className="text-sm font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-3">
                Einnahmen p.a.
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">+ Mieteinnahmen</span>
                  <span className="text-sm font-medium text-green-600">
                    {formatCurrency(year1?.rent || summary.yearlyRent)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">+ Steuerersparnis</span>
                  <span className="text-sm font-medium text-green-600">
                    {formatCurrency(summary.yearlyTaxSavings)}
                  </span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span className="text-sm">Σ Einnahmen</span>
                    <span className="text-sm text-green-600">
                      {formatCurrency((year1?.rent || summary.yearlyRent) + summary.yearlyTaxSavings)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Rechte Spalte: Ausgaben */}
            <div className="p-4 bg-red-50/50 dark:bg-red-950/20 border-l border-l-red-500 md:border-l-4">
              <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 uppercase tracking-wide mb-3">
                Ausgaben p.a.
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">− Zinsen</span>
                  <span className="text-sm font-medium text-red-600">
                    {formatCurrency(summary.yearlyInterest)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">− Tilgung</span>
                  <span className="text-sm font-medium text-red-600">
                    {formatCurrency(summary.yearlyRepayment)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">− Verwaltung</span>
                  <span className="text-sm font-medium text-red-600">
                    {formatCurrency(300)}
                  </span>
                </div>
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span className="text-sm">Σ Ausgaben</span>
                    <span className="text-sm text-red-600">
                      {formatCurrency(summary.yearlyInterest + summary.yearlyRepayment + 300)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ergebnis Footer */}
          <div className={cn(
            "p-4 rounded-b-lg mt-0 -mx-6 -mb-6 px-6",
            isPositive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-muted/50'
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
        </CardContent>
      </Card>
    );
  }

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

  // Mobile: Stacked vertical layout
  if (isMobile) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Haushaltsrechnung
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Ergebnis zuerst auf Mobile */}
          <div className={cn(
            "p-4 rounded-lg",
            isPositive ? 'bg-green-50 border border-green-200' : 'bg-muted/50'
          )}>
            <div className="flex items-center gap-2 mb-2">
              <PiggyBank className={cn("h-5 w-5", isPositive ? 'text-green-600' : 'text-muted-foreground')} />
              <span className="font-semibold text-sm">NETTO-BELASTUNG</span>
            </div>
            <p className={cn("text-3xl font-bold", isPositive ? 'text-green-600' : 'text-foreground')}>
              {isPositive ? '+' : ''}{formatCurrency(summary.monthlyBurden)}/Mo
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(summary.monthlyBurden * 12)}/Jahr
            </p>
          </div>

          {/* Kompakte Übersicht */}
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm">Mieteinnahmen</span>
              <span className="text-sm font-medium text-green-600">
                +{formatCurrency(year1?.rent || summary.yearlyRent)}/Jahr
              </span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm">Darlehensrate</span>
              <span className="text-sm font-medium text-red-600">
                -{formatCurrency(summary.yearlyInterest + summary.yearlyRepayment)}/Jahr
              </span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-sm">Steuerersparnis</span>
              <span className="text-sm font-medium text-green-600">
                +{formatCurrency(summary.yearlyTaxSavings)}/Jahr
              </span>
            </div>
          </div>

          {/* ROI */}
          <div className="grid grid-cols-2 gap-4 pt-2 text-center">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground">ROI vor Steuern</p>
              <p className="font-semibold">{summary.roiBeforeTax.toFixed(2)}%</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
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

  // Desktop: Full detailed layout
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
            <span className="text-sm">Mieteinnahmen {shouldShowMonthlyDetail && <span className="text-muted-foreground">(×12)</span>}</span>
            <span className="text-sm font-medium text-green-600">
              +{formatCurrency(year1?.rent || summary.yearlyRent)}
              {shouldShowMonthlyDetail && <span className="text-xs text-muted-foreground ml-1">({formatCurrency((year1?.rent || summary.yearlyRent) / 12)}/Mo)</span>}
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
              {shouldShowMonthlyDetail && <span className="text-xs text-muted-foreground ml-1">({formatCurrency((summary.yearlyInterest + summary.yearlyRepayment) / 12)}/Mo)</span>}
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
              {shouldShowMonthlyDetail && <span className="text-xs text-muted-foreground ml-1">({formatCurrency(summary.yearlyTaxSavings / 12)}/Mo)</span>}
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
