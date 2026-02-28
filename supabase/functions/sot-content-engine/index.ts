import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * sot-content-engine — KI-gestützter Content-Generator für alle 7 Brands.
 * 
 * POST body: { brand: string, topic: string, slug: string, category?: string }
 * 
 * Generates a German-language article via Lovable AI and saves it to brand_articles.
 * Can be triggered manually from the Portal or via a cron job.
 */

interface ContentRequest {
  brand: string;
  topic: string;
  slug: string;
  category?: string;
  auto_publish?: boolean;
}

const BRAND_CONTEXTS: Record<string, string> = {
  sot: "System of a Town — Digitale Plattform für Vermieter, Immobilieninvestoren und Finanzdienstleister. Schwerpunkt: Mietsonderverwaltung, Portfolioverwaltung, KI-gestützte Immobilienanalyse.",
  kaufy: "KAUFY — KI-Plattform für Kapitalanlageimmobilien. Schwerpunkt: Renditeberechnung, Exposé-Erstellung, Vermietermanagement, Off-Market-Objekte.",
  futureroom: "FutureRoom — Digitale Immobilienfinanzierung. Schwerpunkt: Baufinanzierung, Bonitätsprüfung, Bankpartner-Netzwerk mit über 400 Instituten.",
  acquiary: "ACQUIARY — Digitale Akquiseplattform für institutionelle Immobilieninvestments. Schwerpunkt: Off-Market-Deals, Ankaufsprofile, Datenraum, Angebotsanalyse.",
  lennox: "Lennox & Friends — Premium Dog Resorts & Services. Schwerpunkt: Hundepension, Hundesitter, Hundehotels, Reisen mit Hund, Pet-Services.",
  ncore: "Ncore Business Consulting — Ganzheitliche Unternehmensberatung für den Mittelstand. Schwerpunkt: Geschäftsmodellentwicklung, Digitalisierung, Stiftungsberatung.",
  otto: "Otto² Advisory — Finanzberatung für Unternehmer und Privathaushalte. Schwerpunkt: Strategische Finanzplanung, Risikoanalyse, Vorsorge, Immobilienfinanzierung.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase config missing");

    const body: ContentRequest = await req.json();
    const { brand, topic, slug, category, auto_publish } = body;

    if (!brand || !topic || !slug) {
      return new Response(JSON.stringify({ error: "brand, topic, and slug are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const brandContext = BRAND_CONTEXTS[brand];
    if (!brandContext) {
      return new Response(JSON.stringify({ error: `Unknown brand: ${brand}` }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const today = new Date().toLocaleDateString("de-DE", { year: "numeric", month: "long", day: "numeric" });

    const systemPrompt = `Du bist ein erfahrener Fachautor und SEO-Spezialist. Du schreibst Ratgeber-Artikel für die Marke "${brand}".

Markenkontext: ${brandContext}

Erstelle einen professionellen, gut strukturierten Ratgeber-Artikel zum Thema: "${topic}"

Anforderungen:
- Sprache: Deutsch, professionell aber verständlich
- Länge: 1.500–2.500 Wörter
- Format: Markdown mit Überschriften (## und ###), Aufzählungen, Fettungen
- SEO: Natürliche Keyword-Integration, kein Keyword-Stuffing
- Struktur: Einleitung → Hauptteil (3-5 Abschnitte) → Fazit mit Handlungsempfehlung
- Ton: Fachlich kompetent, vertrauensbildend, keine Werbesprache
- Keine Renditeversprechen oder rechtlichen Garantien
- Datum: ${today}
- KEIN Titel als H1 (der wird separat gesetzt)

Am Ende: Generiere einen JSON-Block mit Metadaten:
\`\`\`json
{"seo_title": "...", "seo_description": "...", "reading_time_min": N}
\`\`\``;

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
          { role: "user", content: `Schreibe einen Ratgeber-Artikel zum Thema: "${topic}"` },
        ],
        max_tokens: 8000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required, please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Extract metadata JSON block if present
    let seoTitle = topic;
    let seoDescription = `${topic} — Ratgeber von ${brand}`;
    const jsonMatch = content.match(/```json\s*\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      try {
        const meta = JSON.parse(jsonMatch[1]);
        if (meta.seo_title) seoTitle = meta.seo_title;
        if (meta.seo_description) seoDescription = meta.seo_description;
      } catch { /* ignore parse errors */ }
    }

    // Remove the JSON block from the article content
    const cleanContent = content.replace(/```json\s*\n?[\s\S]*?\n?```/, "").trim();

    // Save to database
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: article, error: dbError } = await supabase
      .from("brand_articles")
      .upsert({
        brand,
        slug,
        title: seoTitle,
        description: seoDescription,
        content: cleanContent,
        category: category || "ratgeber",
        author: brand,
        generated_by: "sot-content-engine",
        is_published: auto_publish ?? false,
        published_at: auto_publish ? new Date().toISOString() : null,
      }, { onConflict: "brand,slug" })
      .select()
      .single();

    if (dbError) {
      console.error("DB error:", dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

    return new Response(JSON.stringify({ success: true, article }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("sot-content-engine error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
