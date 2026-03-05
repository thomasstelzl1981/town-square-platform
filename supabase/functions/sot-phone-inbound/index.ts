import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * sot-phone-inbound — Twilio Voice Webhook (FALLBACK PATH)
 *
 * Primary call routing is handled by ElevenLabs Conversational AI after
 * sot-phone-agent-sync imports the Twilio number. This function only fires
 * if ElevenLabs is not yet configured or is temporarily unavailable.
 *
 * Uses ElevenLabs TTS (via elevenlabs-tts edge function) when available,
 * falling back to Polly.Vicki (neural) if TTS generation fails.
 *
 * Returns TwiML.
 */

const FALLBACK_VOICE = "Polly.Vicki"; // Neural German voice — fallback only

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
      return twimlResponse(`<Say voice="${FALLBACK_VOICE}" language="de-DE">Entschuldigung, ein Fehler ist aufgetreten.</Say><Hangup/>`);
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
        `<Say voice="${FALLBACK_VOICE}" language="de-DE">Der gewünschte Teilnehmer ist derzeit nicht erreichbar. Bitte versuchen Sie es später erneut.</Say><Hangup/>`
      );
    }

    // 1b. If the assistant has an ElevenLabs agent, try to trigger re-sync
    // (this path means ElevenLabs lost the webhook — attempt recovery)
    if (assistant.elevenlabs_agent_id && assistant.elevenlabs_phone_number_id) {
      console.warn("[FALLBACK] Call hit TwiML path despite ElevenLabs config — attempting re-sync");
      try {
        const syncUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/sot-phone-agent-sync`;
        // Fire-and-forget: don't block the call
        fetch(syncUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            action: "sync",
            assistant_id: assistant.id,
          }),
        }).catch(e => console.warn("[FALLBACK] Re-sync fire-and-forget error:", e));
      } catch (_) { /* non-critical */ }
    }

    // 2. Contact matching
    let contactName: string | null = null;
    if (callerNumber && assistant.tenant_id) {
      const normalizedCaller = callerNumber.replace(/\s/g, "");
      const { data: contacts } = await supabase
        .from("contacts")
        .select("first_name, last_name")
        .or(`phone.eq.${normalizedCaller},phone_mobile.eq.${normalizedCaller}`)
        .eq("tenant_id", assistant.tenant_id)
        .limit(1);

      if (contacts?.length) {
        contactName = [contacts[0].first_name, contacts[0].last_name].filter(Boolean).join(" ");
      }
    }

    // 3. Create call session
    const sessionInsert: Record<string, any> = {
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
    };

    if (assistant.user_id) {
      sessionInsert.user_id = assistant.user_id;
    }

    const { error: sessionErr } = await supabase
      .from("commpro_phone_call_sessions")
      .insert(sessionInsert);

    if (sessionErr) {
      console.error("Failed to create call session:", sessionErr);
    }

    // 4. Build greeting
    const config = assistant as Record<string, any>;
    const greeting = config.first_message ||
      "Guten Tag, Sie sprechen mit dem KI-Assistenten. Wie kann ich Ihnen helfen?";

    const personalizedGreeting = contactName
      ? greeting.replace(/Guten Tag/i, `Guten Tag ${contactName}`)
      : greeting;

    const rules = config.rules || {};
    const webhookBaseUrl = Deno.env.get("SUPABASE_URL") + "/functions/v1";

    // 5. Try ElevenLabs TTS for greeting, fall back to Polly
    const greetingAudioUrl = await generateElevenLabsTts(
      personalizedGreeting,
      (config.voice_settings as any)?.voice_id,
      supabase
    );

    const greetingTwiml = greetingAudioUrl
      ? `<Play>${escapeXml(greetingAudioUrl)}</Play>`
      : `<Say voice="${FALLBACK_VOICE}" language="de-DE">${escapeXml(personalizedGreeting)}</Say>`;

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${greetingTwiml}
  <Gather input="speech" language="de-DE" speechTimeout="3" timeout="10" action="${webhookBaseUrl}/sot-phone-converse" method="POST">
    <Say voice="${FALLBACK_VOICE}" language="de-DE"></Say>
  </Gather>
  <Say voice="${FALLBACK_VOICE}" language="de-DE">Ich habe Sie leider nicht verstanden. Vielen Dank für Ihren Anruf. Auf Wiederhören.</Say>
  <Hangup/>
</Response>`;

    return twimlResponse(twiml);
  } catch (err) {
    console.error("phone-inbound error:", err);
    return twimlResponse(
      `<Say voice="${FALLBACK_VOICE}" language="de-DE">Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.</Say><Hangup/>`
    );
  }
});

/**
 * Generate TTS audio via ElevenLabs API, upload to Supabase storage,
 * and return a public URL for Twilio's <Play> verb.
 * Returns null if anything fails (caller should fall back to <Say>).
 */
async function generateElevenLabsTts(
  text: string,
  voiceId: string | null | undefined,
  supabase: any
): Promise<string | null> {
  const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
  if (!ELEVENLABS_API_KEY) return null;

  const voice = voiceId || "FGY2WhTYpPnrIDTdsKH5"; // Laura

  try {
    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice}/stream?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text.slice(0, 3000),
          model_id: "eleven_turbo_v2_5",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            speed: 1.0,
          },
        }),
      }
    );

    if (!res.ok) {
      console.warn("[TTS] ElevenLabs failed:", res.status);
      return null;
    }

    const audioBytes = new Uint8Array(await res.arrayBuffer());
    const fileName = `tts/${crypto.randomUUID()}.mp3`;

    // Ensure bucket exists (idempotent)
    await supabase.storage.createBucket("phone-tts-cache", {
      public: true,
      allowedMimeTypes: ["audio/mpeg"],
      fileSizeLimit: 5 * 1024 * 1024, // 5MB
    }).catch(() => { /* bucket may already exist */ });

    const { error: uploadErr } = await supabase.storage
      .from("phone-tts-cache")
      .upload(fileName, audioBytes, {
        contentType: "audio/mpeg",
        upsert: true,
      });

    if (uploadErr) {
      console.warn("[TTS] Storage upload failed:", uploadErr);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from("phone-tts-cache")
      .getPublicUrl(fileName);

    return urlData?.publicUrl || null;
  } catch (e) {
    console.warn("[TTS] Generation error:", e);
    return null;
  }
}

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