/**
 * SOT Project Intake - Project creation with file storage
 * MOD-13 PROJEKTE - Magic Intake
 * 
 * Receives Exposé (PDF) and/or Pricelist (XLSX/CSV/PDF):
 * 1. Stores files in Supabase Storage (avoids memory issues with large files)
 * 2. Creates draft project
 * 3. Optionally triggers AI extraction for small files
 * 
 * Large file handling:
 * - Files are stored first, project created immediately
 * - AI extraction runs only for files < 5MB to avoid memory limits
 * - User can always manually edit project data
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

    console.log('Starting project intake...', {
      hasExpose: !!exposeFile,
      exposeSize: exposeSize ? `${Math.round(exposeSize / 1024)}KB` : null,
      hasPricelist: !!pricelistFile,
      pricelistSize: pricelistSize ? `${Math.round(pricelistSize / 1024)}KB` : null,
      contextId,
      autoCreateContext,
      tenantId,
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
      // Check if any context exists
      const { data: existingContexts } = await supabase
        .from('developer_contexts')
        .select('id')
        .eq('tenant_id', tenantId)
        .limit(1);

      if (existingContexts && existingContexts.length > 0) {
        developerContextId = existingContexts[0].id;
      } else if (autoCreateContext) {
        // Auto-create a default context
        console.log('Auto-creating developer context...');
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
        console.log('Created default developer context:', developerContextId);
      } else {
        return new Response(JSON.stringify({ error: 'No developer context available. Please create one first.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Create draft project first (before file upload to get project ID)
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
        created_by: user.id,
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
      const exposePath = `${storagePath}/expose/${exposeFile.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('project-documents')
        .upload(exposePath, exposeBuffer, {
          contentType: exposeFile.type,
          upsert: true,
        });

      if (uploadError) {
        console.error('Error uploading expose:', uploadError);
        // Continue anyway - project is created
      } else {
        uploadResults.expose = exposePath;
        console.log('Uploaded expose:', exposePath);
      }
    }

    if (pricelistFile) {
      const pricelistBuffer = await pricelistFile.arrayBuffer();
      const pricelistPath = `${storagePath}/pricelist/${pricelistFile.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('project-documents')
        .upload(pricelistPath, pricelistBuffer, {
          contentType: pricelistFile.type,
          upsert: true,
        });

      if (uploadError) {
        console.error('Error uploading pricelist:', uploadError);
        // Continue anyway - project is created
      } else {
        uploadResults.pricelist = pricelistPath;
        console.log('Uploaded pricelist:', pricelistPath);
      }
    }

    // Update project with file paths
    const { error: updateFilesError } = await supabase
      .from('dev_projects')
      .update({
        intake_data: {
          ...project.intake_data,
          files: uploadResults,
          files_uploaded_at: new Date().toISOString(),
        },
      })
      .eq('id', project.id);

    if (updateFilesError) {
      console.error('Error updating project with file paths:', updateFilesError);
    }

    // Only attempt AI extraction for small files to avoid memory issues
    let aiExtractionDone = false;
    if (exposeFile && exposeSize <= MAX_AI_PROCESSING_SIZE) {
      console.log('File small enough for AI extraction, attempting...');
      
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
- Projektname (z.B. "Residenz am Park")
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
          // Continue without AI - user can edit manually
        }
      }
    } else if (exposeFile) {
      console.log(`File too large for AI extraction (${Math.round(exposeSize / 1024 / 1024)}MB > 5MB limit). User will edit manually.`);
    }

    return new Response(JSON.stringify({
      success: true,
      projectId: project.id,
      projectCode,
      contextId: developerContextId,
      filesUploaded: uploadResults,
      aiExtractionDone,
      message: aiExtractionDone 
        ? 'Projekt erstellt und Daten extrahiert. Bitte überprüfen Sie die Daten.'
        : 'Projekt erstellt. Dateien wurden gespeichert. Bitte ergänzen Sie die Projektdaten manuell.',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

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
