import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * SOT Discovery Scheduler
 * 
 * Automatisierte tägliche Kontaktanreicherung.
 * Läuft via pg_cron (06:00 UTC) oder manuell via POST.
 * 
 * 3-Schicht-Dedupe:
 *   1. Intra-Batch (buildDedupeKey)
 *   2. Cross-Order (dedupe_hash unique index)
 *   3. Kontaktbuch (contacts-Tabelle)
 * 
 * Credit-Preflight vor jedem Batch.
 */

// ─── Engine Logic (inlined for Edge Function context) ───

function normalizePhone(raw: string | null | undefined): string {
  if (!raw) return '';
  let cleaned = raw.trim();
  const hasPlus = cleaned.startsWith('+');
  cleaned = cleaned.replace(/[^\d]/g, '');
  if (hasPlus) return '+' + cleaned;
  if (cleaned.startsWith('0') && cleaned.length >= 6) return '+49' + cleaned.slice(1);
  if (cleaned.startsWith('49') && cleaned.length >= 10) return '+' + cleaned;
  return cleaned || '';
}

function normalizeDomain(url: string | null | undefined): string {
  if (!url) return '';
  let cleaned = url.trim().toLowerCase();
  cleaned = cleaned.replace(/^https?:\/\//, '');
  cleaned = cleaned.replace(/^www\./, '');
  cleaned = cleaned.split('/')[0].split('?')[0].split('#')[0];
  return cleaned.replace(/\.$/, '');
}

function splitName(fullName: string): { salutation?: string; firstName?: string; lastName?: string } {
  if (!fullName?.trim()) return {};
  const parts = fullName.trim().replace(/\s+/g, ' ').split(' ');
  const salutations: Record<string, string> = { 'herr': 'Herr', 'hr.': 'Herr', 'frau': 'Frau', 'fr.': 'Frau' };
  let salutation: string | undefined;
  let startIdx = 0;
  const firstLower = parts[0].toLowerCase();
  if (salutations[firstLower]) { salutation = salutations[firstLower]; startIdx = 1; }
  const remaining = parts.slice(startIdx);
  if (remaining.length === 0) return { salutation };
  if (remaining.length === 1) return { salutation, lastName: remaining[0] };
  return { salutation, firstName: remaining[0], lastName: remaining.slice(1).join(' ') };
}

function buildDedupeKey(c: { email?: string; phoneE164?: string; lastName?: string; postalCode?: string }): string {
  return [c.email?.toLowerCase().trim() || '', c.phoneE164 || '', c.lastName?.toLowerCase().trim() || '', c.postalCode || ''].join('|');
}

function calcConfidenceScore(c: { firstName?: string; lastName?: string; company?: string; street?: string; postalCode?: string; city?: string; phoneE164?: string; domain?: string; email?: string }, sourceCount = 1): number {
  let score = 0;
  if (c.company) score += 0.1;
  if (c.firstName && c.lastName) score += 0.15;
  else if (c.lastName) score += 0.075;
  if (c.city) score += 0.06;
  if (c.postalCode) score += 0.06;
  if (c.street) score += 0.08;
  if (c.phoneE164 && c.phoneE164.startsWith('+') && c.phoneE164.length >= 10) score += 0.15;
  else if (c.phoneE164 && c.phoneE164.length >= 6) score += 0.075;
  if (c.domain && c.domain.includes('.')) score += 0.15;
  else if (c.email && c.email.includes('@')) score += 0.09;
  if (sourceCount >= 3) score += 0.1;
  else if (sourceCount >= 2) score += 0.06;
  else score += 0.03;
  const filledFields = [c.firstName, c.lastName, c.company, c.email, c.phoneE164, c.domain, c.city].filter(Boolean).length;
  score += Math.min(0.15, (filledFields / 5) * 0.15);
  return Math.round(Math.max(0, Math.min(1, score)) * 100) / 100;
}

// ─── Category Registry with strategy info ───
interface SchedulerCategory {
  code: string;
  label: string;
  query: string;
  strategyCode: string;
  primaryProvider: 'google_places' | 'apify_portal' | 'registry';
  intent: string; // research engine intent
  estimatedCostPerContact: number;
}

const CATEGORIES: SchedulerCategory[] = [
  // Registry-based (cheapest — run first)
  { code: 'bank_retail', label: 'Filialbank', query: 'Filialbank Sparkasse', strategyCode: 'BANK_BAFIN', primaryProvider: 'registry', intent: 'search_contacts', estimatedCostPerContact: 0.01 },
  { code: 'bank_private', label: 'Privatbank', query: 'Privatbank', strategyCode: 'BANK_BAFIN', primaryProvider: 'registry', intent: 'search_contacts', estimatedCostPerContact: 0.01 },
  // Portal-based (Apify)
  { code: 'real_estate_agent', label: 'Immobilienmakler', query: 'Immobilienmakler', strategyCode: 'PORTAL_SCRAPING', primaryProvider: 'apify_portal', intent: 'search_portals', estimatedCostPerContact: 0.03 },
  { code: 'real_estate_company', label: 'Immobilienunternehmen', query: 'Immobilienunternehmen Projektentwickler', strategyCode: 'PORTAL_GOOGLE', primaryProvider: 'apify_portal', intent: 'search_portals', estimatedCostPerContact: 0.03 },
  // IHK-Register (via Apify scraping)
  { code: 'insurance_broker_34d', label: 'Versicherungsmakler', query: 'Versicherungsmakler', strategyCode: 'IHK_REGISTER', primaryProvider: 'google_places', intent: 'search_contacts', estimatedCostPerContact: 0.04 },
  { code: 'mortgage_broker_34i', label: 'Baufinanzierung', query: 'Immobiliardarlehensvermittler Baufinanzierung', strategyCode: 'IHK_REGISTER', primaryProvider: 'google_places', intent: 'search_contacts', estimatedCostPerContact: 0.04 },
  { code: 'financial_broker_34f', label: 'Finanzanlagenvermittler', query: 'Finanzanlagenvermittler', strategyCode: 'IHK_REGISTER', primaryProvider: 'google_places', intent: 'search_contacts', estimatedCostPerContact: 0.04 },
  { code: 'fee_advisor_34h', label: 'Honorar-Berater', query: 'Honorar-Finanzanlagenberater', strategyCode: 'IHK_REGISTER', primaryProvider: 'google_places', intent: 'search_contacts', estimatedCostPerContact: 0.04 },
  // Google Places-based
  { code: 'financial_advisor', label: 'Finanzberater', query: 'Finanzberater', strategyCode: 'GOOGLE_FIRECRAWL', primaryProvider: 'google_places', intent: 'search_contacts', estimatedCostPerContact: 0.02 },
  { code: 'property_management', label: 'Hausverwaltung', query: 'Hausverwaltung', strategyCode: 'GOOGLE_FIRECRAWL', primaryProvider: 'google_places', intent: 'search_contacts', estimatedCostPerContact: 0.02 },
  { code: 'tax_advisor_re', label: 'Steuerberater', query: 'Steuerberater Immobilien', strategyCode: 'GOOGLE_FIRECRAWL', primaryProvider: 'google_places', intent: 'search_contacts', estimatedCostPerContact: 0.02 },
  { code: 'family_office', label: 'Family Office', query: 'Family Office Vermögensverwaltung', strategyCode: 'FAMILY_OFFICE_SEARCH', primaryProvider: 'google_places', intent: 'search_contacts', estimatedCostPerContact: 0.08 },
  // Pet categories
  { code: 'dog_boarding', label: 'Hundepension', query: 'Hundepension Hundehotel', strategyCode: 'GOOGLE_FIRECRAWL', primaryProvider: 'google_places', intent: 'search_contacts', estimatedCostPerContact: 0.02 },
  { code: 'dog_training', label: 'Hundeschule', query: 'Hundeschule Hundetrainer', strategyCode: 'GOOGLE_FIRECRAWL', primaryProvider: 'google_places', intent: 'search_contacts', estimatedCostPerContact: 0.02 },
  { code: 'veterinary', label: 'Tierarzt', query: 'Tierarzt Tierklinik', strategyCode: 'GOOGLE_FIRECRAWL', primaryProvider: 'google_places', intent: 'search_contacts', estimatedCostPerContact: 0.02 },
  { code: 'dog_grooming', label: 'Hundefriseur', query: 'Hundefriseur Hundesalon', strategyCode: 'GOOGLE_FIRECRAWL', primaryProvider: 'google_places', intent: 'search_contacts', estimatedCostPerContact: 0.02 },
  { code: 'pet_shop', label: 'Zoofachhandel', query: 'Zoofachhandel Tierbedarf', strategyCode: 'GOOGLE_FIRECRAWL', primaryProvider: 'google_places', intent: 'search_contacts', estimatedCostPerContact: 0.02 },
  { code: 'loan_broker', label: 'Kreditvermittler', query: 'Kreditvermittler', strategyCode: 'IHK_REGISTER', primaryProvider: 'google_places', intent: 'search_contacts', estimatedCostPerContact: 0.04 },
];

const COST_PER_BATCH = 6;
const MAX_CREDITS_PER_DAY = 200;
const COOLDOWN_DAYS = 3;
const BATCH_SIZE = 25;
const PAUSE_MS = 3000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  try {
    const sb = createClient(supabaseUrl, serviceKey);

    // ─── Determine tenant ───
    // For cron: use body.tenant_id or first platform tenant
    let tenantId: string | null = null;

    if (req.method === "POST") {
      try {
        const body = await req.json();
        tenantId = body.tenant_id || null;
      } catch { /* empty body from cron */ }
    }

    if (!tenantId) {
      // Find platform tenant
      const { data: org } = await sb
        .from("organizations")
        .select("id")
        .eq("org_type", "platform")
        .limit(1)
        .maybeSingle();
      tenantId = org?.id || null;
    }

    if (!tenantId) {
      return json({ error: "No tenant found" }, 400);
    }

    // ─── Check daily credit usage ───
    const today = new Date().toISOString().split('T')[0];
    const { data: todayLogs } = await sb
      .from("discovery_run_log")
      .select("credits_used")
      .eq("tenant_id", tenantId)
      .eq("run_date", today);

    const usedToday = (todayLogs || []).reduce((sum: number, l: any) => sum + (l.credits_used || 0), 0);
    if (usedToday >= MAX_CREDITS_PER_DAY) {
      return json({ status: "budget_exhausted", usedToday, limit: MAX_CREDITS_PER_DAY });
    }

    // ─── Load region queue ───
    let { data: regions } = await sb
      .from("discovery_region_queue")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("priority_score", { ascending: false });

    if (!regions || regions.length === 0) {
      // Auto-seed queue if empty
      console.log("Seeding region queue...");
      const TOP_REGIONS = [
        { name: 'Berlin', population: 3645000, plz: '1' },
        { name: 'Hamburg', population: 1841000, plz: '2' },
        { name: 'München', population: 1472000, plz: '8' },
        { name: 'Köln', population: 1084000, plz: '5' },
        { name: 'Frankfurt am Main', population: 753000, plz: '6' },
        { name: 'Stuttgart', population: 635000, plz: '70' },
        { name: 'Düsseldorf', population: 619000, plz: '4' },
        { name: 'Leipzig', population: 587000, plz: '04' },
        { name: 'Dortmund', population: 588000, plz: '44' },
        { name: 'Essen', population: 583000, plz: '45' },
        { name: 'Bremen', population: 563000, plz: '28' },
        { name: 'Dresden', population: 556000, plz: '01' },
        { name: 'Hannover', population: 536000, plz: '30' },
        { name: 'Nürnberg', population: 510000, plz: '90' },
        { name: 'Duisburg', population: 498000, plz: '47' },
        { name: 'Bochum', population: 365000, plz: '44' },
        { name: 'Bielefeld', population: 334000, plz: '33' },
        { name: 'Bonn', population: 330000, plz: '53' },
        { name: 'Münster', population: 315000, plz: '48' },
        { name: 'Mannheim', population: 310000, plz: '68' },
        { name: 'Karlsruhe', population: 308000, plz: '76' },
        { name: 'Augsburg', population: 296000, plz: '86' },
        { name: 'Wiesbaden', population: 278000, plz: '65' },
        { name: 'Freiburg', population: 231000, plz: '79' },
        { name: 'Mainz', population: 218000, plz: '55' },
      ];

      const rows = TOP_REGIONS.map((r, i) => ({
        tenant_id: tenantId,
        region_name: r.name,
        postal_code_prefix: r.plz,
        population: r.population,
        priority_score: Math.round(r.population / 10000),
      }));

      await sb.from("discovery_region_queue").upsert(rows, { onConflict: "tenant_id,region_name" });
      
      const { data: seeded } = await sb
        .from("discovery_region_queue")
        .select("*")
        .eq("tenant_id", tenantId)
        .order("priority_score", { ascending: false });
      regions = seeded || [];
    }

    // ─── Filter out regions in cooldown ───
    const now = new Date();
    const activeRegions = regions.filter((r: any) => {
      if (!r.cooldown_until) return true;
      return new Date(r.cooldown_until) <= now;
    });

    if (activeRegions.length === 0) {
      return json({ status: "all_regions_in_cooldown", regionsTotal: regions.length });
    }

    // ─── Process batches ───
    let creditsUsedThisRun = 0;
    let totalRawFound = 0;
    let totalDuplicates = 0;
    let totalApproved = 0;
    const batchResults: any[] = [];

    for (const region of activeRegions) {
      if (usedToday + creditsUsedThisRun >= MAX_CREDITS_PER_DAY) {
        console.log("Daily budget reached, stopping.");
        break;
      }

      const categoryIndex = region.last_category_index || 0;
      const category = CATEGORIES[categoryIndex % CATEGORIES.length];
      const nextCategoryIndex = (categoryIndex + 1) % CATEGORIES.length;

      console.log(`Batch: ${region.region_name} + ${category.label}`);

      // ─── Credit Preflight ───
      const remaining = MAX_CREDITS_PER_DAY - usedToday - creditsUsedThisRun;
      if (remaining < COST_PER_BATCH) {
        console.log("Not enough credits for next batch.");
        break;
      }

      let batchRaw = 0;
      let batchDupes = 0;
      let batchApproved = 0;
      let errorMsg: string | null = null;

      try {
        // ─── Call sot-research-engine (category-aware) ───
        const researchUrl = `${supabaseUrl}/functions/v1/sot-research-engine`;
        const researchBody: Record<string, unknown> = {
          intent: category.intent,
          query: category.query,
          location: region.region_name,
          max_results: BATCH_SIZE,
        };

        // Portal searches need portal_config
        if (category.intent === 'search_portals') {
          researchBody.portal_config = {
            portal: 'immoscout24',
            search_type: 'brokers',
          };
        }

        const researchResp = await fetch(researchUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${serviceKey}`,
          },
          body: JSON.stringify(researchBody),
        });

        if (!researchResp.ok) {
          const errText = await researchResp.text();
          throw new Error(`Research engine ${researchResp.status}: ${errText}`);
        }

        const researchData = await researchResp.json();
        const rawResults: any[] = researchData.results || researchData.data?.results || [];
        batchRaw = rawResults.length;

        if (rawResults.length === 0) {
          console.log(`No results for ${region.region_name} + ${category.label}`);
        } else {
          // ─── Schicht 1: Intra-Batch Dedupe ───
          const seen = new Map<string, any>();
          for (const r of rawResults) {
            const phone = normalizePhone(r.phone);
            const domain = normalizeDomain(r.website);
            const email = (r.email || '').trim().toLowerCase() || undefined;
            let firstName = r.first_name;
            let lastName = r.last_name;
            let salutation = r.salutation;

            if (!firstName && !lastName && r.contact_person_name) {
              const split = splitName(r.contact_person_name);
              firstName = split.firstName;
              lastName = split.lastName;
              salutation = salutation || split.salutation;
            }

            // Parse address
            let street: string | undefined;
            let postalCode: string | undefined;
            let city: string | undefined;
            if (r.address) {
              const parts = r.address.split(',').map((p: string) => p.trim());
              if (parts.length >= 1) street = parts[0];
              if (parts.length >= 2) {
                const plzMatch = parts[parts.length - 1].match(/^(\d{5})\s+(.+)$/);
                if (plzMatch) { postalCode = plzMatch[1]; city = plzMatch[2]; }
                else { city = parts[parts.length - 1]; }
              }
            }
            if (!city) city = region.region_name;

            const key = buildDedupeKey({ email, phoneE164: phone, lastName, postalCode });
            if (key !== '|||' && seen.has(key)) {
              batchDupes++;
              continue;
            }
            seen.set(key, true);

            const confidence = calcConfidenceScore(
              { firstName, lastName, company: r.name, street, postalCode, city, phoneE164: phone, domain, email },
              (r.sources || []).length || 1,
            );

            const dedupeHash = key !== '|||' ? key : null;

            // ─── Schicht 2: Cross-Order Dedupe (via unique index) ───
            const { error: insertErr } = await sb
              .from("soat_search_results")
              .insert({
                tenant_id: tenantId,
                company_name: r.name || null,
                salutation: salutation || null,
                first_name: firstName || null,
                last_name: lastName || null,
                email: email || null,
                phone: phone || null,
                website_url: r.website || null,
                address_line: r.address || null,
                city: city || null,
                postal_code: postalCode || null,
                confidence_score: confidence,
                source_refs_json: {
                  sources: r.sources || ['discovery-scheduler'],
                  category: category.code,
                  region: region.region_name,
                  strategy_code: category.strategyCode,
                  primary_provider: category.primaryProvider,
                  estimated_cost: category.estimatedCostPerContact,
                },
                validation_state: confidence >= 0.85 ? 'approved' : confidence >= 0.60 ? 'needs_review' : 'pending',
                dedupe_hash: dedupeHash,
              });

            if (insertErr) {
              if (insertErr.code === '23505') {
                // Unique constraint violation = duplicate
                batchDupes++;
                continue;
              }
              console.error("Insert error:", insertErr.message);
              continue;
            }

            // ─── Schicht 3: Auto-Import bei confidence >= 85% ───
            if (confidence >= 0.85) {
              // Check if contact already exists
              let isDupe = false;
              if (email) {
                const { data: existing } = await sb
                  .from("contacts")
                  .select("id")
                  .eq("tenant_id", tenantId)
                  .eq("email", email)
                  .limit(1);
                if (existing && existing.length > 0) isDupe = true;
              }
              if (!isDupe && phone) {
                const { data: existing } = await sb
                  .from("contacts")
                  .select("id")
                  .eq("tenant_id", tenantId)
                  .eq("phone", phone)
                  .limit(1);
                if (existing && existing.length > 0) isDupe = true;
              }

              if (!isDupe) {
                const publicId = `DS-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
                await sb.from("contacts").insert({
                  tenant_id: tenantId,
                  company: r.name || null,
                  salutation: salutation || null,
                  first_name: firstName || r.name || '',
                  last_name: lastName || r.name || '',
                  email: email || null,
                  phone: phone || null,
                  street: street || null,
                  postal_code: postalCode || null,
                  city: city || null,
                  category: category.code,
                  synced_from: 'discovery-scheduler',
                  confidence_score: confidence,
                  public_id: publicId,
                });

                // Create strategy ledger entry for enrichment tracking
                try {
                  const { data: newCtx } = await sb
                    .from("contacts")
                    .select("id")
                    .eq("tenant_id", tenantId)
                    .eq("company", r.name || '')
                    .eq("city", city || '')
                    .limit(1)
                    .maybeSingle();

                  if (newCtx?.id) {
                    await sb.from("contact_strategy_ledger").insert({
                      contact_id: newCtx.id,
                      tenant_id: tenantId,
                      category_code: category.code,
                      strategy_code: category.strategyCode,
                      steps_completed: [{
                        step: 'discovery',
                        provider: category.primaryProvider,
                        executed_at: new Date().toISOString(),
                        cost_eur: category.estimatedCostPerContact * 0.5,
                        fields_found: [r.name ? 'name' : null, phone ? 'phone' : null, email ? 'email' : null, r.website ? 'website' : null].filter(Boolean),
                      }],
                      steps_pending: email ? [] : [
                        { step: 'web_scrape', provider: 'firecrawl', purpose: 'enrichment', estimatedCostEur: 0.005 },
                      ],
                      data_gaps: [!email ? 'email' : null, !phone ? 'phone' : null, !r.website ? 'website' : null].filter(Boolean),
                      total_cost_eur: category.estimatedCostPerContact * 0.5,
                      quality_score: Math.round(confidence * 100),
                      last_step_at: new Date().toISOString(),
                    });
                  }
                } catch (ledgerErr) {
                  console.warn("Ledger creation skipped:", ledgerErr);
                }
                batchApproved++;
              } else {
                batchDupes++;
              }
            }
          }
        }
      } catch (err) {
        errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`Batch error (${region.region_name} + ${category.label}):`, errorMsg);
      }

      // ─── Log this batch ───
      await sb.from("discovery_run_log").insert({
        run_date: today,
        tenant_id: tenantId,
        region_name: region.region_name,
        category_code: category.code,
        raw_found: batchRaw,
        duplicates_skipped: batchDupes,
        approved_count: batchApproved,
        credits_used: COST_PER_BATCH,
        cost_eur: batchRaw * category.estimatedCostPerContact,
        provider_calls_json: {
          primary_provider: category.primaryProvider,
          strategy_code: category.strategyCode,
          intent: category.intent,
          category_code: category.code,
        },
        error_message: errorMsg,
      });

      // ─── Update region queue ───
      const cooldownEnd = new Date(now.getTime() + COOLDOWN_DAYS * 24 * 60 * 60 * 1000).toISOString();
      await sb
        .from("discovery_region_queue")
        .update({
          last_scanned_at: now.toISOString(),
          cooldown_until: cooldownEnd,
          total_contacts: (region.total_contacts || 0) + batchRaw - batchDupes,
          approved_contacts: (region.approved_contacts || 0) + batchApproved,
          last_category_index: nextCategoryIndex,
          updated_at: now.toISOString(),
        })
        .eq("id", region.id);

      creditsUsedThisRun += COST_PER_BATCH;
      totalRawFound += batchRaw;
      totalDuplicates += batchDupes;
      totalApproved += batchApproved;

      batchResults.push({
        region: region.region_name,
        category: category.label,
        raw: batchRaw,
        dupes: batchDupes,
        approved: batchApproved,
        error: errorMsg,
      });

      // ─── Pause between batches (rate limiting) ───
      await new Promise(resolve => setTimeout(resolve, PAUSE_MS));
    }

    // ─── Credit deduction via credit-preflight ───
    if (creditsUsedThisRun > 0) {
      try {
        const creditUrl = `${supabaseUrl}/functions/v1/sot-credit-preflight`;
        await fetch(creditUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            action: "deduct",
            credits: creditsUsedThisRun,
            action_code: "discovery_scheduler",
            ref_type: "discovery_run",
            ref_id: today,
          }),
        });
      } catch (err) {
        console.error("Credit deduction failed:", err);
      }
    }

    const summary = {
      status: "completed",
      date: today,
      batchesProcessed: batchResults.length,
      totalRawFound,
      totalDuplicates,
      totalApproved,
      creditsUsed: creditsUsedThisRun,
      costEur: creditsUsedThisRun * 0.25,
      batches: batchResults,
    };

    console.log("Discovery run completed:", JSON.stringify(summary));
    return json(summary);

  } catch (err) {
    console.error("Discovery scheduler error:", err);
    return json({ error: err instanceof Error ? err.message : "Internal error" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
