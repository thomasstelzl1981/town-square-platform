import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * sot-excel-ai-import
 * --------------------
 * Receives an Excel file (base64) and uses Lovable AI to extract structured property data.
 * Returns an array of property rows mapped to our schema with confidence indicators.
 */

interface PropertyRow {
  code: string;
  art: string;
  adresse: string;
  ort: string;
  plz: string;
  qm: number | null;
  kaltmiete: number | null;
  mieter: string | null;
  mieterSeit: string | null;
  mieterhoehung: string | null;
  kaufpreis: number | null;
  restschuld: number | null;
  zinssatz: number | null;
  tilgung: number | null;
  bank: string | null;
  confidence: number; // 0-1
  notes: string | null; // AI notes about extraction quality
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { excelBase64, fileName } = await req.json();

    if (!excelBase64) {
      return new Response(
        JSON.stringify({ success: false, error: "excelBase64 is required" }),
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

    console.log(`[sot-excel-ai-import] Processing file: ${fileName || "unknown"}`);

    // System prompt for extraction
    const systemPrompt = `Du bist ein Datenextraktions-Experte für Immobiliendaten. 
Du erhältst Excel-Rohdaten (als Text/Tabelle) und extrahierst strukturierte Immobiliendaten.

WICHTIG:
- Erkenne automatisch Header-Zeilen (auch wenn sie nicht in Zeile 1 sind)
- Mappe Spalten intelligent auf unser Schema (z.B. "Straße / Hausnummer" → adresse, "Postleitzahl" → plz)
- Parse deutsche Zahlenformate (1.234,56 € → 1234.56)
- Parse deutsche Datumsformate (01.03.2022 → 2022-03-01)
- Ignoriere Summenzeilen, Leerzeilen, Dokumentationszeilen
- Jede Datenzeile = 1 Einheit (Wohnung). Gruppiere nach Objekt-Code.

Output-Schema pro Zeile:
{
  "code": "ZL002",           // Objekt-ID/Code
  "art": "MFH",              // Immobilienart
  "adresse": "Parkweg 17",   // Straße + Hausnummer
  "ort": "Straubing",        // Stadt
  "plz": "94315",            // Postleitzahl
  "qm": 199.79,              // Fläche in m²
  "kaltmiete": 2300,         // Monatliche Kaltmiete in €
  "mieter": "PaZi GmbH",     // Mietername
  "mieterSeit": "2021-09-01",// Mietbeginn (ISO)
  "mieterhoehung": "12/1/24",// Nächste Mieterhöhung
  "kaufpreis": 620000,       // Kaufpreis in €
  "restschuld": 580582.99,   // Aktuelle Restschuld in €
  "zinssatz": 1.5,           // Zinssatz in %
  "tilgung": null,           // Tilgungsrate in %
  "bank": "Sparkasse Deggendorf",
  "confidence": 0.95,        // Wie sicher bist du (0-1)?
  "notes": null              // Optional: Hinweise zu Problemen
}

Antworte NUR mit einem JSON-Array. Keine Erklärungen.`;

    // Call Lovable AI with tool calling for structured output
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
            content: `Bitte extrahiere alle Immobiliendaten aus dieser Excel-Datei (Base64-kodiert, Dateiname: ${fileName || "unbekannt"}).

Die Datei ist Base64-kodiert. Dekodiere sie und analysiere den Inhalt.

Base64-Daten:
${excelBase64.substring(0, 50000)}${excelBase64.length > 50000 ? "... (truncated)" : ""}

Falls du die Base64-Daten nicht direkt lesen kannst, hier ist eine Zusammenfassung der erwarteten Struktur:
- Typische Spalten: Code/Objekt, Art, Postleitzahl, Ort, Straße/Hausnummer, BJ, Grundbuch, Größe, Nutzung, Einnahmen, Kaufpreis, Verkehrswert, Darlehen, Restschuld, Zins, Bank, Rate, Mieter, Warmmiete, NK, Mieter seit, Mieterhöhung, Energieträger, Heizart
- Deutsche Zahlenformate mit Punkten als Tausendertrennzeichen und Kommas als Dezimaltrennzeichen
- Mehrere Zeilen pro Objekt möglich (= verschiedene Einheiten)

Extrahiere alle Datenzeilen und gib sie als JSON-Array zurück.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_properties",
              description: "Extract structured property data from Excel content",
              parameters: {
                type: "object",
                properties: {
                  properties: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        code: { type: "string", description: "Property code like ZL002" },
                        art: { type: "string", description: "Property type like MFH, DHH, ETW" },
                        adresse: { type: "string", description: "Street and house number" },
                        ort: { type: "string", description: "City name" },
                        plz: { type: "string", description: "Postal code" },
                        qm: { type: "number", nullable: true, description: "Area in sqm" },
                        kaltmiete: { type: "number", nullable: true, description: "Monthly cold rent in EUR" },
                        mieter: { type: "string", nullable: true, description: "Tenant name" },
                        mieterSeit: { type: "string", nullable: true, description: "Lease start date ISO" },
                        mieterhoehung: { type: "string", nullable: true, description: "Next rent increase" },
                        kaufpreis: { type: "number", nullable: true, description: "Purchase price in EUR" },
                        restschuld: { type: "number", nullable: true, description: "Current loan balance in EUR" },
                        zinssatz: { type: "number", nullable: true, description: "Interest rate in percent" },
                        tilgung: { type: "number", nullable: true, description: "Amortization rate in percent" },
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
    let extractedData: { properties: PropertyRow[]; summary: Record<string, unknown> } | null = null;

    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        extractedData = JSON.parse(toolCall.function.arguments);
      } catch (parseError) {
        console.error("Failed to parse tool call arguments:", parseError);
      }
    }

    // Fallback: try to parse from content if tool calling didn't work
    if (!extractedData) {
      const content = aiResult.choices?.[0]?.message?.content;
      if (content) {
        try {
          // Try to extract JSON from content
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            const properties = JSON.parse(jsonMatch[0]);
            extractedData = {
              properties,
              summary: {
                totalRows: properties.length,
                uniqueProperties: new Set(properties.map((p: PropertyRow) => p.code)).size,
                avgConfidence: properties.reduce((sum: number, p: PropertyRow) => sum + (p.confidence || 0.5), 0) / properties.length,
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
          debug: { aiResponse: aiResult },
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[sot-excel-ai-import] Extracted ${extractedData.properties.length} rows`);

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
