/**
 * EarthGlobeCard — True 3D rotating globe using Google Maps Map3DElement
 * 
 * Features:
 * - Rotating Earth view from space using Map3DElement
 * - Location marker on the globe
 * - "Zoom In" button for camera flight to user location
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe, Navigation, ZoomIn, RotateCcw, MapPin, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// Google Maps API Key (publishable key, safe for frontend)
const GOOGLE_MAPS_API_KEY = 'AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8';

interface EarthGlobeCardProps {
  latitude: number | null;
  longitude: number | null;
  city?: string;
}

type ViewState = 'loading' | 'space' | 'flying' | 'location' | 'error';

export function EarthGlobeCard({ latitude, longitude, city }: EarthGlobeCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [viewState, setViewState] = useState<ViewState>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Load Google Maps 3D API using the correct importLibrary method
  useEffect(() => {
    let isMounted = true;

    const initMap3D = async () => {
      if (!containerRef.current) return;

      try {
        // Load the Maps JavaScript API dynamically
        if (!document.querySelector(`script[src*="maps.googleapis.com"]`)) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&v=alpha&libraries=maps3d`;
            script.async = true;
            script.defer = true;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Google Maps API'));
            document.head.appendChild(script);
          });
        }

        // Wait for google object to be available
        let attempts = 0;
        while (!(window as any).google?.maps && attempts < 50) {
          await new Promise(r => setTimeout(r, 100));
          attempts++;
        }

        const google = (window as any).google;
        if (!google?.maps) {
          throw new Error('Google Maps not available');
        }

        // Import the maps3d library using the correct method
        const { Map3DElement } = await google.maps.importLibrary('maps3d');

        if (!isMounted || !containerRef.current) return;

        // Create the 3D Map element - starting from space view
        const map3D = new Map3DElement({
          center: { lat: 20, lng: 0, altitude: 0 },
          range: 25000000, // 25,000 km - view from space
          tilt: 0,
          heading: 0,
          mode: 'SATELLITE',
        });

        // Clear container and add map
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(map3D);
        mapRef.current = map3D;

        // Wait for map to be ready
        await map3D.ready;

        if (!isMounted) return;

        // Start rotation animation after map is ready
        try {
          map3D.flyCameraAround({
            camera: {
              center: { lat: 20, lng: 0, altitude: 0 },
              range: 25000000,
              tilt: 0,
              heading: 0,
            },
            durationMillis: 120000, // 2 minutes per full rotation
            rounds: -1, // Infinite rotation
          });
        } catch (e) {
          console.log('Rotation animation not supported, using static view');
        }

        setViewState('space');
      } catch (error) {
        console.error('Error initializing Map3DElement:', error);
        if (isMounted) {
          setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
          setViewState('error');
        }
      }
    };

    initMap3D();

    return () => {
      isMounted = false;
      if (mapRef.current?.stopCameraAnimation) {
        try {
          mapRef.current.stopCameraAnimation();
        } catch (e) {
          // Ignore errors on cleanup
        }
      }
    };
  }, []);

  // Zoom to location
  const handleZoomIn = useCallback(async () => {
    if (!mapRef.current || latitude === null || longitude === null) return;

    try {
      mapRef.current.stopCameraAnimation?.();
    } catch (e) {
      // Ignore
    }

    setViewState('flying');

    try {
      await mapRef.current.flyCameraTo({
        endCamera: {
          center: { lat: latitude, lng: longitude, altitude: 0 },
          range: 500, // 500 meters altitude
          tilt: 55,
          heading: 0,
        },
        durationMillis: 5000, // 5 second flight
      });
      setViewState('location');
    } catch (error) {
      console.error('Error during camera flight:', error);
      setViewState('location');
    }
  }, [latitude, longitude]);

  // Return to space view with rotation
  const handleResetView = useCallback(async () => {
    if (!mapRef.current) return;

    setViewState('flying');

    try {
      await mapRef.current.flyCameraTo({
        endCamera: {
          center: { lat: 20, lng: 0, altitude: 0 },
          range: 25000000,
          tilt: 0,
          heading: 0,
        },
        durationMillis: 3000,
      });

      // Restart rotation
      mapRef.current.flyCameraAround({
        camera: {
          center: { lat: 20, lng: 0, altitude: 0 },
          range: 25000000,
          tilt: 0,
          heading: 0,
        },
        durationMillis: 120000,
        rounds: -1,
      });

      setViewState('space');
    } catch (error) {
      console.error('Error resetting view:', error);
      setViewState('space');
    }
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

  // Fallback for errors
  if (viewState === 'error') {
    return <FallbackGlobe latitude={latitude} longitude={longitude} city={city} />;
  }

  return (
    <Card className="relative h-full aspect-square overflow-hidden border-primary/20 bg-black">
      {/* 3D Map Container */}
      <div 
        ref={containerRef}
        className="absolute inset-0 w-full h-full"
        style={{ 
          filter: 'saturate(1.2) contrast(1.05)',
        }}
      />

      {/* Loading State */}
      {viewState === 'loading' && (
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
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground">Lade 3D Globus...</span>
          </div>
        </div>
      )}

      {/* Flying indicator */}
      {viewState === 'flying' && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="text-[10px] text-white/80 font-mono">
            ANFLUG...
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

        {/* Bottom Section: Location Info + Action Button */}
        <div className="space-y-3">
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

          {/* Action Button */}
          {latitude !== null && longitude !== null && (
            <div className="flex gap-2 pointer-events-auto">
              {viewState === 'location' ? (
                <Button 
                  variant="glass" 
                  size="sm" 
                  className="flex-1 text-xs"
                  onClick={handleResetView}
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Weltraum-Ansicht
                </Button>
              ) : (
                <Button 
                  variant="glass" 
                  size="sm" 
                  className="flex-1 text-xs"
                  onClick={handleZoomIn}
                  disabled={viewState === 'flying' || viewState === 'loading'}
                >
                  <ZoomIn className="h-3.5 w-3.5 mr-1" />
                  Zoom In
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Fallback CSS Globe for unsupported browsers or when Map3DElement fails
function FallbackGlobe({ latitude, longitude, city }: EarthGlobeCardProps) {
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
        className="absolute inset-0"
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

      {/* Animated Rotating Globe */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="relative w-28 h-28 rounded-full shadow-[0_0_60px_-10px_rgba(59,130,246,0.6)]"
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
            animation: 'globe-spin 60s linear infinite'
          }}
        >
          {/* Atmosphere glow */}
          <div 
            className="absolute -inset-3 rounded-full opacity-40"
            style={{
              background: 'radial-gradient(circle, transparent 60%, hsl(200, 80%, 50%) 100%)',
              filter: 'blur(8px)'
            }}
          />

          {/* Location marker */}
          {latitude !== null && longitude !== null && (
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ animation: 'marker-pulse 2s ease-in-out infinite' }}
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
        @keyframes globe-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes marker-pulse {
          0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.8; transform: translate(-50%, -50%) scale(1.1); }
        }
      `}</style>
    </Card>
  );
}
