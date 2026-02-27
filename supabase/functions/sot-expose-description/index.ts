import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PropertyData {
  address: string;
  city: string;
  postal_code?: string | null;
  property_type?: string | null;
  year_built?: number | null;
  total_area_sqm?: number | null;
  heating_type?: string | null;
  energy_source?: string | null;
  renovation_year?: number | null;
  location_notes?: string | null;
  rooms?: number | null;
  floor?: number | null;
  features_tags?: string[] | null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { propertyId, property_id, property: directProperty } = body;
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    let propertyData: PropertyData | null = null;
    let unitData: { rooms?: number; floor?: number; area_sqm?: number; features_tags?: string[] } | null = null;

    // Option 1: Property data passed directly
    if (directProperty && directProperty.address) {
      console.log("Using directly passed property data");
      propertyData = directProperty;
    } 
    // Option 2: Load by propertyId
    else {
      const id = propertyId || property_id;
      if (!id) {
        return new Response(
          JSON.stringify({ error: "Either propertyId or property object is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Initialize Supabase client
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Load property data
      console.log("Loading property data for:", id);
      const { data: prop, error: propError } = await supabase
        .from("properties")
        .select("address, city, postal_code, property_type, year_built, total_area_sqm, heating_type, energy_source, renovation_year, location_notes")
        .eq("id", id)
        .maybeSingle();

      if (propError) {
        console.error("Error loading property:", propError);
        throw new Error("Failed to load property data");
      }

      if (!prop) {
        return new Response(
          JSON.stringify({ error: "Property not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      propertyData = prop;

      // Load unit data for additional details
      const { data: unit } = await supabase
        .from("units")
        .select("rooms, floor, area_sqm, features_tags")
        .eq("property_id", id)
        .limit(1)
        .maybeSingle();

      unitData = unit;
    }

    if (!propertyData) {
      return new Response(
        JSON.stringify({ error: "No property data available" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Generating expose description for:", propertyData.address);

    // Merge unit data with property data for complete picture
    const rooms = propertyData.rooms || unitData?.rooms;
    const floor = propertyData.floor || unitData?.floor;
    const areaSqm = unitData?.area_sqm || propertyData.total_area_sqm;
    const featuresTags = propertyData.features_tags || unitData?.features_tags;

    const prompt = `Du bist ein professioneller Immobilienmakler. Erstelle eine ansprechende, sachliche Objektbeschreibung für folgende Immobilie:

Objektdaten:
- Adresse: ${propertyData.address}${propertyData.postal_code ? `, ${propertyData.postal_code}` : ''}${propertyData.city ? ` ${propertyData.city}` : ''}
- Art: ${propertyData.property_type || 'Wohnimmobilie'}
- Baujahr: ${propertyData.year_built || 'Nicht angegeben'}
- Wohnfläche: ${areaSqm ? areaSqm + ' m²' : 'Nicht angegeben'}
- Zimmer: ${rooms || 'Nicht angegeben'}
- Etage: ${floor || 'Nicht angegeben'}
- Heizung: ${propertyData.heating_type || 'Nicht angegeben'}
- Energieträger: ${propertyData.energy_source || 'Nicht angegeben'}
- Letzte Sanierung: ${propertyData.renovation_year || 'Nicht angegeben'}
- Besondere Merkmale: ${featuresTags?.length ? featuresTags.join(', ') : 'Keine'}
${propertyData.location_notes ? `- Lagehinweise: ${propertyData.location_notes}` : ''}

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
        model: "google/gemini-2.5-pro",
        messages: [
          { 
            role: "system", 
            content: "Du schreibst professionelle Immobilien-Exposés auf Deutsch. Deine Beschreibungen sind sachlich, ansprechend und faktenbasiert." 
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 4000
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
