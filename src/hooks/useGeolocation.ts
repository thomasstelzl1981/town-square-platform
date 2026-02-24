/**
 * useGeolocation Hook — Shared geolocation logic for Dashboard and SystemBar
 * Fetches user's current position and reverse geocodes to get city name
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

export interface GeolocationData {
  latitude: number;
  longitude: number;
  city: string;
  altitude: number | null;
}

/** Lookup table for known cities → coordinates */
const CITY_COORDINATES: Record<string, { lat: number; lon: number }> = {
  'München': { lat: 48.1351, lon: 11.5820 },
  'Muenchen': { lat: 48.1351, lon: 11.5820 },
  'Berlin': { lat: 52.5200, lon: 13.4050 },
  'Hamburg': { lat: 53.5511, lon: 9.9937 },
  'Ottobrunn': { lat: 48.0636, lon: 11.6653 },
  'Frankfurt': { lat: 50.1109, lon: 8.6821 },
  'Köln': { lat: 50.9375, lon: 6.9603 },
  'Stuttgart': { lat: 48.7758, lon: 9.1829 },
};

const DEFAULT_CITY = 'München';
const DEFAULT_COORDS = { lat: 48.1351, lon: 11.5820 };

function getCoordsForCity(city: string | null | undefined): { lat: number; lon: number; city: string } {
  if (city) {
    const coords = CITY_COORDINATES[city] || DEFAULT_COORDS;
    return { ...coords, city };
  }
  return { ...DEFAULT_COORDS, city: DEFAULT_CITY };
}

export function useGeolocation() {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const [location, setLocation] = useState<GeolocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fallback function: use city from user profile, or default to München
    const applyProfileFallback = () => {
      const { lat, lon, city } = getCoordsForCity(profile?.city as string | undefined);
      setLocation({
        latitude: lat,
        longitude: lon,
        city,
        altitude: null
      });
      setLoading(false);
    };

    // On mobile: always use profile fallback, never prompt for geolocation
    if (isMobile) {
      applyProfileFallback();
      return;
    }

    if (!navigator.geolocation) {
      applyProfileFallback();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, altitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'User-Agent': 'SystemOfATown/1.0' } }
          );
          const data = await response.json();
          const city = data.address?.city || 
                       data.address?.town || 
                       data.address?.village || 
                       data.address?.municipality || 
                       'Unbekannt';
          
          setLocation({ latitude, longitude, city, altitude: altitude ? Math.round(altitude) : null });
          setLoading(false);
        } catch (err) {
          console.error('Geocoding failed, using fallback:', err);
          applyProfileFallback();
        }
      },
      (geoError) => {
        const errorMessages: Record<number, string> = {
          1: 'Berechtigung verweigert',
          2: 'Position nicht verfügbar',
          3: 'Zeitüberschreitung',
        };
        setError(errorMessages[geoError.code] || 'Fehler');
        applyProfileFallback();
      },
      { 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  }, [profile?.city, isMobile]);

  const retry = () => {
    setLoading(true);
    setError(null);
    navigator.geolocation?.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, altitude } = position.coords;
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { 'User-Agent': 'SystemOfATown/1.0' } }
          );
          const data = await response.json();
          const city = data.address?.city || 
                       data.address?.town || 
                       data.address?.village || 
                       data.address?.municipality || 
                       'Unbekannt';
          setLocation({ latitude, longitude, city, altitude: altitude ? Math.round(altitude) : null });
          setLoading(false);
        } catch {
          setError('Geocoding fehlgeschlagen');
          setLoading(false);
        }
      },
      () => {
        setError('Berechtigung verweigert');
        setLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  return { location, loading, error, retry };
}
