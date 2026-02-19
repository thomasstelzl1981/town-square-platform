/**
 * Demo Cleanup — Deletes all demo entities tracked in test_data_registry
 * 
 * Uses the registry as the single source of truth for which entities to remove.
 * Deletion order respects FK constraints (children before parents).
 * 
 * @demo-data
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Entity types in deletion order (children first, parents last).
 * 
 * FK constraint considerations:
 * - pet_bookings → pets, pet_customers (FK)
 * - pets → pet_customers (FK customer_id)
 * - miety_contracts → miety_homes (FK home_id)
 * - leases → units (CASCADE), contacts (RESTRICT) → delete before contacts
 * - units → properties (CASCADE)
 * - bank_transactions → no FK, text account_ref
 * - properties → CASCADE to listings, accounting, etc.
 * - contacts → SET NULL on references, but RESTRICT from leases
 */
const CLEANUP_ORDER = [
  // Leaf entities first (no children)
  'bank_transactions',
  'pet_bookings',
  'pets',
  'pet_customers',
  'miety_contracts',
  'miety_homes',
  'user_subscriptions',
  'private_loans',
  'vorsorge_contracts',
  'kv_contracts',
  'insurance_contracts',
  'pv_plants',
  'cars_vehicles',
  'household_persons',
  'acq_mandates',
  // Property tree (CASCADE handles most children)
  'loans',
  'leases',
  'units',
  'msv_bank_accounts',
  'properties',
  // Contacts last (RESTRICT from leases, which are now deleted)
  'contacts',
] as const;

export interface DemoCleanupResult {
  success: boolean;
  deleted: Record<string, number>;
  errors: string[];
}

export async function cleanupDemoData(tenantId: string): Promise<DemoCleanupResult> {
  const errors: string[] = [];
  const deleted: Record<string, number> = {};

  console.log(`[DemoCleanup] Starting cleanup for tenant ${tenantId}...`);

  try {
    // Fetch all registered demo entities for this tenant
    const { data: registry, error: fetchError } = await (supabase as any)
      .from('test_data_registry')
      .select('entity_type, entity_id')
      .eq('tenant_id', tenantId)
      .eq('batch_name', 'demo-ssot');

    if (fetchError) {
      errors.push(`Registry fetch: ${fetchError.message}`);
      return { success: false, deleted, errors };
    }

    if (!registry || registry.length === 0) {
      console.log('[DemoCleanup] No demo entities found in registry');
      return { success: true, deleted, errors };
    }

    // Group by entity type
    const grouped: Record<string, string[]> = {};
    for (const entry of registry) {
      if (!grouped[entry.entity_type]) grouped[entry.entity_type] = [];
      grouped[entry.entity_type].push(entry.entity_id);
    }

    // Delete in FK-safe order
    for (const entityType of CLEANUP_ORDER) {
      const ids = grouped[entityType];
      if (!ids || ids.length === 0) continue;

      let deletedCount = 0;
      for (let i = 0; i < ids.length; i += 50) {
        const chunk = ids.slice(i, i + 50);
        const { error: delError } = await (supabase as any)
          .from(entityType)
          .delete()
          .in('id', chunk);

        if (delError) {
          errors.push(`Delete ${entityType} chunk ${i}: ${delError.message}`);
        } else {
          deletedCount += chunk.length;
        }
      }
      deleted[entityType] = deletedCount;
    }

    // Handle any entity types not in the standard order
    for (const [entityType, ids] of Object.entries(grouped)) {
      if ((CLEANUP_ORDER as readonly string[]).includes(entityType)) continue;
      
      const { error: delError } = await (supabase as any)
        .from(entityType)
        .delete()
        .in('id', ids);

      if (delError) {
        errors.push(`Delete ${entityType}: ${delError.message}`);
        deleted[entityType] = 0;
      } else {
        deleted[entityType] = ids.length;
      }
    }

    // Clear the registry entries
    const { error: clearError } = await (supabase as any)
      .from('test_data_registry')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('batch_name', 'demo-ssot');

    if (clearError) {
      errors.push(`Registry clear: ${clearError.message}`);
    }

    console.log('[DemoCleanup] ✓ Cleanup complete:', deleted);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    errors.push(msg);
    console.error('[DemoCleanup] ✗ Error:', msg);
  }

  return { success: errors.length === 0, deleted, errors };
}
