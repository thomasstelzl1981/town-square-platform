import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { session_id } = await req.json();
    if (!session_id) throw new Error("session_id required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load session
    const { data: session, error: sessionErr } = await supabase
      .from("meeting_sessions")
      .select("*")
      .eq("id", session_id)
      .single();

    if (sessionErr || !session) throw new Error("Session not found");

    // Load all transcript chunks
    const { data: chunks } = await supabase
      .from("meeting_transcript_chunks")
      .select("text, seq")
      .eq("session_id", session_id)
      .order("seq", { ascending: true });

    const fullTranscript = (chunks || []).map((c: any) => c.text).join(" ");

    if (!fullTranscript.trim()) {
      // No transcript — create empty output
      await supabase.from("meeting_outputs").insert({
        session_id,
        summary_md: "Keine Transkription vorhanden.",
        action_items_json: [],
        decisions_json: [],
        open_questions_json: [],
      });
      await supabase.from("meeting_sessions").update({ status: "ready" }).eq("id", session_id);

      return new Response(JSON.stringify({ ok: true, empty: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Summarize with Lovable AI (Gemini)
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        max_tokens: 8000,
        messages: [
          {
            role: "system",
            content: `Du bist ein Meeting-Protokoll-Assistent. Analysiere das folgende Transkript einer physischen Besprechung und erstelle:

1. Eine strukturierte Zusammenfassung in Markdown (summary_md)
2. Eine Liste von Aufgaben/Action Items als JSON-Array (action_items_json) mit Feldern: title, description, owner (optional), priority (low/medium/high)
3. Eine Liste der getroffenen Entscheidungen als JSON-Array (decisions_json) mit Feld: text
4. Eine Liste offener Punkte/Fragen als JSON-Array (open_questions_json) mit Feld: text

Antworte NUR mit einem validen JSON-Objekt mit den Feldern: summary_md, action_items_json, decisions_json, open_questions_json.
Keine weitere Erklärung, kein Markdown-Block — nur reines JSON.`,
          },
          {
            role: "user",
            content: `Meeting-Titel: ${session.title}\n\nTranskript:\n${fullTranscript}`,
          },
        ],
        temperature: 0.3,
      }),
    });

    let result = { summary_md: "", action_items_json: [], decisions_json: [], open_questions_json: [] };

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      const content = aiData.choices?.[0]?.message?.content || "";
      try {
        // Try to parse JSON from the response
        const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
        result = JSON.parse(cleaned);
      } catch {
        result.summary_md = content;
      }
    } else {
      result.summary_md = `Zusammenfassung konnte nicht erstellt werden. Transkript (${fullTranscript.length} Zeichen) vorhanden.`;
    }

    // Save output
    await supabase.from("meeting_outputs").insert({
      session_id,
      summary_md: result.summary_md,
      action_items_json: result.action_items_json || [],
      decisions_json: result.decisions_json || [],
      open_questions_json: result.open_questions_json || [],
    });

    // Create task widget on dashboard
    await supabase.from("task_widgets").insert({
      tenant_id: session.tenant_id,
      user_id: session.user_id,
      type: "meeting_protocol",
      title: `Protokoll: ${session.title}`,
      description: typeof result.summary_md === 'string' 
        ? result.summary_md.substring(0, 200) 
        : 'Meeting-Protokoll erstellt',
      status: "pending",
      risk_level: "low",
      cost_model: "free",
      source: "meeting_recorder",
      source_ref: session_id,
      parameters: { session_id },
    });

    // Update session status
    await supabase.from("meeting_sessions").update({ status: "ready" }).eq("id", session_id);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[sot-meeting-summarize] Error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
