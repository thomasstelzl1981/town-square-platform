/**
 * SpaceWidget — Stub for space/astronomy updates
 * 
 * Will show: NASA APOD or ISS position
 * Data source: NASA APOD / Open Notify ISS
 */

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Rocket, Satellite } from 'lucide-react';

export function SpaceWidget() {
  return (
    <Card className="aspect-square bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border-indigo-500/20 overflow-hidden relative">
      {/* Background Stars Effect */}
      <div className="absolute inset-0 opacity-20">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      <CardContent className="h-full flex flex-col p-4 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-indigo-400" />
            <span className="text-xs font-medium">Space</span>
          </div>
          <Badge variant="outline" className="text-[9px] h-4 bg-background/50">
            Coming Soon
          </Badge>
        </div>

        {/* Preview Content */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="relative mb-4">
            <Satellite className="h-12 w-12 text-indigo-400/50" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-ping" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full" />
          </div>
          
          <div className="blur-[1px] opacity-60">
            <p className="text-xs font-medium mb-1">ISS Position</p>
            <p className="text-[10px] text-muted-foreground">
              Lat: 51.42° | Lon: -0.91°
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              ~28.000 km/h über Europa
            </p>
          </div>
        </div>

        {/* Stub Message */}
        <div className="mt-3 text-center">
          <p className="text-[10px] text-muted-foreground">
            Space Updates kommen bald
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
