import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * sot-phone-postcall — Twilio Status/Transcription Callback
 * 
 * 1. Updates call session with duration, transcript, recording URL
 * 2. Generates LLM summary + action items
 * 3. Sends structured email to Armstrong inbound address → Widget + User notification
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY_URL = "https://ai-gateway.lovable.dev";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const callSid = formData.get("CallSid") as string;
    const callStatus = formData.get("CallStatus") as string;
    const callDuration = formData.get("CallDuration") as string;
    const recordingUrl = formData.get("RecordingUrl") as string;
    const transcriptionText = formData.get("TranscriptionText") as string;
    const recordingSid = formData.get("RecordingSid") as string;

    if (!callSid) {
      return new Response("OK", { status: 200 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Find call session by Twilio SID — JOIN profiles for armstrong_email
    const { data: session } = await supabase
      .from("commpro_phone_call_sessions")
      .select("*, commpro_phone_assistants!inner(user_id, documentation, display_name)")
      .eq("twilio_call_sid", callSid)
      .maybeSingle();

    if (!session) {
      console.log("No session found for CallSid:", callSid);
      return new Response("OK", { status: 200 });
    }

    // 2. Update call session with Twilio data
    const updatePayload: Record<string, any> = {
      status: callStatus === "completed" ? "completed" : callStatus || "completed",
      ended_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (callDuration) updatePayload.duration_sec = parseInt(callDuration, 10);
    if (recordingUrl) updatePayload.recording_url = `${recordingUrl}.mp3`;
    if (transcriptionText) updatePayload.transcript_text = transcriptionText;

    // Billing: Capture Twilio price if available in callback
    const twilioPrice = formData.get("Price") as string;
    const twilioPriceUnit = formData.get("PriceUnit") as string;
    if (twilioPrice) updatePayload.twilio_price = parseFloat(twilioPrice);
    if (twilioPriceUnit) updatePayload.twilio_price_unit = twilioPriceUnit;

    // 3. Generate LLM summary if transcript available
    if (transcriptionText && transcriptionText.length > 10) {
      try {
        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
        if (LOVABLE_API_KEY) {
          const match = (session.match as Record<string, any>) || {};
          const contactInfo = match.contact_name
            ? `Bekannter Kontakt: ${match.contact_name}`
            : `Unbekannter Anrufer: ${session.from_number_e164}`;

          const aiRes = await fetch(`${AI_GATEWAY_URL}/v1/chat/completions`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              max_tokens: 2000,
              messages: [
                {
                  role: "system",
                  content: `Du bist ein Telefon-Assistent-Analyst. Erstelle eine knappe Zusammenfassung eines Telefongesprächs und extrahiere Aufgaben. Antworte als JSON:
{
  "summary": "Stichpunktartige Zusammenfassung (max 5 Punkte, je mit •)",
  "action_items": [{"title": "Aufgabe", "priority": "hoch|mittel|niedrig"}],
  "caller_sentiment": "positiv|neutral|negativ",
  "urgency": "hoch|mittel|niedrig"
}`,
                },
                {
                  role: "user",
                  content: `${contactInfo}\nAnrufnummer: ${session.from_number_e164}\nTranskript:\n${transcriptionText}`,
                },
              ],
            }),
          });

          if (aiRes.ok) {
            const aiData = await aiRes.json();
            const content = aiData.choices?.[0]?.message?.content || "";
            // Extract JSON from potential markdown code blocks
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const parsed = JSON.parse(jsonMatch[0]);
              updatePayload.summary_text = parsed.summary || "";
              updatePayload.action_items = parsed.action_items || [];
            }
          }
        }
      } catch (aiErr) {
        console.error("LLM summary failed (non-critical):", aiErr);
      }
    }

    // Save updates
    await supabase
      .from("commpro_phone_call_sessions")
      .update(updatePayload)
      .eq("id", session.id);

    // 4. Armstrong notification via inbound email — use profiles.armstrong_email
    const assistant = (session as any).commpro_phone_assistants;
    const documentation = assistant?.documentation as Record<string, any> | null;

    // Fetch armstrong_email from profiles table via user_id
    let armstrongEmail: string | null = null;
    if (assistant?.user_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("armstrong_email")
        .eq("id", assistant.user_id)
        .maybeSingle();
      armstrongEmail = profile?.armstrong_email || null;
    }

    if (armstrongEmail && documentation?.email_enabled !== false) {
      try {
        const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
        if (RESEND_API_KEY) {
          const match = (session.match as Record<string, any>) || {};
          const callerLabel = match.contact_name || session.from_number_e164;
          const summary = updatePayload.summary_text || "Kein Transkript verfügbar";
          const actionItems = (updatePayload.action_items || []) as Array<{ title: string; priority?: string }>;
          const actionsHtml = actionItems.length
            ? `<ul>${actionItems.map((a) => `<li><strong>[${a.priority || "mittel"}]</strong> ${a.title}</li>`).join("")}</ul>`
            : "<p>Keine Aufgaben erkannt.</p>";

          const emailBody = `
<h2>📞 Eingehender Anruf — ${assistant.display_name || "Telefonassistent"}</h2>
<p><strong>Von:</strong> ${callerLabel}<br/>
<strong>Nummer:</strong> ${session.from_number_e164}<br/>
<strong>Dauer:</strong> ${updatePayload.duration_sec || "?"} Sekunden<br/>
<strong>Zeitpunkt:</strong> ${new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}</p>

<h3>Zusammenfassung</h3>
<p>${summary.replace(/\n/g, "<br/>")}</p>

<h3>Aufgaben</h3>
${actionsHtml}

${recordingUrl ? `<p><a href="${recordingUrl}.mp3">🎙 Aufnahme anhören</a></p>` : ""}
<hr/>
<p style="color:#888;font-size:12px;">Automatisch erstellt vom KI-Telefonassistenten. Diese E-Mail wurde an die Armstrong-Inbound-Adresse gesendet.</p>`;

          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Telefonassistent <noreply@systemofatown.com>",
              to: [armstrongEmail],
              subject: `📞 Anruf von ${callerLabel} — ${assistant.display_name || "Assistent"}`,
              html: emailBody,
            }),
          });

          // Mark notification sent
          await supabase
            .from("commpro_phone_call_sessions")
            .update({ armstrong_notified_at: new Date().toISOString() })
            .eq("id", session.id);

          console.log("Armstrong notification sent to:", armstrongEmail);
        }
      } catch (emailErr) {
        console.error("Armstrong email notification failed (non-critical):", emailErr);
      }
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("phone-postcall error:", err);
    return new Response("OK", { status: 200 });
  }
});
