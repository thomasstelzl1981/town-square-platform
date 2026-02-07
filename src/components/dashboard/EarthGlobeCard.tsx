/**
 * EarthGlobeCard — Google Maps 3D Globe with CSS Fallback
 * 
 * Features:
 * - Real 3D Globe using Google Maps Map3DElement
 * - Automatic rotation from space view
 * - Cinematic zoom-in animation to user location
 * - CSS animated fallback if API fails
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe, Navigation, ZoomIn, MapPin, Loader2, AlertCircle } from 'lucide-react';

interface EarthGlobeCardProps {
  latitude: number | null;
  longitude: number | null;
  city?: string;
}

// Google Maps 3D types
declare global {
  namespace google.maps {
    namespace maps3d {
      class Map3DElement extends HTMLElement {
        center: { lat: number; lng: number; altitude: number };
        range: number;
        tilt: number;
        heading: number;
        flyCameraAround(options: {
          camera: { center: { lat: number; lng: number; altitude: number }; range: number; tilt: number };
          durationMillis: number;
          rounds: number;
        }): void;
        flyCameraTo(options: {
          endCamera: { center: { lat: number; lng: number; altitude: number }; range: number; tilt: number; heading: number };
          durationMillis: number;
        }): void;
        stopCameraAnimation(): void;
      }
    }
  }
}

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export function EarthGlobeCard({ latitude, longitude, city }: EarthGlobeCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isZoomedIn, setIsZoomedIn] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const map3dRef = useRef<google.maps.maps3d.Map3DElement | null>(null);

  // Load Google Maps Script
  const loadGoogleMapsScript = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!API_KEY) {
        reject(new Error('Google Maps API Key nicht konfiguriert'));
        return;
      }

      // Check if already loaded
      if (window.google?.maps?.maps3d?.Map3DElement) {
        resolve();
        return;
      }

      // Check if script is loading
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', () => reject(new Error('Script laden fehlgeschlagen')));
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&v=alpha&libraries=maps3d`;
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        // Wait for custom element to be defined
        customElements.whenDefined('gmp-map-3d').then(() => resolve());
      };
      script.onerror = () => reject(new Error('Google Maps Script konnte nicht geladen werden'));
      
      document.head.appendChild(script);
    });
  }, []);

  // Initialize 3D Map
  const initMap3D = useCallback(async () => {
    if (!containerRef.current) return;

    try {
      await loadGoogleMapsScript();

      // Create Map3DElement
      const map3d = document.createElement('gmp-map-3d') as google.maps.maps3d.Map3DElement;
      map3d.style.width = '100%';
      map3d.style.height = '100%';
      map3d.style.borderRadius = 'inherit';
      
      // Initial space view
      map3d.center = { lat: 0, lng: 0, altitude: 0 };
      map3d.range = 25000000; // 25,000 km from Earth
      map3d.tilt = 0;
      map3d.heading = 0;

      // Clear container and append
      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(map3d);
      map3dRef.current = map3d;

      // Start rotation after map loads
      map3d.addEventListener('gmp-ready', () => {
        setIsLoading(false);
        startRotation();
      });

      // Fallback timeout
      setTimeout(() => {
        if (isLoading) {
          setIsLoading(false);
        }
      }, 5000);

    } catch (error) {
      console.error('Google Maps 3D Fehler:', error);
      setApiError(error instanceof Error ? error.message : 'Unbekannter Fehler');
      setIsLoading(false);
    }
  }, [loadGoogleMapsScript, isLoading]);

  // Start automatic rotation
  const startRotation = useCallback(() => {
    if (!map3dRef.current || isZoomedIn) return;

    try {
      map3dRef.current.flyCameraAround({
        camera: {
          center: { lat: 0, lng: 0, altitude: 0 },
          range: 25000000,
          tilt: 0
        },
        durationMillis: 120000, // 2 minutes per rotation
        rounds: Infinity
      });
    } catch (e) {
      console.warn('Rotation konnte nicht gestartet werden:', e);
    }
  }, [isZoomedIn]);

  // Zoom to user location
  const handleZoomIn = useCallback(() => {
    if (!map3dRef.current || latitude === null || longitude === null) return;

    try {
      map3dRef.current.stopCameraAnimation();
      setIsZoomedIn(true);

      map3dRef.current.flyCameraTo({
        endCamera: {
          center: { lat: latitude, lng: longitude, altitude: 0 },
          range: 500, // 500m altitude
          tilt: 55,
          heading: 0
        },
        durationMillis: 5000 // 5 second flight
      });
    } catch (e) {
      console.warn('Zoom fehlgeschlagen, öffne externe Karte:', e);
      window.open(
        `https://www.google.com/maps/@${latitude},${longitude},1000m/data=!3m1!1e3`,
        '_blank'
      );
    }
  }, [latitude, longitude]);

  // Zoom out back to space
  const handleZoomOut = useCallback(() => {
    if (!map3dRef.current) return;

    try {
      map3dRef.current.stopCameraAnimation();
      setIsZoomedIn(false);

      map3dRef.current.flyCameraTo({
        endCamera: {
          center: { lat: 0, lng: 0, altitude: 0 },
          range: 25000000,
          tilt: 0,
          heading: 0
        },
        durationMillis: 3000
      });

      // Restart rotation after zoom out
      setTimeout(() => startRotation(), 3500);
    } catch (e) {
      console.warn('Zoom-out fehlgeschlagen:', e);
    }
  }, [startRotation]);

  useEffect(() => {
    initMap3D();
  }, [initMap3D]);

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
    <Card className="relative h-full aspect-square overflow-hidden border-primary/20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* 3D Map Container */}
      <div 
        ref={containerRef}
        className="absolute inset-0 z-0"
        style={{ borderRadius: 'inherit' }}
      />

      {/* CSS Fallback when API fails */}
      {apiError && <CSSGlobeFallback />}

      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-slate-900/80">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground">Lade 3D-Globus...</span>
          </div>
        </div>
      )}

      {/* Error indicator */}
      {apiError && (
        <div className="absolute top-2 left-2 z-30 flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/20 backdrop-blur-sm">
          <AlertCircle className="h-3 w-3 text-yellow-500" />
          <span className="text-[9px] text-yellow-500">Fallback-Modus</span>
        </div>
      )}

      {/* Content Overlay */}
      <CardContent className="relative z-20 p-4 h-full flex flex-col justify-between pointer-events-none">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary drop-shadow-lg" />
          <span className="text-[10px] uppercase tracking-wider text-white/80 drop-shadow-md font-medium">
            Dein Standort
          </span>
        </div>

        {/* Bottom Section */}
        <div className="space-y-2">
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
        </div>
      </CardContent>

      {/* Zoom Button */}
      {latitude !== null && longitude !== null && (
        <Button 
          variant="ghost" 
          size="icon"
          className="absolute bottom-3 right-3 z-30 h-8 w-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 shadow-lg hover:bg-white/30 transition-all pointer-events-auto"
          onClick={isZoomedIn ? handleZoomOut : handleZoomIn}
        >
          {isZoomedIn ? (
            <Globe className="h-4 w-4 text-white drop-shadow-md" />
          ) : (
            <ZoomIn className="h-4 w-4 text-white drop-shadow-md" />
          )}
        </Button>
      )}
    </Card>
  );
}

// CSS Fallback Globe Component
function CSSGlobeFallback() {
  return (
    <>
      {/* Deep Space Background */}
      <div 
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 30% 20%, hsla(220, 60%, 15%, 0.9) 0%, transparent 50%),
            radial-gradient(ellipse at 70% 80%, hsla(270, 50%, 12%, 0.7) 0%, transparent 40%),
            radial-gradient(circle at 50% 50%, hsla(210, 80%, 8%, 1) 0%, hsla(220, 70%, 3%, 1) 100%)
          `
        }}
      />

      {/* Animated Stars */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: `${1 + Math.random() * 2}px`,
              height: `${1 + Math.random() * 2}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: 0.3 + Math.random() * 0.7,
              animation: `twinkle ${2 + Math.random() * 3}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Animated 3D Globe */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-32 h-32">
          <div 
            className="absolute inset-0 rounded-full overflow-hidden shadow-[0_0_80px_-10px_rgba(59,130,246,0.5),inset_-20px_-20px_40px_rgba(0,0,0,0.4)]"
            style={{
              background: `
                radial-gradient(circle at 25% 25%, 
                  hsl(200, 85%, 55%) 0%,
                  hsl(205, 75%, 50%) 10%,
                  hsl(140, 55%, 40%) 25%,
                  hsl(145, 50%, 35%) 35%,
                  hsl(35, 65%, 55%) 45%,
                  hsl(140, 45%, 38%) 55%,
                  hsl(200, 70%, 45%) 65%,
                  hsl(210, 65%, 35%) 80%,
                  hsl(220, 55%, 20%) 100%
                )
              `,
              animation: 'globe-rotate 30s linear infinite'
            }}
          >
            {/* Cloud layer */}
            <div 
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage: `
                  radial-gradient(ellipse 15% 8% at 25% 30%, white 0%, transparent 100%),
                  radial-gradient(ellipse 20% 10% at 55% 25%, white 0%, transparent 100%),
                  radial-gradient(ellipse 18% 12% at 70% 55%, white 0%, transparent 100%)
                `,
                animation: 'clouds-drift 45s linear infinite'
              }}
            />
          </div>

          {/* Atmosphere glow */}
          <div 
            className="absolute -inset-4 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, transparent 55%, hsla(200, 80%, 60%, 0.3) 70%, hsla(200, 90%, 70%, 0.1) 100%)',
              filter: 'blur(4px)'
            }}
          />

          {/* Center marker */}
          <div 
            className="absolute z-10"
            style={{ 
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              animation: 'marker-pulse 2s ease-in-out infinite' 
            }}
          >
            <div className="relative">
              <MapPin className="h-6 w-6 text-red-500 drop-shadow-lg" fill="currentColor" />
              <div className="absolute inset-0 animate-ping">
                <MapPin className="h-6 w-6 text-red-400 opacity-75" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vignette */}
      <div 
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)'
        }}
      />

      {/* CSS Animations */}
      <style>{`
        @keyframes globe-rotate {
          from { background-position-x: 0%; }
          to { background-position-x: 200%; }
        }
        @keyframes clouds-drift {
          from { background-position-x: 0%; }
          to { background-position-x: 300%; }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes marker-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.1); }
        }
      `}</style>
    </>
  );
}
