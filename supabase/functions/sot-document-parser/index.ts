import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * SOT Document Parser — Manifest-Driven Engine v2.0
 * 
 * Uses the ParserManifest to generate structured AI prompts per parseMode.
 * Supports 10 modes + legacy aliases for backwards compatibility.
 * 
 * Input modes:
 *   A) storagePath + bucket  — Downloads from Storage (up to 20MB)
 *   B) content (base64)      — Legacy inline mode
 */

// ══════════════════════════════════════════════════════════════════════════
// PARSER MANIFEST (Edge-Function-local copy of field definitions)
// ══════════════════════════════════════════════════════════════════════════

type ParserMode = 'immobilie' | 'finanzierung' | 'versicherung' | 'fahrzeugschein' | 'pv_anlage' | 'vorsorge' | 'person' | 'haustier' | 'kontakt' | 'allgemein';

interface FieldDef {
  key: string;
  label: string;
  type: string;
  required: boolean;
  enumValues?: string[];
  aiHint?: string;
}

interface ModeConfig {
  label: string;
  targetTable: string;
  targetDmsFolder: string;
  exampleDocuments: string[];
  fields: FieldDef[];
}

const MODE_CONFIGS: Record<ParserMode, ModeConfig> = {
  immobilie: {
    label: 'Immobilie',
    targetTable: 'units',
    targetDmsFolder: '01_Grunddaten',
    exampleDocuments: ['Kaufvertrag', 'Grundbuchauszug', 'Teilungserklärung', 'Exposé', 'Mietvertrag'],
    fields: [
      { key: 'address', label: 'Adresse', type: 'string', required: true },
      { key: 'city', label: 'Stadt', type: 'string', required: true },
      { key: 'postal_code', label: 'PLZ', type: 'string', required: false },
      { key: 'purchase_price', label: 'Kaufpreis (€)', type: 'currency', required: false },
      { key: 'market_value', label: 'Marktwert (€)', type: 'currency', required: false },
      { key: 'construction_year', label: 'Baujahr', type: 'number', required: false },
      { key: 'living_area_sqm', label: 'Wohnfläche (m²)', type: 'number', required: false },
      { key: 'plot_area_sqm', label: 'Grundstücksfläche (m²)', type: 'number', required: false },
      { key: 'rooms', label: 'Zimmer', type: 'number', required: false },
      { key: 'monthly_rent', label: 'Monatliche Miete (€)', type: 'currency', required: false },
      { key: 'property_type', label: 'Objektart', type: 'enum', required: false, enumValues: ['apartment', 'house', 'multi_family', 'commercial', 'land', 'other'] },
    ],
  },
  finanzierung: {
    label: 'Finanzierung',
    targetTable: 'finance_requests',
    targetDmsFolder: '05_Vertrag',
    exampleDocuments: ['Darlehensvertrag', 'Kreditangebot', 'Tilgungsplan'],
    fields: [
      { key: 'bank_name', label: 'Bank', type: 'string', required: true },
      { key: 'loan_amount', label: 'Darlehensbetrag (€)', type: 'currency', required: true },
      { key: 'interest_rate', label: 'Zinssatz (%)', type: 'number', required: false, aiHint: 'Sollzins p.a. in Prozent' },
      { key: 'repayment_rate', label: 'Tilgungssatz (%)', type: 'number', required: false },
      { key: 'monthly_rate', label: 'Monatliche Rate (€)', type: 'currency', required: false },
      { key: 'fixed_rate_years', label: 'Zinsbindung (Jahre)', type: 'number', required: false },
      { key: 'loan_start', label: 'Darlehensbeginn', type: 'date', required: false },
      { key: 'loan_end', label: 'Darlehensende', type: 'date', required: false },
      { key: 'loan_type', label: 'Darlehenstyp', type: 'enum', required: false, enumValues: ['annuity', 'fixed', 'variable', 'kfw', 'other'] },
    ],
  },
  versicherung: {
    label: 'Versicherung',
    targetTable: 'insurance_contracts',
    targetDmsFolder: '01_Police',
    exampleDocuments: ['Versicherungspolice', 'Versicherungsschein', 'Nachtrag', 'Schadensmeldung'],
    fields: [
      { key: 'provider_name', label: 'Versicherer', type: 'string', required: true },
      { key: 'policy_number', label: 'Policennummer', type: 'string', required: true },
      { key: 'category', label: 'Kategorie', type: 'enum', required: true, enumValues: ['hausrat', 'haftpflicht', 'kfz', 'wohngebaeude', 'rechtsschutz', 'unfall', 'leben', 'kranken', 'tier', 'sonstige'] },
      { key: 'premium_amount', label: 'Prämie (€)', type: 'currency', required: false },
      { key: 'payment_interval', label: 'Zahlungsintervall', type: 'enum', required: false, enumValues: ['monatlich', 'vierteljaehrlich', 'halbjaehrlich', 'jaehrlich'] },
      { key: 'deductible', label: 'Selbstbeteiligung (€)', type: 'currency', required: false },
      { key: 'coverage_amount', label: 'Versicherungssumme (€)', type: 'currency', required: false },
      { key: 'start_date', label: 'Vertragsbeginn', type: 'date', required: false },
      { key: 'end_date', label: 'Vertragsende', type: 'date', required: false },
      { key: 'insured_person', label: 'Versicherungsnehmer', type: 'string', required: false },
    ],
  },
  fahrzeugschein: {
    label: 'Fahrzeug',
    targetTable: 'cars_vehicles',
    targetDmsFolder: '01_Zulassung',
    exampleDocuments: ['Fahrzeugschein', 'Zulassungsbescheinigung Teil I/II', 'Fahrzeugbrief'],
    fields: [
      { key: 'license_plate', label: 'Kennzeichen', type: 'string', required: true, aiHint: 'Amtliches Kennzeichen z.B. B-AB 1234' },
      { key: 'vin', label: 'FIN', type: 'string', required: false, aiHint: '17-stellige Fahrzeug-Identnummer' },
      { key: 'brand', label: 'Marke', type: 'string', required: true },
      { key: 'model', label: 'Modell', type: 'string', required: true },
      { key: 'first_registration', label: 'Erstzulassung', type: 'date', required: false },
      { key: 'hsn', label: 'HSN', type: 'string', required: false, aiHint: 'Feld 2.1 im Fahrzeugschein, 4-stellig' },
      { key: 'tsn', label: 'TSN', type: 'string', required: false, aiHint: 'Feld 2.2 im Fahrzeugschein, 3-stellig' },
      { key: 'fuel_type', label: 'Kraftstoffart', type: 'enum', required: false, enumValues: ['benzin', 'diesel', 'elektro', 'hybrid', 'gas', 'sonstige'] },
      { key: 'power_kw', label: 'Leistung (kW)', type: 'number', required: false },
      { key: 'owner_name', label: 'Halter', type: 'string', required: false },
    ],
  },
  pv_anlage: {
    label: 'PV-Anlage',
    targetTable: 'pv_plants',
    targetDmsFolder: '01_Stammdaten',
    exampleDocuments: ['MaStR-Auszug', 'Inbetriebnahmeprotokoll', 'Einspeisezusage', 'Anlagendatenblatt'],
    fields: [
      { key: 'name', label: 'Anlagenname', type: 'string', required: true },
      { key: 'kwp', label: 'Leistung (kWp)', type: 'number', required: true },
      { key: 'mastr_plant_id', label: 'MaStR-Nr.', type: 'string', required: false, aiHint: 'Marktstammdatenregister-Nummer' },
      { key: 'commissioning_date', label: 'Inbetriebnahme', type: 'date', required: false },
      { key: 'feed_in_tariff', label: 'Einspeisevergütung (ct/kWh)', type: 'number', required: false },
      { key: 'inverter_model', label: 'Wechselrichter', type: 'string', required: false },
      { key: 'module_type', label: 'Modultyp', type: 'string', required: false },
      { key: 'module_count', label: 'Modulanzahl', type: 'number', required: false },
      { key: 'grid_operator', label: 'Netzbetreiber', type: 'string', required: false },
      { key: 'address', label: 'Standort', type: 'string', required: false },
    ],
  },
  vorsorge: {
    label: 'Vorsorge',
    targetTable: 'vorsorge_contracts',
    targetDmsFolder: '01_Vertrag',
    exampleDocuments: ['Standmitteilung', 'Renteninformation', 'Riester-Bescheinigung', 'bAV-Vertrag'],
    fields: [
      { key: 'provider_name', label: 'Anbieter', type: 'string', required: true },
      { key: 'contract_number', label: 'Vertragsnummer', type: 'string', required: true },
      { key: 'contract_type', label: 'Vertragstyp', type: 'enum', required: true, enumValues: ['riester', 'ruerup', 'bav', 'privat', 'kapital_lv', 'fondsgebunden', 'sonstige'] },
      { key: 'contribution_amount', label: 'Beitrag (€)', type: 'currency', required: false },
      { key: 'payment_interval', label: 'Zahlungsintervall', type: 'enum', required: false, enumValues: ['monatlich', 'vierteljaehrlich', 'halbjaehrlich', 'jaehrlich'] },
      { key: 'current_value', label: 'Aktueller Vertragswert (€)', type: 'currency', required: false },
      { key: 'projected_value', label: 'Prognostizierter Endwert (€)', type: 'currency', required: false },
      { key: 'monthly_pension', label: 'Monatliche Rente (€)', type: 'currency', required: false },
      { key: 'start_date', label: 'Vertragsbeginn', type: 'date', required: false },
      { key: 'end_date', label: 'Vertragsende', type: 'date', required: false },
    ],
  },
  person: {
    label: 'Person',
    targetTable: 'household_persons',
    targetDmsFolder: '01_Personalausweis',
    exampleDocuments: ['Personalausweis', 'Reisepass', 'Geburtsurkunde', 'Gehaltsnachweis'],
    fields: [
      { key: 'first_name', label: 'Vorname', type: 'string', required: true },
      { key: 'last_name', label: 'Nachname', type: 'string', required: true },
      { key: 'birth_date', label: 'Geburtsdatum', type: 'date', required: false },
      { key: 'email', label: 'E-Mail', type: 'string', required: false },
      { key: 'phone_mobile', label: 'Telefon mobil', type: 'string', required: false },
      { key: 'address_street', label: 'Straße', type: 'string', required: false },
      { key: 'address_postal_code', label: 'PLZ', type: 'string', required: false },
      { key: 'address_city', label: 'Ort', type: 'string', required: false },
      { key: 'employer_name', label: 'Arbeitgeber', type: 'string', required: false },
      { key: 'net_income', label: 'Nettoeinkommen (€)', type: 'currency', required: false },
    ],
  },
  haustier: {
    label: 'Haustier',
    targetTable: 'pets',
    targetDmsFolder: '01_Impfpass',
    exampleDocuments: ['Impfpass', 'Tierarztrechnung', 'EU-Heimtierausweis'],
    fields: [
      { key: 'name', label: 'Name', type: 'string', required: true },
      { key: 'species', label: 'Tierart', type: 'enum', required: true, enumValues: ['hund', 'katze', 'pferd', 'vogel', 'kleintier', 'sonstige'] },
      { key: 'breed', label: 'Rasse', type: 'string', required: false },
      { key: 'chip_number', label: 'Chipnummer', type: 'string', required: false, aiHint: '15-stelliger Transponder-Code' },
      { key: 'birth_date', label: 'Geburtsdatum', type: 'date', required: false },
      { key: 'gender', label: 'Geschlecht', type: 'enum', required: false, enumValues: ['maennlich', 'weiblich'] },
      { key: 'vet_name', label: 'Tierarzt', type: 'string', required: false },
      { key: 'weight_kg', label: 'Gewicht (kg)', type: 'number', required: false },
    ],
  },
  kontakt: {
    label: 'Kontakt',
    targetTable: 'contacts',
    targetDmsFolder: '08_Sonstiges',
    exampleDocuments: ['Visitenkarte', 'Kontaktliste', 'CRM-Export'],
    fields: [
      { key: 'first_name', label: 'Vorname', type: 'string', required: true },
      { key: 'last_name', label: 'Nachname', type: 'string', required: true },
      { key: 'email', label: 'E-Mail', type: 'string', required: false },
      { key: 'phone', label: 'Telefon', type: 'string', required: false },
      { key: 'company', label: 'Firma', type: 'string', required: false },
      { key: 'role', label: 'Rolle/Position', type: 'string', required: false },
      { key: 'address', label: 'Adresse', type: 'string', required: false },
    ],
  },
  allgemein: {
    label: 'Automatische Erkennung',
    targetTable: '',
    targetDmsFolder: '',
    exampleDocuments: [],
    fields: [],
  },
};

// ══════════════════════════════════════════════════════════════════════════
// LEGACY MODE ALIASES
// ══════════════════════════════════════════════════════════════════════════

const LEGACY_MAP: Record<string, ParserMode> = {
  properties: 'immobilie',
  contacts: 'kontakt',
  financing: 'finanzierung',
  general: 'allgemein',
};

function resolveMode(input: string): ParserMode {
  return LEGACY_MAP[input] || (input as ParserMode) || 'allgemein';
}

// ══════════════════════════════════════════════════════════════════════════
// PROMPT BUILDER
// ══════════════════════════════════════════════════════════════════════════

function buildSystemPrompt(mode: ParserMode): string {
  const config = MODE_CONFIGS[mode];

  if (mode === 'allgemein') {
    const modeBlocks = Object.entries(MODE_CONFIGS)
      .filter(([k]) => k !== 'allgemein')
      .map(([k, v]) => {
        const fieldList = v.fields.map(f => {
          let line = `      "${f.key}": ${f.label} (${f.type}${f.required ? ', PFLICHT' : ''})`;
          if (f.enumValues) line += ` — Werte: ${f.enumValues.join(', ')}`;
          return line;
        }).join('\n');
        return `  - "${k}": ${v.label} (Beispiele: ${v.exampleDocuments.slice(0, 3).join(', ')})\n    Felder:\n${fieldList}`;
      })
      .join('\n\n');

    return `Du bist ein intelligenter Dokumenten-Klassifizierer und -Parser.

SCHRITT 1: Erkenne den Dokumenttyp und ordne ihn einem dieser Modi zu:
${modeBlocks}

SCHRITT 2: Extrahiere die Daten mit EXAKT den oben definierten Keys des erkannten Modus.
WICHTIG: Verwende NUR die englischen Keys aus der Felddefinition (z.B. "provider_name", NICHT "anbieter").

REGELN:
- Alle Zahlen als Number (nicht String)
- Währungsbeträge in Euro (nur Zahl, ohne € oder EUR)
- Flächen in m² (nur Zahl)
- Datumsfelder im Format YYYY-MM-DD
- Leere/nicht gefundene Felder WEGLASSEN
- Bei Unsicherheit: confidence reduzieren und warning hinzufügen

Antworte NUR mit validem JSON:
{
  "confidence": 0.0-1.0,
  "warnings": [],
  "detectedMode": "<modus>",
  "records": [{ ... mit den exakten Keys aus der Felddefinition ... }]
}`;
  }

  const fieldLines = config.fields.map(f => {
    let line = `  - "${f.key}": ${f.label} (${f.type}${f.required ? ', PFLICHT' : ', optional'})`;
    if (f.enumValues) line += ` — Werte: ${f.enumValues.join(', ')}`;
    if (f.aiHint) line += ` — ${f.aiHint}`;
    return line;
  }).join('\n');

  return `Du bist ein spezialisierter Dokumenten-Parser für den Bereich "${config.label}".
Analysiere das Dokument und extrahiere EXAKT die folgenden Felder.

FELDER (nur diese Keys verwenden):
${fieldLines}

REGELN:
- Alle Zahlen als Number (nicht String)
- Währungsbeträge in Euro (nur Zahl, ohne € oder EUR)
- Flächen in m² (nur Zahl)
- Datumsfelder im Format YYYY-MM-DD
- Leere/nicht gefundene Felder WEGLASSEN (nicht null setzen)
- Bei Unsicherheit: confidence reduzieren und warning hinzufügen

Erkannte Dokumenttypen: ${config.exampleDocuments.join(', ')}

Antworte NUR mit validem JSON:
{
  "confidence": 0.0-1.0,
  "warnings": [],
  "records": [
    { ${config.fields.filter(f => f.required).map(f => `"${f.key}": "..."`).join(', ')} }
  ]
}`;
}

// ══════════════════════════════════════════════════════════════════════════
// RESPONSE VALIDATION
// ══════════════════════════════════════════════════════════════════════════

function validateRecords(records: Record<string, unknown>[], mode: ParserMode): string[] {
  const config = MODE_CONFIGS[mode];
  if (!config || mode === 'allgemein' || !records.length) return [];

  const warnings: string[] = [];
  const requiredKeys = config.fields.filter(f => f.required).map(f => f.key);

  for (let i = 0; i < records.length; i++) {
    const rec = records[i];
    for (const key of requiredKeys) {
      if (rec[key] === undefined || rec[key] === null || rec[key] === '') {
        warnings.push(`Record ${i + 1}: Pflichtfeld "${key}" fehlt`);
      }
    }
    // Type coercion for number/currency fields
    for (const field of config.fields) {
      if (rec[field.key] !== undefined && (field.type === 'number' || field.type === 'currency')) {
        const val = rec[field.key];
        if (typeof val === 'string') {
          const num = parseFloat(String(val).replace(/[^\d.,\-]/g, '').replace(',', '.'));
          if (!isNaN(num)) {
            rec[field.key] = num;
          } else {
            warnings.push(`Record ${i + 1}: "${field.key}" konnte nicht in Zahl umgewandelt werden`);
          }
        }
      }
    }
  }

  return warnings;
}

// ══════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

const MAX_AI_FILE_SIZE = 20 * 1024 * 1024;

// ══════════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ══════════════════════════════════════════════════════════════════════════

interface ParseRequest {
  storagePath?: string;
  bucket?: string;
  content?: string;
  contentType?: string;
  filename: string;
  tenantId?: string;
  documentId?: string;
  parseMode?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: ParseRequest = await req.json();
    const { storagePath, bucket, content, contentType, filename, tenantId, documentId } = body;
    const engineMode = resolveMode(body.parseMode || 'allgemein');

    if (!filename) {
      return new Response(
        JSON.stringify({ error: "Missing required field: filename" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!storagePath && !content) {
      return new Response(
        JSON.stringify({ error: "Either storagePath or content must be provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[parser-engine] Parsing: ${filename} (mode: ${engineMode}, input: ${storagePath ? 'storage' : 'inline'})`);

    // ── Resolve file content ─────────────────────────────────────────
    let resolvedContent: string;
    let resolvedContentType = contentType || "application/pdf";

    if (storagePath) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const targetBucket = bucket || "tenant-documents";
      console.log(`[parser-engine] Downloading from ${targetBucket}/${storagePath}`);

      const { data: fileData, error: dlError } = await supabase.storage
        .from(targetBucket)
        .download(storagePath);

      if (dlError || !fileData) {
        console.error("[parser-engine] Storage download error:", dlError);
        return new Response(
          JSON.stringify({ error: `File download failed: ${dlError?.message || 'Unknown'}` }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (fileData.size > MAX_AI_FILE_SIZE) {
        return new Response(
          JSON.stringify({ error: `File too large: ${(fileData.size / 1024 / 1024).toFixed(1)}MB (max 20MB)` }),
          { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!contentType) {
        const ext = filename.toLowerCase().split('.').pop();
        const mimeMap: Record<string, string> = {
          pdf: "application/pdf",
          jpg: "image/jpeg", jpeg: "image/jpeg",
          png: "image/png", webp: "image/webp",
          doc: "application/msword",
          docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          xls: "application/vnd.ms-excel",
          xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          csv: "text/csv",
        };
        resolvedContentType = mimeMap[ext || ''] || "application/octet-stream";
      }

      const buffer = await fileData.arrayBuffer();
      resolvedContent = uint8ToBase64(new Uint8Array(buffer));
      console.log(`[parser-engine] Downloaded ${(fileData.size / 1024).toFixed(0)}KB`);
    } else {
      resolvedContent = content!;
    }

    // ── Build AI prompt from manifest ────────────────────────────────
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = buildSystemPrompt(engineMode);
    const useVision = resolvedContentType.includes("image") || resolvedContentType.includes("pdf");

    let messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }>;

    if (useVision) {
      let dataUrl: string;
      if (resolvedContent.startsWith("data:")) {
        dataUrl = resolvedContent;
      } else {
        dataUrl = `data:${resolvedContentType};base64,${resolvedContent}`;
      }
      messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: [
          { type: "text", text: `Analysiere dieses Dokument: ${filename}` },
          { type: "image_url", image_url: { url: dataUrl } }
        ]}
      ];
    } else {
      let textContent: string;
      try { textContent = atob(resolvedContent); } catch { textContent = resolvedContent; }
      messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analysiere dieses Dokument: ${filename}\n\nInhalt:\n${textContent.substring(0, 50000)}` }
      ];
    }

    // ── Call AI Gateway ───────────────────────────────────────────────
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        temperature: 0.1,
        max_tokens: 8000,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("[parser-engine] AI Gateway error:", aiResponse.status, errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const aiContent = aiResult.choices?.[0]?.message?.content || "";

    console.log("[parser-engine] AI response received, parsing JSON...");

    // ── Parse AI response ────────────────────────────────────────────
    let parsedData: { confidence: number; warnings: string[]; records: Record<string, unknown>[]; detectedMode?: string; detected_type?: string; data?: Record<string, unknown> };
    try {
      let jsonStr = aiContent;
      if (jsonStr.includes("```json")) jsonStr = jsonStr.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      else if (jsonStr.includes("```")) jsonStr = jsonStr.replace(/```\n?/g, "");
      parsedData = JSON.parse(jsonStr.trim());
    } catch {
      console.error("[parser-engine] Failed to parse AI JSON:", aiContent.substring(0, 500));
      parsedData = {
        confidence: 0.3,
        warnings: ["Konnte keine strukturierten Daten extrahieren"],
        records: [],
      };
    }

    // ── Normalize: support both old format (data.properties/contacts) and new (records) ──
    let records = parsedData.records || [];
    if (!records.length && parsedData.data) {
      // Legacy format: flatten data.properties + data.contacts + data.financing
      const d = parsedData.data as Record<string, unknown[]>;
      for (const key of ['properties', 'contacts', 'financing']) {
        if (Array.isArray(d[key])) records.push(...d[key] as Record<string, unknown>[]);
      }
    }

    // ── Resolve detected mode for 'allgemein' ────────────────────────
    let resolvedMode = engineMode;
    if (engineMode === 'allgemein' && parsedData.detectedMode) {
      const dm = parsedData.detectedMode as ParserMode;
      if (MODE_CONFIGS[dm]) resolvedMode = dm;
    }

    const modeConfig = MODE_CONFIGS[resolvedMode];

    // ── Validate extracted records against manifest ──────────────────
    const validationWarnings = validateRecords(records, resolvedMode);
    const allWarnings = [...(parsedData.warnings || []), ...validationWarnings];

    // ── Build response ───────────────────────────────────────────────
    const result = {
      version: "2.0",
      engine: "lovable_ai",
      model: "google/gemini-3-flash-preview",
      parseMode: resolvedMode,
      parsed_at: new Date().toISOString(),
      confidence: parsedData.confidence || 0.5,
      warnings: allWarnings,
      targetTable: modeConfig.targetTable,
      targetDmsFolder: modeConfig.targetDmsFolder,
      records,
      // Legacy compat fields
      data: {
        detected_type: parsedData.detected_type || parsedData.detectedMode || "other",
        properties: resolvedMode === 'immobilie' ? records : [],
        contacts: resolvedMode === 'kontakt' ? records : [],
        financing: resolvedMode === 'finanzierung' ? records : [],
      },
      ...(engineMode === 'allgemein' && parsedData.detectedMode ? { detectedMode: resolvedMode } : {}),
    };

    // ── Track usage ──────────────────────────────────────────────────
    if (tenantId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const now = new Date();
        const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
        const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

        await supabase.rpc("increment_lovable_ai_usage", {
          p_tenant_id: tenantId,
          p_period_start: periodStart,
          p_period_end: periodEnd,
          p_calls: 1,
          p_tokens: aiResult.usage?.total_tokens || 0
        });
      } catch (usageError) {
        console.error("[parser-engine] Failed to track usage:", usageError);
      }
    }

    console.log(`[parser-engine] ✓ ${filename} → mode=${resolvedMode}, records=${records.length}, confidence=${result.confidence}`);

    return new Response(
      JSON.stringify({ success: true, parsed: result, filename, contentType: resolvedContentType }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[parser-engine] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
