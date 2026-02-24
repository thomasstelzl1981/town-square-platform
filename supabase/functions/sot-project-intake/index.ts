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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

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

  // ── STEP 2: Pricelist — AI extraction with context from Expose ─────────
  if (storagePaths.pricelist && LOVABLE_API_KEY) {
    try {
      const { data: fileData, error: dlError } = await supabase.storage
        .from('tenant-documents')
        .download(storagePaths.pricelist);

      if (dlError) {
        console.error('Download pricelist error:', dlError);
      } else if (fileData && fileData.size <= MAX_AI_PROCESSING_SIZE) {
        const mimeType = storagePaths.pricelist.endsWith('.pdf')
          ? 'application/pdf'
          : storagePaths.pricelist.endsWith('.csv')
            ? 'text/csv'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

        const buffer = await fileData.arrayBuffer();
        const base64 = uint8ToBase64(new Uint8Array(buffer));

        // Build context-enriched system prompt from Expose results
        let contextPrompt = PRICELIST_SYSTEM_PROMPT_BASE;
        if (extractedData.projectName) {
          contextPrompt += `\n\nKONTEXT AUS DEM EXPOSÉ (nutze diese Informationen zur besseren Zuordnung):`;
          contextPrompt += `\n- Projektname: ${extractedData.projectName}`;
          if (extractedData.projectType) contextPrompt += `\n- Projekttyp: ${extractedData.projectType}`;
          if (extractedData.city) contextPrompt += `\n- Stadt: ${extractedData.city}`;
          if (extractedData.address) contextPrompt += `\n- Adresse: ${extractedData.address}`;
          if (extractedData.constructionYear) contextPrompt += `\n- Baujahr: ${extractedData.constructionYear}`;
          if (extractedData.wegCount && extractedData.wegCount > 1) {
            contextPrompt += `\n- Anzahl WEGs: ${extractedData.wegCount}`;
            if (extractedData.wegDetails && extractedData.wegDetails.length > 0) {
              contextPrompt += `\n- WEG-Struktur:`;
              for (const weg of extractedData.wegDetails) {
                contextPrompt += `\n  • ${weg.name} (${weg.unitsCount} Einheiten, ${weg.addressRange})`;
              }
              contextPrompt += `\n- WICHTIG: Ordne jede Einheit der korrekten WEG zu basierend auf Hausnummer oder Position in der Liste!`;
            }
          }
          if (extractedData.unitsCount) contextPrompt += `\n- Erwartete Einheiten: ${extractedData.unitsCount}`;
        }

        const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: contextPrompt },
              {
                role: 'user',
                content: [
                  { type: 'text', text: 'Extrahiere alle Einheiten aus dieser Preisliste und melde das Spalten-Mapping. Berechne Rendite und Mietfaktor wenn möglich.' },
                  { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } }
                ]
              }
            ],
            tools: [EXTRACT_UNITS_TOOL],
            tool_choice: { type: 'function' as const, function: { name: 'extract_units' } },
            max_tokens: 8000,
          }),
        });

        if (aiResponse.ok) {
          const aiResult = await aiResponse.json();
          
          const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
          if (toolCall?.function?.arguments) {
            try {
              const args = JSON.parse(toolCall.function.arguments);
              const units = args.units as ExtractedUnit[];
              const columnMapping = args.column_mapping as ColumnMapping[];

              if (Array.isArray(units) && units.length > 0) {
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
                console.log(`Pricelist parsed via tool-calling: ${units.length} units extracted`);
              }

              if (Array.isArray(columnMapping) && columnMapping.length > 0) {
                extractedData.columnMapping = columnMapping;
                console.log('Column mapping:', JSON.stringify(columnMapping));
              }
            } catch (parseErr) {
              console.error('Tool-calling parse error:', parseErr);
            }
          } else {
            // Fallback: content-based parsing
            const content = aiResult.choices?.[0]?.message?.content;
            if (content) {
              const jsonMatch = content.match(/\[[\s\S]*\]/);
              if (jsonMatch) {
                try {
                  const units = JSON.parse(jsonMatch[0]) as ExtractedUnit[];
                  if (Array.isArray(units) && units.length > 0) {
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
                    console.log(`Pricelist parsed (fallback): ${units.length} units`);
                  }
                } catch (parseErr) {
                  console.error('Pricelist fallback parse error:', parseErr);
                }
              }
            }
          }
        } else if (aiResponse.status === 429 || aiResponse.status === 402) {
          console.warn('AI rate limit on pricelist:', aiResponse.status);
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
