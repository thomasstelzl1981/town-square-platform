/**
 * Demo Seed Engine — Reads CSV SSOT files and writes to DB via SDK
 * 
 * All demo data comes from `public/demo-data/*.csv` files
 * or is built from data.ts constants (for JSONB columns).
 * Every seeded entity is tracked in `test_data_registry`.
 * 
 * @demo-data
 */

import { supabase } from '@/integrations/supabase/client';
import {
  DEMO_INSURANCES,
  DEMO_KV_CONTRACTS,
  DEMO_ACQ_MANDATE,
  DEMO_ACQ_MANDATE_ID,
  DEMO_DEV_PROJECT,
  DEMO_DEVELOPER_CONTEXT_ID,
  DEMO_DEV_PROJECT_CONSTANTS,
  DEMO_PET_LUNA,
  DEMO_PET_BELLO,
} from '@/engines/demoData/data';
import { DEMO_PROPERTY_ACCOUNTING } from '@/engines/demoData/demoPropertyData';

// ─── CSV Parser ────────────────────────────────────────────

function parseCSV(text: string, delimiter = ';'): Record<string, string>[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(delimiter).map(h => h.trim());
  return lines.slice(1).map(line => {
    const values = line.split(delimiter).map(v => v.trim());
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = values[i] ?? ''; });
    return row;
  });
}

/** Numeric columns across all CSVs */
const NUMERIC_KEYS = new Set([
  'total_area_sqm', 'purchase_price', 'year_built', 'area_sqm', 'rooms', 'rooms_count',
  'current_monthly_rent', 'ancillary_costs', 'hausgeld_monthly',
  'monthly_rent', 'rent_cold_eur', 'nk_advance_eur', 'heating_advance_eur',
  'payment_due_day', 'deposit_amount_eur', 'deposit_amount',
  'original_amount', 'interest_rate_percent', 'annuity_monthly_eur',
  'repayment_rate_percent', 'outstanding_balance_eur',
  'amount_eur', 'floor', 'amount',
  // vehicles
  'power_kw', 'engine_ccm', 'co2_g_km', 'weight_kg', 'max_weight_kg', 'seats', 'doors', 'current_mileage_km',
  // pv_plants
  'kwp', 'battery_kwh', 'feed_in_start_reading', 'consumption_start_reading',
  'loan_amount', 'loan_monthly_rate', 'loan_interest_rate', 'loan_remaining_balance',
  'annual_yield_kwh', 'feed_in_tariff_cents', 'annual_revenue',
  // vorsorge
  'premium', 'current_balance', 'monthly_benefit', 'bu_monthly_benefit', 'dynamics_percent',
  // private_loans
  'interest_rate', 'monthly_rate', 'remaining_balance',
  // miety
  'monthly_cost',
  // household
  'sort_order', 'gross_income_monthly', 'net_income_monthly', 'child_allowances',
  'business_income_monthly', 'pv_income_monthly',
  // pet_bookings
  'duration_minutes', 'price_cents',
  // kv
  'monthly_premium', 'employer_contribution',
  // properties
  'market_value',
  // acq_offers
  'price_asking', 'units_count', 'yield_indicated', 'noi_indicated',
  // listings
  'asking_price', 'commission_rate', 'min_price',
  // estimated_value
  'estimated_value_eur',
  // finance_requests + applicant_profiles (MOD-07/MOD-11)
  'equity_amount', 'loan_amount_requested', 'fixed_rate_period_years',
  'max_monthly_rate', 'broker_fee', 'notary_costs', 'transfer_tax',
  'modernization_costs', 'object_construction_year', 'object_living_area_sqm',
  'object_land_area_sqm', 'bonus_yearly', 'current_rent_monthly',
  'living_expenses_monthly', 'car_leasing_monthly', 'health_insurance_monthly',
  'other_fixed_costs_monthly', 'bank_savings', 'securities_value',
  'building_society_value', 'life_insurance_value', 'adults_count', 'children_count',
  'child_support_amount_monthly', 'child_benefit_monthly', 'other_regular_income_monthly',
  'company_employees', 'company_ownership_percent', 'priority',
  // dev_project_units
  'list_price', 'hausgeld', 'commission_amount',
]);

/** Boolean columns */
const BOOLEAN_KEYS = new Set([
  'is_demo', 'weg_flag', 'is_default', 'is_public_listing',
  'is_primary', 'has_battery', 'mastr_account_present',
  'is_business', 'rental_managed', 'sale_enabled',
  'is_published',
  // dev_project_units
  'balcony', 'garden', 'parking',
]);

function coerceValue(value: string, key: string): unknown {
  if (value === '' || value === 'null' || value === undefined) return null;
  if (BOOLEAN_KEYS.has(key)) return value === 'true';
  if (NUMERIC_KEYS.has(key)) {
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }
  // Catch any remaining "true"/"false" strings for non-registered boolean columns
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}

function coerceRow(row: Record<string, string>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    result[key] = coerceValue(value, key);
  }
  return result;
}

// ─── Fetch + Parse ─────────────────────────────────────────

async function fetchCSV(path: string): Promise<Record<string, unknown>[]> {
  const resp = await fetch(path);
  if (!resp.ok) {
    console.warn(`[DemoSeed] Failed to fetch ${path}: ${resp.status}`);
    return [];
  }
  const text = await resp.text();
  // Detect SPA fallback (HTML instead of CSV)
  if (text.trimStart().startsWith('<!') || text.trimStart().startsWith('<html')) {
    console.error(`[DemoSeed] ${path} returned HTML instead of CSV (SPA fallback). File may not exist in public/.`);
    return [];
  }
  const parsed = parseCSV(text).map(coerceRow);
  if (import.meta.env.DEV) console.log(`[DemoSeed] fetchCSV ${path}: ${parsed.length} rows`);
  return parsed;
}

// ─── Registry ──────────────────────────────────────────────

const DEMO_BATCH_ID = 'deadbeef-0000-4000-a000-000000000000';

async function registerEntities(
  tenantId: string,
  entityType: string,
  entityIds: string[],
  batchName = 'demo-ssot'
): Promise<void> {
  if (entityIds.length === 0) return;
  const rows = entityIds.map(id => ({
    tenant_id: tenantId,
    entity_type: entityType,
    entity_id: id,
    batch_id: DEMO_BATCH_ID,
    batch_name: batchName,
  }));
  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100);
    const { error } = await (supabase as any)
      .from('test_data_registry')
      .upsert(chunk, { onConflict: 'entity_type,entity_id' });
    if (error) { console.warn(`[DemoSeed] Registry ${entityType} chunk ${i}:`, error.message); }
  }
}

// ─── Helpers ───────────────────────────────────────────────

function stripNulls(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== null && v !== undefined) result[k] = v;
  }
  return result;
}

/** Get current user ID */
async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// ─── Generic CSV Seed ──────────────────────────────────────

async function seedFromCSV(
  csvPath: string,
  tableName: string,
  tenantId: string,
  extraFields?: Record<string, unknown>
): Promise<string[]> {
  const rows = await fetchCSV(csvPath);
  if (!rows.length) return [];

  const data = rows.map(r => stripNulls({ ...r, tenant_id: tenantId, ...extraFields }));
  const allIds: string[] = [];

  for (let i = 0; i < data.length; i += 50) {
    const chunk = data.slice(i, i + 50);
    const { error } = await (supabase as any)
      .from(tableName)
      .upsert(chunk, { onConflict: 'id' });
    if (error) {
      console.error(`[DemoSeed] ${tableName} chunk ${i}:`, error.message, error.details);
      throw new Error(`${tableName} chunk ${i}: ${error.message}`);
    } else {
      allIds.push(...chunk.map(r => (r as Record<string, unknown>).id as string));
    }
  }

  if (import.meta.env.DEV) console.log(`[DemoSeed] ✓ ${tableName}: ${allIds.length}/${data.length}`);
  return allIds;
}

// ─── Code-Based Seed Functions (JSONB columns) ─────────────

async function seedInsuranceContracts(tenantId: string, userId: string): Promise<string[]> {
  const data = DEMO_INSURANCES.map(ins => ({
    id: ins.id,
    tenant_id: tenantId,
    user_id: userId,
    category: ins.category,
    insurer: ins.insurer,
    policy_no: ins.policyNo,
    policyholder: ins.policyholder,
    start_date: ins.startDate,
    premium: ins.premium,
    payment_interval: ins.paymentInterval,
    status: 'aktiv',
    details: ins.details ?? {},
  }));

  const { error } = await (supabase as any)
    .from('insurance_contracts')
    .upsert(data, { onConflict: 'id' });

  if (error) { console.error('[DemoSeed] insurance_contracts:', error.message); return []; }
  if (import.meta.env.DEV) console.log(`[DemoSeed] ✓ insurance_contracts: ${data.length}`);
  return data.map(d => d.id);
}

async function seedKvContracts(tenantId: string): Promise<string[]> {
  const kvIds = [
    'e0000000-0000-4000-a000-000000000501',
    'e0000000-0000-4000-a000-000000000502',
    'e0000000-0000-4000-a000-000000000503',
    'e0000000-0000-4000-a000-000000000504',
  ];
  const kvData = DEMO_KV_CONTRACTS;

  const data = kvData.map((kv, i) => {
    const base: Record<string, unknown> = {
      id: kvIds[i],
      tenant_id: tenantId,
      person_id: kv.personId,
      person_name: kv.personName,
      kv_type: kv.type,
      provider: kv.provider,
      monthly_premium: kv.monthlyPremium,
      employer_contribution: kv.employerContribution ?? null,
    };
    const d = kv.details;
    if (kv.type === 'PKV') {
      base.tariff_name = d.tarif ?? null;
      base.deductible = d.selbstbeteiligung ?? null;
      base.deductible_reduction_from_67 = d.beitragsentlastung_ab_67 ?? false;
      base.daily_sickness_benefit = d.krankentagegeld ?? null;
      base.dental_prosthetics_percent = d.zahnersatz_prozent ?? null;
      base.single_room = d.einbettzimmer ?? false;
      base.chief_physician = d.chefarzt ?? false;
      base.contract_start = d.vertragsbeginn ?? null;
      base.insurance_number = d.versicherungsnummer ?? null;
      base.ihl_outpatient_percent = d.ihl_ambulant_prozent ?? null;
      base.ihl_inpatient_percent = d.ihl_stationaer_prozent ?? null;
      base.ihl_psychotherapy_sessions = d.ihl_psychotherapie_sitzungen ?? null;
      base.ihl_alternative_medicine = d.ihl_alternativmedizin ?? false;
      base.ihl_vision_aid_budget = d.ihl_sehhilfen_budget ?? null;
      base.ihl_hearing_aid_budget = d.ihl_hoergeraete_budget ?? null;
      base.ihl_rehabilitation = d.ihl_reha ?? null;
      const adjustments = d.beitragsanpassungen;
      if (Array.isArray(adjustments)) {
        base.premium_adjustments = (adjustments as Array<{ year: number; alt: number; neu: number }>).map(a => ({
          year: a.year, old_premium: a.alt, new_premium: a.neu, reason: 'Beitragsanpassung',
        }));
      }
    } else if (kv.type === 'GKV') {
      base.contribution_rate = d.beitragssatz ?? null;
      base.income_threshold = d.beitragsbemessungsgrenze ?? null;
      base.gross_income = d.bruttoeinkommen ?? null;
      base.family_insured_children = d.familienversichert_kinder ?? null;
      base.sick_pay_from_day = d.krankengeld_ab_tag ?? null;
      base.contract_start = d.vertragsbeginn ?? null;
      base.insurance_number = d.versicherungsnummer ?? null;
    } else if (kv.type === 'familienversichert') {
      base.insured_via_person_name = d.ueber ?? null;
      base.insured_until_age = d.bis_alter ?? null;
    }
    return stripNulls(base);
  });

  const { error } = await (supabase as any)
    .from('kv_contracts')
    .upsert(data, { onConflict: 'id' });

  if (error) { console.error('[DemoSeed] kv_contracts:', error.message); return []; }
  if (import.meta.env.DEV) console.log(`[DemoSeed] ✓ kv_contracts: ${data.length}`);
  return kvIds;
}

async function seedAcqMandates(tenantId: string, userId: string): Promise<string[]> {
  const m = DEMO_ACQ_MANDATE;
  const data = {
    id: DEMO_ACQ_MANDATE_ID,
    tenant_id: tenantId,
    created_by_user_id: userId,
    assigned_manager_user_id: userId,
    assigned_at: new Date().toISOString(),
    code: m.code,
    client_display_name: m.clientDisplayName,
    asset_focus: m.assetFocus,
    price_min: m.priceMin,
    price_max: m.priceMax,
    yield_target: m.yieldTarget,
    status: 'active',
  };

  const { error } = await (supabase as any)
    .from('acq_mandates')
    .upsert([data], { onConflict: 'id' });

  if (error) { console.error('[DemoSeed] acq_mandates:', error.message); return []; }
  if (import.meta.env.DEV) console.log('[DemoSeed] ✓ acq_mandates: 1');
  return [DEMO_ACQ_MANDATE_ID];
}

// ─── Acq Offers (Objekteingang) ────────────────────────────

async function seedAcqOffers(tenantId: string): Promise<string[]> {
  return seedFromCSV('/demo-data/demo_acq_offers.csv', 'acq_offers', tenantId);
}

// ─── Dev Projects (MOD-13) ─────────────────────────────────

const DEMO_DEV_PROJECT_ID = 'f0000000-0000-4000-a000-000000013001';

async function seedDevProject(tenantId: string, userId: string): Promise<string[]> {
  const p = DEMO_DEV_PROJECT;
  const c = DEMO_DEV_PROJECT_CONSTANTS;
  const data = {
    id: DEMO_DEV_PROJECT_ID,
    tenant_id: tenantId,
    developer_context_id: DEMO_DEVELOPER_CONTEXT_ID,
    project_code: 'PRJ-DEMO-001',
    name: p.projectName,
    city: p.city,
    status: 'active',
    created_by: userId,
    total_units_count: 24,
    purchase_price: 8500000,
    renovation_budget: 2200000,
    total_sale_target: 14400000,
    avg_unit_price: 600000,
    commission_rate_percent: 3.57,
    project_start_date: '2024-06-01',
    target_end_date: '2026-12-31',
    description: 'Kernsanierung Altbau zum modernen Wohnensemble mit 24 Einheiten',
    address: c.address,
    construction_year: c.constructionYear,
    afa_model: c.afaModel,
    land_share_percent: c.landSharePercent,
    afa_rate_percent: c.afaRatePercent,
    invest_engine_analyzed: true,
  };

  const { error } = await (supabase as any)
    .from('dev_projects')
    .upsert([data], { onConflict: 'id' });

  if (error) { console.error('[DemoSeed] dev_projects:', error.message); return []; }
  if (import.meta.env.DEV) console.log('[DemoSeed] ✓ dev_projects: 1');
  return [DEMO_DEV_PROJECT_ID];
}

// ─── Dev Project Units (MOD-13 Preisliste) ─────────────────

async function seedDevProjectUnits(tenantId: string): Promise<string[]> {
  const rows = await fetchCSV('/demo-data/demo_dev_project_units.csv');
  if (!rows.length) return [];

  // Pre-cleanup: delete any existing units for this project
  await (supabase as any)
    .from('dev_project_units')
    .delete()
    .eq('project_id', DEMO_DEV_PROJECT_ID)
    .eq('tenant_id', tenantId);

  const data = rows.map(r => stripNulls({ ...r, tenant_id: tenantId }));
  const allIds: string[] = [];

  for (let i = 0; i < data.length; i += 50) {
    const chunk = data.slice(i, i + 50);
    const { error } = await (supabase as any)
      .from('dev_project_units')
      .upsert(chunk, { onConflict: 'id' });
    if (error) {
      console.error(`[DemoSeed] dev_project_units chunk ${i}:`, error.message);
    } else {
      allIds.push(...chunk.map(r => (r as Record<string, unknown>).id as string));
    }
  }
  if (import.meta.env.DEV) console.log(`[DemoSeed] ✓ dev_project_units: ${allIds.length}`);
  return allIds;
}

// ─── Landlord Context (ensure exists for property linkage) ──

const DEMO_LANDLORD_CONTEXT_ID = 'd0000000-0000-4000-a000-000000000010';

async function ensureLandlordContext(tenantId: string): Promise<string | null> {
  // Check if it already exists
  const { data: existing } = await (supabase as any)
    .from('landlord_contexts')
    .select('id')
    .eq('id', DEMO_LANDLORD_CONTEXT_ID)
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (existing) return DEMO_LANDLORD_CONTEXT_ID;

  // Create it
  const { error } = await (supabase as any)
    .from('landlord_contexts')
    .insert({
      id: DEMO_LANDLORD_CONTEXT_ID,
      tenant_id: tenantId,
      name: 'Familie Mustermann',
    });

  if (error) {
    console.error('[DemoSeed] landlord_contexts:', error.message);
    return null;
  }
  // Register for cleanup
  await registerEntities(tenantId, 'landlord_contexts', [DEMO_LANDLORD_CONTEXT_ID]);
  if (import.meta.env.DEV) console.log('[DemoSeed] ✓ landlord_contexts: 1');
  return DEMO_LANDLORD_CONTEXT_ID;
}

async function seedOwnerPets(tenantId: string, userId: string): Promise<string[]> {
  // Owner pets only (Luna, Bello) — Max Mustermanns eigene Tiere für MOD-05
  const ownerPets = [
    {
      id: DEMO_PET_LUNA,
      tenant_id: tenantId,
      owner_user_id: userId,
      name: 'Luna',
      species: 'dog',
      breed: 'Golden Retriever',
      birth_date: '2023-04-15',
      gender: 'female',
      weight_kg: 28,
      chip_number: 'DE123456789',
      notes: 'Sehr verspielt, liebt Wasser',
      neutered: true,
      allergies: ['Getreide'],
      insurance_provider: 'Allianz Tierkrankenversicherung',
      insurance_policy_no: 'TK-2023-98765',
      vet_name: 'Dr. Müller (Tierarztpraxis am Park)',
      photo_url: 'https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=400&h=500&fit=crop&crop=face',
    },
    {
      id: DEMO_PET_BELLO,
      tenant_id: tenantId,
      owner_user_id: userId,
      name: 'Bello',
      species: 'dog',
      breed: 'Dackel',
      birth_date: '2021-09-01',
      gender: 'male',
      weight_kg: 9,
      chip_number: 'DE987654321',
      notes: 'Stubenrein, bellt wenig',
      neutered: false,
      allergies: [],
      vet_name: 'Dr. Schmidt (Kleintierpraxis Mitte)',
      photo_url: 'https://images.unsplash.com/photo-1612195583950-b8fd34c87093?w=400&h=500&fit=crop&crop=face',
    },
  ];

  // Insert one at a time for error isolation
  const allIds: string[] = [];
  for (const pet of ownerPets) {
    const { error } = await (supabase as any)
      .from('pets')
      .upsert(pet, { onConflict: 'id' });

    if (error) {
      console.error(`[DemoSeed] pets (owner) ${pet.name}:`, error.message, error.details);
    } else {
      allIds.push(pet.id);
    }
  }

  if (import.meta.env.DEV) console.log(`[DemoSeed] ✓ pets (owner): ${allIds.length}`);
  return allIds;
}

// ─── Profile Seed (UPDATE, not INSERT) ─────────────────────

const PROFILE_SEED_FIELDS = [
  'first_name', 'last_name', 'display_name', 'street', 'house_number',
  'postal_code', 'city', 'country', 'phone_mobile', 'phone_landline',
  'phone_whatsapp', 'tax_number', 'tax_id', 'is_business', 'person_mode',
] as const;

async function seedProfile(userId: string): Promise<string[]> {
  const rows = await fetchCSV('/demo-data/demo_profile.csv');
  if (!rows.length) return [];

  const row = rows[0];
  const updateData: Record<string, unknown> = {};
  for (const key of PROFILE_SEED_FIELDS) {
    if (row[key] !== undefined && row[key] !== null) {
      updateData[key] = coerceValue(String(row[key]), key);
    }
  }

  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', userId);

  if (error) {
    console.error('[DemoSeed] profiles:', error.message);
    return [];
  }
  if (import.meta.env.DEV) console.log('[DemoSeed] ✓ profiles: 1 (update)');
  return [userId];
}

// ─── Property Accounting (AfA data from demoPropertyData.ts) ──

async function seedPropertyAccounting(tenantId: string, insertedPropertyIds: string[]): Promise<void> {
  const rows = DEMO_PROPERTY_ACCOUNTING
    .filter(p => insertedPropertyIds.includes(p.propertyId))
    .map(p => ({
      id: `e0000000-0000-4000-a000-0000afa0000${insertedPropertyIds.indexOf(p.propertyId) + 1}`,
      property_id: p.propertyId,
      tenant_id: tenantId,
      building_share_percent: p.afa.buildingSharePercent,
      land_share_percent: p.afa.landSharePercent,
      afa_rate_percent: p.afa.afaRatePercent,
      afa_start_date: p.afa.afaStartDate,
      afa_method: p.afa.afaMethod,
      afa_model: p.afa.afaModel,
      ak_ground: p.afa.akGround,
      ak_building: p.afa.akBuilding,
      ak_ancillary: p.afa.akAncillary,
      modernization_costs_eur: p.afa.modernizationCostsEur,
      sonder_afa_annual: p.afa.sonderAfaAnnual,
      denkmal_afa_annual: p.afa.denkmalAfaAnnual,
      book_value_eur: p.afa.bookValueEur,
      cumulative_afa: p.afa.cumulativeAfa,
    }));

  if (!rows.length) return;

  const { error } = await (supabase as any)
    .from('property_accounting')
    .upsert(rows, { onConflict: 'id' });

  if (error) {
    console.error('[DemoSeed] property_accounting:', error.message);
  } else {
    if (import.meta.env.DEV) console.log(`[DemoSeed] ✓ property_accounting: ${rows.length}`);
    await registerEntities(tenantId, 'property_accounting', rows.map(r => r.id));
  }
}

// ─── Properties (INSERT-based to fire DB triggers) ─────────

/**
 * Properties MUST use INSERT (not upsert) so that DB triggers fire:
 * - trg_set_property_public_id → generates public_id
 * - trg_generate_property_code → generates code  
 * - trg_property_create_default_unit → auto-creates a MAIN unit
 * - property_folder_structure → creates DMS folder tree in storage_nodes
 *
 * Each property is cleaned up and inserted individually for error isolation.
 * If one property fails, the others still get seeded.
 */
async function seedProperties(
  tenantId: string,
  landlordContextId?: string
): Promise<string[]> {
  const rows = await fetchCSV('/demo-data/demo_properties.csv');
  if (!rows.length) return [];

  const allIds: string[] = [];

  for (const row of rows) {
    const propId = row.id as string;
    if (import.meta.env.DEV) console.log(`[DemoSeed] Property ${propId}: starting cleanup...`);

    // Step 1: Per-property thorough cleanup (children first, parent last)
    try {
      // 1a. Delete storage_nodes by property_id (normal case)
      await (supabase as any).from('storage_nodes').delete().eq('property_id', propId);

      // 1a2. Delete ORPHANED storage_nodes (property_id IS NULL) that match the address pattern
      const address = (row.address as string) || '';
      if (address) {
        await (supabase as any)
          .from('storage_nodes')
          .delete()
          .eq('tenant_id', tenantId)
          .is('property_id', null)
          .like('name', `%${address}%`);
      }

      // 1b. Delete sales workflow children (listing_publications → listings → property_features)
      const { data: existingListings } = await (supabase as any)
        .from('listings').select('id').eq('property_id', propId);
      if (existingListings?.length) {
        const listingIds = existingListings.map((l: { id: string }) => l.id);
        await (supabase as any).from('listing_publications').delete().in('listing_id', listingIds);
        await (supabase as any).from('listings').delete().in('id', listingIds);
      }
      await (supabase as any).from('property_features').delete().eq('property_id', propId);

      // 1c. Delete property_accounting (AfA data)
      await (supabase as any).from('property_accounting').delete().eq('property_id', propId);

      // 1c. Delete loans
      await (supabase as any).from('loans').delete().eq('property_id', propId);

      // 1d. Find existing units → delete their leases first, then units
      const { data: existingUnits } = await (supabase as any)
        .from('units')
        .select('id')
        .eq('property_id', propId);

      if (existingUnits?.length) {
        const unitIds = existingUnits.map((u: { id: string }) => u.id);
        await (supabase as any).from('leases').delete().in('unit_id', unitIds);
        await (supabase as any).from('units').delete().in('id', unitIds);
      }

      // 1e. Delete the property itself
      await (supabase as any).from('properties').delete().eq('id', propId);
    } catch (cleanupErr) {
      console.warn(`[DemoSeed] Cleanup warning for property ${propId}:`, cleanupErr);
    }

    // Step 2: Small delay for CASCADE/cleanup to settle
    await new Promise(r => setTimeout(r, 300));

    // Step 3: INSERT property (triggers fire for code, MAIN unit, DMS folders)
    const data = stripNulls({ ...row, tenant_id: tenantId });
    // Remove trigger-generated code (but KEEP public_id — it's NOT NULL)
    delete data.code;
    // Map CSV usage_type to DB expected values
    if (data.usage_type === 'residential') data.usage_type = 'Vermietung';
    if (landlordContextId) data.landlord_context_id = landlordContextId;

    // Fallback: market_value from DEMO_PROPERTY_ACCOUNTING if CSV parsing failed
    const MARKET_VALUE_FALLBACK: Record<string, number> = {
      'd0000000-0000-4000-a000-000000000001': 340000,
      'd0000000-0000-4000-a000-000000000002': 520000,
      'd0000000-0000-4000-a000-000000000003': 210000,
    };
    if (!data.market_value && MARKET_VALUE_FALLBACK[propId]) {
      data.market_value = MARKET_VALUE_FALLBACK[propId];
      if (import.meta.env.DEV) console.log(`[DemoSeed] market_value fallback for ${propId}: ${data.market_value}`);
    }

    // Ensure rental_managed is set for demo properties
    if (data.rental_managed === undefined || data.rental_managed === null) {
      data.rental_managed = true;
    }

    const { error } = await (supabase as any)
      .from('properties')
      .insert(data);

    if (error) {
      console.error(`[DemoSeed] ✗ property INSERT ${propId}:`, error.message, error.details);
    } else {
      allIds.push(propId);
      if (import.meta.env.DEV) console.log(`[DemoSeed] ✓ property ${propId} inserted (market_value=${data.market_value}, rental_managed=${data.rental_managed})`);
    }
  }

  // Step 4: Seed property_accounting (AfA data) for successfully inserted properties
  if (allIds.length > 0) {
    await seedPropertyAccounting(tenantId, allIds);
  }

  if (import.meta.env.DEV) console.log(`[DemoSeed] ✓ properties total: ${allIds.length}/${rows.length}`);
  return allIds;
}

// ─── Units — old seedUnits removed, now handled inline in orchestrator ──

// ─── Leases (remap unit_id from CSV to actual trigger-created IDs) ──

/**
 * Leases reference unit_id, but the actual unit IDs are trigger-generated.
 * We build a mapping from CSV unit IDs → actual unit IDs via property_id.
 */
async function seedLeases(
  tenantId: string,
  unitIdMap: Map<string, string>
): Promise<string[]> {
  const rows = await fetchCSV('/demo-data/demo_leases.csv');
  if (!rows.length) return [];

  const allIds: string[] = [];
  for (const row of rows) {
    const csvUnitId = row.unit_id as string;
    const actualUnitId = unitIdMap.get(csvUnitId);
    
    if (!actualUnitId) {
      console.warn(`[DemoSeed] leases: no mapped unit for CSV id ${csvUnitId}`);
      continue;
    }

    const data = stripNulls({ ...row, tenant_id: tenantId, unit_id: actualUnitId });

    const { error } = await (supabase as any)
      .from('leases')
      .upsert(data, { onConflict: 'id' });

    if (error) {
      console.error(`[DemoSeed] leases ${row.id}:`, error.message);
    } else {
      allIds.push(row.id as string);
    }
  }

  if (import.meta.env.DEV) console.log(`[DemoSeed] ✓ leases: ${allIds.length}`);
  return allIds;
}

// ─── Household Persons (dynamic hauptperson ID) ───────────

async function seedHouseholdPersons(tenantId: string, userId: string): Promise<string[]> {
  const rows = await fetchCSV('/demo-data/demo_household_persons.csv');
  if (!rows.length) return [];

  // Pre-cleanup: delete any manually created household persons for this tenant/user
  // to avoid unique constraint collisions when upserting
  await (supabase as any)
    .from('household_persons')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('user_id', userId);

  const data = rows.map((r, idx) => {
    const row: Record<string, unknown> = { ...r, tenant_id: tenantId, user_id: userId };
    // Keep the CSV-defined IDs (do NOT replace hauptperson ID with userId)
    // This ensures stable demo IDs that other entities can reference via person_id
    // Ensure sort_order is always a number (NOT NULL in DB, default 0)
    if (row.sort_order === null || row.sort_order === undefined || row.sort_order === '') {
      row.sort_order = idx;
    } else {
      row.sort_order = Number(row.sort_order);
    }
    // Ensure is_primary is boolean
    row.is_primary = row.is_primary === true || row.is_primary === 'true';
    // Explicitly null out empty numeric fields for children
    for (const numKey of ['gross_income_monthly', 'net_income_monthly', 'child_allowances']) {
      if (row[numKey] === '' || row[numKey] === undefined) row[numKey] = null;
    }
    // Strip truly null values but KEEP 0 and false
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) {
      if (v !== null && v !== undefined && v !== '') cleaned[k] = v;
    }
    // Re-add sort_order even if 0 (it's required NOT NULL)
    cleaned.sort_order = row.sort_order;
    return cleaned;
  });

  const allIds: string[] = [];
  // Insert one at a time for better error isolation
  for (const record of data) {
    const { error } = await (supabase as any)
      .from('household_persons')
      .upsert(record, { onConflict: 'id' });
    if (error) {
      console.error(`[DemoSeed] household_persons ${record.id}:`, error.message, error.details);
    } else {
      allIds.push(record.id as string);
    }
  }
  if (import.meta.env.DEV) console.log(`[DemoSeed] ✓ household_persons: ${allIds.length}`);
  return allIds;
}

// ─── Vorsorge Contracts ────────────────────────────────────

async function seedVorsorgeContracts(tenantId: string, userId: string): Promise<string[]> {
  const rows = await fetchCSV('/demo-data/demo_vorsorge_contracts.csv');
  if (!rows.length) return [];

  // Keep CSV person_id as-is (household_persons now uses CSV IDs, no placeholder replacement)
  const data = rows.map(r => {
    return stripNulls({ ...r, tenant_id: tenantId, user_id: userId });
  });

  const allIds: string[] = [];
  for (let i = 0; i < data.length; i += 50) {
    const chunk = data.slice(i, i + 50);
    const { error } = await (supabase as any)
      .from('vorsorge_contracts')
      .upsert(chunk, { onConflict: 'id' });
    if (error) {
      console.error(`[DemoSeed] vorsorge_contracts chunk ${i}:`, error.message);
    } else {
      allIds.push(...chunk.map(r => (r as Record<string, unknown>).id as string));
    }
  }
  if (import.meta.env.DEV) console.log(`[DemoSeed] ✓ vorsorge_contracts: ${allIds.length}`);
  return allIds;
}

// ─── Pension Records (DRV data) ────────────────────────────

async function seedPensionRecords(tenantId: string, userId: string): Promise<string[]> {
  const rows = await fetchCSV('/demo-data/demo_pension_records.csv');
  if (!rows.length) return [];

  // Keep CSV person_id as-is (household_persons now uses CSV IDs, no placeholder replacement)
  const data = rows.map(r => {
    return stripNulls({ ...r, tenant_id: tenantId });
  });

  const allIds: string[] = [];
  for (const record of data) {
    const { error } = await (supabase as any)
      .from('pension_records')
      .upsert(record, { onConflict: 'id' });
    if (error) {
      console.error(`[DemoSeed] pension_records ${record.id}:`, error.message);
    } else {
      allIds.push(record.id as string);
    }
  }
  if (import.meta.env.DEV) console.log(`[DemoSeed] ✓ pension_records: ${allIds.length}`);
  return allIds;
}

// ─── Main Seed Orchestrator ────────────────────────────────

export interface SeedProgressInfo {
  current: number;
  total: number;
  percent: number;
  entityType: string;
  status: 'seeding' | 'done' | 'error';
}

export type SeedProgressCallback = (info: SeedProgressInfo) => void;

export interface DemoSeedResult {
  success: boolean;
  seeded: Record<string, number>;
  errors: string[];
}

/** Total number of seed() calls in the orchestrator — keep in sync! */
const TOTAL_SEED_STEPS = 30;

export async function seedDemoData(
  tenantId: string,
  _landlordContextId?: string,
  onProgress?: SeedProgressCallback
): Promise<DemoSeedResult> {
  const errors: string[] = [];
  const seeded: Record<string, number> = {};
  const userId = await getCurrentUserId();

  if (!userId) {
    return { success: false, seeded, errors: ['No authenticated user'] };
  }

  if (import.meta.env.DEV) console.log(`[DemoSeed] Starting seed for tenant ${tenantId}...`);

  let stepCounter = 0;

  async function seed(entityType: string, fn: () => Promise<string[]>) {
    stepCounter++;
    const current = stepCounter;
    onProgress?.({ current, total: TOTAL_SEED_STEPS, percent: Math.round((current / TOTAL_SEED_STEPS) * 100), entityType, status: 'seeding' });
    try {
      const ids = await fn();
      seeded[entityType] = ids.length;
      await registerEntities(tenantId, entityType, ids);
      onProgress?.({ current, total: TOTAL_SEED_STEPS, percent: Math.round((current / TOTAL_SEED_STEPS) * 100), entityType, status: 'done' });
    } catch (err) {
      const msg = `${entityType}: ${err instanceof Error ? err.message : 'Unknown'}`;
      errors.push(msg);
      console.error(`[DemoSeed] ✗ ${msg}`);
      onProgress?.({ current, total: TOTAL_SEED_STEPS, percent: Math.round((current / TOTAL_SEED_STEPS) * 100), entityType, status: 'error' });
    }
  }

  // Phase 0: Profile (UPDATE existing row)
  await seed('profile', () => seedProfile(userId));

  // Phase 0.5: Ensure landlord context exists
  const landlordContextId = await ensureLandlordContext(tenantId);

  // Phase 1: Core entities (FK targets)
  await seed('contacts', () => seedFromCSV('/demo-data/demo_contacts.csv', 'contacts', tenantId));
  await seed('properties', () => seedProperties(tenantId, landlordContextId ?? undefined));

  // Phase 2: Property children
  // Wait for triggers to create MAIN units
  await new Promise(r => setTimeout(r, 1000));

  // Units: DELETE trigger-created MAIN units, then INSERT CSV units with correct demo IDs
  const unitIdMap = new Map<string, string>();
  await seed('units', async () => {
    const csvRows = await fetchCSV('/demo-data/demo_units.csv');
    if (!csvRows.length) return [];

    // Step 1: Delete ALL trigger-created MAIN units for this tenant
    await (supabase as any)
      .from('units')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('unit_number', 'MAIN');

    // Step 2: Upsert CSV units with their correct demo IDs
    const allIds: string[] = [];
    for (const row of csvRows) {
      const csvUnitId = row.id as string;
      const data = stripNulls({ ...row, tenant_id: tenantId });
      // Map CSV usage_type to DB values
      if (data.usage_type === 'residential') data.usage_type = 'Wohnen';
      delete data.public_id;

      const { error } = await (supabase as any)
        .from('units')
        .upsert(data, { onConflict: 'id' });

      if (error) {
        console.error(`[DemoSeed] units INSERT ${csvUnitId}:`, error.message);
      } else {
        unitIdMap.set(csvUnitId, csvUnitId);
        allIds.push(csvUnitId);
      }
    }
    if (import.meta.env.DEV) console.log(`[DemoSeed] ✓ units (DELETE MAIN + INSERT): ${allIds.length}`);
    return allIds;
  });
  await seed('leases', () => seedLeases(tenantId, unitIdMap));
  await seed('loans', () => seedFromCSV('/demo-data/demo_loans.csv', 'loans', tenantId));

  // Phase 2.5: Sales Workflow (property_features → listings → listing_publications)
  await seed('property_features', () => seedFromCSV('/demo-data/demo_property_features.csv', 'property_features', tenantId));
  await seed('listings', () => seedFromCSV('/demo-data/demo_listings.csv', 'listings', tenantId, { created_by: userId }));
  await seed('listing_publications', () => seedFromCSV('/demo-data/demo_listing_publications.csv', 'listing_publications', tenantId));

  // Phase 3: Bank
  await seed('msv_bank_accounts', () => seedFromCSV('/demo-data/demo_bank_accounts.csv', 'msv_bank_accounts', tenantId));
  await seed('bank_transactions', () => seedFromCSV('/demo-data/demo_bank_transactions.csv', 'bank_transactions', tenantId));

  // Phase 4: Household & Finance — household_persons MUST succeed before vorsorge/depots
  await seed('household_persons', () => seedHouseholdPersons(tenantId, userId));
  // cars_vehicles: delete orphaned storage_nodes first, then use created_by
  await seed('cars_vehicles', async () => {
    // Pre-cleanup: remove storage_nodes that reference these vehicle IDs via entity_type/entity_id
    const vehicleIds = [
      'd0000000-0000-4000-a000-000000000301', 'd0000000-0000-4000-a000-000000000302',
      'd0000000-0000-4000-a000-000000000303', 'd0000000-0000-4000-a000-000000000304',
      'd0000000-0000-4000-a000-000000000305', 'd0000000-0000-4000-a000-000000000306',
    ];
    const oldVehicleIds = [
      '00000000-0000-4000-a000-000000000301', '00000000-0000-4000-a000-000000000302',
      'd0000000-0000-4000-a000-000000000303', 'd0000000-0000-4000-a000-000000000304',
      'd0000000-0000-4000-a000-000000000305', 'd0000000-0000-4000-a000-000000000306',
    ];
    const allIds = [...vehicleIds, ...oldVehicleIds];
    // storage_nodes uses entity_type + entity_id pattern (no vehicle_id/car_id columns)
    await (supabase as any).from('storage_nodes').delete().eq('entity_type', 'vehicle').in('entity_id', allIds);
    await (supabase as any).from('storage_nodes').delete().eq('module_code', 'MOD-17').in('entity_id', allIds);
    // Delete old-pattern vehicles
    try { await (supabase as any).from('cars_vehicles').delete().in('id', oldVehicleIds); } catch {}
    return seedFromCSV('/demo-data/demo_vehicles.csv', 'cars_vehicles', tenantId, { created_by: userId });
  });
  await seed('pv_plants', () => seedFromCSV('/demo-data/demo_pv_plants.csv', 'pv_plants', tenantId));
  await seed('insurance_contracts', () => seedInsuranceContracts(tenantId, userId));
  await seed('kv_contracts', () => seedKvContracts(tenantId));
  await seed('vorsorge_contracts', () => seedVorsorgeContracts(tenantId, userId));
  await seed('pension_records', () => seedPensionRecords(tenantId, userId));
  await seed('user_subscriptions', () => seedFromCSV('/demo-data/demo_user_subscriptions.csv', 'user_subscriptions', tenantId, { user_id: userId }));
  await seed('private_loans', () => seedFromCSV('/demo-data/demo_private_loans.csv', 'private_loans', tenantId, { user_id: userId }));

  // Phase 4.5: Finance Requests (MOD-07/MOD-11)
  await seed('finance_requests', () => seedFromCSV('/demo-data/demo_finance_requests.csv', 'finance_requests', tenantId, { created_by: userId }));
  await seed('applicant_profiles', () => seedFromCSV('/demo-data/demo_applicant_profiles.csv', 'applicant_profiles', tenantId));
  await seed('finance_mandates', () => seedFromCSV('/demo-data/demo_finance_mandates.csv', 'finance_mandates', tenantId, { assigned_manager_id: userId }));

  // Phase 5: Miety (Zuhause)
  await seed('miety_homes', () => seedFromCSV('/demo-data/demo_miety_homes.csv', 'miety_homes', tenantId, { user_id: userId }));
  await seed('miety_contracts', () => seedFromCSV('/demo-data/demo_miety_contracts.csv', 'miety_contracts', tenantId));

  // Phase 6: Akquise
  await seed('acq_mandates', () => seedAcqMandates(tenantId, userId));
  await seed('acq_offers', () => seedAcqOffers(tenantId));

  // Phase 6.5: Dev Projects (MOD-13)
  await seed('dev_projects', () => seedDevProject(tenantId, userId));
  await seed('dev_project_units', () => seedDevProjectUnits(tenantId));

  // Phase 7: Owner Pets only (Luna + Bello — Max Mustermanns eigene Tiere für MOD-05)
  // Pet Manager business data (providers, services, customers, bookings, z1_customers)
  // gehört zum Lennox Partner-Tenant und wird NICHT im Golden Tenant geseedet.
  await seed('pets', () => seedOwnerPets(tenantId, userId));

  // ─── Diagnostics: Soll vs. Ist ───────────────────────────
  const EXPECTED: Record<string, number> = {
    profile: 1, contacts: 5, landlord_contexts: 1,
    properties: 3, units: 3, leases: 3, loans: 3, property_accounting: 3,
    property_features: 2, listings: 1, listing_publications: 2,
    msv_bank_accounts: 1, bank_transactions: 100,
    household_persons: 4, cars_vehicles: 2, pv_plants: 1,
    insurance_contracts: 7, kv_contracts: 4, vorsorge_contracts: 6,
    pension_records: 2,
    user_subscriptions: 7, private_loans: 2,
    miety_homes: 1, miety_contracts: 5,
    acq_mandates: 1, acq_offers: 1,
    dev_projects: 1, dev_project_units: 24,
    finance_requests: 2, applicant_profiles: 3, finance_mandates: 2,
    pets: 2,
  };

  if (import.meta.env.DEV) {
    console.log('\n[DemoSeed] ══════════════════════════════════════════');
    console.log('[DemoSeed] DIAGNOSE: Soll vs. Ist');
    console.log('[DemoSeed] ──────────────────────────────────────────');
    let allOk = true;
    for (const [entity, expected] of Object.entries(EXPECTED)) {
      const actual = seeded[entity] ?? 0;
      const status = actual >= expected ? '✅' : '❌';
      if (actual < expected) allOk = false;
      console.log(`[DemoSeed] ${status} ${entity}: ${actual}/${expected}`);
    }
    console.log('[DemoSeed] ──────────────────────────────────────────');
    console.log(`[DemoSeed] Gesamt: ${allOk ? '✅ VOLLSTÄNDIG' : '❌ UNVOLLSTÄNDIG'}`);
    if (errors.length) console.warn('[DemoSeed] Fehler:', errors);
    console.log('[DemoSeed] ══════════════════════════════════════════\n');
  }

  return { success: errors.length === 0, seeded, errors };
}

/** Check if demo data has already been seeded for this tenant */
export async function isDemoSeeded(tenantId: string): Promise<boolean> {
  const { count } = await (supabase as any)
    .from('test_data_registry')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('batch_name', 'demo-ssot');

  return (count ?? 0) > 0;
}
