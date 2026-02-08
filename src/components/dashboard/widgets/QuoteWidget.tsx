/**
 * QuoteWidget — Stub for daily inspirational quote
 * 
 * Data source: ZenQuotes API
 */

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Quote } from 'lucide-react';

export function QuoteWidget() {
  return (
    <Card className="aspect-square bg-gradient-to-br from-pink-500/10 to-rose-600/5 border-pink-500/20 overflow-hidden">
      <CardContent className="h-full flex flex-col p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Quote className="h-4 w-4 text-pink-500" />
            <span className="text-xs font-medium">Zitat</span>
          </div>
          <Badge variant="outline" className="text-[9px] h-4 bg-background/50">
            Coming Soon
          </Badge>
        </div>

        {/* Quote Preview */}
        <div className="flex-1 flex flex-col items-center justify-center text-center px-2">
          <Quote className="h-8 w-8 text-pink-500/30 mb-3 rotate-180" />
          
          <div className="blur-[1px] opacity-60">
            <p className="text-sm italic leading-relaxed mb-3">
              "Der beste Weg, die Zukunft vorherzusagen, ist, sie zu gestalten."
            </p>
            <p className="text-xs text-muted-foreground">
              — Peter Drucker
            </p>
          </div>
        </div>

        {/* Stub Message */}
        <div className="mt-3 text-center">
          <p className="text-[10px] text-muted-foreground">
            Tägliche Zitate kommen bald
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
