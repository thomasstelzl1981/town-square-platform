import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Strategy Registry (mirrors spec.ts CATEGORY_SOURCE_STRATEGIES) ──

interface SourceStep {
  stepId: string;
  provider: string;
  purpose: string;
  priority: number;
  config: Record<string, unknown>;
  expectedFields: string[];
  estimatedCostEur: number;
  skipIf?: string[];
}

interface CategorySourceStrategy {
  categoryCode: string;
  strategyCode: string;
  difficulty: string;
  steps: SourceStep[];
}

const STRATEGIES: CategorySourceStrategy[] = [
  // Banks
  { categoryCode: 'bank_retail', strategyCode: 'BANK_BAFIN', difficulty: 'easy', steps: [
    { stepId: 'bafin_import', provider: 'bafin_csv', purpose: 'discovery', priority: 1, config: { registerType: 'institute' }, expectedFields: ['name', 'city', 'legal_form'], estimatedCostEur: 0 },
    { stepId: 'google_enrich', provider: 'google_places', purpose: 'enrichment', priority: 2, config: {}, expectedFields: ['phone', 'address', 'rating'], estimatedCostEur: 0.003 },
    { stepId: 'web_scrape', provider: 'firecrawl', purpose: 'verification', priority: 3, config: {}, expectedFields: ['email', 'website'], estimatedCostEur: 0.005, skipIf: ['has_email'] },
  ]},
  { categoryCode: 'bank_private', strategyCode: 'BANK_BAFIN', difficulty: 'easy', steps: [
    { stepId: 'bafin_import', provider: 'bafin_csv', purpose: 'discovery', priority: 1, config: {}, expectedFields: ['name', 'city'], estimatedCostEur: 0 },
    { stepId: 'google_enrich', provider: 'google_places', purpose: 'enrichment', priority: 2, config: {}, expectedFields: ['phone', 'address'], estimatedCostEur: 0.003 },
    { stepId: 'web_scrape', provider: 'firecrawl', purpose: 'verification', priority: 3, config: {}, expectedFields: ['email'], estimatedCostEur: 0.005, skipIf: ['has_email'] },
  ]},
  // Family Office
  { categoryCode: 'family_office', strategyCode: 'FAMILY_OFFICE_SEARCH', difficulty: 'hard', steps: [
    { stepId: 'google_search', provider: 'google_places', purpose: 'discovery', priority: 1, config: {}, expectedFields: ['name', 'address', 'phone'], estimatedCostEur: 0.003 },
    { stepId: 'web_scrape', provider: 'firecrawl', purpose: 'enrichment', priority: 2, config: {}, expectedFields: ['email', 'website', 'contact_person'], estimatedCostEur: 0.01 },
    { stepId: 'linkedin_scrape', provider: 'apify_linkedin', purpose: 'enrichment', priority: 3, config: {}, expectedFields: ['contact_person'], estimatedCostEur: 0.01, skipIf: ['has_contact_person'] },
  ]},
  // IHK-registered
  { categoryCode: 'insurance_broker_34d', strategyCode: 'IHK_REGISTER', difficulty: 'hard', steps: [
    { stepId: 'ihk_scrape', provider: 'ihk_register', purpose: 'discovery', priority: 1, config: { erlaubnisTyp: '34d' }, expectedFields: ['name', 'registration_number', 'city'], estimatedCostEur: 0.02 },
    { stepId: 'google_verify', provider: 'google_places', purpose: 'enrichment', priority: 2, config: {}, expectedFields: ['phone', 'address'], estimatedCostEur: 0.003 },
    { stepId: 'web_scrape', provider: 'firecrawl', purpose: 'verification', priority: 3, config: {}, expectedFields: ['email'], estimatedCostEur: 0.005, skipIf: ['has_email', 'no_website'] },
  ]},
  { categoryCode: 'financial_broker_34f', strategyCode: 'IHK_REGISTER', difficulty: 'medium', steps: [
    { stepId: 'ihk_scrape', provider: 'ihk_register', purpose: 'discovery', priority: 1, config: { erlaubnisTyp: '34f' }, expectedFields: ['name', 'city'], estimatedCostEur: 0.02 },
    { stepId: 'google_verify', provider: 'google_places', purpose: 'enrichment', priority: 2, config: {}, expectedFields: ['phone', 'address'], estimatedCostEur: 0.003 },
    { stepId: 'web_scrape', provider: 'firecrawl', purpose: 'verification', priority: 3, config: {}, expectedFields: ['email'], estimatedCostEur: 0.005, skipIf: ['has_email'] },
  ]},
  { categoryCode: 'fee_advisor_34h', strategyCode: 'IHK_REGISTER', difficulty: 'hard', steps: [
    { stepId: 'ihk_scrape', provider: 'ihk_register', purpose: 'discovery', priority: 1, config: { erlaubnisTyp: '34h' }, expectedFields: ['name', 'city'], estimatedCostEur: 0.02 },
    { stepId: 'google_verify', provider: 'google_places', purpose: 'enrichment', priority: 2, config: {}, expectedFields: ['phone'], estimatedCostEur: 0.003 },
    { stepId: 'web_scrape', provider: 'firecrawl', purpose: 'verification', priority: 3, config: {}, expectedFields: ['email'], estimatedCostEur: 0.005, skipIf: ['has_email', 'no_website'] },
  ]},
  { categoryCode: 'mortgage_broker_34i', strategyCode: 'IHK_REGISTER', difficulty: 'medium', steps: [
    { stepId: 'ihk_scrape', provider: 'ihk_register', purpose: 'discovery', priority: 1, config: { erlaubnisTyp: '34i' }, expectedFields: ['name', 'city'], estimatedCostEur: 0.02 },
    { stepId: 'google_verify', provider: 'google_places', purpose: 'enrichment', priority: 2, config: {}, expectedFields: ['phone', 'website'], estimatedCostEur: 0.003 },
    { stepId: 'web_scrape', provider: 'firecrawl', purpose: 'verification', priority: 3, config: {}, expectedFields: ['email'], estimatedCostEur: 0.005, skipIf: ['has_email'] },
  ]},
  { categoryCode: 'loan_broker', strategyCode: 'IHK_REGISTER', difficulty: 'medium', steps: [
    { stepId: 'ihk_scrape', provider: 'ihk_register', purpose: 'discovery', priority: 1, config: { erlaubnisTyp: '34i' }, expectedFields: ['name', 'city'], estimatedCostEur: 0.02 },
    { stepId: 'google_verify', provider: 'google_places', purpose: 'enrichment', priority: 2, config: {}, expectedFields: ['phone'], estimatedCostEur: 0.003 },
    { stepId: 'web_scrape', provider: 'firecrawl', purpose: 'verification', priority: 3, config: {}, expectedFields: ['email'], estimatedCostEur: 0.005, skipIf: ['has_email'] },
  ]},
  // General finance
  { categoryCode: 'financial_advisor', strategyCode: 'GOOGLE_FIRECRAWL', difficulty: 'medium', steps: [
    { stepId: 'google_search', provider: 'google_places', purpose: 'discovery', priority: 1, config: {}, expectedFields: ['name', 'phone', 'address'], estimatedCostEur: 0.003 },
    { stepId: 'web_scrape', provider: 'firecrawl', purpose: 'enrichment', priority: 2, config: {}, expectedFields: ['email', 'website'], estimatedCostEur: 0.005, skipIf: ['has_email'] },
  ]},
  // Real estate
  { categoryCode: 'real_estate_agent', strategyCode: 'PORTAL_SCRAPING', difficulty: 'easy', steps: [
    { stepId: 'portal_scrape', provider: 'apify_portal', purpose: 'discovery', priority: 1, config: { portals: ['immoscout24', 'immowelt'] }, expectedFields: ['name', 'address', 'phone'], estimatedCostEur: 0.02 },
    { stepId: 'google_verify', provider: 'google_places', purpose: 'verification', priority: 2, config: {}, expectedFields: ['phone', 'website', 'rating'], estimatedCostEur: 0.003 },
    { stepId: 'web_scrape', provider: 'firecrawl', purpose: 'enrichment', priority: 3, config: {}, expectedFields: ['email'], estimatedCostEur: 0.005, skipIf: ['has_email'] },
  ]},
  { categoryCode: 'property_management', strategyCode: 'GOOGLE_FIRECRAWL', difficulty: 'easy', steps: [
    { stepId: 'google_search', provider: 'google_places', purpose: 'discovery', priority: 1, config: {}, expectedFields: ['name', 'phone', 'address'], estimatedCostEur: 0.003 },
    { stepId: 'web_scrape', provider: 'firecrawl', purpose: 'enrichment', priority: 2, config: {}, expectedFields: ['email', 'website'], estimatedCostEur: 0.005, skipIf: ['has_email'] },
  ]},
  { categoryCode: 'real_estate_company', strategyCode: 'PORTAL_GOOGLE', difficulty: 'easy', steps: [
    { stepId: 'portal_scrape', provider: 'apify_portal', purpose: 'discovery', priority: 1, config: {}, expectedFields: ['name', 'address'], estimatedCostEur: 0.02 },
    { stepId: 'google_verify', provider: 'google_places', purpose: 'enrichment', priority: 2, config: {}, expectedFields: ['phone', 'website'], estimatedCostEur: 0.003 },
    { stepId: 'web_scrape', provider: 'firecrawl', purpose: 'verification', priority: 3, config: {}, expectedFields: ['email'], estimatedCostEur: 0.005, skipIf: ['has_email'] },
  ]},
  { categoryCode: 'tax_advisor_re', strategyCode: 'GOOGLE_FIRECRAWL', difficulty: 'easy', steps: [
    { stepId: 'google_search', provider: 'google_places', purpose: 'discovery', priority: 1, config: {}, expectedFields: ['name', 'phone', 'address'], estimatedCostEur: 0.003 },
    { stepId: 'web_scrape', provider: 'firecrawl', purpose: 'enrichment', priority: 2, config: {}, expectedFields: ['email', 'website'], estimatedCostEur: 0.005, skipIf: ['has_email'] },
  ]},
  // Pet categories (all same simple pipeline)
  ...['dog_boarding', 'dog_daycare', 'dog_grooming', 'dog_training', 'pet_shop', 'veterinary', 'pet_sitting'].map(code => ({
    categoryCode: code,
    strategyCode: 'GOOGLE_FIRECRAWL',
    difficulty: 'easy' as string,
    steps: [
      { stepId: 'google_search', provider: 'google_places', purpose: 'discovery', priority: 1, config: {}, expectedFields: ['name', 'phone', 'address'], estimatedCostEur: 0.003 },
      { stepId: 'web_scrape', provider: 'firecrawl', purpose: 'enrichment', priority: 2, config: {}, expectedFields: ['email', 'website'], estimatedCostEur: 0.005, skipIf: ['has_email'] },
    ],
  })),
];

// ── Helper: check if a step should be skipped ──

function shouldSkipStep(step: SourceStep, contactData: Record<string, unknown>): boolean {
  if (!step.skipIf || step.skipIf.length === 0) return false;
  for (const condition of step.skipIf) {
    if (condition === 'has_email' && contactData.email) return true;
    if (condition === 'has_contact_person' && (contactData.first_name || contactData.contact_person_name)) return true;
    if (condition === 'no_website' && !contactData.website_url) return true;
  }
  return false;
}

// ── Main handler ──

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { contact_id, category_code, tenant_id } = await req.json();

    if (!contact_id || !category_code || !tenant_id) {
      return new Response(
        JSON.stringify({ error: "contact_id, category_code, and tenant_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Find strategy for category
    const strategy = STRATEGIES.find(s => s.categoryCode === category_code);
    if (!strategy) {
      return new Response(
        JSON.stringify({
          error: `No strategy found for category: ${category_code}`,
          available_categories: STRATEGIES.map(s => s.categoryCode),
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Get or create ledger entry
    const { data: existingLedger } = await supabaseAdmin
      .from("contact_strategy_ledger")
      .select("*")
      .eq("contact_id", contact_id)
      .eq("tenant_id", tenant_id)
      .maybeSingle();

    // 3. Get current contact data to check skipIf conditions
    const { data: contact } = await supabaseAdmin
      .from("contacts")
      .select("email, phone, phone_mobile, website_url, first_name, last_name, company_name")
      .eq("id", contact_id)
      .single();

    const contactData: Record<string, unknown> = contact || {};
    const stepsCompleted: string[] = existingLedger
      ? (existingLedger.steps_completed as any[]).map((s: any) => s.step)
      : [];

    // 4. Determine next step
    let nextStep: SourceStep | null = null;
    const pendingSteps: SourceStep[] = [];

    for (const step of strategy.steps) {
      if (stepsCompleted.includes(step.stepId)) continue;
      if (shouldSkipStep(step, contactData)) continue;
      pendingSteps.push(step);
      if (!nextStep) nextStep = step;
    }

    // 5. If no ledger exists, create one
    if (!existingLedger) {
      const dataGaps: string[] = [];
      if (!contactData.email) dataGaps.push('email');
      if (!contactData.phone) dataGaps.push('phone');
      if (!contactData.website_url) dataGaps.push('website');
      if (!contactData.first_name && !contactData.last_name) dataGaps.push('contact_person');

      await supabaseAdmin.from("contact_strategy_ledger").insert({
        contact_id,
        tenant_id,
        category_code,
        strategy_code: strategy.strategyCode,
        steps_completed: [],
        steps_pending: pendingSteps.map(s => ({
          step: s.stepId,
          provider: s.provider,
          purpose: s.purpose,
          estimatedCostEur: s.estimatedCostEur,
        })),
        data_gaps: dataGaps,
        quality_score: 0,
      });
    }

    // 6. Calculate estimated remaining cost
    const estimatedRemainingCost = pendingSteps.reduce(
      (sum, s) => sum + s.estimatedCostEur, 0
    );

    return new Response(
      JSON.stringify({
        success: true,
        strategy_code: strategy.strategyCode,
        difficulty: strategy.difficulty,
        total_steps: strategy.steps.length,
        steps_completed: stepsCompleted.length,
        steps_remaining: pendingSteps.length,
        next_step: nextStep
          ? {
              stepId: nextStep.stepId,
              provider: nextStep.provider,
              purpose: nextStep.purpose,
              config: nextStep.config,
              expectedFields: nextStep.expectedFields,
              estimatedCostEur: nextStep.estimatedCostEur,
            }
          : null,
        is_complete: pendingSteps.length === 0,
        estimated_remaining_cost_eur: estimatedRemainingCost,
        data_gaps: existingLedger?.data_gaps || [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Strategy resolver error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
