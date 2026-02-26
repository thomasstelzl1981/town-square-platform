/**
 * SOT Project Intake - Magic Intake with Full AI + XLSX + Storage-Tree
 * MOD-13 PROJEKTE
 * 
 * Modes:
 *   analyze  — Extract project data from Exposé (AI) + parse Pricelist (via shared tabular parser)
 *   create   — Create project, bulk-insert units, seed storage_nodes tree
 * 
 * v3: Pricelist parsing now uses the shared tabular-parser module
 *     (eliminates ~300 lines of duplicated XLSX/CSV/PDF parsing logic)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  uint8ToBase64,
  parseTabularFile,
  fuzzyMapColumns,
  parseGermanNumber,
  STANDARD_COLUMN_PATTERNS,
  type ColumnMappingEntry,
} from "../_shared/tabular-parser.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MAX_AI_PROCESSING_SIZE = 20 * 1024 * 1024; // 20MB

// ── Expose AI Config (P0.1 diagnostic toggles) ───────────────────────────────
// Toggle via env: EXPOSE_TOOL_CHOICE = "auto" | "forced" (default: "auto")
const EXPOSE_TOOL_CHOICE_MODE = Deno.env.get('EXPOSE_TOOL_CHOICE') || 'auto';
const EXPOSE_MAX_TOKENS = 8000;
const EXPOSE_TEMPERATURE = 0.1;

// ── Tool-Calling: Expose extraction (simplified — metadata only, no units) ───

const EXTRACT_PROJECT_TOOL = {
  type: 'function' as const,
  function: {
    name: 'extract_project_data',
    description: 'Extrahiere die Projekt-Metadaten aus dem Immobilien-Exposé. Keine einzelnen Einheiten — nur Projektdaten. Extrahiere auch die ausführliche Beschreibung, Energiedaten und Ausstattungsmerkmale.',
    parameters: {
      type: 'object',
      properties: {
        projectName: { type: 'string', description: 'Projektname, z.B. "Menden Living", "Residenz am Park"' },
        city: { type: 'string', description: 'Stadt/Ort' },
        postalCode: { type: 'string', description: 'PLZ' },
        address: { type: 'string', description: 'Straße + Hausnummer' },
        unitsCount: { type: 'number', description: 'Gesamtzahl Wohneinheiten' },
        totalArea: { type: 'number', description: 'Gesamtwohnfläche in m²' },
        priceRange: { type: 'string', description: 'Preisspanne, z.B. "149.900 – 249.900 €"' },
        description: { type: 'string', description: 'Kurzbeschreibung des Projekts (max 200 Zeichen)' },
        projectType: { type: 'string', enum: ['neubau', 'aufteilung'], description: 'neubau = Neubau, aufteilung = Bestandsobjekt mit Aufteilung' },
        constructionYear: { type: 'number', description: 'Baujahr (0 wenn nicht erkennbar)' },
        modernizationStatus: { type: 'string', description: 'z.B. "saniert 2020", "kernsaniert", "unsaniert"' },
        wegCount: { type: 'number', description: 'Anzahl WEGs, 0 oder 1 bei einfachen Projekten' },
        wegDetails: {
          type: 'array',
          description: 'WEG-Details bei Aufteilungsobjekten',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              unitsCount: { type: 'number' },
              addressRange: { type: 'string' },
            },
          },
        },
        developer: { type: 'string', description: 'Bauträger/Verkäufer — Firmenname OHNE Rechtsform (z.B. "Muster Immobilien" statt "Muster Immobilien GmbH")' },
        developerLegalForm: { type: 'string', description: 'Rechtsform des Bauträgers: GmbH, GmbH & Co. KG, AG, etc.' },
        developerManagingDirector: { type: 'string', description: 'Geschäftsführer / Vorstand des Bauträgers' },
        developerStreet: { type: 'string', description: 'Straße + Hausnummer des Bauträgers (aus Impressum)' },
        developerPostalCode: { type: 'string', description: 'PLZ des Bauträgers (aus Impressum)' },
        developerCity: { type: 'string', description: 'Stadt des Bauträgers (aus Impressum)' },
        developerHrb: { type: 'string', description: 'HRB-Nummer + Amtsgericht (z.B. "HRB 12345, Amtsgericht München")' },
        developerUstId: { type: 'string', description: 'Umsatzsteuer-Identifikationsnummer (USt-IdNr.)' },
        summary: { type: 'string', description: 'Kurze Zusammenfassung des Exposés in 2-3 Sätzen' },
        // ── Extended fields for Kaufy-Readiness ──
        fullDescription: { type: 'string', description: 'Ausführliche Objektbeschreibung (500-1000 Wörter). Lage, Ausstattung, Besonderheiten, Verkehrsanbindung, Umgebung. Alles was im Exposé als Fließtext steht.' },
        locationDescription: { type: 'string', description: 'Lagebeschreibung separat: Infrastruktur, ÖPNV, Schulen, Einkaufsmöglichkeiten, Naherholung.' },
        features: { type: 'array', items: { type: 'string' }, description: 'Ausstattungsmerkmale als Liste, z.B. ["Balkon", "Aufzug", "Keller", "TG-Stellplatz", "Fußbodenheizung"]' },
        energyCertType: { type: 'string', description: '"Verbrauchsausweis" oder "Bedarfsausweis"' },
        energyCertValue: { type: 'number', description: 'Energiekennwert in kWh/(m²·a)' },
        energyClass: { type: 'string', description: 'Energieeffizienzklasse: "A+" bis "H"' },
        heatingType: { type: 'string', description: 'Heizungsart: "Zentralheizung", "Etagenheizung", "Fernwärme", "Wärmepumpe" etc.' },
        energySource: { type: 'string', description: 'Energieträger: "Gas", "Fernwärme", "Wärmepumpe", "Öl", "Strom" etc.' },
        renovationYear: { type: 'number', description: 'Letztes Sanierungsjahr (0 wenn nicht erkennbar)' },
        parkingType: { type: 'string', description: '"Tiefgarage", "Stellplatz", "Carport", "keine" oder Kombination' },
        parkingPrice: { type: 'number', description: 'Stellplatzpreis in EUR (falls separat ausgewiesen)' },
      },
      required: ['projectName', 'city', 'projectType'],
    },
  },
};

const EXPOSE_SYSTEM_PROMPT = `Du bist ein Immobilien-Datenextraktor. Analysiere das Exposé VOLLSTÄNDIG und extrahiere ALLE verfügbaren Projekt-Metadaten mit der Tool-Funktion extract_project_data.

WICHTIG:
- Extrahiere Projekt-Metadaten (Name, Stadt, PLZ, Adresse, Typ, Baujahr, WEGs, Bauträger).
- Extrahiere KEINE einzelnen Wohneinheiten — die kommen aus der Preisliste.
- Projekttyp "aufteilung" bei: Bestandsgebäude, Baujahr vor 2020, WEG-Strukturen.
- Projekttyp "neubau" bei: Neubau, Erstbezug.
- Bei mehreren WEGs: Zähle sie korrekt und liste Details.

ERWEITERTE EXTRAKTION — Fülle diese Felder, wenn die Informationen im Exposé stehen:
- fullDescription: Den GESAMTEN Fließtext aus dem Exposé zusammenfassen (Objektbeschreibung, Ausstattung, Besonderheiten). 500-1000 Wörter.
- locationDescription: Lagebeschreibung separat (Infrastruktur, ÖPNV, Schulen, Einkauf, Naherholung).
- features: Alle Ausstattungsmerkmale als Liste (Balkon, Aufzug, Keller, Stellplatz-Typ, Fußbodenheizung, etc.).
- Energieausweis: energyCertType, energyCertValue (kWh/m²a), energyClass (A+ bis H).
- heatingType: Heizungsart. energySource: Energieträger.
- renovationYear: Letztes Sanierungsjahr.
- parkingType: Stellplatz-Art. parkingPrice: Stellplatzpreis falls separat.

ANBIETER/IMPRESSUM — Extrahiere aus dem Impressum oder der Anbieter-Sektion des Exposés:
- developer: Firmenname OHNE Rechtsform (z.B. "Muster Immobilien" statt "Muster Immobilien GmbH")
- developerLegalForm: Rechtsform (GmbH, GmbH & Co. KG, AG, etc.)
- developerManagingDirector: Geschäftsführer oder Vorstand
- developerStreet: Straße + Hausnummer des Anbieters
- developerPostalCode: PLZ des Anbieters
- developerCity: Stadt des Anbieters
- developerHrb: HRB-Nummer + Amtsgericht (z.B. "HRB 12345, Amtsgericht München")
- developerUstId: USt-IdNr. (Umsatzsteuer-Identifikationsnummer)

- Rufe IMMER die Tool-Funktion auf, auch wenn du nur wenige Felder füllen kannst.`;

// ── Standard folder templates ─────────────────────────────────────────────────
const PROJECT_FOLDERS = [
  '01_expose',
  '02_preisliste',
  '03_bilder_marketing',
  '04_kalkulation_exports',
  '05_reservierungen',
  '06_vertraege',
  '99_sonstiges',
];

const UNIT_FOLDERS = [
  '01_grundriss',
  '02_bilder',
  '03_verkaufsunterlagen',
  '04_vertraege_reservierung',
  '99_sonstiges',
];

interface ExtractedUnit {
  unitNumber: string;
  type: string;
  area: number;
  rooms: number;
  floor: string;
  price: number;
  currentRent?: number;
  hausgeld?: number;
  instandhaltung?: number;
  nettoRendite?: number;
  weg?: string;
  mietfaktor?: number;
}

interface ColumnMapping {
  original_column: string;
  mapped_to: string;
}

interface ExtractedData {
  projectName: string;
  address: string;
  city: string;
  postalCode: string;
  unitsCount: number;
  totalArea: number;
  priceRange: string;
  description?: string;
  projectType?: 'neubau' | 'aufteilung';
  constructionYear?: number;
  modernizationStatus?: string;
  wegCount?: number;
  wegDetails?: { name: string; unitsCount: number; addressRange: string }[];
  developer?: string;
  developerLegalForm?: string;
  developerManagingDirector?: string;
  developerStreet?: string;
  developerPostalCode?: string;
  developerCity?: string;
  developerHrb?: string;
  developerUstId?: string;
  extractedUnits?: ExtractedUnit[];
  columnMapping?: ColumnMapping[];
  // Extended fields for Kaufy-Readiness
  fullDescription?: string;
  locationDescription?: string;
  features?: string[];
  energyCertType?: string;
  energyCertValue?: number;
  energyClass?: string;
  heatingType?: string;
  energySource?: string;
  renovationYear?: number;
  parkingType?: string;
  parkingPrice?: number;
  commissionRate?: number;
  ancillaryCostPercent?: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await authClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      console.error('JWT validation failed:', claimsError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const user = { id: claimsData.claims.sub as string };

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: profile } = await supabase
      .from('profiles')
      .select('active_tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile?.active_tenant_id) {
      return new Response(JSON.stringify({ error: 'No tenant selected' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tenantId = profile.active_tenant_id;
    const contentType = req.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
      return new Response(JSON.stringify({ error: 'JSON body required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { storagePaths, mode, reviewedData } = body;

    console.log('Project intake v3:', { mode, storagePaths });

    if (mode === 'analyze') {
      return await handleAnalyze(supabase, tenantId, storagePaths);
    } else if (mode === 'create') {
      return await handleCreate(supabase, tenantId, storagePaths, reviewedData, user.id);
    } else {
      return new Response(JSON.stringify({ error: 'Invalid mode' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Intake error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Internal server error',
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// ANALYZE MODE — Sequential: Expose first (Pro), then Pricelist via shared parser
// ══════════════════════════════════════════════════════════════════════════════

async function handleAnalyze(
  supabase: ReturnType<typeof createClient>,
  tenantId: string,
  storagePaths: { expose?: string; pricelist?: string },
): Promise<Response> {
  const extractedData: ExtractedData = {
    projectName: '',
    address: '',
    city: '',
    postalCode: '',
    unitsCount: 0,
    totalArea: 0,
    priceRange: '',
    extractedUnits: [],
  };

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

  // ── STEP 1: Exposé — AI extraction with gemini-2.5-pro + Tool-Calling ──
  let exposeStatus: 'skipped' | 'success' | 'empty' | 'error' = 'skipped';

  if (storagePaths.expose && LOVABLE_API_KEY) {
    try {
      const { data: fileData, error: dlError } = await supabase.storage
        .from('tenant-documents')
        .download(storagePaths.expose);

      if (dlError) {
        console.error('Download expose error:', dlError);
        exposeStatus = 'error';
      } else if (fileData && fileData.size <= MAX_AI_PROCESSING_SIZE) {
        const buffer = await fileData.arrayBuffer();
        const base64 = uint8ToBase64(new Uint8Array(buffer));
        const pdfSizeBytes = buffer.byteLength;

        // Build tool_choice based on toggle
        const toolChoicePayload = EXPOSE_TOOL_CHOICE_MODE === 'forced'
          ? { type: 'function' as const, function: { name: 'extract_project_data' } }
          : 'auto';

        const aiRequestConfig = {
          model: 'google/gemini-2.5-pro',
          tool_choice_mode: EXPOSE_TOOL_CHOICE_MODE,
          max_tokens: EXPOSE_MAX_TOKENS,
          temperature: EXPOSE_TEMPERATURE,
          pdf_size_bytes: pdfSizeBytes,
        };
        console.log('[expose-diag] AI request config:', JSON.stringify(aiRequestConfig));

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-pro',
            messages: [
              { role: 'system', content: EXPOSE_SYSTEM_PROMPT },
              {
                role: 'user',
                content: [
                  { type: 'text', text: 'Analysiere dieses Immobilien-Exposé und extrahiere die Projekt-Metadaten mit der Tool-Funktion.' },
                  { type: 'image_url', image_url: { url: `data:application/pdf;base64,${base64}` } }
                ]
              }
            ],
            tools: [EXTRACT_PROJECT_TOOL],
            tool_choice: toolChoicePayload,
            max_tokens: EXPOSE_MAX_TOKENS,
            temperature: EXPOSE_TEMPERATURE,
          }),
        });

        if (aiResponse.ok) {
          const aiResult = await aiResponse.json();
          
          // Structured diagnostic logging
          const diagLog = {
            model: aiResult.model || 'unknown',
            tool_choice_mode: EXPOSE_TOOL_CHOICE_MODE,
            max_tokens: EXPOSE_MAX_TOKENS,
            temperature: EXPOSE_TEMPERATURE,
            finish_reason: aiResult.choices?.[0]?.finish_reason || 'none',
            content_length: aiResult.choices?.[0]?.message?.content?.length || 0,
            tool_calls_count: aiResult.choices?.[0]?.message?.tool_calls?.length || 0,
            pdf_size_bytes: pdfSizeBytes,
            pdf_mime: 'application/pdf',
            usage: aiResult.usage || null,
          };
          console.log('[expose-diag] AI response:', JSON.stringify(diagLog));
          
          const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
          if (toolCall?.function?.arguments) {
            try {
              const parsed = JSON.parse(toolCall.function.arguments);
              Object.assign(extractedData, {
                projectName: parsed.projectName || '',
                city: parsed.city || '',
                postalCode: parsed.postalCode || '',
                address: parsed.address || '',
                unitsCount: parseInt(parsed.unitsCount) || 0,
                totalArea: parseFloat(parsed.totalArea) || 0,
                priceRange: parsed.priceRange || '',
                description: parsed.description || parsed.summary || '',
                projectType: parsed.projectType || 'neubau',
                constructionYear: parsed.constructionYear || 0,
                modernizationStatus: parsed.modernizationStatus || '',
                wegCount: parsed.wegCount || 0,
                wegDetails: Array.isArray(parsed.wegDetails) ? parsed.wegDetails : [],
                developer: parsed.developer || '',
                developerLegalForm: parsed.developerLegalForm || '',
                developerManagingDirector: parsed.developerManagingDirector || '',
                developerStreet: parsed.developerStreet || '',
                developerPostalCode: parsed.developerPostalCode || '',
                developerCity: parsed.developerCity || '',
                developerHrb: parsed.developerHrb || '',
                developerUstId: parsed.developerUstId || '',
                // Extended fields
                fullDescription: parsed.fullDescription || '',
                locationDescription: parsed.locationDescription || '',
                features: Array.isArray(parsed.features) ? parsed.features : [],
                energyCertType: parsed.energyCertType || '',
                energyCertValue: parseFloat(parsed.energyCertValue) || 0,
                energyClass: parsed.energyClass || '',
                heatingType: parsed.heatingType || '',
                energySource: parsed.energySource || '',
                renovationYear: parseInt(parsed.renovationYear) || 0,
                parkingType: parsed.parkingType || '',
                parkingPrice: parseFloat(parsed.parkingPrice) || 0,
              });
              exposeStatus = 'success';
              console.log('[expose-diag] ✅ Extraction SUCCESS:', extractedData.projectName, '— Type:', extractedData.projectType, '— WEGs:', extractedData.wegCount);
            } catch (parseErr) {
              console.error('[expose-diag] ❌ Tool-calling parse error:', parseErr);
              exposeStatus = 'error';
            }
          } else {
            // Fallback: content-based parsing
            const content = aiResult.choices?.[0]?.message?.content;
            if (content) {
              console.log('[expose-diag] No tool_calls, attempting content fallback. Content preview:', content.substring(0, 200));
              const jsonMatch = content.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                try {
                  const parsed = JSON.parse(jsonMatch[0]);
                  Object.assign(extractedData, {
                    projectName: parsed.projectName || '',
                    city: parsed.city || '',
                    postalCode: parsed.postalCode || '',
                    address: parsed.address || '',
                    unitsCount: parseInt(parsed.unitsCount) || 0,
                    totalArea: parseFloat(parsed.totalArea) || 0,
                    priceRange: parsed.priceRange || '',
                    description: parsed.description || '',
                    projectType: parsed.projectType || 'neubau',
                    constructionYear: parsed.constructionYear || 0,
                    modernizationStatus: parsed.modernizationStatus || '',
                    wegCount: parsed.wegCount || 0,
                    wegDetails: Array.isArray(parsed.wegDetails) ? parsed.wegDetails : [],
                    developer: parsed.developer || '',
                    // Extended fields
                    fullDescription: parsed.fullDescription || '',
                    locationDescription: parsed.locationDescription || '',
                    features: Array.isArray(parsed.features) ? parsed.features : [],
                    energyCertType: parsed.energyCertType || '',
                    energyCertValue: parseFloat(parsed.energyCertValue) || 0,
                    energyClass: parsed.energyClass || '',
                    heatingType: parsed.heatingType || '',
                    energySource: parsed.energySource || '',
                    renovationYear: parseInt(parsed.renovationYear) || 0,
                    parkingType: parsed.parkingType || '',
                    parkingPrice: parseFloat(parsed.parkingPrice) || 0,
                  });
                  exposeStatus = 'success';
                  console.log('[expose-diag] ✅ Fallback extraction:', extractedData.projectName);
                } catch (parseErr) {
                  console.error('[expose-diag] ❌ Content JSON parse error:', parseErr);
                  exposeStatus = 'error';
                }
              } else {
                console.error('[expose-diag] ❌ Content present but no JSON found. Content preview:', content.substring(0, 300));
                exposeStatus = 'error';
              }
            } else {
              // THIS IS THE SILENT FAIL CASE — now explicit
              console.error('[expose-diag] ❌ EMPTY RESPONSE — no tool_calls AND no content.', JSON.stringify(diagLog));
              exposeStatus = 'empty';
            }
          }
        } else {
          const errText = await aiResponse.text();
          console.error('[expose-diag] ❌ AI HTTP error:', aiResponse.status, errText);
          exposeStatus = 'error';
          if (aiResponse.status === 429 || aiResponse.status === 402) {
            return new Response(JSON.stringify({
              error: aiResponse.status === 429
                ? 'KI-Rate-Limit erreicht. Bitte versuchen Sie es in einer Minute erneut.'
                : 'KI-Credits aufgebraucht. Bitte laden Sie Credits nach.',
            }), {
              status: aiResponse.status,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      } else if (fileData) {
        console.log('[expose-diag] File too large for AI:', fileData.size, 'bytes');
        exposeStatus = 'error';
      }
    } catch (err) {
      console.error('[expose-diag] ❌ Expose extraction exception:', err);
      exposeStatus = 'error';
    }
  }

  console.log('[expose-diag] Final expose status:', exposeStatus);

  // ── STEP 2: Pricelist — via shared tabular parser ──────────────────────
  if (storagePaths.pricelist) {
    try {
      const { data: fileData, error: dlError } = await supabase.storage
        .from('tenant-documents')
        .download(storagePaths.pricelist);

      if (dlError) {
        console.error('Download pricelist error:', dlError);
      } else if (fileData && fileData.size <= MAX_AI_PROCESSING_SIZE) {
        const buffer = await fileData.arrayBuffer();
        const fileBytes = new Uint8Array(buffer);

        // Build context hint from exposé data
        let hint = '';
        if (extractedData.projectName) {
          hint = `Dies ist eine Immobilien-Preisliste für "${extractedData.projectName}"`;
          if (extractedData.city) hint += ` in ${extractedData.city}`;
          hint += '.';
          if (extractedData.unitsCount) hint += ` Es werden ca. ${extractedData.unitsCount} Einheiten erwartet.`;
          if (extractedData.wegCount && extractedData.wegCount > 1) {
            hint += ` Das Projekt hat ${extractedData.wegCount} WEGs.`;
            if (extractedData.wegDetails) {
              for (const weg of extractedData.wegDetails) {
                hint += ` ${weg.name} (${weg.unitsCount} Einheiten).`;
              }
            }
          }
          hint += ' Typische Spalten: Whg-Nr, Wohnfläche, Zimmer, Etage, Kaufpreis, Miete, Hausgeld, WEG.';
        }

        // Detect content type
        const ext = storagePaths.pricelist.toLowerCase().split('.').pop() || '';
        const mimeMap: Record<string, string> = {
          xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          xls: 'application/vnd.ms-excel',
          csv: 'text/csv',
          pdf: 'application/pdf',
        };
        const pricelistMime = mimeMap[ext] || 'application/octet-stream';

        // ── Use shared tabular parser ─────────────────────────────────
        const tabularResult = await parseTabularFile({
          content: fileBytes,
          contentType: pricelistMime,
          filename: storagePaths.pricelist,
          apiKey: LOVABLE_API_KEY || undefined,
          hint,
        });

        if (tabularResult && tabularResult.rowCount > 0) {
          console.log(`Pricelist parsed via shared tabular-parser: ${tabularResult.rowCount} rows, method: ${tabularResult.extractionMethod}`);

          // Apply fuzzy column mapping with real estate specific patterns
          const { colMap, columnMapping: mappedCols } = fuzzyMapColumns(
            tabularResult.headers,
            tabularResult.rawHeaders,
            STANDARD_COLUMN_PATTERNS,
            tabularResult.rows,
          );

          console.log('Column map:', colMap);

          // Convert rows to ExtractedUnit objects
          const units: ExtractedUnit[] = [];
          for (let ri = 0; ri < tabularResult.rows.length; ri++) {
            const row = tabularResult.rows[ri];
            const areaVal = colMap.area !== undefined ? parseGermanNumber(row[colMap.area]) : 0;
            let priceVal = colMap.price !== undefined ? parseGermanNumber(row[colMap.price]) : 0;
            const pricePerSqmVal = colMap.pricePerSqm !== undefined ? parseGermanNumber(row[colMap.pricePerSqm]) : 0;
            
            // If we have pricePerSqm but no total price, calculate total price
            if (!priceVal && pricePerSqmVal > 0 && areaVal > 0) {
              priceVal = Math.round(pricePerSqmVal * areaVal * 100) / 100;
            }
            
            if (!areaVal && !priceVal) continue; // Skip non-data rows

            const unit: ExtractedUnit = {
              unitNumber: colMap.unitNumber !== undefined ? String(row[colMap.unitNumber] || `WE-${ri + 1}`).trim() : `WE-${ri + 1}`,
              type: colMap.type !== undefined ? String(row[colMap.type] || 'Wohnung').trim() : 'Wohnung',
              area: areaVal,
              rooms: colMap.rooms !== undefined ? parseGermanNumber(row[colMap.rooms]) : 0,
              floor: colMap.floor !== undefined ? String(row[colMap.floor] || '').trim() : '',
              price: priceVal,
              currentRent: colMap.currentRent !== undefined ? parseGermanNumber(row[colMap.currentRent]) : 0,
              hausgeld: colMap.hausgeld !== undefined ? parseGermanNumber(row[colMap.hausgeld]) : 0,
              instandhaltung: colMap.instandhaltung !== undefined ? parseGermanNumber(row[colMap.instandhaltung]) : 0,
              weg: colMap.weg !== undefined ? String(row[colMap.weg] || '').trim() : '',
            };

            // Calculate derived fields
            if (unit.currentRent && unit.price) {
              const annualRent = unit.currentRent * 12;
              const annualHausgeld = (unit.hausgeld || 0) * 12;
              unit.nettoRendite = Math.round(((annualRent - annualHausgeld) / unit.price) * 10000) / 100;
              unit.mietfaktor = Math.round((unit.price / annualRent) * 10) / 10;
            }

            units.push(unit);
          }

          if (units.length > 0) {
            extractedData.extractedUnits = units;
            extractedData.unitsCount = units.length;
            extractedData.totalArea = Math.round(units.reduce((s, u) => s + (u.area || 0), 0) * 100) / 100;
            const prices = units.map(u => u.price).filter(p => p > 0);
            if (prices.length > 0) {
              const min = Math.min(...prices);
              const max = Math.max(...prices);
              extractedData.priceRange = min === max
                ? `${min.toLocaleString('de-DE')} €`
                : `${min.toLocaleString('de-DE')} – ${max.toLocaleString('de-DE')} €`;
            }
            extractedData.columnMapping = mappedCols.map(m => ({
              original_column: m.original_column,
              mapped_to: m.mapped_to,
            }));
            console.log(`Pricelist: ${units.length} units extracted via shared parser (${tabularResult.extractionMethod})`);
          }
        } else {
          console.log('Tabular parser returned no data for pricelist');
        }
      }
    } catch (err) {
      console.error('Pricelist extraction error:', err);
    }
  }

  // Fallback name
  if (!extractedData.projectName) {
    extractedData.projectName = `Neues Projekt ${new Date().getFullYear()}`;
  }

  return new Response(JSON.stringify({ success: true, extractedData, exposeStatus }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// CREATE MODE
// ══════════════════════════════════════════════════════════════════════════════

async function handleCreate(
  supabase: ReturnType<typeof createClient>,
  tenantId: string,
  storagePaths: { expose?: string; pricelist?: string },
  reviewedData: ExtractedData,
  userId: string
): Promise<Response> {
  console.log('Create mode:', reviewedData.projectName, '—', reviewedData.extractedUnits?.length || 0, 'units');

  // ── 1. Developer Context (use extracted developer name from Exposé) ─────
  let contextId: string;
  const developerName = reviewedData.developer?.trim();

  if (developerName) {
    // Search for existing context with matching name for this tenant
    const { data: matchingCtx } = await supabase
      .from('developer_contexts')
      .select('id')
      .eq('tenant_id', tenantId)
      .ilike('name', developerName)
      .limit(1);

    if (matchingCtx && matchingCtx.length > 0) {
      contextId = matchingCtx[0].id;
      console.log(`Developer context found by name "${developerName}":`, contextId);

      // Update empty fields with extracted data (don't overwrite existing manual entries)
      const updateFields: Record<string, string> = {};
      if (reviewedData.developerLegalForm) updateFields.legal_form = reviewedData.developerLegalForm;
      if (reviewedData.developerManagingDirector) updateFields.managing_director = reviewedData.developerManagingDirector;
      if (reviewedData.developerStreet) updateFields.street = reviewedData.developerStreet;
      if (reviewedData.developerPostalCode) updateFields.postal_code = reviewedData.developerPostalCode;
      if (reviewedData.developerCity) updateFields.city = reviewedData.developerCity;
      if (reviewedData.developerHrb) updateFields.hrb_number = reviewedData.developerHrb;
      if (reviewedData.developerUstId) updateFields.ust_id = reviewedData.developerUstId;

      if (Object.keys(updateFields).length > 0) {
        // Only update fields that are currently empty in the DB
        const { data: currentCtx } = await supabase
          .from('developer_contexts')
          .select('legal_form, managing_director, street, postal_code, city, hrb_number, ust_id')
          .eq('id', contextId)
          .single();

        if (currentCtx) {
          const fieldsToUpdate: Record<string, string> = {};
          for (const [key, value] of Object.entries(updateFields)) {
            if (!currentCtx[key as keyof typeof currentCtx]) {
              fieldsToUpdate[key] = value;
            }
          }
          if (Object.keys(fieldsToUpdate).length > 0) {
            await supabase.from('developer_contexts').update(fieldsToUpdate).eq('id', contextId);
            console.log(`Developer context updated with extracted fields:`, Object.keys(fieldsToUpdate));
          }
        }
      }
    } else {
      // Create NEW context with the extracted developer name + all available fields
      const { data: newCtx, error: ctxErr } = await supabase
        .from('developer_contexts')
        .insert({
          tenant_id: tenantId,
          name: developerName,
          legal_form: reviewedData.developerLegalForm || '',
          managing_director: reviewedData.developerManagingDirector || '',
          street: reviewedData.developerStreet || '',
          postal_code: reviewedData.developerPostalCode || '',
          city: reviewedData.developerCity || '',
          hrb_number: reviewedData.developerHrb || '',
          ust_id: reviewedData.developerUstId || '',
          is_default: false,
        })
        .select('id')
        .single();
      if (ctxErr) throw new Error('Context creation failed: ' + ctxErr.message);
      contextId = newCtx.id;
      console.log(`Developer context created for "${developerName}" with full Impressum data:`, contextId);
    }
  } else {
    // Fallback: use first existing context or create generic one
    const { data: existingContexts } = await supabase
      .from('developer_contexts')
      .select('id')
      .eq('tenant_id', tenantId)
      .limit(1);

    if (existingContexts && existingContexts.length > 0) {
      contextId = existingContexts[0].id;
    } else {
      const { data: newCtx, error: ctxErr } = await supabase
        .from('developer_contexts')
        .insert({
          tenant_id: tenantId,
          name: 'Meine Gesellschaft',
          legal_form: 'GmbH',
          is_default: true,
        })
        .select('id')
        .single();
      if (ctxErr) throw new Error('Context creation failed: ' + ctxErr.message);
      contextId = newCtx.id;
    }
  }

  // ── 2. Generate project code ──────────────────────────────────────────────
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from('dev_projects')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .like('project_code', `BT-${year}-%`);

  const projectCode = `BT-${year}-${String((count || 0) + 1).padStart(3, '0')}`;

  // ── 3. Create project ─────────────────────────────────────────────────────
  const { data: project, error: projErr } = await supabase
    .from('dev_projects')
    .insert({
      tenant_id: tenantId,
      developer_context_id: contextId,
      project_code: projectCode,
      name: reviewedData.projectName || `Projekt ${projectCode}`,
      city: reviewedData.city || null,
      postal_code: reviewedData.postalCode || null,
      address: reviewedData.address || null,
      description: reviewedData.description || null,
      project_type: reviewedData.projectType === 'aufteilung' ? 'aufteilung' : 'neubau',
      total_units_count: reviewedData.extractedUnits?.length || reviewedData.unitsCount || 0,
      status: 'draft_ready',
      needs_review: false,
      // Extended fields from Exposé
      full_description: reviewedData.fullDescription || null,
      location_description: reviewedData.locationDescription || null,
      features: reviewedData.features && reviewedData.features.length > 0 ? reviewedData.features : null,
      energy_cert_type: reviewedData.energyCertType || null,
      energy_cert_value: reviewedData.energyCertValue || null,
      energy_class: reviewedData.energyClass || null,
      heating_type: reviewedData.heatingType || null,
      energy_source: reviewedData.energySource || null,
      renovation_year: reviewedData.renovationYear || null,
      parking_type: reviewedData.parkingType || null,
      parking_price: reviewedData.parkingPrice || null,
      intake_data: {
        created_at: new Date().toISOString(),
        files: storagePaths,
        reviewed_data: reviewedData,
        column_mapping: reviewedData.columnMapping || [],
        construction_year: reviewedData.constructionYear || null,
        modernization_status: reviewedData.modernizationStatus || null,
        weg_count: reviewedData.wegCount || 0,
        weg_details: reviewedData.wegDetails || [],
        developer: reviewedData.developer || null,
      },
    })
    .select('id, project_code')
    .single();

  if (projErr) throw new Error('Project creation failed: ' + projErr.message);

  // ── 4. Bulk-insert units ──────────────────────────────────────────────────
  if (reviewedData.extractedUnits && reviewedData.extractedUnits.length > 0) {
    const unitRows = reviewedData.extractedUnits.map((u, idx) => ({
      tenant_id: tenantId,
      project_id: project.id,
      unit_number: u.unitNumber || `WE-${String(idx + 1).padStart(3, '0')}`,
      area_sqm: u.area || 0,
      rooms_count: u.rooms || 0,
      floor: parseInt(String(u.floor || '0').replace(/[^0-9-]/g, '')) || 0,
      list_price: u.price || 0,
      price_per_sqm: u.area > 0 ? Math.round((u.price || 0) / u.area * 100) / 100 : 0,
      current_rent: u.currentRent || 0,
      hausgeld: u.hausgeld || null,
      status: 'available',
    }));

    const { error: unitsErr } = await supabase
      .from('dev_project_units')
      .insert(unitRows);

    if (unitsErr) {
      console.error('Units insert error:', unitsErr);
      throw new Error('Units insert failed: ' + unitsErr.message);
    } else {
      console.log(`Inserted ${unitRows.length} units for project ${project.project_code}`);

      // ── FIX-A: Aggregate financial KPIs from units to project level ──────
      const totalListPrice = unitRows.reduce((s: number, u: any) => s + (u.list_price || 0), 0);
      const totalYearlyRent = unitRows.reduce((s: number, u: any) => s + ((u.current_rent || 0) * 12), 0);

      // Ersteinschätzung: 20% Bauträgermarge unterstellen
      const estimatedPurchasePrice = Math.round(totalListPrice / 1.20);

      const { error: updateErr } = await supabase.from('dev_projects').update({
        purchase_price: estimatedPurchasePrice,
        total_sale_target: totalListPrice,
        commission_rate_percent: reviewedData.commissionRate || 3.57,
        ancillary_cost_percent: reviewedData.ancillaryCostPercent || 10,
      }).eq('id', project.id);

      if (updateErr) {
        console.error('Financial KPI update error:', updateErr);
        throw new Error('Financial KPI update failed: ' + updateErr.message);
      }
      console.log(`Financial KPIs set: purchase=${estimatedPurchasePrice}, saleTarget=${totalListPrice}`);
    }
  }

  // ── 5. Seed storage_nodes tree ────────────────────────────────────────────
  try {
    // Check for existing root node (prevents duplicates on retry)
    const { data: existingRoot } = await supabase
      .from('storage_nodes')
      .select('id')
      .eq('entity_id', project.id)
      .is('parent_id', null)
      .maybeSingle();

    let rootNode = existingRoot;

    if (!existingRoot) {
      const { data: newRoot, error: rootErr } = await supabase
        .from('storage_nodes')
        .insert({
          tenant_id: tenantId,
          name: project.project_code,
          node_type: 'folder',
          module_code: 'MOD-13',
          entity_id: project.id,
          parent_id: null,
        })
        .select('id')
        .single();

      if (rootErr) {
        console.error('Storage root insert error:', rootErr);
      }
      rootNode = newRoot;
    } else {
      console.log(`Storage root already exists for project ${project.id}, skipping tree seeding`);
    }

    if (rootNode) {
      for (const folderName of PROJECT_FOLDERS) {
        await supabase.from('storage_nodes').insert({
          tenant_id: tenantId,
          name: folderName,
          node_type: 'folder',
          module_code: 'MOD-13',
          entity_id: project.id,
          parent_id: rootNode.id,
        });
      }

      if (reviewedData.extractedUnits && reviewedData.extractedUnits.length > 0) {
        const { data: unitsParent } = await supabase
          .from('storage_nodes')
          .insert({
            tenant_id: tenantId,
            name: '07_einheiten',
            node_type: 'folder',
            module_code: 'MOD-13',
            entity_id: project.id,
            parent_id: rootNode.id,
          })
          .select('id')
          .single();

        if (unitsParent) {
          for (const unit of reviewedData.extractedUnits) {
            const { data: unitFolder } = await supabase
              .from('storage_nodes')
              .insert({
                tenant_id: tenantId,
                name: unit.unitNumber || 'WE-???',
                node_type: 'folder',
                module_code: 'MOD-13',
                entity_id: project.id,
                parent_id: unitsParent.id,
              })
              .select('id')
              .single();

            if (unitFolder) {
              for (const sub of UNIT_FOLDERS) {
                await supabase.from('storage_nodes').insert({
                  tenant_id: tenantId,
                  name: sub,
                  node_type: 'folder',
                  module_code: 'MOD-13',
                  entity_id: project.id,
                  parent_id: unitFolder.id,
                });
              }
            }
          }
        }
      }
      console.log('Storage tree seeded for', project.project_code);
    }
  } catch (treeErr) {
    console.error('Storage tree error:', treeErr);
  }

  // ── 6. Link uploaded exposé into project DMS tree ─────────────────────────
  if (storagePaths.expose) {
    try {
      const { data: exposeFolder } = await supabase
        .from('storage_nodes')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('entity_id', project.id)
        .eq('name', '01_expose')
        .eq('node_type', 'folder')
        .limit(1)
        .maybeSingle();

      if (exposeFolder) {
        const fileName = storagePaths.expose.split('/').pop() || 'Expose.pdf';
        const { error: expLinkErr } = await supabase.from('storage_nodes').insert({
          tenant_id: tenantId,
          name: fileName,
          node_type: 'file',
          module_code: 'MOD-13',
          entity_id: project.id,
          parent_id: exposeFolder.id,
          storage_path: storagePaths.expose,
          mime_type: 'application/pdf',
        });
        if (expLinkErr) console.error('❌ Exposé DMS link failed:', expLinkErr.message);
        else console.log('✅ Exposé linked to DMS tree:', fileName);
      }
    } catch (linkErr) {
      console.error('Exposé DMS link error:', linkErr);
    }
  }

  // ── 7. Link uploaded pricelist into project DMS tree ──────────────────────
  if (storagePaths.pricelist) {
    try {
      const { data: pricelistFolder } = await supabase
        .from('storage_nodes')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('entity_id', project.id)
        .eq('name', '02_preisliste')
        .eq('node_type', 'folder')
        .limit(1)
        .maybeSingle();

      if (pricelistFolder) {
        const fileName = storagePaths.pricelist.split('/').pop() || 'Preisliste.pdf';
        const mimeType = storagePaths.pricelist.endsWith('.pdf') ? 'application/pdf'
          : storagePaths.pricelist.endsWith('.xlsx') ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/csv';
        const { error: plLinkErr } = await supabase.from('storage_nodes').insert({
          tenant_id: tenantId,
          name: fileName,
          node_type: 'file',
          module_code: 'MOD-13',
          entity_id: project.id,
          parent_id: pricelistFolder.id,
          storage_path: storagePaths.pricelist,
          mime_type: mimeType,
        });
        if (plLinkErr) console.error('❌ Pricelist DMS link failed:', plLinkErr.message);
        else console.log('✅ Pricelist linked to DMS tree:', fileName);
      }
    } catch (linkErr) {
      console.error('Pricelist DMS link error:', linkErr);
    }
  }

  return new Response(JSON.stringify({
    success: true,
    projectId: project.id,
    projectCode: project.project_code,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function mapUnitType(raw: string): string {
  const lower = (raw || '').toLowerCase();
  if (lower.includes('penthouse')) return 'penthouse';
  if (lower.includes('maisonette')) return 'maisonette';
  if (lower.includes('gewerbe')) return 'gewerbe';
  if (lower.includes('stellplatz') || lower.includes('garage') || lower.includes('parkplatz')) return 'stellplatz';
  if (lower.includes('büro') || lower.includes('buero')) return 'buero';
  if (lower.includes('lager')) return 'lager';
  if (lower.includes('keller')) return 'keller';
  if (lower.includes('apartment')) return 'apartment';
  return 'wohnung';
}
