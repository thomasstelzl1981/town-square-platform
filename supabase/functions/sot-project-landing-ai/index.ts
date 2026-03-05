/**
 * sot-project-landing-ai — KI-Optimierung für Projekt-Landing-Pages
 * 
 * Reads project data + units + developer context, generates optimized texts
 * via Gemini, and writes results directly to landing_pages table.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { projectId, landingPageId } = await req.json();
    if (!projectId || !landingPageId) {
      return new Response(JSON.stringify({ error: "projectId and landingPageId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Load project data
    const { data: project } = await supabase
      .from("dev_projects")
      .select("id, name, city, address, postal_code, description, full_description, location_description, total_units_count, total_area_sqm, construction_year, features, developer_context_id")
      .eq("id", projectId)
      .maybeSingle();

    if (!project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Load units summary
    const { data: units } = await supabase
      .from("dev_project_units")
      .select("unit_number, area_sqm, rooms_count, list_price, rent_net, status, floor")
      .eq("project_id", projectId)
      .order("unit_number", { ascending: true });

    const unitsSummary = (units || []).map(u => 
      `WE ${u.unit_number}: ${u.rooms_count || '?'} Zi, ${u.area_sqm || '?'} m², ${u.list_price ? `${u.list_price.toLocaleString()} €` : '?'}, Miete ${u.rent_net ? `${u.rent_net} €/Mo` : '?'}, Status: ${u.status || 'frei'}`
    ).join("\n");

    const avgPrice = units?.length ? units.reduce((s, u) => s + (u.list_price || 0), 0) / units.length : 0;
    const avgRent = units?.length ? units.reduce((s, u) => s + (u.rent_net || 0), 0) / units.length : 0;
    const avgYield = avgPrice > 0 ? ((avgRent * 12) / avgPrice * 100).toFixed(2) : "?";

    // 3. Load developer context
    let devCtxText = "";
    if (project.developer_context_id) {
      const { data: ctx } = await supabase
        .from("developer_contexts")
        .select("name, legal_form, city, managing_director")
        .eq("id", project.developer_context_id)
        .maybeSingle();
      if (ctx) {
        devCtxText = `Bauträger: ${ctx.name}${ctx.legal_form ? ` ${ctx.legal_form}` : ""}, ${ctx.city || ""}, GF: ${ctx.managing_director || "k.A."}`;
      }
    }

    // 4. Build AI prompt
    const prompt = `Du bist ein professioneller Immobilien-Texter für eine hochwertige Kapitalanlage-Website.

PROJEKT-DATEN:
- Name: ${project.name}
- Stadt: ${project.city || "?"}, Adresse: ${project.address || "?"} ${project.postal_code || ""}
- Baujahr: ${project.construction_year || "Neubau"}
- Einheiten: ${project.total_units_count || units?.length || "?"}
- Gesamtfläche: ${project.total_area_sqm || "?"} m²
- Ø Kaufpreis: ${avgPrice ? avgPrice.toLocaleString() + " €" : "?"}
- Ø Rendite: ${avgYield}%
${devCtxText ? `- ${devCtxText}` : ""}
${project.features ? `- Features: ${JSON.stringify(project.features)}` : ""}

EINHEITEN:
${unitsSummary || "Keine Einheiten"}

VORHANDENE BESCHREIBUNG:
${project.full_description || project.description || "Keine vorhanden"}

LAGEBESCHREIBUNG:
${project.location_description || "Keine vorhanden"}

AUFGABE: Erstelle optimierte Texte für die Projekt-Landing-Page als JSON mit exakt diesen Feldern:

{
  "hero_headline": "Kurzer, einprägsamer Titel (max 60 Zeichen), der das Projekt als Kapitalanlage positioniert",
  "hero_subheadline": "Ergänzende Zeile mit Standort-Highlight und Rendite-Versprechen (max 120 Zeichen)",
  "about_text": "Professionelle Projektbeschreibung (3-5 Sätze). Fokus auf: Lage, Qualität, Kapitalanlage-Vorteile, Steuervorteile bei Denkmal/Neubau. Sachlich aber einladend.",
  "location_description": "Lagebeschreibung (3-4 Sätze). Infrastruktur, Anbindung, Stadtteil-Charakter, Wertsteigerungspotenzial.",
  "highlights": ["Highlight 1", "Highlight 2", "Highlight 3", "Highlight 4", "Highlight 5"]
}

REGELN:
- Deutsch, professionell, keine Übertreibungen
- Fokus auf Kapitalanleger (Steuervorteile, Rendite, Vermögensaufbau)
- Highlights: 5 kurze Stichpunkte (je max 40 Zeichen), z.B. "Ø 4,2% Bruttorendite", "KfW-55 Standard", "Vollvermietung"
- Wenn Daten fehlen, formuliere allgemein aber professionell
- NUR das JSON ausgeben, kein weiterer Text`;

    // 5. Call AI Gateway with tool calling for structured output
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_landing_content",
              description: "Generate optimized landing page content for a real estate investment project",
              parameters: {
                type: "object",
                properties: {
                  hero_headline: { type: "string", description: "Short catchy headline, max 60 chars" },
                  hero_subheadline: { type: "string", description: "Supporting line with location + yield, max 120 chars" },
                  about_text: { type: "string", description: "Professional project description, 3-5 sentences" },
                  location_description: { type: "string", description: "Location description, 3-4 sentences" },
                  highlights: { type: "array", items: { type: "string" }, description: "5 short highlight bullet points" },
                },
                required: ["hero_headline", "hero_subheadline", "about_text", "location_description", "highlights"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_landing_content" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate-Limit erreicht. Bitte in einer Minute erneut versuchen." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "KI-Credits aufgebraucht. Bitte Credits aufladen." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", status, errText);
      throw new Error(`AI gateway error: ${status}`);
    }

    const aiData = await aiResponse.json();
    
    // Extract from tool call
    let content: any;
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      content = typeof toolCall.function.arguments === "string" 
        ? JSON.parse(toolCall.function.arguments) 
        : toolCall.function.arguments;
    } else {
      // Fallback: try parsing from message content
      const rawContent = aiData.choices?.[0]?.message?.content || "";
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Could not parse AI response");
      content = JSON.parse(jsonMatch[0]);
    }

    // 6. Write to landing_pages
    const { error: updateError } = await supabase
      .from("landing_pages")
      .update({
        hero_headline: content.hero_headline,
        hero_subheadline: content.hero_subheadline,
        about_text: content.about_text,
        location_description: content.location_description,
        highlights_json: content.highlights || [],
        updated_at: new Date().toISOString(),
      })
      .eq("id", landingPageId);

    if (updateError) throw updateError;

    // 7. Also update dev_projects if descriptions were missing
    const projectUpdates: Record<string, string> = {};
    if (!project.full_description && content.about_text) {
      projectUpdates.full_description = content.about_text;
    }
    if (!project.location_description && content.location_description) {
      projectUpdates.location_description = content.location_description;
    }
    if (Object.keys(projectUpdates).length > 0) {
      await supabase.from("dev_projects").update(projectUpdates).eq("id", projectId);
    }

    return new Response(JSON.stringify({
      success: true,
      content,
      fields_updated: ["hero_headline", "hero_subheadline", "about_text", "location_description", "highlights_json"],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sot-project-landing-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
