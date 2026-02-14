import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, PiggyBank, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatCurrency, formatPercent } from '@/lib/formatters';

interface InvestmentKPIBlockProps {
  purchasePriceEur?: number;
  purchaseCostsEur?: number;
  valuationEur?: number;
  netColdRentPaEur?: number;
  nonAllocCostsPaEur?: number;
  cashflowPreTaxMonthlyEur?: number;
  grossYieldPercent?: number;
  netYieldPercent?: number;
}

export function InvestmentKPIBlock({
  purchasePriceEur,
  purchaseCostsEur,
  valuationEur,
  netColdRentPaEur,
  nonAllocCostsPaEur,
  cashflowPreTaxMonthlyEur,
  grossYieldPercent,
  netYieldPercent,
}: InvestmentKPIBlockProps) {
  const fmtCur = (value?: number) => value !== undefined ? formatCurrency(value) : '–';
  const fmtPct = (value?: number) => value !== undefined ? formatPercent(value, 2) : '–';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Kapitalanlage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {purchasePriceEur !== undefined && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Kaufpreis</span>
            <span className="font-medium">{fmtCur(purchasePriceEur)}</span>
          </div>
        )}
        
        {purchaseCostsEur !== undefined && (
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">+ Erwerbsnebenkosten</span>
            <span>{fmtCur(purchaseCostsEur)}</span>
          </div>
        )}

        {valuationEur !== undefined && (
          <div className="flex justify-between pt-2 border-t">
            <span className="text-muted-foreground">Bewertung</span>
            <span>{fmtCur(valuationEur)}</span>
          </div>
        )}

        {netColdRentPaEur !== undefined && (
          <div className="pt-2 border-t">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Jahreskaltmiete netto</span>
              <span>{fmtCur(netColdRentPaEur)}</span>
            </div>
            {grossYieldPercent !== undefined && (
              <div className="flex justify-between text-xs mt-1">
                <span className="text-muted-foreground">Brutto-Rendite</span>
                <span className="text-green-600">{fmtPct(grossYieldPercent)}</span>
              </div>
            )}
          </div>
        )}

        {nonAllocCostsPaEur !== undefined && (
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">– Nicht umlegbare Kosten p.a.</span>
            <span className="text-red-500">{fmtCur(nonAllocCostsPaEur)}</span>
          </div>
        )}

        {cashflowPreTaxMonthlyEur !== undefined && (
          <div className="pt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground flex items-center gap-1">
                <PiggyBank className="h-3.5 w-3.5" />
                Cashflow mtl. (vor Steuer)
              </span>
              <span className={`font-medium flex items-center gap-1 ${cashflowPreTaxMonthlyEur >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                {cashflowPreTaxMonthlyEur >= 0 ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                )}
                {fmtCur(Math.abs(cashflowPreTaxMonthlyEur))}
              </span>
            </div>
            {netYieldPercent !== undefined && (
              <div className="flex justify-between text-xs mt-1">
                <span className="text-muted-foreground">Netto-Rendite</span>
                <span>{fmtPct(netYieldPercent)}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
