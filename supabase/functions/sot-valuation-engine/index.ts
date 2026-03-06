import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * SoT Valuation Engine V6.0 — 6-Stage Orchestrator
 *
 * V6.0: SSOT-Final Mode — When property_id is provided, fetches full SSOT data
 * from properties/units/leases/loans and uses it as primary data source.
 * Extracted data (from exposé) becomes fallback/evidence only.
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
 * APIs: Google Maps (Geocode/Places/Routes/Static), Firecrawl (Portal Scraper)
 */

const CREDITS_REQUIRED = 20;
const ACTION_CODE = "valuation_engine";
const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

// ─── Valuation Calc Constants (mirrored from src/engines/valuation/spec.ts) ───
// These MUST stay in sync with the client-side engine spec.
const CALC = {
  BEWIRTSCHAFTUNG_RATE: 0.25,
  CAP_RATE: 0.045,
  SACHWERT_BASE_COST_SQM: 2500,
  SACHWERT_MAX_DEPRECIATION: 0.5,
  SACHWERT_ANNUAL_DEPRECIATION: 0.01,
  VALUE_BAND_SPREAD: 0.10,
  METHOD_WEIGHTS: { ertragswert: 0.5, comp_proxy: 0.35, sachwert_proxy: 0.15 } as Record<string, number>,
  FINANCING_SCENARIOS: [
    { name: "konservativ", ltv: 0.6, interest: 0.038, repayment: 0.03 },
    { name: "realistisch", ltv: 0.75, interest: 0.035, repayment: 0.02 },
    { name: "offensiv", ltv: 0.9, interest: 0.04, repayment: 0.015 },
  ],
  LIEN_BASE_DISCOUNT: 0.15,
  LIEN_LTV_SAFE: 0.6,
  LIEN_LTV_MAX: 0.75,
  DSCR_VIABLE_THRESHOLD: 1.1,
  STRESS_TESTS: [
    { scenario: "Zins +2%", interest_delta: 0.02 },
    { scenario: "Miete -10%", rent_factor: 0.9 },
    { scenario: "CapEx +20%", price_factor: 1.2 },
  ],
} as const;

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

// ─── V6.0: SSOT Property Data Fetch ───

async function fetchSSOTPropertyData(sbAdmin: any, propertyId: string, tenantId: string) {
  stageLog(0, `Fetching SSOT data for property ${propertyId}`);

  const [propRes, unitsRes, leasesRes, loansRes] = await Promise.all([
    sbAdmin.from("properties").select("*").eq("id", propertyId).eq("tenant_id", tenantId).single(),
    sbAdmin.from("units").select("*").eq("property_id", propertyId).eq("tenant_id", tenantId),
    sbAdmin.from("leases").select("*").eq("property_id", propertyId).eq("tenant_id", tenantId),
    sbAdmin.from("loans").select("*").eq("property_id", propertyId).eq("tenant_id", tenantId),
  ]);

  if (propRes.error || !propRes.data) {
    stageLog(0, `Property fetch failed: ${propRes.error?.message}`);
    return null;
  }

  return {
    property: propRes.data,
    units: unitsRes.data || [],
    leases: leasesRes.data || [],
    loans: loansRes.data || [],
  };
}

/**
 * Build canonical snapshot from SSOT data (server-side version).
 * Mirrors the client-side buildSnapshotFromSSOT but works with raw DB rows.
 */
function buildServerSSOTSnapshot(ssotData: any): Record<string, any> {
  const p = ssotData.property;
  const units = ssotData.units || [];
  const leases = ssotData.leases || [];
  const loans = ssotData.loans || [];

  // Aggregate units
  const totalArea = units.reduce((s: number, u: any) => s + (u.area_sqm || 0), 0) || p.total_area_sqm || null;
  const totalRooms = units.reduce((s: number, u: any) => s + (u.rooms || 0), 0) || null;
  const totalHausgeld = units.reduce((s: number, u: any) => s + (u.hausgeld_monthly || 0), 0) || null;
  const totalParking = units.reduce((s: number, u: any) => s + (u.parking_count || 0), 0) || null;

  // Aggregate active leases
  const activeLeases = leases.filter((l: any) => l.status === 'active' || l.status === 'aktiv');
  const totalRent = activeLeases.reduce((s: number, l: any) => s + (l.rent_cold_eur || 0), 0) || null;

  // Primary loan
  const primaryLoan = loans.length > 0 ? loans[0] : null;

  // Legal title block
  const legalTitle = {
    land_register_court: p.land_register_court || null,
    land_register_sheet: p.land_register_sheet || null,
    land_register_volume: p.land_register_volume || null,
    parcel_number: p.parcel_number || null,
    ownership_share_percent: p.ownership_share_percent || null,
    weg_flag: p.weg_flag || false,
    te_number: p.te_number || null,
    unit_ownership_nr: p.unit_ownership_nr || null,
    mea_share: units.length === 1 ? units[0].mea_share || null : null,
    land_register_extract_available: !!(p.land_register_court && p.land_register_sheet),
    partition_declaration_available: p.weg_flag && !!p.te_number,
    encumbrances_note: "Belastungen nicht automatisch ausgewertet — manuelle Prüfung empfohlen",
  };

  return {
    source_mode: "SSOT_FINAL",
    address: p.address || "",
    city: p.city || "",
    postal_code: p.postal_code || "",
    object_type: p.property_type || "other",
    living_area_sqm: totalArea,
    plot_area_sqm: p.plot_area_sqm || null,
    rooms: totalRooms,
    units_count: units.length || null,
    year_built: p.year_built || null,
    condition: p.condition_grade || null,
    energy_class: p.energy_certificate_value || null,
    asking_price: p.market_value || p.purchase_price || null,
    purchase_price: p.purchase_price || null,
    acquisition_costs: p.acquisition_costs || null,
    net_cold_rent_monthly: totalRent,
    net_cold_rent_per_sqm: totalRent && totalArea ? Math.round((totalRent / totalArea) * 100) / 100 : null,
    hausgeld_monthly: totalHausgeld,
    parking_spots: totalParking,
    lat: p.latitude || null,
    lng: p.longitude || null,
    rental_status: activeLeases.length > 0 ? (activeLeases.length >= units.length ? "fully_rented" : "partially_rented") : null,
    legal_title: legalTitle,
    existing_loan: primaryLoan ? {
      outstanding_balance: primaryLoan.outstanding_balance_eur,
      interest_rate: primaryLoan.interest_rate_percent,
      repayment_rate: primaryLoan.repayment_rate_percent,
      annuity_monthly: primaryLoan.annuity_monthly_eur,
      fixed_interest_end: primaryLoan.fixed_interest_end_date,
      bank_name: primaryLoan.bank_name,
    } : null,
  };
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
      const { source_context, source_ref, documents, expose_url, property_id } = body;

      // V6.0: Determine source mode
      const sourceMode = property_id ? "SSOT_FINAL" : "DRAFT_INTAKE";
      const sourceModeLabel = sourceMode === "SSOT_FINAL"
        ? "Datenbasis: MOD-04 SSOT (Final)"
        : "Datenbasis: Exposé Draft (Intake)";

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

      // V6.0: If SSOT mode, fetch property summary for display
      let ssotSummary: any = null;
      if (property_id) {
        const ssotData = await fetchSSOTPropertyData(sbAdmin, property_id, tenantId);
        if (ssotData) {
          ssotSummary = {
            address: ssotData.property.address,
            city: ssotData.property.city,
            type: ssotData.property.property_type,
            units_count: ssotData.units.length,
            leases_count: ssotData.leases.length,
            loans_count: ssotData.loans.length,
            has_legal_data: !!(ssotData.property.land_register_court || ssotData.property.parcel_number),
          };
        }
      }

      return json({
        success: true,
        preflight: {
          creditsCost: CREDITS_REQUIRED,
          credits_available: creditData?.available_credits ?? 0,
          can_proceed: creditData?.can_proceed ?? false,
          sources: ssotSummary
            ? [{ name: `SSOT: ${ssotSummary.address}, ${ssotSummary.city}`, type: "ssot", pages: 0 }]
            : [],
          totalEstimatedPages: docCount * 6,
          limitsOk: true,
          googleApiAvailable: !!googleMapsKey,
          scraperAvailable: !!firecrawlKey,
          sourceMode,
          sourceModeLabel,
          ssotSummary,
        },
      });
    }

    // ════════════════════════════════════════════
    // ACTION: run — Execute full 6-stage pipeline
    // ════════════════════════════════════════════
    if (action === "run") {
      const { source_context, source_ref, documents, expose_url, canonical_override, property_data, property_id } = body;
      const tracker = new StageTracker();

      // V6.0: Determine source mode
      const sourceMode = property_id ? "SSOT_FINAL" : "DRAFT_INTAKE";
      stageLog(0, `Source mode: ${sourceMode}`);

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

      // Create case record (V6.0: with source_mode and property_id)
      const { data: caseRow, error: caseErr } = await sbAdmin
        .from("valuation_cases")
        .insert({
          tenant_id: tenantId,
          source_context: source_context || "ACQUIARY_TOOLS",
          source_ref: source_ref || null,
          source_mode: sourceMode,
          property_id: property_id || null,
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
      stageLog(0, `Case created: ${caseId} (${sourceMode})`);

      // V6.0: Fetch SSOT data if property_id provided
      let ssotData: any = null;
      let ssotSnapshot: Record<string, any> = {};
      if (property_id) {
        ssotData = await fetchSSOTPropertyData(sbAdmin, property_id, tenantId);
        if (ssotData) {
          ssotSnapshot = buildServerSSOTSnapshot(ssotData);
          stageLog(0, `SSOT data loaded: ${ssotData.units.length} units, ${ssotData.leases.length} leases, ${ssotData.loans.length} loans`);
        }
      }

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
        let diffs: any[] = [];
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

        // 1b: If property_data provided (legacy path), add to raw text
        if (property_data && !property_id) {
          stageLog(1, "Using legacy property_data");
          rawText += `\n\nProperty Data:\n${JSON.stringify(property_data, null, 2)}`;
        }

        // 1c: Extract structured fields via AI (only if we have raw text)
        if (rawText) {
          stageLog(1, "Extracting structured fields via AI");
          const extractionResult = await callAI(
            lovableApiKey!,
            "google/gemini-2.5-flash",
            `Du bist ein Immobilien-Datenextraktionssystem. Extrahiere alle verfügbaren Immobiliendaten aus dem gegebenen Text.
Gib die Daten als strukturiertes JSON zurück. Jedes Feld hat: field_name, value, unit, confidence (0-1), source.
Pflichtfelder: address, city, postal_code, object_type, living_area_sqm, rooms, year_built, asking_price, net_cold_rent_monthly.
Wenn ein Feld nicht gefunden wird, setze value=null und confidence=0.`,
            rawText.substring(0, 30000),
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

          evidenceMap = extractedFields
            .filter((f: any) => f.value !== null)
            .map((f: any) => ({
              field: f.field_name,
              value: f.value,
              source: f.source || "extracted",
              confidence: f.confidence,
            }));
        }

        // V6.0: Build canonical snapshot based on source mode
        let snapshot: Record<string, any> = {};

        if (sourceMode === "SSOT_FINAL" && Object.keys(ssotSnapshot).length > 0) {
          // SSOT-Final: Start with SSOT snapshot, fill gaps with extracted data
          snapshot = { ...ssotSnapshot };

          // Fill gaps from extracted fields (SSOT fields always win)
          for (const f of extractedFields) {
            if (f.value !== null && f.confidence > 0.5) {
              const key = f.field_name;
              if (snapshot[key] === null || snapshot[key] === undefined || snapshot[key] === "") {
                snapshot[key] = f.value;
                // Track that this was a fallback fill
                evidenceMap.push({
                  field: key,
                  value: f.value,
                  source: "extracted_fallback",
                  confidence: f.confidence,
                });
              } else if (String(snapshot[key]) !== String(f.value)) {
                // V6.0: Record diff (SSOT ≠ Extracted)
                diffs.push({
                  field: key,
                  ssot_value: snapshot[key],
                  extracted_value: f.value,
                  decision: "ssot_kept",
                });
              }
            }
          }

          // Add SSOT evidence entries
          for (const [key, val] of Object.entries(ssotSnapshot)) {
            if (val !== null && val !== undefined && val !== "" && typeof val !== "object") {
              evidenceMap.push({
                field: key,
                value: val,
                source: "SSOT",
                confidence: 1.0,
              });
            }
          }

          stageLog(1, `SSOT-Final: ${diffs.length} diffs found, SSOT always wins`);
        } else {
          // Draft mode: build from extracted fields (legacy behavior)
          for (const f of extractedFields) {
            if (f.value !== null) {
              snapshot[f.field_name] = f.value;
            }
          }
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
            snapshot[key] = val;
          });
        }

        // Calculate data quality
        const criticalFields = ["address", "object_type", "living_area_sqm", "asking_price"];
        const filledCritical = criticalFields.filter((cf) => snapshot[cf] != null).length;
        const completeness = Math.round((filledCritical / criticalFields.length) * 100);

        // V6.0: SSOT mode gets higher base confidence
        const baseConfidence = sourceMode === "SSOT_FINAL" ? 0.3 : 0;
        const avgConfidence =
          extractedFields.length > 0
            ? extractedFields.reduce((sum: number, f: any) => sum + (f.confidence || 0), 0) / extractedFields.length
            : baseConfidence;

        const dataQuality = {
          completeness: sourceMode === "SSOT_FINAL" ? Math.max(completeness, 75) : completeness,
          critical_gaps: criticalFields.filter((cf) => snapshot[cf] == null),
          global_confidence: Math.round(Math.max(avgConfidence, baseConfidence) * 100),
          total_fields: extractedFields.length + (sourceMode === "SSOT_FINAL" ? Object.keys(ssotSnapshot).length : 0),
          belegt: evidenceMap.length,
          missing: missingFields.length,
          source_mode: sourceMode,
        };

        // Save inputs (V6.0: includes diffs and legal_title)
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
        stageLog(1, `Done. ${extractedFields.length} extracted, ${Object.keys(ssotSnapshot).length} SSOT fields, ${diffs.length} diffs`);

        // ─── Stage 2: Normalization + Location (Google) ───
        tracker.start(2);
        stageLog(2, "Starting normalization & location analysis");
        await updateStage(2);

        let locationAnalysis: any = { available: false };

        // V6.0: Use SSOT address/coords if available
        const address = snapshot.address || snapshot.city || "";
        const ssotLat = snapshot.lat;
        const ssotLng = snapshot.lng;

        if (address && googleMapsKey) {
          let geo: any = null;

          // Use SSOT coordinates if available, otherwise geocode
          if (ssotLat && ssotLng && sourceMode === "SSOT_FINAL") {
            geo = { lat: ssotLat, lng: ssotLng, formatted_address: `${address}, ${snapshot.postal_code || ""} ${snapshot.city || ""}`, quality: "SSOT" };
            stageLog(2, `Using SSOT coordinates: ${ssotLat}, ${ssotLng}`);
          } else {
            stageLog(2, `Geocoding: ${address}`);
            geo = await googleGeocode(address, googleMapsKey);
          }

          if (geo) {
            snapshot.lat = geo.lat;
            snapshot.lng = geo.lng;
            snapshot.formatted_address = geo.formatted_address;

            // POI searches
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

            const microMap = await googleStaticMap(geo.lat, geo.lng, googleMapsKey, 16, "600x400");
            const macroMap = await googleStaticMap(geo.lat, geo.lng, googleMapsKey, 12, "600x400");

            const scoreByCategory = poiResults.map((cat) => {
              const avgDist = cat.pois.length > 0
                ? cat.pois.reduce((s: number, p: any) => s + p.distance_m, 0) / cat.pois.length
                : 5000;
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

            stageLog(2, `Location done. Score: ${globalScore}/100`);
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

            if (rawResults.length > 0) {
              const compTexts = rawResults
                .slice(0, 15)
                .map((r: any, i: number) => `[${i}] URL: ${r.url}\nTitle: ${r.title}\n${(r.markdown || "").substring(0, 1000)}`)
                .join("\n---\n");

              const compsExtracted = await callAI(
                lovableApiKey!,
                "google/gemini-2.5-flash",
                `Du extrahierst Vergleichsangebote (Comps) aus Immobilien-Suchergebnissen. Extrahiere pro Angebot: title, price (EUR), living_area_sqm, price_per_sqm, rooms, year_built, url. Ignoriere irrelevante Ergebnisse.`,
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

              stageLog(3, `Found ${compPostings.length} valid comps`);
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

        const assumptions: any[] = [];

        // 4.1 Ertragswert
        let ertragswertResult: any = null;
        const netRent = Number(snapshot.net_cold_rent_monthly) || 0;
        const askingPrice = Number(snapshot.asking_price) || 0;

        if (netRent > 0) {
          const annualRent = netRent * 12;
          const bewirtschaftungRate = CALC.BEWIRTSCHAFTUNG_RATE;
          assumptions.push({ text: `Bewirtschaftungskosten ${bewirtschaftungRate * 100}% der Nettokaltmiete`, impact: "high" });
          const netOperatingIncome = annualRent * (1 - bewirtschaftungRate);
          const capRate = CALC.CAP_RATE;
          assumptions.push({ text: `Kapitalisierungszinssatz ${capRate * 100}%`, impact: "high" });
          const ertragswert = Math.round(netOperatingIncome / capRate);

          ertragswertResult = {
            method: "ertragswert",
            value: ertragswert,
            confidence: netRent > 0 ? (sourceMode === "SSOT_FINAL" ? 0.85 : 0.7) : 0.3,
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

        // 4.3 Sachwert Proxy
        let sachwertResult: any = null;
        if (livingArea > 0) {
          const yearBuilt = Number(snapshot.year_built) || 1980;
          const age = new Date().getFullYear() - yearBuilt;
          const baseCostSqm = CALC.SACHWERT_BASE_COST_SQM;
          const depreciationRate = Math.min(age * CALC.SACHWERT_ANNUAL_DEPRECIATION, CALC.SACHWERT_MAX_DEPRECIATION);
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
          let totalWeight = 0;
          let weightedSum = 0;

          for (const m of methods) {
            const w = CALC.METHOD_WEIGHTS[m.method] || 0.1;
            weightedSum += m.value * w * m.confidence;
            totalWeight += w * m.confidence;
          }

          const p50 = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
          const spread = CALC.VALUE_BAND_SPREAD;
          valueBand = {
            p25: Math.round(p50 * (1 - spread)),
            p50,
            p75: Math.round(p50 * (1 + spread)),
            confidence: Math.round((methods.reduce((s: any, m: any) => s + m.confidence, 0) / methods.length) * 100),
            weighting: methods.map((m: any) => ({
              method: m.method,
              value: m.value,
              weight: CALC.METHOD_WEIGHTS[m.method] || 0.1,
              confidence: m.confidence,
            })),
          };
        }

        // 4.5 Financing scenarios
        // V6.0: Use existing loan data if available in SSOT mode
        const basePrice = askingPrice || valueBand.p50;
        const existingLoan = snapshot.existing_loan;

        const financingScenarios = [
          ...CALC.FINANCING_SCENARIOS,
          // V6.0: Add actual financing scenario if loan data exists
          ...(existingLoan && existingLoan.outstanding_balance ? [{
            name: "aktuell (SSOT)",
            ltv: basePrice > 0 ? existingLoan.outstanding_balance / basePrice : 0.7,
            interest: (existingLoan.interest_rate || 3.5) / 100,
            repayment: (existingLoan.repayment_rate || 2.0) / 100,
          }] : []),
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
        const baseScenario = financingScenarios[1];
        const stressTests = [
          { scenario: "Zins +2%", interest_override: baseScenario.interest_rate + 0.02 },
          { scenario: "Miete -10%", rent_factor: 0.9 },
          { scenario: "CapEx +20%", price_factor: 1.2 },
        ].map((st: any) => {
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
          risk_discount: CALC.LIEN_BASE_DISCOUNT + (dataQuality.completeness < 70 ? 0.1 : 0) + (locationAnalysis.available ? 0 : 0.05),
          lien_value: Math.round(valueBand.p50 * (1 - CALC.LIEN_BASE_DISCOUNT)),
          ltv_window: { safe: CALC.LIEN_LTV_SAFE, max: CALC.LIEN_LTV_MAX },
          risk_drivers: [
            ...(dataQuality.completeness < 70 ? ["Datenlücken in kritischen Feldern"] : []),
            ...(!locationAnalysis.available ? ["Keine Standortdaten verfügbar"] : []),
            ...(compStats.count_with_price_sqm < 5 ? ["Wenige Vergleichsangebote"] : []),
          ],
        };

        // 4.8 DSCR
        const dscr = netRent > 0 && baseScenario.annual_debt_service > 0
          ? Math.round(((netRent * 12) / baseScenario.annual_debt_service) * 100) / 100
          : 0;

        const breakEvenRent = baseScenario.annual_debt_service > 0
          ? Math.round(baseScenario.annual_debt_service / 12)
          : 0;

        const debtService = {
          dscr,
          break_even_rent: breakEvenRent,
          is_viable: dscr >= CALC.DSCR_VIABLE_THRESHOLD,
          annual_noi: netRent * 12 * (1 - CALC.BEWIRTSCHAFTUNG_RATE),
          annual_debt_service: baseScenario.annual_debt_service,
        };

        // 4.9 Sensitivity
        const sensitivity = {
          rent_plus_10: { value: Math.round(valueBand.p50 * 1.08), change_pct: 8 },
          rent_minus_10: { value: Math.round(valueBand.p50 * 0.92), change_pct: -8 },
          cap_rate_plus_1: { value: netRent > 0 ? Math.round((netRent * 12 * 0.75) / 0.055) : null, change_pct: null },
          cap_rate_minus_1: { value: netRent > 0 ? Math.round((netRent * 12 * 0.75) / 0.035) : null, change_pct: null },
        };

        // Save results (V6.0: includes legal_title and diffs)
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
          const sourceModeNote = sourceMode === "SSOT_FINAL"
            ? "HINWEIS: Diese Bewertung basiert auf verifizierten SSOT-Daten aus der Immobilienakte (MOD-04). Die Datenqualität ist daher als hoch einzustufen."
            : "HINWEIS: Diese Bewertung basiert auf einer Exposé-Erstbewertung (Draft). Die Daten wurden per KI extrahiert und sollten manuell verifiziert werden.";

          executiveSummary = await callAI(
            lovableApiKey!,
            "google/gemini-2.5-flash",
            `Du erstellst professionelle Executive Summaries für Immobilienbewertungen. Max 200 Wörter. Sachlich, prägnant. Nenne: 3 Werttreiber, 3 Risiken, Empfehlung.
WICHTIG: Basiere dich NUR auf den bereitgestellten Zahlen. Erfinde KEINE Daten.
${sourceModeNote}`,
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
Datenqualität: ${dataQuality.completeness}% vollständig, ${dataQuality.critical_gaps.length} kritische Lücken
Datenbasis: ${sourceMode === "SSOT_FINAL" ? "SSOT (verifiziert)" : "Exposé-Extraktion (Draft)"}`,
          );
        } catch (e) {
          stageLog(5, `Summary generation error: ${e}`);
          executiveSummary = "Executive Summary konnte nicht generiert werden.";
        }

        // Create report record
        const reportHash = `v2_${caseId.substring(0, 8)}_${Date.now()}`;
        await sbAdmin.from("valuation_reports").insert({
          case_id: caseId,
          report_version: 2,
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
          source_mode: sourceMode,
          stage_timings: tracker.toJSON(),
          summary: {
            value_band: valueBand,
            data_quality: dataQuality,
            location_score: locationAnalysis.global_score || null,
            comp_count: compPostings.length,
            dscr,
            executive_summary: executiveSummary,
            legal_title: snapshot.legal_title || null,
            diffs_count: diffs.length,
          },
        });
      } catch (pipelineError) {
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
