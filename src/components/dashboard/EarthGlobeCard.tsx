/**
 * EarthGlobeCard — Interactive 3D Earth view using Google Maps 3D API
 * 
 * Uses Google Maps JavaScript API with Map3DElement for true 3D globe
 * and animated camera flight from space to user location.
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Globe, Navigation, MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Google Maps API Key (publishable key, safe for frontend)
const GOOGLE_MAPS_API_KEY = 'AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8';

interface EarthGlobeCardProps {
  latitude: number | null;
  longitude: number | null;
  city?: string;
}

// Type declarations for Google Maps 3D API
declare global {
  interface Window {
    google: any;
  }
}

export function EarthGlobeCard({ latitude, longitude, city }: EarthGlobeCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const map3DRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Load Google Maps script
  useEffect(() => {
    if (window.google?.maps) {
      setScriptLoaded(true);
      return;
    }

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => setScriptLoaded(true));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&v=alpha&libraries=maps3d`;
    script.async = true;
    script.defer = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => setError('Google Maps konnte nicht geladen werden');
    document.head.appendChild(script);
  }, []);

  // Initialize 3D Map
  const initMap3D = useCallback(async () => {
    if (!containerRef.current || !window.google?.maps) return;
    
    try {
      // Check if Map3DElement is available
      const maps3d = await window.google.maps.importLibrary('maps3d') as any;
      
      if (!maps3d?.Map3DElement) {
        throw new Error('Map3DElement nicht verfügbar');
      }

      // Create 3D Map element
      const map3DElement = new maps3d.Map3DElement({
        center: { lat: 0, lng: 0, altitude: 25000000 }, // Start from space
        tilt: 0,
        heading: 0,
        range: 25000000,
      });

      // Clear container and add map
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(map3DElement);
      map3DRef.current = map3DElement;

      // Wait for map to be ready
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setIsLoading(false);

      // If we have coordinates, fly to location
      if (latitude !== null && longitude !== null) {
        // Start the camera flight animation
        setTimeout(() => {
          if (map3DRef.current?.flyCameraTo) {
            map3DRef.current.flyCameraTo({
              endCamera: {
                center: { lat: latitude, lng: longitude, altitude: 500 },
                tilt: 55,
                heading: 0,
                range: 2000,
              },
              durationMillis: 4500,
            });
          }
        }, 1000);
      }
    } catch (err) {
      console.warn('Map3DElement nicht verfügbar, verwende Fallback:', err);
      setError('3D-Ansicht nicht verfügbar');
    }
  }, [latitude, longitude]);

  // Initialize when script is loaded
  useEffect(() => {
    if (scriptLoaded) {
      initMap3D();
    }
  }, [scriptLoaded, initMap3D]);

  // Fly to new location when coordinates change
  useEffect(() => {
    if (map3DRef.current?.flyCameraTo && latitude !== null && longitude !== null && !isLoading) {
      map3DRef.current.flyCameraTo({
        endCamera: {
          center: { lat: latitude, lng: longitude, altitude: 500 },
          tilt: 55,
          heading: 0,
          range: 2000,
        },
        durationMillis: 3000,
      });
    }
  }, [latitude, longitude, isLoading]);

  // Format coordinates for display
  const formatCoord = (value: number | null, type: 'lat' | 'lng') => {
    if (value === null) return '--';
    const abs = Math.abs(value);
    const dir = type === 'lat' 
      ? (value >= 0 ? 'N' : 'S') 
      : (value >= 0 ? 'O' : 'W');
    return `${abs.toFixed(4)}° ${dir}`;
  };

  // Show fallback if error
  if (error) {
    return <FallbackGlobe latitude={latitude} longitude={longitude} city={city} />;
  }

  return (
    <Card className="relative h-full aspect-square overflow-hidden border-primary/20 bg-black">
      {/* 3D Map Container */}
      <div 
        ref={containerRef}
        className="absolute inset-0 w-full h-full"
        style={{ 
          filter: 'saturate(1.1) contrast(1.05)',
        }}
      />

      {/* Loading State */}
      {isLoading && (
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
            <span className="text-xs text-muted-foreground">Lade 3D-Globus...</span>
          </div>
        </div>
      )}

      {/* Vignette Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)'
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

// Fallback CSS Globe for when 3D API is not available
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
