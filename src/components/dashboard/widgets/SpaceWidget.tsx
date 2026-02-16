/**
 * SpaceWidget — NASA Astronomy Picture of the Day
 * 
 * Shows the daily astronomy picture from NASA APOD API.
 * Data source: NASA APOD via Edge Function
 */

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Rocket, ExternalLink, AlertTriangle, Image as ImageIcon } from 'lucide-react';
import { useSpaceAPOD } from '@/hooks/useSpaceAPOD';
import { Skeleton } from '@/components/ui/skeleton';

export const SpaceWidget = memo(function SpaceWidget() {
  const { data: apod, isLoading, error, refetch, isRefetching } = useSpaceAPOD();

  return (
    <Card className="h-[260px] md:h-auto md:aspect-square bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border-indigo-500/20 overflow-hidden relative">
      {/* Background Stars Effect */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        {[...Array(15)].map((_, i) => (
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
            <span className="text-sm font-medium">Space</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center text-center overflow-hidden">
          {isLoading ? (
            <div className="w-full space-y-2">
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4 mx-auto" />
              <Skeleton className="h-3 w-full" />
            </div>
          ) : error ? (
            <div className="text-center">
              <AlertTriangle className="h-6 w-6 text-amber-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">NASA-Daten nicht verfügbar</p>
            </div>
          ) : apod ? (
            <>
              {/* Image or Fallback */}
              {apod.url && apod.media_type === 'image' ? (
                <a
                  href={apod.hdurl || apod.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative w-full h-24 mb-2 rounded-lg overflow-hidden bg-black/20 block group cursor-pointer"
                >
                  <img
                    src={apod.url}
                    alt={apod.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <ExternalLink className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </a>
              ) : apod.media_type === 'video' ? (
                <div className="w-full h-24 mb-2 rounded-lg bg-black/20 flex items-center justify-center">
                  <a
                    href={apod.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    <ExternalLink className="h-8 w-8" />
                  </a>
                </div>
              ) : (
                <div className="w-full h-24 mb-2 rounded-lg bg-black/20 flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-indigo-400/50" />
                </div>
              )}

              {/* Title */}
              <p className="text-sm font-medium mb-1 line-clamp-1">
                {apod.title}
              </p>

              {/* Explanation (truncated) */}
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {apod.explanation}
              </p>
            </>
          ) : null}
        </div>

      </CardContent>
    </Card>
  );
});
