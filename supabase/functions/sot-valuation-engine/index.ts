import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * SoT Valuation Engine V9.0 — Kurzgutachten-Standard
 *
 * V9.0: Gemini AI Research for Liegenschaftszins/Bodenrichtwert/Vergleichsmieten
 *        BelWertV Beleihungswert (dual-track)
 *        Plot heuristic MFH=2.5×
 *        Comp price_per_sqm fix
 *
 * Stages:
 *   0 — Preflight & Credit Gate
 *   1 — Intake + SSOT Data
 *   2 — AI Research (Gemini) + Location Analysis (Google Maps)
 *   3 — Portal Comps via Scraper
 *   4 — Deterministic Calc: Marktwert + Beleihungswert (BelWertV)
 *   5 — Report Composer
 */

const CREDITS_REQUIRED = 20;
const ACTION_CODE = "valuation_engine";
const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

// ─── Calc Constants V9.0 ───

const BPI_FACTOR = 1.38;

function getHerstellkostenSqm(yearBuilt: number): number {
  let base: number;
  if (yearBuilt < 1950) base = 1200;
  else if (yearBuilt < 1970) base = 1400;
  else if (yearBuilt < 1990) base = 1600;
  else if (yearBuilt < 2010) base = 2000;
  else base = 2600;
  return Math.round(base * BPI_FACTOR);
}

/** V9.0: Fallback only — Gemini research overrides this */
function getLiegenschaftszinsFallback(objectType: string): number {
  const map: Record<string, number> = {
    'MFH': 0.04, 'mfh': 0.04, 'Mehrfamilienhaus': 0.04,
    'ETW': 0.03, 'etw': 0.03, 'Eigentumswohnung': 0.03,
    'EFH': 0.025, 'efh': 0.025, 'Einfamilienhaus': 0.025,
    'DHH': 0.025, 'dhh': 0.025, 'Doppelhaushälfte': 0.025,
    'Gewerbe': 0.06, 'gew': 0.06,
    'Mixed': 0.05, 'mixed': 0.05,
  };
  return map[objectType] || 0.04;
}

function getGesamtnutzungsdauer(objectType: string): number {
  const map: Record<string, number> = {
    'MFH': 80, 'mfh': 80, 'Mehrfamilienhaus': 80,
    'ETW': 80, 'etw': 80, 'EFH': 80, 'efh': 80,
    'DHH': 80, 'dhh': 80, 'Gewerbe': 60, 'gew': 60,
    'Mixed': 70, 'mixed': 70,
  };
  return map[objectType] || 70;
}

/** V9.0: MFH heuristic updated to 2.5× */
function getPlotAreaHeuristic(objectType: string): number {
  const map: Record<string, number> = {
    'MFH': 2.5, 'mfh': 2.5, 'Mehrfamilienhaus': 2.5,
    'EFH': 3.0, 'efh': 3.0, 'Einfamilienhaus': 3.0,
    'DHH': 2.0, 'dhh': 2.0,
    'ETW': 0.3, 'etw': 0.3, 'Eigentumswohnung': 0.3,
    'Gewerbe': 1.2, 'gew': 1.2, 'Mixed': 1.3, 'mixed': 1.3,
  };
  return map[objectType] || 1.0;
}

function getBodenrichtwertProxy(_city: string, locationScore: number): number {
  const FLOOR = 200;
  const stufen = [
    { maxScore: 30, value: 120 },
    { maxScore: 45, value: 200 },
    { maxScore: 60, value: 300 },
    { maxScore: 75, value: 400 },
    { maxScore: 100, value: 550 },
  ];
  let value = stufen[0].value;
  for (const s of stufen) {
    if (locationScore <= s.maxScore) { value = s.value; break; }
    value = s.value;
  }
  return Math.max(_city ? FLOOR : value, value);
}

function getMarktanpassungsfaktor(locationScore: number): number {
  if (locationScore >= 75) return 1.20;
  if (locationScore >= 60) return 1.10;
  if (locationScore >= 45) return 1.05;
  return 1.00;
}

function barwertfaktor(liegenschaftszins: number, restnutzungsdauer: number): number {
  if (restnutzungsdauer <= 0 || liegenschaftszins <= 0) return 0;
  return (1 - Math.pow(1 + liegenschaftszins, -restnutzungsdauer)) / liegenschaftszins;
}

const CALC = {
  BEWIRTSCHAFTUNG: {
    verwaltungPercent: 0.05,
    instandhaltungPerSqmYear: 12.0,
    mietausfallPercent: 0.02,
    nichtUmlagefaehigPercent: 0.03,
  },
  /** V9.0: BelWertV konservative BWK */
  BEWIRTSCHAFTUNG_BELWERTV: {
    verwaltungPercent: 0.06,
    instandhaltungPerSqmYear: 15.0,
    mietausfallPercent: 0.04,
    nichtUmlagefaehigPercent: 0.04,
  },
  /** V9.0: BelWertV fester Liegenschaftszins */
  BELWERTV_LIEGENSCHAFTSZINS: 0.05,
  BELWERTV_SICHERHEITSABSCHLAG: 0.10,
  BELWERTV_BAUNEBENKOSTEN: 0.1867,
  SACHWERT_MAX_DEPRECIATION: 0.70,
  SACHWERT_ANNUAL_DEPRECIATION: 0.01,
  VALUE_BAND_SPREAD: 0.10,
  METHOD_WEIGHTS_3: { ertragswert: 0.50, comp_proxy: 0.35, sachwert_proxy: 0.15 } as Record<string, number>,
  METHOD_WEIGHTS_2_NO_COMP: { ertragswert: 0.75, sachwert_proxy: 0.25 } as Record<string, number>,
  METHOD_WEIGHTS_2_NO_ERTRAG: { comp_proxy: 0.70, sachwert_proxy: 0.30 } as Record<string, number>,
  FINANCING_SCENARIOS: [
    { name: "konservativ", ltv: 0.6, interest: 0.038, repayment: 0.03 },
    { name: "realistisch", ltv: 0.75, interest: 0.035, repayment: 0.02 },
    { name: "offensiv", ltv: 0.9, interest: 0.04, repayment: 0.015 },
  ],
  LIEN_BASE_DISCOUNT: 0.15,
  LIEN_LTV_SAFE: 0.6,
  LIEN_LTV_MAX: 0.75,
  DSCR_VIABLE_THRESHOLD: 1.1,
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

class StageTracker {
  private timings: Record<string, { start: number; end?: number; durationMs?: number }> = {};
  start(stage: number) { this.timings[`stage_${stage}`] = { start: Date.now() }; }
  end(stage: number) {
    const entry = this.timings[`stage_${stage}`];
    if (entry) { entry.end = Date.now(); entry.durationMs = entry.end - entry.start; }
  }
  toJSON() { return this.timings; }
}

// ─── AI Call Helper ───

async function callAI(
  apiKey: string, model: string, systemPrompt: string, userPrompt: string,
  tools?: any[], toolChoice?: any,
): Promise<any> {
  const body: any = {
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    stream: false,
  };
  if (tools) { body.tools = tools; body.tool_choice = toolChoice; }

  const resp = await fetch(AI_GATEWAY, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
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

// ─── V9.0: Gemini Research Functions ───

async function researchLiegenschaftszins(
  apiKey: string, objectType: string, city: string, postalCode: string, yearBuilt: number | null
): Promise<any> {
  stageLog(2, `Gemini: Researching Liegenschaftszins for ${objectType} in ${postalCode} ${city}`);
  try {
    const currentYear = new Date().getFullYear();
    const result = await callAI(
      apiKey,
      "google/gemini-2.5-flash",
      `Du bist ein Immobiliensachverständiger. Du recherchierst den marktüblichen Liegenschaftszinssatz für eine Immobilienbewertung.
Nutze dein Wissen über IVD-Daten, Gutachterausschüsse und ImmoWertV-Standards.
Der Liegenschaftszins variiert nach: Objektart, Lage (Stadt/Land), Region, Marktzyklus.
Antworte AUSSCHLIESSLICH mit dem JSON-Funktionsaufruf.`,
      `Ermittle den marktüblichen Liegenschaftszinssatz für:
- Objektart: ${objectType}
- PLZ: ${postalCode}
- Stadt: ${city}
- Bewertungsjahr: ${currentYear}
- Baujahr: ${yearBuilt || 'unbekannt'}

Berücksichtige:
- IVD-Liegenschaftszinssätze für die Region
- Unterschied zwischen Marktwert-Zins und BelWertV-Zins (BelWertV = fest 5%)
- Typische Spannen für ${objectType} in vergleichbarer Lage`,
      [{
        type: "function",
        function: {
          name: "report_liegenschaftszins",
          description: "Report the researched Liegenschaftszins",
          parameters: {
            type: "object",
            properties: {
              marktwert_zins: { type: "number", description: "Liegenschaftszins für Marktwert in Dezimal (z.B. 0.025 für 2,5%)" },
              beleihungswert_zins: { type: "number", description: "BelWertV Liegenschaftszins (typisch 0.05)" },
              quelle: { type: "string", description: "Quellenangabe (z.B. 'IVD Süd 2024', 'Gutachterausschuss Bayern')" },
              stichtag: { type: "string", description: "Bezugsjahr der Daten" },
              min: { type: "number", description: "Untere Grenze der Spanne" },
              max: { type: "number", description: "Obere Grenze der Spanne" },
              begruendung: { type: "string", description: "Kurze Begründung (1-2 Sätze)" },
            },
            required: ["marktwert_zins", "quelle", "min", "max"],
          },
        },
      }],
      { type: "function", function: { name: "report_liegenschaftszins" } },
    );
    stageLog(2, `Gemini Liegenschaftszins: ${JSON.stringify(result)}`);
    return result;
  } catch (e) {
    stageLog(2, `Gemini Liegenschaftszins error: ${e}`);
    return null;
  }
}

async function researchBodenrichtwert(
  apiKey: string, address: string, city: string, postalCode: string
): Promise<any> {
  stageLog(2, `Gemini: Researching Bodenrichtwert for ${address}, ${postalCode} ${city}`);
  try {
    const result = await callAI(
      apiKey,
      "google/gemini-2.5-flash",
      `Du bist ein Immobiliensachverständiger. Du recherchierst den Bodenrichtwert für eine Grundstücksbewertung.
Nutze dein Wissen über BORIS-Daten, Gutachterausschüsse und regionale Bodenrichtwertkarten.
Antworte AUSSCHLIESSLICH mit dem JSON-Funktionsaufruf.`,
      `Ermittle den aktuellen Bodenrichtwert für:
- Adresse: ${address}
- PLZ: ${postalCode}
- Stadt: ${city}

Berücksichtige die Bodenrichtwertzone, Art der Nutzung (Wohnen/Gewerbe/Misch), und regionale Marktlage.`,
      [{
        type: "function",
        function: {
          name: "report_bodenrichtwert",
          description: "Report the researched Bodenrichtwert",
          parameters: {
            type: "object",
            properties: {
              bodenrichtwert_eur_sqm: { type: "number", description: "Bodenrichtwert in EUR/m²" },
              stichtag: { type: "string", description: "Bezugsdatum" },
              quelle: { type: "string", description: "Quellenangabe" },
              art_der_nutzung: { type: "string", description: "Art der Nutzung (z.B. 'W - Wohnbaufläche')" },
              begruendung: { type: "string", description: "Kurze Begründung" },
            },
            required: ["bodenrichtwert_eur_sqm", "quelle"],
          },
        },
      }],
      { type: "function", function: { name: "report_bodenrichtwert" } },
    );
    stageLog(2, `Gemini Bodenrichtwert: ${JSON.stringify(result)}`);
    return result;
  } catch (e) {
    stageLog(2, `Gemini Bodenrichtwert error: ${e}`);
    return null;
  }
}

async function researchVergleichsmieten(
  apiKey: string, objectType: string, city: string, postalCode: string, yearBuilt: number | null, condition: string | null
): Promise<any> {
  stageLog(2, `Gemini: Researching Vergleichsmieten for ${objectType} in ${postalCode} ${city}`);
  try {
    const result = await callAI(
      apiKey,
      "google/gemini-2.5-flash",
      `Du bist ein Immobiliensachverständiger. Du recherchierst marktübliche Vergleichsmieten (Kaltmiete €/m²).
Nutze dein Wissen über lokale Mietspiegel, ImmoScout24-Marktdaten und regionale Mietpreise.
Antworte AUSSCHLIESSLICH mit dem JSON-Funktionsaufruf.`,
      `Ermittle die marktübliche Kaltmiete (€/m²) für:
- Objektart: ${objectType}
- PLZ: ${postalCode}
- Stadt: ${city}
- Baujahr: ${yearBuilt || 'unbekannt'}
- Zustand: ${condition || 'durchschnittlich'}`,
      [{
        type: "function",
        function: {
          name: "report_vergleichsmieten",
          description: "Report researched comparable rents",
          parameters: {
            type: "object",
            properties: {
              miete_min: { type: "number", description: "Untere Mietspanne €/m²" },
              miete_median: { type: "number", description: "Median-Miete €/m²" },
              miete_max: { type: "number", description: "Obere Mietspanne €/m²" },
              quelle: { type: "string", description: "Quellenangabe" },
              begruendung: { type: "string", description: "Kurze Begründung" },
            },
            required: ["miete_min", "miete_median", "miete_max", "quelle"],
          },
        },
      }],
      { type: "function", function: { name: "report_vergleichsmieten" } },
    );
    stageLog(2, `Gemini Vergleichsmieten: ${JSON.stringify(result)}`);
    return result;
  } catch (e) {
    stageLog(2, `Gemini Vergleichsmieten error: ${e}`);
    return null;
  }
}

// ─── Google Maps Helpers ───

async function googleGeocode(address: string, apiKey: string) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}&language=de&region=de`;
  const resp = await fetch(url);
  const data = await resp.json();
  if (data.status === "OK" && data.results?.[0]) {
    const r = data.results[0];
    return { lat: r.geometry.location.lat, lng: r.geometry.location.lng, formatted_address: r.formatted_address, place_id: r.place_id, quality: r.geometry.location_type };
  }
  return null;
}

async function googlePlacesNearby(lat: number, lng: number, type: string, apiKey: string, radius = 1500) {
  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${type}&key=${apiKey}&language=de`;
  const resp = await fetch(url);
  const data = await resp.json();
  return (data.results || []).slice(0, 3).map((p: any) => ({
    name: p.name, type, rating: p.rating,
    distance_m: Math.round(haversine(lat, lng, p.geometry.location.lat, p.geometry.location.lng)),
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

function googleStreetViewUrl(lat: number, lng: number, apiKey: string, size = "600x400") {
  return `https://maps.googleapis.com/maps/api/streetview?size=${size}&location=${lat},${lng}&fov=90&heading=235&pitch=10&key=${apiKey}`;
}

async function googleRoutesMatrix(
  originLat: number, originLng: number,
  destinations: { name: string; lat: number; lng: number }[], apiKey: string
) {
  const results: { destinationName: string; drivingMinutes: number | null; transitMinutes: number | null }[] = [];
  for (const dest of destinations) {
    let drivingMin: number | null = null;
    let transitMin: number | null = null;
    try {
      const dUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLng}&destinations=${dest.lat},${dest.lng}&mode=driving&language=de&key=${apiKey}`;
      const dResp = await fetch(dUrl);
      const dData = await dResp.json();
      if (dData.rows?.[0]?.elements?.[0]?.status === "OK") drivingMin = Math.round(dData.rows[0].elements[0].duration.value / 60);
    } catch (_) { /* ignore */ }
    try {
      const tUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originLat},${originLng}&destinations=${dest.lat},${dest.lng}&mode=transit&language=de&key=${apiKey}`;
      const tResp = await fetch(tUrl);
      const tData = await tResp.json();
      if (tData.rows?.[0]?.elements?.[0]?.status === "OK") transitMin = Math.round(tData.rows[0].elements[0].duration.value / 60);
    } catch (_) { /* ignore */ }
    results.push({ destinationName: dest.name, drivingMinutes: drivingMin, transitMinutes: transitMin });
  }
  return results;
}

// ─── SSOT Property Data Fetch ───

async function fetchSSOTPropertyData(sbAdmin: any, propertyId: string, tenantId: string) {
  stageLog(0, `Fetching SSOT data for property ${propertyId}`);
  const [propRes, unitsRes, loansRes] = await Promise.all([
    sbAdmin.from("properties").select("*").eq("id", propertyId).eq("tenant_id", tenantId).single(),
    sbAdmin.from("units").select("*").eq("property_id", propertyId).eq("tenant_id", tenantId),
    sbAdmin.from("loans").select("*").eq("property_id", propertyId).eq("tenant_id", tenantId),
  ]);
  if (propRes.error || !propRes.data) {
    stageLog(0, `Property fetch failed: ${propRes.error?.message}`);
    return null;
  }
  const unitIds = (unitsRes.data || []).map((u: any) => u.id);
  let leasesData: any[] = [];
  if (unitIds.length > 0) {
    const { data: leases } = await sbAdmin.from("leases").select("*").in("unit_id", unitIds).eq("tenant_id", tenantId);
    leasesData = leases || [];
  }
  return { property: propRes.data, units: unitsRes.data || [], leases: leasesData, loans: loansRes.data || [] };
}

// ─── ACQ OFFER Data Fetch (MOD-12) ───

async function fetchAcqOfferData(sbAdmin: any, offerId: string, tenantId: string) {
  stageLog(0, `Fetching acq_offers data for offer ${offerId}`);
  const { data, error } = await sbAdmin
    .from("acq_offers")
    .select("*")
    .eq("id", offerId)
    .eq("tenant_id", tenantId)
    .single();
  if (error || !data) {
    stageLog(0, `Offer fetch failed: ${error?.message}`);
    return null;
  }
  return data;
}

/** Property type mapping for expose data */
const OFFER_TYPE_MAP: Record<string, string> = {
  'Mehrfamilienhaus': 'MFH', 'MFH': 'MFH', 'mfh': 'MFH',
  'Wohnhaus': 'MFH', 'Wohn- und Geschäftshaus': 'Mixed',
  'Eigentumswohnung': 'ETW', 'ETW': 'ETW', 'etw': 'ETW', 'Wohnung': 'ETW',
  'Einfamilienhaus': 'EFH', 'EFH': 'EFH', 'efh': 'EFH',
  'Doppelhaushälfte': 'DHH', 'DHH': 'DHH', 'dhh': 'DHH', 'Reihenhaus': 'DHH',
  'Gewerbe': 'Gewerbe', 'Büro': 'Gewerbe', 'Laden': 'Gewerbe',
  'Mixed': 'Mixed', 'mixed': 'Mixed', 'Gemischt': 'Mixed',
};

function buildSnapshotFromOffer(offer: any): Record<string, any> {
  const ed = (offer.extracted_data || {}) as Record<string, any>;
  const effectivePrice = offer.price_counter ?? offer.price_asking ?? null;

  let netColdRentMonthly: number | null = null;
  if (offer.noi_indicated && offer.noi_indicated > 0) {
    netColdRentMonthly = Math.round(offer.noi_indicated / 12);
  } else if (effectivePrice && offer.yield_indicated && offer.yield_indicated > 0) {
    netColdRentMonthly = Math.round((effectivePrice * (offer.yield_indicated / 100)) / 12);
  } else if (ed.monthly_rent || ed.kaltmiete || ed.net_cold_rent) {
    const rent = ed.monthly_rent ?? ed.kaltmiete ?? ed.net_cold_rent;
    netColdRentMonthly = typeof rent === 'number' ? rent : null;
  }

  const rawType = ed.property_type ?? ed.objektart ?? ed.object_type ?? '';
  const objectType = OFFER_TYPE_MAP[rawType] || rawType || 'MFH';
  const yearBuilt = offer.year_built ?? ed.year_built ?? ed.baujahr ?? null;
  const areaSqm = offer.area_sqm ?? ed.living_area_sqm ?? ed.wohnflaeche ?? null;
  const unitsCount = offer.units_count ?? ed.units_count ?? ed.wohneinheiten ?? null;
  const rentPerSqm = netColdRentMonthly && areaSqm && areaSqm > 0
    ? Math.round((netColdRentMonthly / areaSqm) * 100) / 100
    : null;

  return {
    source_mode: 'DRAFT_INTAKE',
    address: offer.address || ed.address || ed.adresse || '',
    city: offer.city || ed.city || ed.stadt || ed.ort || '',
    postal_code: offer.postal_code || ed.postal_code || ed.plz || '',
    object_type: objectType,
    living_area_sqm: areaSqm,
    plot_area_sqm: ed.plot_area_sqm ?? ed.grundstuecksflaeche ?? null,
    rooms: ed.rooms ?? ed.zimmer ?? null,
    units_count: unitsCount,
    unit_count_actual: unitsCount,
    year_built: yearBuilt,
    condition: ed.condition ?? ed.zustand ?? null,
    energy_class: ed.energy_class ?? ed.energieklasse ?? null,
    energy_certificate_value: ed.energy_certificate_value ?? ed.energiekennwert ?? null,
    heating_type: ed.heating_type ?? ed.heizungsart ?? null,
    energy_source: ed.energy_source ?? ed.energietraeger ?? null,
    ownership_share_percent: null,
    asking_price: effectivePrice,
    purchase_price: effectivePrice,
    acquisition_costs: null,
    net_cold_rent_monthly: netColdRentMonthly,
    net_cold_rent_per_sqm: rentPerSqm,
    hausgeld_monthly: ed.hausgeld ?? ed.hausgeld_monthly ?? null,
    parking_spots: ed.parking_spaces ?? ed.stellplaetze ?? null,
    lat: ed.latitude ?? ed.lat ?? null,
    lng: ed.longitude ?? ed.lng ?? null,
    rental_status: ed.vacancy_rate != null
      ? (ed.vacancy_rate === 0 ? 'fully_rented' : 'partially_rented')
      : (netColdRentMonthly ? 'unknown_rented' : null),
    legal_title: null,
    existing_loan: null,
    mfh_multi_unit: objectType === 'MFH' && unitsCount != null && unitsCount > 1,
    units_detail: [],
    avg_unit_area: unitsCount && areaSqm && unitsCount > 1
      ? Math.round(areaSqm / unitsCount)
      : null,
    core_renovated: ed.core_renovated ?? ed.kernsaniert ?? false,
    renovation_year: ed.renovation_year ?? ed.sanierungsjahr ?? null,
    construction_type: ed.construction_type ?? ed.bauweise ?? null,
    floor_count: ed.floor_count ?? ed.geschosse ?? ed.etagen ?? null,
    commercial_area_sqm: ed.commercial_area_sqm ?? ed.gewerbeflaeche ?? null,
    vacancy_rate: ed.vacancy_rate ?? ed.leerstandsquote ?? null,
    provider_name: offer.provider_name ?? null,
    provider_contact: offer.provider_contact ?? null,
  };
}

function buildServerSSOTSnapshot(ssotData: any): Record<string, any> {
  const p = ssotData.property;
  const units = ssotData.units || [];
  const leases = ssotData.leases || [];
  const loans = ssotData.loans || [];

  const totalArea = units.reduce((s: number, u: any) => s + (u.area_sqm || 0), 0) || p.total_area_sqm || null;
  const totalRooms = units.reduce((s: number, u: any) => s + (u.rooms || 0), 0) || null;
  const totalHausgeld = units.reduce((s: number, u: any) => s + (u.hausgeld_monthly || 0), 0) || null;
  const totalParking = units.reduce((s: number, u: any) => s + (u.parking_count || 0), 0) || null;

  const activeLeases = leases.filter((l: any) => l.status === 'active' || l.status === 'aktiv');
  const totalRent = activeLeases.reduce((s: number, l: any) => s + (l.rent_cold_eur || 0), 0) || null;
  const primaryLoan = loans.length > 0 ? loans[0] : null;

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

  // V9.2: MFH multi-unit detection — now also uses unit_count_actual
  const isMfh = ['MFH', 'mfh', 'Mehrfamilienhaus'].includes(p.property_type || '');
  const unitCountActual = p.unit_count_actual || null;
  const mfhMultiUnit = isMfh && (units.length > 1 || (unitCountActual != null && unitCountActual > 1));

  // Build units_detail — if unit_count_actual > 1 but only 1 unit record, generate synthetic units
  let unitsDetail: any[] = [];
  if (units.length > 1) {
    unitsDetail = units.map((u: any) => {
      const unitLease = activeLeases.find((l: any) => l.unit_id === u.id);
      return {
        id: u.id,
        area_sqm: u.area_sqm || 0,
        rooms: u.rooms || null,
        floor: u.floor || null,
        rent_cold: unitLease?.rent_cold_eur || u.current_monthly_rent || null,
      };
    });
  } else if (mfhMultiUnit && unitCountActual && unitCountActual > 1 && totalArea) {
    // Synthetic unit generation: split total area evenly
    const perUnitArea = Math.round(totalArea / unitCountActual);
    const perUnitRent = totalRent ? Math.round(totalRent / unitCountActual) : null;
    for (let i = 0; i < unitCountActual; i++) {
      unitsDetail.push({
        id: `synthetic-${i + 1}`,
        area_sqm: perUnitArea,
        rooms: null,
        floor: null,
        rent_cold: perUnitRent,
      });
    }
    stageLog(0, `MFH: Generated ${unitCountActual} synthetic units from unit_count_actual (${perUnitArea}m² each)`);
  } else if (units.length > 0) {
    unitsDetail = units.map((u: any) => {
      const unitLease = activeLeases.find((l: any) => l.unit_id === u.id);
      return {
        id: u.id,
        area_sqm: u.area_sqm || 0,
        rooms: u.rooms || null,
        floor: u.floor || null,
        rent_cold: unitLease?.rent_cold_eur || u.current_monthly_rent || null,
      };
    });
  }

  // V9.2: For MFH multi-unit, calculate average unit size for comp filtering
  const effectiveUnitCount = mfhMultiUnit ? (unitCountActual || units.length) : units.length;
  const avgUnitArea = mfhMultiUnit && effectiveUnitCount > 0 && totalArea
    ? Math.round(totalArea / effectiveUnitCount)
    : null;

  // V9.2: Kernsanierung / Renovation data
  const coreRenovated = p.core_renovated || false;
  const renovationYear = p.renovation_year || null;

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
    unit_count_actual: unitCountActual,
    year_built: p.year_built || null,
    condition: p.condition_grade || null,
    energy_class: p.energy_class || null,
    energy_certificate_value: units[0]?.energy_certificate_value || null,
    heating_type: p.heating_type || null,
    energy_source: p.energy_source || null,
    ownership_share_percent: p.ownership_share_percent || null,
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
    // V9.2: MFH unit-aware fields
    mfh_multi_unit: mfhMultiUnit,
    units_detail: unitsDetail,
    avg_unit_area: avgUnitArea,
    // V9.2: Kernsanierung
    core_renovated: coreRenovated,
    renovation_year: renovationYear,
  };
}

// ─── Main Handler ───

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
  const googleMapsKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");

  if (!lovableApiKey) return json({ error: "LOVABLE_API_KEY not configured" }, 500);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    const sbUser = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await sbUser.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) return json({ error: "Unauthorized" }, 401);

    const userId = claimsData.claims.sub as string;
    const { data: profile } = await sbUser.from("profiles").select("active_tenant_id").eq("id", userId).maybeSingle();
    if (!profile?.active_tenant_id) return json({ error: "No active tenant" }, 400);
    const tenantId = profile.active_tenant_id;

    const sbAdmin = createClient(supabaseUrl, serviceKey);
    const body = await req.json();
    const { action } = body;

    // ════════════════════════════════════════════
    // ACTION: preflight
    // ════════════════════════════════════════════
    if (action === "preflight") {
      const { property_id } = body;
      const sourceMode = property_id ? "SSOT_FINAL" : "DRAFT_INTAKE";

      const { data: creditData } = await sbAdmin.rpc("rpc_credit_preflight", {
        p_tenant_id: tenantId, p_required_credits: CREDITS_REQUIRED, p_action_code: ACTION_CODE,
      });

      let ssotSummary: any = null;
      let warnings: any[] = [];
      let blockers: any[] = [];

      if (property_id) {
        const ssotData = await fetchSSOTPropertyData(sbAdmin, property_id, tenantId);
        if (ssotData) {
          const p = ssotData.property as any;
          ssotSummary = {
            address: p.address, city: p.city,
            type: p.property_type, units_count: ssotData.units.length,
            leases_count: ssotData.leases.length, loans_count: ssotData.loans.length,
            has_legal_data: !!(p.land_register_court || p.parcel_number),
          };

          // V9.2: KI-Preflight Validation — deterministic checks
          const isMfh = ['MFH', 'mfh', 'Mehrfamilienhaus'].includes(p.property_type || '');
          const unitCountActual = p.unit_count_actual || null;
          const totalArea = ssotData.units.reduce((s: number, u: any) => s + (u.area_sqm || 0), 0) || p.total_area_sqm || 0;
          const activeLeases = ssotData.leases.filter((l: any) => l.status === 'active' || l.status === 'aktiv');
          const totalRent = activeLeases.reduce((s: number, l: any) => s + (l.rent_cold_eur || 0), 0);

          // Check: MFH with only 1 unit and no unit_count_actual
          if (isMfh && ssotData.units.length <= 1 && !unitCountActual) {
            warnings.push({
              field: 'unit_count_actual',
              severity: 'warning',
              message: 'MFH mit nur 1 Einheit erfasst. Anzahl Wohneinheiten nicht angegeben — Bewertung erfolgt als Einfamilienhaus.',
              suggestedAction: 'Tragen Sie die tatsächliche Anzahl der Wohneinheiten in der Immobilienakte ein.',
            });
          }

          // Check: Core renovation without year
          if (p.core_renovated && !p.renovation_year) {
            warnings.push({
              field: 'renovation_year',
              severity: 'warning',
              message: 'Kernsanierung markiert, aber kein Sanierungsjahr angegeben — Modernisierungsbonus wird nicht berechnet.',
              suggestedAction: 'Bitte das Sanierungsjahr in der Immobilienakte ergänzen.',
            });
          }

          // Check: No address
          if (!p.address || !p.city) {
            blockers.push({
              field: 'address',
              severity: 'blocker',
              message: 'Adresse oder Stadt fehlt — keine Bewertung ohne Standortdaten möglich.',
              suggestedAction: 'Adresse und Stadt in der Immobilienakte eintragen.',
            });
          }

          // Check: No rent and no asking price
          if (totalRent <= 0 && !p.market_value && !p.purchase_price) {
            blockers.push({
              field: 'pricing',
              severity: 'blocker',
              message: 'Keine Miete, kein Marktwert und kein Kaufpreis vorhanden — Ertragswertberechnung nicht möglich.',
              suggestedAction: 'Mindestens Mietdaten oder einen Kaufpreis/Marktwert eintragen.',
            });
          }

          // Check: Unrealistic rent per sqm
          if (totalRent > 0 && totalArea > 0) {
            const rentPerSqm = totalRent / totalArea;
            if (rentPerSqm < 2) {
              warnings.push({
                field: 'rent_per_sqm',
                severity: 'warning',
                message: `Kaltmiete sehr niedrig: ${rentPerSqm.toFixed(2)} €/m². Prüfen Sie, ob die Mietangabe korrekt ist.`,
                suggestedAction: 'Miethöhe in den Mietverhältnissen prüfen.',
              });
            } else if (rentPerSqm > 30) {
              warnings.push({
                field: 'rent_per_sqm',
                severity: 'warning',
                message: `Kaltmiete ungewöhnlich hoch: ${rentPerSqm.toFixed(2)} €/m². Prüfen Sie die Mietangabe.`,
                suggestedAction: 'Miethöhe in den Mietverhältnissen prüfen.',
              });
            }
          }

          // Check: No year built
          if (!p.year_built) {
            warnings.push({
              field: 'year_built',
              severity: 'warning',
              message: 'Kein Baujahr angegeben — Restnutzungsdauer wird mit Fallback 1980 berechnet.',
              suggestedAction: 'Baujahr in der Immobilienakte ergänzen.',
            });
          }

          // Check: No plot area
          if (!p.plot_area_sqm) {
            warnings.push({
              field: 'plot_area_sqm',
              severity: 'warning',
              message: 'Keine Grundstücksfläche angegeben — wird per Heuristik geschätzt.',
              suggestedAction: 'Grundstücksfläche im Grundbuch-Block der Immobilienakte eintragen.',
            });
          }
          }

          // V9.2: AI-based deeper validation if lovableApiKey available
          if (lovableApiKey && warnings.length > 0) {
            try {
              const aiValidationResult = await callAI(
                lovableApiKey,
                "google/gemini-2.5-flash-lite",
                `Du bist ein Immobiliensachverständiger. Prüfe die folgenden Objektdaten auf Plausibilität und logische Widersprüche.
Antworte AUSSCHLIESSLICH mit dem JSON-Funktionsaufruf.`,
                `Objektdaten:
- Typ: ${p.property_type}
- Adresse: ${p.address}, ${p.postal_code} ${p.city}
- Baujahr: ${p.year_built || 'unbekannt'}
- Wohnfläche: ${totalArea}m²
- Einheiten DB: ${ssotData.units.length}
- Einheiten tatsächlich: ${unitCountActual || 'nicht angegeben'}
- Kernsanierung: ${p.core_renovated ? 'Ja' : 'Nein'}
- Sanierungsjahr: ${p.renovation_year || 'nicht angegeben'}
- Kaltmiete: ${totalRent}€/Monat
- Grundstück: ${p.plot_area_sqm || 'nicht angegeben'}m²

Bereits erkannte Probleme: ${warnings.map((w: any) => w.message).join('; ')}

Gibt es weitere logische Widersprüche oder Auffälligkeiten?`,
                [{
                  type: "function",
                  function: {
                    name: "report_validation",
                    description: "Report validation findings",
                    parameters: {
                      type: "object",
                      properties: {
                        additional_warnings: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              field: { type: "string" },
                              message: { type: "string" },
                              suggested_action: { type: "string" },
                            },
                            required: ["field", "message"],
                          },
                        },
                      },
                      required: ["additional_warnings"],
                    },
                  },
                }],
                { type: "function", function: { name: "report_validation" } },
              );
              if (aiValidationResult?.additional_warnings) {
                for (const w of aiValidationResult.additional_warnings) {
                  warnings.push({
                    field: w.field || 'ai_check',
                    severity: 'warning',
                    message: w.message,
                    suggestedAction: w.suggested_action || undefined,
                  });
                }
              }
            } catch (e) {
              stageLog(0, `AI preflight validation error: ${e}`);
            }
          }
        }
      }

      return json({
        success: true,
        preflight: {
          creditsCost: CREDITS_REQUIRED,
          credits_available: creditData?.available_credits ?? 0,
          can_proceed: (creditData?.allowed ?? false) && blockers.length === 0,
          sources: ssotSummary ? [{ name: `SSOT: ${ssotSummary.address}, ${ssotSummary.city}`, type: "ssot", pages: 0 }] : [],
          totalEstimatedPages: 0,
          limitsOk: blockers.length === 0,
          googleApiAvailable: !!googleMapsKey,
          scraperAvailable: !!firecrawlKey,
          sourceMode,
          sourceModeLabel: sourceMode === "SSOT_FINAL" ? "Datenbasis: MOD-04 SSOT (Final)" : "Datenbasis: Exposé Draft (Intake)",
          ssotSummary,
          warnings,
          blockers,
        },
      });
    }

    // ════════════════════════════════════════════
    // ACTION: run — Execute full 6-stage pipeline
    // ════════════════════════════════════════════
    if (action === "run") {
      const { source_context, source_ref, property_id } = body;
      const tracker = new StageTracker();
      const sourceMode = property_id ? "SSOT_FINAL" : "DRAFT_INTAKE";

      // ─── Stage 0: Preflight + Credit Deduct ───
      tracker.start(0);
      stageLog(0, `Source mode: ${sourceMode}`);

      const { data: deductData, error: deductErr } = await sbAdmin.rpc("rpc_credit_deduct", {
        p_tenant_id: tenantId, p_credits: CREDITS_REQUIRED, p_action_code: ACTION_CODE,
        p_ref_type: "valuation_case", p_ref_id: null, p_user_id: userId,
      });
      if (deductErr || !deductData) return json({ error: "Insufficient credits" }, 402);

      const { data: caseRow, error: caseErr } = await sbAdmin
        .from("valuation_cases")
        .insert({
          tenant_id: tenantId, source_context: source_context || "MOD_04",
          source_ref: source_ref || null, source_mode: sourceMode,
          property_id: property_id || null, status: "running",
          credits_charged: CREDITS_REQUIRED, stage_current: 0, created_by: userId,
        })
        .select("id").single();
      if (caseErr || !caseRow) return json({ error: "Failed to create case" }, 500);

      const caseId = caseRow.id;
      stageLog(0, `Case created: ${caseId}`);

      let ssotData: any = null;
      let ssotSnapshot: Record<string, any> = {};
      if (property_id) {
        ssotData = await fetchSSOTPropertyData(sbAdmin, property_id, tenantId);
        if (ssotData) {
          ssotSnapshot = buildServerSSOTSnapshot(ssotData);
          stageLog(0, `SSOT loaded: ${ssotData.units.length} units, ${ssotData.leases.length} leases`);
        }
      }
      tracker.end(0);

      async function updateStage(stage: number) {
        await sbAdmin.from("valuation_cases")
          .update({ stage_current: stage, stage_timings: tracker.toJSON(), updated_at: new Date().toISOString() })
          .eq("id", caseId);
      }

      try {
        // ─── Stage 1: Intake ───
        tracker.start(1);
        stageLog(1, "Starting intake");
        await updateStage(1);

        const snapshot: Record<string, any> = { ...ssotSnapshot };
        const evidenceMap: any[] = [];
        const diffs: any[] = [];

        // Add SSOT evidence
        for (const [key, val] of Object.entries(ssotSnapshot)) {
          if (val !== null && val !== undefined && val !== "" && typeof val !== "object") {
            evidenceMap.push({ field: key, value: val, source: "SSOT", confidence: 1.0 });
          }
        }

        const criticalFields = ["address", "object_type", "living_area_sqm", "asking_price"];
        const filledCritical = criticalFields.filter((cf) => snapshot[cf] != null).length;
        const completeness = sourceMode === "SSOT_FINAL" ? Math.max(Math.round((filledCritical / criticalFields.length) * 100), 75) : Math.round((filledCritical / criticalFields.length) * 100);

        const dataQuality = {
          completeness,
          critical_gaps: criticalFields.filter((cf) => snapshot[cf] == null),
          global_confidence: sourceMode === "SSOT_FINAL" ? 85 : 50,
          total_fields: Object.keys(ssotSnapshot).length,
          belegt: evidenceMap.length,
          missing: criticalFields.filter((cf) => snapshot[cf] == null).length,
          source_mode: sourceMode,
        };

        await sbAdmin.from("valuation_inputs").insert({
          case_id: caseId, canonical_snapshot: snapshot,
          extracted_fields: [], missing_fields: [], assumptions: [],
          evidence_map: evidenceMap, data_quality: dataQuality,
        });

        tracker.end(1);

        // ─── Stage 2: AI Research (Gemini) + Location Analysis ───
        tracker.start(2);
        stageLog(2, "Starting AI research + location analysis");
        await updateStage(2);

        // V9.0: Parallel Gemini research
        const objectType = snapshot.object_type || "mfh";
        const city = snapshot.city || "";
        const postalCode = snapshot.postal_code || "";
        const yearBuilt = snapshot.year_built || null;
        const condition = snapshot.condition || null;

        // V9.1: For MFH multi-unit, research as "Wohnung" (ETW) for accurate per-unit pricing
        const researchObjectType = snapshot.mfh_multi_unit ? "Eigentumswohnung" : objectType;

        const [geminiLZ, geminiBRW, geminiVM] = await Promise.all([
          researchLiegenschaftszins(lovableApiKey!, objectType, city, postalCode, yearBuilt),
          researchBodenrichtwert(lovableApiKey!, snapshot.address || "", city, postalCode),
          researchVergleichsmieten(lovableApiKey!, researchObjectType, city, postalCode, yearBuilt, condition),
        ]);

        const geminiResearch = {
          liegenschaftszins: geminiLZ,
          bodenrichtwert: geminiBRW,
          vergleichsmieten: geminiVM,
          researched_at: new Date().toISOString(),
        };

        stageLog(2, `Gemini research complete: LZ=${geminiLZ?.marktwert_zins}, BRW=${geminiBRW?.bodenrichtwert_eur_sqm}, VM=${geminiVM?.miete_median}`);

        // Location Analysis (Google Maps) — V9.3 Enhanced
        let locationAnalysis: any = { available: false };
        const address = [snapshot.address, snapshot.postal_code, snapshot.city].filter(Boolean).join(', ');

        if (address && googleMapsKey) {
          let geo: any = null;
          if (snapshot.lat && snapshot.lng && sourceMode === "SSOT_FINAL") {
            geo = { lat: snapshot.lat, lng: snapshot.lng, formatted_address: address, quality: "SSOT" };
          } else {
            geo = await googleGeocode(address, googleMapsKey);
          }

          if (geo) {
            snapshot.lat = geo.lat;
            snapshot.lng = geo.lng;
            snapshot.formatted_address = geo.formatted_address;

            // V9.3: Extended POI categories for comprehensive infrastructure analysis
            const categories = [
              { type: "transit_station", label: "ÖPNV", radius: 2000 },
              { type: "supermarket", label: "Alltag", radius: 1500 },
              { type: "school", label: "Schulen", radius: 2500 },
              { type: "doctor", label: "Ärzte", radius: 2000 },
              { type: "park", label: "Freizeit", radius: 1500 },
              { type: "hospital", label: "Krankenhaus", radius: 5000 },
              { type: "pharmacy", label: "Apotheke", radius: 1500 },
              { type: "restaurant", label: "Gastronomie", radius: 1000 },
              { type: "gym", label: "Sport", radius: 2000 },
              { type: "bank", label: "Banken", radius: 1500 },
            ];

            const poiResults: any[] = [];
            // Run POI searches in parallel for speed
            const poiPromises = categories.map(async (cat) => {
              try {
                const pois = await googlePlacesNearby(geo.lat, geo.lng, cat.type, googleMapsKey!, cat.radius);
                return { category: cat.label, type: cat.type, pois };
              } catch (e) {
                stageLog(2, `Places error for ${cat.type}: ${e}`);
                return { category: cat.label, type: cat.type, pois: [] };
              }
            });
            const poiSettled = await Promise.all(poiPromises);
            poiResults.push(...poiSettled);

            // V9.3: Multiple map types
            const microMap = await googleStaticMap(geo.lat, geo.lng, googleMapsKey, 16, "600x400");
            const macroMap = await googleStaticMap(geo.lat, geo.lng, googleMapsKey, 12, "600x400");
            const streetView = googleStreetViewUrl(geo.lat, geo.lng, googleMapsKey);
            const satelliteUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${geo.lat},${geo.lng}&zoom=18&size=640x400&maptype=satellite&markers=color:red|${geo.lat},${geo.lng}&key=${googleMapsKey}`;
            const hybridUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${geo.lat},${geo.lng}&zoom=16&size=640x400&maptype=hybrid&markers=color:red|${geo.lat},${geo.lng}&key=${googleMapsKey}`;
            const terrainUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${geo.lat},${geo.lng}&zoom=13&size=640x400&maptype=terrain&markers=color:red|${geo.lat},${geo.lng}&key=${googleMapsKey}`;

            // V9.3: Extended reachability — find major infrastructure
            let reachability: any[] = [];
            try {
              const routeDestinations: { name: string; lat: number; lng: number }[] = [];

              // City center
              if (city) {
                const cityGeo = await googleGeocode(city + " Hauptbahnhof", googleMapsKey);
                if (cityGeo) routeDestinations.push({ name: `${city} Hbf`, lat: cityGeo.lat, lng: cityGeo.lng });
              }

              // Nearest transit from POIs
              const transitPois = poiResults.find((p) => p.type === "transit_station")?.pois || [];
              if (transitPois.length > 0 && transitPois[0].address) {
                const stationGeo = await googleGeocode(transitPois[0].address + " " + city, googleMapsKey);
                if (stationGeo) routeDestinations.push({ name: transitPois[0].name || "Nächste Haltestelle", lat: stationGeo.lat, lng: stationGeo.lng });
              }

              // Nearest airport
              const airportGeo = await googleGeocode(`Flughafen ${city}`, googleMapsKey);
              if (airportGeo) routeDestinations.push({ name: "Flughafen", lat: airportGeo.lat, lng: airportGeo.lng });

              // Nearest Autobahn — search for highway on-ramp
              const autobahnPois = await googlePlacesNearby(geo.lat, geo.lng, "gas_station", googleMapsKey!, 5000);
              if (autobahnPois.length > 0) {
                // Use nearest gas station as proxy for Autobahn access
                const nearestGas = autobahnPois[0];
                if (nearestGas.address) {
                  const gasGeo = await googleGeocode(nearestGas.address + " " + city, googleMapsKey);
                  if (gasGeo) routeDestinations.push({ name: "Autobahnauffahrt (Nähe)", lat: gasGeo.lat, lng: gasGeo.lng });
                }
              }

              // Hospital
              const hospitalPois = poiResults.find((p) => p.type === "hospital")?.pois || [];
              if (hospitalPois.length > 0 && hospitalPois[0].address) {
                const hospGeo = await googleGeocode(hospitalPois[0].address + " " + city, googleMapsKey);
                if (hospGeo) routeDestinations.push({ name: hospitalPois[0].name || "Krankenhaus", lat: hospGeo.lat, lng: hospGeo.lng });
              }

              if (routeDestinations.length > 0) {
                reachability = await googleRoutesMatrix(geo.lat, geo.lng, routeDestinations, googleMapsKey);
              }
            } catch (e) { stageLog(2, `Routes error: ${e}`); }

            // Score calculation
            const scoreByCategory = poiResults.map((cat) => {
              const avgDist = cat.pois.length > 0
                ? cat.pois.reduce((s: number, p: any) => s + p.distance_m, 0) / cat.pois.length
                : 5000;
              const score = Math.max(0, Math.min(100, Math.round(100 - (avgDist / 50))));
              return { dimension: cat.category, score, topPois: cat.pois, avgDistance: Math.round(avgDist) };
            });

            const globalScore = Math.round(scoreByCategory.reduce((s, c) => s + c.score, 0) / scoreByCategory.length);

            // Prefetch map images as Base64 for CORS-free PDF embedding
            const fetchImageBase64 = async (url: string): Promise<string | null> => {
              try {
                const resp = await fetch(url);
                if (!resp.ok) return null;
                const buf = await resp.arrayBuffer();
                const bytes = new Uint8Array(buf);
                let binary = '';
                for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
                const contentType = resp.headers.get('content-type') || 'image/png';
                return `data:${contentType};base64,${btoa(binary)}`;
              } catch { return null; }
            };

            const [microB64, macroB64, streetB64, satB64, hybridB64] = await Promise.all([
              fetchImageBase64(microMap),
              fetchImageBase64(macroMap),
              fetchImageBase64(streetView),
              fetchImageBase64(satelliteUrl),
              fetchImageBase64(hybridUrl),
            ]);
            stageLog(2, `Map Base64 prefetch: micro=${!!microB64}, macro=${!!macroB64}, street=${!!streetB64}, sat=${!!satB64}, hybrid=${!!hybridB64}`);

            locationAnalysis = {
              available: true, geocode: geo, scores: scoreByCategory,
              global_score: globalScore, pois: poiResults, reachability,
              maps: { micro: microMap, macro: macroMap, street_view: streetView, satellite: satelliteUrl, hybrid: hybridUrl, terrain: terrainUrl },
              maps_base64: { micro: microB64, macro: macroB64, street_view: streetB64, satellite: satB64, hybrid: hybridB64 },
            };

            // V9.3: Rich multi-paragraph narrative from AI
            try {
              const poiSummary = scoreByCategory.map(c => `${c.dimension}: ${c.score}/100 (Ø ${c.avgDistance}m, ${c.topPois.length} Treffer${c.topPois.length > 0 ? ': ' + c.topPois.slice(0, 2).map((p: any) => `${p.name} (${p.distance_m}m)`).join(', ') : ''})`).join('\n');
              const reachSummary = reachability.map((r: any) => `${r.destinationName}: ${r.drivingMinutes || '?'} Min. Pkw, ${r.transitMinutes || '?'} Min. ÖPNV`).join('\n');

              locationAnalysis.narrative = await callAI(
                lovableApiKey!, "google/gemini-2.5-flash",
                `Du bist ein erfahrener Immobiliengutachter und erstellst detaillierte Standortanalysen für Kurzgutachten.

WICHTIG: Schreibe einen professionellen, mehrteiligen Standortbericht mit folgender Struktur:
1. **Makrolage** (1 Absatz): Stadt/Region, wirtschaftliche Bedeutung, Bevölkerungsentwicklung
2. **Mikrolage** (1 Absatz): Unmittelbare Umgebung, Straßenbild, Bebauungsstruktur, Lärmbelastung
3. **Infrastruktur** (1 Absatz): ÖPNV-Anbindung, Schulen, Ärzte, Einkaufsmöglichkeiten, Gastronomie mit konkreten Entfernungen
4. **Erreichbarkeit** (1 Absatz): Fahrzeiten zu Hauptbahnhof, Flughafen, Autobahn
5. **Bewertung** (1 Absatz): Gesamteinschätzung der Lagequalität für Wohnimmobilien, Zielgruppe

Nutze sachlichen Gutachterstil. Nenne konkrete Namen und Entfernungen aus den POI-Daten.
Mindestens 250 Wörter, maximal 400 Wörter.`,
                `Standortanalyse für: ${snapshot.formatted_address || address}
Objektart: ${snapshot.object_type || 'Wohnimmobilie'}
Baujahr: ${snapshot.year_built || 'unbekannt'}
Gesamt-Score: ${globalScore}/100

=== Infrastruktur-POIs ===
${poiSummary}

=== Erreichbarkeit ===
${reachSummary || 'Keine Daten verfügbar'}

=== Koordinaten ===
Lat: ${geo.lat}, Lng: ${geo.lng}`,
              );
            } catch (_) { locationAnalysis.narrative = null; }

            // V9.3: AI property assessment text
            try {
              locationAnalysis.property_assessment = await callAI(
                lovableApiKey!, "google/gemini-2.5-flash",
                `Du bist Immobiliensachverständiger und beschreibst Bestandsimmobilien für Kurzgutachten.

Erstelle eine professionelle Objektbeschreibung mit:
1. **Gebäudecharakteristik**: Typ, Baujahr, Bauweise, Geschossigkeit
2. **Ausstattung & Zustand**: Bewertung des baulichen Zustands, Modernisierungsgrad
3. **Nutzungspotenzial**: Aktuelle Nutzung, Vermietungssituation, Optimierungspotenzial
4. **Stärken & Schwächen**: 3 Stärken, 3 Risiken/Schwächen des Objekts

Sachlicher Gutachterstil. 200-300 Wörter.`,
                `Objekt: ${snapshot.formatted_address || address}
Typ: ${calcObjectType}
Baujahr: ${sachYearBuilt}
Fläche: ${livingArea}m²
Einheiten: ${snapshot.units_detail?.length || snapshot.units_count || 1}
Zustand: ${snapshot.condition || 'nicht angegeben'}
Energieklasse: ${snapshot.energy_class || 'nicht angegeben'}
Kernsanierung: ${coreRenovated ? `Ja (${renovationYear})` : 'Nein'}
Kaltmiete: ${netRent}€/Monat
Hausgeld: ${snapshot.hausgeld_monthly || 'n/a'}€/Monat
Stellplätze: ${snapshot.parking_spots || 'n/a'}
Vermietungsstatus: ${snapshot.rental_status || 'unbekannt'}
Kaufpreis/Marktwert: ${askingPrice}€`,
              );
            } catch (_) { locationAnalysis.property_assessment = null; }
          }
        }

        tracker.end(2);

        // ─── Stage 3: Portal Comps ───
        tracker.start(3);
        stageLog(3, "Starting comps search");
        await updateStage(3);

        let compStats: any = { available: false };
        let compPostings: any[] = [];
        const livingArea = Number(snapshot.living_area_sqm) || 0;

        // V9.1: For MFH multi-unit, search for "Wohnung" (ETW) comps and filter by avg unit size
        const isMfhMultiUnit = !!snapshot.mfh_multi_unit;
        const compSearchArea = isMfhMultiUnit ? (snapshot.avg_unit_area || livingArea) : livingArea;
        const compSearchType = isMfhMultiUnit ? "Wohnung" : objectType;

        if (city && firecrawlKey) {
          try {
            const queries = isMfhMultiUnit
              ? [`Wohnung kaufen ${city}`, `Eigentumswohnung kaufen ${city} ${snapshot.postal_code || ''}`]
              : [`${objectType} kaufen ${city}`, `Haus kaufen ${city}`];
            let rawResults: any[] = [];
            for (const query of queries) {
              if (rawResults.length > 0) break;
              try {
                const searchResp = await fetch("https://api.firecrawl.dev/v1/search", {
                  method: "POST",
                  headers: { Authorization: `Bearer ${firecrawlKey}`, "Content-Type": "application/json" },
                  body: JSON.stringify({ query, limit: 20, lang: "de", country: "de", scrapeOptions: { formats: ["markdown"] } }),
                });
                const searchData = await searchResp.json();
                rawResults = searchData?.data || [];
                stageLog(3, `"${query}" → ${rawResults.length} results${isMfhMultiUnit ? ' (MFH→ETW mode)' : ''}`);
              } catch (e) { stageLog(3, `Search error: ${e}`); }
            }

            if (rawResults.length > 0) {
              const compTexts = rawResults.slice(0, 15)
                .map((r: any, i: number) => `[${i}] URL: ${r.url}\nTitle: ${r.title}\n${(r.markdown || "").substring(0, 1000)}`)
                .join("\n---\n");

              const compsExtracted = await callAI(
                lovableApiKey!, "google/gemini-2.5-flash",
                `Du extrahierst Vergleichsangebote aus Immobilien-Suchergebnissen. Pro Angebot: title, price (EUR), living_area_sqm, price_per_sqm, rooms, year_built, url, address, portal. Ignoriere Mietwohnungen, Gewerbeobjekte, Grundstücke.`,
                compTexts,
                [{
                  type: "function",
                  function: {
                    name: "extract_comps",
                    description: "Extract comparable listings",
                    parameters: {
                      type: "object",
                      properties: {
                        postings: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              title: { type: "string" }, price: { type: "number" },
                              living_area_sqm: { type: "number" }, price_per_sqm: { type: "number" },
                              rooms: { type: "number" }, year_built: { type: "number" },
                              url: { type: "string" }, address: { type: "string" }, portal: { type: "string" },
                            },
                            required: ["title"],
                          },
                        },
                      },
                      required: ["postings"],
                    },
                  },
                }],
                { type: "function", function: { name: "extract_comps" } },
              );

              const seenUrls = new Set<string>();
              compPostings = (compsExtracted?.postings || [])
                .filter((p: any) => p.price && p.price > 0)
                .map((p: any) => ({
                  ...p,
                  // V9.0: Fix price_per_sqm calculation
                  price_per_sqm: p.price_per_sqm && p.price_per_sqm > 0
                    ? p.price_per_sqm
                    : (p.living_area_sqm && p.living_area_sqm > 0 ? Math.round(p.price / p.living_area_sqm) : null),
                }))
                .filter((p: any) => {
                  if (p.price_per_sqm && (p.price_per_sqm < 500 || p.price_per_sqm > 15000)) return false;
                  // V9.1: For MFH multi-unit, filter comps by avg unit area instead of total area
                  const filterArea = compSearchArea;
                  if (filterArea > 0 && p.living_area_sqm && (p.living_area_sqm < filterArea * 0.5 || p.living_area_sqm > filterArea * 1.5)) return false;
                  if (p.url && seenUrls.has(p.url)) return false;
                  if (p.url) seenUrls.add(p.url);
                  return true;
                });

              if (compPostings.length > 0) {
                const prices = compPostings.map((p: any) => p.price_per_sqm).filter((v: any) => v && v > 0).sort((a: number, b: number) => a - b);
                if (prices.length >= 3) {
                  compStats = {
                    available: true, count_raw: rawResults.length, count_valid: compPostings.length,
                    count_with_price_sqm: prices.length,
                    median_price_sqm: prices[Math.floor(prices.length / 2)],
                    p25: prices[Math.floor(prices.length * 0.25)],
                    p50: prices[Math.floor(prices.length * 0.5)],
                    p75: prices[Math.floor(prices.length * 0.75)],
                    min: prices[0], max: prices[prices.length - 1],
                  };
                }
              }
              stageLog(3, `Found ${compPostings.length} valid comps`);
            }
          } catch (e) { stageLog(3, `Comp search error: ${e}`); }
        }
        tracker.end(3);

        // ─── Stage 4: Deterministic Calculations (Marktwert + Beleihungswert) ───
        tracker.start(4);
        stageLog(4, "Running dual-track calculations (Marktwert + Beleihungswert)");
        await updateStage(4);

        const assumptions: any[] = [];
        const calcObjectType = snapshot.object_type || "other";

        // V9.1: Log MFH multi-unit mode
        if (snapshot.mfh_multi_unit) {
          stageLog(4, `MFH-Einheitenbewertung: ${snapshot.units_detail?.length || 0} Einheiten, Ø ${snapshot.avg_unit_area}m²`);
          assumptions.push({
            text: `MFH mit ${snapshot.units_detail?.length || 0} Wohneinheiten — Vergleichswert basiert auf ETW-Comps (Ø ${snapshot.avg_unit_area}m²) statt MFH-Gesamtvergleich`,
            impact: "high",
          });
        }

        const locationScore = locationAnalysis.global_score || 0;

        // V9.0: Bodenwert — use Gemini research first, then proxy
        let bodenrichtwert: number;
        let bodenrichtwertSource: string;
        if (geminiBRW?.bodenrichtwert_eur_sqm && geminiBRW.bodenrichtwert_eur_sqm > 0) {
          bodenrichtwert = geminiBRW.bodenrichtwert_eur_sqm;
          bodenrichtwertSource = `Gemini-Recherche: ${geminiBRW.quelle || 'KI-basiert'}`;
          assumptions.push({ text: `Bodenrichtwert ${bodenrichtwert} €/m² (${bodenrichtwertSource})`, impact: "high" });
        } else {
          bodenrichtwert = getBodenrichtwertProxy(city, locationScore);
          bodenrichtwertSource = "Score-Proxy (Fallback)";
          assumptions.push({ text: `Bodenrichtwert ${bodenrichtwert} €/m² (${bodenrichtwertSource})`, impact: "high" });
        }

        let plotAreaSqm = Number(snapshot.plot_area_sqm) || 0;
        if (plotAreaSqm <= 0 && livingArea > 0) {
          const heuristicFactor = getPlotAreaHeuristic(calcObjectType);
          plotAreaSqm = Math.round(livingArea * heuristicFactor);
          assumptions.push({ text: `Grundstücksfläche geschätzt: ${livingArea} m² × ${heuristicFactor} = ${plotAreaSqm} m² (Heuristik für ${calcObjectType})`, impact: "medium" });
        }

        const bodenwert = plotAreaSqm > 0 ? Math.round(plotAreaSqm * bodenrichtwert) : 0;

        // V9.0: Liegenschaftszins — use Gemini research first, then fallback
        let liegenschaftszinsMWT: number;
        let liegenschaftszinsSource: string;
        if (geminiLZ?.marktwert_zins && geminiLZ.marktwert_zins > 0 && geminiLZ.marktwert_zins < 0.10) {
          liegenschaftszinsMWT = geminiLZ.marktwert_zins;
          liegenschaftszinsSource = `Gemini-Recherche: ${geminiLZ.quelle || 'KI-basiert'} (${geminiLZ.stichtag || ''})`;
        } else {
          liegenschaftszinsMWT = getLiegenschaftszinsFallback(calcObjectType);
          liegenschaftszinsSource = "Pauschaltabelle (Fallback)";
        }
        assumptions.push({ text: `Liegenschaftszins MWT: ${(liegenschaftszinsMWT * 100).toFixed(2)}% (${liegenschaftszinsSource})`, impact: "high" });

        const netRent = Number(snapshot.net_cold_rent_monthly) || 0;
        const askingPrice = Number(snapshot.asking_price) || 0;
        const sachYearBuilt = Number(snapshot.year_built) || 1980;
        const sachAge = new Date().getFullYear() - sachYearBuilt;
        const gnd = getGesamtnutzungsdauer(calcObjectType);
        let rnd = Math.max(10, gnd - sachAge);

        // V9.2: Modernisierungsbonus bei Kernsanierung (ImmoWertV-konform)
        let modernisierungsbonus = 0;
        const coreRenovated = !!snapshot.core_renovated;
        const renovationYear = Number(snapshot.renovation_year) || 0;
        if (coreRenovated && renovationYear > 0) {
          const currentYear = new Date().getFullYear();
          const yearsSinceRenovation = currentYear - renovationYear;
          // ImmoWertV: Kernsanierung verlängert RND um ~70% der GND minus Jahre seit Sanierung
          modernisierungsbonus = Math.max(0, Math.round(gnd * 0.7) - yearsSinceRenovation);
          const rndBeforeBonus = rnd;
          rnd = Math.max(rnd, Math.min(gnd, rnd + modernisierungsbonus));
          stageLog(4, `Modernisierungsbonus: Kernsanierung ${renovationYear}, Bonus +${modernisierungsbonus} Jahre, RND ${rndBeforeBonus} → ${rnd}`);
          assumptions.push({
            text: `Kernsanierung ${renovationYear}: Modernisierungsbonus +${modernisierungsbonus} Jahre auf RND (${rndBeforeBonus} → ${rnd} Jahre, ImmoWertV-konform)`,
            impact: "high",
          });
        }

        // ═══ 4.1 Ertragswert (Marktwert) ═══
        let ertragswertResult: any = null;
        if (netRent > 0) {
          const annualRent = netRent * 12;
          const bew = CALC.BEWIRTSCHAFTUNG;
          const verwaltung = annualRent * bew.verwaltungPercent;
          const instandhaltung = livingArea * bew.instandhaltungPerSqmYear;
          const mietausfall = annualRent * bew.mietausfallPercent;
          const nichtUmlagefaehig = annualRent * bew.nichtUmlagefaehigPercent;
          const bewirtschaftungAbzug = verwaltung + instandhaltung + mietausfall + nichtUmlagefaehig;
          const bewirtschaftungRate = annualRent > 0 ? bewirtschaftungAbzug / annualRent : 0;
          const reinertrag = annualRent - bewirtschaftungAbzug;
          const bwf = barwertfaktor(liegenschaftszinsMWT, rnd);
          const bodenertrag = bodenwert * liegenschaftszinsMWT;
          const reinertragsanteilGebaeude = reinertrag - bodenertrag;
          const ertragswertGebaeude = Math.round(reinertragsanteilGebaeude * bwf);
          const ertragswert = Math.max(0, ertragswertGebaeude + bodenwert);

          ertragswertResult = {
            method: "ertragswert", value: ertragswert,
            confidence: sourceMode === "SSOT_FINAL" ? 0.85 : 0.7,
            params: {
              annual_rent: annualRent,
              verwaltung: Math.round(verwaltung),
              instandhaltung: Math.round(instandhaltung),
              mietausfall: Math.round(mietausfall),
              nichtUmlagefaehig: Math.round(nichtUmlagefaehig),
              bewirtschaftung_abzug: Math.round(bewirtschaftungAbzug),
              bewirtschaftung_rate: Math.round(bewirtschaftungRate * 100) / 100,
              reinertrag: Math.round(reinertrag),
              cap_rate: liegenschaftszinsMWT,
              cap_rate_source: liegenschaftszinsSource,
              restnutzungsdauer: rnd,
              gesamtnutzungsdauer: gnd,
              alter: sachAge,
              modernisierungsbonus,
              core_renovated: coreRenovated,
              renovation_year: renovationYear || null,
              barwertfaktor: Math.round(bwf * 100) / 100,
              bodenertrag: Math.round(bodenertrag),
              ertragswert_gebaeude: ertragswertGebaeude,
              bodenwert,
              bodenwert_source: bodenrichtwertSource,
              plot_area_sqm: plotAreaSqm,
              bodenrichtwert_eur_sqm: bodenrichtwert,
              gross_yield: askingPrice > 0 ? Math.round((annualRent / askingPrice) * 10000) / 100 : null,
            },
          };
        }

        // ═══ 4.2 Ertragswert (Beleihungswert — BelWertV) ═══
        let ertragswertBelwertv: number = 0;
        if (netRent > 0) {
          const annualRent = netRent * 12;
          const bew = CALC.BEWIRTSCHAFTUNG_BELWERTV;
          const verwaltungBW = annualRent * bew.verwaltungPercent;
          const instandhaltungBW = livingArea * bew.instandhaltungPerSqmYear;
          const mietausfallBW = annualRent * bew.mietausfallPercent;
          const nichtUmlagefaehigBW = annualRent * bew.nichtUmlagefaehigPercent;
          const bwkBelwertv = verwaltungBW + instandhaltungBW + mietausfallBW + nichtUmlagefaehigBW;
          const reinertagBW = annualRent - bwkBelwertv;
          const bwfBW = barwertfaktor(CALC.BELWERTV_LIEGENSCHAFTSZINS, rnd);
          const bodenertragBW = bodenwert * CALC.BELWERTV_LIEGENSCHAFTSZINS;
          const gebErtragsanteilBW = reinertagBW - bodenertragBW;
          const ertragswertGebaeudeBW = Math.round(gebErtragsanteilBW * bwfBW);
          ertragswertBelwertv = Math.max(0, ertragswertGebaeudeBW + bodenwert);
          assumptions.push({ text: `Ertragswert BelWertV: Liegenschaftszins fest 5,0% (§12 BelWertV), BWK konservativ (6% Verwaltung, 15€/m² IH, 4% Mietausfall)`, impact: "high" });
        }

        // ═══ 4.3 Comp Proxy ═══
        // V9.1: For MFH multi-unit, compStats.p50 is based on ETW-comps (€/m² for apartments)
        // but we apply it to TOTAL livingArea — giving the correct higher aggregate value
        let compProxyResult: any = null;
        if (compStats.available && livingArea > 0) {
          const compValue = Math.round(compStats.p50 * livingArea);
          const mfhNote = snapshot.mfh_multi_unit
            ? `MFH-Einheitenbewertung: ${snapshot.units_detail?.length || 0} Einheiten, Ø ${snapshot.avg_unit_area}m², ETW-Comps angewandt auf ${livingArea}m² Gesamtfläche`
            : undefined;
          compProxyResult = {
            method: "comp_proxy", value: compValue,
            confidence: compStats.count_with_price_sqm >= 5 ? 0.6 : 0.4,
            params: {
              median_price_sqm: compStats.p50, living_area: livingArea,
              comp_count: compStats.count_with_price_sqm,
              comp_search_type: snapshot.mfh_multi_unit ? 'ETW (MFH-Einheitenbewertung)' : objectType,
              ...(mfhNote ? { mfh_unit_note: mfhNote } : {}),
            },
          };
        }

        // ═══ 4.4 Sachwert (Marktwert) ═══
        let sachwertResult: any = null;
        if (livingArea > 0) {
          const baseCostSqm = getHerstellkostenSqm(sachYearBuilt);
          const depreciationRate = Math.min(sachAge * CALC.SACHWERT_ANNUAL_DEPRECIATION, CALC.SACHWERT_MAX_DEPRECIATION);
          const gebaeudeSachwert = Math.round(livingArea * baseCostSqm * (1 - depreciationRate));
          const marktanpassung = getMarktanpassungsfaktor(locationScore);
          const sachwert = Math.round((gebaeudeSachwert + bodenwert) * marktanpassung);

          sachwertResult = {
            method: "sachwert_proxy", value: sachwert,
            confidence: bodenwert > 0 ? 0.45 : 0.3,
            params: { base_cost_sqm: baseCostSqm, depreciation: depreciationRate, age: sachAge, gebaeude_sachwert: gebaeudeSachwert, bodenwert, marktanpassung },
          };
        }

        // ═══ 4.5 Sachwert (Beleihungswert) ═══
        let sachwertBelwertv: number = 0;
        if (livingArea > 0) {
          const baseCostSqm = getHerstellkostenSqm(sachYearBuilt);
          const depRate = Math.min(sachAge * CALC.SACHWERT_ANNUAL_DEPRECIATION, CALC.SACHWERT_MAX_DEPRECIATION);
          const gebSachwert = Math.round(livingArea * baseCostSqm * (1 - depRate));
          const mitBaunebenkosten = Math.round(gebSachwert * (1 + CALC.BELWERTV_BAUNEBENKOSTEN));
          sachwertBelwertv = Math.round((mitBaunebenkosten + bodenwert) * (1 - CALC.BELWERTV_SICHERHEITSABSCHLAG));
        }

        // ═══ 4.6 Fuse value band (Marktwert) ═══
        const methods = [ertragswertResult, compProxyResult, sachwertResult].filter(Boolean);
        let valueBand: any = { p25: 0, p50: 0, p75: 0, confidence: 0 };

        if (methods.length > 0) {
          const hasErtrag = !!ertragswertResult;
          const hasComp = !!compProxyResult;
          const hasSach = !!sachwertResult;

          let weightMap: Record<string, number>;
          if (hasErtrag && hasComp && hasSach) weightMap = CALC.METHOD_WEIGHTS_3;
          else if (hasErtrag && hasSach && !hasComp) weightMap = CALC.METHOD_WEIGHTS_2_NO_COMP;
          else if (hasComp && hasSach && !hasErtrag) weightMap = CALC.METHOD_WEIGHTS_2_NO_ERTRAG;
          else { weightMap = {}; for (const m of methods) weightMap[m.method] = 1.0 / methods.length; }

          let totalNormalizedWeight = 0;
          const normalizedEntries = methods.map((m: any) => {
            const baseWeight = weightMap[m.method] || 0.1;
            const normalizedWeight = baseWeight * m.confidence;
            totalNormalizedWeight += normalizedWeight;
            return { method: m.method, value: m.value, baseWeight, confidence: m.confidence, normalizedWeight };
          });

          const p50 = totalNormalizedWeight > 0
            ? Math.round(normalizedEntries.reduce((sum: number, e: any) => sum + e.value * (e.normalizedWeight / totalNormalizedWeight), 0))
            : 0;

          const allValues = methods.map((m: any) => m.value).sort((a: number, b: number) => a - b);
          const divergence = allValues.length > 1 && p50 > 0 ? (allValues[allValues.length - 1] - allValues[0]) / p50 : 0.15;
          const halfSpread = Math.max(0.05, Math.min(0.20, divergence / 2));

          valueBand = {
            p25: Math.round(p50 * (1 - halfSpread)),
            p50,
            p75: Math.round(p50 * (1 + halfSpread)),
            confidence: Math.round((methods.reduce((s: any, m: any) => s + m.confidence, 0) / methods.length) * 100),
            weighting: normalizedEntries.map((e: any) => ({
              method: e.method, value: e.value,
              weight: Math.round((e.normalizedWeight / totalNormalizedWeight) * 100) / 100,
              base_weight: e.baseWeight, confidence: e.confidence,
            })),
          };
        }

        // ═══ 4.7 Beleihungswert (finale Ableitung) ═══
        const beleihungswert = Math.min(
          ertragswertBelwertv > 0 ? ertragswertBelwertv : Infinity,
          sachwertBelwertv > 0 ? sachwertBelwertv : Infinity,
        );
        const beleihungswertFinal = beleihungswert === Infinity ? Math.round(valueBand.p50 * 0.80) : beleihungswert;
        const beleihungswertQuote = valueBand.p50 > 0 ? Math.round((beleihungswertFinal / valueBand.p50) * 100) / 100 : 0;

        // Compute BelWertV details for display
        const bwkBelwertvValue = netRent > 0 ? (() => {
          const ar = netRent * 12;
          const bew = CALC.BEWIRTSCHAFTUNG_BELWERTV;
          return Math.round(ar * bew.verwaltungPercent + livingArea * bew.instandhaltungPerSqmYear + ar * bew.mietausfallPercent + ar * bew.nichtUmlagefaehigPercent);
        })() : 0;
        const reinertagBelwertvValue = netRent > 0 ? Math.round(netRent * 12 - bwkBelwertvValue) : 0;
        const bwfBelwertvValue = barwertfaktor(CALC.BELWERTV_LIEGENSCHAFTSZINS, rnd);

        const beleihungswertResult = {
          ertragswert_belwertv: ertragswertBelwertv,
          sachwert_belwertv: sachwertBelwertv,
          beleihungswert: beleihungswertFinal,
          beleihungswert_quote: beleihungswertQuote,
          sicherheitsabschlag: CALC.BELWERTV_SICHERHEITSABSCHLAG,
          bwk_belwertv: bwkBelwertvValue,
          reinertrag_belwertv: reinertagBelwertvValue,
          barwertfaktor_belwertv: Math.round(bwfBelwertvValue * 100) / 100,
        };

        // ═══ 4.8 Financing ═══
        const basePrice = askingPrice || valueBand.p50;
        const existingLoan = snapshot.existing_loan;

        const financingScenarios = [
          ...CALC.FINANCING_SCENARIOS,
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
            name: s.name, ltv: s.ltv, loan_amount: loan, equity: basePrice - loan,
            interest_rate: s.interest, repayment_rate: s.repayment,
            monthly_rate: monthlyRate, annual_debt_service: annualDebt,
            cashflow_after_debt: cashflowAfterDebt,
            traffic_light: cashflowAfterDebt > 0 ? "green" : cashflowAfterDebt > -monthlyRate ? "yellow" : "red",
          };
        });

        // ═══ 4.9 Stress tests ═══
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
          return { scenario: st.scenario, monthly_rate: monthlyRate, cashflow: rent > 0 ? (rent * 12) - annualDebt : -annualDebt, dscr };
        });

        // ═══ 4.10 Lien proxy (legacy compat) ═══
        const lienProxy = {
          market_value_band: valueBand,
          risk_discount: CALC.LIEN_BASE_DISCOUNT + (dataQuality.completeness < 70 ? 0.1 : 0),
          lien_value: beleihungswertFinal,
          ltv_window: { safe: CALC.LIEN_LTV_SAFE, max: CALC.LIEN_LTV_MAX },
          risk_drivers: [
            ...(dataQuality.completeness < 70 ? ["Datenlücken in kritischen Feldern"] : []),
            ...(!locationAnalysis.available ? ["Keine Standortdaten verfügbar"] : []),
            ...(compStats.count_with_price_sqm < 5 ? ["Wenige Vergleichsangebote"] : []),
          ],
        };

        // ═══ 4.11 DSCR ═══
        const dscr = netRent > 0 && baseScenario.annual_debt_service > 0
          ? Math.round(((netRent * 12) / baseScenario.annual_debt_service) * 100) / 100 : 0;
        const debtService = {
          dscr,
          break_even_rent: baseScenario.annual_debt_service > 0 ? Math.round(baseScenario.annual_debt_service / 12) : 0,
          is_viable: dscr >= CALC.DSCR_VIABLE_THRESHOLD,
        };

        // Save results (with graceful degradation)
        try {
          const { error: insertErr } = await sbAdmin.from("valuation_results").insert({
            case_id: caseId, value_band: valueBand, valuation_methods: methods,
            financing: financingScenarios, stress_tests: stressTests,
            lien_proxy: lienProxy, debt_service: debtService,
            location_analysis: {
              ...locationAnalysis,
              // V9.1: Embed unit details in location_analysis for downstream access
              mfh_multi_unit: !!snapshot.mfh_multi_unit,
              units_detail: snapshot.units_detail || [],
            },
            comp_stats: compStats, comp_postings: compPostings.slice(0, 10),
            sensitivity: {},
            charts: {},
            gemini_research: geminiResearch,
            beleihungswert: beleihungswertResult,
          });
          if (insertErr) {
            stageLog(4, `Results insert error: ${insertErr.message} — retrying without new columns`);
            await sbAdmin.from("valuation_results").insert({
              case_id: caseId, value_band: valueBand, valuation_methods: methods,
              financing: financingScenarios, stress_tests: stressTests,
              lien_proxy: lienProxy, debt_service: debtService,
              location_analysis: locationAnalysis,
              comp_stats: compStats, comp_postings: compPostings.slice(0, 10),
              sensitivity: { gemini_research: geminiResearch, beleihungswert: beleihungswertResult },
              charts: {},
            });
          }
        } catch (insertError) {
          stageLog(4, `Results insert critical error: ${insertError}`);
        }

        tracker.end(4);
        stageLog(4, `Done. Marktwert P50: ${valueBand.p50}, Beleihungswert: ${beleihungswertFinal}, DSCR: ${dscr}`);

        // ─── Stage 5: Report Composer ───
        tracker.start(5);
        stageLog(5, "Generating report");
        await updateStage(5);

        let executiveSummary = "";
        try {
          executiveSummary = await callAI(
            lovableApiKey!, "google/gemini-2.5-flash",
            `Du erstellst professionelle Executive Summaries für Immobilien-Kurzgutachten. Max 200 Wörter. Sachlich, prägnant. Nenne: 3 Werttreiber, 3 Risiken, Empfehlung.
WICHTIG: Nenne Marktwert UND Beleihungswert.`,
            `Objekt: ${snapshot.formatted_address || snapshot.address || "Unbekannt"}
Objektart: ${calcObjectType}, Fläche: ${livingArea}m², Baujahr: ${sachYearBuilt}
${snapshot.mfh_multi_unit ? `HINWEIS: MFH mit ${snapshot.units_detail?.length || 0} Wohneinheiten (Ø ${snapshot.avg_unit_area}m²). Bewertung auf Basis von ETW-Vergleichspreisen (Einzelwohnungsbewertung).` : ''}
Marktwert (P50): ${valueBand.p50?.toLocaleString("de")} €
Beleihungswert: ${beleihungswertFinal?.toLocaleString("de")} € (Quote: ${(beleihungswertQuote * 100).toFixed(0)}%)
Wertband: ${valueBand.p25?.toLocaleString("de")} – ${valueBand.p75?.toLocaleString("de")} €
Liegenschaftszins MWT: ${(liegenschaftszinsMWT * 100).toFixed(2)}% (${liegenschaftszinsSource})
Bodenrichtwert: ${bodenrichtwert} €/m² (${bodenrichtwertSource})
Standort-Score: ${locationScore}/100
DSCR: ${dscr}
Comps: ${compPostings.length} Vergleichsangebote${snapshot.mfh_multi_unit ? ' (ETW-basiert)' : ''}
Datenbasis: ${sourceMode === "SSOT_FINAL" ? "SSOT (verifiziert)" : "Draft"}`,
          );
        } catch (_) { executiveSummary = "Summary konnte nicht generiert werden."; }

        await sbAdmin.from("valuation_reports").insert({
          case_id: caseId, report_version: 9, web_render_hash: `v9_${caseId.substring(0, 8)}_${Date.now()}`,
        });

        tracker.end(5);
        await sbAdmin.from("valuation_cases")
          .update({ status: "final", stage_current: 5, stage_timings: tracker.toJSON(), updated_at: new Date().toISOString() })
          .eq("id", caseId);

        return json({
          success: true, case_id: caseId, status: "final", source_mode: sourceMode,
          stage_timings: tracker.toJSON(),
          summary: {
            value_band: valueBand, beleihungswert: beleihungswertResult,
            data_quality: dataQuality, location_score: locationScore,
            comp_count: compPostings.length, dscr,
            executive_summary: executiveSummary,
            legal_title: snapshot.legal_title || null,
            gemini_research: geminiResearch,
            diffs_count: diffs.length,
          },
        });
      } catch (pipelineError) {
        stageLog(99, `Pipeline error: ${pipelineError}`);
        await sbAdmin.from("valuation_cases")
          .update({ status: "failed", stage_timings: tracker.toJSON(), updated_at: new Date().toISOString() })
          .eq("id", caseId);
        return json({ error: "Pipeline failed", case_id: caseId, details: String(pipelineError) }, 500);
      }
    }

    // ════════════════════════════════════════════
    // ACTION: get
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
      return json({ case: caseRes.data, inputs: inputsRes.data, results: resultsRes.data, report: reportRes.data });
    }

    return json({ error: "Unknown action. Use: preflight, run, get" }, 400);
  } catch (err) {
    console.error("sot-valuation-engine error:", err);
    return json({ error: "Internal server error", details: String(err) }, 500);
  }
});
