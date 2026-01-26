import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calculator, TrendingUp, Euro, Percent, FileText } from 'lucide-react';
import { useInvestmentEngine, CalculationInput, CalculationResult, defaultInput } from '@/hooks/useInvestmentEngine';
import { InvestmentResultCard } from './InvestmentResultCard';
import { InvestmentProjectionChart } from './InvestmentProjectionChart';

const BUNDESLAENDER = [
  { code: 'BW', name: 'Baden-Württemberg' },
  { code: 'BY', name: 'Bayern' },
  { code: 'BE', name: 'Berlin' },
  { code: 'BB', name: 'Brandenburg' },
  { code: 'HB', name: 'Bremen' },
  { code: 'HH', name: 'Hamburg' },
  { code: 'HE', name: 'Hessen' },
  { code: 'MV', name: 'Mecklenburg-Vorpommern' },
  { code: 'NI', name: 'Niedersachsen' },
  { code: 'NW', name: 'Nordrhein-Westfalen' },
  { code: 'RP', name: 'Rheinland-Pfalz' },
  { code: 'SL', name: 'Saarland' },
  { code: 'SN', name: 'Sachsen' },
  { code: 'ST', name: 'Sachsen-Anhalt' },
  { code: 'SH', name: 'Schleswig-Holstein' },
  { code: 'TH', name: 'Thüringen' },
];

interface Props {
  initialData?: Partial<CalculationInput>;
  onResult?: (result: CalculationResult) => void;
  compact?: boolean;
}

export function InvestmentCalculator({ initialData, onResult, compact = false }: Props) {
  const [input, setInput] = useState<CalculationInput>({ ...defaultInput, ...initialData });
  const { calculate, result, isLoading, error } = useInvestmentEngine();

  const handleCalculate = async () => {
    const res = await calculate(input);
    if (res && onResult) {
      onResult(res);
    }
  };

  const updateInput = <K extends keyof CalculationInput>(key: K, value: CalculationInput[K]) => {
    setInput(prev => ({ ...prev, [key]: value }));
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className={`grid gap-6 ${compact ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
        {/* Objektdaten */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Euro className="h-4 w-4" />
              Objektdaten
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Kaufpreis (€)</Label>
              <Input
                type="number"
                value={input.purchasePrice}
                onChange={(e) => updateInput('purchasePrice', Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Monatliche Kaltmiete (€)</Label>
              <Input
                type="number"
                value={input.monthlyRent}
                onChange={(e) => updateInput('monthlyRent', Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Gebäudeanteil: {Math.round(input.buildingShare * 100)}%</Label>
              <Slider
                value={[input.buildingShare * 100]}
                onValueChange={([v]) => updateInput('buildingShare', v / 100)}
                min={50}
                max={95}
                step={5}
              />
            </div>
          </CardContent>
        </Card>

        {/* Finanzierung */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Percent className="h-4 w-4" />
              Finanzierung
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Eigenkapital (€)</Label>
              <Input
                type="number"
                value={input.equity}
                onChange={(e) => updateInput('equity', Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Zinsbindung</Label>
              <Select
                value={String(input.termYears)}
                onValueChange={(v) => updateInput('termYears', Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 Jahre</SelectItem>
                  <SelectItem value="10">10 Jahre</SelectItem>
                  <SelectItem value="15">15 Jahre</SelectItem>
                  <SelectItem value="20">20 Jahre</SelectItem>
                  <SelectItem value="25">25 Jahre</SelectItem>
                  <SelectItem value="30">30 Jahre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tilgung: {input.repaymentRate}%</Label>
              <Slider
                value={[input.repaymentRate]}
                onValueChange={([v]) => updateInput('repaymentRate', v)}
                min={1}
                max={5}
                step={0.5}
              />
            </div>
          </CardContent>
        </Card>

        {/* Steuerdaten */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Steuerdaten
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Zu versteuerndes Einkommen (€)</Label>
              <Input
                type="number"
                value={input.taxableIncome}
                onChange={(e) => updateInput('taxableIncome', Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Familienstand</Label>
              <Select
                value={input.maritalStatus}
                onValueChange={(v) => updateInput('maritalStatus', v as 'single' | 'married')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Ledig / Grundtarif</SelectItem>
                  <SelectItem value="married">Verheiratet / Splittingtarif</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Kirchensteuer</Label>
              <Switch
                checked={input.hasChurchTax}
                onCheckedChange={(v) => updateInput('hasChurchTax', v)}
              />
            </div>
            {input.hasChurchTax && (
              <div>
                <Label>Bundesland</Label>
                <Select
                  value={input.churchTaxState || ''}
                  onValueChange={(v) => updateInput('churchTaxState', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {BUNDESLAENDER.map((bl) => (
                      <SelectItem key={bl.code} value={bl.code}>
                        {bl.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>AfA-Modell</Label>
              <Select
                value={input.afaModel}
                onValueChange={(v) => updateInput('afaModel', v as CalculationInput['afaModel'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Linear 2%</SelectItem>
                  <SelectItem value="7i">§7i Denkmal</SelectItem>
                  <SelectItem value="7h">§7h Sanierungsgebiet</SelectItem>
                  <SelectItem value="7b">§7b Neubau</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projection Settings */}
      {!compact && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Wertentwicklung (Projektion)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-3">
            <div>
              <Label>Wertsteigerung p.a.: {input.valueGrowthRate}%</Label>
              <Slider
                value={[input.valueGrowthRate]}
                onValueChange={([v]) => updateInput('valueGrowthRate', v)}
                min={0}
                max={5}
                step={0.5}
              />
            </div>
            <div>
              <Label>Mietsteigerung p.a.: {input.rentGrowthRate}%</Label>
              <Slider
                value={[input.rentGrowthRate]}
                onValueChange={([v]) => updateInput('rentGrowthRate', v)}
                min={0}
                max={5}
                step={0.5}
              />
            </div>
            <div>
              <Label>Verwaltung mtl. (€)</Label>
              <Input
                type="number"
                value={input.managementCostMonthly}
                onChange={(e) => updateInput('managementCostMonthly', Number(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Calculate Button */}
      <div className="flex gap-4">
        <Button onClick={handleCalculate} disabled={isLoading} className="flex-1">
          <Calculator className="mr-2 h-4 w-4" />
          {isLoading ? 'Berechne...' : 'Jetzt berechnen'}
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive">
          {error}
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6">
          <InvestmentResultCard result={result} />
          {!compact && <InvestmentProjectionChart projection={result.projection} />}
        </div>
      )}
    </div>
  );
}
