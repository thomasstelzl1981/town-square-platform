import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MarketItem {
  symbol: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
}

/** @demo-data Fallback when edge function fails. Registered in demoDataRegistry.ts */
const DEMO_MARKETS: MarketItem[] = [
  { symbol: 'MSCI World', value: '4.487', change: '+0.3%', trend: 'up' },
  { symbol: 'DAX', value: '18.342', change: '-0.2%', trend: 'down' },
  { symbol: 'Gold', value: '2.341', change: '+0.5%', trend: 'up' },
  { symbol: 'BTC', value: '67.400', change: '+2.1%', trend: 'up' },
  { symbol: 'ETH', value: '3.200', change: '+1.4%', trend: 'up' },
  { symbol: 'EUR/USD', value: '1.0892', change: '—', trend: 'neutral' },
];

async function fetchFinance(): Promise<MarketItem[]> {
  const { data, error } = await supabase.functions.invoke('sot-finance-proxy');
  if (error || !Array.isArray(data) || data.length === 0) return DEMO_MARKETS;
  return data;
}

export function useFinanceData() {
  return useQuery({
    queryKey: ['system-finance'],
    queryFn: fetchFinance,
    staleTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
