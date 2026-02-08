/**
 * RadioWidget — Stub for internet radio
 * 
 * IMPORTANT: No autoplay! User must click to start.
 * Data source: Radio Browser API
 */

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Radio, Play, Volume2 } from 'lucide-react';

export function RadioWidget() {
  return (
    <Card className="aspect-square bg-gradient-to-br from-cyan-500/10 to-teal-600/5 border-cyan-500/20 overflow-hidden">
      <CardContent className="h-full flex flex-col p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-cyan-500" />
            <span className="text-xs font-medium">Radio</span>
          </div>
          <Badge variant="outline" className="text-[9px] h-4 bg-background/50">
            Coming Soon
          </Badge>
        </div>

        {/* Radio Preview */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          {/* Animated Sound Waves */}
          <div className="relative mb-4">
            <div className="flex items-end gap-1 h-12">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 bg-cyan-500/40 rounded-full animate-pulse"
                  style={{
                    height: `${20 + Math.random() * 28}px`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '0.8s',
                  }}
                />
              ))}
            </div>
          </div>

          <div className="blur-[1px] opacity-60 w-full">
            <p className="text-xs font-medium mb-2">Lounge Radio</p>
            <div className="flex items-center justify-center gap-2">
              <Volume2 className="h-3 w-3 text-muted-foreground" />
              <div className="w-20 h-1 bg-muted rounded-full">
                <div className="w-12 h-1 bg-cyan-500/50 rounded-full" />
              </div>
            </div>
          </div>

          {/* Play Button (disabled) */}
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            disabled
          >
            <Play className="h-4 w-4 mr-2" />
            Radio starten
          </Button>
        </div>

        {/* Stub Message */}
        <div className="mt-3 text-center">
          <p className="text-[10px] text-muted-foreground">
            Kein Autoplay — nur auf Klick
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
