import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Headline {
  title: string;
  source: string;
  time: string;
  link: string;
}

/** @demo-data Fallback when edge function fails. Registered in demoDataRegistry.ts */
const DEMO_HEADLINES: Headline[] = [
  { title: 'EZB signalisiert weitere Zinssenkungen', source: 'Tagesschau', time: '2 Std.', link: '' },
  { title: 'Immobilienpreise stabilisieren sich', source: 'Tagesschau', time: '4 Std.', link: '' },
];

async function fetchNews(): Promise<Headline[]> {
  const { data, error } = await supabase.functions.invoke('sot-news-proxy');
  if (error || !Array.isArray(data) || data.length === 0) return DEMO_HEADLINES;
  return data;
}

export function useNewsData() {
  return useQuery({
    queryKey: ['system-news'],
    queryFn: fetchNews,
    staleTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
