import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

/**
 * SOT Invoice Parser — P0
 * 
 * AI-powered invoice extraction and auto-assignment to properties + NK categories.
 * 
 * Features:
 * - Extracts vendor, amounts, dates, VAT, IBAN from any invoice PDF/image
 * - Auto-matches to property via vendor history, address matching, amount patterns
 * - Maps to NK cost category for automatic Nebenkostenabrechnung integration
 * 
 * POST { documentId: UUID, propertyId?: UUID }
 * 
 * Cost: 1 Credit per document
 */

const INVOICE_CREDITS = 1;

const INVOICE_SYSTEM_PROMPT = `Du bist ein spezialisierter Parser für deutsche Rechnungen im Immobilienkontext.

Analysiere die Rechnung und extrahiere EXAKT die folgenden Felder:

{
  "vendor_name": "Firmenname des Rechnungsstellers",
  "vendor_address": "Vollständige Adresse des Rechnungsstellers",
  "invoice_number": "Rechnungsnummer",
  "invoice_date": "YYYY-MM-DD",
  "due_date": "YYYY-MM-DD oder null",
  "total_gross": 123.45,
  "total_net": 103.74,
  "vat_amount": 19.71,
  "vat_rate": 19.0,
  "currency": "EUR",
  "purpose": "Kurzbeschreibung des Rechnungsgegenstands",
  "iban": "IBAN des Rechnungsstellers",
  
  "billing_period_start": "YYYY-MM-DD oder null",
  "billing_period_end": "YYYY-MM-DD oder null",
  
  "property_hints": {
    "address_mentioned": "Objektadresse falls auf der Rechnung erwähnt",
    "unit_mentioned": "Wohnungsnr. oder Einheit falls erwähnt",
    "account_number": "Kundennummer oder Vertragsnummer"
  },
  
  "nk_category_suggestion": "Eine der folgenden Kategorien oder null",
  "nk_category_reasoning": "Kurze Begründung für die Kategorie-Zuordnung",
  
  "line_items": [
    {
      "description": "Positionsbeschreibung",
      "quantity": 1,
      "unit_price": 100.00,
      "total": 100.00
    }
  ],
  
  "confidence": 0.0-1.0,
  "warnings": []
}

GÜLTIGE NK-KATEGORIEN:
- wasser: Wasserversorgung, Stadtwerke Wasser
- abwasser: Abwassergebühren, Entwässerung
- heizung: Heizkosten, Gas, Fernwärme, Heizöl
- warmwasser: Warmwasserbereitung
- muell: Müllabfuhr, Abfallgebühren
- strassenreinigung: Straßenreinigung, Winterdienst
- gebaeudereinigung: Gebäudereinigung, Treppenhausreinigung
- gartenpflege: Gartenpflege, Grünpflege
- beleuchtung: Allgemeinstrom, Hausstrom
- schornsteinfeger: Schornsteinfeger, Emissionsmessung
- sachversicherung: Gebäudeversicherung, Wohngebäudeversicherung
- hausmeister: Hausmeisterdienst
- grundsteuer: Grundsteuerbescheid
- aufzug: Aufzugswartung
- antenne_kabel: Kabelanschluss
- instandhaltung: Reparatur, Handwerker (NICHT umlagefähig)
- verwaltung: Verwaltergebühr (NICHT umlagefähig)
- null: Nicht zuordbar oder keine Nebenkosten-Rechnung

REGELN:
- Alle Beträge in Euro als Dezimalzahl
- IBAN ohne Leerzeichen
- Wenn Felder nicht erkennbar: null setzen
- property_hints: Alles extrahieren, was auf ein Objekt hinweist
- Antworte NUR mit validem JSON`;

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

    const { documentId, propertyId } = await req.json();
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
      p_required_credits: INVOICE_CREDITS,
      p_action_code: "invoice_parsing",
    });
    if (!preflight?.allowed) {
      return json({ error: "Insufficient credits", available: preflight?.available_credits }, 402);
    }

    // Fetch file
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

    // AI extraction
    const messages = [
      { role: "system", content: INVOICE_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: `Analysiere diese Rechnung: "${doc.name}"` },
          { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
        ],
      },
    ];

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages,
        temperature: 0.1,
        max_tokens: 16000,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI Gateway error:", aiRes.status, errText);
      if (aiRes.status === 429) return json({ error: "Rate limit exceeded" }, 429);
      if (aiRes.status === 402) return json({ error: "Payment required" }, 402);
      return json({ error: `AI extraction failed (${aiRes.status})` }, 500);
    }

    const aiResult = await aiRes.json();
    const aiContent = aiResult.choices?.[0]?.message?.content || "";

    let parsed: Record<string, unknown>;
    try {
      const jsonStr = aiContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error("[sot-invoice-parse] JSON parse failed:", aiContent.substring(0, 500));
      return json({ error: "AI response could not be parsed" }, 500);
    }

    const confidence = (parsed.confidence as number) || 0.5;
    const propertyHints = (parsed.property_hints as Record<string, string>) || {};

    // ── Auto-match to property ──
    let matchedPropertyId = propertyId || null;
    let matchMethod: string | null = null;
    let matchConfidence = 0;

    if (!matchedPropertyId && propertyHints.address_mentioned) {
      // Try address matching
      const { data: properties } = await sbAdmin
        .from("properties")
        .select("id, address, city")
        .eq("tenant_id", tenantId);

      if (properties) {
        const hintAddr = (propertyHints.address_mentioned || '').toLowerCase();
        for (const prop of properties) {
          const propAddr = `${prop.address || ''} ${prop.city || ''}`.toLowerCase();
          if (hintAddr.includes(propAddr) || propAddr.includes(hintAddr)) {
            matchedPropertyId = prop.id;
            matchMethod = 'address_match';
            matchConfidence = 0.8;
            break;
          }
        }
      }
    }

    if (!matchedPropertyId && parsed.vendor_name) {
      // Try vendor matching against existing NK beleg extractions
      const { data: existingExtractions } = await sbAdmin
        .from("nk_beleg_extractions")
        .select("property_id, provider_name")
        .eq("tenant_id", tenantId)
        .not("property_id", "is", null)
        .limit(100);

      if (existingExtractions) {
        const vendorName = (parsed.vendor_name as string).toLowerCase();
        const match = existingExtractions.find(e =>
          e.provider_name && vendorName.includes(e.provider_name.toLowerCase())
        );
        if (match?.property_id) {
          matchedPropertyId = match.property_id;
          matchMethod = 'vendor_match';
          matchConfidence = 0.75;
        }
      }
    }

    if (propertyId && !matchMethod) {
      matchMethod = 'manual';
      matchConfidence = 1.0;
    }

    // ── Store invoice extraction ──
    const { data: extraction, error: insertErr } = await sbAdmin
      .from("invoice_extractions")
      .insert({
        tenant_id: tenantId,
        document_id: documentId,
        property_id: matchedPropertyId,
        vendor_name: parsed.vendor_name as string || null,
        vendor_address: parsed.vendor_address as string || null,
        invoice_number: parsed.invoice_number as string || null,
        invoice_date: parsed.invoice_date as string || null,
        due_date: parsed.due_date as string || null,
        total_gross: parsed.total_gross as number || null,
        total_net: parsed.total_net as number || null,
        vat_amount: parsed.vat_amount as number || null,
        vat_rate: parsed.vat_rate as number || null,
        currency: parsed.currency as string || 'EUR',
        purpose: parsed.purpose as string || null,
        iban: parsed.iban as string || null,
        nk_cost_category: parsed.nk_category_suggestion as string || null,
        billing_period_start: parsed.billing_period_start as string || null,
        billing_period_end: parsed.billing_period_end as string || null,
        match_status: matchedPropertyId ? 'auto_matched' : 'needs_review',
        match_confidence: matchConfidence,
        match_method: matchMethod,
        ai_raw_response: parsed,
        extractor_version: '1.0',
      })
      .select("id")
      .single();

    if (insertErr) {
      console.error("[sot-invoice-parse] Insert error:", insertErr);
      return json({ error: "Failed to store extraction", detail: insertErr.message }, 500);
    }

    // Update document
    await sbAdmin
      .from("documents")
      .update({
        extraction_status: "done",
        doc_type: "rechnung",
        summary: `Rechnung: ${parsed.vendor_name || 'Unbekannt'} — ${parsed.total_gross || '?'}€`,
      })
      .eq("id", documentId);

    // Deduct credit
    await sbAdmin.rpc("rpc_credit_deduct", {
      p_tenant_id: tenantId,
      p_credits: INVOICE_CREDITS,
      p_action_code: "invoice_parsing",
      p_ref_type: "invoice_extraction",
      p_ref_id: extraction.id,
    });

    console.log(`[sot-invoice-parse] Parsed ${doc.name}: ${parsed.vendor_name}, ${parsed.total_gross}€, match: ${matchMethod || 'none'}`);

    return json({
      success: true,
      extraction_id: extraction.id,
      document_id: documentId,
      vendor_name: parsed.vendor_name,
      total_gross: parsed.total_gross,
      nk_category: parsed.nk_category_suggestion,
      property_matched: !!matchedPropertyId,
      property_id: matchedPropertyId,
      match_method: matchMethod,
      match_confidence: matchConfidence,
      confidence,
      needs_review: !matchedPropertyId || confidence < 0.85,
      credits_used: INVOICE_CREDITS,
    });
  } catch (err) {
    console.error("[sot-invoice-parse] Error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
