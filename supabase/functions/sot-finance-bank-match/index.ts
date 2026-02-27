import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

/**
 * SOT Finance Bank-Match — Runde 3 (P2)
 * 
 * AI-driven bank partner recommendations based on property, client profile,
 * and financing structure. Returns Top-5 bank suggestions with reasoning.
 * 
 * Input:
 *   - property: { type, price, city, year_built, units_count, area_sqm }
 *   - client: { employment_type, net_income, equity_amount, age?, schufa_ok? }
 *   - financing: { loan_amount, ltv_percent, fixed_rate_years, purpose }
 *   - preferences?: { regional_only?, kfw_eligible?, tilgungssonderzahlung? }
 */

serve(async (req) => {
  if (req.method === "OPTIONS") return handleCorsPreflightRequest(req);
  const cors = getCorsHeaders(req);

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const { property, client, financing, preferences } = await req.json();

    if (!property || !financing) {
      return new Response(JSON.stringify({ error: "Objekt- und Finanzierungsdaten erforderlich" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const ltvPercent = financing.ltv_percent ||
      (financing.loan_amount && property.price ? ((financing.loan_amount / property.price) * 100).toFixed(1) : "unbekannt");

    const systemPrompt = `Du bist ein erfahrener deutscher Finanzierungsberater mit Marktkenntnissen über Banken, Sparkassen und Bausparkassen.

Basierend auf dem Kundenprofil und der Objektsituation empfiehlst du die 5 am besten passenden Finanzierungspartner.

BEWERTUNGSKRITERIEN:
1. Objektart-Eignung (Kapitalanlage vs. Eigennutzung, Gewerbe)
2. Beleihungsauslauf (BLW) — Konservative Banken < 80%, Direktbanken bis 110%
3. Einkommensart — Selbständige vs. Angestellte (manche Banken lehnen < 3 Jahre ab)
4. Regionale Stärke — Sparkassen/VR-Banken regional, Großbanken überregional
5. KfW-Kombination — Welche Banken arbeiten gut mit KfW zusammen?
6. Sondertilgungswünsche — Manche Banken bieten kostenlos bis 10% p.a.

WICHTIGE DEUTSCHE BANKLANDSCHAFT:
- Großbanken: Deutsche Bank, Commerzbank, HypoVereinsbank (UniCredit)
- Sparkassen: Regionale Sparkassen (S-Gruppe)
- Genossenschaftsbanken: Volksbanken, Raiffeisenbanken (VR-Gruppe)
- Direktbanken: ING, DKB, Interhyp-Vermittlung
- Bausparkassen: Schwäbisch Hall, BHW, Wüstenrot, LBS
- Spezialbanken: DSL Bank, PSD Banken, MünchenerHyp
- Förderbanken: KfW, L-Bank (BW), NRW.BANK, ISB (RLP)

Antworte NUR via tool_call.`;

    const userPrompt = `Empfehle Finanzierungspartner für folgendes Szenario:

OBJEKT:
- Typ: ${property.type || "Eigentumswohnung"}
- Kaufpreis: ${property.price?.toLocaleString("de-DE") || "unbekannt"} EUR
- Stadt/Region: ${property.city || "unbekannt"}
- Baujahr: ${property.year_built || "unbekannt"}
- Fläche: ${property.area_sqm || "unbekannt"} qm
- Einheiten: ${property.units_count || 1}

KUNDE:
- Beschäftigung: ${client?.employment_type || "angestellt"}
- Nettoeinkommen: ${client?.net_income?.toLocaleString("de-DE") || "unbekannt"} EUR/Monat
- Eigenkapital: ${client?.equity_amount?.toLocaleString("de-DE") || "unbekannt"} EUR
- SCHUFA ok: ${client?.schufa_ok !== false ? "ja" : "nein"}

FINANZIERUNG:
- Darlehenssumme: ${financing.loan_amount?.toLocaleString("de-DE") || "unbekannt"} EUR
- Beleihungsauslauf: ${ltvPercent}%
- Zinsbindung: ${financing.fixed_rate_years || 10} Jahre
- Verwendung: ${financing.purpose || "Kapitalanlage"}

PRÄFERENZEN:
- Nur regional: ${preferences?.regional_only ? "ja" : "nein"}
- KfW-fähig: ${preferences?.kfw_eligible ? "ja" : "egal"}
- Sondertilgung gewünscht: ${preferences?.tilgungssonderzahlung ? "ja" : "egal"}`;

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
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "bank_matching_result",
            description: "Top-5 Bankempfehlungen mit Begründung",
            parameters: {
              type: "object",
              properties: {
                recommendations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      rank: { type: "number" },
                      bankName: { type: "string" },
                      bankType: { type: "string", enum: ["grossbank", "sparkasse", "genossenschaft", "direktbank", "bausparkasse", "spezialbank", "foerderbank"] },
                      matchScore: { type: "number", description: "0-100 Passgenauigkeit" },
                      strengths: { type: "array", items: { type: "string" } },
                      weaknesses: { type: "array", items: { type: "string" } },
                      reasoning: { type: "string" },
                      estimatedRateRange: { type: "string", description: "z.B. '3.2% - 3.5% p.a.'" },
                      specialFeatures: { type: "array", items: { type: "string" } },
                    },
                    required: ["rank", "bankName", "bankType", "matchScore", "strengths", "reasoning"],
                    additionalProperties: false,
                  },
                },
                financingTips: {
                  type: "array",
                  items: { type: "string" },
                  description: "Allgemeine Tipps für diese Finanzierungskonstellation",
                },
                kfwPrograms: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      programNumber: { type: "string" },
                      name: { type: "string" },
                      relevance: { type: "string" },
                    },
                    required: ["programNumber", "name"],
                    additionalProperties: false,
                  },
                  description: "Relevante KfW-Programme",
                },
                disclaimer: { type: "string" },
              },
              required: ["recommendations", "disclaimer"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "bank_matching_result" } },
        temperature: 0.3,
        max_tokens: 12000,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit erreicht" }), {
          status: 429, headers: { ...cors, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Kontingent erschöpft" }), {
          status: 402, headers: { ...cors, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Bank-Matching fehlgeschlagen" }), {
        status: 500, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(result), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      recommendations: [],
      disclaimer: "Keine strukturierte Analyse verfügbar.",
    }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Bank matching error:", error);
    const message = error instanceof Error ? error.message : "Unbekannter Fehler";
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
