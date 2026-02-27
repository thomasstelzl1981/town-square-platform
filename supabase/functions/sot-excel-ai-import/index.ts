import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * sot-excel-ai-import
 * --------------------
 * Deep AI analysis of Excel property portfolios.
 * Uses Gemini 2.5 Pro for maximum accuracy on financial data.
 * 
 * Input:  { headers: string[], rows: (string|number|null)[][], fileName?: string }
 * Output: { success: true, data: PropertyRow[], summary: {...} }
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { headers, rows, fileName } = await req.json();

    if (!headers || !rows || rows.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "headers and rows are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "AI gateway not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[sot-excel-ai-import] Processing ${rows.length} rows from: ${fileName || "unknown"}`);

    // Build a readable text table from headers + rows
    const headerLine = headers.join(" | ");
    const dataLines = rows.map((row: (string | number | null)[]) =>
      row.map((cell: string | number | null) => cell ?? "").join(" | ")
    );
    const tableText = [headerLine, "-".repeat(headerLine.length), ...dataLines].join("\n");

    const systemPrompt = `Du bist ein Senior-Immobilienanalyst und Datenextraktions-Experte.
Du erhältst eine Tabelle mit Immobiliendaten aus einer Excel-Datei und MUSST jede einzelne Zahl korrekt verstehen und zuordnen.

DEINE AUFGABE:
1. Lies die gesamte Tabelle Zeile für Zeile
2. Verstehe die Bedeutung JEDER Spalte — auch wenn die Spaltennamen ungewöhnlich oder abgekürzt sind
3. Extrahiere ALLE finanziellen Kennzahlen: Kaufpreise, Marktwerte, Mieteinnahmen, Darlehen, Tilgungen
4. Ordne jede Zahl dem richtigen Feld zu — Genauigkeit ist wichtiger als Geschwindigkeit

REGELN FÜR ADRESS-PARSING:
- Zusammengesetzte Felder aufteilen: "Asternweg 1, 84508 Burgkirchen" → adresse="Asternweg 1", plz="84508", ort="Burgkirchen"
- "PLZ Ort" Spalte: "84508 Burgkirchen" → plz="84508", ort="Burgkirchen"
- Wenn nur Straße+Nr ohne PLZ/Ort: setze plz und ort auf null

REGELN FÜR ZAHLEN-PARSING:
- Deutsche Zahlenformate: "1.294.020" → 1294020 (Punkte sind Tausendertrenner)
- "55.000,00" → 55000 (Komma ist Dezimaltrenner)
- Euro-Beträge: "1.294.020 €" → 1294020
- Prozentsätze: "2,5%" → 2.5
- ACHTUNG: "55.000" könnte 55000 ODER 55.0 sein — prüfe den Kontext (Immobilienpreise sind >1000, qm sind <10000)

REGELN FÜR OBJEKT-ERKENNUNG:
- "Wohnen MFH 6 Einheiten" → art="MFH", nutzung="Wohnen", einheiten=6
- "ETW" → art="ETW", nutzung="Wohnen", einheiten=1
- "MFH" ohne Einheitenangabe → prüfe ob es eine Spalte mit Einheiten gibt
- "Gewerbe" → nutzung="Gewerbe"
- "Gemischt" → nutzung="Gemischt"

REGELN FÜR FINANZIELLE ZUORDNUNG:
- "Mieteinnahmen p.a." oder "Jahresnettokaltmiete" → jahresmiete (Jahreswert!)
- "Kaltmiete/Monat" → kaltmiete (Monatswert!)
- WICHTIG: Wenn die Spalte "p.a." enthält, ist es ein JAHRESWERT → jahresmiete
- "Annuität p.a." → annuitaetMonat = Wert / 12
- "Annuität/Monat" → annuitaetMonat (direkt)
- "Tilgung/Monat" → tilgungMonat
- "Restschuld" oder "Belastung Grundbuch" oder "Darlehensschuld" → restschuld
- "Verkehrswert" oder "Marktwert" → marktwert
- "Kaufpreis" oder "Anschaffungskosten" → kaufpreis
- ACHTUNG: kaufpreis und marktwert sind VERSCHIEDENE Felder! Nicht vermischen!
- "Zinsfestschreibung" oder "Zinsbindung bis" → zinsfestschreibungBis
- "Überschuss" oder "Cashflow" → ueberschussJahr
- "Bank" oder "Kreditgeber" oder "Darlehensgeber" → bank

REGELN FÜR IGNORIERTE ZEILEN:
- Summenzeilen (enthalten "Summe", "Gesamt", "Total")
- Leerzeilen
- Überschriftenzeilen (keine Zahlen in den Datenspalten)

QUALITÄTSKONTROLLE:
- Prüfe bei jedem Objekt: Ist jahresmiete > kaltmiete * 12? → Dann ist etwas falsch
- Prüfe: Ist marktwert > 0? → Sonst Confidence senken
- Prüfe: Ist adresse vorhanden? → Pflichtfeld, sonst Confidence < 0.5
- Setze confidence: 0.95 wenn alle Felder plausibel, 0.7 wenn Schätzungen nötig, 0.4 wenn unsicher
- Bei JEDEM Objekt mit notes erklären, wenn etwas unklar war

VERGIB jedem Objekt einen Code (z.B. "OBJ-001") wenn keiner in der Tabelle vorhanden ist.
Wenn ein Objekt mehrere Einheiten hat, erstelle EINE Zeile pro Objekt (nicht pro Einheit).`;

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
          {
            role: "user",
            content: `Analysiere diese Immobilien-Tabelle sorgfältig. Nimm dir Zeit für jede Zeile und jede Zahl.\n\nDateiname: ${fileName || "unbekannt"}\nAnzahl Datenzeilen: ${rows.length}\nAnzahl Spalten: ${headers.length}\nSpaltenköpfe: ${headers.join(", ")}\n\nVollständige Tabelle:\n${tableText}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_properties",
              description: "Extract ALL structured property data from the table. Include every financial figure you can find.",
              parameters: {
                type: "object",
                properties: {
                  properties: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        code: { type: "string", description: "Property code like OBJ-001" },
                        art: { type: "string", description: "Property type: MFH, DHH, ETW, RH, EFH, Gewerbe" },
                        adresse: { type: "string", description: "Street and house number only" },
                        ort: { type: "string", description: "City name only" },
                        plz: { type: "string", description: "5-digit postal code" },
                        nutzung: { type: "string", nullable: true, description: "Usage: Wohnen, Gewerbe, Gemischt" },
                        qm: { type: "number", nullable: true, description: "Total area in sqm" },
                        einheiten: { type: "number", nullable: true, description: "Number of units (1 for ETW/EFH)" },
                        baujahr: { type: "number", nullable: true, description: "Year built (4-digit)" },
                        kaltmiete: { type: "number", nullable: true, description: "Monthly cold rent in EUR (not annual!)" },
                        jahresmiete: { type: "number", nullable: true, description: "Annual rental income in EUR (not monthly!)" },
                        marktwert: { type: "number", nullable: true, description: "Current market value / Verkehrswert in EUR" },
                        kaufpreis: { type: "number", nullable: true, description: "Original purchase price in EUR (different from marktwert!)" },
                        restschuld: { type: "number", nullable: true, description: "Outstanding loan balance in EUR" },
                        annuitaetMonat: { type: "number", nullable: true, description: "Monthly annuity (loan payment) in EUR" },
                        tilgungMonat: { type: "number", nullable: true, description: "Monthly principal repayment in EUR" },
                        zinsfestschreibungBis: { type: "string", nullable: true, description: "Fixed interest period end date (ISO or DD.MM.YYYY)" },
                        ueberschussJahr: { type: "number", nullable: true, description: "Annual cashflow surplus/deficit in EUR" },
                        bank: { type: "string", nullable: true, description: "Lending bank name" },
                        confidence: { type: "number", description: "Extraction confidence 0.0-1.0 (be honest!)" },
                        notes: { type: "string", nullable: true, description: "Important notes: what was unclear, what you estimated, what might be wrong" },
                      },
                      required: ["code", "art", "adresse", "ort", "plz", "confidence"],
                    },
                  },
                  summary: {
                    type: "object",
                    properties: {
                      totalRows: { type: "number", description: "Total data rows in the table" },
                      uniqueProperties: { type: "number", description: "Number of distinct properties extracted" },
                      avgConfidence: { type: "number", description: "Average confidence across all properties" },
                      totalPortfolioValue: { type: "number", nullable: true, description: "Sum of all market values" },
                      totalAnnualIncome: { type: "number", nullable: true, description: "Sum of all annual rental incomes" },
                      totalDebt: { type: "number", nullable: true, description: "Sum of all outstanding loan balances" },
                      issues: {
                        type: "array",
                        items: { type: "string" },
                        description: "List of issues, warnings, and observations about the data quality"
                      },
                    },
                  },
                },
                required: ["properties", "summary"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_properties" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "Rate limit erreicht. Bitte später erneut versuchen." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "KI-Guthaben aufgebraucht. Bitte Workspace aufladen." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: "AI extraction failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResult = await response.json();
    console.log("[sot-excel-ai-import] AI response received");

    // Parse tool call result
    let extractedData: { properties: unknown[]; summary: Record<string, unknown> } | null = null;

    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        extractedData = JSON.parse(toolCall.function.arguments);
      } catch (parseError) {
        console.error("Failed to parse tool call arguments:", parseError);
      }
    }

    // Fallback: try to parse from content
    if (!extractedData) {
      const content = aiResult.choices?.[0]?.message?.content;
      if (content) {
        try {
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const properties = JSON.parse(jsonMatch[0]);
            extractedData = {
              properties,
              summary: {
                totalRows: properties.length,
                uniqueProperties: new Set(properties.map((p: Record<string, unknown>) => p.code)).size,
                avgConfidence: properties.reduce((sum: number, p: Record<string, unknown>) => sum + ((p.confidence as number) || 0.5), 0) / properties.length,
                issues: [],
              },
            };
          }
        } catch (fallbackError) {
          console.error("Fallback parsing failed:", fallbackError);
        }
      }
    }

    if (!extractedData || !extractedData.properties || extractedData.properties.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Keine Immobiliendaten erkannt. Bitte prüfen Sie das Dateiformat.",
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[sot-excel-ai-import] Extracted ${extractedData.properties.length} properties`);

    return new Response(
      JSON.stringify({
        success: true,
        data: extractedData.properties,
        summary: extractedData.summary,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[sot-excel-ai-import] Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
