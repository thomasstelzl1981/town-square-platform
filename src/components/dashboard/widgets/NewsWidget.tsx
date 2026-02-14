/**
 * NewsWidget — Live news briefing from RSS feeds
 * Data source: Tagesschau RSS (via Edge Function)
 */

import { Card, CardContent } from '@/components/ui/card';
import { Newspaper } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNewsData } from '@/hooks/useNewsData';

export function NewsWidget() {
  const { data: headlines = [], isLoading } = useNewsData();

  return (
    <Card className="h-[260px] md:h-auto md:aspect-square bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 overflow-hidden">
      <CardContent className="h-full flex flex-col p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium">Nachrichten</span>
          </div>
        </div>

        {/* Headlines */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="py-2.5 border-b border-border/10 last:border-0">
                  <div className="h-3 w-full bg-muted rounded mb-1.5 animate-pulse" />
                  <div className="h-3 w-3/4 bg-muted rounded mb-1.5 animate-pulse" />
                  <div className="h-2 w-24 bg-muted rounded animate-pulse" />
                </div>
              ))
            : headlines.slice(0, 5).map((headline, index) => (
                <a
                  key={index}
                  href={headline.link || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    'py-2.5 group hover:bg-background/30 transition-colors -mx-1 px-1 rounded-sm',
                    index < Math.min(headlines.length, 5) - 1 && 'border-b border-border/10'
                  )}
                >
                  <p className="text-sm font-medium line-clamp-2 leading-snug group-hover:text-primary transition-colors">
                    {headline.title}
                  </p>
                </a>
              ))}
        </div>
      </CardContent>
    </Card>
  );
}
