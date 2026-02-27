import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

/**
 * SOT WEG-Abrechnungs-Parser — P0
 * 
 * Parses WEG Hausgeldabrechnungen (20-30 page PDFs with complex tables)
 * and maps cost positions to NKCostCategory for the NK-Abrechnung engine.
 * 
 * Two-step AI pipeline:
 *   Step 1: Gemini 2.5 Pro extracts all cost positions from the PDF
 *   Step 2: Maps extracted positions to BetrKV §2 categories
 * 
 * POST { documentId: UUID, propertyId: UUID, nkPeriodId?: UUID, year?: number }
 * 
 * Cost: 2 Credits per document
 */

const WEG_CREDITS = 2;

// BetrKV §2 category codes — must match src/engines/nkAbrechnung/spec.ts
const VALID_NK_CATEGORIES = [
  'grundsteuer', 'wasser', 'abwasser', 'heizung', 'warmwasser',
  'aufzug', 'strassenreinigung', 'muell', 'gebaeudereinigung',
  'gartenpflege', 'beleuchtung', 'schornsteinfeger', 'sachversicherung',
  'hausmeister', 'antenne_kabel', 'wascheinrichtung', 'sonstige_betriebskosten',
  'niederschlagswasser', 'verwaltung', 'ruecklage', 'instandhaltung',
  'nicht_umlagefaehig',
];

const APPORTIONABLE = new Set([
  'grundsteuer', 'wasser', 'abwasser', 'heizung', 'warmwasser',
  'aufzug', 'strassenreinigung', 'muell', 'gebaeudereinigung',
  'gartenpflege', 'beleuchtung', 'schornsteinfeger', 'sachversicherung',
  'hausmeister', 'antenne_kabel', 'wascheinrichtung', 'sonstige_betriebskosten',
  'niederschlagswasser',
]);

const WEG_SYSTEM_PROMPT = `Du bist ein spezialisierter Parser für deutsche WEG-Hausgeldabrechnungen (Wohnungseigentümergemeinschaft).

Analysiere die WEG-Abrechnung und extrahiere ALLE Kostenpositionen. Achte besonders auf:
- Einzelabrechnungen (Einheit/Wohnung-spezifisch)
- Gesamtabrechnungen (auf die Einheit entfallender Anteil)
- Heizkosten (oft separate Abrechnung)
- Rücklage / Instandhaltungsrücklage
- Verwaltungskosten

Für JEDE Kostenposition extrahiere:
{
  "label_raw": "Originaltext der Position",
  "amount_total_house": 12345.67,
  "amount_unit": 1234.56,
  "allocation_key": "area_sqm|mea|persons|consumption|unit_count|custom",
  "key_basis_unit": 85.5,
  "key_basis_total": 1200.0,
  "nk_category": "Eine der folgenden Kategorien"
}

GÜLTIGE NK-KATEGORIEN (BetrKV §2):
- grundsteuer: Grundsteuer
- wasser: Wasserversorgung, Frischwasser, Kaltwasser
- abwasser: Abwasser, Entwässerung, Kanal
- heizung: Heizkosten, Fernwärme, Brennstoff, Gas
- warmwasser: Warmwasserversorgung
- aufzug: Aufzug, Fahrstuhl
- strassenreinigung: Straßenreinigung, Winterdienst
- muell: Müllabfuhr, Abfallentsorgung
- gebaeudereinigung: Gebäudereinigung, Treppenhausreinigung
- gartenpflege: Gartenpflege, Grünpflege
- beleuchtung: Allgemeinstrom, Beleuchtung, Hausstrom
- schornsteinfeger: Schornsteinfeger, Abgasmessung
- sachversicherung: Gebäudeversicherung, Haftpflicht, Elementar
- hausmeister: Hausmeister, Hauswart
- antenne_kabel: Kabelanschluss, Antenne, SAT
- wascheinrichtung: Waschmaschine, Trockner gemeinschaftlich
- sonstige_betriebskosten: Sonstige umlagefähige Kosten
- niederschlagswasser: Niederschlagswasser, Regenwasser
- verwaltung: WEG-Verwaltungskosten (NICHT umlagefähig)
- ruecklage: Instandhaltungsrücklage (NICHT umlagefähig)
- instandhaltung: Instandhaltung, Reparatur (NICHT umlagefähig)
- nicht_umlagefaehig: Sonstige nicht umlagefähige Kosten

ZUSÄTZLICH extrahiere Metadaten:
{
  "weg_name": "Name der WEG",
  "verwaltung_name": "Name der Hausverwaltung",
  "abrechnungszeitraum_start": "YYYY-MM-DD",
  "abrechnungszeitraum_end": "YYYY-MM-DD",
  "einheit_bezeichnung": "z.B. Wohnung Nr. 3, TE 5",
  "miteigentumsanteil_mea": 85.5,
  "wohnflaeche_sqm": 75.0,
  "hausgeld_soll_monatlich": 350.00,
  "hausgeld_ist_gesamt": 4200.00,
  "saldo": 123.45
}

REGELN:
- Alle Beträge in Euro als Dezimalzahl
- Wenn amount_unit nicht erkennbar: null setzen
- allocation_key: "mea" für Miteigentumsanteile, "area_sqm" für Wohnfläche, "consumption" für verbrauchsabhängig
- saldo: positiv = Nachzahlung, negativ = Guthaben
- Antworte NUR mit validem JSON

Antworte mit:
{
  "confidence": 0.0-1.0,
  "warnings": [],
  "metadata": { ... Metadaten oben ... },
  "positions": [ ... Kostenpositionen ... ]
}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleCorsPreflightRequest(req);

  const corsHeaders = getCorsHeaders(req);
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    const sbUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: ue } = await sbUser.auth.getUser();
    if (ue || !user) return json({ error: "Invalid user" }, 401);

    const { data: profile } = await sbUser
      .from("profiles")
      .select("active_tenant_id")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile?.active_tenant_id) return json({ error: "No active tenant" }, 400);
    const tenantId = profile.active_tenant_id;

    const { documentId, propertyId, nkPeriodId, year } = await req.json();
    if (!documentId) return json({ error: "Missing documentId" }, 400);
    if (!propertyId) return json({ error: "Missing propertyId" }, 400);

    const sbAdmin = createClient(supabaseUrl, serviceKey);

    // Load document
    const { data: doc, error: docErr } = await sbAdmin
      .from("documents")
      .select("id, name, file_path, mime_type, tenant_id")
      .eq("id", documentId)
      .eq("tenant_id", tenantId)
      .single();
    if (docErr || !doc) return json({ error: "Document not found" }, 404);

    // Credit Preflight
    const { data: preflight } = await sbAdmin.rpc("rpc_credit_preflight", {
      p_tenant_id: tenantId,
      p_required_credits: WEG_CREDITS,
      p_action_code: "weg_abrechnung_parsing",
    });
    if (!preflight?.allowed) {
      return json({ error: "Insufficient credits", available: preflight?.available_credits }, 402);
    }

    // Get signed URL & fetch file
    const { data: signedUrlData, error: signErr } = await sbAdmin.storage
      .from("tenant-documents")
      .createSignedUrl(doc.file_path, 600); // 10 min for large PDFs
    if (signErr || !signedUrlData?.signedUrl) return json({ error: "Could not create signed URL" }, 500);

    const fileRes = await fetch(signedUrlData.signedUrl);
    if (!fileRes.ok) return json({ error: "Could not fetch file" }, 500);

    const fileBytes = new Uint8Array(await fileRes.arrayBuffer());
    const base64 = btoa(String.fromCharCode(...fileBytes));
    const mimeType = doc.mime_type || "application/pdf";

    if (!lovableApiKey) return json({ error: "AI Gateway not configured" }, 500);

    // ── Step 1: Full extraction with Gemini 2.5 Pro (high reasoning) ──
    const messages = [
      { role: "system", content: WEG_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: `Analysiere diese WEG-Hausgeldabrechnung: "${doc.name}"${year ? ` für das Jahr ${year}` : ''}` },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
        ],
      },
    ];

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages,
        temperature: 0.1,
        max_tokens: 32000,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI Gateway error:", aiRes.status, errText);
      if (aiRes.status === 429) return json({ error: "Rate limit exceeded, please try again later" }, 429);
      if (aiRes.status === 402) return json({ error: "Payment required" }, 402);
      return json({ error: `AI extraction failed (${aiRes.status})` }, 500);
    }

    const aiResult = await aiRes.json();
    const aiContent = aiResult.choices?.[0]?.message?.content || "";

    // Parse AI response
    let parsed: Record<string, unknown>;
    try {
      const jsonStr = aiContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("[sot-weg-abrechnung-parse] JSON parse failed:", aiContent.substring(0, 500));
      return json({ error: "AI response could not be parsed" }, 500);
    }

    const confidence = (parsed.confidence as number) || 0.5;
    const metadata = (parsed.metadata as Record<string, unknown>) || {};
    const positions = (parsed.positions as Array<Record<string, unknown>>) || [];
    const warnings = (parsed.warnings as string[]) || [];

    if (positions.length === 0) {
      return json({ error: "No cost positions found in document", warnings }, 400);
    }

    // ── Step 2: Map positions to nk_cost_items ──
    const costItems = positions.map((pos, idx) => {
      let category = (pos.nk_category as string || "nicht_umlagefaehig").toLowerCase();
      if (!VALID_NK_CATEGORIES.includes(category)) {
        category = "sonstige_betriebskosten";
        warnings.push(`Position "${pos.label_raw}": Unbekannte Kategorie, als "Sonstige" klassifiziert`);
      }

      return {
        tenant_id: tenantId,
        nk_period_id: nkPeriodId || null,
        property_id: propertyId,
        category_code: category,
        label_raw: pos.label_raw as string || `Position ${idx + 1}`,
        label_display: pos.label_raw as string || `Position ${idx + 1}`,
        amount_total_house: (pos.amount_total_house as number) || 0,
        amount_unit: (pos.amount_unit as number) || null,
        key_type: mapAllocationKey(pos.allocation_key as string),
        key_basis_unit: (pos.key_basis_unit as number) || null,
        key_basis_total: (pos.key_basis_total as number) || null,
        is_apportionable: APPORTIONABLE.has(category),
        reason_code: APPORTIONABLE.has(category) ? 'betrkv_§2' : 'non_apportionable',
        mapping_confidence: confidence,
        mapping_source: 'ai',
        source_document_id: documentId,
        sort_order: idx + 1,
      };
    });

    // ── Insert cost items ──
    const { data: insertedItems, error: insertErr } = await sbAdmin
      .from("nk_cost_items")
      .upsert(costItems, { onConflict: 'id' })
      .select("id");

    if (insertErr) {
      console.error("[sot-weg-abrechnung-parse] Insert error:", insertErr);
      return json({ error: "Failed to store cost items", detail: insertErr.message }, 500);
    }

    // Store structured data for the document
    await sbAdmin.from("document_structured_data").insert({
      tenant_id: tenantId,
      document_id: documentId,
      doc_category: 'weg_abrechnung',
      extracted_fields: {
        ...metadata,
        positions_count: positions.length,
        total_apportionable: costItems.filter(i => i.is_apportionable).reduce((s, i) => s + (i.amount_unit || 0), 0),
        total_non_apportionable: costItems.filter(i => !i.is_apportionable).reduce((s, i) => s + (i.amount_unit || 0), 0),
      },
      property_id: propertyId,
      confidence,
      needs_review: confidence < 0.85,
      extractor_version: '1.0',
    });

    // Update document metadata
    await sbAdmin
      .from("documents")
      .update({
        extraction_status: "done",
        doc_type: "weg_abrechnung",
        summary: `WEG-Abrechnung: ${metadata.weg_name || 'Unbekannt'}, ${positions.length} Positionen`,
      })
      .eq("id", documentId);

    // Deduct credits
    await sbAdmin.rpc("rpc_credit_deduct", {
      p_tenant_id: tenantId,
      p_credits: WEG_CREDITS,
      p_action_code: "weg_abrechnung_parsing",
      p_ref_type: "document",
      p_ref_id: documentId,
    });

    console.log(`[sot-weg-abrechnung-parse] Extracted ${positions.length} positions from ${doc.name}, confidence ${confidence}`);

    return json({
      success: true,
      document_id: documentId,
      property_id: propertyId,
      positions_count: positions.length,
      items_inserted: insertedItems?.length || 0,
      metadata,
      confidence,
      needs_review: confidence < 0.85,
      warnings,
      credits_used: WEG_CREDITS,
    });
  } catch (err) {
    console.error("[sot-weg-abrechnung-parse] Error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});

function mapAllocationKey(key: string | undefined): string {
  const map: Record<string, string> = {
    'area_sqm': 'area_sqm',
    'mea': 'mea',
    'persons': 'persons',
    'consumption': 'consumption',
    'unit_count': 'unit_count',
    'custom': 'custom',
    'wohnfläche': 'area_sqm',
    'miteigentum': 'mea',
    'verbrauch': 'consumption',
    'personenzahl': 'persons',
    'einheiten': 'unit_count',
  };
  return map[(key || '').toLowerCase()] || 'mea';
}
