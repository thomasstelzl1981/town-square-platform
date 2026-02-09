/**
 * useQuote Hook
 * 
 * Fetches the daily inspirational quote via Edge Function proxy.
 * Implements 24h client-side caching.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Quote {
  quote: string;
  author: string;
  cached?: boolean;
  fallback?: boolean;
}

export function useQuote() {
  return useQuery<Quote>({
    queryKey: ['daily-quote'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('sot-zenquotes-proxy');
      
      if (error) {
        console.error('Quote fetch error:', error);
        throw error;
      }
      
      return data as Quote;
    },
    staleTime: 1000 * 60 * 60 * 24, // 24h - don't refetch for a day
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24h
    retry: 2,
    retryDelay: 1000,
  });
}
