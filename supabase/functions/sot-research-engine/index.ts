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
}

interface ContactResult {
  name: string;
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
  const runUrl = `https://api.apify.com/v2/acts/compass~crawler-google-places/run-sync-get-dataset-items?token=${apiToken}&timeout=45`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 50000);

  try {
    const resp = await fetch(runUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        searchStringsArray: [searchQuery],
        maxCrawledPlacesPerSearch: Math.min(maxResults, 10),
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
          waitFor: 2000,
        }),
      });

      if (!resp.ok) return;

      const data = await resp.json();
      const markdown = data.data?.markdown || data.markdown || "";

      // Extract emails from content
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const found = markdown.match(emailRegex);
      if (found && found.length > 0) {
        // Filter out common non-contact emails
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
${filters?.must_have_email ? "5. Filtere Einträge OHNE E-Mail heraus" : ""}
${filters?.min_rating ? `5. Filtere Einträge mit Rating < ${filters.min_rating} heraus` : ""}

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
      // Fallback: simple dedup by name
      return deduplicateFallback(results, filters);
    }

    const data = await resp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return (parsed.contacts || []).map((c: any) => ({
        name: c.name || "",
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
      // Merge
      existing.email = existing.email || r.email;
      existing.phone = existing.phone || r.phone;
      existing.website = existing.website || r.website;
      existing.address = existing.address || r.address;
      existing.rating = existing.rating || r.rating;
      existing.reviews_count = existing.reviews_count || r.reviews_count;
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

    // Determine which providers to use
    const activeProviders = requestedProviders
      ? requestedProviders.filter((p) => availableProviders.includes(p))
      : availableProviders;

    console.log(
      `Research Engine: intent=${intent}, query="${query}", location="${location}", providers=[${activeProviders.join(",")}]`
    );

    if (activeProviders.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error:
            "No research providers available. Please configure at least one API key.",
          available_providers: [],
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

    const providerResults = await Promise.all(providerPromises);
    let allResults: ContactResult[] = providerResults.flat();

    console.log(
      `Phase 1 complete: ${allResults.length} results from ${providersUsed.join(", ")}`
    );

    // ── Phase 2: Firecrawl email enrichment ────────────────────────
    if (activeProviders.includes("firecrawl") && FIRECRAWL_API_KEY) {
      providersUsed.push("firecrawl");
      const websitesToScrape = allResults
        .filter((r) => r.website && !r.email)
        .map((r) => r.website!)
        .slice(0, 10);

      if (websitesToScrape.length > 0) {
        console.log(
          `Phase 2: Scraping ${websitesToScrape.length} websites for emails`
        );
        const emailMap = await scrapeEmailsFirecrawl(
          websitesToScrape,
          FIRECRAWL_API_KEY
        );

        // Enrich results with found emails
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

    // ── Phase 3: AI merge & score ──────────────────────────────────
    let finalResults: ContactResult[];

    if (LOVABLE_API_KEY && allResults.length > 0) {
      console.log("Phase 3: AI merge and scoring");
      finalResults = await aiMergeAndScore(
        allResults,
        intent,
        filters,
        LOVABLE_API_KEY
      );
    } else {
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
