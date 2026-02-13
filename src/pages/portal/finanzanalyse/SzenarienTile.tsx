/**
 * MOD-18 Finanzanalyse — Szenarien
 * Was-wäre-wenn-Analysen mit Schiebereglern
 */
import { useState, useMemo } from 'react';
import { PageShell } from '@/components/shared/PageShell';
import { ModulePageHeader } from '@/components/shared/ModulePageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { GitBranch, TrendingUp, TrendingDown, Equal } from 'lucide-react';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

function formatPercent(value: number) {
  return `${value.toFixed(1)} %`;
}

export default function SzenarienTile() {
  // Scenario parameters
  const [propertyValue, setPropertyValue] = useState(500000);
  const [interestRate, setInterestRate] = useState(3.5);
  const [repaymentRate, setRepaymentRate] = useState(2.0);
  const [rentIncrease, setRentIncrease] = useState(2.0);
  const [vacancy, setVacancy] = useState(3.0);
  const [appreciation, setAppreciation] = useState(1.5);

  // Calculations
  const scenario = useMemo(() => {
    const loanAmount = propertyValue * 0.8;
    const monthlyRate = loanAmount * (interestRate + repaymentRate) / 100 / 12;
    const annualRent = propertyValue * 0.04 * (1 - vacancy / 100);
    const netCashflow = annualRent - monthlyRate * 12;
    const valueIn10y = propertyValue * Math.pow(1 + appreciation / 100, 10);
    const equityIn10y = valueIn10y - loanAmount * 0.6; // rough remaining debt after 10y
    const totalReturn = equityIn10y - propertyValue * 0.2; // vs initial equity
    const roi = (totalReturn / (propertyValue * 0.2)) * 100;

    return {
      loanAmount,
      monthlyRate,
      annualRent,
      netCashflow,
      valueIn10y,
      equityIn10y,
      totalReturn,
      roi,
    };
  }, [propertyValue, interestRate, repaymentRate, rentIncrease, vacancy, appreciation]);

  const sliders = [
    { label: 'Objektwert', value: propertyValue, set: (v: number[]) => setPropertyValue(v[0]), min: 100000, max: 2000000, step: 50000, format: formatCurrency },
    { label: 'Sollzins', value: interestRate, set: (v: number[]) => setInterestRate(v[0]), min: 1, max: 8, step: 0.1, format: formatPercent },
    { label: 'Tilgung', value: repaymentRate, set: (v: number[]) => setRepaymentRate(v[0]), min: 1, max: 5, step: 0.1, format: formatPercent },
    { label: 'Mietsteigerung p.a.', value: rentIncrease, set: (v: number[]) => setRentIncrease(v[0]), min: 0, max: 5, step: 0.5, format: formatPercent },
    { label: 'Leerstand', value: vacancy, set: (v: number[]) => setVacancy(v[0]), min: 0, max: 15, step: 0.5, format: formatPercent },
    { label: 'Wertsteigerung p.a.', value: appreciation, set: (v: number[]) => setAppreciation(v[0]), min: -2, max: 5, step: 0.1, format: formatPercent },
  ];

  const results = [
    { label: 'Darlehen (80% LTV)', value: formatCurrency(scenario.loanAmount) },
    { label: 'Monatliche Rate', value: formatCurrency(scenario.monthlyRate) },
    { label: 'Jahres-Nettomiete', value: formatCurrency(scenario.annualRent) },
    { label: 'Jährlicher Cashflow', value: formatCurrency(scenario.netCashflow), highlight: scenario.netCashflow >= 0 ? 'positive' : 'negative' },
    { label: 'Objektwert in 10 Jahren', value: formatCurrency(scenario.valueIn10y) },
    { label: 'Eigenkapital in 10 Jahren', value: formatCurrency(scenario.equityIn10y) },
    { label: 'Gesamtrendite auf EK', value: formatPercent(scenario.roi), highlight: scenario.roi >= 0 ? 'positive' : 'negative' },
  ];

  return (
    <PageShell>
      <ModulePageHeader title="Szenarien" description="Was-wäre-wenn-Analysen für Investmentimmobilien" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Parameters */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <GitBranch className="h-5 w-5" />
              Parameter
            </CardTitle>
            <CardDescription>Passen Sie die Werte an, um verschiedene Szenarien zu simulieren</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {sliders.map((s) => (
              <div key={s.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">{s.label}</Label>
                  <span className="text-sm font-mono font-medium">{s.format(s.value)}</span>
                </div>
                <Slider
                  value={[s.value]}
                  onValueChange={s.set}
                  min={s.min}
                  max={s.max}
                  step={s.step}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Ergebnis
            </CardTitle>
            <CardDescription>Prognose basierend auf Ihren Parametern</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.map((r, i) => (
              <div key={r.label}>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">{r.label}</span>
                  <span className={`text-sm font-mono font-medium ${
                    r.highlight === 'positive' ? 'text-green-600' : 
                    r.highlight === 'negative' ? 'text-red-600' : ''
                  }`}>
                    {r.highlight === 'positive' && <TrendingUp className="h-3 w-3 inline mr-1" />}
                    {r.highlight === 'negative' && <TrendingDown className="h-3 w-3 inline mr-1" />}
                    {r.value}
                  </span>
                </div>
                {i < results.length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
