import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PropertyData {
  address: string;
  city: string;
  postal_code: string | null;
  property_type: string | null;
  year_built: number | null;
  total_area_sqm: number | null;
  heating_type: string | null;
  energy_source: string | null;
  renovation_year: number | null;
  description: string | null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { property } = await req.json() as { property: PropertyData };
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating expose description for:", property.address);

    const prompt = `Du bist ein professioneller Immobilienmakler. Erstelle eine ansprechende, sachliche Objektbeschreibung für folgende Immobilie:

Objektdaten:
- Adresse: ${property.address}${property.postal_code ? `, ${property.postal_code}` : ''}${property.city ? ` ${property.city}` : ''}
- Art: ${property.property_type || 'Wohnimmobilie'}
- Baujahr: ${property.year_built || 'Nicht angegeben'}
- Wohnfläche: ${property.total_area_sqm ? property.total_area_sqm + ' m²' : 'Nicht angegeben'}
- Heizung: ${property.heating_type || 'Nicht angegeben'}
- Energieträger: ${property.energy_source || 'Nicht angegeben'}
- Letzte Sanierung: ${property.renovation_year || 'Nicht angegeben'}

Struktur der Beschreibung:
1. Einleitender Satz (max 2 Sätze) — Fasse die Immobilie zusammen
2. Lage & Umgebung (kurz) — Beschreibe die Lage basierend auf der Adresse
3. Ausstattung & Zustand — Beschreibe Zustand und Ausstattung
4. Besondere Merkmale (falls vorhanden)

Die Beschreibung soll:
- Professionell, neutral und ansprechend sein
- Keine übertriebenen Superlative verwenden
- Maximal 200 Wörter umfassen
- Auf Deutsch verfasst sein`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { 
            role: "system", 
            content: "Du schreibst professionelle Immobilien-Exposés auf Deutsch. Deine Beschreibungen sind sachlich, ansprechend und faktenbasiert." 
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 600
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const description = data.choices?.[0]?.message?.content || "";

    console.log("Successfully generated description, length:", description.length);

    return new Response(
      JSON.stringify({ description }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating description:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
