/**
 * R-8: Portfolio charts — Vermögensentwicklung + EÜR
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartCard } from '@/components/ui/chart-card';
import { DESIGN } from '@/config/designManifest';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Area, ComposedChart } from 'recharts';
import { calculateTax, type TaxAssessmentType } from '@/lib/taxCalculator';
import { formatCurrency } from './portfolioHelpers';
import type { PortfolioTotals, PortfolioLandlordContext, LoanData, NkAggregation } from './portfolioTypes';

interface PortfolioChartsProps {
  totals: PortfolioTotals | null;
  hasData: boolean;
  loansData: LoanData[] | undefined;
  nkAggregation: NkAggregation;
  selectedContext: PortfolioLandlordContext | undefined;
}

export function PortfolioCharts({ totals, hasData, loansData, nkAggregation, selectedContext }: PortfolioChartsProps) {
  const amortizationData = useMemo(() => {
    if (!totals || totals.totalDebt <= 0) return [];
    const appreciationRate = 0.02;
    const years = [];
    let currentDebt = totals.totalDebt;
    let currentValue = totals.totalValue;
    const annuity = totals.totalAnnuity;
    const interestRate = totals.avgInterestRate / 100;
    for (let year = 0; year <= 30; year++) {
      years.push({ year: 2026 + year, objektwert: Math.round(currentValue), restschuld: Math.max(0, Math.round(currentDebt)), vermoegen: Math.round(currentValue - currentDebt) });
      const interest = currentDebt * interestRate;
      const amortization = Math.min(annuity - interest, currentDebt);
      currentDebt = Math.max(0, currentDebt - amortization);
      currentValue = currentValue * (1 + appreciationRate);
    }
    return years;
  }, [totals]);

  // EÜR calculation
  const eurContent = useMemo(() => {
    if (!hasData || !totals) return null;
    const monthlyRent = totals.totalIncome / 12;
    const annualInterest = loansData?.reduce((sum, l) => sum + ((l.outstanding_balance_eur || 0) * ((l.interest_rate_percent || 0) / 100)), 0) || 0;
    const monthlyInterest = annualInterest / 12;
    const monthlyAmortization = (totals.totalAnnuity - annualInterest) / 12;
    const hasNKData = nkAggregation.hasData;
    const monthlyNK = hasNKData ? nkAggregation.annualTotal! / 12 : null;
    const isCommercial = selectedContext?.context_type === 'BUSINESS';
    const hasZvE = !isCommercial && selectedContext?.taxable_income_yearly != null && selectedContext.taxable_income_yearly > 0;
    let monthlyTaxBenefit: number | null = null;
    if (isCommercial) { monthlyTaxBenefit = 0; }
    else if (hasZvE) {
      const assessmentType: TaxAssessmentType = selectedContext?.tax_assessment_type === 'SPLITTING' ? 'SPLITTING' : 'EINZEL';
      const taxResult = calculateTax({ taxableIncome: selectedContext!.taxable_income_yearly!, assessmentType, churchTax: selectedContext?.church_tax ?? false, childrenCount: selectedContext?.children_count ?? 0 });
      const marginalRate = taxResult.marginalTaxRate / 100;
      const afaAnnual = totals.totalValue * 0.02;
      const nkForTax = hasNKData ? nkAggregation.annualTotal! : 0;
      monthlyTaxBenefit = ((annualInterest + nkForTax + afaAnnual) * marginalRate) / 12;
    }
    const totalIncomeValue = monthlyRent + (monthlyTaxBenefit ?? 0);
    const totalExpensesValue = monthlyInterest + monthlyAmortization + (monthlyNK ?? 0);
    const monthlyResult = totalIncomeValue - totalExpensesValue;
    return { monthlyRent, monthlyInterest, monthlyAmortization, monthlyNK, monthlyTaxBenefit, totalIncomeValue, totalExpensesValue, monthlyResult, isCommercial };
  }, [totals, hasData, loansData, nkAggregation, selectedContext]);

  return (
    <div className={DESIGN.FORM_GRID.FULL}>
      <ChartCard title="Vermögensentwicklung (30 Jahre)" aspectRatio="none">
        {hasData && amortizationData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={amortizationData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="year" tick={{ fontSize: 11 }} tickFormatter={(v) => v.toString().slice(2)} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} labelFormatter={(label) => `Jahr ${label}`} />
              <Legend />
              <Area type="monotone" dataKey="objektwert" name="Objektwert" stroke="hsl(210, 70%, 50%)" fill="hsl(210, 70%, 50%)" fillOpacity={0.15} />
              <Area type="monotone" dataKey="vermoegen" name="Netto-Vermögen" stroke="hsl(142, 70%, 45%)" fill="hsl(142, 70%, 45%)" fillOpacity={0.4} />
              <Line type="monotone" dataKey="restschuld" name="Restschuld" stroke="hsl(0, 70%, 50%)" strokeWidth={2} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[280px] flex items-center justify-center text-muted-foreground">
            <div className="text-center"><p>Keine Finanzierungsdaten vorhanden</p><p className="text-xs mt-1">Fügen Sie Immobilien mit Finanzierung hinzu</p></div>
          </div>
        )}
      </ChartCard>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-lg">Monatliche Übersicht (EÜR)</CardTitle></CardHeader>
        <CardContent>
          {eurContent ? (
            <>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="font-medium text-green-600 mb-3">Einnahmen</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>Mieteinnahmen</span><span className="font-medium">{formatCurrency(eurContent.monthlyRent)}</span></div>
                    {!eurContent.isCommercial && (<div className="flex justify-between"><span>Steuervorteil</span><span className="font-medium">{eurContent.monthlyTaxBenefit !== null ? formatCurrency(eurContent.monthlyTaxBenefit) : 'k.A.'}</span></div>)}
                    <div className="border-t pt-2 mt-2"><div className="flex justify-between font-semibold"><span>Summe</span><span className="text-green-600">{formatCurrency(eurContent.totalIncomeValue)}</span></div></div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-red-600 mb-3">Ausgaben</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span>Nicht umlf. NK</span><span className="font-medium text-red-600">{eurContent.monthlyNK !== null ? `-${formatCurrency(eurContent.monthlyNK)}` : 'k.A.'}</span></div>
                    <div className="flex justify-between"><span>Zinsen</span><span className="font-medium text-red-600">-{formatCurrency(eurContent.monthlyInterest)}</span></div>
                    <div className="flex justify-between"><span>Tilgung</span><span className="font-medium text-red-600">-{formatCurrency(eurContent.monthlyAmortization)}</span></div>
                    <div className="border-t pt-2 mt-2"><div className="flex justify-between font-semibold"><span>Summe</span><span className="text-red-600">-{formatCurrency(eurContent.totalExpensesValue)}</span></div></div>
                  </div>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t text-center">
                <span className="text-muted-foreground">Monatliches Ergebnis: </span>
                <span className={`text-lg font-bold ${eurContent.monthlyResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>{eurContent.monthlyResult >= 0 ? '+' : ''}{formatCurrency(eurContent.monthlyResult)}</span>
                {(eurContent.monthlyNK === null || eurContent.monthlyTaxBenefit === null) && !eurContent.isCommercial && (<p className="text-xs text-muted-foreground mt-1">Hinweis: Unvollständige Daten — Positionen mit „k.A." sind nicht in der Summe enthalten.</p>)}
              </div>
            </>
          ) : (
            <div className="h-[200px] flex items-center justify-center text-muted-foreground"><div className="text-center"><p>Keine Einnahmen-/Ausgabendaten vorhanden</p><p className="text-xs mt-1">Fügen Sie Immobilien mit Mieteinnahmen hinzu</p></div></div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
