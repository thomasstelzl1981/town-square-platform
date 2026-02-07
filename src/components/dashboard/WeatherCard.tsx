/**
 * WeatherCard — Dynamic weather widget with atmospheric background
 * Background changes based on current weather condition
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

// Get dynamic background based on weather code
function getWeatherBackground(code: number): { gradient: string; textClass: string } {
  // Clear sky / Sunny
  if (code === 0 || code === 1) {
    return {
      gradient: `
        linear-gradient(180deg, 
          hsl(200, 90%, 55%) 0%, 
          hsl(190, 80%, 65%) 50%,
          hsl(40, 90%, 70%) 100%
        )
      `,
      textClass: 'text-white'
    };
  }

  // Partly cloudy
  if (code === 2) {
    return {
      gradient: `
        linear-gradient(180deg, 
          hsl(210, 60%, 60%) 0%, 
          hsl(200, 50%, 70%) 50%,
          hsl(45, 60%, 75%) 100%
        )
      `,
      textClass: 'text-white'
    };
  }

  // Overcast / Cloudy
  if (code === 3) {
    return {
      gradient: `
        linear-gradient(180deg, 
          hsl(220, 20%, 55%) 0%, 
          hsl(210, 25%, 65%) 50%,
          hsl(200, 20%, 75%) 100%
        )
      `,
      textClass: 'text-white'
    };
  }

  // Fog
  if (code >= 45 && code <= 48) {
    return {
      gradient: `
        linear-gradient(180deg, 
          hsl(210, 15%, 60%) 0%, 
          hsl(200, 10%, 70%) 40%,
          hsl(190, 12%, 80%) 100%
        )
      `,
      textClass: 'text-gray-800'
    };
  }

  // Drizzle / Light rain
  if (code >= 51 && code <= 57) {
    return {
      gradient: `
        linear-gradient(180deg, 
          hsl(220, 30%, 45%) 0%, 
          hsl(210, 35%, 55%) 50%,
          hsl(200, 30%, 65%) 100%
        )
      `,
      textClass: 'text-white'
    };
  }

  // Rain
  if (code >= 61 && code <= 67 || code >= 80 && code <= 82) {
    return {
      gradient: `
        linear-gradient(180deg, 
          hsl(225, 35%, 35%) 0%, 
          hsl(215, 40%, 45%) 50%,
          hsl(205, 35%, 55%) 100%
        )
      `,
      textClass: 'text-white'
    };
  }

  // Snow
  if (code >= 71 && code <= 77 || code >= 85 && code <= 86) {
    return {
      gradient: `
        linear-gradient(180deg, 
          hsl(210, 20%, 75%) 0%, 
          hsl(200, 15%, 85%) 50%,
          hsl(190, 10%, 92%) 100%
        )
      `,
      textClass: 'text-gray-700'
    };
  }

  // Thunderstorm
  if (code >= 95) {
    return {
      gradient: `
        linear-gradient(180deg, 
          hsl(250, 30%, 25%) 0%, 
          hsl(240, 35%, 35%) 50%,
          hsl(230, 30%, 45%) 100%
        )
      `,
      textClass: 'text-white'
    };
  }

  // Default (unknown weather)
  return {
    gradient: `
      linear-gradient(180deg, 
        hsl(210, 40%, 50%) 0%, 
        hsl(200, 35%, 60%) 50%,
        hsl(190, 30%, 70%) 100%
      )
    `,
    textClass: 'text-white'
  };
}

// Render weather effects overlay
function WeatherEffects({ code }: { code: number }) {
  // Rain drops
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 bg-white/60 rounded-full"
            style={{
              height: `${10 + Math.random() * 20}px`,
              left: `${Math.random() * 100}%`,
              top: `-${Math.random() * 20}px`,
              animation: `rain ${0.5 + Math.random() * 0.5}s linear infinite`,
              animationDelay: `${Math.random() * 1}s`
            }}
          />
        ))}
        <style>{`
          @keyframes rain {
            0% { transform: translateY(-20px); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(300px); opacity: 0; }
          }
        `}</style>
      </div>
    );
  }

  // Snow
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
        {Array.from({ length: 25 }).map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full"
            style={{
              width: `${3 + Math.random() * 4}px`,
              height: `${3 + Math.random() * 4}px`,
              left: `${Math.random() * 100}%`,
              top: `-${Math.random() * 20}px`,
              animation: `snow ${2 + Math.random() * 2}s linear infinite`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
        <style>{`
          @keyframes snow {
            0% { transform: translateY(-10px) translateX(0); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(300px) translateX(20px); opacity: 0; }
          }
        `}</style>
      </div>
    );
  }

  // Fog
  if (code >= 45 && code <= 48) {
    return (
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute inset-0 opacity-40"
          style={{
            background: `
              repeating-linear-gradient(
                0deg,
                transparent,
                transparent 20px,
                rgba(255,255,255,0.3) 20px,
                rgba(255,255,255,0.3) 40px
              )
            `,
            animation: 'fog 8s linear infinite'
          }}
        />
        <style>{`
          @keyframes fog {
            0% { transform: translateX(-20px); }
            100% { transform: translateX(20px); }
          }
        `}</style>
      </div>
    );
  }

  // Thunderstorm lightning flash
  if (code >= 95) {
    return (
      <div 
        className="absolute inset-0 pointer-events-none bg-white/0"
        style={{
          animation: 'lightning 4s ease-in-out infinite'
        }}
      >
        <style>{`
          @keyframes lightning {
            0%, 90%, 100% { background-color: transparent; }
            92%, 94% { background-color: rgba(255,255,255,0.3); }
          }
        `}</style>
      </div>
    );
  }

  return null;
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
  const { gradient, textClass } = getWeatherBackground(weather.current.weatherCode);

  return (
    <Card 
      className="relative h-full aspect-square overflow-hidden border-border/50"
      style={{ background: gradient }}
    >
      {/* Weather Effects Overlay */}
      <WeatherEffects code={weather.current.weatherCode} />

      <CardContent className={cn("relative z-10 p-4 h-full flex flex-col", textClass)}>
        {/* Header with location */}
        {city && (
          <div className="text-[10px] uppercase tracking-wider opacity-80 mb-2">
            {city}
          </div>
        )}

        {/* Current Weather */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-3xl font-bold">{weather.current.temperature}</span>
              <span className="text-lg opacity-80">°C</span>
            </div>
            <p className="text-xs opacity-80 mt-0.5">
              {currentInfo.description}
            </p>
          </div>
          <CurrentIcon className="h-10 w-10 opacity-90" />
        </div>

        {/* Details Row */}
        <div className="flex gap-4 mb-3">
          <div className="flex items-center gap-1.5 text-xs opacity-80">
            <Wind className="h-3.5 w-3.5" />
            <span>{weather.current.windSpeed} km/h</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs opacity-80">
            <Droplets className="h-3.5 w-3.5" />
            <span>{weather.current.humidity}%</span>
          </div>
        </div>

        {/* 5-Day Forecast */}
        <div className="mt-auto">
          <div className="text-[10px] uppercase tracking-wider opacity-70 mb-2">
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
                    index === 0 && 'bg-white/20'
                  )}
                >
                  <span className="text-[9px] opacity-80 mb-0.5">
                    {dayName}
                  </span>
                  <DayIcon className="h-3.5 w-3.5 mb-0.5 opacity-90" />
                  <div className="flex flex-col items-center text-[9px]">
                    <span className="font-medium">{day.tempMax}°</span>
                    <span className="opacity-70">{day.tempMin}°</span>
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
