import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

/**
 * SOT Finance Prepare — P0
 * 
 * AI-powered financing preparation that bundles all required bank documents
 * and generates a completeness report + structured financing summary.
 * 
 * Collects from:
 * - applicant_profiles (Selbstauskunft)
 * - properties (Objektdaten)
 * - finance_requests (existing loan data)
 * - documents + document_links (uploaded evidence)
 * - household_persons (wealth overview)
 * 
 * POST { financeRequestId?: UUID, propertyId?: UUID, applicantProfileId?: UUID }
 * 
 * Cost: 2 Credits
 */

const FINANCE_CREDITS = 2;

const FINANCE_SYSTEM_PROMPT = `Du bist ein erfahrener Finanzierungsberater und erstellst strukturierte Bankunterlagen-Pakete für Immobilienfinanzierungen in Deutschland.

Basierend auf den bereitgestellten Daten erstelle:

1. VOLLSTÄNDIGKEITS-CHECK: Prüfe welche Unterlagen für einen Bankantrag vorhanden und welche noch fehlen.

2. FINANZIERUNGS-ZUSAMMENFASSUNG: Strukturierte Übersicht für die Bank.

3. EMPFEHLUNGEN: Konkrete Verbesserungsvorschläge.

Antworte mit folgendem JSON:
{
  "completeness_score": 0-100,
  "completeness_details": {
    "personal_data": { "score": 0-100, "missing": ["Liste fehlender Felder"], "status": "complete|partial|missing" },
    "income_proof": { "score": 0-100, "missing": ["Liste fehlender Dokumente"], "status": "complete|partial|missing" },
    "property_data": { "score": 0-100, "missing": ["Liste fehlender Objektdaten"], "status": "complete|partial|missing" },
    "equity_proof": { "score": 0-100, "missing": ["Liste fehlender Nachweise"], "status": "complete|partial|missing" },
    "documents": { "score": 0-100, "missing": ["Liste fehlender Dokumente"], "status": "complete|partial|missing" }
  },
  
  "financing_summary": {
    "purchase_price": 0,
    "equity_amount": 0,
    "equity_ratio_pct": 0,
    "loan_amount_needed": 0,
    "estimated_monthly_rate": 0,
    "net_income_monthly": 0,
    "debt_service_ratio_pct": 0,
    "existing_liabilities_monthly": 0,
    "free_income_after_service": 0
  },
  
  "risk_assessment": {
    "overall": "low|medium|high",
    "factors": [
      { "factor": "Beschreibung", "impact": "positive|neutral|negative", "detail": "Erklärung" }
    ]
  },
  
  "missing_documents": [
    { "document_type": "Typ", "priority": "required|recommended|optional", "description": "Was genau benötigt wird" }
  ],
  
  "recommendations": [
    { "category": "Kategorie", "suggestion": "Konkreter Vorschlag", "impact": "Erwarteter Effekt" }
  ],
  
  "bank_ready": true|false,
  "confidence": 0.0-1.0,
  "warnings": []
}

REGELN:
- Debt-Service-Ratio: monatliche Kreditrate / Nettoeinkommen * 100 (Ziel: < 35%)
- Eigenkapitalquote: Eigenkapital / Kaufpreis * 100 (Ideal: > 20%)
- Berücksichtige Kaufnebenkosten (ca. 10-15% je nach Bundesland)
- Prüfe ob Selbstauskunft vollständig ist (alle Pflichtfelder)
- Prüfe ob Einkommensnachweise vorhanden (letzte 3 Gehaltsabrechnungen)
- bank_ready = true nur wenn completeness_score >= 80 und alle required Documents vorhanden`;

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

    const { data: userProfile } = await sbUser
      .from("profiles")
      .select("active_tenant_id")
      .eq("id", user.id)
      .maybeSingle();
    if (!userProfile?.active_tenant_id) return json({ error: "No active tenant" }, 400);
    const tenantId = userProfile.active_tenant_id;

    const { financeRequestId, propertyId, applicantProfileId } = await req.json();
    if (!financeRequestId && !propertyId && !applicantProfileId) {
      return json({ error: "Provide financeRequestId, propertyId, or applicantProfileId" }, 400);
    }

    const sbAdmin = createClient(supabaseUrl, serviceKey);

    // Credit Preflight
    const { data: preflight } = await sbAdmin.rpc("rpc_credit_preflight", {
      p_tenant_id: tenantId,
      p_required_credits: FINANCE_CREDITS,
      p_action_code: "finance_preparation",
    });
    if (!preflight?.allowed) {
      return json({ error: "Insufficient credits", available: preflight?.available_credits }, 402);
    }

    // ── Gather all data ──
    const context: Record<string, unknown> = {};

    // 1) Finance Request
    if (financeRequestId) {
      const { data: fr } = await sbAdmin
        .from("finance_requests")
        .select("*")
        .eq("id", financeRequestId)
        .eq("tenant_id", tenantId)
        .maybeSingle();
      if (fr) context.finance_request = fr;
    }

    // 2) Property
    const propId = propertyId || (context.finance_request as any)?.property_id;
    if (propId) {
      const { data: prop } = await sbAdmin
        .from("properties")
        .select("id, address, city, postal_code, property_type, purchase_price, market_value, year_built, total_area_sqm, units_count, energy_class, energy_source, heating_type")
        .eq("id", propId)
        .eq("tenant_id", tenantId)
        .maybeSingle();
      if (prop) context.property = prop;

      // Units
      const { data: units } = await sbAdmin
        .from("units")
        .select("id, label, area_sqm, rooms, monthly_rent, is_rented")
        .eq("property_id", propId)
        .eq("tenant_id", tenantId);
      if (units?.length) context.units = units;

      // Existing loans
      const { data: loans } = await sbAdmin
        .from("finance_requests")
        .select("id, bank_name, loan_amount, interest_rate, repayment_rate, monthly_rate, loan_start, fixed_rate_end, status")
        .eq("property_id", propId)
        .eq("tenant_id", tenantId);
      if (loans?.length) context.existing_loans = loans;
    }

    // 3) Applicant Profile(s)
    const apId = applicantProfileId || (context.finance_request as any)?.id;
    if (apId || financeRequestId) {
      const query = sbAdmin
        .from("applicant_profiles")
        .select("first_name, last_name, birth_date, email, phone, address_street, address_city, address_postal_code, employment_type, employer_name, net_income_monthly, bonus_yearly, other_regular_income_monthly, equity_amount, equity_source, bank_savings, securities_value, life_insurance_value, current_rent_monthly, children_count, marital_status, completion_score, party_role")
        .eq("tenant_id", tenantId);

      if (financeRequestId) {
        query.eq("finance_request_id", financeRequestId);
      } else if (applicantProfileId) {
        query.eq("id", applicantProfileId);
      }

      const { data: profiles } = await query;
      if (profiles?.length) context.applicant_profiles = profiles;
    }

    // 4) Liabilities
    if (applicantProfileId) {
      const { data: liabilities } = await sbAdmin
        .from("applicant_liabilities")
        .select("liability_type, creditor_name, remaining_balance, monthly_rate, interest_rate_fixed_until")
        .eq("applicant_profile_id", applicantProfileId)
        .eq("tenant_id", tenantId);
      if (liabilities?.length) context.liabilities = liabilities;
    }

    // 5) Property assets
    if (applicantProfileId) {
      const { data: propAssets } = await sbAdmin
        .from("applicant_property_assets")
        .select("address, property_type, estimated_value, net_rent_monthly, loan1_balance, loan1_rate_monthly, loan2_balance, loan2_rate_monthly")
        .eq("applicant_profile_id", applicantProfileId)
        .eq("tenant_id", tenantId);
      if (propAssets?.length) context.property_assets = propAssets;
    }

    // 6) Uploaded documents check
    if (propId) {
      const { data: docLinks } = await sbAdmin
        .from("document_links")
        .select("slot_key, object_type, documents(name, doc_type, mime_type)")
        .eq("object_id", propId)
        .eq("object_type", "property")
        .eq("tenant_id", tenantId)
        .eq("link_status", "linked");
      if (docLinks?.length) context.uploaded_documents = docLinks;
    }

    if (!lovableApiKey) return json({ error: "AI Gateway not configured" }, 500);

    // ── AI Analysis ──
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          { role: "system", content: FINANCE_SYSTEM_PROMPT },
          {
            role: "user",
            content: `Analysiere diese Finanzierungsdaten und erstelle ein Bankunterlagen-Paket:\n\n${JSON.stringify(context, null, 2)}`,
          },
        ],
        temperature: 0.2,
        max_tokens: 16000,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI Gateway error:", aiRes.status, errText);
      if (aiRes.status === 429) return json({ error: "Rate limit exceeded" }, 429);
      if (aiRes.status === 402) return json({ error: "Payment required" }, 402);
      return json({ error: `AI analysis failed (${aiRes.status})` }, 500);
    }

    const aiResult = await aiRes.json();
    const aiContent = aiResult.choices?.[0]?.message?.content || "";

    let analysis: Record<string, unknown>;
    try {
      const jsonStr = aiContent.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      analysis = JSON.parse(jsonStr);
    } catch {
      console.error("[sot-finance-prepare] JSON parse failed:", aiContent.substring(0, 500));
      return json({ error: "AI response could not be parsed" }, 500);
    }

    // Store structured data
    if (propId) {
      await sbAdmin.from("document_structured_data").insert({
        tenant_id: tenantId,
        document_id: null as any, // no specific document
        doc_category: 'finance_preparation',
        extracted_fields: analysis,
        property_id: propId,
        confidence: (analysis.confidence as number) || 0.7,
        needs_review: !(analysis.bank_ready as boolean),
        extractor_version: '1.0',
      }).then(res => {
        if (res.error) console.error("[sot-finance-prepare] Structured data insert error:", res.error);
      });
    }

    // Deduct credits
    await sbAdmin.rpc("rpc_credit_deduct", {
      p_tenant_id: tenantId,
      p_credits: FINANCE_CREDITS,
      p_action_code: "finance_preparation",
      p_ref_type: "finance_request",
      p_ref_id: financeRequestId || propId || applicantProfileId,
    });

    console.log(`[sot-finance-prepare] Prepared financing package: completeness ${analysis.completeness_score}%, bank_ready: ${analysis.bank_ready}`);

    return json({
      success: true,
      ...analysis,
      credits_used: FINANCE_CREDITS,
    });
  } catch (err) {
    console.error("[sot-finance-prepare] Error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
