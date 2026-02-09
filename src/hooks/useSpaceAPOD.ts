/**
 * useSpaceAPOD Hook
 * 
 * Fetches NASA's Astronomy Picture of the Day via Edge Function.
 * Implements 24h client-side caching.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface APOD {
  title: string;
  explanation: string;
  url: string | null;
  hdurl?: string;
  media_type: 'image' | 'video';
  date: string;
  copyright?: string;
  cached?: boolean;
  fallback?: boolean;
}

export function useSpaceAPOD() {
  return useQuery<APOD>({
    queryKey: ['nasa-apod'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('sot-nasa-apod');
      
      if (error) {
        console.error('APOD fetch error:', error);
        throw error;
      }
      
      return data as APOD;
    },
    staleTime: 1000 * 60 * 60 * 24, // 24h - APOD changes once daily
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24h
    retry: 2,
    retryDelay: 1000,
  });
}
