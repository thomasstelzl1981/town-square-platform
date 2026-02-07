/**
 * WeatherCard — Real-time weather widget using Open-Meteo API
 * Displays current weather + 7-day forecast
 */

import { Card, CardContent } from '@/components/ui/card';
import { useWeather, type WeatherData } from '@/hooks/useWeather';
import { getWeatherInfo, getWeatherEmoji } from '@/lib/weatherCodes';
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
      <Card className="glass-card border-border/50 h-full min-h-[280px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  if (error || !weather) {
    return (
      <Card className="glass-card border-border/50 h-full min-h-[280px] flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Wetterdaten nicht verfügbar</p>
      </Card>
    );
  }

  const currentInfo = getWeatherInfo(weather.current.weatherCode);
  const CurrentIcon = currentInfo.icon;

  return (
    <Card className="glass-card border-border/50 h-full min-h-[280px] overflow-hidden">
      <CardContent className="p-6 h-full flex flex-col">
        {/* Header with location */}
        {city && (
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
            {city}
          </div>
        )}

        {/* Current Weather */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-5xl font-bold">{weather.current.temperature}</span>
              <span className="text-2xl text-muted-foreground">°C</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {currentInfo.description}
            </p>
          </div>
          <div className="flex flex-col items-center">
            <CurrentIcon className="h-12 w-12 text-primary" />
          </div>
        </div>

        {/* Details Row */}
        <div className="flex gap-6 mb-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wind className="h-4 w-4" />
            <span>{weather.current.windSpeed} km/h</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Droplets className="h-4 w-4" />
            <span>{weather.current.humidity}%</span>
          </div>
        </div>

        {/* 7-Day Forecast */}
        <div className="mt-auto">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
            7-Tage Vorschau
          </div>
          <div className="grid grid-cols-7 gap-1">
            {weather.daily.slice(0, 7).map((day, index) => {
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
                    'flex flex-col items-center py-2 rounded-lg',
                    index === 0 && 'bg-primary/10'
                  )}
                >
                  <span className="text-[10px] text-muted-foreground mb-1">
                    {dayName}
                  </span>
                  <DayIcon className="h-4 w-4 mb-1 text-foreground/80" />
                  <div className="flex flex-col items-center text-[10px]">
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
