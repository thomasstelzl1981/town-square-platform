/**
 * WeatherCard — Compact weather widget for square dashboard layout
 * Displays current weather + 5-day forecast
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

export function WeatherCard({ latitude, longitude, city }: WeatherCardProps) {
  const { data: weather, isLoading, error } = useWeather(latitude, longitude);

  if (isLoading) {
    return (
      <Card className="glass-card border-border/50 h-full aspect-square flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  if (error || !weather) {
    return (
      <Card className="glass-card border-border/50 h-full aspect-square flex items-center justify-center">
        <p className="text-muted-foreground text-xs">Wetterdaten nicht verfügbar</p>
      </Card>
    );
  }

  const currentInfo = getWeatherInfo(weather.current.weatherCode);
  const CurrentIcon = currentInfo.icon;

  return (
    <Card className="glass-card border-border/50 h-full aspect-square overflow-hidden">
      <CardContent className="p-4 h-full flex flex-col">
        {/* Header with location */}
        {city && (
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
            {city}
          </div>
        )}

        {/* Current Weather */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-3xl font-bold">{weather.current.temperature}</span>
              <span className="text-lg text-muted-foreground">°C</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {currentInfo.description}
            </p>
          </div>
          <CurrentIcon className="h-10 w-10 text-primary" />
        </div>

        {/* Details Row */}
        <div className="flex gap-4 mb-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Wind className="h-3.5 w-3.5" />
            <span>{weather.current.windSpeed} km/h</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Droplets className="h-3.5 w-3.5" />
            <span>{weather.current.humidity}%</span>
          </div>
        </div>

        {/* 5-Day Forecast */}
        <div className="mt-auto">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
            5-Tage Vorschau
          </div>
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
                    'flex flex-col items-center py-1.5 rounded-lg',
                    index === 0 && 'bg-primary/10'
                  )}
                >
                  <span className="text-[9px] text-muted-foreground mb-0.5">
                    {dayName}
                  </span>
                  <DayIcon className="h-3.5 w-3.5 mb-0.5 text-foreground/80" />
                  <div className="flex flex-col items-center text-[9px]">
                    <span className="font-medium">{day.tempMax}°</span>
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
