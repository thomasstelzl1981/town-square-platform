import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

/**
 * SOT NK-Beleg-Parse — P2.2
 * 
 * Specialized parseMode for utility bills (Nebenkostenbelege).
 * Extracts: provider, amount, period, cost category, meter readings.
 * 
 * Cost: 1 Credit per document
 * 
 * POST { documentId: UUID, propertyId?: UUID, unitId?: UUID }
 */

const NK_CREDITS = 1;

const NK_SYSTEM_PROMPT = `Du bist ein spezialisierter Parser für deutsche Nebenkostenbelege (Betriebskostenbelege).
Analysiere den Beleg und extrahiere EXAKT folgende Felder:

{
  "provider_name": "Name des Versorgers/Anbieters",
  "provider_type": "strom|gas|wasser|heizung|muell|versicherung|grundsteuer|hausverwaltung|sonstige",
  "billing_period_start": "YYYY-MM-DD",
  "billing_period_end": "YYYY-MM-DD",
  "total_amount": 123.45,
  "prepayment_amount": 100.00,
  "balance_amount": 23.45,
  "cost_category": "Heizkosten|Warmwasser|Kaltwasser|Abwasser|Strom Allgemein|Müllabfuhr|Grundsteuer|Gebäudeversicherung|Hausmeister|Gartenpflege|Aufzug|Sonstige",
  "meter_number": "Zählernummer falls vorhanden",
  "meter_reading_start": 12345.6,
  "meter_reading_end": 13456.7,
  "consumption_value": 1111.1,
  "consumption_unit": "kWh|m³|Liter",
  "confidence": 0.0-1.0,
  "summary": "Kurze Zusammenfassung"
}

REGELN:
- Alle Beträge in Euro als Dezimalzahl (NICHT als String)
- balance_amount: positiv = Nachzahlung, negativ = Guthaben
- Bei mehreren Positionen auf einem Beleg: Gesamtbetrag als total_amount
- provider_type MUSS einer der vorgegebenen Werte sein
- cost_category MUSS einer der vorgegebenen Werte sein
- Antworte NUR mit validem JSON, kein Markdown`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return handleCorsPreflightRequest(req);

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
    if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

    // Auth
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

    const { documentId, propertyId, unitId } = await req.json();
    if (!documentId) return json({ error: "Missing documentId" }, 400);

    const sbAdmin = createClient(supabaseUrl, serviceKey);

    // Load document
    const { data: doc, error: docErr } = await sbAdmin
      .from("documents")
      .select("id, name, file_path, mime_type, tenant_id")
      .eq("id", documentId)
      .eq("tenant_id", tenantId)
      .single();
    if (docErr || !doc) return json({ error: "Document not found" }, 404);

    // Credit Preflight
    const { data: preflight } = await sbAdmin.rpc("rpc_credit_preflight", {
      p_tenant_id: tenantId,
      p_required_credits: NK_CREDITS,
      p_action_code: "nk_beleg_parsing",
    });
    if (!preflight?.allowed) {
      return json({ error: "Insufficient credits", available: preflight?.available_credits }, 402);
    }

    // Get signed URL & fetch file
    const { data: signedUrlData, error: signErr } = await sbAdmin.storage
      .from("tenant-documents")
      .createSignedUrl(doc.file_path, 300);
    if (signErr || !signedUrlData?.signedUrl) return json({ error: "Could not create signed URL" }, 500);

    const fileRes = await fetch(signedUrlData.signedUrl);
    if (!fileRes.ok) return json({ error: "Could not fetch file" }, 500);

    const fileBytes = new Uint8Array(await fileRes.arrayBuffer());
    const base64 = btoa(String.fromCharCode(...fileBytes));
    const mimeType = doc.mime_type || "application/pdf";

    if (!lovableApiKey) return json({ error: "AI Gateway not configured" }, 500);

    // Gemini Vision extraction with NK-specific prompt
    const isVisual = mimeType.includes("image") || mimeType.includes("pdf");
    const messages = isVisual
      ? [
          { role: "system", content: NK_SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: `Analysiere diesen Nebenkostenbeleg: ${doc.name}` },
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
            ],
          },
        ]
      : [
          { role: "system", content: NK_SYSTEM_PROMPT },
          { role: "user", content: `Analysiere diesen Nebenkostenbeleg: ${doc.name}\n\nInhalt:\n${atob(base64).substring(0, 50000)}` },
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
        max_tokens: 4000,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI Gateway error:", aiRes.status, errText);
      return json({ error: `AI extraction failed (${aiRes.status})` }, 500);
    }

    const aiResult = await aiRes.json();
    const aiContent = aiResult.choices?.[0]?.message?.content || "";

    // Parse response
    let parsed: Record<string, unknown>;
    try {
      const jsonStr = aiContent.replace(/```json\n?/g, "").replace(/```\n?/g, "");
      parsed = JSON.parse(jsonStr.trim());
    } catch {
      parsed = { confidence: 0.2, summary: "Parsing fehlgeschlagen" };
    }

    const confidence = (parsed.confidence as number) || 0.5;

    // Store extraction in nk_beleg_extractions
    const { data: extraction, error: insertErr } = await sbAdmin
      .from("nk_beleg_extractions")
      .insert({
        tenant_id: tenantId,
        document_id: documentId,
        property_id: propertyId || null,
        unit_id: unitId || null,
        provider_name: parsed.provider_name as string || null,
        provider_type: parsed.provider_type as string || null,
        billing_period_start: parsed.billing_period_start as string || null,
        billing_period_end: parsed.billing_period_end as string || null,
        total_amount: parsed.total_amount as number || null,
        prepayment_amount: parsed.prepayment_amount as number || null,
        balance_amount: parsed.balance_amount as number || null,
        cost_category: parsed.cost_category as string || null,
        meter_number: parsed.meter_number as string || null,
        meter_reading_start: parsed.meter_reading_start as number || null,
        meter_reading_end: parsed.meter_reading_end as number || null,
        consumption_value: parsed.consumption_value as number || null,
        consumption_unit: parsed.consumption_unit as string || null,
        confidence,
        needs_review: confidence < 0.9,
        extractor_version: "1.0",
      })
      .select("id")
      .single();

    if (insertErr) {
      console.error("Insert error:", insertErr);
      return json({ error: "Failed to store extraction" }, 500);
    }

    // Update document metadata
    await sbAdmin
      .from("documents")
      .update({
        extraction_status: "done",
        doc_type: "utility_bill",
        summary: parsed.summary as string || `NK-Beleg: ${parsed.provider_name || "Unbekannt"}`,
      })
      .eq("id", documentId);

    // Deduct credit
    await sbAdmin.rpc("rpc_credit_deduct", {
      p_tenant_id: tenantId,
      p_credits: NK_CREDITS,
      p_action_code: "nk_beleg_parsing",
      p_ref_type: "nk_beleg_extraction",
      p_ref_id: extraction.id,
    });

    console.log(`[sot-nk-beleg-parse] Extracted ${doc.name}: ${parsed.provider_name}, ${parsed.total_amount}€, confidence ${confidence}`);

    return json({
      success: true,
      extraction_id: extraction.id,
      document_id: documentId,
      provider_name: parsed.provider_name,
      provider_type: parsed.provider_type,
      total_amount: parsed.total_amount,
      billing_period: `${parsed.billing_period_start} – ${parsed.billing_period_end}`,
      confidence,
      needs_review: confidence < 0.9,
      credits_used: NK_CREDITS,
    });
  } catch (err) {
    console.error("[sot-nk-beleg-parse] Error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
