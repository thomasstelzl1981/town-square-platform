import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * sot-excel-ai-import
 * --------------------
 * Receives pre-parsed Excel data (headers + rows from SheetJS) and uses Lovable AI
 * to intelligently map arbitrary column structures to our property schema.
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

    const systemPrompt = `Du bist ein Datenextraktions-Experte für Immobiliendaten.
Du erhältst eine Tabelle mit Immobiliendaten aus einer Excel-Datei und extrahierst strukturierte Daten.

WICHTIG:
- Erkenne automatisch die Bedeutung der Spalten (z.B. "Grundstück (Ort/Straße)" → adresse + ort + plz)
- Parse zusammengesetzte Felder: "Asternweg 1, 84508 Burgkirchen" → adresse="Asternweg 1", plz="84508", ort="Burgkirchen"
- Parse "Wohnen MFH 6 Einheiten" → art="MFH", nutzung="Wohnen", einheiten=6
- Parse deutsche Zahlenformate: "1.294.020" → 1294020, "55.000" → 55000
- Parse Euro-Beträge: entferne € und Tausenderpunkte
- Ignoriere Summenzeilen, Leerzeilen, Überschriften
- "Mieteinnahmen p.a." → kaltmiete = Wert / 12 (monatlich)
- "Annuität p.a." → annuitaet = Wert / 12 (monatlich) 
- "Baujahr" → baujahr
- "Belastung Grundbuch" oder "Darlehensschuld" → restschuld
- "Verkehrswert" → marktwert
- "qm-Preis" → qmPreis
- "Zinsfestschreibung" → zinsfestschreibungBis (Datum)
- "Überschuss/Fehlbetrag" → ueberschuss (Jahreswert)
- "Tilgung/Monat" → tilgungMonat
- Vergib jedem Objekt einen Code (z.B. "OBJ-001", "OBJ-002" etc.) wenn keiner vorhanden ist
- Wenn ein Objekt mehrere Einheiten hat, erstelle EINE Zeile pro Objekt (nicht pro Einheit)`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Bitte extrahiere alle Immobiliendaten aus dieser Tabelle.\n\nDateiname: ${fileName || "unbekannt"}\n\nTabelle:\n${tableText}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_properties",
              description: "Extract structured property data from table content",
              parameters: {
                type: "object",
                properties: {
                  properties: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        code: { type: "string", description: "Property code like OBJ-001" },
                        art: { type: "string", description: "Property type like MFH, DHH, ETW" },
                        adresse: { type: "string", description: "Street and house number" },
                        ort: { type: "string", description: "City name" },
                        plz: { type: "string", description: "Postal code" },
                        nutzung: { type: "string", nullable: true, description: "Usage type: Wohnen, Gewerbe, Gemischt" },
                        qm: { type: "number", nullable: true, description: "Total area in sqm" },
                        einheiten: { type: "number", nullable: true, description: "Number of units" },
                        baujahr: { type: "number", nullable: true, description: "Year built" },
                        kaltmiete: { type: "number", nullable: true, description: "Monthly cold rent in EUR" },
                        jahresmiete: { type: "number", nullable: true, description: "Annual rental income in EUR" },
                        marktwert: { type: "number", nullable: true, description: "Market value / Verkehrswert in EUR" },
                        kaufpreis: { type: "number", nullable: true, description: "Purchase price in EUR" },
                        restschuld: { type: "number", nullable: true, description: "Current loan balance in EUR" },
                        annuitaetMonat: { type: "number", nullable: true, description: "Monthly annuity payment in EUR" },
                        tilgungMonat: { type: "number", nullable: true, description: "Monthly repayment in EUR" },
                        zinsfestschreibungBis: { type: "string", nullable: true, description: "Interest rate fixed until (ISO date or text)" },
                        ueberschussJahr: { type: "number", nullable: true, description: "Annual surplus/deficit in EUR" },
                        bank: { type: "string", nullable: true, description: "Lender bank name" },
                        confidence: { type: "number", description: "Extraction confidence 0-1" },
                        notes: { type: "string", nullable: true, description: "Extraction notes or issues" },
                      },
                      required: ["code", "art", "adresse", "ort", "plz", "confidence"],
                    },
                  },
                  summary: {
                    type: "object",
                    properties: {
                      totalRows: { type: "number" },
                      uniqueProperties: { type: "number" },
                      avgConfidence: { type: "number" },
                      issues: { type: "array", items: { type: "string" } },
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
