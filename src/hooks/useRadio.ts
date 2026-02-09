/**
 * useRadio Hook
 * 
 * Fetches internet radio stations from Radio Browser API.
 * No API key required, CORS-friendly.
 */

import { useQuery } from '@tanstack/react-query';
import { useState, useRef, useCallback } from 'react';

export interface RadioStation {
  stationuuid: string;
  name: string;
  url_resolved: string;
  favicon: string;
  country: string;
  countrycode: string;
  tags: string;
  codec: string;
  bitrate: number;
  votes: number;
}

// Fetch top-voted radio stations
export function useRadioStations(limit = 10) {
  return useQuery<RadioStation[]>({
    queryKey: ['radio-stations', limit],
    queryFn: async () => {
      // Radio Browser API - multiple servers available
      const servers = [
        'https://de1.api.radio-browser.info',
        'https://nl1.api.radio-browser.info',
        'https://at1.api.radio-browser.info',
      ];
      
      // Try servers in order
      for (const server of servers) {
        try {
          const response = await fetch(
            `${server}/json/stations/topvote/${limit}`,
            {
              headers: {
                'User-Agent': 'SOT-Dashboard/1.0',
              },
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            // Filter out stations without resolved URL
            return data.filter((s: RadioStation) => s.url_resolved);
          }
        } catch (e) {
          console.warn(`Radio Browser server ${server} failed:`, e);
          continue;
        }
      }
      
      throw new Error('All Radio Browser servers unavailable');
    },
    staleTime: 1000 * 60 * 60, // 1h cache
    gcTime: 1000 * 60 * 60 * 2, // Keep 2h
    retry: 2,
  });
}

// Audio player state management
export function useRadioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
  const [volume, setVolume] = useState(0.7);
  const [error, setError] = useState<string | null>(null);

  const play = useCallback((station: RadioStation) => {
    setError(null);
    setIsLoading(true);
    
    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }

    // Create new audio element
    const audio = new Audio();
    audio.volume = volume;
    audio.crossOrigin = 'anonymous';
    
    audio.oncanplay = () => {
      setIsLoading(false);
      setIsPlaying(true);
      audio.play().catch(e => {
        console.error('Playback error:', e);
        setError('Wiedergabe nicht möglich');
        setIsPlaying(false);
        setIsLoading(false);
      });
    };
    
    audio.onerror = () => {
      console.error('Audio load error');
      setError('Stream nicht verfügbar');
      setIsPlaying(false);
      setIsLoading(false);
    };

    audio.onended = () => {
      setIsPlaying(false);
    };

    audio.src = station.url_resolved;
    audioRef.current = audio;
    setCurrentStation(station);
  }, [volume]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setIsPlaying(false);
    setIsLoading(false);
    setCurrentStation(null);
  }, []);

  const togglePlay = useCallback((station: RadioStation) => {
    if (isPlaying && currentStation?.stationuuid === station.stationuuid) {
      stop();
    } else {
      play(station);
    }
  }, [isPlaying, currentStation, play, stop]);

  const updateVolume = useCallback((newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  }, []);

  return {
    isPlaying,
    isLoading,
    currentStation,
    volume,
    error,
    play,
    stop,
    togglePlay,
    updateVolume,
  };
}
