/**
 * Landing Page — Unit Exposé Detail (Sub-View)
 * Investment Engine with sliders + charts
 */
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, Download, Home, MapPin, Ruler, Calendar, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Area, AreaChart, Cell } from 'recharts';
import type { DemoUnit } from '@/components/projekte/demoProjectData';
import { DEMO_UNIT_DETAIL } from '@/components/projekte/demoProjectData';
import { useInvestmentEngine, defaultInput } from '@/hooks/useInvestmentEngine';
import { toast } from 'sonner';

interface LandingPageUnitExposeProps {
  unit: DemoUnit;
  isDemo: boolean;
  onBack: () => void;
}

export function LandingPageUnitExpose({ unit, isDemo, onBack }: LandingPageUnitExposeProps) {
  const detail = DEMO_UNIT_DETAIL;
  const { calculate, result, isLoading } = useInvestmentEngine();

  // Slider states
  const [equity, setEquity] = useState(Math.round(unit.list_price * 0.2));
  const [interestRate, setInterestRate] = useState(3.5);
  const [repaymentRate, setRepaymentRate] = useState(2.0);
  const [taxableIncome, setTaxableIncome] = useState(60000);

  const runCalculation = useCallback(() => {
    calculate({
      ...defaultInput,
      purchasePrice: unit.list_price,
      monthlyRent: unit.rent_monthly,
      equity,
      termYears: 10,
      repaymentRate,
      taxableIncome,
      maritalStatus: 'single',
      hasChurchTax: false,
      afaModel: 'linear',
      buildingShare: 0.8,
      managementCostMonthly: 25,
      valueGrowthRate: 2,
      rentGrowthRate: 1.5,
    });
  }, [equity, repaymentRate, taxableIncome, unit.list_price, unit.rent_monthly, calculate]);

  useEffect(() => {
    runCalculation();
  }, [runCalculation]);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

  const loanAmount = unit.list_price - equity;
  const monthlyInterest = (loanAmount * (interestRate / 100)) / 12;
  const monthlyRepayment = (loanAmount * (repaymentRate / 100)) / 12;
  const monthlyRate = monthlyInterest + monthlyRepayment;
  const monthlyCashflow = unit.rent_monthly - monthlyRate - 25; // 25€ Verwaltung

  // Simple 10-year projection for chart
  const projectionData = Array.from({ length: 10 }, (_, i) => {
    const year = i + 1;
    const rentGrowth = Math.pow(1.015, year);
    const rent = Math.round(unit.rent_monthly * 12 * rentGrowth);
    const interest = Math.round(monthlyInterest * 12 * Math.pow(0.97, i));
    const cashflow = rent - interest - Math.round(monthlyRepayment * 12) - 300;
    return { year: `Jahr ${year}`, rent, interest, cashflow };
  });

  // Breakdown data for pie/bar chart
  const breakdownData = [
    { name: 'Mieteinnahme', value: unit.rent_monthly, fill: 'hsl(var(--primary))' },
    { name: 'Zins', value: Math.round(monthlyInterest), fill: 'hsl(var(--destructive))' },
    { name: 'Tilgung', value: Math.round(monthlyRepayment), fill: 'hsl(var(--muted-foreground))' },
    { name: 'Verwaltung', value: 25, fill: 'hsl(var(--accent-foreground))' },
  ];

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={onBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Zurück zur Übersicht
      </Button>

      {isDemo && (
        <Badge variant="secondary" className="opacity-60">Beispielberechnung</Badge>
      )}

      {/* Unit Header */}
      <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-muted">
        <div className="p-8">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">{detail.address}, {detail.postal_code} {detail.city}</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold">{unit.unit_number} — {unit.rooms}-Zimmer-Wohnung</h2>
          <p className="text-muted-foreground mt-2">{detail.description}</p>

          <div className="flex flex-wrap gap-3 mt-6">
            <Badge variant="outline" className="gap-1 bg-background/80"><Home className="h-3 w-3" />{unit.rooms} Zimmer</Badge>
            <Badge variant="outline" className="gap-1 bg-background/80"><Ruler className="h-3 w-3" />{unit.area_sqm} m²</Badge>
            <Badge variant="outline" className="gap-1 bg-background/80">{unit.floor}. OG</Badge>
            <Badge variant="outline" className="gap-1 bg-background/80"><Calendar className="h-3 w-3" />Bj. {detail.year_built}, San. {detail.renovation_year}</Badge>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Key Facts + Sliders — left 2/5 */}
        <div className="lg:col-span-2 space-y-4">
          {/* Price Facts */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Investition</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Kaufpreis</span><span className="font-semibold">{formatCurrency(unit.list_price)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Preis/m²</span><span>{formatCurrency(unit.price_per_sqm)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Stellplatz</span><span>{formatCurrency(unit.parking_price)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Mietrendite</span><span className="font-semibold text-primary">{unit.yield_percent}%</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Kaltmiete/Monat</span><span>{formatCurrency(unit.rent_monthly)}</span></div>
            </CardContent>
          </Card>

          {/* Sliders */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Investment Rechner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <SliderField
                label="Eigenkapital"
                value={equity}
                min={0}
                max={unit.list_price}
                step={5000}
                format={(v) => formatCurrency(v)}
                onChange={setEquity}
              />
              <SliderField
                label="Zins (p.a.)"
                value={interestRate}
                min={1}
                max={6}
                step={0.1}
                format={(v) => `${v.toFixed(1)}%`}
                onChange={setInterestRate}
              />
              <SliderField
                label="Tilgung (p.a.)"
                value={repaymentRate}
                min={1}
                max={5}
                step={0.1}
                format={(v) => `${v.toFixed(1)}%`}
                onChange={setRepaymentRate}
              />
              <SliderField
                label="Zu versteuerndes Einkommen"
                value={taxableIncome}
                min={20000}
                max={200000}
                step={5000}
                format={(v) => formatCurrency(v)}
                onChange={setTaxableIncome}
              />
            </CardContent>
          </Card>

          {/* Result Summary */}
          <Card className="border-primary/30">
            <CardContent className="p-5 space-y-3">
              <h4 className="font-semibold text-sm">Monatliche Übersicht</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Kreditrate</span><span className="font-medium">{formatCurrency(monthlyRate)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Mieteinnahme</span><span className="font-medium text-primary">+{formatCurrency(unit.rent_monthly)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Verwaltung</span><span>-{formatCurrency(25)}</span></div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Monatlicher Cashflow</span>
                  <span className={monthlyCashflow >= 0 ? 'text-primary' : 'text-destructive'}>
                    {monthlyCashflow >= 0 ? '+' : ''}{formatCurrency(monthlyCashflow)}
                  </span>
                </div>
              </div>

              {result?.summary && (
                <div className="pt-2 space-y-1 text-xs text-muted-foreground border-t">
                  <div className="flex justify-between"><span>ROI vor Steuer</span><span>{result.summary.roiBeforeTax?.toFixed(1)}%</span></div>
                  <div className="flex justify-between"><span>ROI nach Steuer</span><span>{result.summary.roiAfterTax?.toFixed(1)}%</span></div>
                  <div className="flex justify-between"><span>Jährl. AfA</span><span>{formatCurrency(result.summary.yearlyAfa || 0)}</span></div>
                  <div className="flex justify-between"><span>Steuerersparnis/Jahr</span><span className="text-primary">{formatCurrency(result.summary.yearlyTaxSavings || 0)}</span></div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Download */}
          <Button variant="outline" className="w-full gap-2" onClick={() => toast.info('Im Demo-Modus nicht verfügbar')}>
            <Download className="h-4 w-4" />
            Exposé downloaden
          </Button>
        </div>

        {/* Charts — right 3/5 */}
        <div className="lg:col-span-3 space-y-4">
          {/* Breakdown Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Monatliche Aufschlüsselung</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={breakdownData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v) => `${v} €`} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => `${v} €`} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                    {breakdownData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 10-Year Projection */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">10-Jahres-Projektion</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={projectionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => `${v.toLocaleString('de-DE')} €`} />
                  <Area type="monotone" dataKey="rent" name="Mieteinnahme" fill="hsl(var(--primary) / 0.2)" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <Area type="monotone" dataKey="interest" name="Zinslast" fill="hsl(var(--destructive) / 0.1)" stroke="hsl(var(--destructive))" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Cashflow Projection */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Cashflow-Entwicklung</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={projectionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => `${v.toLocaleString('de-DE')} €`} />
                  <Bar dataKey="cashflow" name="Cashflow" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function SliderField({ label, value, min, max, step, format, onChange }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{format(value)}</span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([v]) => onChange(v)}
      />
    </div>
  );
}
