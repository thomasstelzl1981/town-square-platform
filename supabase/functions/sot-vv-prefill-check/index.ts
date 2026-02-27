import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const body = await req.json();
    const { propertyName, address, city, postalCode, areaSqm, yearBuilt, purchasePrice, income, costs, afa, financing } = body;

    const systemPrompt = `Du bist ein erfahrener deutscher Steuerberater-Assistent, spezialisiert auf Anlage V (Vermietung und Verpachtung). 
Deine Aufgabe: Pruefe die automatisch aggregierten Daten einer Mietimmobilie auf Plausibilitaet und gib strukturiertes Feedback.

Pruefe folgende Aspekte:
1. Ist die Kaltmiete plausibel fuer Lage, Groesse und Baujahr?
2. Stimmt das Verhaeltnis NK-Vorauszahlung zu tatsaechlichen NK-Kosten?
3. Sind die Schuldzinsen plausibel fuer den Kaufpreis / Darlehensbetrag?
4. Fehlen offensichtliche Kostenpositionen (z.B. Verwaltungskosten bei WEG, Versicherungen)?
5. Ist die AfA-Rate korrekt fuer das Baujahr (2% fuer Gebaeude ab 1925, 2.5% fuer Gebaeude vor 1925, 3% fuer Neubauten ab 2023)?
6. Gibt es auffaellige Werte (z.B. 0 EUR bei Positionen die normalerweise > 0 sein sollten)?

Antworte NUR auf Deutsch. Sei praeise und praxisnah.`;

    const userPrompt = `Pruefe diese V+V-Daten fuer die Steuererklaerung:

**Objekt:** ${propertyName}
**Adresse:** ${address}, ${postalCode} ${city}
**Flaeche:** ${areaSqm || 'unbekannt'} qm
**Baujahr:** ${yearBuilt || 'unbekannt'}
**Kaufpreis:** ${purchasePrice?.toLocaleString('de-DE')} EUR

**Einnahmen:**
- Kaltmiete p.a.: ${income?.coldRentAnnual?.toLocaleString('de-DE')} EUR
- NK-Vorauszahlungen p.a.: ${income?.nkAdvanceAnnual?.toLocaleString('de-DE')} EUR
- NK-Nachzahlungen: ${income?.nkNachzahlung?.toLocaleString('de-DE')} EUR

**Kosten (automatisch):**
- Schuldzinsen p.a.: ${financing?.loanInterestAnnual?.toLocaleString('de-DE')} EUR
- Grundsteuer: ${costs?.grundsteuer?.toLocaleString('de-DE')} EUR
- Nicht umlagefaehige NK: ${costs?.nonRecoverableCosts?.toLocaleString('de-DE')} EUR

**AfA:**
- Gebaeudeanteil: ${afa?.buildingSharePercent}%
- AfA-Satz: ${afa?.afaRatePercent}%
- AfA-Beginn: ${afa?.afaStartDate || 'nicht gesetzt'}

Bitte pruefe die Plausibilitaet und gib Feedback.`;

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
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "plausibility_result",
              description: "Strukturiertes Plausibilitaets-Ergebnis fuer V+V Steuerdaten",
              parameters: {
                type: "object",
                properties: {
                  warnings: {
                    type: "array",
                    description: "Warnungen bei potenziell falschen Werten",
                    items: {
                      type: "object",
                      properties: {
                        field: { type: "string", description: "Betroffenes Feld (z.B. coldRentAnnual, loanInterest)" },
                        message: { type: "string", description: "Klare Warnung auf Deutsch" },
                        severity: { type: "string", enum: ["high", "medium", "low"] },
                      },
                      required: ["field", "message", "severity"],
                      additionalProperties: false,
                    },
                  },
                  suggestions: {
                    type: "array",
                    description: "Verbesserungsvorschlaege",
                    items: {
                      type: "object",
                      properties: {
                        field: { type: "string", description: "Betroffenes Feld" },
                        message: { type: "string", description: "Vorschlag auf Deutsch" },
                        suggestedValue: { type: "number", description: "Vorgeschlagener Wert (optional)" },
                      },
                      required: ["field", "message"],
                      additionalProperties: false,
                    },
                  },
                  missingItems: {
                    type: "array",
                    description: "Fehlende Kostenpositionen die typischerweise vorhanden sein sollten",
                    items: {
                      type: "object",
                      properties: {
                        field: { type: "string", description: "Fehlendes Feld" },
                        message: { type: "string", description: "Hinweis auf Deutsch" },
                      },
                      required: ["field", "message"],
                      additionalProperties: false,
                    },
                  },
                  overallAssessment: {
                    type: "string",
                    description: "Kurze Gesamtbewertung (1-2 Saetze)",
                  },
                },
                required: ["warnings", "suggestions", "missingItems", "overallAssessment"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "plausibility_result" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit erreicht. Bitte versuchen Sie es in einer Minute erneut." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Kontingent erschoepft. Bitte laden Sie Credits nach." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "KI-Pruefung fehlgeschlagen" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: return content as-is
    const content = aiResult.choices?.[0]?.message?.content || "";
    return new Response(JSON.stringify({
      warnings: [],
      suggestions: [],
      missingItems: [],
      overallAssessment: content || "Keine strukturierte Auswertung verfuegbar.",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sot-vv-prefill-check error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unbekannter Fehler" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
