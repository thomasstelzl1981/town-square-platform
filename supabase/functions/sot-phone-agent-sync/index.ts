import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * sot-phone-agent-sync — Synchronizes assistant config to ElevenLabs Conversational AI Agent
 *
 * NOW with Knowledge Store: Automatically assembles behavior_prompt from
 * armstrong_knowledge_items (brand-specific + global Armstrong persona).
 *
 * Actions:
 * 1. create_agent — Creates or updates ElevenLabs Agent from commpro_phone_assistants config
 * 2. import_number — Imports Twilio number into ElevenLabs and assigns agent
 * 3. sync — Does both (create/update agent + assign to number)
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

      // ═══════════════════════════════════════════════════════
      // KNOWLEDGE STORE: Auto-assemble behavior_prompt
      // ═══════════════════════════════════════════════════════
      const brandKey = assistant.brand_key || null;
      const systemPrompt = await assemblePrompt(supabase, brandKey, assistant, rules);

      console.log(`[SYNC] Brand: ${brandKey}, Prompt length: ${systemPrompt.length} chars`);

      // ElevenLabs voice ID — use configured or default German voice
      const voiceId = voiceSettings.voice_id || "FGY2WhTYpPnrIDTdsKH5"; // Laura (German-friendly)

      // Build first_message — use stored or generate from persona
      const firstMessage = assistant.first_message ||
        `Guten Tag, Sie sprechen mit dem Assistenten von ${assistant.display_name?.replace(' Telefonassistent', '') || 'unserem Team'}. Wie kann ich Ihnen helfen?`;

      const agentConfig = {
        conversation_config: {
          agent: {
            prompt: {
              prompt: systemPrompt,
              llm: "gemini-2.5-flash",
              temperature: 0.7,
              max_tokens: 300,
            },
            first_message: firstMessage,
            language: "de",
          },
          tts: {
            voice_id: voiceId,
            model_id: "eleven_turbo_v2_5",
            stability: normalizePercent(voiceSettings.stability, 0.5),
            similarity_boost: normalizePercent(voiceSettings.clarity, 0.75),
            speed: Math.max(0.7, Math.min(normalizePercent(voiceSettings.speed, 1.0), 1.2)),
          },
          asr: {
            quality: "high",
            provider: "elevenlabs",
            language: "de",
          },
          turn: {
            mode: "turn",
          },
        },
        name: `SOT-${assistant.display_name || "Assistant"}`,
        tags: ["sot-platform", brandKey || "default"],
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

      // Save agent_id + generated prompt back to DB
      await supabase
        .from("commpro_phone_assistants")
        .update({
          elevenlabs_agent_id: agentId,
          behavior_prompt: systemPrompt,
          first_message: firstMessage,
          updated_at: new Date().toISOString(),
        })
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

        // Assign agent to phone number
        const finalAgentId = assistant.elevenlabs_agent_id || results.agent?.agent_id;
        if (phoneNumberId && finalAgentId) {
          const assignRes = await fetch(`${ELEVENLABS_API}/convai/phone-numbers/${phoneNumberId}`, {
            method: "PATCH",
            headers: {
              "xi-api-key": ELEVENLABS_API_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ agent_id: finalAgentId }),
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

    // ── Step 3: Webhook info ──
    if (action === "sync") {
      const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/sot-phone-postcall`;
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

// ═══════════════════════════════════════════════════════
// KNOWLEDGE STORE: Prompt Assembly
// ═══════════════════════════════════════════════════════

interface KnowledgeItem {
  item_code: string;
  category: string;
  title_de: string;
  content: string;
  phone_prompt_priority: number;
}

async function assemblePrompt(
  supabase: any,
  brandKey: string | null,
  assistant: any,
  rules: Record<string, any>
): Promise<string> {
  const sections: string[] = [];

  // 1. Fetch brand-specific knowledge items
  if (brandKey) {
    const { data: brandItems } = await supabase
      .from("armstrong_knowledge_items")
      .select("item_code, category, title_de, content, phone_prompt_priority")
      .eq("brand_key", brandKey)
      .eq("status", "published")
      .order("phone_prompt_priority", { ascending: true })
      .limit(20);

    if (brandItems && brandItems.length > 0) {
      // Separate persona from knowledge
      const persona = brandItems.find((i: KnowledgeItem) => i.category === "brand_persona");
      const knowledge = brandItems.filter((i: KnowledgeItem) => i.category !== "brand_persona");

      if (persona) {
        sections.push(persona.content);
      }

      if (knowledge.length > 0) {
        const knowledgeBlock = knowledge
          .map((i: KnowledgeItem) => `### ${i.title_de}\n${i.content}`)
          .join("\n\n");
        sections.push(`\n## WISSENSBASIS — ${brandKey.toUpperCase()}\n\n${knowledgeBlock}`);
      }
    }
  }

  // 2. Fetch global Armstrong system knowledge (persona, tonality)
  const { data: globalItems } = await supabase
    .from("armstrong_knowledge_items")
    .select("item_code, category, title_de, content, phone_prompt_priority")
    .is("brand_key", null)
    .eq("status", "published")
    .eq("category", "system")
    .in("item_code", ["KB.SYSTEM.001", "KB.SYSTEM.006"]) // Armstrong identity + tonality
    .order("phone_prompt_priority", { ascending: true });

  if (globalItems && globalItems.length > 0 && sections.length === 0) {
    // Only use global persona if no brand persona exists
    sections.push("Du bist Armstrong, ein professioneller KI-Telefonassistent.");
  }

  // 3. If no knowledge found at all, use fallback
  if (sections.length === 0) {
    sections.push(
      assistant.behavior_prompt ||
      "Du bist ein freundlicher und professioneller Telefonassistent. Erfasse das Anliegen des Anrufers, notiere Kontaktdaten und organisiere einen Rückruf."
    );
  }

  // 4. Add call rules
  const rulesList: string[] = [];
  if (rules.collect_name) rulesList.push("Frage nach dem Namen des Anrufers falls unbekannt.");
  if (rules.collect_reason) rulesList.push("Frage nach dem Anliegen des Anrufers.");
  if (rules.collect_urgency) rulesList.push("Frage nach der Dringlichkeit.");
  if (rules.confirm_callback_number) rulesList.push("Bestätige die Rückrufnummer.");
  if (rules.collect_preferred_times) rulesList.push("Frage nach bevorzugten Rückrufzeiten.");
  if (rules.max_call_seconds) rulesList.push(`Maximale Gesprächsdauer: ${rules.max_call_seconds} Sekunden.`);

  if (rulesList.length > 0) {
    sections.push(`\n## GESPRÄCHSREGELN\n${rulesList.map(r => `- ${r}`).join("\n")}`);
  }

  // 5. Always add phone-specific formatting instructions
  sections.push(`
## FORMATIERUNG (TELEFON)
- Antworte auf Deutsch, kurz und natürlich (max 2-3 Sätze pro Antwort)
- Du wirst am Telefon vorgelesen, formuliere klar und ohne Sonderzeichen
- Keine Markdown, keine Aufzählungszeichen, keine URLs
- Wenn du eine Frage nicht beantworten kannst, biete an, eine Nachricht weiterzuleiten
- Beende das Gespräch freundlich wenn das Anliegen erfasst ist`);

  return sections.join("\n\n");
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/** Normalize DB values that may be stored as 0-100 integers to 0-1 floats */
function normalizePercent(value: any, fallback: number): number {
  if (value == null) return fallback;
  const n = Number(value);
  if (isNaN(n)) return fallback;
  return n > 1 ? n / 100 : n;
}
