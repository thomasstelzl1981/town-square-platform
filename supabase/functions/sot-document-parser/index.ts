import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * SOT Document Parser
 * 
 * Uses Lovable AI (Gemini 3 Flash) to parse uploaded documents
 * and extract structured data for Armstrong AI access.
 * 
 * Supports: Excel, CSV, PDF, Images
 * 
 * Input:
 *   - content: base64 encoded file OR text content
 *   - contentType: MIME type
 *   - filename: Original filename
 *   - tenantId: For tracking usage
 * 
 * Output:
 *   - success: boolean
 *   - parsed: Structured JSON with properties, contacts, financing, etc.
 *   - engine: "lovable_ai"
 *   - confidence: 0-1 score
 */

interface ParseRequest {
  content: string;
  contentType: string;
  filename: string;
  tenantId?: string;
  parseMode?: "properties" | "contacts" | "financing" | "general";
}

interface ParsedProperty {
  code?: string;
  property_type?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  purchase_price?: number;
  market_value?: number;
  units?: Array<{
    unit_number?: string;
    area_sqm?: number;
    monthly_rent?: number;
    tenant_name?: string;
  }>;
}

interface ParseResult {
  version: string;
  engine: string;
  model: string;
  parsed_at: string;
  confidence: number;
  warnings: string[];
  data: {
    properties?: ParsedProperty[];
    contacts?: Array<{
      first_name?: string;
      last_name?: string;
      email?: string;
      phone?: string;
      company?: string;
    }>;
    financing?: Array<{
      bank?: string;
      current_balance?: number;
      interest_rate?: number;
      monthly_payment?: number;
    }>;
    raw_text?: string;
    detected_type?: string;
  };
}

function getSystemPrompt(parseMode: string): string {
  const basePrompt = `Du bist ein spezialisierter Dokumenten-Parser für Immobiliendaten. 
Analysiere das bereitgestellte Dokument und extrahiere strukturierte Daten.

WICHTIG:
- Alle Zahlen als Number (nicht String)
- Preise in Euro (ohne Währungssymbol)
- Flächen in m² (nur Zahl)
- Leere Felder weglassen
- Bei Unsicherheit: confidence reduzieren und warning hinzufügen`;

  const modeInstructions: Record<string, string> = {
    properties: `
Fokus: Immobiliendaten extrahieren
Felder: code, property_type (apartment/house/multi_family/commercial), address, city, postal_code, 
        purchase_price, market_value, construction_year, living_area_sqm, plot_area_sqm
Units: unit_number, area_sqm, rooms, monthly_rent, tenant_name, lease_start`,
    
    contacts: `
Fokus: Kontaktdaten extrahieren
Felder: first_name, last_name, email, phone, company, role, address`,
    
    financing: `
Fokus: Finanzierungsdaten extrahieren
Felder: bank, loan_amount, current_balance, interest_rate, monthly_payment, term_years, start_date`,
    
    general: `
Fokus: Alle relevanten Daten extrahieren
Erkenne automatisch: Immobilien, Kontakte, Finanzierungen, Dokument-Typ`
  };

  return `${basePrompt}
${modeInstructions[parseMode] || modeInstructions.general}

Antworte NUR mit validem JSON im folgenden Format:
{
  "confidence": 0.0-1.0,
  "warnings": ["optional warnings"],
  "detected_type": "portfolio|contract|invoice|letter|other",
  "data": {
    "properties": [...],
    "contacts": [...],
    "financing": [...]
  }
}`;
}

function buildUserPrompt(filename: string, contentType: string, content: string): string {
  const isBase64 = content.length > 1000 && !content.includes("\n");
  
  if (contentType.includes("image") || contentType.includes("pdf")) {
    return `Analysiere dieses Dokument: ${filename}

[Bilddaten als Base64 - bitte visuell analysieren]`;
  }
  
  // For text-based content (CSV, Excel-extracted text)
  return `Analysiere dieses Dokument: ${filename}

Inhalt:
${content.substring(0, 50000)}`; // Limit to 50k chars
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { content, contentType, filename, tenantId, parseMode = "general" }: ParseRequest = await req.json();

    if (!content || !filename) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: content, filename" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[sot-document-parser] Parsing: ${filename} (${contentType})`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build messages for Lovable AI
    const systemPrompt = getSystemPrompt(parseMode);
    const userPrompt = buildUserPrompt(filename, contentType, content);

    // Determine if we should use vision (for images/PDFs)
    const useVision = contentType.includes("image") || contentType.includes("pdf");
    
    let messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }>;
    
    if (useVision && content.startsWith("data:")) {
      // Image with data URL
      messages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: `Analysiere dieses Dokument: ${filename}` },
            { type: "image_url", image_url: { url: content } }
          ]
        }
      ];
    } else if (useVision) {
      // Base64 image without data URL prefix
      const mimeType = contentType || "image/png";
      messages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: `Analysiere dieses Dokument: ${filename}` },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${content}` } }
          ]
        }
      ];
    } else {
      // Text-based content
      messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ];
    }

    // Call Lovable AI Gateway
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        temperature: 0.1, // Low temperature for structured extraction
        max_tokens: 8000,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("[sot-document-parser] AI Gateway error:", aiResponse.status, errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const aiContent = aiResult.choices?.[0]?.message?.content || "";

    console.log("[sot-document-parser] AI response received, parsing JSON...");

    // Parse AI response (might be wrapped in markdown code blocks)
    let parsedData: { confidence: number; warnings: string[]; detected_type: string; data: Record<string, unknown> };
    try {
      // Remove markdown code blocks if present
      let jsonStr = aiContent;
      if (jsonStr.includes("```json")) {
        jsonStr = jsonStr.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      } else if (jsonStr.includes("```")) {
        jsonStr = jsonStr.replace(/```\n?/g, "");
      }
      parsedData = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("[sot-document-parser] Failed to parse AI response as JSON:", aiContent);
      // Return raw text if JSON parsing fails
      parsedData = {
        confidence: 0.3,
        warnings: ["Konnte keine strukturierten Daten extrahieren"],
        detected_type: "other",
        data: { raw_text: aiContent }
      };
    }

    // Build final result
    const result: ParseResult = {
      version: "1.0",
      engine: "lovable_ai",
      model: "google/gemini-3-flash-preview",
      parsed_at: new Date().toISOString(),
      confidence: parsedData.confidence || 0.5,
      warnings: parsedData.warnings || [],
      data: {
        ...parsedData.data,
        detected_type: parsedData.detected_type || "other"
      }
    };

    // Track usage if tenantId provided
    if (tenantId) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        const now = new Date();
        const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
        const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];

        await supabase.rpc("increment_lovable_ai_usage", {
          p_tenant_id: tenantId,
          p_period_start: periodStart,
          p_period_end: periodEnd,
          p_calls: 1,
          p_tokens: aiResult.usage?.total_tokens || 0
        });

        console.log(`[sot-document-parser] Usage tracked for tenant ${tenantId}`);
      } catch (usageError) {
        console.error("[sot-document-parser] Failed to track usage:", usageError);
        // Don't fail the request if usage tracking fails
      }
    }

    console.log(`[sot-document-parser] Successfully parsed ${filename}, confidence: ${result.confidence}`);

    return new Response(
      JSON.stringify({
        success: true,
        parsed: result,
        filename,
        contentType
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[sot-document-parser] Error:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});