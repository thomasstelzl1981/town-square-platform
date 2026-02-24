/**
 * Demo Cleanup — Deletes all demo entities tracked in test_data_registry
 * 
 * Uses the registry as the single source of truth for which entities to remove.
 * Falls back to ID-pattern-based deletion if registry is empty.
 * Deletion order respects FK constraints (children before parents).
 * 
 * @demo-data
 */

import { supabase } from '@/integrations/supabase/client';
import { ALL_DEMO_IDS } from '@/engines/demoData/data';

/**
 * Entity types in deletion order (children first, parents last).
 * 
 * FK constraint considerations:
 * - pet_bookings → pets, pet_customers, pet_services (FK)
 * - pet_services → pet_providers (FK provider_id)
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
  // Pet owner pets only (Luna, Bello) — PM business data lives in Lennox Partner-Tenant
  'pets',
  'miety_contracts',
  'miety_homes',
  'user_subscriptions',
  'private_loans',
  'vorsorge_contracts',
  'kv_contracts',
  'insurance_contracts',
  // storage_nodes must be deleted BEFORE pv_plants (FK: storage_nodes.pv_plant_id → pv_plants.id)
  'storage_nodes',
  'pv_plants',
  'cars_vehicles',
  'pension_records',
  'household_persons',
  // Finance workflow (CASCADE handles children, but register for diagnostics)
  'finance_submission_logs',
  'finance_mandates',
  'applicant_profiles',
  'finance_requests',
  'acq_offers',
  'acq_mandates',
  'dev_projects',
  // Sales workflow (children first)
  'listing_publications',
  'listings',
  'property_features',
  // Property tree (CASCADE handles most children)
  'property_accounting',
  'loans',
  'leases',
  'units',
  'msv_bank_accounts',
  'properties',
  // Landlord contexts (after properties, before contacts)
  'landlord_contexts',
  // Contacts last (RESTRICT from leases, which are now deleted)
  'contacts',
] as const;

export interface DemoCleanupResult {
  success: boolean;
  deleted: Record<string, number>;
  errors: string[];
}

/**
 * Group ALL_DEMO_IDS by entity type using known ID patterns.
 * This is the fallback when test_data_registry is empty.
 */
function buildFallbackGroups(): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};
  
  // We delete ALL known demo IDs from ALL tables in CLEANUP_ORDER
  // The delete will simply return 0 affected rows if the ID doesn't exist in that table
  for (const entityType of CLEANUP_ORDER) {
    grouped[entityType] = [...ALL_DEMO_IDS];
  }
  
  return grouped;
}

export async function cleanupDemoData(tenantId: string): Promise<DemoCleanupResult> {
  const errors: string[] = [];
  const deleted: Record<string, number> = {};

  if (import.meta.env.DEV) console.log(`[DemoCleanup] Starting cleanup for tenant ${tenantId}...`);

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

    // Determine groups: registry-based or fallback
    let grouped: Record<string, string[]> = {};
    let useFallback = false;

    if (!registry || registry.length === 0) {
      if (import.meta.env.DEV) console.log('[DemoCleanup] Registry empty — using ID-pattern fallback');
      grouped = buildFallbackGroups();
      useFallback = true;
    } else {
      // Group by entity type from registry
      for (const entry of registry) {
        if (!grouped[entry.entity_type]) grouped[entry.entity_type] = [];
        grouped[entry.entity_type].push(entry.entity_id);
      }
    }

    // Delete in FK-safe order
    for (const entityType of CLEANUP_ORDER) {
      const ids = grouped[entityType];
      if (!ids || ids.length === 0) continue;

      let deletedCount = 0;
      for (let i = 0; i < ids.length; i += 50) {
        const chunk = ids.slice(i, i + 50);
        const { error: delError, count } = await (supabase as any)
          .from(entityType)
          .delete()
          .in('id', chunk)
          .eq('tenant_id', tenantId);

        if (delError) {
          // Don't report errors for tables that may not have all IDs (fallback mode)
          if (!useFallback) {
            errors.push(`Delete ${entityType} chunk ${i}: ${delError.message}`);
          }
        } else {
          deletedCount += count ?? chunk.length;
        }
      }
      if (deletedCount > 0) {
        deleted[entityType] = deletedCount;
      }
    }

    // Handle any entity types not in the standard order (registry mode only)
    if (!useFallback) {
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
    }

    // Reset profile fields (UPDATE to NULL, don't delete the row)
    const profileFields = grouped['profile'];
    if (profileFields && profileFields.length > 0) {
      const resetData: Record<string, null> = {};
      for (const key of [
        'first_name', 'last_name', 'display_name', 'street', 'house_number',
        'postal_code', 'city', 'country', 'phone_mobile', 'phone_landline',
        'phone_whatsapp', 'tax_number', 'tax_id',
      ]) {
        resetData[key] = null;
      }
      // Also reset booleans/enums to defaults
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ ...resetData, is_business: false, person_mode: 'private' })
        .eq('id', profileFields[0]);

      if (profileError) {
        errors.push(`Profile reset: ${profileError.message}`);
      } else {
        deleted['profile'] = 1;
        if (import.meta.env.DEV) console.log('[DemoCleanup] ✓ profile reset to NULL');
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

    if (import.meta.env.DEV) console.log('[DemoCleanup] ✓ Cleanup complete:', deleted);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    errors.push(msg);
    console.error('[DemoCleanup] ✗ Error:', msg);
  }

  return { success: errors.length === 0, deleted, errors };
}
