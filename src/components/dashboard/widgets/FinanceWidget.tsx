/**
 * FinanceWidget — Professional ticker-list with 6 market assets
 * Data source: CoinGecko + ECB + Yahoo Finance (via Edge Function)
 */

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFinanceData } from '@/hooks/useFinanceData';

export const FinanceWidget = memo(function FinanceWidget() {
  const { data: markets = [], isLoading } = useFinanceData();

  return (
    <Card className="h-[260px] md:h-auto md:aspect-square bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20 overflow-hidden">
      <CardContent className="h-full flex flex-col p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium">Märkte</span>
          </div>
          <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
        </div>

        {/* Ticker List */}
        <div className="flex-1 flex flex-col justify-between overflow-y-auto">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/10 last:border-0">
                  <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                  <div className="h-3 w-12 bg-muted rounded animate-pulse" />
                </div>
              ))
            : markets.map((market, index) => {
                const TrendIcon = market.trend === 'up' ? TrendingUp : market.trend === 'down' ? TrendingDown : Minus;
                return (
                  <div
                    key={market.symbol}
                    className={cn(
                      'flex items-center justify-between py-1.5',
                      index < markets.length - 1 && 'border-b border-border/10'
                    )}
                  >
                    <span className="text-sm font-medium text-foreground/80 min-w-[72px]">
                      {market.symbol}
                    </span>
                    <span className="text-sm font-mono text-foreground flex-1 text-right mr-3">
                      {market.value}
                    </span>
                    <div className={cn(
                      'flex items-center gap-0.5 text-xs font-medium min-w-[52px] justify-end',
                      market.trend === 'up' && 'text-green-500',
                      market.trend === 'down' && 'text-red-500',
                      market.trend === 'neutral' && 'text-muted-foreground'
                    )}>
                      <TrendIcon className="h-3 w-3" />
                      <span>{market.change}</span>
                    </div>
                  </div>
                );
              })}
        </div>
      </CardContent>
    </Card>
  );
});
