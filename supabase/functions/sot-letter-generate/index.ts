/// <reference lib="deno.ns" />

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface LetterRequest {
  recipient: {
    name: string;
    company?: string;
    salutation?: string;
  };
  subject: string;
  prompt: string;
  senderIdentity?: {
    name: string;
    company: string;
    address?: string;
    role?: string;
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

    const senderSignature = senderIdentity
      ? [
          '',
          senderIdentity.name,
          senderIdentity.role || undefined,
          senderIdentity.company,
        ].filter(Boolean).join('\n')
      : '';

    const systemPrompt = `Du bist Armstrong, ein professioneller Briefassistent für deutsche Immobilienverwaltung.
Du schreibst AUSSCHLIESSLICH den Briefkörper — KEIN Datum, KEINE Adresse, KEINEN Betreff.

Strikte Ausgabestruktur:
1. Anrede (z.B. "Sehr geehrter Herr Müller,")
2. Fließtext in logischen Absätzen (keine Bulletpoints, keine Markdown-Formatierung)
3. Grußformel ("Mit freundlichen Grüßen")
4. Signaturblock:
${senderSignature || '   [Name]\n   [Rolle]\n   [Organisation]'}

Regeln:
- Sie-Form, formeller Ton, professionell aber freundlich
- Keine Platzhalter wie [Datum] oder [Adresse]
- 150–300 Wörter Fließtext
- Reiner Text, KEINE Markdown-Überschriften, KEINE Emojis
- KEIN "Betreff:" im Text`;

    const salutationHint = recipient.salutation
      ? `Anrede: ${recipient.salutation === 'Herr' ? 'Sehr geehrter Herr' : recipient.salutation === 'Frau' ? 'Sehr geehrte Frau' : 'Sehr geehrte/r'} ${recipient.name.split(' ').pop()}`
      : '';

    const userPrompt = `Erstelle einen formellen Geschäftsbrief mit folgenden Angaben:

Empfänger: ${recipient.name}${recipient.company ? ` (${recipient.company})` : ''}
${salutationHint ? salutationHint + '\n' : ''}Betreff: ${subject || 'Nicht angegeben'}

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
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
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
