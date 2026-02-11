import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface Headline {
  title: string;
  source: string;
  time: string;
  link: string;
}

let cache: { data: Headline[]; ts: number } | null = null;
const CACHE_MS = 60 * 60 * 1000;

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} Min.`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} Std.`;
  return `${Math.floor(hrs / 24)} T.`;
}

function extractItems(xml: string): Headline[] {
  const items: Headline[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  while ((match = itemRegex.exec(xml)) !== null && items.length < 5) {
    const block = match[1];
    const title = block.match(/<title><!\[CDATA\[(.*?)\]\]>|<title>(.*?)<\/title>/)?.[1] || block.match(/<title>(.*?)<\/title>/)?.[1] || '';
    const link = block.match(/<link>(.*?)<\/link>/)?.[1] || '';
    const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
    if (title) {
      items.push({ title: title.trim(), source: 'Tagesschau', time: pubDate ? timeAgo(pubDate) : '', link });
    }
  }
  return items;
}

async function fetchNews(): Promise<Headline[]> {
  const res = await fetch('https://www.tagesschau.de/xml/rss2_https/');
  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`);
  const xml = await res.text();
  return extractItems(xml);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (cache && Date.now() - cache.ts < CACHE_MS) {
      return new Response(JSON.stringify(cache.data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const data = await fetchNews();
    if (data.length > 0) {
      cache = { data, ts: Date.now() };
    }

    return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
