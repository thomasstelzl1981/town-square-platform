import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * sot-phone-agent-sync — Synchronizes assistant config to ElevenLabs Conversational AI Agent
 *
 * Actions:
 * 1. create_agent — Creates or updates ElevenLabs Agent from commpro_phone_assistants config
 * 2. import_number — Imports Twilio number into ElevenLabs and assigns agent
 * 3. sync — Does both (create/update agent + assign to number)
 *
 * Request body: { action: "create_agent" | "import_number" | "sync", assistant_id: string }
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ELEVENLABS_API = "https://api.elevenlabs.io/v1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      return jsonResponse({ error: "ELEVENLABS_API_KEY not configured" }, 500);
    }

    const { action, assistant_id } = await req.json();

    if (!assistant_id) {
      return jsonResponse({ error: "assistant_id required" }, 400);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Load assistant config
    const { data: assistant, error: loadErr } = await supabase
      .from("commpro_phone_assistants")
      .select("*")
      .eq("id", assistant_id)
      .maybeSingle();

    if (loadErr || !assistant) {
      return jsonResponse({ error: "Assistant not found", details: loadErr?.message }, 404);
    }

    const results: Record<string, any> = {};

    // ── Step 1: Create or Update ElevenLabs Agent ──
    if (action === "create_agent" || action === "sync") {
      const voiceSettings = (assistant.voice_settings as Record<string, any>) || {};
      const rules = (assistant.rules as Record<string, any>) || {};
      const documentation = (assistant.documentation as Record<string, any>) || {};

      // Build system prompt with knowledge base inline
      let systemPrompt = assistant.behavior_prompt || "Du bist ein freundlicher Telefonassistent.";
      
      if (documentation.knowledge_base) {
        systemPrompt += `\n\nWissensbasis:\n${documentation.knowledge_base}`;
      }

      // Add rules
      const rulesList: string[] = [];
      if (rules.collect_name) rulesList.push("Frage nach dem Namen des Anrufers falls unbekannt.");
      if (rules.collect_reason) rulesList.push("Frage nach dem Anliegen des Anrufers.");
      if (rules.max_call_seconds) rulesList.push(`Maximale Gesprächsdauer: ${rules.max_call_seconds} Sekunden. Weise freundlich darauf hin, wenn die Zeit knapp wird.`);
      
      if (rulesList.length > 0) {
        systemPrompt += `\n\nWICHTIGE REGELN:\n${rulesList.map(r => `- ${r}`).join("\n")}`;
      }

      // Always add phone-specific instructions
      systemPrompt += `\n\n- Antworte auf Deutsch, kurz und natürlich (max 2-3 Sätze pro Antwort)
- Du wirst am Telefon vorgelesen, formuliere klar und ohne Sonderzeichen
- Keine Markdown, keine Aufzählungszeichen, keine URLs
- Wenn du eine Frage nicht beantworten kannst, biete an, eine Nachricht weiterzuleiten`;

      // ElevenLabs voice ID — use configured or default German voice
      const voiceId = voiceSettings.voice_id || "FGY2WhTYpPnrIDTdsKH5"; // Laura (German-friendly)

      const agentConfig = {
        conversation_config: {
          agent: {
            prompt: {
              prompt: systemPrompt,
              llm: "gemini-2.5-flash",
              temperature: 0.7,
              max_tokens: 300,
            },
            first_message: assistant.first_message || "Guten Tag, wie kann ich Ihnen helfen?",
            language: "de",
          },
          tts: {
            voice_id: voiceId,
            model_id: "eleven_turbo_v2_5",
            stability: voiceSettings.stability ?? 0.5,
            similarity_boost: voiceSettings.clarity ?? 0.75,
            speed: voiceSettings.speed ?? 1.0,
          },
          asr: {
            quality: "high",
            provider: "elevenlabs",
            language: "de",
          },
          turn: {
            mode: "turn_based",
          },
        },
        name: `SOT-${assistant.display_name || "Assistant"}`,
        tags: ["sot-platform", assistant.brand_key || "default"],
      };

      let agentId = assistant.elevenlabs_agent_id;

      if (agentId) {
        // Update existing agent
        const updateRes = await fetch(`${ELEVENLABS_API}/convai/agents/${agentId}`, {
          method: "PATCH",
          headers: {
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(agentConfig),
        });

        if (!updateRes.ok) {
          const errText = await updateRes.text();
          console.error("ElevenLabs agent update failed:", updateRes.status, errText);
          
          // If agent not found, create new one
          if (updateRes.status === 404) {
            agentId = null;
          } else {
            results.agent = { error: `Update failed: ${updateRes.status}`, details: errText };
          }
        } else {
          results.agent = { status: "updated", agent_id: agentId };
        }
      }

      if (!agentId) {
        // Create new agent
        const createRes = await fetch(`${ELEVENLABS_API}/convai/agents/create`, {
          method: "POST",
          headers: {
            "xi-api-key": ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(agentConfig),
        });

        if (!createRes.ok) {
          const errText = await createRes.text();
          console.error("ElevenLabs agent create failed:", createRes.status, errText);
          return jsonResponse({ error: "Agent creation failed", status: createRes.status, details: errText }, 502);
        }

        const createData = await createRes.json();
        agentId = createData.agent_id;
        results.agent = { status: "created", agent_id: agentId };
      }

      // Save agent_id back to DB
      await supabase
        .from("commpro_phone_assistants")
        .update({ elevenlabs_agent_id: agentId, updated_at: new Date().toISOString() })
        .eq("id", assistant_id);
    }

    // ── Step 2: Import Twilio Number ──
    if (action === "import_number" || action === "sync") {
      const phoneNumber = assistant.twilio_phone_number_e164;
      const TWILIO_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
      const TWILIO_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");

      if (!phoneNumber) {
        results.phone = { error: "No Twilio phone number configured on this assistant" };
      } else if (!TWILIO_SID || !TWILIO_TOKEN) {
        results.phone = { error: "TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN not configured" };
      } else {
        let phoneNumberId = assistant.elevenlabs_phone_number_id;

        if (!phoneNumberId) {
          // Import number into ElevenLabs
          const importRes = await fetch(`${ELEVENLABS_API}/convai/phone-numbers`, {
            method: "POST",
            headers: {
              "xi-api-key": ELEVENLABS_API_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              provider: "twilio",
              phone_number: phoneNumber,
              label: `SOT ${assistant.display_name || phoneNumber}`,
              sid: TWILIO_SID,
              token: TWILIO_TOKEN,
            }),
          });

          if (!importRes.ok) {
            const errText = await importRes.text();
            console.error("Phone import failed:", importRes.status, errText);
            results.phone = { error: `Import failed: ${importRes.status}`, details: errText };
          } else {
            const importData = await importRes.json();
            phoneNumberId = importData.phone_number_id;

            // Save phone_number_id to DB
            await supabase
              .from("commpro_phone_assistants")
              .update({
                elevenlabs_phone_number_id: phoneNumberId,
                updated_at: new Date().toISOString(),
              })
              .eq("id", assistant_id);

            results.phone = { status: "imported", phone_number_id: phoneNumberId };
          }
        } else {
          results.phone = { status: "already_imported", phone_number_id: phoneNumberId };
        }

        // Assign agent to phone number (if both exist)
        const finalAgentId = assistant.elevenlabs_agent_id || results.agent?.agent_id;
        if (phoneNumberId && finalAgentId) {
          const assignRes = await fetch(`${ELEVENLABS_API}/convai/phone-numbers/${phoneNumberId}`, {
            method: "PATCH",
            headers: {
              "xi-api-key": ELEVENLABS_API_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              agent_id: finalAgentId,
            }),
          });

          if (!assignRes.ok) {
            const errText = await assignRes.text();
            console.error("Agent assignment failed:", assignRes.status, errText);
            results.assignment = { error: `Assignment failed: ${assignRes.status}`, details: errText };
          } else {
            results.assignment = { status: "assigned", agent_id: finalAgentId, phone_number_id: phoneNumberId };
          }
        }
      }
    }

    // ── Step 3: Set up post-call webhook ──
    if (action === "sync") {
      const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/sot-phone-postcall`;
      // Note: Post-call webhooks are configured at workspace level in ElevenLabs settings
      // We log the URL so the admin knows what to configure
      results.webhook = {
        status: "info",
        message: "Post-call webhook URL for ElevenLabs workspace settings",
        url: webhookUrl,
      };
    }

    return jsonResponse({ success: true, results });
  } catch (err) {
    console.error("phone-agent-sync error:", err);
    return jsonResponse({ error: err instanceof Error ? err.message : "Unknown error" }, 500);
  }
});

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
