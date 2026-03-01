import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return handleCorsPreflightRequest(req);
  const cors = getCorsHeaders(req);

  try {
    const { action, text, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    if (!action || !text?.trim()) {
      return new Response(JSON.stringify({ error: "action and text required" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const lang = language || "de";
    let systemPrompt = "";
    
    switch (action) {
      case "text_improve":
        systemPrompt = `Du bist ein professioneller E-Mail-Redakteur. Verbessere den folgenden E-Mail-Text stilistisch: professioneller Ton, klare Struktur, höflich aber direkt. Antworte NUR mit dem verbesserten Text, keine Erklärungen. Sprache: ${lang === "de" ? "Deutsch" : "English"}.`;
        break;
      case "text_shorten":
        systemPrompt = `Du bist ein E-Mail-Redakteur. Kürze den folgenden E-Mail-Text auf das Wesentliche. Behalte alle wichtigen Informationen, entferne Füllwörter und Redundanzen. Antworte NUR mit dem gekürzten Text, keine Erklärungen. Sprache: ${lang === "de" ? "Deutsch" : "English"}.`;
        break;
      case "suggest_subject":
        systemPrompt = `Du bist ein E-Mail-Redakteur. Schlage basierend auf dem folgenden E-Mail-Text einen kurzen, prägnanten Betreff vor (max. 60 Zeichen). Antworte NUR mit dem Betreff, ohne Anführungszeichen und ohne Erklärungen. Sprache: ${lang === "de" ? "Deutsch" : "English"}.`;
        break;
      case "quality_check":
        systemPrompt = `Du bist ein E-Mail-Qualitätsprüfer. Prüfe die folgende E-Mail auf:
1. Ton (professionell, höflich?)
2. Vollständigkeit (Grußformel, Betreff-Bezug, Call-to-Action vorhanden?)
3. Fehlende Informationen (Name, Kontaktdaten, Bezug?)
4. Offensichtliche Fehler (Tippfehler, fehlende Anrede, doppelte Worte?)

Antworte als kurze Checkliste mit Emojis (✅ = gut, ⚠️ = Verbesserungsvorschlag, ❌ = Problem).
Format: Eine Zeile pro Punkt, maximal 6 Zeilen. Sprache: ${lang === "de" ? "Deutsch" : "English"}.`;
        break;
      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400, headers: { ...cors, "Content-Type": "application/json" },
        });
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit erreicht, bitte versuchen Sie es gleich erneut." }), {
          status: 429, headers: { ...cors, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "KI-Credits aufgebraucht. Bitte Credits aufladen." }), {
          status: 402, headers: { ...cors, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", status, errText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content?.trim() || "";

    return new Response(JSON.stringify({ result }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sot-mail-ai-assist error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
