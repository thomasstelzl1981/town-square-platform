import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * SoT Valuation Engine V5.0 — 6-Stage Orchestrator
 *
 * Stages:
 *   0 — Preflight & Credit Gate (instant)
 *   1 — Intake + Document Extraction + Evidence Map (15-40s)
 *   2 — Normalization + Plausibility + Location Analysis (10-20s)
 *   3 — Portal Comps via Scraper (10-30s)
 *   4 — Deterministic Calc: Valuation + Financing + Lien + DSCR (5-15s)
 *   5 — Report Composer (10-20s)
 *
 * Credits: 20 per case (Premium)
 * Models: Gemini 2.5 Pro (PDF extraction), Gemini 2.5 Flash (narratives)
 * APIs: Google Maps (Geocode/Places/Routes/Static), Apify (Portal Scraper)
 */

const CREDITS_REQUIRED = 20;
const ACTION_CODE = "valuation_engine";
const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

// ─── Helpers ───

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function stageLog(stage: number, msg: string) {
  console.log(`[VALUATION][Stage ${stage}] ${msg}`);
}

// ─── Stage Timing Tracker ───

class StageTracker {
  private timings: Record<string, { start: number; end?: number; durationMs?: number }> = {};

  start(stage: number) {
    this.timings[`stage_${stage}`] = { start: Date.now() };
  }

  end(stage: number) {
    const entry = this.timings[`stage_${stage}`];
    if (entry) {
      entry.end = Date.now();
      entry.durationMs = entry.end - entry.start;
    }
  }

  toJSON() {
    return this.timings;
  }
}

// ─── AI Call Helper ───

async function callAI(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  tools?: any[],
  toolChoice?: any,
): Promise<any> {
  const body: any = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    stream: false,
  };

  if (tools) {
    body.tools = tools;
    body.tool_choice = toolChoice;
  }

  const resp = await fetch(AI_GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`AI Gateway error [${resp.status}]: ${errText}`);
  }

  const data = await resp.json();

  // Handle tool calls
  if (tools && data.choices?.[0]?.message?.tool_calls) {
    const toolCall = data.choices[0].message.tool_calls[0];
    return JSON.parse(toolCall.function.arguments);
  }

  return data.choices?.[0]?.message?.content ?? "";
}

// ─── Google Maps Helpers ───

async function googleGeocode(address: string, apiKey: string) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}&language=de&region=de`;
  const resp = await fetch(url);
  const data = await resp.json();
  if (data.status === "OK" && data.results?.[0]) {
    const r = data.results[0];
    return {
      lat: r.geometry.location.lat,
      lng: r.geometry.location.lng,
      formatted_address: r.formatted_address,
      place_id: r.place_id,
      quality: data.results[0].geometry.location_type,
    };
  }
  return null;
}

async function googlePlacesNearby(lat: number, lng: number, type: string, apiKey: string, radius = 1500) {
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${apiKey}&language=de`;
  const resp = await fetch(url);
  const data = await resp.json();
  return (data.results || []).slice(0, 3).map((p: any) => ({
    name: p.name,
    type: type,
    rating: p.rating,
    distance_m: Math.round(
      haversine(lat, lng, p.geometry.location.lat, p.geometry.location.lng)
    ),
    address: p.vicinity,
  }));
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function googleStaticMap(lat: number, lng: number, apiKey: string, zoom = 15, size = "600x400") {
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=${size}&markers=color:red|${lat},${lng}&key=${apiKey}&language=de`;
}

// ─── Main Handler ───

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
  const googleMapsKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
  const apifyToken = Deno.env.get("APIFY_API_TOKEN");

  if (!lovableApiKey) return json({ error: "LOVABLE_API_KEY not configured" }, 500);

  try {
    // ─── Auth ───
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    const sbUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await sbUser.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) return json({ error: "Unauthorized" }, 401);

    const userId = claimsData.claims.sub as string;

    const { data: profile } = await sbUser
      .from("profiles")
      .select("active_tenant_id")
      .eq("id", userId)
      .maybeSingle();

    if (!profile?.active_tenant_id) return json({ error: "No active tenant" }, 400);
    const tenantId = profile.active_tenant_id;

    const sbAdmin = createClient(supabaseUrl, serviceKey);
    const body = await req.json();
    const { action } = body;

    // ════════════════════════════════════════════
    // ACTION: preflight — Check costs & inputs
    // ════════════════════════════════════════════
    if (action === "preflight") {
      const { source_context, source_ref, documents, expose_url } = body;

      // Credit check
      const { data: creditData, error: creditErr } = await sbAdmin.rpc("rpc_credit_preflight", {
        p_tenant_id: tenantId,
        p_required_credits: CREDITS_REQUIRED,
        p_action_code: ACTION_CODE,
      });

      if (creditErr) {
        console.error("Credit preflight error:", creditErr);
        return json({ error: "Credit check failed" }, 500);
      }

      const docCount = documents?.length ?? 0;
      const hasUrl = !!expose_url;

      return json({
        credits_required: CREDITS_REQUIRED,
        credits_available: creditData?.available_credits ?? 0,
        can_proceed: creditData?.can_proceed ?? false,
        inputs_summary: {
          source_context: source_context || "ACQUIARY_TOOLS",
          source_ref,
          document_count: docCount,
          has_expose_url: hasUrl,
          estimated_pages: docCount * 6, // rough estimate
        },
        spending_guards: {
          max_documents: 20,
          max_pages: 120,
          max_retries: 2,
        },
        services_available: {
          google_maps: !!googleMapsKey,
          firecrawl: !!firecrawlKey,
          apify: !!apifyToken,
        },
      });
    }

    // ════════════════════════════════════════════
    // ACTION: run — Execute full 6-stage pipeline
    // ════════════════════════════════════════════
    if (action === "run") {
      const { source_context, source_ref, documents, expose_url, canonical_override, property_data } = body;
      const tracker = new StageTracker();

      // ─── Stage 0: Preflight + Credit Deduct ───
      tracker.start(0);
      stageLog(0, "Starting preflight & credit deduction");

      const { data: deductData, error: deductErr } = await sbAdmin.rpc("rpc_credit_deduct", {
        p_tenant_id: tenantId,
        p_credits: CREDITS_REQUIRED,
        p_action_code: ACTION_CODE,
        p_ref_type: "valuation_case",
        p_ref_id: null,
      });

      if (deductErr || !deductData) {
        stageLog(0, `Credit deduction failed: ${deductErr?.message}`);
        return json({ error: "Insufficient credits or deduction failed" }, 402);
      }

      // Create case record
      const { data: caseRow, error: caseErr } = await sbAdmin
        .from("valuation_cases")
        .insert({
          tenant_id: tenantId,
          source_context: source_context || "ACQUIARY_TOOLS",
          source_ref: source_ref || null,
          status: "running",
          credits_charged: CREDITS_REQUIRED,
          stage_current: 0,
          created_by: userId,
        })
        .select("id")
        .single();

      if (caseErr || !caseRow) {
        stageLog(0, `Case creation failed: ${caseErr?.message}`);
        return json({ error: "Failed to create valuation case" }, 500);
      }

      const caseId = caseRow.id;
      stageLog(0, `Case created: ${caseId}`);
      tracker.end(0);

      // Helper to update stage progress
      async function updateStage(stage: number) {
        await sbAdmin
          .from("valuation_cases")
          .update({ stage_current: stage, stage_timings: tracker.toJSON(), updated_at: new Date().toISOString() })
          .eq("id", caseId);
      }

      try {
        // ─── Stage 1: Intake + Extraction + Evidence Map ───
        tracker.start(1);
        stageLog(1, "Starting intake & extraction");
        await updateStage(1);

        let extractedFields: any[] = [];
        let evidenceMap: any[] = [];
        let missingFields: any[] = [];
        let rawText = "";

        // 1a: If expose URL provided, scrape it with Firecrawl
        if (expose_url && firecrawlKey) {
          stageLog(1, `Scraping expose URL: ${expose_url}`);
          try {
            const scrapeResp = await fetch("https://api.firecrawl.dev/v1/scrape", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${firecrawlKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                url: expose_url,
                formats: ["markdown"],
                onlyMainContent: true,
              }),
            });
            const scrapeData = await scrapeResp.json();
            rawText = scrapeData?.data?.markdown || scrapeData?.markdown || "";
            stageLog(1, `Scraped ${rawText.length} chars from URL`);
          } catch (e) {
            stageLog(1, `Firecrawl error: ${e}`);
          }
        }

        // 1b: If property_data provided (MOD-04 SSOT), use it directly
        if (property_data) {
          stageLog(1, "Using SSOT property data");
          rawText += `\n\nProperty SSOT Data:\n${JSON.stringify(property_data, null, 2)}`;
        }

        // 1c: Extract structured fields via AI
        if (rawText) {
          stageLog(1, "Extracting structured fields via AI");
          const extractionResult = await callAI(
            lovableApiKey!,
            "google/gemini-2.5-flash",
            `Du bist ein Immobilien-Datenextraktionssystem. Extrahiere alle verfügbaren Immobiliendaten aus dem gegebenen Text.
Gib die Daten als strukturiertes JSON zurück. Jedes Feld hat: field_name, value, unit, confidence (0-1), source.
Pflichtfelder: address, city, postal_code, object_type, living_area_sqm, rooms, year_built, asking_price, net_cold_rent_monthly.
Wenn ein Feld nicht gefunden wird, setze value=null und confidence=0.`,
            rawText.substring(0, 30000), // Token limit guard
            [
              {
                type: "function",
                function: {
                  name: "extract_property_data",
                  description: "Extract structured property data from text",
                  parameters: {
                    type: "object",
                    properties: {
                      extracted_fields: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            field_name: { type: "string" },
                            value: {},
                            unit: { type: "string" },
                            confidence: { type: "number" },
                            source: { type: "string" },
                          },
                          required: ["field_name", "value", "confidence"],
                        },
                      },
                      missing_critical_fields: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            field_name: { type: "string" },
                            critical: { type: "boolean" },
                            hint: { type: "string" },
                          },
                          required: ["field_name", "critical"],
                        },
                      },
                    },
                    required: ["extracted_fields", "missing_critical_fields"],
                  },
                },
              },
            ],
            { type: "function", function: { name: "extract_property_data" } },
          );

          extractedFields = extractionResult?.extracted_fields || [];
          missingFields = extractionResult?.missing_critical_fields || [];

          // Build evidence map
          evidenceMap = extractedFields
            .filter((f: any) => f.value !== null)
            .map((f: any) => ({
              field: f.field_name,
              value: f.value,
              source: f.source || "extracted",
              confidence: f.confidence,
            }));
        }

        // Apply canonical overrides from user
        if (canonical_override) {
          Object.entries(canonical_override).forEach(([key, val]) => {
            const existing = extractedFields.find((f: any) => f.field_name === key);
            if (existing) {
              existing.value = val;
              existing.confidence = 1.0;
              existing.source = "user_input";
            } else {
              extractedFields.push({ field_name: key, value: val, confidence: 1.0, source: "user_input" });
            }
          });
        }

        // Build canonical snapshot from extracted fields
        const snapshot: Record<string, any> = {};
        for (const f of extractedFields) {
          if (f.value !== null) {
            snapshot[f.field_name] = f.value;
          }
        }

        // Calculate data quality
        const criticalFields = ["address", "object_type", "living_area_sqm", "asking_price"];
        const filledCritical = criticalFields.filter((cf) => snapshot[cf] != null).length;
        const completeness = Math.round((filledCritical / criticalFields.length) * 100);
        const avgConfidence =
          extractedFields.length > 0
            ? extractedFields.reduce((sum: number, f: any) => sum + (f.confidence || 0), 0) / extractedFields.length
            : 0;

        const dataQuality = {
          completeness,
          critical_gaps: criticalFields.filter((cf) => snapshot[cf] == null),
          global_confidence: Math.round(avgConfidence * 100),
          total_fields: extractedFields.length,
          belegt: evidenceMap.length,
          missing: missingFields.length,
        };

        // Save inputs
        await sbAdmin.from("valuation_inputs").insert({
          case_id: caseId,
          canonical_snapshot: snapshot,
          extracted_fields: extractedFields,
          missing_fields: missingFields,
          assumptions: [],
          evidence_map: evidenceMap,
          data_quality: dataQuality,
        });

        tracker.end(1);
        stageLog(1, `Done. ${extractedFields.length} fields extracted, ${missingFields.length} missing`);

        // ─── Stage 2: Normalization + Location (Google) ───
        tracker.start(2);
        stageLog(2, "Starting normalization & location analysis");
        await updateStage(2);

        let locationAnalysis: any = { available: false };
        const address = snapshot.address || snapshot.city || "";

        if (address && googleMapsKey) {
          stageLog(2, `Geocoding: ${address}`);
          const geo = await googleGeocode(address, googleMapsKey);

          if (geo) {
            snapshot.lat = geo.lat;
            snapshot.lng = geo.lng;
            snapshot.formatted_address = geo.formatted_address;

            // POI searches (max 5 categories)
            const categories = [
              { type: "transit_station", label: "ÖPNV" },
              { type: "supermarket", label: "Alltag" },
              { type: "school", label: "Familie" },
              { type: "doctor", label: "Gesundheit" },
              { type: "park", label: "Freizeit" },
            ];

            const poiResults: any[] = [];
            for (const cat of categories) {
              try {
                const pois = await googlePlacesNearby(geo.lat, geo.lng, cat.type, googleMapsKey);
                poiResults.push({ category: cat.label, type: cat.type, pois });
              } catch (e) {
                stageLog(2, `Places error for ${cat.type}: ${e}`);
              }
            }

            // Static maps
            const microMap = await googleStaticMap(geo.lat, geo.lng, googleMapsKey, 16, "600x400");
            const macroMap = await googleStaticMap(geo.lat, geo.lng, googleMapsKey, 12, "600x400");

            // Calculate location scores
            const scoreByCategory = poiResults.map((cat) => {
              const avgDist = cat.pois.length > 0
                ? cat.pois.reduce((s: number, p: any) => s + p.distance_m, 0) / cat.pois.length
                : 5000;
              // Score: closer = higher (max 100)
              const score = Math.max(0, Math.min(100, Math.round(100 - (avgDist / 50))));
              return { dimension: cat.category, score, topPois: cat.pois, avgDistance: Math.round(avgDist) };
            });

            const globalScore = Math.round(
              scoreByCategory.reduce((s, c) => s + c.score, 0) / scoreByCategory.length
            );

            locationAnalysis = {
              available: true,
              geocode: geo,
              scores: scoreByCategory,
              global_score: globalScore,
              pois: poiResults,
              maps: { micro: microMap, macro: macroMap },
            };

            stageLog(2, `Location done. Score: ${globalScore}/100, ${poiResults.reduce((s, c) => s + c.pois.length, 0)} POIs`);
          }
        }

        // Generate location narrative via AI
        if (locationAnalysis.available) {
          try {
            const narrative = await callAI(
              lovableApiKey!,
              "google/gemini-2.5-flash-lite",
              "Du erstellst professionelle Standortanalysen für Immobilienbewertungen. Schreibe kurz, sachlich, faktenbasiert (max 150 Wörter). Nutze NUR die bereitgestellten Google-Daten, keine eigenen Behauptungen.",
              `Erstelle eine kurze Standortanalyse für: ${snapshot.formatted_address || address}\n\nStandort-Score: ${locationAnalysis.global_score}/100\nTop-POIs: ${JSON.stringify(locationAnalysis.scores)}\n\nBitte bewerte: Infrastruktur, Versorgung, Anbindung, Zielgruppe.`,
            );
            locationAnalysis.narrative = narrative;
          } catch (e) {
            stageLog(2, `Narrative generation error: ${e}`);
            locationAnalysis.narrative = null;
          }
        }

        tracker.end(2);

        // ─── Stage 3: Portal Comps ───
        tracker.start(3);
        stageLog(3, "Starting portal comps search");
        await updateStage(3);

        let compStats: any = { available: false };
        let compPostings: any[] = [];

        // Build comp query from snapshot
        const livingArea = Number(snapshot.living_area_sqm) || 0;
        const objectType = snapshot.object_type || "Wohnung";
        const city = snapshot.city || snapshot.postal_code || "";

        if (city && firecrawlKey) {
          stageLog(3, "Searching for comps via Firecrawl");
          try {
            const searchQuery = `${objectType} kaufen ${city} ${livingArea ? `ca. ${livingArea}m²` : ""}`;
            const searchResp = await fetch("https://api.firecrawl.dev/v1/search", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${firecrawlKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                query: searchQuery,
                limit: 20,
                lang: "de",
                country: "de",
                scrapeOptions: { formats: ["markdown"] },
              }),
            });

            const searchData = await searchResp.json();
            const rawResults = searchData?.data || [];

            // Extract comp data from search results via AI
            if (rawResults.length > 0) {
              const compTexts = rawResults
                .slice(0, 15)
                .map((r: any, i: number) => `[${i}] URL: ${r.url}\nTitle: ${r.title}\n${(r.markdown || "").substring(0, 1000)}`)
                .join("\n---\n");

              const compsExtracted = await callAI(
                lovableApiKey!,
                "google/gemini-2.5-flash",
                `Du extrahierst Vergleichsangebote (Comps) aus Immobilien-Suchergebnissen. Extrahiere pro Angebot: title, price (EUR), living_area_sqm, price_per_sqm, rooms, year_built, url. Ignoriere irrelevante Ergebnisse (Makler-Seiten ohne Objekte, Nachrichtenartikel etc.)`,
                compTexts,
                [
                  {
                    type: "function",
                    function: {
                      name: "extract_comps",
                      description: "Extract comparable property listings",
                      parameters: {
                        type: "object",
                        properties: {
                          postings: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                title: { type: "string" },
                                price: { type: "number" },
                                living_area_sqm: { type: "number" },
                                price_per_sqm: { type: "number" },
                                rooms: { type: "number" },
                                year_built: { type: "number" },
                                url: { type: "string" },
                              },
                              required: ["title"],
                            },
                          },
                        },
                        required: ["postings"],
                      },
                    },
                  },
                ],
                { type: "function", function: { name: "extract_comps" } },
              );

              compPostings = (compsExtracted?.postings || [])
                .filter((p: any) => p.price && p.price > 0)
                .map((p: any) => ({
                  ...p,
                  price_per_sqm: p.price_per_sqm || (p.living_area_sqm ? Math.round(p.price / p.living_area_sqm) : null),
                }));

              // Calculate comp stats
              if (compPostings.length > 0) {
                const prices = compPostings
                  .map((p: any) => p.price_per_sqm)
                  .filter((v: any) => v && v > 0)
                  .sort((a: number, b: number) => a - b);

                if (prices.length >= 3) {
                  compStats = {
                    available: true,
                    count_raw: rawResults.length,
                    count_valid: compPostings.length,
                    count_with_price_sqm: prices.length,
                    median_price_sqm: prices[Math.floor(prices.length / 2)],
                    p25: prices[Math.floor(prices.length * 0.25)],
                    p50: prices[Math.floor(prices.length * 0.5)],
                    p75: prices[Math.floor(prices.length * 0.75)],
                    min: prices[0],
                    max: prices[prices.length - 1],
                    search_query: searchQuery,
                  };
                }
              }

              stageLog(3, `Found ${compPostings.length} valid comps, ${compStats.count_with_price_sqm || 0} with €/m²`);
            }
          } catch (e) {
            stageLog(3, `Comp search error: ${e}`);
          }
        }

        tracker.end(3);

        // ─── Stage 4: Deterministic Calculations ───
        tracker.start(4);
        stageLog(4, "Running deterministic calculations");
        await updateStage(4);

        // Build assumptions
        const assumptions: any[] = [];

        // 4.1 Ertragswert
        let ertragswertResult: any = null;
        const netRent = Number(snapshot.net_cold_rent_monthly) || 0;
        const askingPrice = Number(snapshot.asking_price) || 0;

        if (netRent > 0) {
          const annualRent = netRent * 12;
          const bewirtschaftungRate = 0.25; // 25% operating costs assumption
          assumptions.push({ text: "Bewirtschaftungskosten 25% der Nettokaltmiete", impact: "high" });
          const netOperatingIncome = annualRent * (1 - bewirtschaftungRate);
          const capRate = 0.045; // 4.5% default
          assumptions.push({ text: "Kapitalisierungszinssatz 4,5%", impact: "high" });
          const ertragswert = Math.round(netOperatingIncome / capRate);

          ertragswertResult = {
            method: "ertragswert",
            value: ertragswert,
            confidence: netRent > 0 ? 0.7 : 0.3,
            params: {
              annual_rent: annualRent,
              bewirtschaftung_rate: bewirtschaftungRate,
              noi: netOperatingIncome,
              cap_rate: capRate,
              gross_yield: askingPrice > 0 ? Math.round((annualRent / askingPrice) * 10000) / 100 : null,
            },
          };
        }

        // 4.2 Comp Proxy
        let compProxyResult: any = null;
        if (compStats.available && livingArea > 0) {
          const compValue = Math.round(compStats.p50 * livingArea);
          compProxyResult = {
            method: "comp_proxy",
            value: compValue,
            confidence: compStats.count_with_price_sqm >= 5 ? 0.6 : 0.4,
            params: {
              median_price_sqm: compStats.p50,
              living_area: livingArea,
              comp_count: compStats.count_with_price_sqm,
            },
          };
        }

        // 4.3 Sachwert Proxy (simplified)
        let sachwertResult: any = null;
        if (livingArea > 0) {
          const yearBuilt = Number(snapshot.year_built) || 1980;
          const age = new Date().getFullYear() - yearBuilt;
          const baseCostSqm = 2500; // Simplified construction cost
          const depreciationRate = Math.min(age * 0.01, 0.5); // max 50% depreciation
          const sachwert = Math.round(livingArea * baseCostSqm * (1 - depreciationRate));
          assumptions.push({ text: `Herstellkosten ${baseCostSqm} €/m², Alterswertminderung ${Math.round(depreciationRate * 100)}%`, impact: "medium" });

          sachwertResult = {
            method: "sachwert_proxy",
            value: sachwert,
            confidence: 0.3,
            params: { base_cost_sqm: baseCostSqm, depreciation: depreciationRate, age },
          };
        }

        // 4.4 Fuse value band
        const methods = [ertragswertResult, compProxyResult, sachwertResult].filter(Boolean);
        let valueBand: any = { p25: 0, p50: 0, p75: 0, confidence: 0 };

        if (methods.length > 0) {
          // Weighted fusion
          const weights: Record<string, number> = { ertragswert: 0.5, comp_proxy: 0.35, sachwert_proxy: 0.15 };
          let totalWeight = 0;
          let weightedSum = 0;

          for (const m of methods) {
            const w = weights[m.method] || 0.1;
            weightedSum += m.value * w * m.confidence;
            totalWeight += w * m.confidence;
          }

          const p50 = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
          const spread = 0.1; // ±10% for band
          valueBand = {
            p25: Math.round(p50 * (1 - spread)),
            p50,
            p75: Math.round(p50 * (1 + spread)),
            confidence: Math.round((methods.reduce((s, m) => s + m.confidence, 0) / methods.length) * 100),
            weighting: methods.map((m) => ({
              method: m.method,
              value: m.value,
              weight: weights[m.method] || 0.1,
              confidence: m.confidence,
            })),
          };
        }

        // 4.5 Financing scenarios
        const basePrice = askingPrice || valueBand.p50;
        const financingScenarios = [
          { name: "konservativ", ltv: 0.6, interest: 0.038, repayment: 0.03 },
          { name: "realistisch", ltv: 0.75, interest: 0.035, repayment: 0.02 },
          { name: "offensiv", ltv: 0.9, interest: 0.04, repayment: 0.015 },
        ].map((s) => {
          const loan = Math.round(basePrice * s.ltv);
          const monthlyRate = Math.round((loan * (s.interest + s.repayment)) / 12);
          const annualDebt = monthlyRate * 12;
          const cashflowAfterDebt = netRent > 0 ? (netRent * 12) - annualDebt : -annualDebt;

          return {
            name: s.name,
            ltv: s.ltv,
            loan_amount: loan,
            equity: basePrice - loan,
            interest_rate: s.interest,
            repayment_rate: s.repayment,
            monthly_rate: monthlyRate,
            annual_debt_service: annualDebt,
            cashflow_after_debt: cashflowAfterDebt,
            traffic_light: cashflowAfterDebt > 0 ? "green" : cashflowAfterDebt > -monthlyRate ? "yellow" : "red",
          };
        });

        // 4.6 Stress tests
        const baseScenario = financingScenarios[1]; // realistisch
        const stressTests = [
          { scenario: "Zins +2%", interest_override: baseScenario.interest_rate + 0.02 },
          { scenario: "Miete -10%", rent_factor: 0.9 },
          { scenario: "CapEx +20%", price_factor: 1.2 },
        ].map((st) => {
          const interest = st.interest_override || baseScenario.interest_rate;
          const rent = netRent * (st.rent_factor || 1);
          const price = basePrice * (st.price_factor || 1);
          const loan = Math.round(price * baseScenario.ltv);
          const monthlyRate = Math.round((loan * (interest + baseScenario.repayment_rate)) / 12);
          const annualDebt = monthlyRate * 12;
          const dscr = rent > 0 ? Math.round(((rent * 12) / annualDebt) * 100) / 100 : 0;

          return {
            scenario: st.scenario,
            monthly_rate: monthlyRate,
            cashflow: rent > 0 ? (rent * 12) - annualDebt : -annualDebt,
            dscr,
          };
        });

        // 4.7 Lien proxy
        const lienProxy = {
          market_value_band: valueBand,
          risk_discount: 0.15 + (dataQuality.completeness < 70 ? 0.1 : 0) + (locationAnalysis.available ? 0 : 0.05),
          lien_value: Math.round(valueBand.p50 * (1 - 0.15)),
          ltv_window: { safe: 0.6, max: 0.75 },
          risk_drivers: [
            ...(dataQuality.completeness < 70 ? ["Datenlücken in kritischen Feldern"] : []),
            ...(!locationAnalysis.available ? ["Keine Standortdaten verfügbar"] : []),
            ...(compStats.count_with_price_sqm < 5 ? ["Wenige Vergleichsangebote"] : []),
          ],
        };

        // 4.8 DSCR / Debt service
        const dscr = netRent > 0 && baseScenario.annual_debt_service > 0
          ? Math.round(((netRent * 12) / baseScenario.annual_debt_service) * 100) / 100
          : 0;

        const breakEvenRent = baseScenario.annual_debt_service > 0
          ? Math.round(baseScenario.annual_debt_service / 12)
          : 0;

        const debtService = {
          dscr,
          break_even_rent: breakEvenRent,
          is_viable: dscr >= 1.1,
          annual_noi: netRent * 12 * 0.75, // after 25% bewirtschaftung
          annual_debt_service: baseScenario.annual_debt_service,
        };

        // 4.9 Sensitivity
        const sensitivity = {
          rent_plus_10: { value: Math.round(valueBand.p50 * 1.08), change_pct: 8 },
          rent_minus_10: { value: Math.round(valueBand.p50 * 0.92), change_pct: -8 },
          cap_rate_plus_1: { value: netRent > 0 ? Math.round((netRent * 12 * 0.75) / 0.055) : null, change_pct: null },
          cap_rate_minus_1: { value: netRent > 0 ? Math.round((netRent * 12 * 0.75) / 0.035) : null, change_pct: null },
        };

        // Save results
        await sbAdmin.from("valuation_results").insert({
          case_id: caseId,
          value_band: valueBand,
          valuation_methods: methods,
          financing: financingScenarios,
          stress_tests: stressTests,
          lien_proxy: lienProxy,
          debt_service: debtService,
          location_analysis: locationAnalysis,
          comp_stats: compStats,
          comp_postings: compPostings.slice(0, 10),
          sensitivity,
          charts: {},
        });

        tracker.end(4);
        stageLog(4, `Done. Value band: ${valueBand.p25}–${valueBand.p75}, DSCR: ${dscr}`);

        // ─── Stage 5: Report Composer ───
        tracker.start(5);
        stageLog(5, "Generating report narratives");
        await updateStage(5);

        // Generate executive summary via AI
        let executiveSummary = "";
        try {
          executiveSummary = await callAI(
            lovableApiKey!,
            "google/gemini-2.5-flash",
            `Du erstellst professionelle Executive Summaries für Immobilienbewertungen. Max 200 Wörter. Sachlich, prägnant. Nenne: 3 Werttreiber, 3 Risiken, Empfehlung.
WICHTIG: Basiere dich NUR auf den bereitgestellten Zahlen. Erfinde KEINE Daten.`,
            `Objekt: ${snapshot.formatted_address || snapshot.address || "Unbekannt"}
Objektart: ${snapshot.object_type || "Unbekannt"}
Wohnfläche: ${snapshot.living_area_sqm || "?"} m²
Baujahr: ${snapshot.year_built || "?"}
Kaufpreis: ${askingPrice ? `${askingPrice.toLocaleString("de")} €` : "Unbekannt"}
Wertband: ${valueBand.p25.toLocaleString("de")} – ${valueBand.p75.toLocaleString("de")} € (P50: ${valueBand.p50.toLocaleString("de")} €)
Confidence: ${valueBand.confidence}%
Standort-Score: ${locationAnalysis.global_score || "N/A"}/100
DSCR: ${dscr}
Comps: ${compStats.count_with_price_sqm || 0} Vergleichsangebote, Median €/m²: ${compStats.p50 || "N/A"}
Datenqualität: ${dataQuality.completeness}% vollständig, ${dataQuality.critical_gaps.length} kritische Lücken`,
          );
        } catch (e) {
          stageLog(5, `Summary generation error: ${e}`);
          executiveSummary = "Executive Summary konnte nicht generiert werden.";
        }

        // Create report record
        const reportHash = `v1_${caseId.substring(0, 8)}_${Date.now()}`;
        await sbAdmin.from("valuation_reports").insert({
          case_id: caseId,
          report_version: 1,
          web_render_hash: reportHash,
        });

        // Update case to final
        tracker.end(5);
        await sbAdmin
          .from("valuation_cases")
          .update({
            status: "final",
            stage_current: 5,
            stage_timings: tracker.toJSON(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", caseId);

        stageLog(5, "Report complete");

        return json({
          success: true,
          case_id: caseId,
          status: "final",
          stage_timings: tracker.toJSON(),
          summary: {
            value_band: valueBand,
            data_quality: dataQuality,
            location_score: locationAnalysis.global_score || null,
            comp_count: compPostings.length,
            dscr,
            executive_summary: executiveSummary,
          },
        });
      } catch (pipelineError) {
        // Mark case as failed
        stageLog(99, `Pipeline error: ${pipelineError}`);
        await sbAdmin
          .from("valuation_cases")
          .update({
            status: "failed",
            stage_timings: tracker.toJSON(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", caseId);

        return json({ error: "Pipeline failed", case_id: caseId, details: String(pipelineError) }, 500);
      }
    }

    // ════════════════════════════════════════════
    // ACTION: get — Retrieve case results
    // ════════════════════════════════════════════
    if (action === "get") {
      const { case_id } = body;
      if (!case_id) return json({ error: "case_id required" }, 400);

      const [caseRes, inputsRes, resultsRes, reportRes] = await Promise.all([
        sbAdmin.from("valuation_cases").select("*").eq("id", case_id).single(),
        sbAdmin.from("valuation_inputs").select("*").eq("case_id", case_id).single(),
        sbAdmin.from("valuation_results").select("*").eq("case_id", case_id).single(),
        sbAdmin.from("valuation_reports").select("*").eq("case_id", case_id).order("report_version", { ascending: false }).limit(1).single(),
      ]);

      return json({
        case: caseRes.data,
        inputs: inputsRes.data,
        results: resultsRes.data,
        report: reportRes.data,
      });
    }

    return json({ error: "Unknown action. Use: preflight, run, get" }, 400);
  } catch (err) {
    console.error("sot-valuation-engine error:", err);
    return json({ error: "Internal server error", details: String(err) }, 500);
  }
});
