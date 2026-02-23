/**
 * BestandCalculation — 30-Year Hold Projection with Charts
 * CI-konform: DESIGN Tokens für Farben, Typografie, Cards
 */
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calculator, TrendingUp, Loader2, RefreshCcw } from 'lucide-react';
import { useRunCalcBestand } from '@/hooks/useAcqOffers';
import { calcBestandFull } from '@/engines/akquiseCalc/engine';
import type { BestandFullParams } from '@/engines/akquiseCalc/spec';
import { DESIGN } from '@/config/designManifest';
import { cn } from '@/lib/utils';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, ComposedChart, Line
} from 'recharts';
import { MobileChartWrapper } from '@/components/shared/MobileChartWrapper';
import { useIsMobile } from '@/hooks/use-mobile';

interface BestandCalculationProps {
  offerId?: string;
  initialData: {
    purchasePrice: number;
    monthlyRent: number;
    units?: number;
    areaSqm?: number;
  };
  temporary?: boolean;
  hideQuickAnalysis?: boolean;
}

// Types now come from engine spec

export function BestandCalculation({ offerId, initialData, temporary = false, hideQuickAnalysis = false }: BestandCalculationProps) {
  const runCalc = useRunCalcBestand();
  const isMobile = useIsMobile();
  const [params, setParams] = React.useState<BestandFullParams>({
    purchasePrice: initialData.purchasePrice,
    monthlyRent: initialData.monthlyRent,
    equityPercent: 20,
    interestRate: 4.0,
    repaymentRate: 2.0,
    rentIncreaseRate: 2.0,
    valueIncreaseRate: 2.0,
    managementCostPercent: 25,
    maintenancePercent: 1.0,
    ancillaryCostPercent: 10,
  });

  // Calculate everything via engine
  const calculation = React.useMemo(() => calcBestandFull(params), [params]);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

  const handleSave = () => {
    if (!offerId || temporary) return;
    runCalc.mutate({ offerId, params: params as unknown as Record<string, unknown> });
  };

  return (
    <div className="space-y-6">
      {/* Quick Analysis — only if not hidden by parent */}
      {!hideQuickAnalysis && (
        <Card className={cn(DESIGN.CARD.BASE, DESIGN.INFO_BANNER.PREMIUM)}>
          <CardHeader className="pb-2">
            <CardTitle className={DESIGN.TYPOGRAPHY.CARD_TITLE}>Schnellanalyse</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn('grid gap-4', isMobile ? 'grid-cols-2' : 'grid-cols-4')}>
              <div>
                <div className={DESIGN.TYPOGRAPHY.HINT}>Gesamtinvestition</div>
                <div className={DESIGN.TYPOGRAPHY.VALUE + ' text-xl'}>{formatCurrency(calculation.totalInvestment)}</div>
              </div>
              <div>
                <div className={DESIGN.TYPOGRAPHY.HINT}>Max. Finanzierbarkeit</div>
                <div className={DESIGN.TYPOGRAPHY.VALUE + ' text-xl'}>{formatCurrency(calculation.maxFinancing)}</div>
              </div>
              <div>
                <div className={DESIGN.TYPOGRAPHY.HINT}>EK-Bedarf</div>
                <div className={DESIGN.TYPOGRAPHY.VALUE + ' text-xl'}>{formatCurrency(calculation.equity)}</div>
              </div>
              <div>
                <div className={DESIGN.TYPOGRAPHY.HINT}>Bruttorendite</div>
                <div className={DESIGN.TYPOGRAPHY.VALUE + ' text-xl'}>{calculation.grossYield.toFixed(2)}%</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sliders */}
      <Card className={DESIGN.CARD.BASE}>
        <CardHeader>
          <CardTitle className={cn(DESIGN.TYPOGRAPHY.CARD_TITLE, 'flex items-center gap-2')}>
            <Calculator className="h-5 w-5" />
            Finanzierungsparameter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className={cn('grid gap-6', isMobile ? 'grid-cols-1' : 'md:grid-cols-2')}>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Eigenkapital</Label>
                <span className={DESIGN.TYPOGRAPHY.BODY + ' font-medium'}>{params.equityPercent}% ({formatCurrency(calculation.equity)})</span>
              </div>
              <Slider value={[params.equityPercent]} min={5} max={50} step={1} onValueChange={([v]) => setParams(p => ({ ...p, equityPercent: v }))} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Zinssatz p.a.</Label>
                <span className={DESIGN.TYPOGRAPHY.BODY + ' font-medium'}>{params.interestRate.toFixed(1)}%</span>
              </div>
              <Slider value={[params.interestRate * 10]} min={10} max={80} step={1} onValueChange={([v]) => setParams(p => ({ ...p, interestRate: v / 10 }))} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Tilgung p.a.</Label>
                <span className={DESIGN.TYPOGRAPHY.BODY + ' font-medium'}>{params.repaymentRate.toFixed(1)}%</span>
              </div>
              <Slider value={[params.repaymentRate * 10]} min={5} max={50} step={1} onValueChange={([v]) => setParams(p => ({ ...p, repaymentRate: v / 10 }))} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Mietsteigerung p.a.</Label>
                <span className={DESIGN.TYPOGRAPHY.BODY + ' font-medium'}>{params.rentIncreaseRate.toFixed(1)}%</span>
              </div>
              <Slider value={[params.rentIncreaseRate * 10]} min={0} max={50} step={1} onValueChange={([v]) => setParams(p => ({ ...p, rentIncreaseRate: v / 10 }))} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Wertsteigerung p.a.</Label>
                <span className={DESIGN.TYPOGRAPHY.BODY + ' font-medium'}>{params.valueIncreaseRate.toFixed(1)}%</span>
              </div>
              <Slider value={[params.valueIncreaseRate * 10]} min={0} max={50} step={1} onValueChange={([v]) => setParams(p => ({ ...p, valueIncreaseRate: v / 10 }))} />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Verwaltungskosten</Label>
                <span className={DESIGN.TYPOGRAPHY.BODY + ' font-medium'}>{params.managementCostPercent}%</span>
              </div>
              <Slider value={[params.managementCostPercent]} min={10} max={40} step={1} onValueChange={([v]) => setParams(p => ({ ...p, managementCostPercent: v }))} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financing Overview */}
      <Card className={DESIGN.CARD.BASE}>
        <CardHeader>
          <CardTitle className={DESIGN.TYPOGRAPHY.CARD_TITLE}>Finanzierungsübersicht</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn('grid gap-4 text-center', isMobile ? 'grid-cols-2' : 'grid-cols-5')}>
            <div>
              <div className={DESIGN.TYPOGRAPHY.HINT}>Gesamtinvest.</div>
              <div className="font-bold">{formatCurrency(calculation.totalInvestment)}</div>
            </div>
            <div>
              <div className={DESIGN.TYPOGRAPHY.HINT}>Eigenkapital</div>
              <div className="font-bold text-emerald-500">{formatCurrency(calculation.equity)}</div>
            </div>
            <div>
              <div className={DESIGN.TYPOGRAPHY.HINT}>Darlehen</div>
              <div className="font-bold text-primary">{formatCurrency(calculation.loanAmount)}</div>
            </div>
            <div>
              <div className={DESIGN.TYPOGRAPHY.HINT}>Annuität p.a.</div>
              <div className="font-bold">{formatCurrency(calculation.yearlyAnnuity)}</div>
            </div>
            <div>
              <div className={DESIGN.TYPOGRAPHY.HINT}>Rate mtl.</div>
              <div className="font-bold">{formatCurrency(calculation.monthlyRate)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monatliche Wirtschaftlichkeit — Einnahmen vs. Ausgaben */}
      <Card className={cn(DESIGN.CARD.BASE, 'border-primary/20')}>
        <CardHeader>
          <CardTitle className={cn(DESIGN.TYPOGRAPHY.CARD_TITLE, 'flex items-center gap-2')}>
            <TrendingUp className="h-5 w-5" />
            Monatliche Wirtschaftlichkeit
          </CardTitle>
          <CardDescription className={DESIGN.TYPOGRAPHY.HINT}>Gegenüberstellung Einnahmen und Ausgaben (Jahr 1)</CardDescription>
        </CardHeader>
        <CardContent>
          {(() => {
            const monthlyRentVal = params.monthlyRent;
            const monthlyInterest = calculation.yearlyData[0]?.interest ? calculation.yearlyData[0].interest / 12 : 0;
            const monthlyRepayment = calculation.yearlyData[0]?.repayment ? calculation.yearlyData[0].repayment / 12 : 0;
            const monthlyManagement = monthlyRentVal * params.managementCostPercent / 100;
            const monthlyMaintenance = params.purchasePrice * (params.maintenancePercent || 1) / 100 / 12;
            const totalIncome = monthlyRentVal;
            const totalExpenses = monthlyInterest + monthlyRepayment + monthlyManagement + monthlyMaintenance;
            const monthlyCashflow = totalIncome - totalExpenses;
            const yearlyCashflow = monthlyCashflow * 12;
            const cashOnCash = calculation.equity > 0 ? (yearlyCashflow / calculation.equity) * 100 : 0;

            return (
              <div className="space-y-4">
                <div className={cn('grid gap-6', isMobile ? 'grid-cols-1' : 'grid-cols-2')}>
                  {/* Einnahmen */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-primary uppercase tracking-wider">Einnahmen</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Kaltmiete</span>
                        <span className="font-medium">{formatCurrency(monthlyRentVal)}</span>
                      </div>
                    </div>
                    <div className="border-t border-border/50 pt-2 flex justify-between text-sm font-bold">
                      <span>Summe</span>
                      <span className="text-primary">{formatCurrency(totalIncome)}</span>
                    </div>
                  </div>
                  {/* Ausgaben */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-destructive uppercase tracking-wider">Ausgaben</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Zinsen</span>
                        <span className="font-medium">{formatCurrency(monthlyInterest)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tilgung</span>
                        <span className="font-medium">{formatCurrency(monthlyRepayment)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Verwaltung ({params.managementCostPercent}%)</span>
                        <span className="font-medium">{formatCurrency(monthlyManagement)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Instandhaltung ({params.maintenancePercent}%)</span>
                        <span className="font-medium">{formatCurrency(monthlyMaintenance)}</span>
                      </div>
                    </div>
                    <div className="border-t border-border/50 pt-2 flex justify-between text-sm font-bold">
                      <span>Summe</span>
                      <span className="text-destructive">{formatCurrency(totalExpenses)}</span>
                    </div>
                  </div>
                </div>
                {/* Cashflow Result */}
                <div className={cn(
                  'rounded-xl p-4 text-center',
                  monthlyCashflow >= 0 ? 'bg-chart-2/10 border border-chart-2/30' : 'bg-destructive/10 border border-destructive/30'
                )}>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Monatlicher Cashflow</div>
                  <div className={cn('text-2xl font-bold', monthlyCashflow >= 0 ? 'text-chart-2' : 'text-destructive')}>
                    {formatCurrency(monthlyCashflow)} / Monat
                  </div>
                  <div className="flex justify-center gap-6 mt-2 text-sm text-muted-foreground">
                    <span>Jährlich: <strong className={monthlyCashflow >= 0 ? 'text-chart-2' : 'text-destructive'}>{formatCurrency(yearlyCashflow)}</strong></span>
                    <span>Cash-on-Cash: <strong className={cashOnCash >= 0 ? 'text-chart-2' : 'text-destructive'}>{cashOnCash.toFixed(1)}%</strong></span>
                  </div>
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* Amortization Chart */}
      <Card className={DESIGN.CARD.BASE}>
        <CardHeader>
          <CardTitle className={DESIGN.TYPOGRAPHY.CARD_TITLE}>Tilgungsplan (30 Jahre)</CardTitle>
        </CardHeader>
        <CardContent>
          <MobileChartWrapper
            title="Tilgungsplan"
            mobileKPIs={[
              { label: 'Volltilgung', value: `${calculation.fullRepaymentYear} J.`, color: 'text-primary' },
              { label: 'Zinsen ges.', value: formatCurrency(calculation.totalInterest), color: 'text-destructive' },
              { label: 'Tilgung ges.', value: formatCurrency(calculation.totalRepayment), color: 'text-primary' },
            ]}
          >
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={calculation.yearlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis yAxisId="left" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} labelFormatter={(label) => `Jahr ${label}`} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="interest" stackId="a" fill="hsl(var(--destructive))" name="Zinsen" />
                  <Bar yAxisId="left" dataKey="repayment" stackId="a" fill="hsl(var(--primary))" name="Tilgung" />
                  <Line yAxisId="right" type="monotone" dataKey="remainingDebt" stroke="hsl(var(--muted-foreground))" strokeWidth={2} name="Restschuld" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </MobileChartWrapper>
        </CardContent>
      </Card>

      {/* Wealth Chart */}
      <Card className={DESIGN.CARD.BASE}>
        <CardHeader>
          <CardTitle className={cn(DESIGN.TYPOGRAPHY.CARD_TITLE, 'flex items-center gap-2')}>
            <TrendingUp className="h-5 w-5" />
            Vermögensentwicklung (30 Jahre)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MobileChartWrapper
            title="Vermögensentwicklung"
            mobileKPIs={[
              { label: 'Vermögen 10J', value: formatCurrency(calculation.wealth10), color: 'text-emerald-500' },
              { label: 'Vermögen 20J', value: formatCurrency(calculation.wealth20), color: 'text-emerald-500' },
              { label: 'Wert 40J', value: formatCurrency(calculation.value40), color: 'text-primary' },
            ]}
          >
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={calculation.yearlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis tickFormatter={(v) => `${(v/1000000).toFixed(1)}M`} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} labelFormatter={(label) => `Jahr ${label}`} />
                  <Legend />
                  <Area type="monotone" dataKey="propertyValue" fill="hsl(var(--primary))" fillOpacity={0.3} stroke="hsl(var(--primary))" name="Objektwert" />
                  <Area type="monotone" dataKey="remainingDebt" fill="hsl(var(--destructive))" fillOpacity={0.3} stroke="hsl(var(--destructive))" name="Restschuld" />
                  <Area type="monotone" dataKey="equity" fill="hsl(var(--chart-2))" fillOpacity={0.5} stroke="hsl(var(--chart-2))" name="Netto-Vermögen" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </MobileChartWrapper>
        </CardContent>
      </Card>

      {/* Summary */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className={DESIGN.CARD.BASE}>
          <CardHeader>
            <CardTitle className={DESIGN.TYPOGRAPHY.CARD_TITLE}>Finanzierung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Darlehenssumme</span>
              <span className="font-medium">{formatCurrency(calculation.loanAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Volltilgung in</span>
              <span className="font-medium">{calculation.fullRepaymentYear} Jahren</span>
            </div>
            <div className="flex justify-between text-destructive">
              <span>Zinsen gesamt</span>
              <span className="font-medium">{formatCurrency(calculation.totalInterest)}</span>
            </div>
            <div className="flex justify-between text-primary">
              <span>Tilgung gesamt</span>
              <span className="font-medium">{formatCurrency(calculation.totalRepayment)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className={DESIGN.CARD.BASE}>
          <CardHeader>
            <CardTitle className={DESIGN.TYPOGRAPHY.CARD_TITLE}>Vermögensentwicklung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Restschuld nach 10J</span>
              <span className="font-medium">{formatCurrency(calculation.debt10)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Restschuld nach 20J</span>
              <span className="font-medium">{formatCurrency(calculation.debt20)}</span>
            </div>
            <div className="flex justify-between text-emerald-500">
              <span>Vermögen nach 10J</span>
              <span className="font-medium">{formatCurrency(calculation.wealth10)}</span>
            </div>
            <div className="flex justify-between text-emerald-500">
              <span>Vermögen nach 20J</span>
              <span className="font-medium">{formatCurrency(calculation.wealth20)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Highlight KPIs */}
      <Card className={cn(DESIGN.CARD.BASE, DESIGN.INFO_BANNER.PREMIUM)}>
        <CardContent className="py-6">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <div className={DESIGN.TYPOGRAPHY.MUTED + ' mb-1'}>Objektwert nach 40J</div>
              <div className={cn(DESIGN.TYPOGRAPHY.VALUE, 'text-primary')}>{formatCurrency(calculation.value40)}</div>
            </div>
            <div>
              <div className={DESIGN.TYPOGRAPHY.MUTED + ' mb-1'}>Vermögenszuwachs gesamt</div>
              <div className={cn(DESIGN.TYPOGRAPHY.VALUE, 'text-emerald-500')}>{formatCurrency(calculation.wealthGrowth)}</div>
            </div>
            <div>
              <div className={DESIGN.TYPOGRAPHY.MUTED + ' mb-1'}>ROI auf EK</div>
              <div className={cn(DESIGN.TYPOGRAPHY.VALUE, 'text-amber-500')}>{calculation.roi.toFixed(1)}%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      {!temporary && offerId && (
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setParams(p => ({ ...p }))}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Zurücksetzen
          </Button>
          <Button onClick={handleSave} disabled={runCalc.isPending}>
            {runCalc.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Kalkulation speichern
          </Button>
        </div>
      )}

      {temporary && (
        <Card className={cn(DESIGN.CARD.BASE, DESIGN.INFO_BANNER.WARNING)}>
          <CardContent className="py-3">
            <p className={DESIGN.TYPOGRAPHY.MUTED}>
              <strong>Hinweis:</strong> Diese Kalkulation wird nicht gespeichert. 
              Um sie zu speichern, erstellen Sie einen Objekteingang.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default BestandCalculation;
