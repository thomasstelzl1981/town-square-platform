import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { freeText, clientName, steeringParams } = await req.json();
    if (!freeText || typeof freeText !== "string") {
      return new Response(JSON.stringify({ error: "freeText is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // ── Build steering block from structured params ──
    const steeringLines: string[] = [];
    if (steeringParams) {
      if (steeringParams.region) steeringLines.push(`Suchgebiet: ${steeringParams.region}`);
      if (steeringParams.assetFocus?.length) steeringLines.push(`Asset-Fokus: ${steeringParams.assetFocus.join(', ')}`);
      if (steeringParams.priceMin || steeringParams.priceMax) {
        const fmtPrice = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)} Mio. EUR` : `${(n / 1_000).toFixed(0)} Tsd. EUR`;
        const parts = [];
        if (steeringParams.priceMin) parts.push(`ab ${fmtPrice(steeringParams.priceMin)}`);
        if (steeringParams.priceMax) parts.push(`bis ${fmtPrice(steeringParams.priceMax)}`);
        steeringLines.push(`Investitionsrahmen: ${parts.join(' – ')}`);
      }
      if (steeringParams.yieldTarget) steeringLines.push(`Zielrendite: ${steeringParams.yieldTarget}%`);
      if (steeringParams.exclusions) steeringLines.push(`Ausschlüsse: ${steeringParams.exclusions}`);
    }
    if (clientName) steeringLines.push(`Mandantenname: ${clientName}`);

    const steeringBlock = steeringLines.length > 0
      ? `\n\n═══ VERBINDLICHE LEITPARAMETER (überschreiben ggf. widersprüchliche Angaben im Freitext) ═══\n${steeringLines.join('\n')}\n═══ ENDE LEITPARAMETER ═══`
      : '';

    const systemPrompt = `Du bist ein Senior-Immobilienberater mit über 20 Jahren Erfahrung in der gewerblichen Immobilien-Akquise in Deutschland. Du erstellst professionelle Ankaufsprofile für institutionelle und semi-professionelle Investoren.

AUFGABE:
Analysiere den folgenden Freitext (und ggf. die VERBINDLICHEN LEITPARAMETER) und extrahiere ein strukturiertes Ankaufsprofil. Die LEITPARAMETER haben Vorrang vor widersprüchlichen Angaben im Freitext.

REGELN FÜR profile_text_long:
- Verfasse einen professionellen Fließtext (4-6 Sätze), der als Akquise-Anschreiben an Makler und Bestandshalter geeignet ist.
- Verwende gehobene Maklersprache, keine Aufzählungen, keine Bulletpoints.
- Nenne konkret: Investitionsvolumen, Zielregion, Asset-Klassen, Renditeerwartung und ggf. Ausschlüsse.
- Der Text muss sofort einsatzbereit sein — kein Platzhalter, keine Lücken.

QUALITÄTSBEISPIEL für profile_text_long:
"Im Auftrag eines familiengeführten Investmenthauses suchen wir Wohn- und Geschäftshäuser sowie Mehrfamilienhäuser im Großraum München mit einem Investitionsvolumen von 2,0 bis 8,0 Mio. EUR. Der Fokus liegt auf Bestandsobjekten mit einer nachhaltigen Anfangsrendite ab 4,0 % und Wertsteigerungspotenzial durch moderate Repositionierung. Bevorzugt werden gepflegte Objekte in etablierten Wohnlagen mit guter ÖPNV-Anbindung. Denkmalgeschützte Objekte sowie Erbbaurechtsgrundstücke sind ausgeschlossen. Wir freuen uns über die Zusendung von Exposés und stehen für eine kurzfristige Prüfung und Besichtigung zur Verfügung."

Antworte NUR mit dem Tool-Call, keine zusätzliche Erklärung.`;

    const userMessage = freeText + steeringBlock;

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
          { role: "user", content: userMessage },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_acquisition_profile",
              description: "Extract structured acquisition profile data from free-text description.",
              parameters: {
                type: "object",
                properties: {
                  client_name: {
                    type: "string",
                    description: "Name des Mandanten/Investors, z.B. 'Müller Family Office'. Leer lassen wenn nicht erkennbar.",
                  },
                  region: {
                    type: "string",
                    description: "Suchgebiet/Region als Freitext, z.B. 'Rhein-Main, Frankfurt, Wiesbaden'",
                  },
                  asset_focus: {
                    type: "array",
                    items: {
                      type: "string",
                      enum: ["MFH", "ETW", "EFH", "ZFH", "WGH", "GEW", "BUERO", "HANDEL", "LAGER", "HOTEL", "GRUNDSTUECK", "PORTFOLIO"],
                    },
                    description: "Asset-Typen die gesucht werden",
                  },
                  price_min: {
                    type: "number",
                    description: "Mindestpreis in EUR (z.B. 2000000 für 2 Mio). null wenn nicht angegeben.",
                  },
                  price_max: {
                    type: "number",
                    description: "Maximalpreis in EUR (z.B. 5000000 für 5 Mio). null wenn nicht angegeben.",
                  },
                  yield_target: {
                    type: "number",
                    description: "Zielrendite in Prozent (z.B. 4.5 für 4,5%). null wenn nicht angegeben.",
                  },
                  exclusions: {
                    type: "string",
                    description: "Ausschlüsse als Freitext, z.B. 'kein Denkmalschutz, keine Erbbau'. Leer wenn keine.",
                  },
                  notes: {
                    type: "string",
                    description: "Zusätzliche Hinweise die nicht in andere Felder passen.",
                  },
                  profile_text_long: {
                    type: "string",
                    description: "Professioneller Fließtext (4-6 Sätze) als fertiges Akquise-Anschreiben in gehobener Maklersprache. Muss Investitionsvolumen, Region, Asset-Klassen und Renditeerwartung konkret benennen. Sofort einsatzbereit für Makler-Kommunikation.",
                  },
                },
                required: ["asset_focus", "profile_text_long"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_acquisition_profile" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit erreicht, bitte versuchen Sie es später erneut." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "KI-Guthaben aufgebraucht." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "KI-Analyse fehlgeschlagen" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "KI konnte kein Profil extrahieren" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const profile = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ profile }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("profile-extract error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
