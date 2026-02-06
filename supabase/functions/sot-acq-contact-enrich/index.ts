/**
 * SOT-ACQ-CONTACT-ENRICH
 * 
 * Enriches staging contacts using Firecrawl + Lovable AI
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { stagingId } = await req.json();

    // Get staging contact
    const { data: staging, error: fetchError } = await supabase
      .from('contact_staging')
      .select('*')
      .eq('id', stagingId)
      .single();

    if (fetchError || !staging) {
      throw new Error('Staging contact not found');
    }

    // Create analysis run
    const { data: run } = await supabase
      .from('acq_analysis_runs')
      .insert([{
        contact_staging_id: stagingId,
        mandate_id: staging.mandate_id,
        run_type: 'enrichment',
        status: 'running',
        started_at: new Date().toISOString(),
      }])
      .select()
      .single();

    let enrichmentData: Record<string, unknown> = { ...staging.enrichment_data };
    let qualityScore = staging.quality_score || 50;

    // ========================================
    // 1. Firecrawl Website Scrape
    // ========================================
    if (FIRECRAWL_API_KEY && staging.website_url) {
      try {
        console.log('Scraping website:', staging.website_url);

        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: staging.website_url,
            formats: ['markdown', 'branding'],
            onlyMainContent: true,
          }),
        });

        if (scrapeResponse.ok) {
          const scrapeData = await scrapeResponse.json();
          enrichmentData.firecrawl = {
            scraped_at: new Date().toISOString(),
            markdown: scrapeData.data?.markdown?.slice(0, 5000), // Limit size
            branding: scrapeData.data?.branding,
            metadata: scrapeData.data?.metadata,
          };
          qualityScore += 10;
        }
      } catch (scrapeError) {
        console.error('Firecrawl error:', scrapeError);
      }
    }

    // ========================================
    // 2. AI Classification & Enhancement
    // ========================================
    if (LOVABLE_API_KEY) {
      try {
        const contextInfo = `
          Company: ${staging.company_name || 'Unknown'}
          Name: ${staging.first_name || ''} ${staging.last_name || ''}
          Email: ${staging.email || 'N/A'}
          Phone: ${staging.phone || 'N/A'}
          Website: ${staging.website_url || 'N/A'}
          Current Role Guess: ${staging.role_guess || 'N/A'}
          Service Area: ${staging.service_area || 'N/A'}
          ${enrichmentData.firecrawl ? `Website Content: ${(enrichmentData.firecrawl as any).markdown?.slice(0, 2000) || 'N/A'}` : ''}
        `;

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
                content: `Du bist ein Immobilien-Kontakt-Analyst. Analysiere Kontaktdaten und klassifiziere sie.
                Antworte NUR mit einem JSON-Objekt (keine Markdown-Formatierung):
                {
                  "role_classification": "makler|eigentuemer|hausverwaltung|bautraeger|investor|unbekannt",
                  "confidence": 0-100,
                  "service_regions": ["Region1", "Region2"],
                  "specializations": ["MFH", "ETW", etc.],
                  "company_type": "einzelmakler|buero|franchise|hausverwaltung|bautraeger|sonstige",
                  "contact_quality": "hoch|mittel|niedrig",
                  "notes": "Kurze Begründung"
                }`,
              },
              {
                role: 'user',
                content: contextInfo,
              },
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const content = aiData.choices?.[0]?.message?.content;

          if (content) {
            try {
              // Try to parse JSON from the response
              const jsonMatch = content.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const classification = JSON.parse(jsonMatch[0]);
                enrichmentData.ai_classification = {
                  ...classification,
                  analyzed_at: new Date().toISOString(),
                };

                // Adjust quality score based on AI confidence
                if (classification.confidence > 80) qualityScore += 15;
                else if (classification.confidence > 60) qualityScore += 10;
                else qualityScore += 5;

                // Update role_guess if more confident
                if (classification.role_classification && classification.role_classification !== 'unbekannt') {
                  enrichmentData.role_guess_ai = classification.role_classification;
                }
              }
            } catch (parseError) {
              console.error('Failed to parse AI response:', content);
            }
          }
        }
      } catch (aiError) {
        console.error('AI enrichment error:', aiError);
      }
    }

    // ========================================
    // 3. Update staging record
    // ========================================
    qualityScore = Math.min(100, qualityScore);

    await supabase
      .from('contact_staging')
      .update({
        enrichment_data: enrichmentData,
        quality_score: qualityScore,
        role_guess: (enrichmentData.ai_classification as any)?.role_classification || staging.role_guess,
        updated_at: new Date().toISOString(),
      })
      .eq('id', stagingId);

    // Update analysis run
    if (run) {
      await supabase
        .from('acq_analysis_runs')
        .update({
          status: 'completed',
          output_data: enrichmentData,
          completed_at: new Date().toISOString(),
        })
        .eq('id', run.id);
    }

    console.log('Enrichment complete:', { stagingId, qualityScore });

    return new Response(
      JSON.stringify({ success: true, qualityScore, enrichmentData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in sot-acq-contact-enrich:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
