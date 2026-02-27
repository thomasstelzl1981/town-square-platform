import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { offer_id, file_path, file_name, service_case_id } = await req.json();
    
    if (!offer_id || !file_path) {
      return new Response(JSON.stringify({ error: "offer_id and file_path required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("tenant-documents")
      .download(file_path);

    if (downloadError || !fileData) {
      console.error("Download error:", downloadError);
      return new Response(JSON.stringify({ error: "File download failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Convert file to base64 for AI
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const mimeType = file_name?.endsWith(".pdf") ? "application/pdf" 
      : file_name?.endsWith(".xlsx") || file_name?.endsWith(".xls") ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      : "image/jpeg";

    // Call Lovable AI to extract offer data
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        max_tokens: 8000,
        messages: [
          {
            role: "system",
            content: `Du bist ein Experte für die Analyse von Handwerker-Angeboten. Extrahiere strukturierte Daten aus dem Dokument.`
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64}` }
              },
              {
                type: "text",
                text: `Analysiere dieses Angebot und extrahiere die folgenden Informationen. Antworte NUR mit dem JSON-Objekt, ohne Markdown-Formatierung.

{
  "provider_name": "Name des Anbieters/Unternehmens",
  "provider_email": "E-Mail falls vorhanden oder null",
  "total_net": Gesamtsumme netto in Cent (z.B. 150000 für 1500,00€) oder null,
  "total_gross": Gesamtsumme brutto in Cent oder null,
  "positions": [
    {
      "description": "Beschreibung der Position",
      "quantity": Menge als Zahl oder null,
      "unit": "Einheit (Stk, m², h, etc.)" oder null,
      "unit_price": Einzelpreis in Cent oder null,
      "total": Positionspreis in Cent oder null
    }
  ],
  "conditions": "Zahlungsbedingungen, Gewährleistung etc. oder null",
  "valid_until": "YYYY-MM-DD falls angegeben oder null"
}`
              }
            ]
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errText);
      return new Response(JSON.stringify({ error: "AI extraction failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    
    // Parse AI response - strip markdown code fences if present
    let extracted;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      extracted = JSON.parse(cleaned);
    } catch (e) {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "Failed to parse AI response", raw: content }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update the offer record
    const { error: updateError } = await supabase
      .from("service_case_offers")
      .update({
        provider_name: extracted.provider_name || null,
        provider_email: extracted.provider_email || null,
        total_net: extracted.total_net || null,
        total_gross: extracted.total_gross || null,
        offer_amount_net: extracted.total_net || null,
        offer_amount_gross: extracted.total_gross || null,
        positions: extracted.positions || [],
        conditions: extracted.conditions || null,
        valid_until: extracted.valid_until || null,
        extracted_at: new Date().toISOString(),
      })
      .eq("id", offer_id);

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(JSON.stringify({ error: "Failed to save extracted data" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, extracted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
