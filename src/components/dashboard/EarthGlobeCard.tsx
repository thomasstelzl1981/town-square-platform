/**
 * EarthGlobeCard — react-globe.gl based Globe Widget
 *
 * No API key needed. Works in all modern browsers (WebGL1).
 * Falls back to CSSGlobeFallback on WebGL errors.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { CSSGlobeFallback } from "@/components/dashboard/earth-globe/CSSGlobeFallback";

interface EarthGlobeCardProps {
  latitude: number | null;
  longitude: number | null;
  city?: string;
}

export function EarthGlobeCard({ latitude, longitude, city }: EarthGlobeCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isZoomedIn, setIsZoomedIn] = useState(false);
  const [GlobeComponent, setGlobeComponent] = useState<any>(null);

  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Lazy-load react-globe.gl
  useEffect(() => {
    let cancelled = false;
    import("react-globe.gl")
      .then((mod) => {
        if (!cancelled) {
          setGlobeComponent(() => mod.default);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load react-globe.gl:", err);
        if (!cancelled) {
          setHasError(true);
          setIsLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, []);

  // Measure container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setDimensions({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Auto-rotation
  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;

    const controls = globe.controls();
    if (controls) {
      controls.autoRotate = !isZoomedIn;
      controls.autoRotateSpeed = 0.4;
      controls.enableZoom = false;
    }
  }, [isZoomedIn, GlobeComponent]);

  // Marker data
  const markerData = useMemo(() => {
    if (latitude === null || longitude === null) return [];
    return [{ lat: latitude, lng: longitude, size: 0.6, color: "#ef4444" }];
  }, [latitude, longitude]);

  const handleZoomIn = useCallback(() => {
    const globe = globeRef.current;
    if (!globe || latitude === null || longitude === null) return;

    setIsZoomedIn(true);
    globe.pointOfView({ lat: latitude, lng: longitude, altitude: 0.5 }, 2000);
  }, [latitude, longitude]);

  const handleZoomOut = useCallback(() => {
    const globe = globeRef.current;
    if (!globe) return;

    setIsZoomedIn(false);
    globe.pointOfView({ lat: 20, lng: 0, altitude: 2.5 }, 2000);
  }, []);

  const formatCoord = (value: number | null, type: "lat" | "lng") => {
    if (value === null) return "--";
    const abs = Math.abs(value);
    const dir = type === "lat" ? (value >= 0 ? "N" : "S") : value >= 0 ? "O" : "W";
    return `${abs.toFixed(4)}° ${dir}`;
  };

  return (
    <Card className="relative h-full aspect-square overflow-hidden border-primary/20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Globe Container */}
      <div ref={containerRef} className="absolute inset-0 z-0">
        {GlobeComponent && dimensions.width > 0 && !hasError && (
          <GlobeComponent
            ref={globeRef}
            width={dimensions.width}
            height={dimensions.height}
            globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
            bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
            backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
            pointsData={markerData}
            pointLat="lat"
            pointLng="lng"
            pointAltitude={0.01}
            pointRadius="size"
            pointColor="color"
            animateIn={true}
            atmosphereColor="hsl(200, 80%, 60%)"
            atmosphereAltitude={0.2}
            onGlobeReady={() => {
              const globe = globeRef.current;
              if (globe) {
                const controls = globe.controls();
                if (controls) {
                  controls.autoRotate = true;
                  controls.autoRotateSpeed = 0.4;
                  controls.enableZoom = false;
                }
                // Initial view
                globe.pointOfView({ lat: 20, lng: 0, altitude: 2.5 }, 0);
              }
            }}
          />
        )}
      </div>

      {/* CSS Fallback when WebGL fails */}
      {hasError && <CSSGlobeFallback />}

      {/* Loading */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-20 bg-slate-900/80">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <span className="text-xs text-muted-foreground">Lade 3D-Globus...</span>
          </div>
        </div>
      )}

      {/* Overlay content */}
      <CardContent className="relative z-20 p-4 h-full flex flex-col justify-between pointer-events-none">
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary drop-shadow-lg" />
        </div>

        <div className="space-y-1">
          <div className="flex flex-col gap-0.5 text-[10px] font-mono text-white/70 drop-shadow-md">
            <span>LAT: {formatCoord(latitude, "lat")}</span>
            <span>LNG: {formatCoord(longitude, "lng")}</span>
          </div>
        </div>
      </CardContent>

      {/* Zoom button */}
      {latitude !== null && longitude !== null && !isLoading && !hasError && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute bottom-3 right-3 z-30 h-8 w-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 shadow-lg hover:bg-white/30 transition-all pointer-events-auto"
          onClick={isZoomedIn ? handleZoomOut : handleZoomIn}
        >
          {isZoomedIn ? (
            <ZoomOut className="h-4 w-4 text-white drop-shadow-md" />
          ) : (
            <ZoomIn className="h-4 w-4 text-white drop-shadow-md" />
          )}
        </Button>
      )}
    </Card>
  );
}
