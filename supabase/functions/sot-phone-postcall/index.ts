import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * sot-phone-postcall — Post-Call Webhook Handler
 * 
 * Supports TWO formats:
 * A) ElevenLabs post_call_transcription webhook (new, primary)
 * B) Twilio Status Callback (legacy fallback)
 * 
 * 1. Creates/updates call session with transcript data
 * 2. Generates LLM summary + action items
 * 3. Sends email notifications (Armstrong Zone 2 + Admin Zone 1)
 * 4. Bills credits: 2 Credits per started minute (Zone 2 only)
 */

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev";
const ADMIN_EMAIL = "info@systemofatown.com";
const CREDITS_PER_MINUTE = 2;

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
    const contentType = req.headers.get("content-type") || "";

    // Detect format: ElevenLabs sends JSON, Twilio sends form-data
    if (contentType.includes("application/json")) {
      return await handleElevenLabsWebhook(req);
    } else {
      return await handleTwilioCallback(req);
    }
  } catch (err) {
    console.error("phone-postcall error:", err);
    return new Response("OK", { status: 200 });
  }
});

// ═══════════════════════════════════════════════════════
// Credit Billing for Zone 2 (tenant-level assistants)
// ═══════════════════════════════════════════════════════
async function billCallCredits(
  supabase: any,
  assistant: any,
  sessionId: string,
  durationSec: number | null,
) {
  // Only bill for Zone 2 (user-level assistants with tenant_id)
  // Brand-level assistants (Zone 1) have no tenant billing
  if (!assistant.tenant_id || !assistant.user_id) {
    console.log("[BILLING] Skipping — no tenant_id or brand-level assistant");
    return;
  }

  if (!durationSec || durationSec <= 0) {
    console.log("[BILLING] Skipping — no duration");
    return;
  }

  const minutes = Math.ceil(durationSec / 60);
  const creditsCharged = minutes * CREDITS_PER_MINUTE;
  const billingPeriod = new Date().toISOString().slice(0, 7); // '2026-03'

  console.log(`[BILLING] ${minutes} min × ${CREDITS_PER_MINUTE} Cr = ${creditsCharged} Credits for tenant ${assistant.tenant_id}`);

  try {
    // 1. Update billed_credits on call session
    await supabase
      .from("commpro_phone_call_sessions")
      .update({ billed_credits: creditsCharged })
      .eq("id", sessionId);

    // 2. Insert phone_usage_log entry
    const { error: usageErr } = await supabase
      .from("phone_usage_log")
      .insert({
        tenant_id: assistant.tenant_id,
        assistant_id: assistant.id,
        call_session_id: sessionId,
        user_id: assistant.user_id,
        duration_sec: durationSec,
        credits_charged: creditsCharged,
        provider: "elevenlabs",
        billing_period: billingPeriod,
      });

    if (usageErr) {
      console.error("[BILLING] phone_usage_log insert error:", usageErr.message);
    } else {
      console.log("[BILLING] Usage logged:", creditsCharged, "credits");
    }

    // 3. Deduct credits via credit preflight (if available)
    try {
      const { error: creditErr } = await supabase.rpc("rpc_armstrong_log_action_run", {
        p_action_code: "phone_call",
        p_zone: "z2",
        p_org_id: assistant.tenant_id,
        p_user_id: assistant.user_id,
        p_status: "success",
        p_cost_cents: creditsCharged * 25, // 1 Credit = 25 Cent
        p_credits_charged: creditsCharged,
        p_input_context: { session_id: sessionId, duration_sec: durationSec, minutes },
      });
      if (creditErr) {
        console.error("[BILLING] Credit deduction RPC error:", creditErr.message);
      }
    } catch (rpcErr) {
      console.error("[BILLING] Credit RPC call failed (non-critical):", rpcErr);
    }
  } catch (err) {
    console.error("[BILLING] Billing failed (non-critical):", err);
  }
}

// ═══════════════════════════════════════════════════════
// ElevenLabs Post-Call Webhook Handler
// ═══════════════════════════════════════════════════════
async function handleElevenLabsWebhook(req: Request): Promise<Response> {
  const rawPayload = await req.json();

  console.log("[POSTCALL] Incoming payload type:", typeof rawPayload);
  console.log("[POSTCALL] Top-level keys:", Object.keys(rawPayload));
  if (rawPayload.type) console.log("[POSTCALL] Event type:", rawPayload.type);
  if (rawPayload.data) console.log("[POSTCALL] data keys:", Object.keys(rawPayload.data));

  const payload = rawPayload.data ? rawPayload : { type: rawPayload.type || "post_call_transcription", data: rawPayload };

  if (payload.type && payload.type !== "post_call_transcription") {
    console.log("[POSTCALL] Ignoring event type:", payload.type);
    return new Response("OK", { status: 200 });
  }

  const data = payload.data;
  if (!data?.agent_id && !data?.conversation_id) {
    console.log("[POSTCALL] Missing agent_id AND conversation_id. Payload keys:", Object.keys(data || {}));
    return new Response("OK", { status: 200 });
  }

  console.log("[POSTCALL] Processing — agent_id:", data.agent_id, "conversation_id:", data.conversation_id);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: assistant, error: assistantErr } = await supabase
    .from("commpro_phone_assistants")
    .select("*")
    .eq("elevenlabs_agent_id", data.agent_id)
    .maybeSingle();

  if (assistantErr) {
    console.error("[POSTCALL] DB error finding assistant:", assistantErr.message);
  }

  if (!assistant) {
    console.log("[POSTCALL] No assistant found for agent_id:", data.agent_id);
    return new Response("OK", { status: 200 });
  }

  console.log("[POSTCALL] Matched assistant:", assistant.id, assistant.display_name);

  const transcript = data.transcript || "";
  const conversationTurns: Array<{ role: string; content: string }> = [];

  if (Array.isArray(data.transcript)) {
    for (const entry of data.transcript) {
      conversationTurns.push({
        role: entry.role === "agent" ? "assistant" : "user",
        content: entry.message || entry.text || "",
      });
    }
  }

  const transcriptText = conversationTurns.length > 0
    ? conversationTurns.map(t => `${t.role === "user" ? "Anrufer" : "Assistent"}: ${t.content}`).join("\n")
    : (typeof transcript === "string" ? transcript : "");

  const metadata = data.metadata || {};
  const callerNumber = metadata.caller_number || data.phone_number || "unknown";
  const callDurationSec = data.call_duration_secs || null;
  const analysis = data.analysis || {};

  const { data: existingSession } = await supabase
    .from("commpro_phone_call_sessions")
    .select("id")
    .eq("elevenlabs_conversation_id", data.conversation_id)
    .maybeSingle();

  // Contact matching
  let contactName: string | null = null;
  if (callerNumber && callerNumber !== "unknown") {
    const normalizedCaller = callerNumber.replace(/\s/g, "");
    const tenantId = assistant.tenant_id;
    if (tenantId) {
      const { data: contacts } = await supabase
        .from("contacts")
        .select("first_name, last_name")
        .or(`phone.eq.${normalizedCaller},phone_mobile.eq.${normalizedCaller}`)
        .eq("tenant_id", tenantId)
        .limit(1);
      if (contacts?.length) {
        contactName = [contacts[0].first_name, contacts[0].last_name].filter(Boolean).join(" ");
      }
    }
  }

  const sessionData: Record<string, any> = {
    assistant_id: assistant.id,
    direction: "inbound",
    from_number_e164: callerNumber,
    to_number_e164: assistant.twilio_phone_number_e164 || "unknown",
    status: "completed",
    started_at: data.start_time || new Date().toISOString(),
    ended_at: data.end_time || new Date().toISOString(),
    duration_sec: callDurationSec,
    transcript_text: transcriptText,
    conversation_turns: conversationTurns,
    elevenlabs_conversation_id: data.conversation_id,
    match: {
      matched_type: contactName ? "contact" : "unknown",
      matched_id: null,
      match_type: contactName ? "phone" : "none",
      contact_name: contactName,
    },
    updated_at: new Date().toISOString(),
  };

  if (assistant.user_id) {
    sessionData.user_id = assistant.user_id;
  }

  let sessionId: string;

  if (existingSession) {
    sessionId = existingSession.id;
    const { error: updateErr } = await supabase
      .from("commpro_phone_call_sessions")
      .update(sessionData)
      .eq("id", sessionId);
    if (updateErr) {
      console.error("[POSTCALL] DB UPDATE error:", updateErr.message, updateErr.details, updateErr.hint);
    } else {
      console.log("[POSTCALL] Session updated:", sessionId);
    }
  } else {
    const { data: newSession, error: insertErr } = await supabase
      .from("commpro_phone_call_sessions")
      .insert(sessionData)
      .select("id")
      .single();
    if (insertErr) {
      console.error("[POSTCALL] DB INSERT error:", insertErr.message, insertErr.details, insertErr.hint);
      return new Response("OK", { status: 200 });
    }
    sessionId = newSession?.id || "";
    console.log("[POSTCALL] Session created:", sessionId);
  }

  // Generate LLM summary
  await generateSummaryAndNotify(supabase, sessionId, assistant, transcriptText, conversationTurns, callerNumber, contactName, callDurationSec);

  // Bill credits for Zone 2
  await billCallCredits(supabase, assistant, sessionId, callDurationSec);

  return new Response("OK", { status: 200 });
}

// ═══════════════════════════════════════════════════════
// Twilio Status Callback Handler (Legacy Fallback)
// ═══════════════════════════════════════════════════════
async function handleTwilioCallback(req: Request): Promise<Response> {
  const formData = await req.formData();
  const callSid = formData.get("CallSid") as string;
  const callStatus = formData.get("CallStatus") as string;
  const callDuration = formData.get("CallDuration") as string;
  const recordingUrl = formData.get("RecordingUrl") as string;
  const transcriptionText = formData.get("TranscriptionText") as string;

  if (!callSid) {
    return new Response("OK", { status: 200 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { data: session } = await supabase
    .from("commpro_phone_call_sessions")
    .select("*, commpro_phone_assistants!inner(id, user_id, tenant_id, documentation, display_name, brand_key)")
    .eq("twilio_call_sid", callSid)
    .maybeSingle();

  if (!session) {
    console.log("No session found for CallSid:", callSid);
    return new Response("OK", { status: 200 });
  }

  const updatePayload: Record<string, any> = {
    status: callStatus === "completed" ? "completed" : callStatus || "completed",
    ended_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (callDuration) updatePayload.duration_sec = parseInt(callDuration, 10);
  if (recordingUrl) updatePayload.recording_url = `${recordingUrl}.mp3`;

  const conversationTurns = (session.conversation_turns as any[]) || [];
  const hasConversation = conversationTurns.length > 0;

  if (hasConversation && !session.transcript_text) {
    updatePayload.transcript_text = conversationTurns
      .map((t: any) => `${t.role === "user" ? "Anrufer" : "Assistent"}: ${t.content}`)
      .join("\n");
  } else if (transcriptionText) {
    updatePayload.transcript_text = transcriptionText;
  }

  const finalTranscript = updatePayload.transcript_text || session.transcript_text || "";

  // Billing
  const twilioPrice = formData.get("Price") as string;
  const twilioPriceUnit = formData.get("PriceUnit") as string;
  if (twilioPrice) updatePayload.twilio_price = parseFloat(twilioPrice);
  if (twilioPriceUnit) updatePayload.twilio_price_unit = twilioPriceUnit;

  const assistant = (session as any).commpro_phone_assistants;
  const match = (session.match as Record<string, any>) || {};

  // Generate summary
  if (finalTranscript && finalTranscript.length > 10) {
    try {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (LOVABLE_API_KEY) {
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
                content: `${contactInfo}\nAnrufnummer: ${session.from_number_e164}\n${hasConversation ? "Gesprächsverlauf" : "Transkript"}:\n${finalTranscript}`,
              },
            ],
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const content = aiData.choices?.[0]?.message?.content || "";
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

  await supabase
    .from("commpro_phone_call_sessions")
    .update(updatePayload)
    .eq("id", session.id);

  // Send notifications
  await sendNotifications(supabase, session.id, assistant, match, updatePayload, session, finalTranscript, hasConversation, conversationTurns, recordingUrl);

  // Bill credits for Zone 2
  const durationSec = updatePayload.duration_sec || session.duration_sec;
  await billCallCredits(supabase, assistant, session.id, durationSec);

  return new Response("OK", { status: 200 });
}

// ═══════════════════════════════════════════════════════
// Shared: LLM Summary + Notifications for ElevenLabs path
// ═══════════════════════════════════════════════════════
async function generateSummaryAndNotify(
  supabase: any,
  sessionId: string,
  assistant: any,
  transcriptText: string,
  conversationTurns: any[],
  callerNumber: string,
  contactName: string | null,
  durationSec: number | null,
) {
  const updatePayload: Record<string, any> = {};

  if (transcriptText && transcriptText.length > 10) {
    try {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (LOVABLE_API_KEY) {
        const contactInfo = contactName
          ? `Bekannter Kontakt: ${contactName}`
          : `Unbekannter Anrufer: ${callerNumber}`;

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
                content: `${contactInfo}\nAnrufnummer: ${callerNumber}\nGesprächsverlauf:\n${transcriptText}`,
              },
            ],
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const content = aiData.choices?.[0]?.message?.content || "";
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

  if (Object.keys(updatePayload).length > 0) {
    await supabase
      .from("commpro_phone_call_sessions")
      .update(updatePayload)
      .eq("id", sessionId);
  }

  // Build and send email
  const callerLabel = contactName || callerNumber;
  const summary = updatePayload.summary_text || "Kein Transkript verfügbar";
  const actionItems = (updatePayload.action_items || []) as Array<{ title: string; priority?: string }>;
  const actionsHtml = actionItems.length
    ? `<ul>${actionItems.map((a) => `<li><strong>[${a.priority || "mittel"}]</strong> ${a.title}</li>`).join("")}</ul>`
    : "<p>Keine Aufgaben erkannt.</p>";

  const turnCount = Math.ceil(conversationTurns.length / 2);

  // Calculate billing info for email
  const minutes = durationSec ? Math.ceil(durationSec / 60) : 0;
  const creditsCharged = minutes * CREDITS_PER_MINUTE;
  const isBillable = !!assistant.tenant_id && !!assistant.user_id;
  const billingLine = isBillable
    ? `<strong>Abrechnung:</strong> ${creditsCharged} Credits (${minutes} Min × ${CREDITS_PER_MINUTE} Cr/Min)<br/>`
    : "";

  const emailBody = `
<h2>📞 Eingehender Anruf — ${assistant.display_name || "Telefonassistent"}</h2>
<p><strong>Von:</strong> ${callerLabel}<br/>
<strong>Nummer:</strong> ${callerNumber}<br/>
<strong>Dauer:</strong> ${durationSec || "?"} Sekunden<br/>
<strong>Typ:</strong> ElevenLabs KI-Gespräch (${turnCount} Dialogrunden)<br/>
${billingLine}
<strong>Zeitpunkt:</strong> ${new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}</p>

<h3>Zusammenfassung</h3>
<p>${summary.replace(/\n/g, "<br/>")}</p>

<h3>Aufgaben</h3>
${actionsHtml}

${conversationTurns.length > 0 ? `<h3>Gesprächsverlauf</h3><pre style="font-size:12px;background:#f5f5f5;padding:12px;border-radius:4px;">${escapeHtml(transcriptText)}</pre>` : ""}
<hr/>
<p style="color:#888;font-size:12px;">Automatisch erstellt vom KI-Telefonassistenten (ElevenLabs).</p>`;

  const emailSubject = `📞 Anruf von ${callerLabel} — ${assistant.display_name || "Assistent"}`;

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

  // Armstrong notification (Zone 2) — only for user-level assistants
  if (assistant.user_id && RESEND_API_KEY) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("armstrong_email")
      .eq("id", assistant.user_id)
      .maybeSingle();
    
    const armstrongEmail = profile?.armstrong_email || null;
    const documentation = (assistant.documentation as Record<string, any>) || {};

    if (armstrongEmail && documentation.email_enabled !== false) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Telefonassistent <noreply@systemofatown.com>",
            to: [armstrongEmail],
            subject: emailSubject,
            html: emailBody,
          }),
        });

        await supabase
          .from("commpro_phone_call_sessions")
          .update({ armstrong_notified_at: new Date().toISOString() })
          .eq("id", sessionId);
      } catch (emailErr) {
        console.error("Armstrong email failed (non-critical):", emailErr);
      }
    }
  }

  // Admin notification (Zone 1)
  if (RESEND_API_KEY) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "KI-Telefon Admin <noreply@systemofatown.com>",
          to: [ADMIN_EMAIL],
          subject: `[ADMIN] ${emailSubject}`,
          html: `<p style="background:#fff3cd;padding:8px;border-radius:4px;">⚡ <strong>Admin-Kopie</strong> — Assistent: ${assistant.display_name || "?"} | Brand: ${assistant.brand_key || "user"} | User: ${assistant.user_id || "brand-level"} | Engine: ElevenLabs</p>\n${emailBody}`,
        }),
      });

      await supabase
        .from("commpro_phone_call_sessions")
        .update({ admin_notified_at: new Date().toISOString() })
        .eq("id", sessionId);
    } catch (adminErr) {
      console.error("Admin email failed (non-critical):", adminErr);
    }
  }
}

// ═══════════════════════════════════════════════════════
// Shared: Notifications for Twilio path (legacy)
// ═══════════════════════════════════════════════════════
async function sendNotifications(
  supabase: any,
  sessionId: string,
  assistant: any,
  match: any,
  updatePayload: any,
  session: any,
  finalTranscript: string,
  hasConversation: boolean,
  conversationTurns: any[],
  recordingUrl: string | null,
) {
  const callerLabel = match.contact_name || session.from_number_e164;
  const summary = updatePayload.summary_text || session.summary_text || "Kein Transkript verfügbar";
  const actionItems = (updatePayload.action_items || session.action_items || []) as Array<{ title: string; priority?: string }>;
  const actionsHtml = actionItems.length
    ? `<ul>${actionItems.map((a: any) => `<li><strong>[${a.priority || "mittel"}]</strong> ${a.title}</li>`).join("")}</ul>`
    : "<p>Keine Aufgaben erkannt.</p>";

  const conversationType = hasConversation ? "KI-Gespräch" : "Anrufbeantworter";
  const turnCount = hasConversation ? Math.ceil(conversationTurns.length / 2) : 0;

  const emailBody = `
<h2>📞 Eingehender Anruf — ${assistant.display_name || "Telefonassistent"}</h2>
<p><strong>Von:</strong> ${callerLabel}<br/>
<strong>Nummer:</strong> ${session.from_number_e164}<br/>
<strong>Dauer:</strong> ${updatePayload.duration_sec || session.duration_sec || "?"} Sekunden<br/>
<strong>Typ:</strong> ${conversationType}${turnCount > 0 ? ` (${turnCount} Dialogrunden)` : ""}<br/>
<strong>Zeitpunkt:</strong> ${new Date().toLocaleString("de-DE", { timeZone: "Europe/Berlin" })}</p>

<h3>Zusammenfassung</h3>
<p>${summary.replace(/\n/g, "<br/>")}</p>

<h3>Aufgaben</h3>
${actionsHtml}

${recordingUrl ? `<p><a href="${recordingUrl}.mp3">🎙 Aufnahme anhören</a></p>` : ""}
${hasConversation ? `<h3>Gesprächsverlauf</h3><pre style="font-size:12px;background:#f5f5f5;padding:12px;border-radius:4px;">${escapeHtml(finalTranscript)}</pre>` : ""}
<hr/>
<p style="color:#888;font-size:12px;">Automatisch erstellt vom KI-Telefonassistenten.</p>`;

  const emailSubject = `📞 Anruf von ${callerLabel} — ${assistant.display_name || "Assistent"}`;
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

  // Armstrong notification (Zone 2)
  if (assistant?.user_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("armstrong_email")
      .eq("id", assistant.user_id)
      .maybeSingle();
    const armstrongEmail = profile?.armstrong_email || null;
    const documentation = assistant?.documentation as Record<string, any> | null;

    if (armstrongEmail && documentation?.email_enabled !== false && RESEND_API_KEY) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Telefonassistent <noreply@systemofatown.com>",
            to: [armstrongEmail],
            subject: emailSubject,
            html: emailBody,
          }),
        });

        await supabase
          .from("commpro_phone_call_sessions")
          .update({ armstrong_notified_at: new Date().toISOString() })
          .eq("id", sessionId);
      } catch (emailErr) {
        console.error("Armstrong email failed (non-critical):", emailErr);
      }
    }
  }

  // Admin notification (Zone 1)
  if (RESEND_API_KEY) {
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "KI-Telefon Admin <noreply@systemofatown.com>",
          to: [ADMIN_EMAIL],
          subject: `[ADMIN] ${emailSubject}`,
          html: `<p style="background:#fff3cd;padding:8px;border-radius:4px;">⚡ <strong>Admin-Kopie</strong> — Assistent: ${assistant.display_name || "?"} | Brand: ${assistant.brand_key || "user"} | User: ${assistant.user_id || "brand-level"}</p>\n${emailBody}`,
        }),
      });

      await supabase
        .from("commpro_phone_call_sessions")
        .update({ admin_notified_at: new Date().toISOString() })
        .eq("id", sessionId);
    } catch (adminErr) {
      console.error("Admin email failed (non-critical):", adminErr);
    }
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
