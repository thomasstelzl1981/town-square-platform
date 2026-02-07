/**
 * useGeolocation Hook — Shared geolocation logic for Dashboard and SystemBar
 * Fetches user's current position and reverse geocodes to get city name
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface GeolocationData {
  latitude: number;
  longitude: number;
  city: string;
  altitude: number | null;
}

export function useGeolocation() {
  const { profile } = useAuth();
  const [location, setLocation] = useState<GeolocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fallback function: use city from user profile
    const useProfileFallback = () => {
      if (profile?.city) {
        setLocation({
          latitude: 48.0167, // Default to Munich area if no coords
          longitude: 11.5843,
          city: profile.city as string,
          altitude: null
        });
        console.log('Geolocation Fallback: Using profile city', profile.city);
      } else {
        setError('Standort nicht verfügbar');
      }
      setLoading(false);
    };

    if (!navigator.geolocation) {
      useProfileFallback();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, altitude } = position.coords;
        console.log('Geolocation success:', { latitude, longitude, altitude });
        
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
          
          setLocation({
            latitude,
            longitude,
            city,
            altitude: altitude ? Math.round(altitude) : null
          });
          setLoading(false);
        } catch (err) {
          console.error('Geocoding failed, using fallback:', err);
          useProfileFallback();
        }
      },
      (geoError) => {
        // Detailed logging for debugging
        const errorMessages: Record<number, string> = {
          1: 'Berechtigung verweigert',
          2: 'Position nicht verfügbar',
          3: 'Zeitüberschreitung',
        };
        console.warn('Geolocation error:', errorMessages[geoError.code] || geoError.message);
        setError(errorMessages[geoError.code] || 'Fehler');
        useProfileFallback();
      },
      { 
        enableHighAccuracy: true,
        timeout: 10000,      // 10 second timeout
        maximumAge: 300000   // Cache for 5 minutes
      }
    );
  }, [profile?.city]);

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
