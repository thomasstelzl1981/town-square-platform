/**
 * sot-website-update-section — AI-driven section content update
 * Supports: update existing section content, add new section with AI content
 * Used by Armstrong actions: ARM.MOD21.UPDATE_SECTION, ARM.MOD21.ADD_SECTION
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SECTION_SCHEMAS: Record<string, string> = {
  hero: '{ headline, subline, cta_text, cta_link, overlay_opacity }',
  features: '{ title, items: [{ icon (emoji), title, description }] }',
  about: '{ title, text }',
  services: '{ title, items: [{ icon (emoji), title, description }] }',
  testimonials: '{ title, items: [{ name, quote, role }] }',
  gallery: '{ title, images: [{ url, alt }] }',
  contact: '{ title, subtitle }',
  footer: '{ company_name }',
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Not authenticated");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Not authenticated");

    const { action, website_id, section_id, section_type, instruction } = await req.json();

    if (!website_id || !instruction) {
      throw new Error("website_id and instruction are required");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI service not configured");

    // Get website info
    const { data: website } = await supabase
      .from("tenant_websites")
      .select("id, tenant_id, name")
      .eq("id", website_id)
      .single();
    if (!website) throw new Error("Website not found");

    // Get the home page
    const { data: page } = await supabase
      .from("website_pages")
      .select("id")
      .eq("website_id", website_id)
      .eq("slug", "home")
      .single();
    if (!page) throw new Error("No home page found");

    if (action === "add") {
      // ADD NEW SECTION
      const sType = section_type || "about";
      const schema = SECTION_SCHEMAS[sType] || SECTION_SCHEMAS.about;

      const prompt = `Erstelle den Inhalt für eine "${sType}" Website-Section.
Website: ${website.name}
Anweisung des Nutzers: ${instruction}

Antworte NUR mit validem JSON im Format: ${schema}
Deutsche Sprache. Professionell und überzeugend.`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "Du generierst Website-Section-Inhalte als reines JSON. Keine Markdown-Formatierung." },
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      if (!aiResponse.ok) {
        if (aiResponse.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded, bitte später versuchen." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (aiResponse.status === 402) {
          return new Response(JSON.stringify({ error: "Credits aufgebraucht, bitte Credits aufladen." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`AI error: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      const raw = aiData.choices?.[0]?.message?.content || "{}";
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const contentJson = JSON.parse(cleaned);

      // Get max sort_order
      const { data: existingSections } = await supabase
        .from("website_sections")
        .select("sort_order")
        .eq("page_id", page.id)
        .order("sort_order", { ascending: false })
        .limit(1);

      const nextOrder = (existingSections?.[0]?.sort_order ?? -1) + 1;

      const { data: newSection, error: insertError } = await supabase
        .from("website_sections")
        .insert({
          page_id: page.id,
          tenant_id: website.tenant_id,
          section_type: sType,
          sort_order: nextOrder,
          content_json: contentJson,
          design_json: {},
          is_visible: true,
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      return new Response(
        JSON.stringify({ success: true, action: "added", section_id: newSection?.id, section_type: sType }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      // UPDATE EXISTING SECTION
      let targetSection: any = null;

      if (section_id) {
        const { data } = await supabase.from("website_sections").select("*").eq("id", section_id).single();
        targetSection = data;
      } else if (section_type) {
        const { data } = await supabase
          .from("website_sections")
          .select("*")
          .eq("page_id", page.id)
          .eq("section_type", section_type)
          .limit(1)
          .single();
        targetSection = data;
      }

      if (!targetSection) throw new Error("Section not found");

      const schema = SECTION_SCHEMAS[targetSection.section_type] || "{}";

      const prompt = `Du bearbeitest eine "${targetSection.section_type}" Website-Section.
Aktueller Inhalt: ${JSON.stringify(targetSection.content_json)}

Anweisung des Nutzers: ${instruction}

Erstelle den VOLLSTÄNDIGEN aktualisierten Inhalt im Format: ${schema}
Behalte alle nicht genannten Felder bei. Antworte NUR mit validem JSON.`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "Du aktualisierst Website-Section-Inhalte als reines JSON. Keine Markdown-Formatierung." },
            { role: "user", content: prompt },
          ],
          temperature: 0.5,
          max_tokens: 1000,
        }),
      });

      if (!aiResponse.ok) {
        if (aiResponse.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (aiResponse.status === 402) {
          return new Response(JSON.stringify({ error: "Credits aufgebraucht" }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`AI error: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      const raw = aiData.choices?.[0]?.message?.content || "{}";
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const updatedContent = JSON.parse(cleaned);

      const { error: updateError } = await supabase
        .from("website_sections")
        .update({ content_json: updatedContent })
        .eq("id", targetSection.id);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({ success: true, action: "updated", section_id: targetSection.id, section_type: targetSection.section_type }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Update section error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
