/**
 * AccountsWidget — Financial accounts overview (Upvest-style)
 * Shows assets, liabilities, net wealth from Engine 8 data.
 */

import { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Wallet, TrendingUp, TrendingDown, Scale } from 'lucide-react';
import { useFinanzberichtData } from '@/hooks/useFinanzberichtData';
import { cn } from '@/lib/utils';

function fmt(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(0)}T`;
  return n.toFixed(0);
}

export const AccountsWidget = memo(function AccountsWidget() {
  const navigate = useNavigate();
  const { assets, liabilities, netWealth, monthlySavings, isLoading } = useFinanzberichtData();

  const rows = [
    {
      label: 'Vermögen',
      value: assets.totalAssets,
      icon: TrendingUp,
      color: 'text-emerald-500',
    },
    {
      label: 'Verbindlichkeiten',
      value: liabilities.totalLiabilities,
      icon: TrendingDown,
      color: 'text-red-400',
    },
    {
      label: 'Nettovermögen',
      value: netWealth,
      icon: Scale,
      color: netWealth >= 0 ? 'text-emerald-500' : 'text-red-400',
      bold: true,
    },
  ];

  // Mini bar proportions
  const maxVal = Math.max(assets.totalAssets, liabilities.totalLiabilities, 1);

  return (
    <Card
      className="h-[260px] md:h-auto md:aspect-square bg-gradient-to-br from-primary/8 to-primary/3 border-primary/20 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => navigate('/portal/finanzanalyse/dashboard')}
    >
      <CardContent className="h-full flex flex-col p-4">
        {/* Header — unified pattern */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Konten</span>
          </div>
          <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-pulse" />
        </div>

        {/* KPI rows */}
        <div className="flex-1 flex flex-col justify-between">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border/10 last:border-0">
                  <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-14 bg-muted rounded animate-pulse" />
                </div>
              ))
            : rows.map((row, idx) => {
                const Icon = row.icon;
                const barW = (Math.abs(row.value) / maxVal) * 100;
                return (
                  <div key={row.label} className="py-2">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <Icon className={cn('h-3.5 w-3.5', row.color)} />
                        <span className={cn('text-xs text-muted-foreground', row.bold && 'font-semibold text-foreground')}>
                          {row.label}
                        </span>
                      </div>
                      <span className={cn('text-sm font-mono tabular-nums', row.color, row.bold && 'font-bold text-base')}>
                        {row.value < 0 ? '−' : ''}{fmt(Math.abs(row.value))} €
                      </span>
                    </div>
                    {/* Mini progress bar */}
                    <div className="h-1 w-full rounded-full bg-muted/30 overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all duration-700',
                          row.bold
                            ? (netWealth >= 0 ? 'bg-emerald-500/60' : 'bg-red-400/60')
                            : idx === 0
                              ? 'bg-emerald-500/40'
                              : 'bg-red-400/40'
                        )}
                        style={{ width: `${Math.min(barW, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
        </div>

        {/* Footer — monthly savings */}
        {!isLoading && (
          <div className="pt-2 mt-auto border-t border-border/10">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Sparquote/mtl.</span>
              <span className={cn(
                'text-xs font-mono font-semibold',
                monthlySavings >= 0 ? 'text-emerald-500' : 'text-red-400'
              )}>
                {monthlySavings >= 0 ? '+' : '−'}{fmt(Math.abs(monthlySavings))} €
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
