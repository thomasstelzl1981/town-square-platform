/**
 * FMZinsTickerWidget — Mortgage rate ticker for FM Dashboard
 */
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';
import { useFinanceData } from '@/hooks/useFinanceData';

const mortgageRates = [
  { label: '10 Jahre fest', rate: '3,45%', change: '-0,05', trend: 'down' as const },
  { label: '15 Jahre fest', rate: '3,62%', change: '+0,02', trend: 'up' as const },
  { label: '20 Jahre fest', rate: '3,78%', change: '—', trend: 'neutral' as const },
  { label: 'Variabel', rate: '4,15%', change: '-0,10', trend: 'down' as const },
];

function TrendIcon({ trend }: { trend: 'up' | 'down' | 'neutral' }) {
  if (trend === 'up') return <TrendingUp className="h-3 w-3 text-red-400" />;
  if (trend === 'down') return <TrendingDown className="h-3 w-3 text-emerald-400" />;
  return <Minus className="h-3 w-3 text-muted-foreground" />;
}

export function FMZinsTickerWidget() {
  const { data: markets = [], isLoading } = useFinanceData();

  return (
    <Card className="overflow-hidden border-0 shadow-card h-full flex flex-col">
      <div className="h-2 bg-gradient-to-r from-[hsl(35,90%,55%)] to-[hsl(25,85%,50%)]" />
      <CardContent className="p-4 flex-1 flex flex-col justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[hsl(35,90%,55%)] to-[hsl(25,85%,50%)] flex items-center justify-center">
            <BarChart3 className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold">Zins-Ticker</h3>
            <p className="text-[10px] text-muted-foreground">Aktuelle Baufinanzierung</p>
          </div>
        </div>
        <div className="space-y-1 flex-1 flex flex-col justify-center">
          {mortgageRates.map(r => (
            <div key={r.label} className="flex items-center justify-between py-1 border-b border-border/50 last:border-0">
              <span className="text-[11px] text-muted-foreground">{r.label}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold font-mono">{r.rate}</span>
                <div className="flex items-center gap-0.5">
                  <TrendIcon trend={r.trend} />
                  <span className={`text-[10px] font-mono ${r.trend === 'down' ? 'text-emerald-500' : r.trend === 'up' ? 'text-red-400' : 'text-muted-foreground'}`}>{r.change}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[9px] text-muted-foreground text-right">Stand: {new Date().toLocaleDateString('de-DE')}</p>
      </CardContent>
    </Card>
  );
}
