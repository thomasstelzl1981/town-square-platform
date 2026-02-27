import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * SOT V+V Steuer-Advisor — Runde 2 Upgrade
 * 
 * Actions:
 *   POST { ...propertyData }                      — Standard Plausibilitätsprüfung
 *   POST { action: "tax-optimize", ...data }      — §35a, 3-Jahres-Regel, Anlage-V-Entwurf
 *   POST { action: "year-compare", ...data }      — Vorjahresvergleich
 */

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const body = await req.json();
    const action = body.action || "plausibility";

    // ═══════════════════════════════════════════════════════════
    // ACTION: tax-optimize — Steueroptimierung
    // ═══════════════════════════════════════════════════════════
    if (action === "tax-optimize") {
      const { properties, taxYear, totalIncome } = body;

      const optimizePrompt = `Du bist ein erfahrener deutscher Steuerberater-Assistent für Immobilien (Anlage V).
Analysiere die folgenden Objekte für das Steuerjahr ${taxYear || "2025"} und gib konkrete Optimierungsvorschläge.

GESAMTEINKOMMEN (für Grenzsteuersatz): ${totalIncome?.toLocaleString("de-DE") || "unbekannt"} EUR

OBJEKTE:
${JSON.stringify(properties || [], null, 2)}

PRÜFE SYSTEMATISCH:
1. §35a EStG: Handwerkerkosten (20% absetzbar, max 1.200€) — welche NK-Positionen qualifizieren sich?
2. 3-Jahres-Regel (§6 Abs.1 Nr.1a EStG): Sind Instandhaltungskosten > 15% des Gebäudewerts in den ersten 3 Jahren nach Kauf? → anschaffungsnaher Herstellungsaufwand!
3. Erhaltungsaufwand vs. Herstellung: Können größere Maßnahmen auf 2-5 Jahre verteilt werden (§82b EStDV)?
4. Leerstandszeiten: Ist Vermietungsabsicht dokumentiert? (wichtig für Werbungskostenabzug)
5. AfA-Optimierung: Sonderabschreibung §7b möglich? Denkmalschutz §7i?
6. Verlustverrechnung: §15b EStG Risiken bei Verlustzuweisungsmodellen
7. Grundsteuer: Korrekt als Werbungskosten angesetzt?
8. Fahrtkosten: Fahrten zum Mietobjekt (30ct/km) erfasst?

WICHTIG: Du bist KEIN Steuerberater-Ersatz. Kennzeichne alle Vorschläge als "Prüfungshinweis für den Steuerberater".`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: [
            { role: "system", content: "Du bist ein spezialisierter V+V-Steuer-Advisor. Antworte NUR via tool_call." },
            { role: "user", content: optimizePrompt },
          ],
          tools: [{
            type: "function",
            function: {
              name: "tax_optimization_result",
              description: "Strukturierte Steueroptimierungsvorschläge",
              parameters: {
                type: "object",
                properties: {
                  marginalTaxRate: { type: "number", description: "Geschätzter Grenzsteuersatz in %" },
                  totalSavingsPotential: { type: "number", description: "Geschätztes Einsparpotenzial in EUR" },
                  optimizations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        category: { type: "string", enum: ["§35a", "erhaltungsaufwand", "afa", "leerstand", "verlust", "fahrtkosten", "sonstiges"] },
                        title: { type: "string" },
                        description: { type: "string" },
                        savingsEstimate: { type: "number", description: "Geschätzte Ersparnis in EUR" },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                        actionRequired: { type: "string", description: "Was muss der Nutzer/Steuerberater tun?" },
                        legalBasis: { type: "string", description: "Gesetzliche Grundlage" },
                      },
                      required: ["category", "title", "description", "priority", "actionRequired"],
                      additionalProperties: false,
                    },
                  },
                  risks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        severity: { type: "string", enum: ["high", "medium", "low"] },
                        legalBasis: { type: "string" },
                      },
                      required: ["title", "description", "severity"],
                      additionalProperties: false,
                    },
                  },
                  anlageVDraft: {
                    type: "object",
                    description: "Vorausgefüllter Anlage-V-Entwurf",
                    properties: {
                      zeile7_mieteinnahmen: { type: "number" },
                      zeile8_umlagen: { type: "number" },
                      zeile9_erstattungen: { type: "number" },
                      zeile33_afa: { type: "number" },
                      zeile37_schuldzinsen: { type: "number" },
                      zeile38_grundsteuer: { type: "number" },
                      zeile39_versicherungen: { type: "number" },
                      zeile40_verwaltung: { type: "number" },
                      zeile42_erhaltung: { type: "number" },
                      zeile46_sonstige: { type: "number" },
                      ergebnis: { type: "number", description: "Einkünfte aus V+V" },
                    },
                    additionalProperties: false,
                  },
                  disclaimer: { type: "string" },
                },
                required: ["optimizations", "risks", "disclaimer"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "tax_optimization_result" } },
          temperature: 0.2,
          max_tokens: 16000,
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit erreicht." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "Kontingent erschoepft." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const t = await response.text();
        console.error("AI gateway error:", response.status, t);
        return new Response(JSON.stringify({ error: "Steuer-KI fehlgeschlagen" }), {
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

      return new Response(JSON.stringify({
        optimizations: [],
        risks: [],
        disclaimer: "Keine strukturierte Analyse verfügbar.",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ═══════════════════════════════════════════════════════════
    // ACTION: year-compare — Vorjahresvergleich
    // ═══════════════════════════════════════════════════════════
    if (action === "year-compare") {
      const { currentYear, previousYear, propertyName } = body;

      const comparePrompt = `Vergleiche die V+V-Daten für "${propertyName || "Objekt"}" zwischen ${previousYear?.taxYear || "Vorjahr"} und ${currentYear?.taxYear || "Aktuell"}.

VORJAHR:
${JSON.stringify(previousYear || {}, null, 2)}

AKTUELLES JAHR:
${JSON.stringify(currentYear || {}, null, 2)}

Identifiziere signifikante Abweichungen (>15%) und bewerte deren Plausibilität.`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: [
            { role: "system", content: "Du bist ein V+V-Steuerexperte für Vorjahresvergleiche. Antworte NUR via tool_call." },
            { role: "user", content: comparePrompt },
          ],
          tools: [{
            type: "function",
            function: {
              name: "year_comparison_result",
              description: "Strukturierter Vorjahresvergleich",
              parameters: {
                type: "object",
                properties: {
                  deviations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        field: { type: "string" },
                        previousValue: { type: "number" },
                        currentValue: { type: "number" },
                        changePercent: { type: "number" },
                        plausible: { type: "boolean" },
                        explanation: { type: "string" },
                      },
                      required: ["field", "changePercent", "plausible", "explanation"],
                      additionalProperties: false,
                    },
                  },
                  overallAssessment: { type: "string" },
                  actionItems: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
                required: ["deviations", "overallAssessment"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "year_comparison_result" } },
          temperature: 0.2,
          max_tokens: 8000,
        }),
      });

      if (!response.ok) {
        const t = await response.text();
        console.error("AI gateway error:", response.status, t);
        return new Response(JSON.stringify({ error: "Vergleich fehlgeschlagen" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const aiResult = await response.json();
      const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        return new Response(JSON.stringify(JSON.parse(toolCall.function.arguments)), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        deviations: [],
        overallAssessment: "Keine strukturierte Analyse verfügbar.",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ═══════════════════════════════════════════════════════════
    // ACTION: year-end-summary — Multi-Property Jahresabschluss
    // ═══════════════════════════════════════════════════════════
    if (action === "year-end-summary") {
      const { properties, taxYear, ownerName } = body;

      const summaryPrompt = `Du bist ein Steuerberater-Assistent für Immobilien-Portfolios.
Erstelle einen Jahresabschluss-Bericht für ${ownerName || "den Vermieter"} für das Steuerjahr ${taxYear || "2025"}.

PORTFOLIO (${(properties || []).length} Objekte):
${JSON.stringify(properties || [], null, 2)}

AUFGABEN:
1. Zusammenfassung: Gesamteinnahmen, Gesamtausgaben, Gesamt-Einkünfte aus V+V
2. Verlustverrechnung: Können Verluste zwischen Objekten verrechnet werden? §15b EStG Risiken?
3. Optimierungspotenziale: Über alle Objekte hinweg (z.B. gemeinsame Handwerkerkosten)
4. Checkliste Steuerberater: Was muss der Steuerberater noch prüfen?
5. WICHTIG: Kein Steuerberatungsersatz — nur Vorbereitung`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro",
          messages: [
            { role: "system", content: "Du bist ein Steuerberater-Assistent für V+V-Portfolios. Antworte NUR via tool_call." },
            { role: "user", content: summaryPrompt },
          ],
          tools: [{
            type: "function",
            function: {
              name: "year_end_summary_result",
              description: "Strukturierter Jahresabschluss für V+V-Portfolio",
              parameters: {
                type: "object",
                properties: {
                  summary: {
                    type: "object",
                    properties: {
                      totalIncome: { type: "number" },
                      totalExpenses: { type: "number" },
                      totalResult: { type: "number" },
                      propertiesWithProfit: { type: "number" },
                      propertiesWithLoss: { type: "number" },
                    },
                    required: ["totalIncome", "totalExpenses", "totalResult"],
                    additionalProperties: false,
                  },
                  perPropertyResults: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        propertyName: { type: "string" },
                        income: { type: "number" },
                        expenses: { type: "number" },
                        result: { type: "number" },
                        notes: { type: "string" },
                      },
                      required: ["propertyName", "result"],
                      additionalProperties: false,
                    },
                  },
                  crossPropertyOptimizations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        savingsEstimate: { type: "number" },
                        priority: { type: "string", enum: ["high", "medium", "low"] },
                      },
                      required: ["title", "description", "priority"],
                      additionalProperties: false,
                    },
                  },
                  risks: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        severity: { type: "string", enum: ["high", "medium", "low"] },
                        legalBasis: { type: "string" },
                      },
                      required: ["title", "description", "severity"],
                      additionalProperties: false,
                    },
                  },
                  steuerberaterChecklist: {
                    type: "array",
                    items: { type: "string" },
                  },
                  disclaimer: { type: "string" },
                },
                required: ["summary", "perPropertyResults", "disclaimer"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "year_end_summary_result" } },
          temperature: 0.2,
          max_tokens: 16000,
        }),
      });

      if (!response.ok) {
        const t = await response.text();
        console.error("AI gateway error:", response.status, t);
        return new Response(JSON.stringify({ error: "Jahresabschluss fehlgeschlagen" }), {
          status: response.status === 429 ? 429 : response.status === 402 ? 402 : 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const aiResult = await response.json();
      const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        return new Response(JSON.stringify(JSON.parse(toolCall.function.arguments)), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ summary: {}, perPropertyResults: [], disclaimer: "Keine Analyse verfügbar." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ═══════════════════════════════════════════════════════════
    // DEFAULT: Standard Plausibilitätsprüfung (existing logic)
    // ═══════════════════════════════════════════════════════════
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
                    items: {
                      type: "object",
                      properties: {
                        field: { type: "string" },
                        message: { type: "string" },
                        severity: { type: "string", enum: ["high", "medium", "low"] },
                      },
                      required: ["field", "message", "severity"],
                      additionalProperties: false,
                    },
                  },
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        field: { type: "string" },
                        message: { type: "string" },
                        suggestedValue: { type: "number" },
                      },
                      required: ["field", "message"],
                      additionalProperties: false,
                    },
                  },
                  missingItems: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        field: { type: "string" },
                        message: { type: "string" },
                      },
                      required: ["field", "message"],
                      additionalProperties: false,
                    },
                  },
                  overallAssessment: { type: "string" },
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
