/**
 * DepotPerformanceChart — 12-month line chart with period toggle
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { generatePerformanceData } from '@/hooks/useDemoDepot';

const FULL_DATA = generatePerformanceData();
const PERIODS = [
  { label: '1M', months: 1 },
  { label: '3M', months: 3 },
  { label: '6M', months: 6 },
  { label: '1J', months: 12 },
  { label: 'Max', months: 12 },
];

export function DepotPerformanceChart() {
  const [period, setPeriod] = useState('1J');
  const months = PERIODS.find(p => p.label === period)?.months ?? 12;
  const data = FULL_DATA.slice(-months);

  return (
    <Card className="glass-card">
      <div className="px-4 py-3 border-b border-border/30 bg-muted/20 flex items-center justify-between">
        <p className="text-base font-semibold">Performance</p>
        <div className="flex gap-1">
          {PERIODS.map(p => (
            <Button key={p.label} variant={period === p.label ? 'default' : 'ghost'} size="sm" className="h-7 px-2 text-xs" onClick={() => setPeriod(p.label)}>
              {p.label}
            </Button>
          ))}
        </div>
      </div>
      <CardContent className="py-4">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="depotGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" domain={['dataMin - 500', 'dataMax + 500']} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => v.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} labelStyle={{ color: 'hsl(var(--foreground))' }} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }} />
              <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fill="url(#depotGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
