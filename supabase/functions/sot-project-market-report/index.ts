import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Get user auth
    const authHeader = req.headers.get("authorization") || "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user } } = await supabase.auth.getUser();

    // Fetch user's projects for context
    let projectContext = "Keine Projekte vorhanden.";
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("active_tenant_id")
        .eq("id", user.id)
        .single();

      if (profile?.active_tenant_id) {
        const { data: projects } = await supabase
          .from("dev_projects")
          .select("project_name, city, postal_code, total_units_count, units_sold, units_reserved, sale_revenue_actual, status")
          .eq("tenant_id", profile.active_tenant_id)
          .limit(20);

        if (projects && projects.length > 0) {
          projectContext = projects.map((p: any) => 
            `- ${p.project_name} (${p.city} ${p.postal_code || ''}): ${p.total_units_count} Einheiten, ${p.units_sold} verkauft, ${p.units_reserved} reserviert, Status: ${p.status}, Umsatz: ${p.sale_revenue_actual || 0}€`
          ).join("\n");
        }
      }
    }

    const systemPrompt = `Du bist ein erfahrener Immobilienmarkt-Analyst. Erstelle einen strukturierten Marktbericht basierend auf den Projektdaten des Nutzers.

Der Bericht soll folgende Abschnitte enthalten:

## 📊 Marktüberblick
Allgemeine Einschätzung der Standorte der Projekte.

## 🏢 Konkurrenzanalyse
Typische Wettbewerbssituation an den jeweiligen Standorten (Neubau-Projekte, Aufteilungsprojekte).

## 💰 Preisvergleich
Einordnung der Projektpreise im Marktumfeld.

## 📈 Verkaufsperformance
Bewertung der aktuellen Abverkaufsquoten und Umsätze.

## ✅ Empfehlungen
Konkrete Handlungsempfehlungen für die Vermarktung.

Antworte auf Deutsch. Nutze Markdown-Formatierung. Sei konkret und praxisnah.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Hier sind meine aktuellen Projekte:\n\n${projectContext}\n\nErstelle bitte einen detaillierten Marktbericht mit Konkurrenzanalyse und Empfehlungen.` },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("sot-project-market-report error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
