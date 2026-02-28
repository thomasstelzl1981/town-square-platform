import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * sot-phone-inbound — Twilio Voice Webhook
 * Called when a call comes in to a provisioned Twilio number.
 *
 * Zone 2 (standard tier): Twilio <Say> greeting + <Gather> + LLM follow-up
 * Zone 1 (premium tier): ElevenLabs Conversational AI via <Stream> (future)
 *
 * Returns TwiML.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Twilio sends form-encoded POST
    const formData = await req.formData();
    const calledNumber = formData.get("To") as string;
    const callerNumber = formData.get("From") as string;
    const callSid = formData.get("CallSid") as string;

    if (!calledNumber) {
      return twimlResponse("<Say>Entschuldigung, ein Fehler ist aufgetreten.</Say><Hangup/>");
    }

    // Service client for cross-user lookups
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

    // 2. Attempt contact matching via caller number
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

    // 3. Create call session record
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

    // 4. Build TwiML based on tier
    const config = assistant as Record<string, any>;
    const tier = config.tier || "standard";

    if (tier === "premium") {
      // Zone 1: ElevenLabs via Twilio <Stream> — future implementation
      // For now, fall through to standard
      console.log("Premium tier — ElevenLabs streaming will be implemented next phase");
    }

    // Zone 2 (standard): Twilio native TTS with <Gather>
    const greeting = config.first_message ||
      "Guten Tag, Sie sprechen mit dem KI-Assistenten. Wie kann ich Ihnen helfen?";

    const personalizedGreeting = contactName
      ? greeting.replace(/Guten Tag/i, `Guten Tag ${contactName}`)
      : greeting;

    const rules = config.rules || {};
    const maxDuration = rules.max_call_seconds || 120;

    // Build gather prompts based on rules
    const gatherPrompts: string[] = [];
    if (rules.collect_name && !contactName) {
      gatherPrompts.push("Darf ich Ihren Namen erfahren?");
    }
    if (rules.collect_reason) {
      gatherPrompts.push("Bitte schildern Sie kurz Ihr Anliegen.");
    }

    const gatherText = gatherPrompts.length > 0
      ? gatherPrompts.join(" ")
      : "Bitte hinterlassen Sie Ihre Nachricht nach dem Signalton.";

    const webhookBaseUrl = Deno.env.get("SUPABASE_URL") + "/functions/v1";

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Marlene" language="de-DE">${escapeXml(personalizedGreeting)}</Say>
  <Pause length="1"/>
  <Say voice="Polly.Marlene" language="de-DE">${escapeXml(gatherText)}</Say>
  <Record
    maxLength="${maxDuration}"
    playBeep="true"
    transcribe="true"
    transcribeCallback="${webhookBaseUrl}/sot-phone-postcall"
    action="${webhookBaseUrl}/sot-phone-postcall"
    method="POST"
  />
  <Say voice="Polly.Marlene" language="de-DE">Vielen Dank für Ihren Anruf. Wir melden uns zeitnah bei Ihnen.</Say>
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
