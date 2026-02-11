/**
 * NewsWidget — Live news briefing from RSS feeds
 * Data source: Tagesschau RSS (via Edge Function)
 */

import { Card, CardContent } from '@/components/ui/card';
import { Newspaper, ExternalLink } from 'lucide-react';
import { useNewsData } from '@/hooks/useNewsData';

export function NewsWidget() {
  const { data: headlines = [], isLoading } = useNewsData();

  return (
    <Card className="aspect-square bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 overflow-hidden">
      <CardContent className="h-full flex flex-col p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-purple-500" />
            <span className="text-xs font-medium">News</span>
          </div>
        </div>

        {/* Headlines */}
        <div className="flex-1 space-y-2 overflow-y-auto">
          {isLoading
            ? Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="rounded-lg bg-background/30 p-3 animate-pulse">
                  <div className="h-3 w-full bg-muted rounded mb-2" />
                  <div className="h-2 w-20 bg-muted rounded" />
                </div>
              ))
            : headlines.slice(0, 4).map((headline, index) => (
                <a
                  key={index}
                  href={headline.link || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-lg bg-background/30 p-3 hover:bg-background/50 transition-colors group"
                >
                  <p className="text-xs font-medium line-clamp-2 mb-1">{headline.title}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">{headline.source}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-muted-foreground">{headline.time}</span>
                      {headline.link && <ExternalLink className="h-2.5 w-2.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />}
                    </div>
                  </div>
                </a>
              ))}
        </div>
      </CardContent>
    </Card>
  );
}
