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

// ── IHK Vermittlerregister Scraper (Apify web-scraper) ─────────────

async function scrapeIhkRegister(
  apiToken: string,
  plzPrefix: string,
  erlaubnisTyp: string
): Promise<ContactResult[]> {
  const searchUrl = `https://www.vermittlerregister.info/recherche?a=suche&plz=${plzPrefix}&erlaubnis=${erlaubnisTyp}`;

  const runUrl = `https://api.apify.com/v2/acts/apify~web-scraper/run-sync-get-dataset-items?token=${apiToken}&timeout=45`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 50000);

  try {
    const resp = await fetch(runUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        startUrls: [{ url: searchUrl }],
        pageFunction: `async function pageFunction(context) {
          const { $, request } = context;
          const results = [];
          $('table.result-table tbody tr, table.searchresults tbody tr, .search-result-item').each((i, el) => {
            const $el = $(el);
            const cells = $el.find('td');
            if (cells.length >= 3) {
              results.push({
                name: cells.eq(0).text().trim(),
                registration_number: cells.eq(1).text().trim(),
                postal_code: cells.eq(2).text().trim().match(/\\d{5}/)?.[0] || '',
                city: cells.eq(2).text().trim().replace(/\\d{5}\\s*/, ''),
                erlaubnis: cells.length > 3 ? cells.eq(3).text().trim() : '${erlaubnisTyp}',
              });
            }
          });
          return results;
        }`,
        maxPagesPerCrawl: 3,
        proxyConfiguration: { useApifyProxy: true },
      }),
    });

    clearTimeout(timeoutId);

    if (!resp.ok) {
      console.error("IHK scrape error:", resp.status, await resp.text());
      return [];
    }

    const rawItems: any[] = await resp.json();
    const items = rawItems.flat().filter(Boolean);

    return items.map((item: any) => ({
      name: item.name || "",
      salutation: null,
      first_name: null,
      last_name: null,
      email: null,
      phone: null,
      website: null,
      address: item.postal_code && item.city ? `${item.postal_code} ${item.city}` : null,
      rating: null,
      reviews_count: null,
      confidence: 40,
      sources: ["ihk_register"],
      source_refs: {
        registration_number: item.registration_number || null,
        erlaubnis: item.erlaubnis || erlaubnisTyp,
        postal_code: item.postal_code || null,
      },
    }));
  } catch (err) {
    clearTimeout(timeoutId);
    console.error("IHK scrape timeout or error:", err);
    return [];
  }
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
          model: "google/gemini-2.5-pro",
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
    const body: ResearchRequest & {
      intent?: string;
      // strategy_step fields
      contact_id?: string;
      category_code?: string;
      tenant_id?: string;
      step_id?: string;
      contact_data?: Record<string, unknown>;
      ledger_id?: string;
    } = await req.json();

    const intent = body.intent || "find_companies";

    // ═══════════════════════════════════════════════════════════
    // NEW INTENT: strategy_step — execute a single research step
    // ═══════════════════════════════════════════════════════════
    if (intent === "strategy_step") {
      return await handleStrategyStep(body, startTime);
    }

    // ═══════════════════════════════════════════════════════════
    // EXISTING INTENTS: find_companies, search_contacts, search_portals
    // ═══════════════════════════════════════════════════════════
    const {
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

    // ── Phase 2: Firecrawl email enrichment (with 25s hard limit) ─
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

    // ── Phase 3: AI merge & score (skip for < 12 results) ──────────
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

// ═══════════════════════════════════════════════════════════════════
// strategy_step handler — executes a single category-aware step
// ═══════════════════════════════════════════════════════════════════

async function handleStrategyStep(
  body: {
    contact_id?: string;
    category_code?: string;
    tenant_id?: string;
    step_id?: string;
    contact_data?: Record<string, unknown>;
    ledger_id?: string;
    query?: string;
    location?: string;
    portal_config?: ResearchRequest["portal_config"];
  },
  startTime: number
): Promise<Response> {
  const { contact_id, category_code, tenant_id, step_id, contact_data, ledger_id } = body;

  if (!contact_id || !step_id || !tenant_id) {
    return new Response(
      JSON.stringify({ success: false, error: "contact_id, step_id, and tenant_id required for strategy_step" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
  const APIFY_API_TOKEN = Deno.env.get("APIFY_API_TOKEN");

  // Determine provider from step_id pattern
  let results: ContactResult[] = [];
  let costEur = 0;
  let fieldsFound: string[] = [];
  let provider = "unknown";

  const searchQuery = contact_data?.company_name as string || contact_data?.name as string || body.query || "";
  const location = contact_data?.city as string || body.location || "";

  try {
    // ── google_search / google_enrich / google_verify ──
    if (step_id.startsWith("google_") && GOOGLE_MAPS_API_KEY) {
      provider = "google_places";
      results = await searchGooglePlaces(searchQuery, location, GOOGLE_MAPS_API_KEY, 5);
      costEur = 0.003;
      if (results.length > 0) {
        const best = results[0];
        fieldsFound = [];
        if (best.phone) fieldsFound.push("phone");
        if (best.address) fieldsFound.push("address");
        if (best.website) fieldsFound.push("website");
        if (best.rating) fieldsFound.push("rating");
      }
    }

    // ── web_scrape (Firecrawl) ──
    else if (step_id === "web_scrape" && FIRECRAWL_API_KEY) {
      provider = "firecrawl";
      const websiteUrl = contact_data?.website_url as string || contact_data?.website as string;
      if (websiteUrl) {
        const emailMap = await scrapeEmailsFirecrawl([websiteUrl], FIRECRAWL_API_KEY);
        costEur = 0.005;
        if (emailMap.size > 0) {
          const email = emailMap.values().next().value;
          fieldsFound = ["email"];
          results = [{
            name: searchQuery,
            salutation: null, first_name: null, last_name: null,
            email: email || null, phone: null, website: websiteUrl, address: null,
            rating: null, reviews_count: null, confidence: 75,
            sources: ["firecrawl"], source_refs: {},
          }];
        }
      }
    }

    // ── portal_scrape (Apify) ──
    else if (step_id === "portal_scrape" && APIFY_API_TOKEN) {
      provider = "apify_portal";
      results = await searchApifyPortals(
        searchQuery, location, APIFY_API_TOKEN, 10,
        body.portal_config || { portal: "immoscout24", search_type: "brokers" }
      );
      costEur = 0.02;
      fieldsFound = results.length > 0 ? ["name", "address"] : [];
    }

    // ── ihk_scrape — Apify web-scraper against vermittlerregister.info ──
    else if (step_id === "ihk_scrape" && APIFY_API_TOKEN) {
      provider = "ihk_register";
      const erlaubnisTyp = (contact_data?.erlaubnis_typ as string) || "34d";
      const plzPrefix = (contact_data?.postal_code as string)?.slice(0, 2) || "";
      results = await scrapeIhkRegister(APIFY_API_TOKEN, plzPrefix, erlaubnisTyp);
      costEur = 0.02;
      fieldsFound = results.length > 0 ? ["name", "registration_number", "city", "postal_code"] : [];
    }

    // ── bafin_import — bulk registry, handled by sot-registry-import ──
    else if (step_id === "bafin_import") {
      provider = "bafin_csv";
      return new Response(
        JSON.stringify({
          success: true,
          step_id,
          provider,
          status: "deferred",
          message: "Step 'bafin_import' requires bulk registry import via sot-registry-import",
          redirect_to: "sot-registry-import",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── linkedin_scrape — Netrows (primary) with Apify fallback ──
    else if (step_id === "linkedin_scrape") {
      const NETROWS_API_KEY = Deno.env.get("NETROWS_API_KEY");
      const companyName = contact_data?.company_name as string || searchQuery;

      if (!companyName) {
        return new Response(
          JSON.stringify({
            success: true, step_id, provider: "none",
            status: "skipped",
            message: "No company_name available for LinkedIn scrape",
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // ── Try Netrows first (cheaper: ~0.005 EUR vs 0.01 EUR) ──
      if (NETROWS_API_KEY) {
        provider = "netrows";
        try {
          const nrHeaders = { "x-api-key": NETROWS_API_KEY };
          const nrBase = "https://api.netrows.com/api/v1";
          const companySlug = encodeURIComponent(companyName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));

          // Parallel: company details + employees
          const [detailsResp, employeesResp] = await Promise.all([
            fetch(`${nrBase}/companies/details?username=${companySlug}`, { headers: nrHeaders }),
            fetch(`${nrBase}/companies/employees?username=${companySlug}&count=3`, { headers: nrHeaders }),
          ]);

          costEur = 0.01; // 2 credits = 2 x 0.005

          const detailsOk = detailsResp.ok;
          const employeesOk = employeesResp.ok;

          let companyData: any = null;
          let employeesData: any = null;

          if (detailsOk) {
            const dBody = await detailsResp.json();
            companyData = dBody.data || dBody;
          } else {
            await detailsResp.text(); // consume body
          }

          if (employeesOk) {
            const eBody = await employeesResp.json();
            employeesData = eBody.data?.items || eBody.items || eBody.data || [];
          } else {
            await employeesResp.text(); // consume body
          }

          if (companyData || (Array.isArray(employeesData) && employeesData.length > 0)) {
            fieldsFound = [];
            if (companyData?.linkedinUrl || companyData?.url) fieldsFound.push("company_linkedin_url");
            if (companyData?.industry) fieldsFound.push("industry");
            if (companyData?.employeeCount || companyData?.size) fieldsFound.push("company_size");
            if (companyData?.website) fieldsFound.push("website");

            const topEmployee = Array.isArray(employeesData) && employeesData.length > 0 ? employeesData[0] : null;
            if (topEmployee) fieldsFound.push("contact_person");

            results = [{
              name: companyData?.name || companyName,
              salutation: null,
              first_name: topEmployee?.firstName || topEmployee?.first_name || null,
              last_name: topEmployee?.lastName || topEmployee?.last_name || null,
              email: null,
              phone: null,
              website: companyData?.website || null,
              address: companyData?.headquarter?.city
                ? `${companyData.headquarter.city}, ${companyData.headquarter.country || "DE"}`
                : companyData?.location || null,
              rating: null,
              reviews_count: null,
              confidence: 60,
              sources: ["netrows"],
              source_refs: {
                linkedin_url: companyData?.linkedinUrl || companyData?.url || null,
                industry: companyData?.industry || null,
                company_size: companyData?.employeeCount || companyData?.size || null,
                contact_person: topEmployee
                  ? `${topEmployee.firstName || topEmployee.first_name || ""} ${topEmployee.lastName || topEmployee.last_name || ""}`.trim()
                  : null,
                contact_title: topEmployee?.title || topEmployee?.headline || null,
                provider: "netrows",
              },
            }];

            console.log(`Netrows LinkedIn: found ${fieldsFound.length} fields for "${companyName}"`);
          } else {
            console.log(`Netrows: no data for "${companyName}", trying Apify fallback...`);
            // Fall through to Apify below
          }
        } catch (nrErr) {
          console.error("Netrows error:", nrErr);
          // Fall through to Apify fallback
        }
      }

      // ── Apify fallback (if Netrows unavailable or returned nothing) ──
      if (results.length === 0 && APIFY_API_TOKEN) {
        provider = "apify_linkedin";
        try {
          const runUrl = `https://api.apify.com/v2/acts/apify~linkedin-company-scraper/run-sync-get-dataset-items?token=${APIFY_API_TOKEN}&timeout=40`;
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 45000);

          const liResp = await fetch(runUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: controller.signal,
            body: JSON.stringify({
              queries: [companyName],
              maxResults: 3,
              proxy: { useApifyProxy: true },
            }),
          });

          clearTimeout(timeoutId);

          if (liResp.ok) {
            const liItems: any[] = await liResp.json();
            costEur = 0.01;

            if (liItems.length > 0) {
              const best = liItems[0];
              fieldsFound = [];
              if (best.linkedinUrl || best.url) fieldsFound.push("company_linkedin_url");
              if (best.employees?.length > 0) fieldsFound.push("contact_person");
              if (best.industry) fieldsFound.push("industry");
              if (best.size || best.employeeCount) fieldsFound.push("company_size");

              const topEmployee = best.employees?.[0];
              results = [{
                name: companyName,
                salutation: null,
                first_name: topEmployee?.firstName || null,
                last_name: topEmployee?.lastName || null,
                email: null,
                phone: null,
                website: best.website || null,
                address: best.headquarter?.city ? `${best.headquarter.city}, ${best.headquarter.country || "DE"}` : null,
                rating: null,
                reviews_count: null,
                confidence: 55,
                sources: ["apify_linkedin"],
                source_refs: {
                  linkedin_url: best.linkedinUrl || best.url || null,
                  industry: best.industry || null,
                  company_size: best.size || best.employeeCount || null,
                  contact_person: topEmployee ? `${topEmployee.firstName || ""} ${topEmployee.lastName || ""}`.trim() : null,
                  contact_title: topEmployee?.title || null,
                },
              }];
            }
          } else {
            const errText = await liResp.text();
            console.error("Apify LinkedIn fallback error:", liResp.status, errText);
          }
        } catch (liErr) {
          console.error("Apify LinkedIn fallback exception:", liErr);
        }
      }

      // ── Neither provider available ──
      if (results.length === 0 && !Deno.env.get("NETROWS_API_KEY") && !APIFY_API_TOKEN) {
        return new Response(
          JSON.stringify({
            success: true, step_id, provider: "none",
            status: "not_configured",
            message: "Neither NETROWS_API_KEY nor APIFY_API_TOKEN configured for LinkedIn scraping.",
            config_hint: {
              primary: { secret_name: "NETROWS_API_KEY", docs: "https://netrows.com/get-access" },
              fallback: { secret_name: "APIFY_API_TOKEN", docs: "https://console.apify.com/account/integrations" },
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    else {
      return new Response(
        JSON.stringify({
          success: false,
          error: `Unknown step_id '${step_id}' or required API key not configured`,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Update strategy ledger if ledger_id provided ──
    if (ledger_id) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
      const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

      // Fetch current ledger
      const { data: ledger } = await supabaseAdmin
        .from("contact_strategy_ledger")
        .select("steps_completed, steps_pending, total_cost_eur, data_gaps")
        .eq("id", ledger_id)
        .single();

      if (ledger) {
        const completedSteps = (ledger.steps_completed as any[]) || [];
        const pendingSteps = (ledger.steps_pending as any[]) || [];

        // Add completed step
        completedSteps.push({
          step: step_id,
          provider,
          executed_at: new Date().toISOString(),
          cost_eur: costEur,
          fields_found: fieldsFound,
          fields_missing: [],
          raw_confidence: results.length > 0 ? results[0].confidence : 0,
          results_count: results.length,
        });

        // Remove from pending
        const updatedPending = pendingSteps.filter((s: any) => s.step !== step_id);

        // Update data gaps
        const currentGaps = (ledger.data_gaps as string[]) || [];
        const updatedGaps = currentGaps.filter(g => !fieldsFound.includes(g));

        await supabaseAdmin
          .from("contact_strategy_ledger")
          .update({
            steps_completed: completedSteps,
            steps_pending: updatedPending,
            total_cost_eur: (Number(ledger.total_cost_eur) || 0) + costEur,
            data_gaps: updatedGaps,
            last_step_at: new Date().toISOString(),
            quality_score: Math.min(100, completedSteps.length * 25),
            updated_at: new Date().toISOString(),
          })
          .eq("id", ledger_id);
      }
    }

    const durationMs = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        intent: "strategy_step",
        step_id,
        provider,
        results_count: results.length,
        fields_found: fieldsFound,
        cost_eur: costEur,
        duration_ms: durationMs,
        results: results.slice(0, 5), // Return top 5 for inspection
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(`Strategy step '${step_id}' error:`, err);
    return new Response(
      JSON.stringify({
        success: false,
        step_id,
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
