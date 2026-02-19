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
 * Supports TWO input modes:
 *   A) storagePath + bucket  — Downloads from Storage, supports files up to 20MB
 *   B) content (base64)      — Legacy inline mode, limited by request body size
 * 
 * Supports: Excel, CSV, PDF, Images
 */

/** Chunked Base64 conversion — safe for large files */
function uint8ToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

interface ParseRequest {
  // Mode A: Storage-based (preferred for large files)
  storagePath?: string;
  bucket?: string;         // defaults to 'tenant-documents'
  // Mode B: Inline base64 (legacy, for small files / Armstrong chat)
  content?: string;
  // Common
  contentType?: string;
  filename: string;
  tenantId?: string;
  documentId?: string;
  parseMode?: "properties" | "contacts" | "financing" | "general";
}

const MAX_AI_FILE_SIZE = 20 * 1024 * 1024; // 20MB

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: ParseRequest = await req.json();
    const { storagePath, bucket, content, contentType, filename, tenantId, documentId, parseMode = "general" } = body;

    if (!filename) {
      return new Response(
        JSON.stringify({ error: "Missing required field: filename" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!storagePath && !content) {
      return new Response(
        JSON.stringify({ error: "Either storagePath or content must be provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[sot-document-parser] Parsing: ${filename} (mode: ${storagePath ? 'storage' : 'inline'}, parseMode: ${parseMode})`);

    // ── Resolve file content ─────────────────────────────────────────────
    let resolvedContent: string;
    let resolvedContentType = contentType || "application/pdf";

    if (storagePath) {
      // Mode A: Download from Storage
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const targetBucket = bucket || "tenant-documents";
      console.log(`[sot-document-parser] Downloading from ${targetBucket}/${storagePath}`);

      const { data: fileData, error: dlError } = await supabase.storage
        .from(targetBucket)
        .download(storagePath);

      if (dlError || !fileData) {
        console.error("[sot-document-parser] Storage download error:", dlError);
        return new Response(
          JSON.stringify({ error: `File download failed: ${dlError?.message || 'Unknown'}` }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (fileData.size > MAX_AI_FILE_SIZE) {
        return new Response(
          JSON.stringify({ error: `File too large: ${(fileData.size / 1024 / 1024).toFixed(1)}MB (max ${MAX_AI_FILE_SIZE / 1024 / 1024}MB)` }),
          { status: 413, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Detect content type from filename if not provided
      if (!contentType) {
        const ext = filename.toLowerCase().split('.').pop();
        const mimeMap: Record<string, string> = {
          pdf: "application/pdf",
          jpg: "image/jpeg", jpeg: "image/jpeg",
          png: "image/png", webp: "image/webp",
          doc: "application/msword",
          docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          xls: "application/vnd.ms-excel",
          xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          csv: "text/csv",
        };
        resolvedContentType = mimeMap[ext || ''] || "application/octet-stream";
      }

      const buffer = await fileData.arrayBuffer();
      resolvedContent = uint8ToBase64(new Uint8Array(buffer));
      console.log(`[sot-document-parser] Downloaded ${(fileData.size / 1024).toFixed(0)}KB`);
    } else {
      // Mode B: Inline content (legacy)
      resolvedContent = content!;
    }

    // ── Call AI Gateway ──────────────────────────────────────────────────
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const systemPrompt = getSystemPrompt(parseMode);
    const useVision = resolvedContentType.includes("image") || resolvedContentType.includes("pdf");
    
    let messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }>;
    
    if (useVision) {
      // Ensure proper data URL
      let dataUrl: string;
      if (resolvedContent.startsWith("data:")) {
        dataUrl = resolvedContent;
      } else {
        dataUrl = `data:${resolvedContentType};base64,${resolvedContent}`;
      }

      messages = [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: `Analysiere dieses Dokument: ${filename}` },
            { type: "image_url", image_url: { url: dataUrl } }
          ]
        }
      ];
    } else {
      // Text-based content (CSV, Excel)
      let textContent: string;
      try {
        textContent = atob(resolvedContent);
      } catch {
        textContent = resolvedContent;
      }

      messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analysiere dieses Dokument: ${filename}\n\nInhalt:\n${textContent.substring(0, 50000)}` }
      ];
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        temperature: 0.1,
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
          JSON.stringify({ error: "Payment required." }),
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

    // Parse AI response
    let parsedData: { confidence: number; warnings: string[]; detected_type: string; data: Record<string, unknown> };
    try {
      let jsonStr = aiContent;
      if (jsonStr.includes("```json")) {
        jsonStr = jsonStr.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      } else if (jsonStr.includes("```")) {
        jsonStr = jsonStr.replace(/```\n?/g, "");
      }
      parsedData = JSON.parse(jsonStr.trim());
    } catch {
      console.error("[sot-document-parser] Failed to parse AI response as JSON:", aiContent.substring(0, 500));
      parsedData = {
        confidence: 0.3,
        warnings: ["Konnte keine strukturierten Daten extrahieren"],
        detected_type: "other",
        data: { raw_text: aiContent }
      };
    }

    const result = {
      version: "1.1",
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

    // Track usage
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
      } catch (usageError) {
        console.error("[sot-document-parser] Failed to track usage:", usageError);
      }
    }

    console.log(`[sot-document-parser] Successfully parsed ${filename}, confidence: ${result.confidence}`);

    return new Response(
      JSON.stringify({ success: true, parsed: result, filename, contentType: resolvedContentType }),
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
