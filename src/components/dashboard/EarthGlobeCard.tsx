/**
 * EarthGlobeCard — Interactive 3D Earth view using Google Maps
 * 
 * Uses Google Maps Embed API with satellite view and zoom animation.
 * Falls back to CSS globe visualization if coordinates unavailable.
 */

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Globe, MapPin, Navigation, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EarthGlobeCardProps {
  latitude: number | null;
  longitude: number | null;
  city?: string;
}

export function EarthGlobeCard({ latitude, longitude, city }: EarthGlobeCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(2); // Start zoomed out (world view)
  const [showMap, setShowMap] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Animate zoom from world view to location
  useEffect(() => {
    if (latitude === null || longitude === null) return;

    // Start animation sequence
    const zoomSequence = [2, 4, 6, 8, 10, 12, 14, 16, 17];
    let currentIndex = 0;

    const animateZoom = () => {
      if (currentIndex < zoomSequence.length) {
        setZoomLevel(zoomSequence[currentIndex]);
        currentIndex++;
        setTimeout(animateZoom, 400); // 400ms between zoom steps
      }
    };

    // Start zoom animation after initial load
    const timer = setTimeout(() => {
      setShowMap(true);
      setTimeout(animateZoom, 500);
    }, 1000);

    return () => clearTimeout(timer);
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
    
    // Use satellite view (maptype=satellite) with the animated zoom level
    return `https://www.google.com/maps/embed/v1/view?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}&center=${latitude},${longitude}&zoom=${zoomLevel}&maptype=satellite`;
  };

  const mapUrl = getMapUrl();
  const hasApiKey = !!import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // If no API key or no coordinates, show the CSS fallback
  if (!hasApiKey || !mapUrl) {
    return <FallbackGlobe latitude={latitude} longitude={longitude} city={city} />;
  }

  return (
    <Card className="relative h-full min-h-[280px] overflow-hidden border-primary/20 bg-black">
      {/* Google Maps Satellite Embed */}
      <div className={cn(
        "absolute inset-0 transition-opacity duration-1000",
        showMap ? "opacity-100" : "opacity-0"
      )}>
        <iframe
          ref={iframeRef}
          src={mapUrl}
          className="w-full h-full border-0"
          allowFullScreen={false}
          loading="eager"
          referrerPolicy="no-referrer-when-downgrade"
          onLoad={() => setIsLoading(false)}
          style={{ 
            filter: 'saturate(1.1) contrast(1.05)',
            pointerEvents: 'none' // Disable interaction for clean display
          }}
        />
      </div>

      {/* Loading State with Space Background */}
      {(isLoading || !showMap) && (
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{
            background: `
              radial-gradient(ellipse at 30% 20%, hsla(220, 60%, 15%, 0.8) 0%, transparent 50%),
              radial-gradient(ellipse at 70% 80%, hsla(270, 50%, 12%, 0.6) 0%, transparent 40%),
              radial-gradient(circle at 50% 50%, hsla(210, 80%, 8%, 1) 0%, hsla(220, 70%, 3%, 1) 100%)
            `
          }}
        >
          <div className="flex flex-col items-center gap-3">
            <Globe className="h-12 w-12 text-primary animate-pulse" />
            <span className="text-sm text-muted-foreground">Lade Satellitenansicht...</span>
          </div>
        </div>
      )}

      {/* Vignette Overlay for cinematic effect */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)'
        }}
      />

      {/* Content Overlay */}
      <CardContent className="relative z-10 p-6 h-full flex flex-col justify-between pointer-events-none">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary drop-shadow-lg" />
          <span className="text-xs uppercase tracking-wider text-white/80 drop-shadow-md">
            Dein Standort
          </span>
        </div>

        {/* Location Info */}
        <div className="space-y-2">
          {city && (
            <div className="flex items-center gap-2">
              <Navigation className="h-4 w-4 text-primary drop-shadow-lg" />
              <span className="text-lg font-semibold text-white drop-shadow-md">{city}</span>
            </div>
          )}
          <div className="flex flex-col gap-1 text-xs font-mono text-white/70 drop-shadow-md">
            <span>LAT: {formatCoord(latitude, 'lat')}</span>
            <span>LNG: {formatCoord(longitude, 'lng')}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Fallback CSS Globe for when API key is not available
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
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-all duration-[3000ms]",
          isAnimating ? "scale-[0.3] opacity-50" : "scale-100 opacity-100"
        )}
      >
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
          <div 
            className="absolute -inset-2 rounded-full opacity-40"
            style={{
              background: 'radial-gradient(circle, transparent 60%, hsl(200, 80%, 50%) 100%)',
              filter: 'blur(8px)'
            }}
          />

          {latitude !== null && longitude !== null && (
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ animation: 'pulse 2s ease-in-out infinite' }}
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
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          <span className="text-xs uppercase tracking-wider text-muted-foreground">
            Dein Standort
          </span>
        </div>

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
