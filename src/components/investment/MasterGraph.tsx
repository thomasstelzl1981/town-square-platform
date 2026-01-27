import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, Line, ComposedChart 
} from 'recharts';
import { YearlyData } from '@/hooks/useInvestmentEngine';
import { TrendingUp } from 'lucide-react';

interface MasterGraphProps {
  projection: YearlyData[];
  height?: number;
  showLegend?: boolean;
  title?: string;
  variant?: 'full' | 'compact';
}

export function MasterGraph({ 
  projection, 
  height = 320, 
  showLegend = true,
  title = '40-Jahres-Projektion',
  variant = 'full'
}: MasterGraphProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', { 
      style: 'currency', 
      currency: 'EUR',
      maximumFractionDigits: 0 
    }).format(value);
  };

  // Filter data for cleaner display
  const chartData = variant === 'compact' 
    ? projection.filter((_, i) => i % 10 === 0 || i === projection.length - 1)
    : projection.filter((_, i) => i % 5 === 0 || i === projection.length - 1);

  // Calculate key metrics for display
  const startYear = projection[0];
  const endYear = projection[projection.length - 1];
  const netWealthGain = endYear ? endYear.netWealth - (startYear?.propertyValue || 0) : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {title}
          </CardTitle>
          {endYear && (
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Nettovermögen nach 40 Jahren</p>
              <p className="text-lg font-bold text-green-600">
                {formatCurrency(endYear.netWealth)}
              </p>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id="valueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="wealthGradient" x1="0" y1="0" x2="0" y2="1">
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
              {showLegend && <Legend />}
              
              {/* Wertentwicklung (Immobilienwert) */}
              <Area 
                type="monotone" 
                dataKey="propertyValue" 
                name="Immobilienwert" 
                stroke="hsl(var(--primary))" 
                fill="url(#valueGradient)"
                strokeWidth={2}
              />
              
              {/* Nettovermögen (Wert - Restschuld) */}
              <Area 
                type="monotone" 
                dataKey="netWealth" 
                name="Nettovermögen" 
                stroke="hsl(142, 76%, 36%)" 
                fill="url(#wealthGradient)"
                strokeWidth={2}
              />
              
              {/* Restschuld als Linie */}
              <Line 
                type="monotone" 
                dataKey="remainingDebt" 
                name="Restschuld" 
                stroke="hsl(var(--destructive))" 
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        {variant === 'full' && startYear && endYear && (
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Startwert</p>
              <p className="font-semibold">{formatCurrency(startYear.propertyValue)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Endwert (Jahr 40)</p>
              <p className="font-semibold">{formatCurrency(endYear.propertyValue)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Vermögenszuwachs</p>
              <p className="font-semibold text-green-600">+{formatCurrency(netWealthGain)}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
