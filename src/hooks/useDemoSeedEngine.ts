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
  DEMO_PET_LUNA,
  DEMO_PET_BELLO,
} from '@/engines/demoData/data';

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
  // pet_bookings
  'duration_minutes', 'price_cents',
  // kv
  'monthly_premium', 'employer_contribution',
]);

/** Boolean columns */
const BOOLEAN_KEYS = new Set([
  'is_demo', 'weg_flag', 'is_default', 'is_public_listing',
  'is_primary', 'has_battery', 'mastr_account_present',
  'is_business',
]);

function coerceValue(value: string, key: string): unknown {
  if (value === '' || value === 'null' || value === undefined) return null;
  if (BOOLEAN_KEYS.has(key)) return value === 'true';
  if (NUMERIC_KEYS.has(key)) {
    const num = parseFloat(value);
    return isNaN(num) ? value : num;
  }
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
  return parseCSV(text).map(coerceRow);
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
    if (error) console.warn(`[DemoSeed] Registry ${entityType} chunk ${i}:`, error.message);
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
      console.error(`[DemoSeed] ${tableName} chunk ${i}:`, error.message);
    } else {
      allIds.push(...chunk.map(r => (r as Record<string, unknown>).id as string));
    }
  }

  console.log(`[DemoSeed] ✓ ${tableName}: ${allIds.length}`);
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
  console.log(`[DemoSeed] ✓ insurance_contracts: ${data.length}`);
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
  console.log(`[DemoSeed] ✓ kv_contracts: ${data.length}`);
  return kvIds;
}

async function seedAcqMandates(tenantId: string, userId: string): Promise<string[]> {
  const m = DEMO_ACQ_MANDATE;
  const data = {
    id: DEMO_ACQ_MANDATE_ID,
    tenant_id: tenantId,
    created_by_user_id: userId,
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
  console.log('[DemoSeed] ✓ acq_mandates: 1');
  return [DEMO_ACQ_MANDATE_ID];
}

async function seedPets(tenantId: string, userId: string): Promise<string[]> {
  // Owner pets (Luna, Bello)
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

  // PM pets (Rocky, Mia, Oskar) — linked to pet_customers, no owner_user_id
  const pmPets = [
    {
      id: 'd0000000-0000-4000-a000-000000001010',
      tenant_id: tenantId,
      customer_id: 'd0000000-0000-4000-a000-000000001001',
      name: 'Rocky', species: 'dog', breed: 'Labrador Retriever',
      birth_date: '2022-05-10', gender: 'male', weight_kg: 32,
      chip_number: '276098102345678',
      notes: 'Futtermittelallergie (kein Huhn), sehr freundlich, verträgt sich gut mit anderen Hunden',
      neutered: false, allergies: [],
    },
    {
      id: 'd0000000-0000-4000-a000-000000001011',
      tenant_id: tenantId,
      customer_id: 'd0000000-0000-4000-a000-000000001002',
      name: 'Mia', species: 'dog', breed: 'Golden Retriever',
      birth_date: '2024-01-15', gender: 'female', weight_kg: 28,
      chip_number: '276098102345679',
      notes: 'Junghund, noch etwas schüchtern bei neuen Hunden',
      neutered: false, allergies: [],
    },
    {
      id: 'd0000000-0000-4000-a000-000000001012',
      tenant_id: tenantId,
      customer_id: 'd0000000-0000-4000-a000-000000001002',
      name: 'Oskar', species: 'dog', breed: 'Dackel',
      birth_date: '2019-08-22', gender: 'male', weight_kg: 9,
      chip_number: '276098102345680',
      notes: 'Senior, Arthrose in Hinterläufen, braucht Rampe',
      neutered: false, allergies: [],
    },
  ];

  const allPets = [...ownerPets, ...pmPets];
  const { error } = await (supabase as any)
    .from('pets')
    .upsert(allPets, { onConflict: 'id' });

  if (error) { console.error('[DemoSeed] pets:', error.message); return []; }
  console.log(`[DemoSeed] ✓ pets: ${allPets.length}`);
  return allPets.map(p => p.id);
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
  console.log('[DemoSeed] ✓ profiles: 1 (update)');
  return [userId];
}

// ─── Main Seed Orchestrator ────────────────────────────────

export interface DemoSeedResult {
  success: boolean;
  seeded: Record<string, number>;
  errors: string[];
}

export async function seedDemoData(
  tenantId: string,
  landlordContextId?: string
): Promise<DemoSeedResult> {
  const errors: string[] = [];
  const seeded: Record<string, number> = {};
  const userId = await getCurrentUserId();

  if (!userId) {
    return { success: false, seeded, errors: ['No authenticated user'] };
  }

  console.log(`[DemoSeed] Starting seed for tenant ${tenantId}...`);

  async function seed(entityType: string, fn: () => Promise<string[]>) {
    try {
      const ids = await fn();
      seeded[entityType] = ids.length;
      await registerEntities(tenantId, entityType, ids);
    } catch (err) {
      const msg = `${entityType}: ${err instanceof Error ? err.message : 'Unknown'}`;
      errors.push(msg);
      console.error(`[DemoSeed] ✗ ${msg}`);
    }
  }

  // Phase 0: Profile (UPDATE existing row)
  await seed('profile', () => seedProfile(userId));

  // Phase 1: Core entities (FK targets)
  await seed('contacts', () => seedFromCSV('/demo-data/demo_contacts.csv', 'contacts', tenantId));
  await seed('properties', () => seedFromCSV('/demo-data/demo_properties.csv', 'properties', tenantId,
    landlordContextId ? { landlord_context_id: landlordContextId } : undefined));

  // Phase 2: Property children
  await seed('units', () => seedFromCSV('/demo-data/demo_units.csv', 'units', tenantId));
  await seed('leases', () => seedFromCSV('/demo-data/demo_leases.csv', 'leases', tenantId));
  await seed('loans', () => seedFromCSV('/demo-data/demo_loans.csv', 'loans', tenantId));

  // Phase 3: Bank
  await seed('msv_bank_accounts', () => seedFromCSV('/demo-data/demo_bank_accounts.csv', 'msv_bank_accounts', tenantId));
  await seed('bank_transactions', () => seedFromCSV('/demo-data/demo_bank_transactions.csv', 'bank_transactions', tenantId));

  // Phase 4: Household & Finance
  await seed('household_persons', () => seedFromCSV('/demo-data/demo_household_persons.csv', 'household_persons', tenantId, { user_id: userId }));
  await seed('cars_vehicles', () => seedFromCSV('/demo-data/demo_vehicles.csv', 'cars_vehicles', tenantId, { user_id: userId }));
  await seed('pv_plants', () => seedFromCSV('/demo-data/demo_pv_plants.csv', 'pv_plants', tenantId));
  await seed('insurance_contracts', () => seedInsuranceContracts(tenantId, userId));
  await seed('kv_contracts', () => seedKvContracts(tenantId));
  await seed('vorsorge_contracts', () => seedFromCSV('/demo-data/demo_vorsorge_contracts.csv', 'vorsorge_contracts', tenantId, { user_id: userId }));
  await seed('user_subscriptions', () => seedFromCSV('/demo-data/demo_user_subscriptions.csv', 'user_subscriptions', tenantId, { user_id: userId }));
  await seed('private_loans', () => seedFromCSV('/demo-data/demo_private_loans.csv', 'private_loans', tenantId, { user_id: userId }));

  // Phase 5: Miety (Zuhause)
  await seed('miety_homes', () => seedFromCSV('/demo-data/demo_miety_homes.csv', 'miety_homes', tenantId, { user_id: userId }));
  await seed('miety_contracts', () => seedFromCSV('/demo-data/demo_miety_contracts.csv', 'miety_contracts', tenantId));

  // Phase 6: Akquise
  await seed('acq_mandates', () => seedAcqMandates(tenantId, userId));

  // Phase 7: Pet Manager (customers before pets before bookings)
  await seed('pet_customers', () => seedFromCSV('/demo-data/demo_pet_customers.csv', 'pet_customers', tenantId));
  await seed('pets', () => seedPets(tenantId, userId));
  await seed('pet_bookings', () => seedFromCSV('/demo-data/demo_pet_bookings.csv', 'pet_bookings', tenantId));

  console.log('[DemoSeed] ✓ Seeding complete:', seeded);
  if (errors.length) console.warn('[DemoSeed] Errors:', errors);

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
