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
  if (n >= 1000) return n.toLocaleString('de-DE', { maximumFractionDigits: 0 });
  return n.toFixed(decimals);
}

function trendOf(change: number): 'up' | 'down' | 'neutral' {
  if (change > 0.05) return 'up';
  if (change < -0.05) return 'down';
  return 'neutral';
}

function changeStr(ch: number): string {
  return `${ch >= 0 ? '+' : ''}${ch.toFixed(1)}%`;
}

async function fetchYahoo(symbol: string, label: string): Promise<MarketItem | null> {
  try {
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1d`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    if (!meta) return null;
    const price = meta.regularMarketPrice ?? 0;
    const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
    const ch = prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0;
    return {
      symbol: label,
      value: fmt(price, price >= 1000 ? 0 : 2),
      change: changeStr(ch),
      trend: trendOf(ch),
    };
  } catch {
    return null;
  }
}

async function fetchData(): Promise<MarketItem[]> {
  const results: MarketItem[] = [];

  // Parallel fetch: Yahoo (MSCI World via URTH, DAX) + CoinGecko + Frankfurter
  const [msci, dax, cgRes, fxRes, goldRes] = await Promise.allSettled([
    fetchYahoo('URTH', 'MSCI World'),
    fetchYahoo('%5EGDAXI', 'DAX'),
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=eur&include_24hr_change=true'),
    fetch('https://api.frankfurter.app/latest?from=EUR&to=USD'),
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether-gold&vs_currencies=eur&include_24hr_change=true'),
  ]);

  // MSCI World
  if (msci.status === 'fulfilled' && msci.value) results.push(msci.value);
  // DAX
  if (dax.status === 'fulfilled' && dax.value) results.push(dax.value);

  // Gold
  try {
    if (goldRes.status === 'fulfilled' && goldRes.value.ok) {
      const g = await goldRes.value.json();
      const tg = g['tether-gold'];
      if (tg) {
        const ch = tg.eur_24h_change ?? 0;
        results.push({ symbol: 'Gold', value: fmt(tg.eur, 0), change: changeStr(ch), trend: trendOf(ch) });
      }
    }
  } catch { /* */ }

  // BTC + ETH
  try {
    if (cgRes.status === 'fulfilled' && cgRes.value.ok) {
      const cg = await cgRes.value.json();
      if (cg.bitcoin) {
        const ch = cg.bitcoin.eur_24h_change ?? 0;
        results.push({ symbol: 'BTC', value: fmt(cg.bitcoin.eur, 0), change: changeStr(ch), trend: trendOf(ch) });
      }
      if (cg.ethereum) {
        const ch = cg.ethereum.eur_24h_change ?? 0;
        results.push({ symbol: 'ETH', value: fmt(cg.ethereum.eur, 0), change: changeStr(ch), trend: trendOf(ch) });
      }
    }
  } catch { /* */ }

  // EUR/USD
  try {
    if (fxRes.status === 'fulfilled' && fxRes.value.ok) {
      const fx = await fxRes.value.json();
      const rate = fx.rates?.USD;
      if (rate) {
        results.push({ symbol: 'EUR/USD', value: rate.toFixed(4), change: '—', trend: 'neutral' });
      }
    }
  } catch { /* */ }

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
