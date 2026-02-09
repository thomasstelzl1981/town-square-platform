/**
 * sot-social-extract-patterns — Extracts posting patterns from sample text
 * Phase 5: Analyzes hook_types, structures, cta_patterns
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { sample_id, content_text } = await req.json();
    if (!sample_id || !content_text) {
      return new Response(JSON.stringify({ error: "Missing params" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI not configured");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Analysiere Social-Media-Posts und extrahiere wiederkehrende Patterns. Antworte auf Deutsch." },
          { role: "user", content: `Analysiere diesen Post und extrahiere Patterns:\n\n"${content_text}"\n\nNutze das Tool "patterns_result".` },
        ],
        tools: [{
          type: "function",
          function: {
            name: "patterns_result",
            description: "Extracted posting patterns",
            parameters: {
              type: "object",
              properties: {
                hook_type: { type: "string", description: "Art des Hooks (Frage, Story, Stat, Kontrovers, etc.)" },
                structure: { type: "string", description: "Post-Struktur (Problem-Solution, List, Narrative, etc.)" },
                tone: { type: "string" },
                cta_pattern: { type: "string" },
                emoji_usage: { type: "string" },
                length_category: { type: "string", description: "short/medium/long" },
                key_techniques: { type: "array", items: { type: "string" } },
              },
              required: ["hook_type", "structure", "tone", "cta_pattern", "key_techniques"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "patterns_result" } },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI error: ${resp.status}`);
    }

    const data = await resp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let patterns = {};
    if (toolCall?.function?.arguments) {
      patterns = JSON.parse(toolCall.function.arguments);
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    await supabase.from("social_inspiration_samples").update({ extracted_patterns: patterns }).eq("id", sample_id);

    return new Response(JSON.stringify({ success: true, patterns }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Pattern extraction error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
