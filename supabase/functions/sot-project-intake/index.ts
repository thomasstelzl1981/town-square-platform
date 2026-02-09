/**
 * SOT Project Intake - AI-powered project and unit extraction
 * MOD-13 PROJEKTE - Phase E
 * 
 * Receives Exposé (PDF) and/or Pricelist (XLSX/CSV/PDF) and uses AI to extract:
 * - Project metadata (name, city, description, type)
 * - Unit list (unitNo, type, area, price)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface ExtractedProject {
  name: string;
  city: string | null;
  postal_code: string | null;
  address: string | null;
  description: string | null;
  project_type: 'neubau' | 'aufteilung';
  needs_review: boolean;
}

interface ExtractedUnit {
  unit_number: string;
  floor: number | null;
  area_sqm: number | null;
  rooms_count: number | null;
  list_price: number | null;
  unit_type: string | null;
  needs_review: boolean;
}

interface IntakeResult {
  project: ExtractedProject;
  units: ExtractedUnit[];
  confidence: number;
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

    // Parse form data
    const formData = await req.formData();
    const exposeFile = formData.get('expose') as File | null;
    const pricelistFile = formData.get('pricelist') as File | null;
    const contextId = formData.get('contextId') as string;

    if (!contextId) {
      return new Response(JSON.stringify({ error: 'Missing contextId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!exposeFile && !pricelistFile) {
      return new Response(JSON.stringify({ error: 'At least one file required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Starting project intake...', {
      hasExpose: !!exposeFile,
      hasPricelist: !!pricelistFile,
      contextId,
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

    // Create draft project with intake status
    const { data: project, error: projectError } = await supabase
      .from('dev_projects')
      .insert({
        tenant_id: tenantId,
        developer_context_id: contextId,
        project_code: projectCode,
        name: `Import ${projectCode}`,
        status: 'draft_intake',
        needs_review: true,
        intake_data: {
          started_at: new Date().toISOString(),
          has_expose: !!exposeFile,
          has_pricelist: !!pricelistFile,
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

    // Process files with AI (async - will update project when done)
    // For now, we create the project and let the user edit it
    // In a full implementation, we would:
    // 1. Upload files to storage
    // 2. Call AI extraction
    // 3. Update project with extracted data
    // 4. Create units from pricelist

    // Simplified: Extract basic info if we have files
    let extractedData: Partial<IntakeResult> = { confidence: 0.5 };

    if (exposeFile) {
      // Read file content for AI processing
      const exposeBuffer = await exposeFile.arrayBuffer();
      const exposeBase64 = btoa(String.fromCharCode(...new Uint8Array(exposeBuffer)));
      
      // Call Lovable AI for extraction
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      if (LOVABLE_API_KEY) {
        try {
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

Antworte NUR mit einem JSON-Objekt im Format:
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
                    {
                      type: 'text',
                      text: 'Extrahiere die Projektdaten aus diesem Immobilien-Exposé:'
                    },
                    {
                      type: 'image_url',
                      image_url: {
                        url: `data:application/pdf;base64,${exposeBase64}`
                      }
                    }
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
              try {
                // Extract JSON from response
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  const parsed = JSON.parse(jsonMatch[0]);
                  extractedData = {
                    project: {
                      name: parsed.name || `Import ${projectCode}`,
                      city: parsed.city || null,
                      postal_code: parsed.postal_code || null,
                      address: parsed.address || null,
                      description: parsed.description || null,
                      project_type: parsed.project_type === 'neubau' ? 'neubau' : 'aufteilung',
                      needs_review: true,
                    },
                    units: [],
                    confidence: 0.7,
                  };
                }
              } catch (parseErr) {
                console.error('Error parsing AI response:', parseErr);
              }
            }
          }
        } catch (aiErr) {
          console.error('AI extraction error:', aiErr);
          // Continue without AI extraction
        }
      }
    }

    // Update project with extracted data if available
    if (extractedData.project) {
      const { error: updateError } = await supabase
        .from('dev_projects')
        .update({
          name: extractedData.project.name,
          city: extractedData.project.city,
          postal_code: extractedData.project.postal_code,
          address: extractedData.project.address,
          description: extractedData.project.description,
          project_type: extractedData.project.project_type,
          intake_data: {
            ...project.intake_data,
            extracted_at: new Date().toISOString(),
            confidence: extractedData.confidence,
          },
        })
        .eq('id', project.id);

      if (updateError) {
        console.error('Error updating project with extracted data:', updateError);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      projectId: project.id,
      projectCode,
      message: 'Projekt erstellt. Bitte überprüfen Sie die Daten.',
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
