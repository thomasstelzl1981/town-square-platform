/**
 * FinanceWidget — Stub for financial markets overview
 * 
 * Will show: DAX, S&P 500, EUR/USD, BTC, ETH, Gold
 * Data source: Finnhub API (planned)
 */

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

// Demo data for visual preview
const DEMO_MARKETS = [
  { symbol: 'DAX', value: '18.432', change: '+0.8%', trend: 'up' },
  { symbol: 'EUR/USD', value: '1.0892', change: '-0.2%', trend: 'down' },
  { symbol: 'BTC', value: '67.4k', change: '+2.1%', trend: 'up' },
  { symbol: 'Gold', value: '2.341', change: '0.0%', trend: 'neutral' },
];

export function FinanceWidget() {
  return (
    <Card className="aspect-square bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20 overflow-hidden">
      <CardContent className="h-full flex flex-col p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-amber-500" />
            <span className="text-xs font-medium">Märkte</span>
          </div>
          <Badge variant="outline" className="text-[9px] h-4 bg-background/50">
            Coming Soon
          </Badge>
        </div>

        {/* Preview Grid */}
        <div className="flex-1 grid grid-cols-2 gap-2">
          {DEMO_MARKETS.map((market) => {
            const TrendIcon = market.trend === 'up' 
              ? TrendingUp 
              : market.trend === 'down' 
                ? TrendingDown 
                : Minus;
            
            return (
              <div
                key={market.symbol}
                className="rounded-lg bg-background/30 p-2 flex flex-col justify-center blur-[1px] opacity-60"
              >
                <span className="text-[10px] text-muted-foreground">
                  {market.symbol}
                </span>
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

        {/* Stub Message */}
        <div className="mt-3 text-center">
          <p className="text-[10px] text-muted-foreground">
            Finanzübersicht wird bald verfügbar sein
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
