/**
 * RadioWidget — Internet radio player
 * 
 * DESIGN SPEC:
 * - Small round glass button for play/stop (no text labels)
 * - Subtle/muted volume slider
 * - No autoplay! User must click to start.
 * 
 * Data source: Radio Browser API
 */

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Radio, Play, Square, Volume2, VolumeX, ChevronLeft, ChevronRight, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { useRadioStations, useRadioPlayer } from '@/hooks/useRadio';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function RadioWidget() {
  const { data: stations, isLoading, error, refetch } = useRadioStations(10);
  const { 
    isPlaying, 
    isLoading: isBuffering, 
    currentStation, 
    volume, 
    error: playError,
    togglePlay, 
    stop,
    updateVolume 
  } = useRadioPlayer();
  
  const [stationIndex, setStationIndex] = useState(0);

  const currentStationFromList = stations?.[stationIndex];
  const isCurrentPlaying = isPlaying && currentStation?.stationuuid === currentStationFromList?.stationuuid;

  const handlePrevStation = () => {
    if (stations && stations.length > 0) {
      setStationIndex((prev) => (prev === 0 ? stations.length - 1 : prev - 1));
    }
  };

  const handleNextStation = () => {
    if (stations && stations.length > 0) {
      setStationIndex((prev) => (prev === stations.length - 1 ? 0 : prev + 1));
    }
  };

  return (
    <Card className="aspect-square bg-gradient-to-br from-cyan-500/10 to-teal-600/5 border-cyan-500/20 overflow-hidden">
      <CardContent className="h-full flex flex-col p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-cyan-500" />
            <span className="text-xs font-medium">Radio</span>
          </div>
          {isPlaying && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-green-500">Live</span>
            </div>
          )}
        </div>

        {/* Radio Content */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          {isLoading ? (
            <div className="w-full space-y-3">
              <Skeleton className="h-10 w-10 rounded-full mx-auto" />
              <Skeleton className="h-4 w-3/4 mx-auto" />
            </div>
          ) : error ? (
            <div className="text-center">
              <AlertTriangle className="h-6 w-6 text-amber-500 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Sender nicht verfügbar</p>
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
          ) : currentStationFromList ? (
            <>
              {/* Sound Visualization */}
              <div className="flex items-end gap-1 h-6 mb-2">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-1.5 rounded-full transition-all duration-150",
                      isCurrentPlaying 
                        ? "bg-cyan-500/70 animate-pulse" 
                        : "bg-muted-foreground/20"
                    )}
                    style={{
                      height: isCurrentPlaying 
                        ? `${10 + Math.sin(Date.now() / 200 + i) * 8 + 6}px` 
                        : '6px',
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>

              {/* Station Name */}
              <div className="flex items-center gap-1 w-full mb-1">
                <button
                  onClick={handlePrevStation}
                  disabled={isBuffering}
                  className="h-6 w-6 shrink-0 flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors disabled:opacity-50"
                >
                  <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                </button>
                <p className="text-xs font-medium truncate flex-1 min-w-0">
                  {currentStationFromList.name}
                </p>
                <button
                  onClick={handleNextStation}
                  disabled={isBuffering}
                  className="h-6 w-6 shrink-0 flex items-center justify-center rounded-full hover:bg-muted/50 transition-colors disabled:opacity-50"
                >
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </div>

              {/* Country/Tags */}
              <p className="text-[10px] text-muted-foreground mb-3 truncate w-full">
                {currentStationFromList.country}
                {currentStationFromList.tags && ` • ${currentStationFromList.tags.split(',')[0]}`}
              </p>

              {/* Play/Stop Button - Small round glass button */}
              <button
                onClick={() => {
                  if (isCurrentPlaying) {
                    stop();
                  } else {
                    togglePlay(currentStationFromList);
                  }
                }}
                disabled={isBuffering}
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center transition-all mb-3",
                  "backdrop-blur-sm border",
                  isCurrentPlaying 
                    ? "bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20" 
                    : "bg-background/60 border-muted-foreground/20 hover:bg-primary/10 hover:border-primary/30 hover:text-primary",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                aria-label={isCurrentPlaying ? "Stopp" : "Abspielen"}
              >
                {isBuffering ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isCurrentPlaying ? (
                  <Square className="h-4 w-4" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" />
                )}
              </button>

              {/* Volume Slider - Muted/subtle styling */}
              <div className="flex items-center gap-2 w-full max-w-[120px]">
                {volume === 0 ? (
                  <VolumeX className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                ) : (
                  <Volume2 className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                )}
                <Slider
                  value={[volume * 100]}
                  onValueChange={([val]) => updateVolume(val / 100)}
                  max={100}
                  step={1}
                  className="w-full [&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:bg-muted-foreground/40 [&_[role=slider]]:border-0 [&_.bg-primary]:bg-muted-foreground/30"
                />
              </div>

              {/* Error Message */}
              {playError && (
                <p className="text-[10px] text-destructive mt-2">{playError}</p>
              )}
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="mt-2 text-center">
          <p className="text-[10px] text-muted-foreground/60">
            Kein Autoplay
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
