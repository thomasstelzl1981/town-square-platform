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

export function useGeolocation() {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const [location, setLocation] = useState<GeolocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fallback function: use city from user profile
    const applyProfileFallback = () => {
      if (profile?.city) {
        setLocation({
          latitude: 48.0167,
          longitude: 11.5843,
          city: profile.city as string,
          altitude: null
        });
      } else {
        setError('Standort nicht verfügbar');
      }
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
