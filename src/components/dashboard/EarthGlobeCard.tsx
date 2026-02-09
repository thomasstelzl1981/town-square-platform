/**
 * EarthGlobeCard — Google Maps 3D Globe with CSS Fallback
 *
 * Notes:
 * - We resolve the API key at runtime to avoid Vite build-time env caching.
 * - Uses the official `google.maps.importLibrary('maps3d')` API.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Globe, Loader2, ZoomIn } from "lucide-react";
import { CSSGlobeFallback } from "@/components/dashboard/earth-globe/CSSGlobeFallback";
import { getGoogleMapsApiKey } from "@/components/dashboard/earth-globe/getGoogleMapsApiKey";

declare global {
  interface Window {
    // Google Maps JS injects this at runtime
    google?: any;
  }
}

interface EarthGlobeCardProps {
  latitude: number | null;
  longitude: number | null;
  city?: string;
}

const GOOGLE_SCRIPT_ATTR = "data-google-maps-js";

async function loadGoogleMapsJs(apiKey: string): Promise<void> {
  // If already loaded
  if (window.google?.maps?.importLibrary) return;

  // If script already present
  const existing = document.querySelector<HTMLScriptElement>(
    `script[${GOOGLE_SCRIPT_ATTR}]`,
  );
  if (existing) {
    await new Promise<void>((resolve, reject) => {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Script laden fehlgeschlagen")));
    });
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.setAttribute(GOOGLE_SCRIPT_ATTR, "true");
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=alpha`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps Script konnte nicht geladen werden"));
    document.head.appendChild(script);
  });
}

export function EarthGlobeCard({ latitude, longitude, city }: EarthGlobeCardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isZoomedIn, setIsZoomedIn] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  const startRotation = useCallback(() => {
    const map = mapRef.current;
    if (!map || isZoomedIn) return;

    try {
      const camera = {
        center: { lat: 0, lng: 0, altitude: 0 },
        range: 25_000_000,
        tilt: 0,
        heading: 0,
      };

      map.flyCameraAround({
        camera,
        durationMillis: 120_000,
        repeatCount: 1_000_000,
      });
    } catch (e) {
      console.warn("Rotation konnte nicht gestartet werden:", e);
    }
  }, [isZoomedIn]);

  const handleZoomIn = useCallback(() => {
    const map = mapRef.current;
    console.log('handleZoomIn called', { map: !!map, latitude, longitude });
    
    if (!map) {
      console.warn('Map not ready for zoom');
      return;
    }
    
    if (latitude === null || longitude === null) {
      console.warn('No coordinates available for zoom', { latitude, longitude });
      return;
    }

    try {
      map.stopCameraAnimation?.();
      setIsZoomedIn(true);

      console.log('Flying to coordinates:', { latitude, longitude });
      map.flyCameraTo({
        endCamera: {
          center: { lat: latitude, lng: longitude, altitude: 0 },
          range: 500,
          tilt: 55,
          heading: 0,
        },
        durationMillis: 5000,
      });
    } catch (e) {
      console.warn("Zoom fehlgeschlagen:", e);
    }
  }, [latitude, longitude]);

  const handleZoomOut = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    try {
      map.stopCameraAnimation?.();
      setIsZoomedIn(false);

      map.flyCameraTo({
        endCamera: {
          center: { lat: 0, lng: 0, altitude: 0 },
          range: 25_000_000,
          tilt: 0,
          heading: 0,
        },
        durationMillis: 3000,
      });

      setTimeout(() => startRotation(), 3500);
    } catch (e) {
      console.warn("Zoom-out fehlgeschlagen:", e);
    }
  }, [startRotation]);

  const init = useCallback(async () => {
    if (!containerRef.current) return;

    // maps3d ist (Stand heute) nicht zuverlässig in allen Browsern verfügbar (insb. Safari).
    // In diesen Fällen schalten wir sauber auf den CSS-Fallback, statt „grau“ zu bleiben.
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    const isSafari = /safari/i.test(ua) && !/chrome|crios|android/i.test(ua);

    if (isSafari) {
      setApiError("3D-Globus ist in Safari aktuell nicht unterstützt – Fallback aktiv.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setApiError(null);

      const apiKey = await getGoogleMapsApiKey();
      await loadGoogleMapsJs(apiKey);

      if (!window.google?.maps?.importLibrary) {
        throw new Error("Google Maps Library Loader nicht verfügbar");
      }

      const lib: any = await window.google.maps.importLibrary("maps3d");
      const Map3DElement = lib?.Map3DElement;
      const MapMode = lib?.MapMode;

      if (!Map3DElement) {
        throw new Error("Map3DElement nicht verfügbar (maps3d)");
      }

      const map = new Map3DElement({
        center: { lat: 0, lng: 0, altitude: 0 },
        range: 25_000_000,
        tilt: 0,
        heading: 0,
        gestureHandling: "COOPERATIVE",
      });

      // Mode must be set for rendering to start
      map.mode = MapMode?.SATELLITE ?? "SATELLITE";

      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(map);
      mapRef.current = map;

      setIsLoading(false);
      startRotation();
    } catch (err) {
      console.error("Google Maps 3D Fehler:", err);
      setApiError(err instanceof Error ? err.message : "Unbekannter Fehler");
      setIsLoading(false);
    }
  }, [startRotation]);

  useEffect(() => {
    init();

    return () => {
      try {
        mapRef.current?.stopCameraAnimation?.();
      } catch {
        // ignore
      }
    };
  }, [init]);

  const formatCoord = (value: number | null, type: "lat" | "lng") => {
    if (value === null) return "--";
    const abs = Math.abs(value);
    const dir = type === "lat" ? (value >= 0 ? "N" : "S") : value >= 0 ? "O" : "W";
    return `${abs.toFixed(4)}° ${dir}`;
  };

  return (
    <Card className="relative h-full aspect-square overflow-hidden border-primary/20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* 3D Map Container */}
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {/* CSS Fallback when API fails */}
      {apiError && <CSSGlobeFallback />}

      {/* Loading */}
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
        <div className="absolute top-2 left-2 z-30 flex items-start gap-1 px-2 py-1 rounded-md bg-yellow-500/20 backdrop-blur-sm max-w-[85%]">
          <AlertCircle className="h-3 w-3 text-yellow-500 mt-0.5" />
          <div className="min-w-0">
            <div className="text-[9px] text-yellow-500 leading-tight">Fallback-Modus</div>
            <div className="text-[9px] text-yellow-500/90 leading-tight break-words">
              {apiError}
            </div>
          </div>
        </div>
      )}

      {/* Overlay content - minimal, only coordinates */}
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
      {latitude !== null && longitude !== null && !isLoading && !apiError && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute bottom-3 right-3 z-30 h-8 w-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30 shadow-lg hover:bg-white/30 transition-all pointer-events-auto"
          onClick={isZoomedIn ? handleZoomOut : handleZoomIn}
        >
          <ZoomIn className="h-4 w-4 text-white drop-shadow-md" />
        </Button>
      )}
    </Card>
  );
}
