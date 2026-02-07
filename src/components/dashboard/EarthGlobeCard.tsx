/**
 * EarthGlobeCard — Animated satellite zoom from space using Google Maps Embed API
 * 
 * Simulates a camera flight from space (zoom 2) to user location (zoom 18)
 * using progressive iframe reloads with increasing zoom levels.
 */

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Globe, Navigation, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

// Google Maps API Key (publishable key, safe for frontend)
const GOOGLE_MAPS_API_KEY = 'AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8';

interface EarthGlobeCardProps {
  latitude: number | null;
  longitude: number | null;
  city?: string;
}

export function EarthGlobeCard({ latitude, longitude, city }: EarthGlobeCardProps) {
  const [zoomLevel, setZoomLevel] = useState(2); // Start from space view
  const [phase, setPhase] = useState<'loading' | 'flying' | 'arrived'>('loading');
  const [showMap, setShowMap] = useState(false);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  // Animate zoom from world view to location
  useEffect(() => {
    if (latitude === null || longitude === null) return;

    // Zoom sequence: 2 -> 18 (space to street level)
    const zoomSequence = [2, 4, 6, 8, 10, 12, 14, 16, 18];
    let currentIndex = 0;

    // Start showing map
    setShowMap(true);
    setPhase('flying');

    const animateZoom = () => {
      if (currentIndex < zoomSequence.length) {
        setZoomLevel(zoomSequence[currentIndex]);
        currentIndex++;
        
        // Variable timing: slower at start, faster toward end
        const delay = currentIndex < 3 ? 600 : currentIndex < 6 ? 400 : 300;
        animationRef.current = setTimeout(animateZoom, delay);
      } else {
        setPhase('arrived');
      }
    };

    // Start zoom animation after initial load
    const startTimer = setTimeout(() => {
      animateZoom();
    }, 800);

    return () => {
      clearTimeout(startTimer);
      if (animationRef.current) clearTimeout(animationRef.current);
    };
  }, [latitude, longitude]);

  // Format coordinates for display
  const formatCoord = (value: number | null, type: 'lat' | 'lng') => {
    if (value === null) return '--';
    const abs = Math.abs(value);
    const dir = type === 'lat' 
      ? (value >= 0 ? 'N' : 'S') 
      : (value >= 0 ? 'O' : 'W');
    return `${abs.toFixed(4)}° ${dir}`;
  };

  // Generate Google Maps embed URL with satellite view
  const getMapUrl = () => {
    if (latitude === null || longitude === null) return null;
    return `https://www.google.com/maps/embed/v1/view?key=${GOOGLE_MAPS_API_KEY}&center=${latitude},${longitude}&zoom=${zoomLevel}&maptype=satellite`;
  };

  const mapUrl = getMapUrl();

  // Show fallback if no coordinates
  if (latitude === null || longitude === null) {
    return <FallbackGlobe latitude={latitude} longitude={longitude} city={city} />;
  }

  return (
    <Card className="relative h-full aspect-square overflow-hidden border-primary/20 bg-black">
      {/* Google Maps Satellite Embed with zoom animation */}
      {mapUrl && (
        <div 
          className={cn(
            "absolute inset-0 transition-opacity duration-700",
            showMap ? "opacity-100" : "opacity-0"
          )}
        >
          <iframe
            key={zoomLevel} // Force re-render on zoom change
            src={mapUrl}
            className="w-full h-full border-0"
            allowFullScreen={false}
            loading="eager"
            referrerPolicy="no-referrer-when-downgrade"
            style={{ 
              filter: 'saturate(1.2) contrast(1.05)',
              pointerEvents: 'none'
            }}
          />
        </div>
      )}

      {/* Loading/Flying State with Space Background */}
      {phase === 'loading' && (
        <div 
          className="absolute inset-0 flex items-center justify-center z-20"
          style={{
            background: `
              radial-gradient(ellipse at 30% 20%, hsla(220, 60%, 15%, 0.8) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 80%, hsla(270, 50%, 12%, 0.6) 0%, transparent 40%),
              radial-gradient(circle at 50% 50%, hsla(210, 80%, 8%, 1) 0%, hsla(220, 70%, 3%, 1) 100%)
            `
          }}
        >
          <div className="flex flex-col items-center gap-3">
            <Globe className="h-10 w-10 text-primary animate-pulse" />
            <span className="text-xs text-muted-foreground">Starte Anflug...</span>
          </div>
        </div>
      )}

      {/* Flying indicator */}
      {phase === 'flying' && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] text-white/80 font-mono">
            ZOOM {zoomLevel}x
          </span>
        </div>
      )}

      {/* Vignette Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)'
        }}
      />

      {/* Content Overlay */}
      <CardContent className="relative z-20 p-4 h-full flex flex-col justify-between pointer-events-none">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary drop-shadow-lg" />
          <span className="text-[10px] uppercase tracking-wider text-white/80 drop-shadow-md">
            Dein Standort
          </span>
        </div>

        {/* Location Info */}
        <div className="space-y-1">
          {city && (
            <div className="flex items-center gap-2">
              <Navigation className="h-3.5 w-3.5 text-primary drop-shadow-lg" />
              <span className="text-sm font-semibold text-white drop-shadow-md">{city}</span>
            </div>
          )}
          <div className="flex flex-col gap-0.5 text-[10px] font-mono text-white/70 drop-shadow-md">
            <span>LAT: {formatCoord(latitude, 'lat')}</span>
            <span>LNG: {formatCoord(longitude, 'lng')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Fallback CSS Globe for when coordinates are not available
function FallbackGlobe({ latitude, longitude, city }: EarthGlobeCardProps) {
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsAnimating(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const formatCoord = (value: number | null, type: 'lat' | 'lng') => {
    if (value === null) return '--';
    const abs = Math.abs(value);
    const dir = type === 'lat' 
      ? (value >= 0 ? 'N' : 'S') 
      : (value >= 0 ? 'O' : 'W');
    return `${abs.toFixed(4)}° ${dir}`;
  };

  return (
    <Card className="relative h-full aspect-square overflow-hidden border-primary/20">
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
            radial-gradient(1px 1px at 160px 120px, white, transparent)
          `,
          backgroundSize: '200px 200px'
        }}
      />

      {/* Animated Globe */}
      <div 
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-all duration-[3000ms]",
          isAnimating ? "scale-[0.3] opacity-50" : "scale-100 opacity-100"
        )}
      >
        <div 
          className="relative w-24 h-24 rounded-full shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)]"
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
          <div 
            className="absolute -inset-2 rounded-full opacity-40"
            style={{
              background: 'radial-gradient(circle, transparent 60%, hsl(200, 80%, 50%) 100%)',
              filter: 'blur(6px)'
            }}
          />

          {latitude !== null && longitude !== null && (
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ animation: 'pulse 2s ease-in-out infinite' }}
            >
              <MapPin className="h-5 w-5 text-primary drop-shadow-lg" fill="currentColor" />
            </div>
          )}
        </div>
      </div>

      {/* Content Overlay */}
      <CardContent className="relative z-10 p-4 h-full flex flex-col justify-between">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Dein Standort
          </span>
        </div>

        <div className="space-y-1">
          {city && (
            <div className="flex items-center gap-2">
              <Navigation className="h-3.5 w-3.5 text-primary" />
              <span className="text-sm font-semibold">{city}</span>
            </div>
          )}
          <div className="flex flex-col gap-0.5 text-[10px] font-mono text-muted-foreground">
            <span>LAT: {formatCoord(latitude, 'lat')}</span>
            <span>LNG: {formatCoord(longitude, 'lng')}</span>
          </div>
        </div>
      </CardContent>

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
