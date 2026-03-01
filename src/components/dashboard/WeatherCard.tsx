/**
 * WeatherCard — Sleek dark-themed weather widget matching dashboard aesthetic
 * Subtle weather-coded accent colors, glassmorphic style
 */

import { Card, CardContent } from '@/components/ui/card';
import { useWeather } from '@/hooks/useWeather';
import { getWeatherInfo } from '@/lib/weatherCodes';
import { Droplets, Wind, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeatherCardProps {
  latitude: number | null;
  longitude: number | null;
  city?: string;
}

/** Returns a subtle accent color based on weather code — used for a thin top border glow */
function getAccentColor(code: number): string {
  if (code === 0 || code === 1) return 'rgba(250, 204, 21, 0.5)';   // sunny gold
  if (code === 2) return 'rgba(156, 163, 175, 0.4)';                // partly cloudy gray
  if (code === 3) return 'rgba(107, 114, 128, 0.4)';                // overcast
  if (code >= 45 && code <= 48) return 'rgba(148, 163, 184, 0.4)';  // fog
  if (code >= 51 && code <= 67) return 'rgba(96, 165, 250, 0.4)';   // rain blue
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return 'rgba(226, 232, 240, 0.5)'; // snow white
  if (code >= 80 && code <= 82) return 'rgba(59, 130, 246, 0.5)';   // heavy rain
  if (code >= 95) return 'rgba(167, 139, 250, 0.5)';                // thunderstorm purple
  return 'rgba(148, 163, 184, 0.3)';
}

export function WeatherCard({ latitude, longitude, city }: WeatherCardProps) {
  const { data: weather, isLoading, error } = useWeather(latitude, longitude);

  if (isLoading) {
    return (
      <Card className="relative h-[260px] md:h-auto md:aspect-square flex items-center justify-center bg-card/80 border-border/50">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  if (error || !weather) {
    return (
      <Card className="relative h-[260px] md:h-auto md:aspect-square flex items-center justify-center bg-card/80 border-border/50">
        <p className="text-muted-foreground text-xs">Wetterdaten nicht verfügbar</p>
      </Card>
    );
  }

  const currentInfo = getWeatherInfo(weather.current.weatherCode);
  const CurrentIcon = currentInfo.icon;
  const accent = getAccentColor(weather.current.weatherCode);

  return (
    <Card 
      className="relative h-[260px] md:h-auto md:aspect-square overflow-hidden border-border/30 bg-card/80 backdrop-blur-sm"
      style={{
        boxShadow: `inset 0 1px 0 0 ${accent}, 0 4px 20px -4px rgba(0,0,0,0.3)`,
      }}
    >
      <CardContent className="relative z-10 p-4 h-full flex flex-col text-foreground">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CurrentIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">{city || 'Wetter'}</span>
          </div>
        </div>

        {/* Current Weather */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-4xl font-bold tracking-tight">{weather.current.temperature}</span>
              <span className="text-lg text-muted-foreground">°C</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 font-medium">
              {currentInfo.description}
            </p>
          </div>
          <CurrentIcon 
            className="h-10 w-10 opacity-20" 
          />
        </div>

        {/* Details Row */}
        <div className="flex gap-4 mb-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Wind className="h-3.5 w-3.5" />
            <span>{weather.current.windSpeed} km/h</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Droplets className="h-3.5 w-3.5" />
            <span>{weather.current.humidity}%</span>
          </div>
        </div>

        {/* 5-Day Forecast */}
        <div className="mt-auto">
          <div className="grid grid-cols-5 gap-1">
            {weather.daily.slice(0, 5).map((day, index) => {
              const dayInfo = getWeatherInfo(day.weatherCode);
              const DayIcon = dayInfo.icon;
              const date = new Date(day.date);
              const dayName = index === 0 
                ? 'Heute' 
                : date.toLocaleDateString('de-DE', { weekday: 'short' });

              return (
                <div 
                  key={day.date} 
                  className={cn(
                    'flex flex-col items-center py-1.5 rounded-lg transition-colors',
                    index === 0 ? 'bg-muted/60' : 'bg-muted/30'
                  )}
                >
                  <span className="text-xs text-muted-foreground mb-0.5 font-medium">
                    {dayName}
                  </span>
                  <DayIcon className="h-3.5 w-3.5 mb-0.5 text-muted-foreground" />
                  <div className="flex flex-col items-center text-xs">
                    <span className="font-semibold">{day.tempMax}°</span>
                    <span className="text-muted-foreground">{day.tempMin}°</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
