/**
 * Demo Seed Engine — Reads CSV SSOT files and writes to DB via SDK
 * 
 * Replaces the old `seed_golden_path_data` RPC approach.
 * All demo data comes from `public/demo-data/*.csv` files.
 * Every seeded entity is tracked in `test_data_registry`.
 * 
 * @demo-data
 */

import { supabase } from '@/integrations/supabase/client';

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
  'total_area_sqm', 'purchase_price', 'year_built', 'area_sqm', 'rooms',
  'current_monthly_rent', 'ancillary_costs', 'hausgeld_monthly',
  'monthly_rent', 'rent_cold_eur', 'nk_advance_eur', 'heating_advance_eur',
  'payment_due_day', 'deposit_amount_eur', 'deposit_amount',
  'original_amount', 'interest_rate_percent', 'annuity_monthly_eur',
  'repayment_rate_percent', 'outstanding_balance_eur',
  'amount_eur', 'floor',
]);

/** Boolean columns */
const BOOLEAN_KEYS = new Set([
  'is_demo', 'weg_flag', 'is_default', 'is_public_listing',
]);

function coerceValue(value: string, key: string): unknown {
  if (value === '' || value === 'null' || value === undefined) return null;
  if (BOOLEAN_KEYS.has(key)) {
    return value === 'true';
  }
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

/** Stable deterministic batch ID for demo-ssot */
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

    if (error) {
      console.warn(`[DemoSeed] Registry insert failed for ${entityType} (chunk ${i}):`, error.message);
    }
  }
}

// ─── Helpers ───────────────────────────────────────────────

/** Remove null/undefined values from an object to avoid sending explicit nulls for NOT NULL columns with defaults */
function stripNulls(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== null && v !== undefined) result[k] = v;
  }
  return result;
}

// ─── Seed Functions ────────────────────────────────────────

async function seedContacts(tenantId: string): Promise<string[]> {
  const rows = await fetchCSV('/demo-data/demo_contacts.csv');
  if (!rows.length) return [];

  const data = rows.map(r => stripNulls({ ...r, tenant_id: tenantId }));
  const { error } = await (supabase as any)
    .from('contacts')
    .upsert(data, { onConflict: 'id' });

  if (error) console.error('[DemoSeed] contacts:', error.message);
  else console.log(`[DemoSeed] ✓ contacts: ${rows.length}`);
  return rows.map(r => r.id as string);
}

async function seedProperties(tenantId: string, landlordContextId?: string): Promise<string[]> {
  const rows = await fetchCSV('/demo-data/demo_properties.csv');
  if (!rows.length) return [];

  const data = rows.map(r => stripNulls({
    ...r,
    tenant_id: tenantId,
    ...(landlordContextId ? { landlord_context_id: landlordContextId } : {}),
  }));
  const { error } = await (supabase as any)
    .from('properties')
    .upsert(data, { onConflict: 'id' });

  if (error) console.error('[DemoSeed] properties:', error.message);
  else console.log(`[DemoSeed] ✓ properties: ${rows.length}`);
  return rows.map(r => r.id as string);
}

async function seedUnits(tenantId: string): Promise<string[]> {
  const rows = await fetchCSV('/demo-data/demo_units.csv');
  if (!rows.length) return [];

  const data = rows.map(r => stripNulls({ ...r, tenant_id: tenantId }));
  const { error } = await (supabase as any)
    .from('units')
    .upsert(data, { onConflict: 'id' });

  if (error) console.error('[DemoSeed] units:', error.message);
  else console.log(`[DemoSeed] ✓ units: ${rows.length}`);
  return rows.map(r => r.id as string);
}

async function seedLeases(tenantId: string): Promise<string[]> {
  const rows = await fetchCSV('/demo-data/demo_leases.csv');
  if (!rows.length) return [];

  const data = rows.map(r => {
    const cleaned = stripNulls({ ...r, tenant_id: tenantId });
    return cleaned;
  });
  const { error } = await (supabase as any)
    .from('leases')
    .upsert(data, { onConflict: 'id' });

  if (error) console.error('[DemoSeed] leases:', error.message);
  else console.log(`[DemoSeed] ✓ leases: ${rows.length}`);
  return rows.map(r => r.id as string);
}

async function seedLoans(tenantId: string): Promise<string[]> {
  const rows = await fetchCSV('/demo-data/demo_loans.csv');
  if (!rows.length) return [];

  const data = rows.map(r => stripNulls({ ...r, tenant_id: tenantId }));
  const { error } = await (supabase as any)
    .from('loans')
    .upsert(data, { onConflict: 'id' });

  if (error) console.error('[DemoSeed] loans:', error.message);
  else console.log(`[DemoSeed] ✓ loans: ${rows.length}`);
  return rows.map(r => r.id as string);
}

async function seedBankAccounts(tenantId: string): Promise<string[]> {
  const rows = await fetchCSV('/demo-data/demo_bank_accounts.csv');
  if (!rows.length) return [];

  const data = rows.map(r => stripNulls({
    ...r,
    tenant_id: tenantId,
  }));
  const { error } = await (supabase as any)
    .from('msv_bank_accounts')
    .upsert(data, { onConflict: 'id' });

  if (error) console.error('[DemoSeed] msv_bank_accounts:', error.message);
  else console.log(`[DemoSeed] ✓ msv_bank_accounts: ${rows.length}`);
  return rows.map(r => r.id as string);
}

async function seedBankTransactions(tenantId: string): Promise<string[]> {
  const rows = await fetchCSV('/demo-data/demo_bank_transactions.csv');
  if (!rows.length) return [];

  const data = rows.map(r => stripNulls({
    ...r,
    tenant_id: tenantId,
  }));

  const allIds: string[] = [];
  for (let i = 0; i < data.length; i += 50) {
    const chunk = data.slice(i, i + 50);
    const { error } = await (supabase as any)
      .from('bank_transactions')
      .upsert(chunk, { onConflict: 'id' });

    if (error) {
      console.error(`[DemoSeed] bank_transactions chunk ${i}:`, error.message);
    } else {
      allIds.push(...chunk.map(r => (r as Record<string, unknown>).id as string));
    }
  }

  console.log(`[DemoSeed] ✓ bank_transactions: ${allIds.length}`);
  return allIds;
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

  console.log(`[DemoSeed] Starting seed for tenant ${tenantId}...`);

  try {
    // Order matters: contacts first (FK target), then properties, units, leases, loans, bank
    const contactIds = await seedContacts(tenantId);
    seeded.contacts = contactIds.length;
    await registerEntities(tenantId, 'contacts', contactIds);

    const propertyIds = await seedProperties(tenantId, landlordContextId);
    seeded.properties = propertyIds.length;
    await registerEntities(tenantId, 'properties', propertyIds);

    const unitIds = await seedUnits(tenantId);
    seeded.units = unitIds.length;
    await registerEntities(tenantId, 'units', unitIds);

    const leaseIds = await seedLeases(tenantId);
    seeded.leases = leaseIds.length;
    await registerEntities(tenantId, 'leases', leaseIds);

    const loanIds = await seedLoans(tenantId);
    seeded.loans = loanIds.length;
    await registerEntities(tenantId, 'loans', loanIds);

    const bankAccountIds = await seedBankAccounts(tenantId);
    seeded.msv_bank_accounts = bankAccountIds.length;
    await registerEntities(tenantId, 'msv_bank_accounts', bankAccountIds);

    const txIds = await seedBankTransactions(tenantId);
    seeded.bank_transactions = txIds.length;
    await registerEntities(tenantId, 'bank_transactions', txIds);

    console.log('[DemoSeed] ✓ Seeding complete:', seeded);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    errors.push(msg);
    console.error('[DemoSeed] ✗ Error:', msg);
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