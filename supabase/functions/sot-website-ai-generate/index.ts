/**
 * sot-website-ai-generate — Armstrong "Website Designer" mode
 * Generates complete website structure with AI-powered content
 * Supports template_id parameter for design presets
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const TEMPLATE_TONES: Record<string, string> = {
  modern: "Modern, clean, professionell. Kurze Sätze. Selbstbewusst und klar.",
  classic: "Klassisch, seriös, vertrauensvoll. Formelle Ansprache. Tradition und Qualität betonen.",
  minimal: "Minimalistisch, auf den Punkt. Wenige Worte, maximale Wirkung.",
  elegant: "Elegant, luxuriös, exklusiv. Emotionale Sprache. Wertigkeit und Prestige vermitteln.",
  fresh: "Frisch, jung, dynamisch. Lockere Sprache. Begeisterung und Energie ausstrahlen.",
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

    const { website_id, name, industry, target_audience, goal, template_id } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tone = TEMPLATE_TONES[template_id || "modern"] || TEMPLATE_TONES.modern;

    const prompt = `Du bist ein Senior UI/UX Designer und Marketing-Spezialist. Erstelle eine komplette Website-Struktur für:

Firmenname: ${name}
Branche: ${industry || 'Nicht angegeben'}
Zielgruppe: ${target_audience || 'Allgemein'}
Ziel: ${goal || 'branding'}

Stil/Tonalität: ${tone}

Erstelle ein JSON-Array mit genau 6 Sections in dieser Reihenfolge:
1. hero - Hauptbanner mit Headline, Subline, CTA
2. features - 3 überzeugende Vorteile
3. about - Über-uns Text
4. services - 3-4 Leistungen/Angebote
5. contact - Kontaktformular-Konfiguration
6. footer - Footer mit Firmendaten

Antworte NUR mit validem JSON (Array von Objekten). Jedes Objekt hat:
- section_type: string
- content_json: object (mit den Feldern passend zum Typ)
- design_json: object (optional, z.B. backgroundColor)

Für "hero": { headline, subline, cta_text, cta_link, overlay_opacity }
Für "features": { title, items: [{ icon (emoji), title, description }] }
Für "about": { title, text }
Für "services": { title, items: [{ icon (emoji), title, description }] }
Für "contact": { title, subtitle }
Für "footer": { company_name }

Texte sollen professionell, überzeugend und SEO-optimiert sein. Deutsche Sprache. Passe den Schreibstil an die Tonalität an.`;

    console.log(`Generating website structure via AI (template: ${template_id || 'modern'})...`);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: "Du generierst Website-Strukturen als reines JSON. Keine Markdown-Formatierung, kein Code-Block, nur valides JSON." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 8000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      throw new Error(`AI service error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "[]";

    let sections;
    try {
      const cleaned = rawContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      sections = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", rawContent);
      throw new Error("AI response was not valid JSON");
    }

    if (!Array.isArray(sections)) throw new Error("AI response was not an array");

    // Get or create the home page
    let { data: page } = await supabase
      .from("website_pages")
      .select("id, tenant_id")
      .eq("website_id", website_id)
      .eq("slug", "home")
      .single();

    if (!page) {
      const { data: website } = await supabase
        .from("tenant_websites")
        .select("tenant_id")
        .eq("id", website_id)
        .single();
      if (!website) throw new Error("Website not found");

      const { data: newPage, error: pageError } = await supabase
        .from("website_pages")
        .insert({ website_id, tenant_id: website.tenant_id, slug: "home", title: "Startseite" })
        .select("id, tenant_id")
        .single();
      if (pageError) throw pageError;
      page = newPage;
    }

    // Delete existing sections for this page
    await supabase.from("website_sections").delete().eq("page_id", page.id);

    // Insert AI-generated sections
    const sectionInserts = sections.map((s: any, i: number) => ({
      page_id: page!.id,
      tenant_id: page!.tenant_id,
      section_type: s.section_type,
      sort_order: i,
      content_json: s.content_json || {},
      design_json: s.design_json || {},
      is_visible: true,
    }));

    const { error: sectionsError } = await supabase
      .from("website_sections")
      .insert(sectionInserts);

    if (sectionsError) throw sectionsError;

    console.log(`Generated ${sections.length} sections for website ${website_id}`);

    return new Response(
      JSON.stringify({ success: true, sections_count: sections.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("AI generate error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
