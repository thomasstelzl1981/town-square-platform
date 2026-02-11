import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface MarketItem {
  symbol: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
}

let cache: { data: MarketItem[]; ts: number } | null = null;
const CACHE_MS = 30 * 60 * 1000;

function fmt(n: number, decimals = 2): string {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return n.toFixed(decimals);
}

function trendOf(change: number): 'up' | 'down' | 'neutral' {
  if (change > 0.05) return 'up';
  if (change < -0.05) return 'down';
  return 'neutral';
}

async function fetchData(): Promise<MarketItem[]> {
  const results: MarketItem[] = [];

  // CoinGecko: BTC + ETH
  try {
    const cgRes = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=eur&include_24hr_change=true'
    );
    if (cgRes.ok) {
      const cg = await cgRes.json();
      if (cg.bitcoin) {
        const ch = cg.bitcoin.eur_24h_change ?? 0;
        results.push({ symbol: 'BTC', value: fmt(cg.bitcoin.eur, 0), change: `${ch >= 0 ? '+' : ''}${ch.toFixed(1)}%`, trend: trendOf(ch) });
      }
      if (cg.ethereum) {
        const ch = cg.ethereum.eur_24h_change ?? 0;
        results.push({ symbol: 'ETH', value: fmt(cg.ethereum.eur, 0), change: `${ch >= 0 ? '+' : ''}${ch.toFixed(1)}%`, trend: trendOf(ch) });
      }
    }
  } catch { /* fallback */ }

  // ECB Frankfurter API: EUR/USD
  try {
    const fxRes = await fetch('https://api.frankfurter.app/latest?from=EUR&to=USD');
    if (fxRes.ok) {
      const fx = await fxRes.json();
      const rate = fx.rates?.USD;
      if (rate) {
        results.push({ symbol: 'EUR/USD', value: rate.toFixed(4), change: '—', trend: 'neutral' });
      }
    }
  } catch { /* fallback */ }

  // Gold via Frankfurter (XAU not supported there), use CoinGecko commodity fallback
  try {
    const goldRes = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=tether-gold&vs_currencies=eur&include_24hr_change=true'
    );
    if (goldRes.ok) {
      const g = await goldRes.json();
      const tg = g['tether-gold'];
      if (tg) {
        const ch = tg.eur_24h_change ?? 0;
        results.push({ symbol: 'Gold', value: fmt(tg.eur, 0), change: `${ch >= 0 ? '+' : ''}${ch.toFixed(1)}%`, trend: trendOf(ch) });
      }
    }
  } catch { /* fallback */ }

  return results;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (cache && Date.now() - cache.ts < CACHE_MS) {
      return new Response(JSON.stringify(cache.data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const data = await fetchData();
    if (data.length > 0) {
      cache = { data, ts: Date.now() };
    }

    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
