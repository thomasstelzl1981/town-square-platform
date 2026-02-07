/**
 * WeatherCard — Dynamic weather widget with vivid atmospheric backgrounds
 * Background and effects change based on current weather condition
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

// Get vivid dynamic background based on weather code
function getWeatherBackground(code: number): { gradient: string; textClass: string; overlayOpacity: number } {
  // Clear sky / Sunny
  if (code === 0 || code === 1) {
    return {
      gradient: `
        linear-gradient(180deg, 
          hsl(205, 95%, 50%) 0%, 
          hsl(195, 90%, 60%) 30%,
          hsl(45, 100%, 65%) 80%,
          hsl(35, 100%, 55%) 100%
        )
      `,
      textClass: 'text-white',
      overlayOpacity: 0.1
    };
  }

  // Partly cloudy
  if (code === 2) {
    return {
      gradient: `
        linear-gradient(180deg, 
          hsl(210, 70%, 55%) 0%, 
          hsl(200, 60%, 65%) 40%,
          hsl(50, 70%, 70%) 100%
        )
      `,
      textClass: 'text-white',
      overlayOpacity: 0.15
    };
  }

  // Overcast / Cloudy
  if (code === 3) {
    return {
      gradient: `
        linear-gradient(180deg, 
          hsl(220, 25%, 50%) 0%, 
          hsl(215, 30%, 60%) 50%,
          hsl(210, 25%, 70%) 100%
        )
      `,
      textClass: 'text-white',
      overlayOpacity: 0.2
    };
  }

  // Fog - Mysterious misty atmosphere
  if (code >= 45 && code <= 48) {
    return {
      gradient: `
        linear-gradient(180deg, 
          hsl(210, 20%, 55%) 0%, 
          hsl(200, 15%, 65%) 30%,
          hsl(190, 18%, 75%) 60%,
          hsl(180, 12%, 85%) 100%
        )
      `,
      textClass: 'text-gray-800',
      overlayOpacity: 0.3
    };
  }

  // Drizzle / Light rain - Soft blue mood
  if (code >= 51 && code <= 57) {
    return {
      gradient: `
        linear-gradient(180deg, 
          hsl(220, 40%, 40%) 0%, 
          hsl(215, 45%, 50%) 40%,
          hsl(205, 40%, 60%) 100%
        )
      `,
      textClass: 'text-white',
      overlayOpacity: 0.25
    };
  }

  // Rain - Dramatic dark blue
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    return {
      gradient: `
        linear-gradient(180deg, 
          hsl(225, 45%, 30%) 0%, 
          hsl(220, 50%, 40%) 40%,
          hsl(210, 45%, 50%) 100%
        )
      `,
      textClass: 'text-white',
      overlayOpacity: 0.3
    };
  }

  // Snow - Cool crisp whites and light blues
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
    return {
      gradient: `
        linear-gradient(180deg, 
          hsl(210, 30%, 70%) 0%, 
          hsl(200, 25%, 80%) 40%,
          hsl(190, 20%, 90%) 100%
        )
      `,
      textClass: 'text-gray-800',
      overlayOpacity: 0.2
    };
  }

  // Thunderstorm - Dramatic purple/dark atmosphere
  if (code >= 95) {
    return {
      gradient: `
        linear-gradient(180deg, 
          hsl(260, 40%, 20%) 0%, 
          hsl(250, 45%, 30%) 40%,
          hsl(240, 40%, 40%) 100%
        )
      `,
      textClass: 'text-white',
      overlayOpacity: 0.35
    };
  }

  // Default (unknown weather)
  return {
    gradient: `
      linear-gradient(180deg, 
        hsl(210, 50%, 45%) 0%, 
        hsl(200, 45%, 55%) 50%,
        hsl(190, 40%, 65%) 100%
      )
    `,
    textClass: 'text-white',
    overlayOpacity: 0.15
  };
}

// Render weather effects overlay with more intensity
function WeatherEffects({ code }: { code: number }) {
  // Rain drops - more visible and animated
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
    const isHeavy = code >= 65 || code >= 82;
    const dropCount = isHeavy ? 40 : 25;
    
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: dropCount }).map((_, i) => (
          <div
            key={i}
            className="absolute bg-white/40 rounded-full"
            style={{
              width: '2px',
              height: `${12 + Math.random() * 18}px`,
              left: `${Math.random() * 100}%`,
              top: `-${Math.random() * 30}px`,
              animation: `rain ${0.4 + Math.random() * 0.4}s linear infinite`,
              animationDelay: `${Math.random() * 1}s`,
              opacity: 0.4 + Math.random() * 0.3
            }}
          />
        ))}
        <style>{`
          @keyframes rain {
            0% { transform: translateY(-30px) translateX(5px); opacity: 0; }
            10% { opacity: 0.6; }
            85% { opacity: 0.5; }
            100% { transform: translateY(350px) translateX(-5px); opacity: 0; }
          }
        `}</style>
      </div>
    );
  }

  // Snow - Bigger, more visible flakes with drift
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 35 }).map((_, i) => (
          <div
            key={i}
            className="absolute bg-white rounded-full shadow-sm"
            style={{
              width: `${4 + Math.random() * 6}px`,
              height: `${4 + Math.random() * 6}px`,
              left: `${Math.random() * 100}%`,
              top: `-${Math.random() * 30}px`,
              animation: `snow ${2.5 + Math.random() * 3}s linear infinite`,
              animationDelay: `${Math.random() * 3}s`,
              opacity: 0.7 + Math.random() * 0.3
            }}
          />
        ))}
        <style>{`
          @keyframes snow {
            0% { transform: translateY(-20px) translateX(0) rotate(0deg); opacity: 0; }
            10% { opacity: 0.9; }
            50% { transform: translateY(150px) translateX(20px) rotate(180deg); }
            90% { opacity: 0.8; }
            100% { transform: translateY(350px) translateX(-10px) rotate(360deg); opacity: 0; }
          }
        `}</style>
      </div>
    );
  }

  // Fog - Layered moving mist effect
  if (code >= 45 && code <= 48) {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Layer 1 - Slow moving */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(90deg, 
                transparent 0%, 
                rgba(255,255,255,0.3) 20%,
                rgba(255,255,255,0.5) 50%,
                rgba(255,255,255,0.3) 80%,
                transparent 100%
              )
            `,
            animation: 'fog-slow 12s ease-in-out infinite alternate'
          }}
        />
        {/* Layer 2 - Faster moving */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(90deg, 
                transparent 0%, 
                rgba(255,255,255,0.2) 30%,
                rgba(255,255,255,0.4) 60%,
                transparent 100%
              )
            `,
            animation: 'fog-fast 8s ease-in-out infinite alternate-reverse'
          }}
        />
        {/* Vertical gradient for depth */}
        <div 
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(180deg, 
                transparent 0%, 
                rgba(255,255,255,0.2) 50%,
                rgba(255,255,255,0.4) 100%
              )
            `
          }}
        />
        <style>{`
          @keyframes fog-slow {
            0% { transform: translateX(-30%) scale(1.1); }
            100% { transform: translateX(30%) scale(1); }
          }
          @keyframes fog-fast {
            0% { transform: translateX(20%) scale(1); opacity: 0.5; }
            100% { transform: translateX(-40%) scale(1.05); opacity: 0.7; }
          }
        `}</style>
      </div>
    );
  }

  // Thunderstorm - Dramatic lightning flashes
  if (code >= 95) {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Lightning flash */}
        <div 
          className="absolute inset-0 bg-white/0"
          style={{ animation: 'lightning 5s ease-in-out infinite' }}
        />
        {/* Ambient purple glow */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: `
              radial-gradient(ellipse at 30% 20%, hsla(270, 60%, 50%, 0.4) 0%, transparent 60%),
              radial-gradient(ellipse at 70% 60%, hsla(250, 50%, 40%, 0.3) 0%, transparent 50%)
            `,
            animation: 'storm-glow 3s ease-in-out infinite alternate'
          }}
        />
        <style>{`
          @keyframes lightning {
            0%, 88%, 92%, 100% { background-color: transparent; }
            89%, 91% { background-color: rgba(255,255,255,0.4); }
            90% { background-color: rgba(255,255,255,0.1); }
          }
          @keyframes storm-glow {
            0% { opacity: 0.2; }
            100% { opacity: 0.4; }
          }
        `}</style>
      </div>
    );
  }

  // Sunny - Subtle sun rays
  if (code === 0 || code === 1) {
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div 
          className="absolute top-0 right-0 w-32 h-32 opacity-30"
          style={{
            background: 'radial-gradient(circle, rgba(255,200,100,0.6) 0%, transparent 70%)',
            filter: 'blur(20px)',
            animation: 'sun-pulse 4s ease-in-out infinite'
          }}
        />
        <style>{`
          @keyframes sun-pulse {
            0%, 100% { opacity: 0.25; transform: scale(1); }
            50% { opacity: 0.4; transform: scale(1.1); }
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
      <Card className="relative h-full aspect-square flex items-center justify-center bg-gradient-to-b from-muted/80 to-muted border-border/50">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  if (error || !weather) {
    return (
      <Card className="relative h-full aspect-square flex items-center justify-center bg-gradient-to-b from-muted/80 to-muted border-border/50">
        <p className="text-muted-foreground text-xs">Wetterdaten nicht verfügbar</p>
      </Card>
    );
  }

  const currentInfo = getWeatherInfo(weather.current.weatherCode);
  const CurrentIcon = currentInfo.icon;
  const { gradient, textClass, overlayOpacity } = getWeatherBackground(weather.current.weatherCode);

  return (
    <Card 
      className="relative h-full aspect-square overflow-hidden border-border/30 shadow-lg"
      style={{ background: gradient }}
    >
      {/* Weather Effects Overlay */}
      <WeatherEffects code={weather.current.weatherCode} />

      {/* Subtle glass overlay for better text readability */}
      <div 
        className="absolute inset-0 backdrop-blur-[1px]"
        style={{ backgroundColor: `rgba(0,0,0,${overlayOpacity})` }}
      />

      <CardContent className={cn("relative z-10 p-4 h-full flex flex-col", textClass)}>
        {/* Header with location */}
        {city && (
          <div className="text-[10px] uppercase tracking-wider opacity-90 mb-2 font-medium drop-shadow-sm">
            {city}
          </div>
        )}

        {/* Current Weather */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-baseline gap-0.5 drop-shadow-md">
              <span className="text-3xl font-bold">{weather.current.temperature}</span>
              <span className="text-lg opacity-90">°C</span>
            </div>
            <p className="text-xs opacity-90 mt-0.5 drop-shadow-sm font-medium">
              {currentInfo.description}
            </p>
          </div>
          <CurrentIcon className="h-10 w-10 opacity-95 drop-shadow-lg" />
        </div>

        {/* Details Row */}
        <div className="flex gap-4 mb-3">
          <div className="flex items-center gap-1.5 text-xs opacity-90 drop-shadow-sm">
            <Wind className="h-3.5 w-3.5" />
            <span className="font-medium">{weather.current.windSpeed} km/h</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs opacity-90 drop-shadow-sm">
            <Droplets className="h-3.5 w-3.5" />
            <span className="font-medium">{weather.current.humidity}%</span>
          </div>
        </div>

        {/* 5-Day Forecast */}
        <div className="mt-auto">
          <div className="text-[10px] uppercase tracking-wider opacity-80 mb-2 font-medium drop-shadow-sm">
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
                    'flex flex-col items-center py-1.5 rounded-lg transition-colors',
                    index === 0 ? 'bg-white/25 backdrop-blur-sm' : 'bg-white/10'
                  )}
                >
                  <span className="text-[9px] opacity-90 mb-0.5 font-medium">
                    {dayName}
                  </span>
                  <DayIcon className="h-3.5 w-3.5 mb-0.5 opacity-95" />
                  <div className="flex flex-col items-center text-[9px]">
                    <span className="font-semibold">{day.tempMax}°</span>
                    <span className="opacity-80">{day.tempMin}°</span>
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
