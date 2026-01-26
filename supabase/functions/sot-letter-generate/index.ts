/// <reference lib="deno.ns" />

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LetterRequest {
  recipient: {
    name: string;
    company?: string;
  };
  subject: string;
  prompt: string;
  senderIdentity?: {
    name: string;
    company: string;
    address?: string;
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recipient, subject, prompt, senderIdentity }: LetterRequest = await req.json();

    if (!recipient?.name || !prompt) {
      return new Response(
        JSON.stringify({ error: "Empfänger und Anliegen sind erforderlich" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "AI Gateway nicht konfiguriert" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `Du bist Armstrong, ein professioneller Briefassistent für deutsche Immobilienverwaltung.
Deine Aufgabe ist es, formelle, CI-konforme Geschäftsbriefe auf Deutsch zu erstellen.

Regeln:
- Verwende immer die Sie-Form und formelle Anrede
- Strukturiere den Brief klar: Anrede, Einleitung, Hauptteil, Schluss, Grußformel
- Halte den Ton professionell aber freundlich
- Füge keine Platzhalter wie [Datum] oder [Adresse] ein - der Brief soll direkt verwendbar sein
- Der Brief sollte zwischen 150-300 Wörtern lang sein

${senderIdentity ? `Absender-Identität:
Name: ${senderIdentity.name}
Firma: ${senderIdentity.company}
${senderIdentity.address ? `Adresse: ${senderIdentity.address}` : ''}` : ''}`;

    const userPrompt = `Erstelle einen formellen Geschäftsbrief mit folgenden Angaben:

Empfänger: ${recipient.name}${recipient.company ? ` (${recipient.company})` : ''}
Betreff: ${subject || 'Nicht angegeben'}

Anliegen des Nutzers:
${prompt}

Schreibe NUR den Brieftext (ohne Briefkopf/Datum/Adressblock). Beginne direkt mit der Anrede.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", errorText);
      return new Response(
        JSON.stringify({ error: "Fehler bei der Brief-Generierung" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const generatedBody = data.choices?.[0]?.message?.content || "";

    return new Response(
      JSON.stringify({ 
        body: generatedBody,
        model: data.model,
        usage: data.usage,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Letter generation error:", error);
    const message = error instanceof Error ? error.message : "Unbekannter Fehler";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
