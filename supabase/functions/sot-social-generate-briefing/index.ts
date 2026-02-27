/**
 * sot-social-generate-briefing — Generates topic briefings via Lovable AI
 * Phase 4: Takes topic + personality_vector, returns briefing with hooks, arguments, CTAs
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
    const { topic_id, topic_label, tenant_id } = await req.json();
    if (!topic_id || !topic_label || !tenant_id) {
      return new Response(JSON.stringify({ error: "Missing params" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get personality vector
    const { data: profile } = await supabase
      .from("social_personality_profiles")
      .select("personality_vector")
      .eq("tenant_id", tenant_id)
      .limit(1)
      .maybeSingle();

    const personality = profile?.personality_vector || {};

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const prompt = `Erstelle ein Content-Briefing zum Thema "${topic_label}" für Social Media (LinkedIn, Instagram, Facebook).

Persönlichkeitsprofil des Autors: ${JSON.stringify(personality)}

Liefere das Ergebnis mit dem Tool "briefing_result".`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: "Du bist ein Social-Media-Stratege. Erstelle praxisnahe Content-Briefings auf Deutsch." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "briefing_result",
            description: "Return structured briefing data",
            parameters: {
              type: "object",
              properties: {
                hook_patterns: { type: "array", items: { type: "string" }, description: "5 Hook-Muster (erste Sätze)" },
                argument_lines: { type: "array", items: { type: "string" }, description: "3-5 Argumentationslinien" },
                cta_variants: { type: "array", items: { type: "string" }, description: "3 CTA-Varianten" },
                content_angles: { type: "array", items: { type: "string" }, description: "5 Content-Winkel / Post-Ideen" },
                hashtags: { type: "array", items: { type: "string" }, description: "10 relevante Hashtags" },
              },
              required: ["hook_patterns", "argument_lines", "cta_variants", "content_angles", "hashtags"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "briefing_result" } },
      }),
    });

    if (!resp.ok) {
      const status = resp.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI error: ${status}`);
    }

    const data = await resp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let briefing = {};
    if (toolCall?.function?.arguments) {
      briefing = JSON.parse(toolCall.function.arguments);
    }

    // Save briefing to topic
    await supabase.from("social_topics").update({ topic_briefing: briefing }).eq("id", topic_id);

    return new Response(JSON.stringify({ success: true, briefing }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Briefing error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
