/**
 * sot-social-analyze-performance — AI analysis of posting performance
 * Phase 10: Analyzes metrics and provides recommendations
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { metrics } = await req.json();
    if (!metrics || !Array.isArray(metrics) || metrics.length === 0) {
      return new Response(JSON.stringify({ error: "No metrics" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI not configured");

    const metricsText = metrics.map((m: any, i: number) =>
      `Post ${i+1} (${m.platform}): ${m.impressions} Imp, ${m.likes} Likes, ${m.comments} Comments, ${m.saves} Saves`
    ).join("\n");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: "Du bist ein Social-Media-Analyst. Analysiere Performance-Daten und gib konkrete Empfehlungen auf Deutsch. Max 200 Wörter." },
          { role: "user", content: `Analysiere diese Social-Media-Kennzahlen:\n\n${metricsText}\n\nWas funktioniert? Was kann verbessert werden? Gib 3 konkrete Tipps.` },
        ],
        max_tokens: 4000,
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI error: ${resp.status}`);
    }

    const data = await resp.json();
    const analysis = data.choices?.[0]?.message?.content || "Keine Analyse verfügbar.";

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Analysis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
