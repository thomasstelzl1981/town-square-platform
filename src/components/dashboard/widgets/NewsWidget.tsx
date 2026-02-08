/**
 * NewsWidget — Stub for news briefing
 * 
 * Will show: Economic/Real estate headlines from RSS feeds
 * Data source: RSS Feeds / NewsAPI
 */

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Newspaper, ExternalLink } from 'lucide-react';

// Demo headlines
const DEMO_HEADLINES = [
  {
    title: 'EZB signalisiert weitere Zinssenkungen',
    source: 'Tagesschau',
    time: '2 Std.',
  },
  {
    title: 'Immobilienpreise stabilisieren sich',
    source: 'Handelsblatt',
    time: '4 Std.',
  },
];

export function NewsWidget() {
  return (
    <Card className="aspect-square bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 overflow-hidden">
      <CardContent className="h-full flex flex-col p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Newspaper className="h-4 w-4 text-purple-500" />
            <span className="text-xs font-medium">News</span>
          </div>
          <Badge variant="outline" className="text-[9px] h-4 bg-background/50">
            Coming Soon
          </Badge>
        </div>

        {/* Headlines Preview */}
        <div className="flex-1 space-y-2">
          {DEMO_HEADLINES.map((headline, index) => (
            <div
              key={index}
              className="rounded-lg bg-background/30 p-3 blur-[1px] opacity-60"
            >
              <p className="text-xs font-medium line-clamp-2 mb-1">
                {headline.title}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  {headline.source}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {headline.time}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Stub Message */}
        <div className="mt-3 text-center">
          <p className="text-[10px] text-muted-foreground">
            News Briefing wird bald verfügbar sein
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
