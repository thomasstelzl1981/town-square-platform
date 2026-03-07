import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { snapshot, valueBand, methods, beleihungswert } = await req.json();
    if (!snapshot) throw new Error("snapshot is required");

    // Build a compact data summary for the AI prompt
    const objectType = snapshot.objectType || snapshot.object_type || "Immobilie";
    const address = [snapshot.address, snapshot.postalCode || snapshot.postal_code, snapshot.city].filter(Boolean).join(", ");
    const yearBuilt = snapshot.yearBuilt || snapshot.year_built || null;
    const livingArea = snapshot.livingAreaSqm || snapshot.living_area_sqm || null;
    const plotArea = snapshot.plotAreaSqm || snapshot.plot_area_sqm || null;
    const units = snapshot.units || snapshot.units_count || snapshot.unit_count_actual || null;
    const rooms = snapshot.rooms || null;
    const condition = snapshot.condition || null;
    const energyClass = snapshot.energyClass || snapshot.energy_class || null;
    const heatingType = snapshot.heatingType || snapshot.heating_type || null;
    const coreRenovated = snapshot.coreRenovated || snapshot.core_renovated || false;
    const renovationYear = snapshot.renovationYear || snapshot.renovation_year || null;
    const rentMonthly = snapshot.netColdRentMonthly || snapshot.net_cold_rent_monthly || null;
    const purchasePrice = snapshot.purchasePrice || snapshot.purchase_price || null;
    const askingPrice = snapshot.askingPrice || snapshot.asking_price || null;
    const rentalStatus = snapshot.rentalStatus || snapshot.rental_status || null;

    const marketValue = valueBand?.p50 || null;
    const beleihungswertValue = beleihungswert?.beleihungswert || null;
    const confidence = valueBand?.confidence || null;

    const methodNames = (methods || []).map((m: any) => m.method || m.name).filter(Boolean);

    const dataBlock = [
      `Objektart: ${objectType}`,
      address ? `Adresse: ${address}` : null,
      yearBuilt ? `Baujahr: ${yearBuilt}` : null,
      livingArea ? `Wohnfläche: ${livingArea} m²` : null,
      plotArea ? `Grundstücksfläche: ${plotArea} m²` : null,
      units ? `Einheiten: ${units}` : null,
      rooms ? `Zimmer: ${rooms}` : null,
      condition ? `Zustand: ${condition}` : null,
      energyClass ? `Energieklasse: ${energyClass}` : null,
      heatingType ? `Heizung: ${heatingType}` : null,
      coreRenovated ? `Kernsaniert: Ja${renovationYear ? ` (${renovationYear})` : ''}` : null,
      rentMonthly ? `Kaltmiete: ${rentMonthly} €/Monat` : null,
      purchasePrice ? `Kaufpreis: ${purchasePrice} €` : null,
      askingPrice ? `Angebotspreis: ${askingPrice} €` : null,
      rentalStatus ? `Vermietungsstatus: ${rentalStatus}` : null,
      marketValue ? `Ermittelter Marktwert: ${marketValue} €` : null,
      beleihungswertValue ? `Beleihungswert: ${beleihungswertValue} €` : null,
      confidence ? `Konfidenz: ${confidence}` : null,
      methodNames.length > 0 ? `Angewandte Verfahren: ${methodNames.join(', ')}` : null,
    ].filter(Boolean).join('\n');

    const systemPrompt = `Du bist ein erfahrener Immobiliengutachter und verfasst professionelle Kurzgutachten auf Deutsch. Du schreibst in einem sachlichen, aber gut verständlichen Ton — wie ein Senior-Gutachter, der einem Investor oder Bankberater das Objekt vorstellt.

Erstelle zwei Abschnitte als JSON mit den Schlüsseln "objektbeschreibung" und "methodik":

1. **objektbeschreibung** (3-5 Sätze): Eine professionelle Objektbeschreibung als Einleitung in das Gutachten. Beschreibe das Objekt anhand der gegebenen Daten — Lage, Typ, Größe, Zustand, Besonderheiten. Verwende vollständige Sätze und einen professionellen Gutachterstil. Keine Aufzählungen, sondern Fließtext.

2. **methodik** (3-4 Sätze): Erkläre kurz und verständlich, wie dieses Kurzgutachten methodisch funktioniert: Welche Bewertungsverfahren wurden angewandt (Ertragswertverfahren, Sachwertverfahren, Vergleichswertverfahren), wie wird der Marktwert ermittelt (gewichtetes Mittel), und was die Konfidenz-Bandbreite bedeutet. Erwähne auch den Beleihungswert, falls vorhanden.

Antworte NUR mit dem JSON-Objekt, ohne Markdown-Formatierung.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Hier sind die Objektdaten für das Kurzgutachten:\n\n${dataBlock}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_intro",
              description: "Generate the property introduction and methodology explanation for the valuation report.",
              parameters: {
                type: "object",
                properties: {
                  objektbeschreibung: { type: "string", description: "Professional property description (3-5 sentences)" },
                  methodik: { type: "string", description: "Methodology explanation (3-4 sentences)" },
                },
                required: ["objektbeschreibung", "methodik"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_intro" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    
    let intro = { objektbeschreibung: "", methodik: "" };
    if (toolCall?.function?.arguments) {
      try {
        intro = JSON.parse(toolCall.function.arguments);
      } catch {
        // Fallback: try parsing the content directly
        const content = aiResult.choices?.[0]?.message?.content || "";
        const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        intro = JSON.parse(cleaned);
      }
    }

    return new Response(JSON.stringify(intro), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sot-valuation-intro error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
