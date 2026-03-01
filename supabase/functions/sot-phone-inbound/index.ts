import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * sot-phone-inbound — Twilio Voice Webhook
 * Called when a call comes in to a provisioned Twilio number.
 *
 * Stage 2: Gather-Loop with LLM conversation
 * - Greeting via <Say>
 * - <Gather input="speech"> captures caller speech
 * - Routes to sot-phone-converse for LLM response
 * - Loop continues until goodbye or max duration
 *
 * Returns TwiML.
 */

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
    const calledNumber = formData.get("To") as string;
    const callerNumber = formData.get("From") as string;
    const callSid = formData.get("CallSid") as string;

    if (!calledNumber) {
      return twimlResponse("<Say>Entschuldigung, ein Fehler ist aufgetreten.</Say><Hangup/>");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Find assistant by Twilio number
    const { data: assistant, error: assistantErr } = await supabase
      .from("commpro_phone_assistants")
      .select("*")
      .eq("twilio_phone_number_e164", calledNumber)
      .eq("is_enabled", true)
      .maybeSingle();

    if (assistantErr || !assistant) {
      console.error("No assistant found for number:", calledNumber, assistantErr);
      return twimlResponse(
        "<Say voice='Polly.Marlene' language='de-DE'>Der gewünschte Teilnehmer ist derzeit nicht erreichbar. Bitte versuchen Sie es später erneut.</Say><Hangup/>"
      );
    }

    // 2. Contact matching
    let contactName: string | null = null;
    if (callerNumber) {
      const normalizedCaller = callerNumber.replace(/\s/g, "");
      const { data: contacts } = await supabase
        .from("contacts")
        .select("first_name, last_name")
        .or(`phone.eq.${normalizedCaller},phone_mobile.eq.${normalizedCaller}`)
        .eq("tenant_id", assistant.tenant_id || "")
        .limit(1);

      if (contacts?.length) {
        contactName = [contacts[0].first_name, contacts[0].last_name].filter(Boolean).join(" ");
      }
    }

    // 3. Create call session with empty conversation_turns
    const { error: sessionErr } = await supabase
      .from("commpro_phone_call_sessions")
      .insert({
        user_id: assistant.user_id,
        assistant_id: assistant.id,
        direction: "inbound",
        from_number_e164: callerNumber || "unknown",
        to_number_e164: calledNumber,
        started_at: new Date().toISOString(),
        status: "in_progress",
        twilio_call_sid: callSid,
        conversation_turns: [],
        match: {
          matched_type: contactName ? "contact" : "unknown",
          matched_id: null,
          match_type: contactName ? "phone" : "none",
          contact_name: contactName,
        },
      });

    if (sessionErr) {
      console.error("Failed to create call session:", sessionErr);
    }

    // 4. Build TwiML: Greeting + Gather loop
    const config = assistant as Record<string, any>;
    const greeting = config.first_message ||
      "Guten Tag, Sie sprechen mit dem KI-Assistenten. Wie kann ich Ihnen helfen?";

    const personalizedGreeting = contactName
      ? greeting.replace(/Guten Tag/i, `Guten Tag ${contactName}`)
      : greeting;

    const rules = config.rules || {};
    const maxDuration = rules.max_call_seconds || 120;
    const webhookBaseUrl = Deno.env.get("SUPABASE_URL") + "/functions/v1";

    // Gather with speech input → routes to sot-phone-converse
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Marlene" language="de-DE">${escapeXml(personalizedGreeting)}</Say>
  <Gather input="speech" language="de-DE" speechTimeout="3" timeout="10" action="${webhookBaseUrl}/sot-phone-converse" method="POST">
    <Say voice="Polly.Marlene" language="de-DE"></Say>
  </Gather>
  <Say voice="Polly.Marlene" language="de-DE">Ich habe Sie leider nicht verstanden. Vielen Dank für Ihren Anruf. Auf Wiederhören.</Say>
  <Hangup/>
</Response>`;

    return twimlResponse(twiml);
  } catch (err) {
    console.error("phone-inbound error:", err);
    return twimlResponse(
      "<Say voice='Polly.Marlene' language='de-DE'>Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.</Say><Hangup/>"
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
