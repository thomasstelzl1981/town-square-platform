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

function coerceValue(value: string, key: string): unknown {
  if (value === '' || value === 'null') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  // Numeric columns
  const numericKeys = [
    'total_area_sqm', 'purchase_price', 'year_built', 'area_sqm', 'rooms',
    'current_monthly_rent', 'ancillary_costs', 'hausgeld_monthly',
    'rent_cold_eur', 'nk_advance_eur', 'heating_advance_eur',
    'payment_due_day', 'deposit_amount_eur',
    'original_amount', 'interest_rate_percent', 'annuity_monthly_eur',
    'repayment_rate_percent', 'outstanding_balance_eur',
    'amount', 'saldo',
  ];
  if (numericKeys.includes(key)) {
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
    batch_name: batchName,
  }));

  const { error } = await (supabase as any)
    .from('test_data_registry')
    .upsert(rows, { onConflict: 'entity_type,entity_id' });

  if (error) {
    console.warn(`[DemoSeed] Registry insert failed for ${entityType}:`, error.message);
  }
}

// ─── Seed Functions ────────────────────────────────────────

async function seedContacts(tenantId: string): Promise<string[]> {
  const rows = await fetchCSV('/demo-data/demo_contacts.csv');
  if (!rows.length) return [];

  const data = rows.map(r => ({ ...r, tenant_id: tenantId }));
  const { error } = await (supabase as any)
    .from('contacts')
    .upsert(data, { onConflict: 'id' });

  if (error) console.error('[DemoSeed] contacts:', error.message);
  return rows.map(r => r.id as string);
}

async function seedProperties(tenantId: string, landlordContextId?: string): Promise<string[]> {
  const rows = await fetchCSV('/demo-data/demo_properties.csv');
  if (!rows.length) return [];

  const data = rows.map(r => ({
    ...r,
    tenant_id: tenantId,
    ...(landlordContextId ? { landlord_context_id: landlordContextId } : {}),
  }));
  const { error } = await (supabase as any)
    .from('properties')
    .upsert(data, { onConflict: 'id' });

  if (error) console.error('[DemoSeed] properties:', error.message);
  return rows.map(r => r.id as string);
}

async function seedUnits(tenantId: string): Promise<string[]> {
  const rows = await fetchCSV('/demo-data/demo_units.csv');
  if (!rows.length) return [];

  const data = rows.map(r => ({ ...r, tenant_id: tenantId }));
  const { error } = await (supabase as any)
    .from('units')
    .upsert(data, { onConflict: 'id' });

  if (error) console.error('[DemoSeed] units:', error.message);
  return rows.map(r => r.id as string);
}

async function seedLeases(tenantId: string): Promise<string[]> {
  const rows = await fetchCSV('/demo-data/demo_leases.csv');
  if (!rows.length) return [];

  const data = rows.map(r => {
    const cleaned: Record<string, unknown> = { ...r, tenant_id: tenantId };
    // Remove empty tenant_contact_id
    if (!cleaned.tenant_contact_id) delete cleaned.tenant_contact_id;
    return cleaned;
  });
  const { error } = await (supabase as any)
    .from('leases')
    .upsert(data, { onConflict: 'id' });

  if (error) console.error('[DemoSeed] leases:', error.message);
  return rows.map(r => r.id as string);
}

async function seedLoans(tenantId: string): Promise<string[]> {
  const rows = await fetchCSV('/demo-data/demo_loans.csv');
  if (!rows.length) return [];

  const data = rows.map(r => ({ ...r, tenant_id: tenantId }));
  const { error } = await (supabase as any)
    .from('loans')
    .upsert(data, { onConflict: 'id' });

  if (error) console.error('[DemoSeed] loans:', error.message);
  return rows.map(r => r.id as string);
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

  try {
    // Order matters: contacts first, then properties, units, leases, loans
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
