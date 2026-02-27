import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId } = await req.json();
    if (!projectId) {
      return new Response(JSON.stringify({ error: "projectId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Load project record
    const { data: project, error: projErr } = await supabase
      .from("dev_projects")
      .select("intake_data, name, city, postal_code, address, total_units_count")
      .eq("id", projectId)
      .single();

    if (projErr || !project) {
      throw new Error(`Project not found: ${projErr?.message}`);
    }

    // 2. Find expose PDF path from intake_data
    const intakeData = project.intake_data as Record<string, any> | null;
    const exposePath =
      intakeData?.files?.expose ||
      intakeData?.files?.expose_path ||
      intakeData?.expose_storage_path;

    if (!exposePath) {
      return new Response(
        JSON.stringify({ error: "Kein Exposé-PDF im Projekt hinterlegt. Bitte zuerst ein Exposé hochladen." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Download PDF from storage
    const { data: pdfBlob, error: dlErr } = await supabase.storage
      .from("tenant-documents")
      .download(exposePath);

    if (dlErr || !pdfBlob) {
      throw new Error(`PDF download failed: ${dlErr?.message}`);
    }

    // 4. Convert to base64
    const arrayBuffer = await pdfBlob.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );

    // 5. Build prompt
    const projectContext = [
      project.name && `Projektname: ${project.name}`,
      project.address && `Adresse: ${project.address}`,
      project.postal_code && project.city && `PLZ/Ort: ${project.postal_code} ${project.city}`,
      project.total_units_count && `Wohneinheiten: ${project.total_units_count}`,
    ]
      .filter(Boolean)
      .join("\n");

    const systemPrompt = `Du bist ein erfahrener Immobilien-Texter, der professionelle Objektbeschreibungen für Kapitalanleger erstellt.

KONTEXT zum Projekt:
${projectContext}

AUFGABE: Analysiere das beigefügte Exposé-PDF und erstelle zwei Texte:

1. OBJEKTBESCHREIBUNG (150-250 Wörter, 3 Absätze):
   - Absatz 1: Objektzusammenfassung (Typ, Lage, Eckdaten) — 2-3 Sätze
   - Absatz 2: Ausstattung, Zustand, Modernisierungen — 3-4 Sätze
   - Absatz 3: Investitionscharakter, Zielgruppe, Renditeaspekte — 3-4 Sätze

2. LAGEBESCHREIBUNG (100-150 Wörter, 2 Absätze):
   - Absatz 1: Makrolage (Stadt, Region, Einwohnerzahl, Charakter)
   - Absatz 2: Mikrolage (Entfernungen zu ÖPNV, Einkaufen, Schulen, Autobahn)

STIL:
- Professionell, sachlich-ansprechend
- Keine Superlative oder Werbefloskeln
- Für Kapitalanleger optimiert
- Konkrete Zahlen und Fakten verwenden
- Absätze durch Leerzeilen trennen`;

    // 6. Call Lovable AI Gateway with PDF
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:application/pdf;base64,${base64}` },
              },
              {
                type: "text",
                text: "Bitte analysiere dieses Exposé und erstelle die Objektbeschreibung und Lagebeschreibung wie im System-Prompt beschrieben. Antworte im folgenden Format:\n\n---OBJEKTBESCHREIBUNG---\n[Text]\n\n---LAGEBESCHREIBUNG---\n[Text]",
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_descriptions",
              description: "Return the generated descriptions",
              parameters: {
                type: "object",
                properties: {
                  description: {
                    type: "string",
                    description: "Objektbeschreibung, 150-250 Wörter, 3 Absätze getrennt durch Leerzeilen",
                  },
                  location_description: {
                    type: "string",
                    description: "Lagebeschreibung, 100-150 Wörter, 2 Absätze getrennt durch Leerzeilen",
                  },
                },
                required: ["description", "location_description"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_descriptions" } },
      }),
    });

    if (!aiResponse.ok) {
      const statusCode = aiResponse.status;
      if (statusCode === 429) {
        return new Response(
          JSON.stringify({ error: "Rate-Limit erreicht. Bitte in einer Minute erneut versuchen." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (statusCode === 402) {
        return new Response(
          JSON.stringify({ error: "KI-Credits aufgebraucht. Bitte Credits aufladen." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", statusCode, errText);
      throw new Error(`AI gateway error: ${statusCode}`);
    }

    const aiData = await aiResponse.json();

    // Extract from tool call response
    let description = "";
    let locationDescription = "";

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const args = JSON.parse(toolCall.function.arguments);
      description = args.description || "";
      locationDescription = args.location_description || "";
    } else {
      // Fallback: parse from content
      const content = aiData.choices?.[0]?.message?.content || "";
      const objMatch = content.match(/---OBJEKTBESCHREIBUNG---\s*([\s\S]*?)(?:---LAGEBESCHREIBUNG---|$)/);
      const lageMatch = content.match(/---LAGEBESCHREIBUNG---\s*([\s\S]*?)$/);
      description = objMatch?.[1]?.trim() || content;
      locationDescription = lageMatch?.[1]?.trim() || "";
    }

    if (!description) {
      throw new Error("KI hat keine Beschreibung generiert");
    }

    // Return descriptions WITHOUT saving — user decides in UI
    return new Response(
      JSON.stringify({
        description,
        location_description: locationDescription,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("sot-project-description error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unbekannter Fehler" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
