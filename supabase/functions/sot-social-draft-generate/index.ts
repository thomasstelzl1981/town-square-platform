/**
 * sot-social-draft-generate — Generates draft posts from inbound items
 * Phase 7: Uses personality_vector + topics + patterns to create multi-platform content
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { inbound_item_id, tenant_id } = await req.json();
    if (!inbound_item_id || !tenant_id) {
      return new Response(JSON.stringify({ error: "Missing params" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Fetch inbound item
    const { data: item } = await supabase.from("social_inbound_items").select("*").eq("id", inbound_item_id).single();
    if (!item) throw new Error("Item not found");

    // Fetch personality + topics
    const [{ data: profile }, { data: topics }] = await Promise.all([
      supabase.from("social_personality_profiles").select("personality_vector").eq("tenant_id", tenant_id).limit(1).maybeSingle(),
      supabase.from("social_topics").select("topic_label").eq("tenant_id", tenant_id).order("priority").limit(5),
    ]);

    const personality = profile?.personality_vector || {};
    const topicLabels = (topics || []).map((t: any) => t.topic_label);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI not configured");

    const prompt = `Erstelle Social-Media-Posts basierend auf diesem Moment:
Headline: "${item.one_liner || ''}"
Story: "${item.moment_voice_text || ''}"
Gewünschter Effekt: ${item.desired_effect || 'authority'}
Persönlichkeitsgrad: ${item.personal_level || 5}/10

Persönlichkeitsprofil: ${JSON.stringify(personality)}
Themen-Fokus: ${topicLabels.join(', ') || 'allgemein'}

Nutze das Tool "draft_result".`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Du bist ein Social-Media-Ghostwriter. Erstelle authentische, plattformgerechte Posts auf Deutsch." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "draft_result",
            description: "Multi-platform draft content",
            parameters: {
              type: "object",
              properties: {
                draft_title: { type: "string" },
                content_linkedin: { type: "string" },
                content_instagram: { type: "string" },
                content_facebook: { type: "string" },
              },
              required: ["draft_title", "content_linkedin", "content_instagram", "content_facebook"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "draft_result" } },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) return new Response(JSON.stringify({ error: "Rate limit" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (resp.status === 402) return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI error: ${resp.status}`);
    }

    const data = await resp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    let draft = { draft_title: "", content_linkedin: "", content_instagram: "", content_facebook: "" };
    if (toolCall?.function?.arguments) {
      draft = JSON.parse(toolCall.function.arguments);
    }

    // Save draft
    await supabase.from("social_drafts").insert({
      tenant_id,
      owner_user_id: item.owner_user_id,
      inbound_item_id,
      draft_title: draft.draft_title,
      content_linkedin: draft.content_linkedin,
      content_instagram: draft.content_instagram,
      content_facebook: draft.content_facebook,
      origin: "inbound",
      status: "draft",
      platform_targets: ["linkedin", "instagram", "facebook"],
      generation_metadata: { model: "gemini-3-flash", source: "inbound" },
    });

    return new Response(JSON.stringify({ success: true, draft }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Draft generate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
