/**
 * InventoryInvestmentSimulation — Bestandsimmobilien-Simulation
 * 
 * Für existierende Immobilien mit bestehendem Darlehen.
 * Farbschema und Chart-Stil sind an MasterGraph angeglichen.
 * 
 * Einstellbare Parameter (Slider):
 * - Wertzuwachs p.a.: 0% – 5%
 * - Mietsteigerung p.a.: 0% – 5%
 */
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calculator, Minus, Plus } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface SimulationData {
  // Property data
  purchasePrice: number;
  marketValue: number;
  annualRent: number;
  // Financing data
  outstandingBalance: number;
  interestRatePercent: number;
  annuityMonthly: number;
  // Accounting data
  buildingSharePercent: number;
  afaRatePercent: number;
  afaMethod: string;
  // Context/Tax data
  contextName?: string;
  marginalTaxRate: number;
}

interface InventoryInvestmentSimulationProps {
  data: SimulationData;
}

interface ProjectionRow {
  year: number;
  verkehrswert: number;
  restschuld: number;
  nettoVermoegen: number;
  miete: number;
  zins: number;
  tilgung: number;
  annuitaet: number;
  cashflow: number;
}

interface StepperProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  suffix?: string;
}

function CompactStepper({ label, value, onChange, min, max, step, suffix = '%' }: StepperProps) {
  const decrease = () => onChange(Math.max(min, +(value - step).toFixed(1)));
  const increase = () => onChange(Math.min(max, +(value + step).toFixed(1)));
  
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
      <button 
        onClick={decrease}
        disabled={value <= min}
        className="w-8 h-8 flex items-center justify-center rounded-md border bg-background hover:bg-muted disabled:opacity-50"
      >
        <Minus className="h-4 w-4" />
      </button>
      <div className="text-center">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-semibold">{value.toFixed(1)}{suffix}</p>
      </div>
      <button 
        onClick={increase}
        disabled={value >= max}
        className="w-8 h-8 flex items-center justify-center rounded-md border bg-background hover:bg-muted disabled:opacity-50"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

export function InventoryInvestmentSimulation({ data }: InventoryInvestmentSimulationProps) {
  // Slider state
  const [valueGrowth, setValueGrowth] = useState(2.0); // 2% default
  const [rentGrowth, setRentGrowth] = useState(1.5); // 1.5% default

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  // 40-year projection calculation
  const projectionData = useMemo<ProjectionRow[]>(() => {
    const years: ProjectionRow[] = [];
    let currentValue = data.marketValue;
    let currentRent = data.annualRent;
    let debt = data.outstandingBalance;
    const annualAnnuity = data.annuityMonthly * 12;
    const interestRate = data.interestRatePercent / 100;
    const valueGrowthRate = valueGrowth / 100;
    const rentGrowthRate = rentGrowth / 100;

    for (let year = 0; year <= 40; year++) {
      const interest = debt * interestRate;
      const amortization = Math.min(annualAnnuity - interest, debt);
      const netWealth = currentValue - debt;
      const totalAnnuity = interest + amortization;

      years.push({
        year: 2026 + year,
        verkehrswert: Math.round(currentValue),
        restschuld: Math.max(0, Math.round(debt)),
        nettoVermoegen: Math.round(netWealth),
        miete: Math.round(currentRent),
        zins: Math.round(interest),
        tilgung: Math.round(amortization),
        annuitaet: Math.round(totalAnnuity),
        cashflow: Math.round(currentRent - totalAnnuity),
      });

      // Next year calculations
      debt = Math.max(0, debt - amortization);
      currentValue = currentValue * (1 + valueGrowthRate);
      currentRent = currentRent * (1 + rentGrowthRate);
    }

    return years;
  }, [data, valueGrowth, rentGrowth]);

  // 10-year table (every 5 years + first few)
  const tableYears = [0, 1, 5, 10, 15, 20, 25, 30, 35, 40];
  const tableData = tableYears
    .map(idx => projectionData[idx])
    .filter(Boolean);

  // Check if property has financing
  const hasFinancing = data.outstandingBalance > 0;

  return (
    <div className="space-y-6">
      {/* Header with context info */}
      <div className="flex items-center gap-2">
        <Calculator className="h-5 w-5 text-primary" />
        <h3 className="font-semibold">Investment-Simulation</h3>
        {data.contextName && (
          <span className="px-2 py-1 text-xs rounded-md bg-muted text-muted-foreground">{data.contextName}</span>
        )}
      </div>

      {/* Kompakte Annahmen-Stepper */}
      <div className="grid grid-cols-2 gap-3">
        <CompactStepper
          label="Wertzuwachs p.a."
          value={valueGrowth}
          onChange={setValueGrowth}
          min={0}
          max={5}
          step={0.5}
        />
        <CompactStepper
          label="Mietsteigerung p.a."
          value={rentGrowth}
          onChange={setRentGrowth}
          min={0}
          max={5}
          step={0.5}
        />
      </div>

      {/* Fixed Parameters Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <InfoBox label="Verkehrswert" value={formatCurrency(data.marketValue)} />
        {hasFinancing && (
          <>
            <InfoBox label="Restschuld" value={formatCurrency(data.outstandingBalance)} />
            <InfoBox label="Zinssatz" value={formatPercent(data.interestRatePercent)} />
          </>
        )}
        <InfoBox label="AfA-Satz" value={`${data.afaRatePercent}% (${data.afaMethod})`} />
      </div>

      {/* 40-Year Chart - Matching MasterGraph styling */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Vermögensentwicklung (40 Jahre)</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={projectionData}>
              <defs>
                <linearGradient id="invValueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="invWealthGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="year"
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `${v}`}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                width={50}
              />
              <Tooltip
                formatter={(value: number, name: string) => [formatCurrency(value), name]}
                labelFormatter={(label) => `Jahr ${label}`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              
              {/* Immobilienwert */}
              <Area 
                type="monotone" 
                dataKey="verkehrswert" 
                name="Immobilienwert" 
                stroke="hsl(var(--primary))" 
                fill="url(#invValueGradient)"
                strokeWidth={2}
              />
              
              {/* Nettovermögen */}
              <Area 
                type="monotone" 
                dataKey="nettoVermoegen" 
                name="Nettovermögen" 
                stroke="hsl(142, 76%, 36%)" 
                fill="url(#invWealthGradient)"
                strokeWidth={2}
              />
              
              {/* Restschuld - gestrichelte Linie */}
              {hasFinancing && (
                <Line 
                  type="monotone" 
                  dataKey="restschuld" 
                  name="Restschuld" 
                  stroke="hsl(var(--destructive))" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                />
              )}
              
              {/* Tilgung (kumulativ wäre sinnvoller, zeigen wir aber jährlich als Linie) */}
              {hasFinancing && (
                <Line 
                  type="monotone" 
                  dataKey="tilgung" 
                  name="Tilgung (p.a.)" 
                  stroke="hsl(221, 83%, 53%)"
                  strokeWidth={2}
                  dot={false}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Data Table with extended columns */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Projektionstabelle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Jahr</TableHead>
                  <TableHead className="text-right">Miete</TableHead>
                    {hasFinancing && (
                      <>
                        <TableHead className="text-right">Annuität</TableHead>
                        <TableHead className="text-right">Zinsen</TableHead>
                        <TableHead className="text-right">Tilgung</TableHead>
                        <TableHead className="text-right">Cashflow</TableHead>
                        <TableHead className="text-right">Restschuld</TableHead>
                      </>
                    )}
                  <TableHead className="text-right">Verkehrswert</TableHead>
                  <TableHead className="text-right">Nettovermögen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tableData.map((row) => (
                  <TableRow key={row.year}>
                    <TableCell className="font-medium">{row.year}</TableCell>
                    <TableCell className="text-right">{formatCurrency(row.miete)}</TableCell>
                    {hasFinancing && (
                      <>
                        <TableCell className="text-right">{formatCurrency(row.annuitaet)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(row.zins)}</TableCell>
                        <TableCell className="text-right text-blue-600">{formatCurrency(row.tilgung)}</TableCell>
                        <TableCell className={cn(
                          "text-right font-medium",
                          row.cashflow >= 0 ? "text-green-600" : "text-destructive"
                        )}>
                          {formatCurrency(row.cashflow)}
                        </TableCell>
                        <TableCell className="text-right text-destructive">
                          {row.restschuld > 0 ? formatCurrency(row.restschuld) : '–'}
                        </TableCell>
                      </>
                    )}
                    <TableCell className="text-right">{formatCurrency(row.verkehrswert)}</TableCell>
                    <TableCell className="text-right font-medium text-green-600">
                      {formatCurrency(row.nettoVermoegen)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 rounded-lg bg-muted/50">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
