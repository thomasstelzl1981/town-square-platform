/**
 * SOT Project Intake - Magic Intake with Full AI + XLSX + Storage-Tree
 * MOD-13 PROJEKTE
 * 
 * Modes:
 *   analyze  — Extract project data from Exposé (AI) + parse Pricelist (XLSX)
 *   create   — Create project, bulk-insert units, seed storage_nodes tree
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

const MAX_AI_PROCESSING_SIZE = 5 * 1024 * 1024;

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
  extractedUnits?: ExtractedUnit[];
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
// ANALYZE MODE
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

  // ── 1. Exposé — AI extraction ─────────────────────────────────────────────
  if (storagePaths.expose) {
    try {
      const { data: fileData, error: dlError } = await supabase.storage
        .from('tenant-documents')
        .download(storagePaths.expose);

      if (dlError) {
        console.error('Download expose error:', dlError);
      } else if (fileData && fileData.size <= MAX_AI_PROCESSING_SIZE) {
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
- Projektname (z.B. "Residenz am Park")
- Stadt/Ort
- PLZ
- Adresse (Straße + Hausnr)
- Anzahl Wohneinheiten
- Gesamtfläche in m²
- Preisspanne (z.B. "250.000 - 450.000 €")
- Kurzbeschreibung (max 200 Zeichen)
- Projekttyp: "neubau" oder "aufteilung"

Wenn Einheiten erkennbar sind, extrahiere auch diese als Array.

Antworte NUR mit einem JSON-Objekt:
{
  "projectName": "...",
  "city": "...",
  "postalCode": "...",
  "address": "...",
  "unitsCount": 0,
  "totalArea": 0,
  "priceRange": "...",
  "description": "...",
  "projectType": "neubau",
  "extractedUnits": [
    { "unitNumber": "WE-001", "type": "Wohnung", "area": 65.0, "rooms": 2, "floor": "EG", "price": 289000 }
  ]
}`
                },
                {
                  role: 'user',
                  content: [
                    { type: 'text', text: 'Analysiere dieses Immobilien-Exposé vollständig:' },
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
                    extractedUnits: Array.isArray(parsed.extractedUnits) ? parsed.extractedUnits : [],
                  });
                  console.log('AI extraction successful:', extractedData.projectName);
                } catch (parseErr) {
                  console.error('JSON parse error:', parseErr);
                }
              }
            }
          } else {
            const errText = await aiResponse.text();
            console.error('AI error:', aiResponse.status, errText);
            // Surface rate-limit errors
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
        }
      } else if (fileData) {
        console.log('File too large for AI extraction:', fileData.size);
      }
    } catch (err) {
      console.error('Expose extraction error:', err);
    }
  }

  // ── 2. Pricelist — XLSX/CSV parsing via AI ────────────────────────────────
  if (storagePaths.pricelist) {
    try {
      const { data: fileData, error: dlError } = await supabase.storage
        .from('tenant-documents')
        .download(storagePaths.pricelist);

      if (dlError) {
        console.error('Download pricelist error:', dlError);
      } else if (fileData && fileData.size <= MAX_AI_PROCESSING_SIZE) {
        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
        const mimeType = storagePaths.pricelist.endsWith('.pdf')
          ? 'application/pdf'
          : storagePaths.pricelist.endsWith('.csv')
            ? 'text/csv'
            : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

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
                  content: `Du bist ein Preislisten-Parser für Immobilienprojekte. Extrahiere alle Wohneinheiten aus der Preisliste.

Für jede Einheit extrahiere:
- unitNumber: Wohnungsnummer (z.B. "WE-001", "Top 1", "Whg. 1")
- type: Typ (z.B. "Wohnung", "Apartment", "Penthouse", "Maisonette", "Gewerbe", "Stellplatz")
- area: Wohnfläche in m² (Zahl)
- rooms: Zimmeranzahl (Zahl)
- floor: Etage/Geschoss (z.B. "EG", "1.OG", "DG")
- price: Kaufpreis in EUR (Zahl, ohne Tausenderpunkte)
- currentRent: Aktuelle Monatsmiete in EUR (wenn vorhanden, sonst 0)

Antworte NUR mit einem JSON-Array:
[
  { "unitNumber": "WE-001", "type": "Wohnung", "area": 65.0, "rooms": 2, "floor": "EG", "price": 289000, "currentRent": 650 }
]`
                },
                {
                  role: 'user',
                  content: [
                    { type: 'text', text: 'Extrahiere alle Einheiten aus dieser Preisliste:' },
                    { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } }
                  ]
                }
              ],
              max_tokens: 4000,
            }),
          });

          if (aiResponse.ok) {
            const aiResult = await aiResponse.json();
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
                    console.log(`Pricelist parsed: ${units.length} units extracted`);
                  }
                } catch (parseErr) {
                  console.error('Pricelist parse error:', parseErr);
                }
              }
            }
          } else if (aiResponse.status === 429 || aiResponse.status === 402) {
            console.warn('AI rate limit on pricelist:', aiResponse.status);
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
      },
      created_by: userId,
    })
    .select()
    .single();

  if (projErr) throw new Error('Project creation failed: ' + projErr.message);
  console.log('Project created:', project.id, projectCode);

  // ── 4. Bulk-insert units ──────────────────────────────────────────────────
  const units = reviewedData.extractedUnits || [];
  const createdUnitIds: string[] = [];

  if (units.length > 0) {
    const unitRows = units.map((u, idx) => ({
      project_id: project.id,
      tenant_id: tenantId,
      unit_number: u.unitNumber || `WE-${String(idx + 1).padStart(3, '0')}`,
      unit_type: u.type || 'Wohnung',
      area_sqm: u.area || null,
      rooms_count: u.rooms || null,
      floor: u.floor || null,
      list_price: u.price || null,
      minimum_price: u.price ? Math.round(u.price * 0.95) : null,
      current_rent: u.currentRent || null,
      price_per_sqm: u.area && u.price ? Math.round(u.price / u.area) : null,
      status: 'available',
    }));

    const { data: insertedUnits, error: unitsErr } = await supabase
      .from('dev_project_units')
      .insert(unitRows)
      .select('id');

    if (unitsErr) {
      console.error('Units insert error:', unitsErr);
    } else if (insertedUnits) {
      insertedUnits.forEach(u => createdUnitIds.push(u.id));
      console.log(`Inserted ${insertedUnits.length} units`);

      // Update project total_units_count
      await supabase.from('dev_projects').update({
        total_units_count: insertedUnits.length,
      }).eq('id', project.id);
    }
  }

  // ── 5. Seed Storage-Tree ──────────────────────────────────────────────────
  await seedStorageTree(supabase, tenantId, project.id, projectCode, createdUnitIds, units);

  // ── 6. Move uploaded files to project folders ─────────────────────────────
  if (storagePaths.expose) {
    try {
      const fileName = storagePaths.expose.split('/').pop() || 'expose.pdf';
      const newPath = `projects/${tenantId}/${project.id}/expose/${fileName}`;
      await supabase.storage.from('tenant-documents').copy(storagePaths.expose, newPath);
      console.log('Copied expose to project folder');
    } catch (e) { console.error('Move expose error:', e); }
  }
  if (storagePaths.pricelist) {
    try {
      const fileName = storagePaths.pricelist.split('/').pop() || 'pricelist.xlsx';
      const newPath = `projects/${tenantId}/${project.id}/pricelist/${fileName}`;
      await supabase.storage.from('tenant-documents').copy(storagePaths.pricelist, newPath);
      console.log('Copied pricelist to project folder');
    } catch (e) { console.error('Move pricelist error:', e); }
  }

  return new Response(JSON.stringify({
    success: true,
    projectId: project.id,
    projectCode,
    unitsCreated: createdUnitIds.length,
    message: `Projekt "${reviewedData.projectName}" mit ${createdUnitIds.length} Einheiten erstellt.`,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// STORAGE TREE SEEDING
// ══════════════════════════════════════════════════════════════════════════════

async function seedStorageTree(
  supabase: ReturnType<typeof createClient>,
  tenantId: string,
  projectId: string,
  projectCode: string,
  unitIds: string[],
  units: ExtractedUnit[]
): Promise<void> {
  console.log('Seeding storage tree for', projectCode);

  try {
    // Find the MOD_13 root folder for this tenant
    const { data: modRoot } = await supabase
      .from('storage_nodes')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('name', 'MOD_13')
      .eq('node_type', 'folder')
      .is('parent_id', null)
      .limit(1);

    const parentId = modRoot?.[0]?.id || null;

    // Create project root folder
    const { data: projectFolder, error: pfErr } = await supabase
      .from('storage_nodes')
      .insert({
        tenant_id: tenantId,
        parent_id: parentId,
        name: projectCode,
        node_type: 'folder',
        dev_project_id: projectId,
      })
      .select('id')
      .single();

    if (pfErr) {
      console.error('Project folder creation error:', pfErr);
      return;
    }

    const projectFolderId = projectFolder.id;

    // Create standard project sub-folders
    const folderInserts = PROJECT_FOLDERS.map(name => ({
      tenant_id: tenantId,
      parent_id: projectFolderId,
      name,
      node_type: 'folder' as const,
      dev_project_id: projectId,
    }));

    const { error: subErr } = await supabase
      .from('storage_nodes')
      .insert(folderInserts);

    if (subErr) {
      console.error('Sub-folder creation error:', subErr);
    }

    // Create unit folders (if units exist)
    if (unitIds.length > 0) {
      // Create "Einheiten" container
      const { data: einheitenFolder } = await supabase
        .from('storage_nodes')
        .insert({
          tenant_id: tenantId,
          parent_id: projectFolderId,
          name: 'Einheiten',
          node_type: 'folder',
          dev_project_id: projectId,
        })
        .select('id')
        .single();

      if (einheitenFolder) {
        for (let i = 0; i < unitIds.length; i++) {
          const unitNumber = units[i]?.unitNumber || `WE-${String(i + 1).padStart(3, '0')}`;
          
          // Create unit folder
          const { data: unitFolder } = await supabase
            .from('storage_nodes')
            .insert({
              tenant_id: tenantId,
              parent_id: einheitenFolder.id,
              name: unitNumber,
              node_type: 'folder',
              dev_project_id: projectId,
              dev_project_unit_id: unitIds[i],
            })
            .select('id')
            .single();

          if (unitFolder) {
            // Create unit sub-folders
            const unitSubFolders = UNIT_FOLDERS.map(name => ({
              tenant_id: tenantId,
              parent_id: unitFolder.id,
              name,
              node_type: 'folder' as const,
              dev_project_id: projectId,
              dev_project_unit_id: unitIds[i],
            }));

            await supabase.from('storage_nodes').insert(unitSubFolders);
          }
        }
      }
    }

    console.log('Storage tree seeded:', PROJECT_FOLDERS.length, 'project folders +', unitIds.length, 'unit folders');
  } catch (err) {
    console.error('Storage tree seeding error:', err);
  }
}
