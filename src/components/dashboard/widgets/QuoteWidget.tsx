/**
 * QuoteWidget — Daily inspirational quote
 * 
 * Data source: ZenQuotes API (via Edge Function proxy)
 */

import { Card, CardContent } from '@/components/ui/card';
import { Quote, RefreshCw, AlertTriangle } from 'lucide-react';
import { useQuote } from '@/hooks/useQuote';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export function QuoteWidget() {
  const { data: quote, isLoading, error, refetch, isRefetching } = useQuote();

  return (
    <Card className="aspect-square bg-gradient-to-br from-pink-500/10 to-rose-600/5 border-pink-500/20 overflow-hidden">
      <CardContent className="h-full flex flex-col p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Quote className="h-4 w-4 text-pink-500" />
            <span className="text-xs font-medium">Zitat des Tages</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw className={`h-3 w-3 text-muted-foreground ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Quote Content */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
          <Quote className="h-8 w-8 text-pink-500/30 mb-3 rotate-180" />
          
          {isLoading ? (
            <div className="w-full space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4 mx-auto" />
              <Skeleton className="h-3 w-1/2 mx-auto mt-4" />
            </div>
          ) : error ? (
            <div className="text-center">
              <AlertTriangle className="h-6 w-6 text-amber-500 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Zitat nicht verfügbar</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-2"
                onClick={() => refetch()}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Erneut versuchen
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm italic leading-relaxed mb-3 line-clamp-4">
                "{quote?.quote}"
              </p>
              <p className="text-xs text-muted-foreground">
                — {quote?.author}
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-3 text-center">
          <p className="text-[10px] text-muted-foreground">
            {quote?.fallback ? 'Offline-Zitat' : 'via ZenQuotes'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
