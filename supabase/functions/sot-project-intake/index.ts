/**
 * SOT Project Intake - Magic Intake with Full AI + XLSX + Storage-Tree
 * MOD-13 PROJEKTE
 * 
 * Modes:
 *   analyze  — Extract project data from Exposé (AI) + parse Pricelist (XLSX) via Tool-Calling
 *   create   — Create project, bulk-insert units, seed storage_nodes tree
 * 
 * Optimierungen v2:
 *   - Expose: gemini-2.5-pro (maximale Dokumentverstaendnis-Qualitaet)
 *   - Pricelist: gemini-2.5-flash (schnell, Tool-Calling)
 *   - Sequenzielle Analyse: Expose → Kontext → Preisliste
 *   - Erweiterte Felder: hausgeld, instandhaltung, nettoRendite, weg, mietfaktor
 *   - Tool-Calling fuer Expose-Extraktion (strukturiert statt Freitext)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";

/** Chunked Base64 conversion — safe for large files (avoids call-stack overflow) */
function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MAX_AI_PROCESSING_SIZE = 20 * 1024 * 1024; // 20MB

// ── Tool-Calling: Expose extraction ───────────────────────────────────────────

const EXTRACT_PROJECT_TOOL = {
  type: 'function' as const,
  function: {
    name: 'extract_project_data',
    description: 'Extrahiere alle Projektdaten aus dem Immobilien-Exposé.',
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
        description: { type: 'string', description: 'Kurzbeschreibung (max 200 Zeichen)' },
        projectType: { type: 'string', enum: ['neubau', 'aufteilung'], description: 'neubau = Neubau, aufteilung = Bestandsobjekt mit Aufteilung in Eigentumswohnungen' },
        constructionYear: { type: 'number', description: 'Baujahr des Gebäudes (0 wenn nicht erkennbar)' },
        modernizationStatus: { type: 'string', description: 'Modernisierungszustand, z.B. "saniert 2020", "kernsaniert", "unsaniert"' },
        wegCount: { type: 'number', description: 'Anzahl WEGs (Wohnungseigentümergemeinschaften), 0 oder 1 bei einfachen Projekten' },
        wegDetails: {
          type: 'array',
          description: 'Details zu den einzelnen WEGs bei Aufteilungsobjekten',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string', description: 'WEG-Bezeichnung, z.B. "WEG 1: Wunne 6-18"' },
              unitsCount: { type: 'number', description: 'Anzahl Einheiten in dieser WEG' },
              addressRange: { type: 'string', description: 'Adressbereich, z.B. "Wunne 6-18"' },
            },
          },
        },
        developer: { type: 'string', description: 'Bauträger/Verkäufer, z.B. "Kalo Eisenach GmbH"' },
        extractedUnits: {
          type: 'array',
          description: 'Falls im Exposé einzelne Einheiten erkennbar sind',
          items: {
            type: 'object',
            properties: {
              unitNumber: { type: 'string' },
              type: { type: 'string' },
              area: { type: 'number' },
              rooms: { type: 'number' },
              floor: { type: 'string' },
              price: { type: 'number' },
              currentRent: { type: 'number' },
              weg: { type: 'string', description: 'WEG-Zuordnung' },
            },
          },
        },
      },
      required: ['projectName', 'city', 'projectType'],
    },
  },
};

// ── Tool-Calling: Pricelist extraction ────────────────────────────────────────

const EXTRACT_UNITS_TOOL = {
  type: 'function' as const,
  function: {
    name: 'extract_units',
    description: 'Extrahiere alle Einheiten aus der Preisliste und melde welche Original-Spalten zu welchen Feldern gemappt wurden.',
    parameters: {
      type: 'object',
      properties: {
        units: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              unitNumber: { type: 'string', description: 'Wohnungsnummer, z.B. WE-001, Top 1, Whg. 1' },
              type: { type: 'string', enum: ['Wohnung', 'Apartment', 'Penthouse', 'Maisonette', 'Gewerbe', 'Stellplatz', 'Buero', 'Lager', 'Keller'] },
              area: { type: 'number', description: 'Wohnfläche in m²' },
              rooms: { type: 'number', description: 'Zimmeranzahl' },
              floor: { type: 'string', description: 'Etage/Geschoss, z.B. EG, 1.OG, DG' },
              price: { type: 'number', description: 'Kaufpreis in EUR (ohne Tausenderpunkte)' },
              currentRent: { type: 'number', description: 'Aktuelle Monatsmiete (Kaltmiete/Ist-Miete) in EUR, 0 wenn nicht vorhanden' },
              hausgeld: { type: 'number', description: 'Monatliches Hausgeld in EUR, 0 wenn nicht vorhanden' },
              instandhaltung: { type: 'number', description: 'Instandhaltungsrücklage in EUR/Monat, 0 wenn nicht vorhanden' },
              nettoRendite: { type: 'number', description: 'Netto-Rendite in Prozent (z.B. 4.5), 0 wenn nicht berechenbar' },
              weg: { type: 'string', description: 'WEG-Zuordnung, z.B. "WEG 1: Wunne 6-18". Leer wenn keine WEG-Struktur.' },
              mietfaktor: { type: 'number', description: 'Kaufpreis / Jahresmiete (z.B. 22.2), 0 wenn nicht berechenbar' },
            },
            required: ['unitNumber', 'type', 'area', 'price'],
          },
        },
        column_mapping: {
          type: 'array',
          description: 'Zuordnung der Original-Spaltenbezeichnungen zu den internen Feldnamen',
          items: {
            type: 'object',
            properties: {
              original_column: { type: 'string', description: 'Exakter Spaltenname aus der Quelldatei' },
              mapped_to: { type: 'string', description: 'Internes Feld: unitNumber, type, area, rooms, floor, price, currentRent, hausgeld, instandhaltung, nettoRendite, weg, mietfaktor' },
            },
            required: ['original_column', 'mapped_to'],
          },
        },
      },
      required: ['units', 'column_mapping'],
    },
  },
};

const EXPOSE_SYSTEM_PROMPT = `Du bist ein hochpräziser Immobilien-Datenextraktor mit Spezialwissen für deutsche Immobilienprojekte.

Analysiere das Exposé und extrahiere ALLE verfügbaren Informationen. Nutze die Tool-Funktion extract_project_data.

BESONDERS WICHTIG bei Aufteilungsobjekten (Bestandsimmobilien, die in Eigentumswohnungen aufgeteilt werden):
- Erkenne ob es sich um ein Aufteilungsobjekt handelt (Baujahr, "Aufteilung", "WEG", Bestandsimmobilie)
- Zähle die WEGs korrekt (z.B. "WEG 1: Wunne 6-18", "WEG 2: Wunne 20-22")
- Extrahiere: Baujahr, Modernisierungszustand, Bauträger/Verkäufer
- Bei Rendite-Informationen: Ist-Miete vs. Soll-Miete unterscheiden
- Hausgeld und Instandhaltungsrücklage erfassen wenn vorhanden

HINWEISE:
- Projekttyp "aufteilung" wenn: Bestandsgebäude, Baujahr vor 2020, Aufteilungsgenehmigung, WEG-Strukturen
- Projekttyp "neubau" wenn: Neubau, Erstbezug, kein Baujahr oder Baujahr aktuell/zukünftig
- Wenn einzelne Einheiten im Exposé erkennbar sind, extrahiere sie auch`;

const PRICELIST_SYSTEM_PROMPT_BASE = `Du bist ein Preislisten-Parser für Immobilienprojekte. Extrahiere ALLE Einheiten aus der Preisliste.

WICHTIG: Die Spalten können in beliebiger Reihenfolge und mit unterschiedlichen Bezeichnungen vorkommen. Hier sind gängige Varianten:

- unitNumber: "Whg-Nr", "Whg.", "WE-Nr.", "Einheit", "Nr.", "Top", "Wohnungsnummer", "Obj.-Nr."
- type: "Typ", "Art", "Wohnungstyp", "Nutzung", "Kategorie"
- area: "Wfl.", "Wohnfläche", "Fläche", "qm", "m²", "m2", "Wfl. (qm)", "Wohnfl.", "Nutzfläche"
- rooms: "Zimmer", "Zi.", "Räume", "Zi.-Anz.", "Zimmeranzahl"
- floor: "Etage", "Geschoss", "OG", "Stockwerk", "Ebene", "Lage"
- price: "Kaufpreis", "Preis", "VK-Preis", "Verkaufspreis", "KP", "Kaufpreis netto", "Preis (EUR)", "Gesamtpreis"
- currentRent: "Miete", "Ist-Miete", "Monatsmiete", "Kaltmiete", "Nettomiete", "akt. Miete", "Mieteinnahme"
- hausgeld: "Hausgeld", "HG", "Hausgeld/Monat", "mtl. Hausgeld"
- instandhaltung: "Instandhaltung", "IHR", "Instandhaltungsrücklage", "Rücklage"
- nettoRendite: "Rendite", "Netto-Rendite", "Rendite p.a.", "Nettoverzinsung"
- weg: "WEG", "WEG-Nr.", "Eigentümergemeinschaft"
- mietfaktor: "Mietfaktor", "Faktor", "Vervielfältiger", "Kaufpreisfaktor"

Nutze die Tool-Funktion extract_units um die Daten strukturiert zurückzugeben.
Befülle IMMER das column_mapping mit den Original-Spaltenbezeichnungen.
Berechne nettoRendite und mietfaktor selbst, wenn Kaufpreis und Miete vorhanden sind:
- nettoRendite = ((currentRent * 12 - hausgeld * 12) / price) * 100
- mietfaktor = price / (currentRent * 12)`;

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
  extractedUnits?: ExtractedUnit[];
  columnMapping?: ColumnMapping[];
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

    // Auth client with user token for JWT validation
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

    // Service role client for DB operations
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

    console.log('Project intake:', { mode, storagePaths });

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
// ANALYZE MODE — Sequential: Expose first (Pro), then Pricelist WITH context (Flash)
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
  if (storagePaths.expose && LOVABLE_API_KEY) {
    try {
      const { data: fileData, error: dlError } = await supabase.storage
        .from('tenant-documents')
        .download(storagePaths.expose);

      if (dlError) {
        console.error('Download expose error:', dlError);
      } else if (fileData && fileData.size <= MAX_AI_PROCESSING_SIZE) {
        const buffer = await fileData.arrayBuffer();
        const base64 = uint8ToBase64(new Uint8Array(buffer));

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
                  { type: 'text', text: 'Analysiere dieses Immobilien-Exposé vollständig. Nutze die Tool-Funktion um die Daten strukturiert zurückzugeben.' },
                  { type: 'image_url', image_url: { url: `data:application/pdf;base64,${base64}` } }
                ]
              }
            ],
            tools: [EXTRACT_PROJECT_TOOL],
            tool_choice: { type: 'function' as const, function: { name: 'extract_project_data' } },
            max_tokens: 4000,
          }),
        });

        if (aiResponse.ok) {
          const aiResult = await aiResponse.json();
          
          // Try tool-calling response first
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
                description: parsed.description || '',
                projectType: parsed.projectType || 'neubau',
                constructionYear: parsed.constructionYear || 0,
                modernizationStatus: parsed.modernizationStatus || '',
                wegCount: parsed.wegCount || 0,
                wegDetails: Array.isArray(parsed.wegDetails) ? parsed.wegDetails : [],
                developer: parsed.developer || '',
                extractedUnits: Array.isArray(parsed.extractedUnits) ? parsed.extractedUnits : [],
              });
              console.log('Expose extraction (tool-calling):', extractedData.projectName, '— Type:', extractedData.projectType, '— WEGs:', extractedData.wegCount);
            } catch (parseErr) {
              console.error('Expose tool-calling parse error:', parseErr);
            }
          } else {
            // Fallback: content-based parsing
            const content = aiResult.choices?.[0]?.message?.content;
            if (content) {
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
                    extractedUnits: Array.isArray(parsed.extractedUnits) ? parsed.extractedUnits : [],
                  });
                  console.log('Expose extraction (fallback):', extractedData.projectName);
                } catch (parseErr) {
                  console.error('Expose JSON parse error:', parseErr);
                }
              }
            }
          }
        } else {
          const errText = await aiResponse.text();
          console.error('AI error:', aiResponse.status, errText);
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
        console.log('File too large for AI extraction:', fileData.size);
      }
    } catch (err) {
      console.error('Expose extraction error:', err);
    }
  }

  // ── STEP 2: Pricelist — Direct XLSX/CSV parsing OR AI for PDFs ──────────
  if (storagePaths.pricelist) {
    try {
      const { data: fileData, error: dlError } = await supabase.storage
        .from('tenant-documents')
        .download(storagePaths.pricelist);

      if (dlError) {
        console.error('Download pricelist error:', dlError);
      } else if (fileData && fileData.size <= MAX_AI_PROCESSING_SIZE) {
        const isXlsx = storagePaths.pricelist.endsWith('.xlsx') || storagePaths.pricelist.endsWith('.xls');
        const isCsv = storagePaths.pricelist.endsWith('.csv');
        const isPdf = storagePaths.pricelist.endsWith('.pdf');

        // ── Direct XLSX/CSV parsing (no AI needed) ────────────────────────
        if (isXlsx || isCsv) {
          console.log('Direct parsing XLSX/CSV pricelist...');
          const buffer = await fileData.arrayBuffer();
          const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

          if (rows.length > 1) {
            const headerRow = rows[0].map((h: any) => String(h).trim().toLowerCase());
            console.log('Detected headers:', headerRow);

            // Fuzzy column mapping
            const COLUMN_PATTERNS: Record<string, RegExp> = {
              unitNumber: /^(whg|we|einheit|nr|top|obj|wohnung|lf|unit)/i,
              type: /^(typ|art|nutzung|kategorie)/i,
              area: /^(wfl|wohn.*fl|fläche|flaeche|qm|m²|m2|nutzfl)/i,
              rooms: /^(zimmer|zi|räume|raeume)/i,
              floor: /^(etage|geschoss|og|stockwerk|lage|ebene)/i,
              price: /^(kaufpreis|preis|vk|verkaufspreis|kp|gesamt.*preis|gesamtkauf)/i,
              currentRent: /^(miete|ist.*miete|monatsmiete|kaltmiete|nettomiete|akt.*miete|mietein|garantierte.*miete$)/i,
              hausgeld: /^(hausgeld|hg|eigentümer.*kost)/i,
              weg: /^(weg|eigentümer.*gem)/i,
            };

            const colMap: Record<string, number> = {};
            const columnMapping: ColumnMapping[] = [];

            for (let ci = 0; ci < headerRow.length; ci++) {
              const raw = rows[0][ci] ? String(rows[0][ci]).trim() : '';
              const h = headerRow[ci];
              for (const [field, pattern] of Object.entries(COLUMN_PATTERNS)) {
                if (!colMap[field] && pattern.test(h)) {
                  colMap[field] = ci;
                  columnMapping.push({ original_column: raw, mapped_to: field });
                  break;
                }
              }
              // Special: detect "garantierte Miete" with EUR amount (not percentage)
              if (!colMap.currentRent && /garantierte.*miete/i.test(h)) {
                // Check if it's a monthly value (look at first data row)
                const sampleVal = rows.length > 1 ? Number(rows[1][ci]) : 0;
                if (sampleVal > 10) { // Monthly rent, not €/m²
                  colMap.currentRent = ci;
                  columnMapping.push({ original_column: raw, mapped_to: 'currentRent' });
                }
              }
            }

            console.log('Column map:', colMap);

            const units: ExtractedUnit[] = [];
            for (let ri = 1; ri < rows.length; ri++) {
              const row = rows[ri];
              // Skip empty rows or summary rows
              const areaVal = colMap.area !== undefined ? parseFloat(String(row[colMap.area]).replace(/[^\d.,]/g, '').replace(',', '.')) : 0;
              const priceVal = colMap.price !== undefined ? parseFloat(String(row[colMap.price]).replace(/[^\d.,]/g, '').replace(',', '.')) : 0;
              if (!areaVal && !priceVal) continue; // Skip non-data rows

              const unit: ExtractedUnit = {
                unitNumber: colMap.unitNumber !== undefined ? String(row[colMap.unitNumber] || `WE-${ri}`).trim() : `WE-${ri}`,
                type: colMap.type !== undefined ? String(row[colMap.type] || 'Wohnung').trim() : 'Wohnung',
                area: areaVal || 0,
                rooms: colMap.rooms !== undefined ? parseFloat(String(row[colMap.rooms]).replace(',', '.')) || 0 : 0,
                floor: colMap.floor !== undefined ? String(row[colMap.floor] || '').trim() : '',
                price: priceVal || 0,
                currentRent: colMap.currentRent !== undefined ? parseFloat(String(row[colMap.currentRent]).replace(/[^\d.,]/g, '').replace(',', '.')) || 0 : 0,
                hausgeld: colMap.hausgeld !== undefined ? parseFloat(String(row[colMap.hausgeld]).replace(/[^\d.,]/g, '').replace(',', '.')) || 0 : 0,
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
              extractedData.totalArea = units.reduce((s, u) => s + (u.area || 0), 0);
              const prices = units.map(u => u.price).filter(p => p > 0);
              if (prices.length > 0) {
                const min = Math.min(...prices);
                const max = Math.max(...prices);
                extractedData.priceRange = min === max
                  ? `${min.toLocaleString('de-DE')} €`
                  : `${min.toLocaleString('de-DE')} – ${max.toLocaleString('de-DE')} €`;
              }
              extractedData.columnMapping = columnMapping;
              console.log(`Direct XLSX/CSV parsing: ${units.length} units extracted`);
            }
          }
        }

        // ── PDF pricelist: CSV strategy (Gemini → flat CSV → SheetJS parse) ──
        if (isPdf && LOVABLE_API_KEY) {
          console.log('PDF pricelist detected — using CSV extraction strategy');

          // Build context hint from exposé data
          let hint = '';
          if (extractedData.projectName) {
            hint = `Dies ist eine Immobilien-Preisliste für "${extractedData.projectName}"`;
            if (extractedData.city) hint += ` in ${extractedData.city}`;
            hint += '.';
            if (extractedData.unitsCount) hint += ` Es werden ca. ${extractedData.unitsCount} Einheiten erwartet.`;
            if (extractedData.wegCount && extractedData.wegCount > 1) {
              hint += ` Das Projekt hat ${extractedData.wegCount} WEGs.`;
              if (extractedData.wegDetails && extractedData.wegDetails.length > 0) {
                for (const weg of extractedData.wegDetails) {
                  hint += ` ${weg.name} (${weg.unitsCount} Einheiten).`;
                }
              }
            }
            hint += ' Typische Spalten: Whg-Nr, Wohnfläche, Zimmer, Etage, Kaufpreis, Miete, Hausgeld, WEG.';
          }

          const buffer = await fileData.arrayBuffer();
          const base64 = uint8ToBase64(new Uint8Array(buffer));

          const csvSystemPrompt = `Du bist ein hochpräziser Tabellen-Extraktor. Extrahiere ALLE Tabellenzeilen aus diesem Dokument als semikolon-getrennte CSV.

Regeln:
- Erste Zeile = exakte Spaltenüberschriften aus dem Dokument
- Jede weitere Zeile = eine Datenzeile
- Trennzeichen: Semikolon (;)
- Zahlen: Punkt als Dezimaltrennzeichen, keine Tausenderpunkte (z.B. 149900.00 statt 149.900,00)
- Keine Markdown-Formatierung, kein Code-Block, keine Backticks, nur roher CSV-Text
- JEDE Zeile im Dokument MUSS enthalten sein. Überspringe KEINE Zeile.
- Wenn ein Feld leer ist, lasse es leer (zwei Semikolons hintereinander)
- Entferne Währungszeichen (€, EUR) aus Zahlenwerten
- Prozentzeichen (%) entfernen, Wert als Dezimalzahl ausgeben (z.B. 4.5 statt 4,5%)

Ausgabe NUR den CSV-Text, nichts anderes.` + (hint ? `\n\nKONTEXT: ${hint}` : '');

          const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                { role: 'system', content: csvSystemPrompt },
                {
                  role: 'user',
                  content: [
                    { type: 'text', text: 'Extrahiere alle Tabellenzeilen aus diesem PDF als CSV.' },
                    { type: 'image_url', image_url: { url: `data:application/pdf;base64,${base64}` } },
                  ],
                },
              ],
              max_tokens: 32000,
            }),
          });

          if (aiResponse.ok) {
            const aiResult = await aiResponse.json();
            let csv = aiResult.choices?.[0]?.message?.content || '';

            // Clean markdown fences if present
            csv = csv.replace(/^```(?:csv)?\s*\n?/i, '').replace(/\n?```\s*$/i, '').trim();

            const csvLines = csv.split('\n').filter((l: string) => l.trim().length > 0);
            console.log(`CSV extraction: ${csv.length} chars, ${csvLines.length} lines (${csvLines.length - 1} data rows)`);

            // ── Parse CSV with SheetJS — reuse deterministic XLSX parser ──
            if (csv.length > 10) {
              const wb = XLSX.read(csv, { type: 'string', FS: ';' });
              const ws = wb.Sheets[wb.SheetNames[0]];
              const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

              if (rows.length > 1) {
                const headerRow = rows[0].map((h: any) => String(h).trim().toLowerCase());
                console.log('CSV headers:', headerRow);

                // Reuse same fuzzy column mapping as XLSX path
                const COLUMN_PATTERNS: Record<string, RegExp> = {
                  unitNumber: /^(whg|we|einheit|nr|top|obj|wohnung|lf|unit)/i,
                  type: /^(typ|art|nutzung|kategorie)/i,
                  area: /^(wfl|wohn.*fl|fläche|flaeche|qm|m²|m2|nutzfl)/i,
                  rooms: /^(zimmer|zi|räume|raeume)/i,
                  floor: /^(etage|geschoss|og|stockwerk|lage|ebene)/i,
                  price: /^(kaufpreis|preis|vk|verkaufspreis|kp|gesamt.*preis|gesamtkauf)/i,
                  currentRent: /^(miete|ist.*miete|monatsmiete|kaltmiete|nettomiete|akt.*miete|mietein|garantierte.*miete$)/i,
                  hausgeld: /^(hausgeld|hg|eigentümer.*kost)/i,
                  weg: /^(weg|eigentümer.*gem)/i,
                };

                const colMap: Record<string, number> = {};
                const columnMapping: ColumnMapping[] = [];

                for (let ci = 0; ci < headerRow.length; ci++) {
                  const raw = rows[0][ci] ? String(rows[0][ci]).trim() : '';
                  const h = headerRow[ci];
                  for (const [field, pattern] of Object.entries(COLUMN_PATTERNS)) {
                    if (!colMap[field] && pattern.test(h)) {
                      colMap[field] = ci;
                      columnMapping.push({ original_column: raw, mapped_to: field });
                      break;
                    }
                  }
                  if (!colMap.currentRent && /garantierte.*miete/i.test(h)) {
                    const sampleVal = rows.length > 1 ? Number(rows[1][ci]) : 0;
                    if (sampleVal > 10) {
                      colMap.currentRent = ci;
                      columnMapping.push({ original_column: raw, mapped_to: 'currentRent' });
                    }
                  }
                }

                console.log('Column map from CSV:', colMap);

                const units: ExtractedUnit[] = [];
                for (let ri = 1; ri < rows.length; ri++) {
                  const row = rows[ri];
                  const areaVal = colMap.area !== undefined ? parseFloat(String(row[colMap.area]).replace(/[^\d.,]/g, '').replace(',', '.')) : 0;
                  const priceVal = colMap.price !== undefined ? parseFloat(String(row[colMap.price]).replace(/[^\d.,]/g, '').replace(',', '.')) : 0;
                  if (!areaVal && !priceVal) continue;

                  const unit: ExtractedUnit = {
                    unitNumber: colMap.unitNumber !== undefined ? String(row[colMap.unitNumber] || `WE-${ri}`).trim() : `WE-${ri}`,
                    type: colMap.type !== undefined ? String(row[colMap.type] || 'Wohnung').trim() : 'Wohnung',
                    area: areaVal || 0,
                    rooms: colMap.rooms !== undefined ? parseFloat(String(row[colMap.rooms]).replace(',', '.')) || 0 : 0,
                    floor: colMap.floor !== undefined ? String(row[colMap.floor] || '').trim() : '',
                    price: priceVal || 0,
                    currentRent: colMap.currentRent !== undefined ? parseFloat(String(row[colMap.currentRent]).replace(/[^\d.,]/g, '').replace(',', '.')) || 0 : 0,
                    hausgeld: colMap.hausgeld !== undefined ? parseFloat(String(row[colMap.hausgeld]).replace(/[^\d.,]/g, '').replace(',', '.')) || 0 : 0,
                    weg: colMap.weg !== undefined ? String(row[colMap.weg] || '').trim() : '',
                  };

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
                  extractedData.totalArea = units.reduce((s, u) => s + (u.area || 0), 0);
                  const prices = units.map(u => u.price).filter(p => p > 0);
                  if (prices.length > 0) {
                    const min = Math.min(...prices);
                    const max = Math.max(...prices);
                    extractedData.priceRange = min === max
                      ? `${min.toLocaleString('de-DE')} €`
                      : `${min.toLocaleString('de-DE')} – ${max.toLocaleString('de-DE')} €`;
                  }
                  extractedData.columnMapping = columnMapping;
                  console.log(`PDF→CSV→Parse: ${units.length} units extracted successfully`);
                }
              }
            }
          } else if (aiResponse.status === 429 || aiResponse.status === 402) {
            console.warn('AI rate limit on pricelist:', aiResponse.status);
            return new Response(JSON.stringify({
              error: aiResponse.status === 429
                ? 'KI-Rate-Limit erreicht. Bitte versuchen Sie es in einer Minute erneut.'
                : 'KI-Credits aufgebraucht. Bitte laden Sie Credits nach.',
            }), {
              status: aiResponse.status,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          } else {
            const errText = await aiResponse.text();
            console.error('AI CSV extraction error:', aiResponse.status, errText);
          }
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

  return new Response(JSON.stringify({ success: true, extractedData }), {
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

  // ── 1. Developer Context ──────────────────────────────────────────────────
  let contextId: string;
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
      unit_type: mapUnitType(u.type),
      area_sqm: u.area || 0,
      rooms: u.rooms || 0,
      floor: u.floor || '',
      sale_price: u.price || 0,
      current_rent: u.currentRent || 0,
      status: 'geplant',
    }));

    const { error: unitsErr } = await supabase
      .from('dev_project_units')
      .insert(unitRows);

    if (unitsErr) {
      console.error('Units insert error:', unitsErr);
    } else {
      console.log(`Inserted ${unitRows.length} units for project ${project.project_code}`);
    }
  }

  // ── 5. Seed storage_nodes tree ────────────────────────────────────────────
  try {
    const { data: rootNode, error: rootErr } = await supabase
      .from('storage_nodes')
      .insert({
        tenant_id: tenantId,
        name: project.project_code,
        node_type: 'folder',
        module_code: 'MOD_13',
        entity_id: project.id,
        parent_id: null,
      })
      .select('id')
      .single();

    if (!rootErr && rootNode) {
      for (const folderName of PROJECT_FOLDERS) {
        await supabase.from('storage_nodes').insert({
          tenant_id: tenantId,
          name: folderName,
          node_type: 'folder',
          module_code: 'MOD_13',
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
            module_code: 'MOD_13',
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
                module_code: 'MOD_13',
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
                  module_code: 'MOD_13',
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
        await supabase.from('storage_nodes').insert({
          tenant_id: tenantId,
          name: fileName,
          node_type: 'file',
          module_code: 'MOD_13',
          entity_id: project.id,
          parent_id: exposeFolder.id,
          storage_path: storagePaths.expose,
          mime_type: 'application/pdf',
        });
        console.log('Exposé linked to DMS tree:', fileName);
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
        await supabase.from('storage_nodes').insert({
          tenant_id: tenantId,
          name: fileName,
          node_type: 'file',
          module_code: 'MOD_13',
          entity_id: project.id,
          parent_id: pricelistFolder.id,
          storage_path: storagePaths.pricelist,
          mime_type: mimeType,
        });
        console.log('Pricelist linked to DMS tree:', fileName);
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
