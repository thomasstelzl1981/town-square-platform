import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Types ──────────────────────────────────────────────────────────
interface ResearchRequest {
  intent: string;
  query: string;
  location?: string;
  radius_km?: number;
  filters?: {
    must_have_email?: boolean;
    min_rating?: number;
    industry?: string;
  };
  providers?: string[];
  max_results?: number;
  context?: {
    module?: string;
    reference_id?: string;
  };
  // Portal-specific params (intent: search_portals)
  portal_config?: {
    portal?: string; // immoscout24, immowelt, ebay_kleinanzeigen
    search_type?: string; // listings, brokers
    price_min?: number;
    price_max?: number;
    object_types?: string[];
  };
}

interface ContactResult {
  name: string;
  salutation: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  rating: number | null;
  reviews_count: number | null;
  confidence: number;
  sources: string[];
  source_refs: Record<string, unknown>;
}

// ── Provider helpers ───────────────────────────────────────────────

async function searchGooglePlaces(
  query: string,
  location: string | undefined,
  apiKey: string,
  maxResults: number
): Promise<ContactResult[]> {
  const textQuery = location ? `${query} in ${location}` : query;
  const url = `https://places.googleapis.com/v1/places:searchText`;

  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.googleMapsUri",
    },
    body: JSON.stringify({
      textQuery,
      maxResultCount: Math.min(maxResults, 20),
      languageCode: "de",
    }),
  });

  if (!resp.ok) {
    console.error("Google Places error:", resp.status, await resp.text());
    return [];
  }

  const data = await resp.json();
  const places = data.places || [];

  return places.map((p: any) => ({
    name: p.displayName?.text || "",
    salutation: null,
    first_name: null,
    last_name: null,
    email: null,
    phone: p.internationalPhoneNumber || p.nationalPhoneNumber || null,
    website: p.websiteUri || null,
    address: p.formattedAddress || null,
    rating: p.rating || null,
    reviews_count: p.userRatingCount || null,
    confidence: 60,
    sources: ["google_places"],
    source_refs: { google_maps_url: p.googleMapsUri || null },
  }));
}

async function searchApify(
  query: string,
  location: string | undefined,
  apiToken: string,
  maxResults: number
): Promise<ContactResult[]> {
  const searchQuery = location ? `${query} in ${location}` : query;

  // Use the Google Maps Scraper actor (compass/crawler-google-places)
  // timeout=45s to avoid edge function timeout
  const runUrl = `https://api.apify.com/v2/acts/compass~crawler-google-places/run-sync-get-dataset-items?token=${apiToken}&timeout=35`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 40000);

  try {
    const resp = await fetch(runUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        searchStringsArray: [searchQuery],
        maxCrawledPlacesPerSearch: Math.min(maxResults, 25),
        language: "de",
        deeperCityScrape: false,
        skipClosedPlaces: true,
      }),
    });

    clearTimeout(timeoutId);

    if (!resp.ok) {
      console.error("Apify error:", resp.status, await resp.text());
      return [];
    }

    const items: any[] = await resp.json();

    return items.map((item: any) => ({
      name: item.title || item.name || "",
      salutation: null,
      first_name: null,
      last_name: null,
      email: item.email || item.emails?.[0] || null,
      phone: item.phone || item.phoneUnformatted || null,
      website: item.website || item.url || null,
      address: item.address || item.street || null,
      rating: item.totalScore || item.rating || null,
      reviews_count: item.reviewsCount || null,
      confidence: item.email ? 85 : 65,
      sources: ["apify"],
      source_refs: {
        place_id: item.placeId || null,
        category: item.categoryName || null,
      },
    }));
  } catch (err) {
    clearTimeout(timeoutId);
    console.error("Apify timeout or error:", err);
    return [];
  }
}

// ── Apify Portal Scraper (ImmoScout24, Immowelt, etc.) ─────────────

async function searchApifyPortals(
  query: string,
  location: string | undefined,
  apiToken: string,
  maxResults: number,
  portalConfig?: ResearchRequest["portal_config"]
): Promise<ContactResult[]> {
  const portal = portalConfig?.portal || "immoscout24";
  const searchType = portalConfig?.search_type || "listings";

  // Use a general web scraper actor for portal scraping
  const runUrl = `https://api.apify.com/v2/acts/apify~web-scraper/run-sync-get-dataset-items?token=${apiToken}&timeout=55`;

  // Build the portal search URL
  let startUrl = "";
  const searchQuery = query ? encodeURIComponent(query) : "";
  const locationQuery = location ? encodeURIComponent(location) : "";

  if (portal === "immoscout24") {
    if (searchType === "brokers") {
      startUrl = `https://www.immobilienscout24.de/immobilienmakler/${locationQuery || "deutschland"}.html`;
    } else {
      startUrl = `https://www.immobilienscout24.de/Suche/de/${locationQuery || "deutschland"}/wohnung-kaufen?enteredFrom=result_list`;
    }
  } else if (portal === "immowelt") {
    startUrl = `https://www.immowelt.de/liste/${locationQuery || "deutschland"}/wohnungen/kaufen`;
  } else {
    startUrl = `https://www.kleinanzeigen.de/s-immobilien/${locationQuery || ""}/${searchQuery || "immobilien"}/k0c195`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 55000);

  try {
    const resp = await fetch(runUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        startUrls: [{ url: startUrl }],
        pageFunction: `async function pageFunction(context) {
          const { $, request } = context;
          const results = [];
          $('[data-item],.result-list-entry,.aditem').each((i, el) => {
            const $el = $(el);
            results.push({
              title: $el.find('h2, .result-title, [data-go-to-expose-id]').first().text().trim(),
              price: $el.find('[data-is-price], .result-price, .aditem-main--middle--price').first().text().trim(),
              address: $el.find('.result-address, .result-list-entry__address').first().text().trim(),
              url: $el.find('a[href*="/expose"], a[href*="/anzeige"]').first().attr('href'),
              broker: $el.find('.result-list-entry__brand-name, .broker-name').first().text().trim(),
              phone: $el.find('[data-phone], .phone-number').first().text().trim(),
              email: $el.find('a[href^="mailto:"]').first().attr('href')?.replace('mailto:', ''),
            });
          });
          return results.slice(0, ${maxResults});
        }`,
        maxPagesPerCrawl: 1,
        proxyConfiguration: { useApifyProxy: true },
      }),
    });

    clearTimeout(timeoutId);

    if (!resp.ok) {
      console.error("Apify portal error:", resp.status, await resp.text());
      return [];
    }

    const rawItems: any[] = await resp.json();
    // Flatten nested arrays from page function
    const items = rawItems.flat().filter(Boolean);

    return items.map((item: any, idx: number) => ({
      name: item.title || item.broker || `Ergebnis ${idx + 1}`,
      salutation: null,
      first_name: null,
      last_name: null,
      email: item.email || null,
      phone: item.phone || null,
      website: item.url
        ? item.url.startsWith("http")
          ? item.url
          : `https://www.immobilienscout24.de${item.url}`
        : null,
      address: item.address || null,
      rating: null,
      reviews_count: null,
      confidence: item.email ? 75 : 50,
      sources: ["apify_portal"],
      source_refs: {
        portal,
        search_type: searchType,
        price_raw: item.price || null,
        broker_name: item.broker || null,
      },
    }));
  } catch (err) {
    clearTimeout(timeoutId);
    console.error("Apify portal timeout or error:", err);
    return [];
  }
}

async function scrapeEmailsFirecrawl(
  websites: string[],
  apiKey: string
): Promise<Map<string, string>> {
  const emailMap = new Map<string, string>();
  const urlsToScrape = websites.filter(Boolean).slice(0, 10);

  const scrapePromises = urlsToScrape.map(async (url) => {
    try {
      const resp = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url,
          formats: ["markdown"],
          onlyMainContent: false,
          waitFor: 1000,
        }),
      });

      if (!resp.ok) return;

      const data = await resp.json();
      const markdown = data.data?.markdown || data.markdown || "";

      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const found = markdown.match(emailRegex);
      if (found && found.length > 0) {
        const validEmail = found.find(
          (e: string) =>
            !e.includes("example.com") &&
            !e.includes("sentry") &&
            !e.includes("webpack") &&
            !e.includes("@2x") &&
            !e.includes("wixpress")
        );
        if (validEmail) {
          emailMap.set(url, validEmail.toLowerCase());
        }
      }
    } catch (err) {
      console.error(`Firecrawl scrape error for ${url}:`, err);
    }
  });

  await Promise.all(scrapePromises);
  return emailMap;
}

// ── AI Merge & Score ───────────────────────────────────────────────

async function aiMergeAndScore(
  results: ContactResult[],
  intent: string,
  filters: ResearchRequest["filters"],
  lovableApiKey: string
): Promise<ContactResult[]> {
  if (results.length === 0) return [];

  const prompt = `Du bist ein Daten-Analyst. Deine Aufgabe: Zusammenführen und Bewerten von Firmenkontakten.

Intent: ${intent}
Filter: ${JSON.stringify(filters || {})}

Rohdaten (${results.length} Einträge):
${JSON.stringify(results, null, 2)}

Aufgaben:
1. Dedupliziere Einträge mit gleichem Firmennamen / gleicher Adresse
2. Merge Informationen aus verschiedenen Quellen (sources zusammenführen)
3. Vergib einen confidence-Score (0-100) basierend auf:
   - Vollständigkeit der Daten (Name, Email, Phone, Website, Adresse)
   - Anzahl der Quellen
   - Rating und Bewertungsanzahl
4. Sortiere nach confidence absteigend
5. Extrahiere wenn möglich den Ansprechpartner in separate Felder:
   - salutation: "Herr" oder "Frau" (aus Kontext ableiten, sonst null)
   - first_name: Vorname
   - last_name: Nachname
${filters?.must_have_email ? "6. Filtere Einträge OHNE E-Mail heraus" : ""}
${filters?.min_rating ? `6. Filtere Einträge mit Rating < ${filters.min_rating} heraus` : ""}

Antworte NUR mit dem JSON-Array der zusammengeführten Kontakte.`;

  try {
    const resp = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content:
                "Du gibst ausschließlich valides JSON zurück. Kein Markdown, keine Erklärungen.",
            },
            { role: "user", content: prompt },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "return_merged_contacts",
                description: "Return merged and scored contact list",
                parameters: {
                  type: "object",
                    properties: {
                      contacts: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            name: { type: "string" },
                            salutation: { type: "string", description: "Herr or Frau" },
                            first_name: { type: "string" },
                            last_name: { type: "string" },
                            email: { type: "string" },
                            phone: { type: "string" },
                            website: { type: "string" },
                            address: { type: "string" },
                            rating: { type: "number" },
                            reviews_count: { type: "number" },
                            confidence: { type: "number" },
                            sources: {
                              type: "array",
                              items: { type: "string" },
                            },
                          },
                          required: ["name", "confidence", "sources"],
                        },
                      },
                    },
                  required: ["contacts"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "return_merged_contacts" },
          },
        }),
      }
    );

    if (!resp.ok) {
      console.error("AI merge error:", resp.status, await resp.text());
      return deduplicateFallback(results, filters);
    }

    const data = await resp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return (parsed.contacts || []).map((c: any) => ({
        name: c.name || "",
        salutation: c.salutation || null,
        first_name: c.first_name || null,
        last_name: c.last_name || null,
        email: c.email || null,
        phone: c.phone || null,
        website: c.website || null,
        address: c.address || null,
        rating: c.rating || null,
        reviews_count: c.reviews_count || null,
        confidence: c.confidence || 50,
        sources: c.sources || [],
        source_refs: {},
      }));
    }

    return deduplicateFallback(results, filters);
  } catch (err) {
    console.error("AI merge exception:", err);
    return deduplicateFallback(results, filters);
  }
}

function deduplicateFallback(
  results: ContactResult[],
  filters?: ResearchRequest["filters"]
): ContactResult[] {
  const seen = new Map<string, ContactResult>();

  for (const r of results) {
    const key = r.name.toLowerCase().trim();
    const existing = seen.get(key);
    if (existing) {
      existing.email = existing.email || r.email;
      existing.phone = existing.phone || r.phone;
      existing.website = existing.website || r.website;
      existing.address = existing.address || r.address;
      existing.rating = existing.rating || r.rating;
      existing.reviews_count = existing.reviews_count || r.reviews_count;
      existing.salutation = existing.salutation || r.salutation;
      existing.first_name = existing.first_name || r.first_name;
      existing.last_name = existing.last_name || r.last_name;
      existing.sources = [...new Set([...existing.sources, ...r.sources])];
      existing.confidence = Math.min(
        100,
        existing.confidence + 10 * r.sources.length
      );
    } else {
      seen.set(key, { ...r });
    }
  }

  let merged = Array.from(seen.values());

  if (filters?.must_have_email) {
    merged = merged.filter((c) => c.email);
  }
  if (filters?.min_rating) {
    merged = merged.filter(
      (c) => !c.rating || c.rating >= (filters.min_rating || 0)
    );
  }

  return merged.sort((a, b) => b.confidence - a.confidence);
}

// ── Main handler ───────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const body: ResearchRequest = await req.json();
    const {
      intent = "find_companies",
      query,
      location,
      radius_km,
      filters,
      providers: requestedProviders,
      max_results = 20,
      context,
      portal_config,
    } = body;

    if (!query) {
      return new Response(
        JSON.stringify({ success: false, error: "query is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check available providers
    const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const APIFY_API_TOKEN = Deno.env.get("APIFY_API_TOKEN");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    const availableProviders: string[] = [];
    if (GOOGLE_MAPS_API_KEY) availableProviders.push("google_places");
    if (FIRECRAWL_API_KEY) availableProviders.push("firecrawl");
    if (APIFY_API_TOKEN) availableProviders.push("apify");

    // For portal search, only use apify
    const isPortalSearch = intent === "search_portals";

    // Determine which providers to use
    let activeProviders: string[];
    if (isPortalSearch) {
      activeProviders = APIFY_API_TOKEN ? ["apify"] : [];
    } else if (requestedProviders) {
      activeProviders = requestedProviders.filter((p) =>
        availableProviders.includes(p)
      );
    } else {
      activeProviders = availableProviders;
    }

    console.log(
      `Research Engine: intent=${intent}, query="${query}", location="${location}", providers=[${activeProviders.join(",")}]`
    );

    if (activeProviders.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: isPortalSearch
            ? "Apify API Token nicht konfiguriert. Portal-Suche benötigt Apify."
            : "No research providers available. Please configure at least one API key.",
          available_providers: availableProviders,
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── Phase 1: Parallel provider execution ───────────────────────
    const providerPromises: Promise<ContactResult[]>[] = [];
    const providersUsed: string[] = [];

    if (isPortalSearch && APIFY_API_TOKEN) {
      // Portal search mode — use dedicated portal scraper
      providersUsed.push("apify_portal");
      providerPromises.push(
        searchApifyPortals(
          query,
          location,
          APIFY_API_TOKEN,
          max_results,
          portal_config
        )
      );
    } else {
      // Standard contact/company search
      if (activeProviders.includes("google_places") && GOOGLE_MAPS_API_KEY) {
        providersUsed.push("google_places");
        providerPromises.push(
          searchGooglePlaces(query, location, GOOGLE_MAPS_API_KEY, max_results)
        );
      }

      if (activeProviders.includes("apify") && APIFY_API_TOKEN) {
        providersUsed.push("apify");
        providerPromises.push(
          searchApify(query, location, APIFY_API_TOKEN, max_results)
        );
      }
    }

    const providerResults = await Promise.all(providerPromises);
    let allResults: ContactResult[] = providerResults.flat();

    console.log(
      `Phase 1 complete: ${allResults.length} results from ${providersUsed.join(", ")}`
    );

    // ── Phase 2: Firecrawl email enrichment (with 15s hard limit) ─
    if (
      !isPortalSearch &&
      activeProviders.includes("firecrawl") &&
      FIRECRAWL_API_KEY
    ) {
      providersUsed.push("firecrawl");
      const websitesToScrape = allResults
        .filter((r) => r.website && !r.email)
        .map((r) => r.website!)
        .slice(0, 10);

      if (websitesToScrape.length > 0) {
        console.log(
          `Phase 2: Scraping ${websitesToScrape.length} websites for emails (25s limit)`
        );

        // Wrap Phase 2 in a 25s timeout — better partial results than no response
        const phase2Promise = scrapeEmailsFirecrawl(
          websitesToScrape,
          FIRECRAWL_API_KEY
        );
        const timeoutPromise = new Promise<Map<string, string>>((resolve) =>
          setTimeout(() => {
            console.warn("Phase 2 hit 25s timeout — returning partial results");
            resolve(new Map());
          }, 25000)
        );

        const emailMap = await Promise.race([phase2Promise, timeoutPromise]);

        for (const result of allResults) {
          if (!result.email && result.website && emailMap.has(result.website)) {
            result.email = emailMap.get(result.website)!;
            if (!result.sources.includes("firecrawl")) {
              result.sources.push("firecrawl");
            }
            result.confidence = Math.min(100, result.confidence + 15);
          }
        }

        console.log(`Phase 2 complete: ${emailMap.size} emails found`);
      }
    }

    // ── Phase 3: AI merge & score (skip for < 8 results) ──────────
    let finalResults: ContactResult[];

    if (LOVABLE_API_KEY && allResults.length >= 12) {
      console.log(`Phase 3: AI merge and scoring (${allResults.length} results)`);
      finalResults = await aiMergeAndScore(
        allResults,
        intent,
        filters,
        LOVABLE_API_KEY
      );
    } else {
      console.log(`Phase 3 skipped (${allResults.length} results < 12) — using fallback dedup`);
      finalResults = deduplicateFallback(allResults, filters);
    }

    // Limit results
    finalResults = finalResults.slice(0, max_results);

    const durationMs = Date.now() - startTime;

    console.log(
      `Research complete: ${finalResults.length} results in ${durationMs}ms`
    );

    return new Response(
      JSON.stringify({
        success: true,
        results: finalResults,
        meta: {
          providers_used: providersUsed,
          providers_available: availableProviders,
          total_found: finalResults.length,
          duration_ms: durationMs,
          intent,
          query,
          location: location || null,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Research engine error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
