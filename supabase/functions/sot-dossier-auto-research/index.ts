import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * sot-dossier-auto-research
 * 
 * Triggered after entity creation (vehicle, insurance, pv_plant).
 * Uses Perplexity Sonar to research entity details and stores JSON knowledge in storage.
 * 
 * Input: { job_id, entity_type, entity_id, search_query, tenant_id }
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
  if (!PERPLEXITY_API_KEY) {
    return new Response(JSON.stringify({ error: "PERPLEXITY_API_KEY is not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { job_id, entity_type, entity_id, search_query, tenant_id } = await req.json();

    if (!job_id || !entity_type || !entity_id || !search_query || !tenant_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark job as running
    await supabase.from("dossier_research_jobs").update({
      status: "running",
      started_at: new Date().toISOString(),
    }).eq("id", job_id);

    // Build search prompt based on entity type
    const systemPrompts: Record<string, string> = {
      vehicle: `Du bist ein Fahrzeug-Experte. Recherchiere alle wichtigen Informationen zu dem genannten Fahrzeug. 
        Liefere: Technische Daten, typische Wartungsintervalle, bekannte Probleme, Rückrufe, 
        Versicherungsklassen (Haftpflicht/Teilkasko/Vollkasko), Verbrauchswerte, 
        empfohlene Inspektionen und praktische Tipps für den Besitzer.
        Antworte auf Deutsch in strukturiertem JSON.`,
      insurance: `Du bist ein Versicherungs-Experte für den deutschen Markt. Recherchiere die Versicherungsbedingungen 
        und wichtigsten Informationen zur genannten Versicherung. 
        Liefere: Deckungsumfang, typische Ausschlüsse, Kündigungsfristen, Schadensmeldung-Prozess, 
        Selbstbeteiligung, Besonderheiten, wichtige Klauseln und praktische Tipps.
        Antworte auf Deutsch in strukturiertem JSON.`,
      pv_plant: `Du bist ein Photovoltaik-Experte. Recherchiere alle wichtigen Informationen zur genannten PV-Anlage 
        bzw. den verwendeten Komponenten. 
        Liefere: Technische Daten der Module/Wechselrichter, Wartungshinweise, typische Degradation, 
        Garantiebedingungen, Monitoring-Tipps, Reinigungsintervalle, Versicherungshinweise und 
        behördliche Meldepflichten (MaStR, Netzbetreiber).
        Antworte auf Deutsch in strukturiertem JSON.`,
    };

    const systemPrompt = systemPrompts[entity_type] || systemPrompts.vehicle;

    // Call Perplexity API
    const perplexityResponse = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: search_query },
        ],
        search_domain_filter: entity_type === "insurance" 
          ? ["check24.de", "finanztip.de", "verbraucherzentrale.de", "gdv.de"]
          : undefined,
        search_recency_filter: "year",
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "dossier_knowledge",
            schema: {
              type: "object",
              properties: {
                entity_name: { type: "string" },
                entity_type: { type: "string" },
                summary: { type: "string" },
                key_facts: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      category: { type: "string" },
                      fact: { type: "string" },
                    },
                  },
                },
                maintenance_tips: {
                  type: "array",
                  items: { type: "string" },
                },
                warnings: {
                  type: "array",
                  items: { type: "string" },
                },
                useful_links: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string" },
                      url: { type: "string" },
                    },
                  },
                },
                raw_details: { type: "object" },
              },
              required: ["entity_name", "entity_type", "summary", "key_facts"],
            },
          },
        },
      }),
    });

    if (!perplexityResponse.ok) {
      const errText = await perplexityResponse.text();
      console.error("Perplexity API error:", perplexityResponse.status, errText);
      
      await supabase.from("dossier_research_jobs").update({
        status: "failed",
        error_message: `Perplexity API error: ${perplexityResponse.status}`,
        completed_at: new Date().toISOString(),
      }).eq("id", job_id);

      return new Response(JSON.stringify({ error: "Research API error" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const perplexityData = await perplexityResponse.json();
    const content = perplexityData.choices?.[0]?.message?.content;
    const citations = perplexityData.citations || [];
    const tokensUsed = perplexityData.usage?.total_tokens || 0;

    // Parse the JSON response
    let knowledgeJson: Record<string, unknown>;
    try {
      knowledgeJson = typeof content === "string" ? JSON.parse(content) : content;
    } catch {
      knowledgeJson = { raw_response: content, parse_error: true };
    }

    // Add citations to the knowledge
    knowledgeJson.sources = citations;
    knowledgeJson.researched_at = new Date().toISOString();
    knowledgeJson.entity_id = entity_id;
    knowledgeJson.search_query = search_query;

    // Store JSON in tenant-documents bucket
    const storagePath = `${tenant_id}/dossier/${entity_type}/${entity_id}/knowledge.json`;
    const jsonContent = JSON.stringify(knowledgeJson, null, 2);
    const jsonBlob = new Blob([jsonContent], { type: "application/json" });

    const { error: uploadError } = await supabase.storage
      .from("tenant-documents")
      .upload(storagePath, jsonBlob, {
        contentType: "application/json",
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
    }

    // Update job as completed
    await supabase.from("dossier_research_jobs").update({
      status: "completed",
      result_storage_path: storagePath,
      result_json: knowledgeJson as any,
      tokens_used: tokensUsed,
      completed_at: new Date().toISOString(),
    }).eq("id", job_id);

    // Create task widget to notify user
    await supabase.from("task_widgets").insert({
      tenant_id,
      type: "dossier_research_complete",
      title: `Recherche abgeschlossen: ${(knowledgeJson as any).entity_name || search_query}`,
      description: (knowledgeJson as any).summary || "Armstrong hat die Recherche abgeschlossen.",
      action_code: "ARM.DOSSIER.VIEW_RESEARCH",
      status: "pending",
      parameters: {
        entity_type,
        entity_id,
        job_id,
        storage_path: storagePath,
      },
    });

    return new Response(JSON.stringify({ 
      success: true, 
      job_id,
      storage_path: storagePath,
      summary: (knowledgeJson as any).summary,
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("dossier-auto-research error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
