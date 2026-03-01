import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * sot-phone-converse — Twilio Gather Callback for AI conversation loop
 *
 * 1. Receives SpeechResult from Twilio <Gather>
 * 2. Loads conversation context from DB
 * 3. Calls LLM for response
 * 4. Stores turn in DB
 * 5. Returns TwiML: <Say> response + <Gather> for next turn
 *    OR <Say> goodbye + <Hangup> if conversation should end
 */

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev";
const MAX_TURNS = 20;
const GOODBYE_PATTERNS = /tsch[uü]ss|auf wiedersehen|bye|danke.*das war|ich bin fertig|das wäre alles|ende/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const formData = await req.formData();
    const callSid = formData.get("CallSid") as string;
    const speechResult = formData.get("SpeechResult") as string;
    const confidence = formData.get("Confidence") as string;

    if (!callSid) {
      return twimlResponse(
        "<Say voice='Polly.Marlene' language='de-DE'>Ein Fehler ist aufgetreten.</Say><Hangup/>"
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Load session + assistant config
    const { data: session } = await supabase
      .from("commpro_phone_call_sessions")
      .select("*, commpro_phone_assistants!inner(*)")
      .eq("twilio_call_sid", callSid)
      .maybeSingle();

    if (!session) {
      console.error("No session for CallSid:", callSid);
      return twimlResponse(
        "<Say voice='Polly.Marlene' language='de-DE'>Entschuldigung, ich kann das Gespräch nicht fortsetzen.</Say><Hangup/>"
      );
    }

    const assistant = (session as any).commpro_phone_assistants;
    const turns: Array<{ role: string; content: string }> = (session.conversation_turns as any[]) || [];
    const match = (session.match as Record<string, any>) || {};
    const rules = assistant.rules || {};
    const maxCallSeconds = rules.max_call_seconds || 120;

    // 2. Check for goodbye or max turns
    const isGoodbye = speechResult && GOODBYE_PATTERNS.test(speechResult);
    const turnLimitReached = turns.length >= MAX_TURNS * 2;

    // Check call duration
    const callStart = new Date(session.started_at).getTime();
    const elapsed = (Date.now() - callStart) / 1000;
    const timeUp = elapsed > maxCallSeconds;

    if (!speechResult || isGoodbye || turnLimitReached || timeUp) {
      // End conversation gracefully
      const farewellMsg = isGoodbye
        ? "Vielen Dank für Ihren Anruf. Ich wünsche Ihnen einen schönen Tag. Auf Wiederhören!"
        : timeUp
          ? "Wir haben leider die maximale Gesprächszeit erreicht. Vielen Dank für Ihren Anruf. Auf Wiederhören!"
          : "Vielen Dank für Ihren Anruf. Auf Wiederhören!";

      // Build full transcript for postcall
      const fullTranscript = turns
        .map((t) => `${t.role === "user" ? "Anrufer" : "Assistent"}: ${t.content}`)
        .join("\n");

      await supabase
        .from("commpro_phone_call_sessions")
        .update({
          transcript_text: fullTranscript,
          conversation_turns: turns,
        })
        .eq("id", session.id);

      return twimlResponse(
        `<Say voice="Polly.Marlene" language="de-DE">${escapeXml(farewellMsg)}</Say><Hangup/>`
      );
    }

    // 3. Add user turn
    turns.push({ role: "user", content: speechResult });

    // 4. Build LLM messages
    const behaviorPrompt = assistant.behavior_prompt ||
      "Du bist ein freundlicher und professioneller Telefonassistent. Beantworte Fragen kurz und präzise.";

    const contactInfo = match.contact_name
      ? `Der Anrufer ist ${match.contact_name}.`
      : `Der Anrufer hat die Nummer ${session.from_number_e164}.`;

    const systemPrompt = `${behaviorPrompt}

Kontext: ${contactInfo}
Assistent-Name: ${assistant.display_name || "KI-Assistent"}
${assistant.documentation?.knowledge_base ? `Wissensbasis:\n${assistant.documentation.knowledge_base}` : ""}

WICHTIGE REGELN:
- Antworte auf Deutsch, kurz und natürlich (max 2-3 Sätze pro Antwort)
- Du wirst am Telefon vorgelesen (TTS), formuliere daher klar und ohne Sonderzeichen
- Keine Markdown, keine Aufzählungszeichen, keine URLs
- Wenn du eine Frage nicht beantworten kannst, sage es ehrlich und biete an, eine Nachricht weiterzuleiten
${rules.collect_name ? "- Frage nach dem Namen des Anrufers falls unbekannt" : ""}
${rules.collect_reason ? "- Frage nach dem Anliegen des Anrufers" : ""}`;

    const llmMessages = [
      { role: "system", content: systemPrompt },
      ...turns.map((t) => ({ role: t.role === "user" ? "user" : "assistant", content: t.content })),
    ];

    // 5. Call LLM
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    let aiResponse = "Entschuldigung, ich hatte kurz einen Aussetzer. Könnten Sie das bitte wiederholen?";

    if (LOVABLE_API_KEY) {
      try {
        const aiRes = await fetch(`${AI_GATEWAY_URL}/v1/chat/completions`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            max_tokens: 300,
            messages: llmMessages,
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const content = aiData.choices?.[0]?.message?.content;
          if (content) {
            // Clean response for TTS: strip markdown, special chars
            aiResponse = content
              .replace(/[*_#`~\[\]()]/g, "")
              .replace(/\n+/g, " ")
              .trim();
          }
        } else {
          console.error("AI gateway error:", aiRes.status, await aiRes.text());
        }
      } catch (aiErr) {
        console.error("LLM call failed:", aiErr);
      }
    }

    // 6. Add assistant turn
    turns.push({ role: "assistant", content: aiResponse });

    // 7. Save turns to DB
    await supabase
      .from("commpro_phone_call_sessions")
      .update({ conversation_turns: turns })
      .eq("id", session.id);

    // 8. Return TwiML: Say response + Gather for next round
    const webhookBaseUrl = Deno.env.get("SUPABASE_URL") + "/functions/v1";

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Marlene" language="de-DE">${escapeXml(aiResponse)}</Say>
  <Gather input="speech" language="de-DE" speechTimeout="3" timeout="10" action="${webhookBaseUrl}/sot-phone-converse" method="POST">
    <Say voice="Polly.Marlene" language="de-DE"></Say>
  </Gather>
  <Say voice="Polly.Marlene" language="de-DE">Sind Sie noch da? Falls nicht, wünsche ich Ihnen einen schönen Tag. Auf Wiederhören!</Say>
  <Hangup/>
</Response>`;

    return twimlResponse(twiml);
  } catch (err) {
    console.error("phone-converse error:", err);
    return twimlResponse(
      "<Say voice='Polly.Marlene' language='de-DE'>Es ist ein technischer Fehler aufgetreten. Auf Wiederhören.</Say><Hangup/>"
    );
  }
});

function twimlResponse(body: string): Response {
  const wrapped = body.startsWith("<?xml")
    ? body
    : `<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`;

  return new Response(wrapped, {
    status: 200,
    headers: { "Content-Type": "text/xml" },
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
