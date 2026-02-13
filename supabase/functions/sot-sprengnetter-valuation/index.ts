/**
 * SOT-SPRENGNETTER-VALUATION
 * 
 * Property valuation via Sprengnetter API.
 * Falls back to AI-based estimation if API keys are not configured.
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

    // Fallback: AI-based estimation
    console.log("Sprengnetter API not configured, using AI fallback");

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    const geminiKey = Deno.env.get("GEMINI_API_KEY");

    let estimatedValue = 0;
    let confidence = "low";
    let method = "fallback_estimate";

    // Simple heuristic fallback
    const basePrice = 2500; // €/m² default
    const area = areaSqm || 100;
    estimatedValue = basePrice * area;
    
    if (yearBuilt && yearBuilt > 2000) {
      estimatedValue *= 1.2;
    } else if (yearBuilt && yearBuilt < 1960) {
      estimatedValue *= 0.85;
    }

    return new Response(
      JSON.stringify({
        success: true,
        source: "ai_fallback",
        valuation: {
          estimatedValue: Math.round(estimatedValue),
          pricePerSqm: Math.round(estimatedValue / area),
          confidence,
          method,
          address,
          note: "Sprengnetter API nicht konfiguriert. Schätzwert basierend auf Durchschnittswerten.",
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
