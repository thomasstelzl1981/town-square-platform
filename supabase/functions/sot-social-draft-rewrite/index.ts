/**
 * sot-social-draft-rewrite — Copywriter toolbar actions
 * Phase 8: Rewrites content (shorter, emotional, direct, etc.)
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ACTION_PROMPTS: Record<string, string> = {
  shorter: "Kürze den Text deutlich, behalte die Kernaussage. Maximal 60% der aktuellen Länge.",
  longer: "Erweitere den Text mit mehr Details, Beispielen oder einer Story. Behalte den Stil bei.",
  emotional: "Mache den Text emotionaler — persönlicher, mit mehr Gefühl und Empathie.",
  direct: "Mache den Text direkter und klarer. Weniger Umschweife, mehr Klartext.",
  professional: "Schreibe den Text professioneller — sachlicher, seriöser, mit Fachbegriffen.",
  casual: "Schreibe den Text lockerer — umgangssprachlicher, nahbarer, mit Humor.",
  story: "Wandle den Text in Story-Format um — mit Anfang, Mitte, Ende und persönlicher Perspektive.",
  controversial: "Schärfe die Meinung im Text. Klarer Position beziehen, polarisierender formulieren.",
  cta_stronger: "Verstärke den Call-to-Action. Klarer, dringender, motivierender.",
  hook_better: "Schreibe einen stärkeren Hook (ersten 1-2 Sätze). Mehr Neugier, Spannung oder Provokation.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { content, action, platform, tenant_id } = await req.json();
    if (!content || !action) {
      return new Response(JSON.stringify({ error: "Missing params" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Get personality
    let personality = {};
    if (tenant_id) {
      const { data } = await supabase.from("social_personality_profiles").select("personality_vector").eq("tenant_id", tenant_id).limit(1).maybeSingle();
      personality = data?.personality_vector || {};
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI not configured");

    const actionPrompt = ACTION_PROMPTS[action] || `Überarbeite den Text: ${action}`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: `Du bist ein Social-Media-Copywriter. Überarbeite den gegebenen ${platform || 'Social Media'}-Post.\nPersönlichkeit: ${JSON.stringify(personality)}\nGib NUR den überarbeiteten Text zurück, keine Erklärungen.` },
          { role: "user", content: `${actionPrompt}\n\nOriginal:\n${content}` },
        ],
        max_tokens: 4000,
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI error: ${resp.status}`);
    }

    const data = await resp.json();
    const rewritten = data.choices?.[0]?.message?.content || content;

    return new Response(JSON.stringify({ success: true, rewritten }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Rewrite error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
