/**
 * SOT Project Intake - Project creation with file storage
 * MOD-13 PROJEKTE - Magic Intake
 * 
 * Supports two modes:
 * 
 * Mode 1 (NEW - Multi-step workflow):
 * - storagePaths: { expose?: string, pricelist?: string } - Already uploaded files
 * - mode: 'analyze' | 'create'
 *   - 'analyze': Only extract data, return for review
 *   - 'create': Create project with reviewedData
 * - reviewedData: User-confirmed data (only for mode='create')
 * 
 * Mode 2 (LEGACY - Single-step):
 * - FormData with expose/pricelist files
 * - Creates project immediately
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Max file size for AI extraction (5MB) - larger files skip AI to avoid memory issues
const MAX_AI_PROCESSING_SIZE = 5 * 1024 * 1024;

// Max upload size (20MB)
const MAX_UPLOAD_SIZE = 20 * 1024 * 1024;

/**
 * Sanitize filename for Supabase Storage
 */
function sanitizeFilename(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  const ext = lastDot > 0 ? filename.slice(lastDot) : '';
  const baseName = lastDot > 0 ? filename.slice(0, lastDot) : filename;
  
  const sanitized = baseName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[[\](){}]/g, '')
    .replace(/\s+/g, '_')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 80);
  
  return sanitized + ext.toLowerCase();
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
  extractedUnits?: Array<{
    unitNumber: string;
    type: string;
    area: number;
    price: number;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user's tenant
    const { data: profile } = await supabase
      .from('profiles')
      .select('active_tenant_id')
      .eq('id', user.id)
      .single();

    if (!profile?.active_tenant_id) {
      return new Response(JSON.stringify({ error: 'No tenant selected' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tenantId = profile.active_tenant_id;

    // Detect request type (JSON or FormData)
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      // NEW MODE: JSON with storagePaths
      const body = await req.json();
      const { storagePaths, contextId, mode, reviewedData } = body;

      console.log('Project intake - JSON mode:', { mode, storagePaths, contextId });

      if (mode === 'analyze') {
        return await handleAnalyzeMode(supabase, tenantId, storagePaths, contextId);
      } else if (mode === 'create') {
        return await handleCreateMode(supabase, tenantId, storagePaths, contextId, reviewedData, user.id);
      } else {
        return new Response(JSON.stringify({ error: 'Invalid mode. Use "analyze" or "create"' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      // LEGACY MODE: FormData with files
      return await handleLegacyMode(req, supabase, tenantId, user.id);
    }

  } catch (error) {
    console.error('Intake error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Internal server error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

/**
 * ANALYZE MODE: Extract data from uploaded files, return for review
 */
async function handleAnalyzeMode(
  supabase: ReturnType<typeof createClient>,
  tenantId: string,
  storagePaths: { expose?: string; pricelist?: string },
  contextId: string
): Promise<Response> {
  console.log('Analyze mode - extracting data from storage paths:', storagePaths);

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

  // Try to extract from expose PDF
  if (storagePaths.expose) {
    try {
      // Download file from storage
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('project-documents')
        .download(storagePaths.expose);

      if (downloadError) {
        console.error('Error downloading expose:', downloadError);
      } else if (fileData) {
        const fileSize = fileData.size;
        console.log('Downloaded expose, size:', fileSize);

        if (fileSize <= MAX_AI_PROCESSING_SIZE) {
          const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
          if (LOVABLE_API_KEY) {
            const buffer = await fileData.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

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
- Adresse
- Anzahl Einheiten (wenn erkennbar)
- Gesamtfläche in m² (wenn erkennbar)
- Preisspanne (z.B. "250.000 - 450.000 €")
- Kurzbeschreibung (max 200 Zeichen)
- Projekttyp: "neubau" oder "aufteilung"

Antworte NUR mit einem JSON-Objekt:
{
  "projectName": "Projektname",
  "city": "Stadt",
  "postalCode": "12345",
  "address": "Straße 1",
  "unitsCount": 12,
  "totalArea": 1200,
  "priceRange": "250.000 - 450.000 €",
  "description": "Kurzbeschreibung",
  "projectType": "neubau"
}`
                  },
                  {
                    role: 'user',
                    content: [
                      { type: 'text', text: 'Extrahiere die Projektdaten aus diesem PDF:' },
                      { type: 'image_url', image_url: { url: `data:application/pdf;base64,${base64}` } }
                    ]
                  }
                ],
                max_tokens: 800,
              }),
            });

            if (aiResponse.ok) {
              const aiResult = await aiResponse.json();
              const content = aiResult.choices?.[0]?.message?.content;
              if (content) {
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  const parsed = JSON.parse(jsonMatch[0]);
                  Object.assign(extractedData, {
                    projectName: parsed.projectName || parsed.name || '',
                    city: parsed.city || '',
                    postalCode: parsed.postalCode || parsed.postal_code || '',
                    address: parsed.address || '',
                    unitsCount: parseInt(parsed.unitsCount) || 0,
                    totalArea: parseFloat(parsed.totalArea) || 0,
                    priceRange: parsed.priceRange || '',
                    description: parsed.description || '',
                    projectType: parsed.projectType || parsed.project_type || 'neubau',
                  });
                  console.log('AI extraction successful:', extractedData);
                }
              }
            } else {
              console.error('AI response not ok:', aiResponse.status);
            }
          }
        } else {
          console.log('File too large for AI extraction, returning empty template');
        }
      }
    } catch (err) {
      console.error('Error in expose extraction:', err);
    }
  }

  // If no project name extracted, generate placeholder
  if (!extractedData.projectName) {
    const year = new Date().getFullYear();
    extractedData.projectName = `Neues Projekt ${year}`;
  }

  return new Response(JSON.stringify({
    success: true,
    extractedData,
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * CREATE MODE: Create project with user-reviewed data
 */
async function handleCreateMode(
  supabase: ReturnType<typeof createClient>,
  tenantId: string,
  storagePaths: { expose?: string; pricelist?: string },
  contextId: string,
  reviewedData: ExtractedData,
  userId: string
): Promise<Response> {
  console.log('Create mode - creating project with reviewed data:', reviewedData);

  // Get or validate developer context
  let developerContextId = contextId;
  if (!developerContextId) {
    const { data: existingContexts } = await supabase
      .from('developer_contexts')
      .select('id')
      .eq('tenant_id', tenantId)
      .limit(1);

    if (existingContexts && existingContexts.length > 0) {
      developerContextId = existingContexts[0].id;
    } else {
      return new Response(JSON.stringify({ error: 'No developer context available' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // Generate project code
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from('dev_projects')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .like('project_code', `BT-${year}-%`);

  const nextNum = (count || 0) + 1;
  const projectCode = `BT-${year}-${String(nextNum).padStart(3, '0')}`;

  // Create project with reviewed data
  const { data: project, error: projectError } = await supabase
    .from('dev_projects')
    .insert({
      tenant_id: tenantId,
      developer_context_id: developerContextId,
      project_code: projectCode,
      name: reviewedData.projectName || `Projekt ${projectCode}`,
      city: reviewedData.city || null,
      postal_code: reviewedData.postalCode || null,
      address: reviewedData.address || null,
      description: reviewedData.description || null,
      project_type: reviewedData.projectType === 'aufteilung' ? 'aufteilung' : 'neubau',
      status: 'draft_intake',
      needs_review: false, // User already reviewed
      intake_data: {
        created_at: new Date().toISOString(),
        files: storagePaths,
        reviewed_data: reviewedData,
        units_count_indicated: reviewedData.unitsCount,
        total_area_indicated: reviewedData.totalArea,
      },
      created_by: userId,
    })
    .select()
    .single();

  if (projectError) {
    console.error('Error creating project:', projectError);
    throw new Error('Failed to create project: ' + projectError.message);
  }

  console.log('Created project:', project.id);

  // Move files from intake folder to project folder if needed
  if (storagePaths.expose || storagePaths.pricelist) {
    const projectStoragePath = `projects/${tenantId}/${project.id}`;
    
    // Copy expose
    if (storagePaths.expose) {
      try {
        const fileName = storagePaths.expose.split('/').pop() || 'expose.pdf';
        const newPath = `${projectStoragePath}/expose/${fileName}`;
        
        const { error: copyError } = await supabase.storage
          .from('project-documents')
          .copy(storagePaths.expose, newPath);
        
        if (!copyError) {
          // Delete original
          await supabase.storage.from('project-documents').remove([storagePaths.expose]);
          console.log('Moved expose to project folder');
        }
      } catch (err) {
        console.error('Error moving expose:', err);
      }
    }

    // Copy pricelist
    if (storagePaths.pricelist) {
      try {
        const fileName = storagePaths.pricelist.split('/').pop() || 'pricelist.xlsx';
        const newPath = `${projectStoragePath}/pricelist/${fileName}`;
        
        const { error: copyError } = await supabase.storage
          .from('project-documents')
          .copy(storagePaths.pricelist, newPath);
        
        if (!copyError) {
          await supabase.storage.from('project-documents').remove([storagePaths.pricelist]);
          console.log('Moved pricelist to project folder');
        }
      } catch (err) {
        console.error('Error moving pricelist:', err);
      }
    }
  }

  return new Response(JSON.stringify({
    success: true,
    projectId: project.id,
    projectCode,
    message: 'Projekt erfolgreich erstellt',
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/**
 * LEGACY MODE: Handle FormData with file uploads (for backwards compatibility)
 */
async function handleLegacyMode(
  req: Request,
  supabase: ReturnType<typeof createClient>,
  tenantId: string,
  userId: string
): Promise<Response> {
  // Parse form data
  const formData = await req.formData();
  const exposeFile = formData.get('expose') as File | null;
  const pricelistFile = formData.get('pricelist') as File | null;
  const contextId = formData.get('contextId') as string | null;
  const autoCreateContext = formData.get('autoCreateContext') === 'true';

  if (!exposeFile && !pricelistFile) {
    return new Response(JSON.stringify({ error: 'At least one file required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Check file sizes
  const exposeSize = exposeFile?.size || 0;
  const pricelistSize = pricelistFile?.size || 0;
  
  if (exposeSize > MAX_UPLOAD_SIZE) {
    return new Response(JSON.stringify({ 
      error: `Exposé zu groß (${Math.round(exposeSize / 1024 / 1024)}MB). Maximum: 20MB` 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  if (pricelistSize > MAX_UPLOAD_SIZE) {
    return new Response(JSON.stringify({ 
      error: `Preisliste zu groß (${Math.round(pricelistSize / 1024 / 1024)}MB). Maximum: 20MB` 
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  console.log('Legacy mode - project intake with file upload:', {
    hasExpose: !!exposeFile,
    exposeSize: exposeSize ? `${Math.round(exposeSize / 1024)}KB` : null,
    hasPricelist: !!pricelistFile,
    pricelistSize: pricelistSize ? `${Math.round(pricelistSize / 1024)}KB` : null,
    contextId,
  });

  // Generate project code
  const year = new Date().getFullYear();
  const { count } = await supabase
    .from('dev_projects')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .like('project_code', `BT-${year}-%`);

  const nextNum = (count || 0) + 1;
  const projectCode = `BT-${year}-${String(nextNum).padStart(3, '0')}`;

  // Get or create developer context
  let developerContextId = contextId;
  
  if (!developerContextId) {
    const { data: existingContexts } = await supabase
      .from('developer_contexts')
      .select('id')
      .eq('tenant_id', tenantId)
      .limit(1);

    if (existingContexts && existingContexts.length > 0) {
      developerContextId = existingContexts[0].id;
    } else if (autoCreateContext) {
      const { data: newContext, error: contextError } = await supabase
        .from('developer_contexts')
        .insert({
          tenant_id: tenantId,
          name: 'Meine Gesellschaft',
          legal_form: 'GmbH',
          is_default: true,
        })
        .select()
        .single();

      if (contextError) {
        console.error('Error creating context:', contextError);
        return new Response(JSON.stringify({ error: 'Failed to create developer context' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      developerContextId = newContext.id;
    } else {
      return new Response(JSON.stringify({ error: 'No developer context available' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }

  // Create draft project
  const { data: project, error: projectError } = await supabase
    .from('dev_projects')
    .insert({
      tenant_id: tenantId,
      developer_context_id: developerContextId,
      project_code: projectCode,
      name: `Projekt ${projectCode}`,
      status: 'draft_intake',
      needs_review: true,
      intake_data: {
        started_at: new Date().toISOString(),
        has_expose: !!exposeFile,
        expose_size: exposeSize,
        has_pricelist: !!pricelistFile,
        pricelist_size: pricelistSize,
        ai_extraction_skipped: exposeSize > MAX_AI_PROCESSING_SIZE,
      },
      created_by: userId,
    })
    .select()
    .single();

  if (projectError) {
    console.error('Error creating project:', projectError);
    throw new Error('Failed to create project: ' + projectError.message);
  }

  console.log('Created draft project:', project.id);

  // Upload files to Storage
  const storagePath = `projects/${tenantId}/${project.id}`;
  const uploadResults: { expose?: string; pricelist?: string } = {};

  if (exposeFile) {
    const exposeBuffer = await exposeFile.arrayBuffer();
    const safeExposeName = sanitizeFilename(exposeFile.name);
    const exposePath = `${storagePath}/expose/${safeExposeName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('project-documents')
      .upload(exposePath, exposeBuffer, {
        contentType: exposeFile.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading expose:', uploadError);
    } else {
      uploadResults.expose = exposePath;
    }
  }

  if (pricelistFile) {
    const pricelistBuffer = await pricelistFile.arrayBuffer();
    const safePricelistName = sanitizeFilename(pricelistFile.name);
    const pricelistPath = `${storagePath}/pricelist/${safePricelistName}`;
    
    const { error: uploadError } = await supabase.storage
      .from('project-documents')
      .upload(pricelistPath, pricelistBuffer, {
        contentType: pricelistFile.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Error uploading pricelist:', uploadError);
    } else {
      uploadResults.pricelist = pricelistPath;
    }
  }

  // Update project with file paths
  await supabase
    .from('dev_projects')
    .update({
      intake_data: {
        ...project.intake_data,
        files: uploadResults,
        files_uploaded_at: new Date().toISOString(),
      },
    })
    .eq('id', project.id);

  // AI extraction for small files (same as before)
  let aiExtractionDone = false;
  if (exposeFile && exposeSize <= MAX_AI_PROCESSING_SIZE) {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (LOVABLE_API_KEY) {
      try {
        const exposeBuffer = await exposeFile.arrayBuffer();
        const exposeBase64 = btoa(String.fromCharCode(...new Uint8Array(exposeBuffer)));
        
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
- Projektname
- Stadt/Ort
- PLZ
- Adresse
- Kurzbeschreibung (max 200 Zeichen)
- Projekttyp: "neubau" oder "aufteilung"

Antworte NUR mit einem JSON-Objekt:
{
  "name": "Projektname",
  "city": "Stadt",
  "postal_code": "12345",
  "address": "Straße 1",
  "description": "Kurzbeschreibung",
  "project_type": "neubau"
}`
              },
              {
                role: 'user',
                content: [
                  { type: 'text', text: 'Extrahiere die Projektdaten:' },
                  { type: 'image_url', image_url: { url: `data:application/pdf;base64,${exposeBase64}` } }
                ]
              }
            ],
            max_tokens: 500,
          }),
        });

        if (aiResponse.ok) {
          const aiResult = await aiResponse.json();
          const content = aiResult.choices?.[0]?.message?.content;
          if (content) {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              
              await supabase
                .from('dev_projects')
                .update({
                  name: parsed.name || project.name,
                  city: parsed.city || null,
                  postal_code: parsed.postal_code || null,
                  address: parsed.address || null,
                  description: parsed.description || null,
                  project_type: parsed.project_type === 'neubau' ? 'neubau' : 'aufteilung',
                  intake_data: {
                    ...project.intake_data,
                    files: uploadResults,
                    ai_extracted_at: new Date().toISOString(),
                    ai_extraction_success: true,
                  },
                })
                .eq('id', project.id);
              
              aiExtractionDone = true;
              console.log('AI extraction successful');
            }
          }
        }
      } catch (aiErr) {
        console.error('AI extraction error:', aiErr);
      }
    }
  }

  return new Response(JSON.stringify({
    success: true,
    projectId: project.id,
    projectCode,
    contextId: developerContextId,
    filesUploaded: uploadResults,
    aiExtractionDone,
    message: aiExtractionDone 
      ? 'Projekt erstellt und Daten extrahiert.'
      : 'Projekt erstellt. Bitte ergänzen Sie die Daten manuell.',
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
