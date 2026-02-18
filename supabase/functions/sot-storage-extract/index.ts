import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

/**
 * SOT Storage Extract — P2.1
 * 
 * Extracts text/data from an existing document in tenant-documents storage
 * using Gemini Vision. Creates document_chunks for full-text search.
 * 
 * Cost: 1 Credit per document
 * 
 * POST { documentId: UUID }
 *   1. Credit Preflight (1 Credit)
 *   2. Signed URL for document
 *   3. Gemini Vision extraction
 *   4. Store chunks in document_chunks
 *   5. Update documents.extraction_status
 *   6. Deduct credit
 */

const EXTRACTION_CREDITS = 1;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

  const json = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    if (req.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    // ─── Auth ───
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing authorization" }, 401);

    const sbUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: ue } = await sbUser.auth.getUser();
    if (ue || !user) return json({ error: "Invalid user" }, 401);

    const { data: profile } = await sbUser
      .from("profiles")
      .select("active_tenant_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.active_tenant_id) return json({ error: "No active tenant" }, 400);
    const tenantId = profile.active_tenant_id;

    const { documentId } = await req.json();
    if (!documentId) return json({ error: "Missing documentId" }, 400);

    const sbAdmin = createClient(supabaseUrl, serviceKey);

    // ─── 1. Load document ───
    const { data: doc, error: docErr } = await sbAdmin
      .from("documents")
      .select("id, name, file_path, mime_type, size_bytes, tenant_id, extraction_status")
      .eq("id", documentId)
      .eq("tenant_id", tenantId)
      .single();

    if (docErr || !doc) return json({ error: "Document not found" }, 404);

    if (doc.extraction_status === "completed") {
      return json({ error: "Document already extracted", status: doc.extraction_status }, 409);
    }

    // ─── 2. Credit Preflight ───
    const { data: preflight, error: pfErr } = await sbAdmin.rpc("rpc_credit_preflight", {
      p_tenant_id: tenantId,
      p_required_credits: EXTRACTION_CREDITS,
      p_action_code: "storage_extraction",
    });

    if (pfErr) {
      console.error("Preflight error:", pfErr);
      return json({ error: "Credit check failed" }, 500);
    }

    if (!preflight?.allowed) {
      return json({
        error: "Insufficient credits",
        available: preflight?.available_credits,
        required: EXTRACTION_CREDITS,
      }, 402);
    }

    // ─── 3. Mark as processing ───
    await sbAdmin
      .from("documents")
      .update({ extraction_status: "processing" })
      .eq("id", documentId);

    // ─── 4. Get signed URL ───
    const { data: signedUrlData, error: signErr } = await sbAdmin.storage
      .from("tenant-documents")
      .createSignedUrl(doc.file_path, 300); // 5 min

    if (signErr || !signedUrlData?.signedUrl) {
      await sbAdmin.from("documents").update({ extraction_status: "error" }).eq("id", documentId);
      return json({ error: "Could not create signed URL" }, 500);
    }

    // ─── 5. Fetch file & convert to base64 ───
    const fileRes = await fetch(signedUrlData.signedUrl);
    if (!fileRes.ok) {
      await sbAdmin.from("documents").update({ extraction_status: "error" }).eq("id", documentId);
      return json({ error: "Could not fetch file" }, 500);
    }

    const fileBytes = new Uint8Array(await fileRes.arrayBuffer());
    const base64 = btoa(String.fromCharCode(...fileBytes));
    const mimeType = doc.mime_type || "application/pdf";

    // ─── 6. Gemini Vision extraction ───
    if (!lovableApiKey) {
      await sbAdmin.from("documents").update({ extraction_status: "error" }).eq("id", documentId);
      return json({ error: "AI Gateway not configured" }, 500);
    }

    const systemPrompt = `Du bist ein spezialisierter Dokumenten-Parser für Immobiliendaten.
Analysiere das Dokument und extrahiere:
1. Den vollständigen Text (für Volltextsuche)
2. Strukturierte Daten (Immobilien, Kontakte, Finanzen)
3. Dokumententyp

Antworte NUR mit validem JSON:
{
  "full_text": "Der gesamte extrahierte Text...",
  "confidence": 0.0-1.0,
  "detected_type": "portfolio|contract|invoice|letter|insurance|tax|utility_bill|other",
  "summary": "Kurze Zusammenfassung (max 200 Zeichen)",
  "key_data": {
    "properties": [...],
    "contacts": [...],
    "amounts": [{"label": "...", "value": 123.45}]
  }
}`;

    const isVisual = mimeType.includes("image") || mimeType.includes("pdf");
    const messages = isVisual
      ? [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: `Analysiere: ${doc.name}` },
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
            ],
          },
        ]
      : [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analysiere: ${doc.name}\n\nInhalt:\n${atob(base64).substring(0, 50000)}` },
        ];

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages,
        temperature: 0.1,
        max_tokens: 8000,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI Gateway error:", aiRes.status, errText);
      await sbAdmin.from("documents").update({ extraction_status: "error" }).eq("id", documentId);
      return json({ error: `AI extraction failed (${aiRes.status})` }, 500);
    }

    const aiResult = await aiRes.json();
    const aiContent = aiResult.choices?.[0]?.message?.content || "";

    // Parse AI response
    let parsed: { full_text: string; confidence: number; detected_type: string; summary: string; key_data: Record<string, unknown> };
    try {
      let jsonStr = aiContent.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      parsed = JSON.parse(jsonStr.trim());
    } catch {
      parsed = {
        full_text: aiContent,
        confidence: 0.3,
        detected_type: "other",
        summary: "Extraktion teilweise erfolgreich",
        key_data: {},
      };
    }

    // ─── 7. Store chunks ───
    const fullText = parsed.full_text || aiContent;
    const chunkSize = 1000;
    const chunks: { tenant_id: string; document_id: string; text: string; page_number: number; chunk_index: number }[] = [];

    for (let i = 0; i < fullText.length; i += chunkSize) {
      chunks.push({
        tenant_id: tenantId,
        document_id: documentId,
        text: fullText.substring(i, i + chunkSize),
        page_number: Math.floor(i / chunkSize) + 1,
        chunk_index: chunks.length,
      });
    }

    if (chunks.length > 0) {
      // Delete existing chunks first
      await sbAdmin.from("document_chunks").delete().eq("document_id", documentId);
      await sbAdmin.from("document_chunks").insert(chunks);
    }

    // ─── 8. Update document ───
    await sbAdmin
      .from("documents")
      .update({
        extraction_status: "completed",
        doc_type: parsed.detected_type || null,
        summary: parsed.summary || null,
      })
      .eq("id", documentId);

    // ─── 9. Deduct credit ───
    await sbAdmin.rpc("rpc_credit_deduct", {
      p_tenant_id: tenantId,
      p_credits: EXTRACTION_CREDITS,
      p_action_code: "storage_extraction",
      p_ref_type: "document",
      p_ref_id: documentId,
    });

    console.log(`[sot-storage-extract] Extracted ${doc.name}: ${chunks.length} chunks, confidence ${parsed.confidence}`);

    return json({
      success: true,
      document_id: documentId,
      chunks_created: chunks.length,
      confidence: parsed.confidence,
      detected_type: parsed.detected_type,
      summary: parsed.summary,
      credits_used: EXTRACTION_CREDITS,
    });
  } catch (err) {
    console.error("[sot-storage-extract] Error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
