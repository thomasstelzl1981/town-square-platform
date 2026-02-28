import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * sot-sitemap-generator — Generates XML sitemaps for each Zone 3 brand.
 * 
 * Usage: GET /sot-sitemap-generator?brand=sot
 * Valid brands: sot, kaufy, futureroom, acquiary, lennox
 * 
 * Returns XML sitemap with static routes from brand config.
 * Can be extended to include dynamic routes (exposés, partner profiles) via DB queries.
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/xml; charset=utf-8",
};

interface SitemapRoute {
  loc: string;
  changefreq: string;
  priority: string;
  lastmod?: string;
}

const BRAND_CONFIGS: Record<string, { domain: string; routes: SitemapRoute[] }> = {
  sot: {
    domain: "https://systemofatown.com",
    routes: [
      { loc: "/", changefreq: "weekly", priority: "1.0" },
      { loc: "/plattform", changefreq: "monthly", priority: "0.9" },
      { loc: "/intelligenz", changefreq: "monthly", priority: "0.8" },
      { loc: "/module", changefreq: "monthly", priority: "0.8" },
      { loc: "/preise", changefreq: "monthly", priority: "0.8" },
      { loc: "/demo", changefreq: "monthly", priority: "0.7" },
      { loc: "/karriere", changefreq: "monthly", priority: "0.5" },
      { loc: "/faq", changefreq: "monthly", priority: "0.7" },
      { loc: "/loesungen/mietsonderverwaltung", changefreq: "monthly", priority: "0.9" },
      { loc: "/loesungen/immobilienverwaltung", changefreq: "monthly", priority: "0.9" },
      { loc: "/loesungen/finanzdienstleistungen", changefreq: "monthly", priority: "0.9" },
      { loc: "/ratgeber/mietsonderverwaltung-vs-weg", changefreq: "monthly", priority: "0.7" },
      { loc: "/ratgeber/nebenkostenabrechnung-vermieter", changefreq: "monthly", priority: "0.7" },
      { loc: "/ratgeber/hausverwaltung-wechseln", changefreq: "monthly", priority: "0.7" },
      { loc: "/ratgeber/immobilien-portfolioanalyse", changefreq: "monthly", priority: "0.7" },
      { loc: "/ratgeber/immobilienfinanzierung-kapitalanleger", changefreq: "monthly", priority: "0.7" },
      { loc: "/ratgeber/renditeberechnung-immobilien", changefreq: "monthly", priority: "0.7" },
      { loc: "/impressum", changefreq: "yearly", priority: "0.3" },
      { loc: "/datenschutz", changefreq: "yearly", priority: "0.3" },
    ],
  },
  kaufy: {
    domain: "https://kaufy.immo",
    routes: [
      { loc: "/", changefreq: "weekly", priority: "1.0" },
      { loc: "/vermieter", changefreq: "monthly", priority: "0.9" },
      { loc: "/verkaeufer", changefreq: "monthly", priority: "0.9" },
      { loc: "/vertrieb", changefreq: "monthly", priority: "0.8" },
      { loc: "/kontakt", changefreq: "monthly", priority: "0.6" },
      { loc: "/ratgeber", changefreq: "weekly", priority: "0.7" },
      { loc: "/faq", changefreq: "monthly", priority: "0.7" },
      { loc: "/impressum", changefreq: "yearly", priority: "0.3" },
      { loc: "/datenschutz", changefreq: "yearly", priority: "0.3" },
    ],
  },
  futureroom: {
    domain: "https://futureroom.online",
    routes: [
      { loc: "/", changefreq: "weekly", priority: "1.0" },
      { loc: "/bonitat", changefreq: "monthly", priority: "0.8" },
      { loc: "/kontakt", changefreq: "monthly", priority: "0.6" },
      { loc: "/karriere", changefreq: "monthly", priority: "0.5" },
      { loc: "/ratgeber", changefreq: "weekly", priority: "0.7" },
      { loc: "/faq", changefreq: "monthly", priority: "0.7" },
      { loc: "/impressum", changefreq: "yearly", priority: "0.3" },
      { loc: "/datenschutz", changefreq: "yearly", priority: "0.3" },
    ],
  },
  acquiary: {
    domain: "https://acquiary.com",
    routes: [
      { loc: "/", changefreq: "weekly", priority: "1.0" },
      { loc: "/methodik", changefreq: "monthly", priority: "0.9" },
      { loc: "/netzwerk", changefreq: "monthly", priority: "0.8" },
      { loc: "/karriere", changefreq: "monthly", priority: "0.5" },
      { loc: "/objekt", changefreq: "monthly", priority: "0.8" },
      { loc: "/kontakt", changefreq: "monthly", priority: "0.6" },
      { loc: "/ratgeber", changefreq: "weekly", priority: "0.7" },
      { loc: "/faq", changefreq: "monthly", priority: "0.7" },
      { loc: "/impressum", changefreq: "yearly", priority: "0.3" },
      { loc: "/datenschutz", changefreq: "yearly", priority: "0.3" },
    ],
  },
  lennox: {
    domain: "https://lennoxandfriends.app",
    routes: [
      { loc: "/", changefreq: "weekly", priority: "1.0" },
      { loc: "/shop", changefreq: "weekly", priority: "0.8" },
      { loc: "/partner-werden", changefreq: "monthly", priority: "0.7" },
      { loc: "/kontakt", changefreq: "monthly", priority: "0.6" },
      { loc: "/ratgeber", changefreq: "weekly", priority: "0.7" },
      { loc: "/faq", changefreq: "monthly", priority: "0.7" },
      { loc: "/impressum", changefreq: "yearly", priority: "0.3" },
      { loc: "/datenschutz", changefreq: "yearly", priority: "0.3" },
    ],
  },
  ncore: {
    domain: "https://ncore.online",
    routes: [
      { loc: "/", changefreq: "weekly", priority: "1.0" },
      { loc: "/geschaeftsmodelle", changefreq: "monthly", priority: "0.9" },
      { loc: "/digitalisierung", changefreq: "monthly", priority: "0.8" },
      { loc: "/stiftungen", changefreq: "monthly", priority: "0.8" },
      { loc: "/gruender", changefreq: "monthly", priority: "0.7" },
      { loc: "/netzwerk", changefreq: "monthly", priority: "0.7" },
      { loc: "/kontakt", changefreq: "monthly", priority: "0.6" },
      { loc: "/ratgeber", changefreq: "weekly", priority: "0.7" },
      { loc: "/impressum", changefreq: "yearly", priority: "0.3" },
      { loc: "/datenschutz", changefreq: "yearly", priority: "0.3" },
    ],
  },
  otto: {
    domain: "https://otto2advisory.com",
    routes: [
      { loc: "/", changefreq: "weekly", priority: "1.0" },
      { loc: "/unternehmer", changefreq: "monthly", priority: "0.9" },
      { loc: "/private-haushalte", changefreq: "monthly", priority: "0.9" },
      { loc: "/finanzierung", changefreq: "monthly", priority: "0.8" },
      { loc: "/faq", changefreq: "monthly", priority: "0.7" },
      { loc: "/kontakt", changefreq: "monthly", priority: "0.6" },
      { loc: "/ratgeber", changefreq: "weekly", priority: "0.7" },
      { loc: "/impressum", changefreq: "yearly", priority: "0.3" },
      { loc: "/datenschutz", changefreq: "yearly", priority: "0.3" },
    ],
  },
  zlwohnbau: {
    domain: "https://zl-wohnbau.de",
    routes: [
      { loc: "/", changefreq: "weekly", priority: "1.0" },
      { loc: "/leistungen", changefreq: "monthly", priority: "0.9" },
      { loc: "/portfolio", changefreq: "monthly", priority: "0.9" },
      { loc: "/kontakt", changefreq: "monthly", priority: "0.6" },
      { loc: "/ratgeber", changefreq: "weekly", priority: "0.7" },
      { loc: "/impressum", changefreq: "yearly", priority: "0.3" },
      { loc: "/datenschutz", changefreq: "yearly", priority: "0.3" },
    ],
  },
};

function buildSitemapXML(domain: string, routes: SitemapRoute[]): string {
  const today = new Date().toISOString().split("T")[0];
  const urls = routes
    .map(
      (r) => `  <url>
    <loc>${domain}${r.loc}</loc>
    <lastmod>${r.lastmod || today}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const url = new URL(req.url);
  const brand = url.searchParams.get("brand");

  if (!brand || !BRAND_CONFIGS[brand]) {
    return new Response(
      JSON.stringify({ error: "Invalid brand. Use: sot, kaufy, futureroom, acquiary, lennox, ncore, otto, zlwohnbau" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const config = BRAND_CONFIGS[brand];
  const xml = buildSitemapXML(config.domain, config.routes);

  return new Response(xml, {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      "Cache-Control": "public, max-age=3600",
    },
  });
});
