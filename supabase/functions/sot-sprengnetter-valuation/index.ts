/**
 * SOT-SPRENGNETTER-VALUATION
 * 
 * Property valuation via Sprengnetter API.
 * Falls back to AI-based estimation (Gemini) if API keys are not configured.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { address, propertyType, yearBuilt, areaSqm } = await req.json();

    if (!address) {
      return new Response(
        JSON.stringify({ success: false, error: "address is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("SPRENGNETTER_API_KEY");
    const customerId = Deno.env.get("SPRENGNETTER_CUSTOMER_ID");

    if (apiKey && customerId) {
      // Real Sprengnetter API call
      console.log("Using Sprengnetter API for valuation");

      const response = await fetch("https://api.sprengnetter.de/v1/valuation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
          "X-Customer-Id": customerId,
        },
        body: JSON.stringify({
          address,
          propertyType: propertyType || "MFH",
          yearBuilt: yearBuilt || null,
          livingArea: areaSqm || null,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Sprengnetter API error:", errorText);
        throw new Error(`Sprengnetter API error: ${response.status}`);
      }

      const data = await response.json();
      return new Response(
        JSON.stringify({ success: true, source: "sprengnetter", ...data }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fallback: AI-based estimation using Lovable AI Gateway
    console.log("Sprengnetter API not configured, using AI-based valuation");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (LOVABLE_API_KEY) {
      const area = areaSqm || 100;
      const prompt = `Du bist ein Immobilienbewertungs-Experte für den deutschen Markt.
Bewerte folgende Immobilie und gib eine fundierte Schätzung ab.

Adresse: ${address}
Objekttyp: ${propertyType || "Mehrfamilienhaus"}
Baujahr: ${yearBuilt || "unbekannt"}
Fläche: ${area} m²

Antworte AUSSCHLIESSLICH als JSON-Objekt mit dieser Struktur:
{
  "estimatedValue": <Gesamtwert in Euro als Zahl>,
  "pricePerSqm": <Preis pro m² als Zahl>,
  "confidence": "medium",
  "priceRange": { "min": <Zahl>, "max": <Zahl> },
  "marketTrend": "stable" | "rising" | "falling",
  "comparables": "<Kurzbeschreibung vergleichbarer Objekte>",
  "reasoning": "<Begründung der Bewertung in 2-3 Sätzen>"
}`;

      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "Du bist ein deutscher Immobilienbewertungs-Experte. Antworte nur mit validem JSON." },
              { role: "user", content: prompt },
            ],
          }),
        });

        if (!aiResponse.ok) {
          const errText = await aiResponse.text();
          console.error("AI Gateway error:", aiResponse.status, errText);
          throw new Error("AI Gateway error");
        }

        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content || "";
        
        // Extract JSON from response
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return new Response(
            JSON.stringify({
              success: true,
              source: "ai_valuation",
              isEstimate: true,
              valuation: {
                estimatedValue: parsed.estimatedValue || 0,
                pricePerSqm: parsed.pricePerSqm || 0,
                confidence: parsed.confidence || "medium",
                priceRange: parsed.priceRange || null,
                marketTrend: parsed.marketTrend || "stable",
                comparables: parsed.comparables || "",
                reasoning: parsed.reasoning || "",
                address,
                note: "KI-gestützte Bewertung — kein Gutachten. Sprengnetter-API nicht konfiguriert.",
              },
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } catch (aiErr) {
        console.error("AI valuation failed, falling back to heuristic:", aiErr);
      }
    }

    // Last resort: Simple heuristic fallback
    const basePrice = 2500;
    const area = areaSqm || 100;
    let estimatedValue = basePrice * area;
    
    if (yearBuilt && yearBuilt > 2000) {
      estimatedValue *= 1.2;
    } else if (yearBuilt && yearBuilt < 1960) {
      estimatedValue *= 0.85;
    }

    return new Response(
      JSON.stringify({
        success: true,
        source: "heuristic_fallback",
        isEstimate: true,
        valuation: {
          estimatedValue: Math.round(estimatedValue),
          pricePerSqm: Math.round(estimatedValue / area),
          confidence: "low",
          method: "heuristic",
          address,
          note: "Grobe Schätzung — weder Sprengnetter-API noch KI verfügbar.",
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in sot-sprengnetter-valuation:", error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
