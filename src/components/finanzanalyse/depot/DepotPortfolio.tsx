/**
 * DepotPortfolio — Header card with total value + donut allocation chart
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { DEMO_POSITIONS } from '@/hooks/useDemoDepot';
import { TrendingUp } from 'lucide-react';

const COLORS = ['hsl(var(--primary))', 'hsl(220, 70%, 55%)', 'hsl(280, 60%, 55%)', 'hsl(340, 65%, 55%)', 'hsl(160, 55%, 45%)', 'hsl(35, 80%, 55%)', 'hsl(0, 0%, 60%)'];

const allocationData = [
  { name: 'ETFs', value: DEMO_POSITIONS.filter(p => p.category === 'etf').reduce((s, p) => s + p.value, 0) },
  { name: 'Aktien', value: DEMO_POSITIONS.filter(p => p.category === 'stock').reduce((s, p) => s + p.value, 0) },
  { name: 'Cash', value: DEMO_POSITIONS.filter(p => p.category === 'cash').reduce((s, p) => s + p.value, 0) },
];

interface Props {
  totalValue: number;
  dailyChange: number;
}

export function DepotPortfolio({ totalValue, dailyChange }: Props) {
  return (
    <Card className="glass-card">
      <CardContent className="py-6">
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Value section */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Depot-Gesamtwert</p>
            </div>
            <p className="text-3xl font-bold tracking-tight mt-2">
              {totalValue.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </p>
            <Badge variant="outline" className="mt-2 text-emerald-500 border-emerald-500/30">
              +{dailyChange}% heute
            </Badge>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 mt-4">
              {allocationData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i] }} />
                  <span className="text-xs text-muted-foreground">{d.name}: {((d.value / totalValue) * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Donut */}
          <div className="w-48 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={allocationData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" strokeWidth={2} stroke="hsl(var(--background))">
                  {allocationData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => v.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
