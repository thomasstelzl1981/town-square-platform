import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Settings2, ChevronDown, ChevronUp } from 'lucide-react';
import { CalculationInput } from '@/hooks/useInvestmentEngine';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface InvestmentSliderPanelProps {
  value: CalculationInput;
  onChange: (value: CalculationInput) => void;
  layout?: 'horizontal' | 'vertical' | 'compact';
  showAdvanced?: boolean;
  purchasePrice?: number;
}

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

export function InvestmentSliderPanel({
  value,
  onChange,
  layout = 'vertical',
  showAdvanced = true,
  purchasePrice,
}: InvestmentSliderPanelProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const isMobile = useIsMobile();

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

  const update = <K extends keyof CalculationInput>(key: K, val: CalculationInput[K]) => {
    onChange({ ...value, [key]: val });
  };

  const maxEquity = purchasePrice || value.purchasePrice || 500000;

  const isCompact = layout === 'compact';
  const gridClass = layout === 'horizontal' && !isMobile 
    ? 'grid md:grid-cols-2 lg:grid-cols-4 gap-4' 
    : 'space-y-5';

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Settings2 className="h-4 w-4" />
          Investment-Parameter
        </CardTitle>
      </CardHeader>
      <CardContent className={gridClass}>
        {/* 1. Eigenkapital */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <Label>Eigenkapital</Label>
            <span className="font-medium">{formatCurrency(value.equity)}</span>
          </div>
          <Slider
            value={[value.equity]}
            onValueChange={([v]) => update('equity', v)}
            min={10000}
            max={maxEquity * 0.5}
            step={5000}
          />
        </div>

        {/* 1b. Zinsbindung */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <Label>Zinsbindung</Label>
            <span className="font-medium">{value.termYears} Jahre</span>
          </div>
          <Select
            value={String(value.termYears)}
            onValueChange={(v) => update('termYears', Number(v))}
          >
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[5, 10, 15, 20, 25, 30].map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y} Jahre
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 2. Tilgungsrate */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <Label>Tilgungsrate</Label>
            <span className="font-medium">{value.repaymentRate}%</span>
          </div>
          <Slider
            value={[value.repaymentRate]}
            onValueChange={([v]) => update('repaymentRate', v)}
            min={1}
            max={5}
            step={0.5}
          />
        </div>

        {/* 3. Wertsteigerung p.a. */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <Label>Wertsteigerung p.a.</Label>
            <span className="font-medium">{value.valueGrowthRate}%</span>
          </div>
          <Slider
            value={[value.valueGrowthRate]}
            onValueChange={([v]) => update('valueGrowthRate', v)}
            min={0}
            max={5}
            step={0.5}
          />
        </div>

        {/* 4. Mietentwicklung p.a. */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <Label>Mietentwicklung p.a.</Label>
            <span className="font-medium">{value.rentGrowthRate}%</span>
          </div>
          <Slider
            value={[value.rentGrowthRate]}
            onValueChange={([v]) => update('rentGrowthRate', v)}
            min={0}
            max={5}
            step={0.5}
          />
        </div>

        {/* 5. zvE (zu versteuerndes Einkommen) */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <Label className={isMobile ? 'text-xs' : ''}>
              {isMobile ? 'zvE' : 'zvE (zu versteuerndes Einkommen)'}
            </Label>
            <span className="font-medium">{formatCurrency(value.taxableIncome)}</span>
          </div>
          <Slider
            value={[value.taxableIncome]}
            onValueChange={([v]) => update('taxableIncome', v)}
            min={20000}
            max={250000}
            step={5000}
          />
        </div>

        {/* 6. Kirchensteuer */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Kirchensteuer</Label>
            <Switch
              checked={value.hasChurchTax}
              onCheckedChange={(v) => update('hasChurchTax', v)}
            />
          </div>
          {value.hasChurchTax && (
            <Select
              value={value.churchTaxState || 'BY'}
              onValueChange={(v) => update('churchTaxState', v)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Bundesland" />
              </SelectTrigger>
              <SelectContent>
                {BUNDESLAENDER.map((bl) => (
                  <SelectItem key={bl.code} value={bl.code} className="text-xs">
                    {bl.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* 7. Splitting / Familienstand */}
        <div className="space-y-2">
          <Label>Veranlagung</Label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => update('maritalStatus', 'single')}
              className={cn(
                "flex-1 px-3 py-1.5 text-xs rounded-md border transition-colors",
                value.maritalStatus === 'single'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border hover:bg-muted'
              )}
            >
              Einzeln
            </button>
            <button
              type="button"
              onClick={() => update('maritalStatus', 'married')}
              className={cn(
                "flex-1 px-3 py-1.5 text-xs rounded-md border transition-colors",
                value.maritalStatus === 'married'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border hover:bg-muted'
              )}
            >
              Splitting
            </button>
          </div>
        </div>

        {/* Advanced Options - Collapsible on Mobile */}
        {showAdvanced && !isCompact && (
          isMobile ? (
            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen} className="pt-2 border-t">
              <CollapsibleTrigger className="flex items-center justify-between w-full py-2">
                <span className="text-sm font-medium text-muted-foreground">Erweiterte Optionen</span>
                {advancedOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-2">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <Label>Gebäudeanteil</Label>
                    <span className="font-medium">{Math.round(value.buildingShare * 100)}%</span>
                  </div>
                  <Slider
                    value={[value.buildingShare * 100]}
                    onValueChange={([v]) => update('buildingShare', v / 100)}
                    min={50}
                    max={95}
                    step={5}
                  />
                </div>
                <div className="space-y-2">
                  <Label>AfA-Modell</Label>
                  <Select
                    value={value.afaModel}
                    onValueChange={(v) => update('afaModel', v as CalculationInput['afaModel'])}
                  >
                    <SelectTrigger className="h-9">
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
              </CollapsibleContent>
            </Collapsible>
          ) : (
            <>
              <div className="space-y-2 pt-2 border-t">
                <Label className="text-xs text-muted-foreground">Erweitert</Label>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <Label>Gebäudeanteil</Label>
                  <span className="font-medium">{Math.round(value.buildingShare * 100)}%</span>
                </div>
                <Slider
                  value={[value.buildingShare * 100]}
                  onValueChange={([v]) => update('buildingShare', v / 100)}
                  min={50}
                  max={95}
                  step={5}
                />
              </div>
              <div className="space-y-2">
                <Label>AfA-Modell</Label>
                <Select
                  value={value.afaModel}
                  onValueChange={(v) => update('afaModel', v as CalculationInput['afaModel'])}
                >
                  <SelectTrigger className="h-8 text-xs">
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
            </>
          )
        )}
      </CardContent>
    </Card>
  );
}
