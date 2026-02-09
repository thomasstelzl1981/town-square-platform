/**
 * RadioWidget — Internet radio player
 * 
 * IMPORTANT: No autoplay! User must click to start.
 * Data source: Radio Browser API
 */

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Radio, Play, Square, Volume2, VolumeX, ChevronLeft, ChevronRight, AlertTriangle, RefreshCw } from 'lucide-react';
import { useRadioStations, useRadioPlayer } from '@/hooks/useRadio';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { useState } from 'react';

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
              <Skeleton className="h-12 w-12 rounded-full mx-auto" />
              <Skeleton className="h-4 w-3/4 mx-auto" />
              <Skeleton className="h-8 w-20 mx-auto" />
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
              <div className="flex items-end gap-1 h-8 mb-3">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 rounded-full transition-all duration-150 ${
                      isCurrentPlaying 
                        ? 'bg-cyan-500 animate-pulse' 
                        : 'bg-cyan-500/30'
                    }`}
                    style={{
                      height: isCurrentPlaying 
                        ? `${12 + Math.sin(Date.now() / 200 + i) * 10 + 10}px` 
                        : '8px',
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>

              {/* Station Name */}
              <div className="flex items-center gap-2 w-full mb-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={handlePrevStation}
                  disabled={isBuffering}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <p className="text-xs font-medium truncate flex-1 min-w-0">
                  {currentStationFromList.name}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={handleNextStation}
                  disabled={isBuffering}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Country/Tags */}
              <p className="text-[10px] text-muted-foreground mb-3 truncate w-full">
                {currentStationFromList.country}
                {currentStationFromList.tags && ` • ${currentStationFromList.tags.split(',')[0]}`}
              </p>

              {/* Play/Stop Button */}
              <Button
                variant={isCurrentPlaying ? "destructive" : "default"}
                size="sm"
                className="mb-3"
                onClick={() => {
                  if (isCurrentPlaying) {
                    stop();
                  } else {
                    togglePlay(currentStationFromList);
                  }
                }}
                disabled={isBuffering}
              >
                {isBuffering ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Lädt...
                  </>
                ) : isCurrentPlaying ? (
                  <>
                    <Square className="h-4 w-4 mr-2" />
                    Stopp
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Abspielen
                  </>
                )}
              </Button>

              {/* Volume Slider */}
              <div className="flex items-center gap-2 w-full max-w-[140px]">
                {volume === 0 ? (
                  <VolumeX className="h-3 w-3 text-muted-foreground shrink-0" />
                ) : (
                  <Volume2 className="h-3 w-3 text-muted-foreground shrink-0" />
                )}
                <Slider
                  value={[volume * 100]}
                  onValueChange={([val]) => updateVolume(val / 100)}
                  max={100}
                  step={1}
                  className="w-full"
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
        <div className="mt-3 text-center">
          <p className="text-[10px] text-muted-foreground">
            Kein Autoplay — nur auf Klick
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
