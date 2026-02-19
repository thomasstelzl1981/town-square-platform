/**
 * SOT Public Project Intake — No-Auth Magic Intake for Kaufy Website
 * 
 * Modes:
 *   analyze  — Extract project data from Exposé (AI) + parse Pricelist via Tool-Calling
 *   submit   — Create submission in Zone 1 + lead in admin pool
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

const MAX_AI_SIZE = 5 * 1024 * 1024;

// ── Tool-Calling definition (shared with sot-project-intake) ──────────────

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
              unitNumber: { type: 'string' },
              type: { type: 'string', enum: ['Wohnung', 'Apartment', 'Penthouse', 'Maisonette', 'Gewerbe', 'Stellplatz', 'Buero', 'Lager', 'Keller'] },
              area: { type: 'number' },
              rooms: { type: 'number' },
              floor: { type: 'string' },
              price: { type: 'number' },
              currentRent: { type: 'number' },
            },
            required: ['unitNumber', 'type', 'area', 'price'],
          },
        },
        column_mapping: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              original_column: { type: 'string' },
              mapped_to: { type: 'string' },
            },
            required: ['original_column', 'mapped_to'],
          },
        },
      },
      required: ['units', 'column_mapping'],
    },
  },
};

const PRICELIST_SYSTEM_PROMPT = `Du bist ein Preislisten-Parser für Immobilienprojekte. Extrahiere alle Wohneinheiten aus der Preisliste.

WICHTIG: Die Spalten können in beliebiger Reihenfolge und mit unterschiedlichen Bezeichnungen vorkommen. Hier sind gängige Varianten:

- unitNumber: "Whg-Nr", "Whg.", "WE-Nr.", "Einheit", "Nr.", "Top", "Wohnungsnummer", "Obj.-Nr."
- type: "Typ", "Art", "Wohnungstyp", "Nutzung", "Kategorie"
- area: "Wfl.", "Wohnfläche", "Fläche", "qm", "m²", "m2", "Wfl. (qm)", "Wohnfl.", "Nutzfläche"
- rooms: "Zimmer", "Zi.", "Räume", "Zi.-Anz.", "Zimmeranzahl"
- floor: "Etage", "Geschoss", "OG", "Stockwerk", "Ebene", "Lage"
- price: "Kaufpreis", "Preis", "VK-Preis", "Verkaufspreis", "KP", "Kaufpreis netto", "Preis (EUR)", "Gesamtpreis"
- currentRent: "Miete", "Ist-Miete", "Monatsmiete", "Kaltmiete", "Nettomiete", "akt. Miete", "Mieteinnahme"

Nutze die Tool-Funktion extract_units um die Daten strukturiert zurückzugeben. Befülle IMMER das column_mapping mit den Original-Spaltenbezeichnungen aus der Datei.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { mode } = body;

    if (mode === 'analyze') {
      return await handleAnalyze(supabase, body);
    } else if (mode === 'submit') {
      return await handleSubmit(supabase, body, req);
    } else {
      return new Response(JSON.stringify({ error: 'Invalid mode. Use: analyze | submit' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Public intake error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Internal server error',
    }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// ANALYZE MODE — AI extraction via Tool-Calling
// ══════════════════════════════════════════════════════════════════════════════

async function handleAnalyze(
  supabase: ReturnType<typeof createClient>,
  body: { storagePaths?: { expose?: string; pricelist?: string } },
): Promise<Response> {
  const { storagePaths } = body;
  const extractedData: Record<string, unknown> = {
    projectName: '',
    address: '',
    city: '',
    postalCode: '',
    unitsCount: 0,
    totalArea: 0,
    priceRange: '',
    extractedUnits: [],
  };

  // Exposé — AI extraction (free-text OK for unstructured docs)
  if (storagePaths?.expose) {
    try {
      const { data: fileData, error: dlError } = await supabase.storage
        .from('public-intake')
        .download(storagePaths.expose);

      if (!dlError && fileData && fileData.size <= MAX_AI_SIZE) {
        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
        if (LOVABLE_API_KEY) {
          const buffer = await fileData.arrayBuffer();
          const base64 = uint8ToBase64(new Uint8Array(buffer));

          const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                {
                  role: 'system',
                  content: `Du bist ein Immobilien-Datenextraktor. Analysiere das Exposé und extrahiere:
- Projektname, Stadt, PLZ, Adresse, Anzahl Einheiten, Gesamtfläche, Preisspanne, Kurzbeschreibung, Projekttyp (neubau/aufteilung)
- Wenn Einheiten erkennbar sind, extrahiere auch diese als Array.
Antworte NUR mit JSON:
{"projectName":"...","city":"...","postalCode":"...","address":"...","unitsCount":0,"totalArea":0,"priceRange":"...","description":"...","projectType":"neubau","extractedUnits":[{"unitNumber":"WE-001","type":"Wohnung","area":65,"rooms":2,"floor":"EG","price":289000}]}`
                },
                {
                  role: 'user',
                  content: [
                    { type: 'text', text: 'Analysiere dieses Immobilien-Exposé:' },
                    { type: 'image_url', image_url: { url: `data:application/pdf;base64,${base64}` } }
                  ]
                }
              ],
              max_tokens: 2000,
            }),
          });

          if (aiResponse.ok) {
            const aiResult = await aiResponse.json();
            const content = aiResult.choices?.[0]?.message?.content;
            if (content) {
              const jsonMatch = content.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                try {
                  const parsed = JSON.parse(jsonMatch[0]);
                  Object.assign(extractedData, parsed);
                } catch (_) { /* parse error */ }
              }
            }
          } else if (aiResponse.status === 429 || aiResponse.status === 402) {
            return new Response(JSON.stringify({ error: 'KI-Rate-Limit erreicht. Bitte versuchen Sie es in einer Minute erneut.' }), {
              status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
      }
    } catch (err) {
      console.error('Expose extraction error:', err);
    }
  }

  // Pricelist — AI extraction via Tool-Calling
  if (storagePaths?.pricelist) {
    try {
      const { data: fileData, error: dlError } = await supabase.storage
        .from('public-intake')
        .download(storagePaths.pricelist);

      if (!dlError && fileData && fileData.size <= MAX_AI_SIZE) {
        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
        if (LOVABLE_API_KEY) {
          const buffer = await fileData.arrayBuffer();
          const base64 = uint8ToBase64(new Uint8Array(buffer));
          const mimeType = storagePaths.pricelist.endsWith('.pdf') ? 'application/pdf'
            : storagePaths.pricelist.endsWith('.csv') ? 'text/csv'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

          const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'google/gemini-2.5-flash',
              messages: [
                { role: 'system', content: PRICELIST_SYSTEM_PROMPT },
                {
                  role: 'user',
                  content: [
                    { type: 'text', text: 'Extrahiere alle Einheiten aus dieser Preisliste und melde das Spalten-Mapping:' },
                    { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } }
                  ]
                }
              ],
              tools: [EXTRACT_UNITS_TOOL],
              tool_choice: { type: 'function' as const, function: { name: 'extract_units' } },
              max_tokens: 4000,
            }),
          });

          if (aiResponse.ok) {
            const aiResult = await aiResponse.json();
            const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
            
            if (toolCall?.function?.arguments) {
              try {
                const args = JSON.parse(toolCall.function.arguments);
                const units = args.units;
                if (Array.isArray(units) && units.length > 0) {
                  extractedData.extractedUnits = units;
                  extractedData.unitsCount = units.length;
                  extractedData.totalArea = units.reduce((s: number, u: any) => s + (u.area || 0), 0);
                  const prices = units.map((u: any) => u.price).filter((p: number) => p > 0);
                  if (prices.length > 0) {
                    extractedData.priceRange = `${Math.min(...prices).toLocaleString('de-DE')} – ${Math.max(...prices).toLocaleString('de-DE')} €`;
                  }
                }
                if (Array.isArray(args.column_mapping)) {
                  extractedData.columnMapping = args.column_mapping;
                }
              } catch (_) { /* parse error */ }
            } else {
              // Fallback: content-based parsing
              const content = aiResult.choices?.[0]?.message?.content;
              if (content) {
                const jsonMatch = content.match(/\[[\s\S]*\]/);
                if (jsonMatch) {
                  try {
                    const units = JSON.parse(jsonMatch[0]);
                    if (Array.isArray(units) && units.length > 0) {
                      extractedData.extractedUnits = units;
                      extractedData.unitsCount = units.length;
                      extractedData.totalArea = units.reduce((s: number, u: any) => s + (u.area || 0), 0);
                      const prices = units.map((u: any) => u.price).filter((p: number) => p > 0);
                      if (prices.length > 0) {
                        extractedData.priceRange = `${Math.min(...prices).toLocaleString('de-DE')} – ${Math.max(...prices).toLocaleString('de-DE')} €`;
                      }
                    }
                  } catch (_) { /* parse error */ }
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('Pricelist extraction error:', err);
    }
  }

  if (!extractedData.projectName) {
    extractedData.projectName = `Neues Projekt ${new Date().getFullYear()}`;
  }

  return new Response(JSON.stringify({ success: true, extractedData }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// SUBMIT MODE — Create Zone 1 submission + Lead
// ══════════════════════════════════════════════════════════════════════════════

async function handleSubmit(
  supabase: ReturnType<typeof createClient>,
  body: {
    contactName: string;
    contactEmail: string;
    contactPhone?: string;
    companyName?: string;
    extractedData: Record<string, unknown>;
    storagePaths?: { expose?: string; pricelist?: string };
    imagePaths?: string[];
    agreementVersion?: string;
    commissionAgreement?: { rate: number; gross_rate: number; channels: string[] };
  },
  req: Request,
): Promise<Response> {
  const { contactName, contactEmail, contactPhone, companyName, extractedData, storagePaths, imagePaths, agreementVersion, commissionAgreement } = body;

  if (!contactName || !contactEmail) {
    return new Response(JSON.stringify({ error: 'Name und E-Mail sind Pflichtfelder.' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Rate limit: max 3 submissions per email per day
  const { count } = await supabase
    .from('public_project_submissions')
    .select('*', { count: 'exact', head: true })
    .eq('contact_email', contactEmail)
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  if ((count || 0) >= 3) {
    return new Response(JSON.stringify({ error: 'Maximale Anzahl an Einreichungen pro Tag erreicht (3). Bitte versuchen Sie es morgen erneut.' }), {
      status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Create lead in Zone 1 pool
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .insert({
      source: 'kaufy_website',
      interest_type: 'project_submission',
      notes: `Projekt-Einreichung: ${(extractedData as any)?.projectName || 'Unbekannt'}\nKontakt: ${contactName} (${contactEmail})\nFirma: ${companyName || '-'}\nProvision: ${commissionAgreement?.rate || 7}% netto (${commissionAgreement?.gross_rate || 8.33}% brutto)\nKanäle: ${commissionAgreement?.channels?.join(', ') || 'partner_network'}`,
      zone1_pool: true,
    })
    .select('id')
    .single();

  if (leadError) {
    console.error('Lead creation error:', leadError);
  }

  // Create submission
  const { data: submission, error: subError } = await supabase
    .from('public_project_submissions')
    .insert({
      contact_name: contactName,
      contact_email: contactEmail,
      contact_phone: contactPhone || null,
      company_name: companyName || null,
      extracted_data: extractedData,
      project_name: (extractedData as any)?.projectName || null,
      city: (extractedData as any)?.city || null,
      postal_code: (extractedData as any)?.postalCode || null,
      address: (extractedData as any)?.address || null,
      units_count: (extractedData as any)?.unitsCount || 0,
      project_type: (extractedData as any)?.projectType || 'neubau',
      expose_storage_path: storagePaths?.expose || null,
      pricelist_storage_path: storagePaths?.pricelist || null,
      image_paths: imagePaths || [],
      agreement_accepted_at: agreementVersion ? new Date().toISOString() : null,
      agreement_version: agreementVersion || null,
      submission_data: {
        commission_agreement: commissionAgreement || { rate: 7, gross_rate: 8.33, channels: ['partner_network'] },
      },
      lead_id: lead?.id || null,
      source_ip: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || null,
      user_agent: req.headers.get('user-agent') || null,
    })
    .select('id')
    .single();

  if (subError) {
    console.error('Submission error:', subError);
    return new Response(JSON.stringify({ error: 'Einreichung fehlgeschlagen: ' + subError.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({
    success: true,
    submissionId: submission.id,
    leadId: lead?.id,
    message: 'Ihr Projekt wurde erfolgreich eingereicht. Wir melden uns innerhalb von 48 Stunden.',
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
