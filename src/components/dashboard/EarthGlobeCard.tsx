/**
 * EarthGlobeCard — Interactive 3D Earth view
 * 
 * Note: Google Maps 3D Tiles require API key. This component shows a beautiful
 * placeholder with coordinates until the API key is configured.
 * 
 * When GOOGLE_MAPS_API_KEY is available, this will use Photorealistic 3D Tiles
 * with flyCameraTo() animation from space to the user's location.
 */

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Globe, MapPin, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EarthGlobeCardProps {
  latitude: number | null;
  longitude: number | null;
  city?: string;
}

export function EarthGlobeCard({ latitude, longitude, city }: EarthGlobeCardProps) {
  const [isAnimating, setIsAnimating] = useState(true);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Animate the "zoom" effect on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Format coordinates for display
  const formatCoord = (value: number | null, type: 'lat' | 'lng') => {
    if (value === null) return '--';
    const abs = Math.abs(value);
    const dir = type === 'lat' 
      ? (value >= 0 ? 'N' : 'S') 
      : (value >= 0 ? 'O' : 'W');
    return `${abs.toFixed(4)}° ${dir}`;
  };

  return (
    <Card className="relative h-full min-h-[280px] overflow-hidden border-primary/20">
      {/* Deep Space Background */}
      <div 
        className={cn(
          "absolute inset-0 transition-all duration-[3000ms]",
          isAnimating ? "scale-150 opacity-0" : "scale-100 opacity-100"
        )}
        style={{
          background: `
            radial-gradient(ellipse at 30% 20%, hsla(220, 60%, 15%, 0.8) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, hsla(270, 50%, 12%, 0.6) 0%, transparent 40%),
            radial-gradient(circle at 50% 50%, hsla(210, 80%, 8%, 1) 0%, hsla(220, 70%, 3%, 1) 100%)
          `
        }}
      />

      {/* Stars Layer */}
      <div 
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage: `
            radial-gradient(1px 1px at 20px 30px, white, transparent),
            radial-gradient(1px 1px at 40px 70px, rgba(255,255,255,0.8), transparent),
            radial-gradient(1px 1px at 50px 160px, rgba(255,255,255,0.6), transparent),
            radial-gradient(1px 1px at 90px 40px, white, transparent),
            radial-gradient(1px 1px at 130px 80px, rgba(255,255,255,0.7), transparent),
            radial-gradient(1px 1px at 160px 120px, white, transparent),
            radial-gradient(1.5px 1.5px at 200px 50px, rgba(255,255,255,0.9), transparent),
            radial-gradient(1px 1px at 220px 100px, white, transparent),
            radial-gradient(1px 1px at 250px 180px, rgba(255,255,255,0.6), transparent),
            radial-gradient(1px 1px at 280px 30px, white, transparent),
            radial-gradient(1.5px 1.5px at 310px 140px, rgba(255,255,255,0.8), transparent),
            radial-gradient(1px 1px at 340px 90px, white, transparent)
          `,
          backgroundSize: '350px 200px'
        }}
      />

      {/* Animated Globe Visualization */}
      <div 
        ref={canvasRef}
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-all duration-[3000ms]",
          isAnimating ? "scale-[0.3] opacity-50" : "scale-100 opacity-100"
        )}
      >
        {/* Globe Circle with Earth-like gradient */}
        <div 
          className={cn(
            "relative w-40 h-40 rounded-full transition-all duration-1000",
            "shadow-[0_0_60px_-10px_rgba(59,130,246,0.5)]"
          )}
          style={{
            background: `
              radial-gradient(circle at 30% 30%, 
                hsl(200, 80%, 60%) 0%, 
                hsl(210, 70%, 45%) 20%,
                hsl(140, 50%, 35%) 40%,
                hsl(35, 60%, 50%) 55%,
                hsl(210, 60%, 30%) 70%,
                hsl(220, 50%, 15%) 100%
              )
            `,
            animation: 'spin 60s linear infinite'
          }}
        >
          {/* Atmosphere Glow */}
          <div 
            className="absolute -inset-2 rounded-full opacity-40"
            style={{
              background: 'radial-gradient(circle, transparent 60%, hsl(200, 80%, 50%) 100%)',
              filter: 'blur(8px)'
            }}
          />

          {/* Location Marker */}
          {latitude !== null && longitude !== null && (
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{
                animation: 'pulse 2s ease-in-out infinite'
              }}
            >
              <div className="relative">
                <MapPin className="h-6 w-6 text-primary drop-shadow-lg" fill="currentColor" />
                <div className="absolute -inset-2 rounded-full bg-primary/30 animate-ping" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content Overlay */}
      <CardContent className="relative z-10 p-6 h-full flex flex-col justify-between">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Dein Standort
          </span>
        </div>

        {/* Location Info */}
        <div className="space-y-2">
          {city && (
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-primary" />
              <span className="text-lg font-semibold">{city}</span>
            </div>
          )}
          <div className="flex flex-col gap-1 text-xs font-mono text-muted-foreground">
            <span>LAT: {formatCoord(latitude, 'lat')}</span>
            <span>LNG: {formatCoord(longitude, 'lng')}</span>
          </div>
        </div>
      </CardContent>

      {/* CSS Keyframes */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.1); }
        }
      `}</style>
    </Card>
  );
}
