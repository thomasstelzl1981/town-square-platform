/**
 * FinanceWidget — Live financial markets overview
 * Data source: CoinGecko + ECB (via Edge Function)
 */

import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFinanceData } from '@/hooks/useFinanceData';

export function FinanceWidget() {
  const { data: markets = [], isLoading } = useFinanceData();

  return (
    <Card className="aspect-square bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20 overflow-hidden">
      <CardContent className="h-full flex flex-col p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-medium">Märkte</span>
          </div>
        </div>

        {/* Market Grid */}
        <div className="flex-1 grid grid-cols-2 gap-2">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-lg bg-background/30 p-2 animate-pulse">
                  <div className="h-3 w-12 bg-muted rounded mb-1" />
                  <div className="h-4 w-16 bg-muted rounded" />
                </div>
              ))
            : markets.map((market) => {
                const TrendIcon = market.trend === 'up' ? TrendingUp : market.trend === 'down' ? TrendingDown : Minus;
                return (
                  <div key={market.symbol} className="rounded-lg bg-background/30 p-2 flex flex-col justify-center">
                    <span className="text-[10px] text-muted-foreground">{market.symbol}</span>
                    <span className="text-sm font-medium">{market.value}</span>
                    <div className={cn(
                      'flex items-center gap-1 text-[10px]',
                      market.trend === 'up' && 'text-green-500',
                      market.trend === 'down' && 'text-red-500',
                      market.trend === 'neutral' && 'text-muted-foreground'
                    )}>
                      <TrendIcon className="h-3 w-3" />
                      {market.change}
                    </div>
                  </div>
                );
              })}
        </div>
      </CardContent>
    </Card>
  );
}
