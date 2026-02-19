/**
 * Demo Cleanup — Deletes all demo entities tracked in test_data_registry
 * 
 * Uses the registry as the single source of truth for which entities to remove.
 * Deletion order respects FK constraints.
 * For properties: also cleans up FK-child tables that don't cascade on delete.
 * 
 * @demo-data
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Entity types in deletion order (children first).
 * Tables with ON DELETE CASCADE are handled automatically by Postgres,
 * but tables without CASCADE must be listed explicitly here.
 */
const CLEANUP_ORDER = [
  // Deepest children first
  'bank_transactions',
  'leases',
  'loans',
  // FK children of properties WITHOUT cascade (must be explicitly deleted)
  'listings',
  'property_accounting',
  'partner_pipelines',
  'finance_packages',
  'msv_enrollments',
  // Then core entities
  'units',
  'msv_bank_accounts',
  'properties',
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

    // Also find property IDs — we need to clean FK children of properties
    // even if those children aren't in the registry
    const propertyIds = grouped['properties'] || [];
    
    if (propertyIds.length > 0) {
      // Delete non-cascading FK children of properties by property_id
      const propertyChildTables = [
        'listings', 'property_accounting', 'partner_pipelines', 
        'finance_packages', 'msv_enrollments',
      ];
      for (const childTable of propertyChildTables) {
        const { error: childErr, count } = await (supabase as any)
          .from(childTable)
          .delete({ count: 'exact' })
          .in('property_id', propertyIds);

        if (childErr) {
          console.warn(`[DemoCleanup] ${childTable} cleanup: ${childErr.message}`);
        } else {
          deleted[`${childTable}(cascade)`] = count ?? 0;
        }
      }
    }

    // Delete in FK-safe order
    for (const entityType of CLEANUP_ORDER) {
      const ids = grouped[entityType];
      if (!ids || ids.length === 0) {
        continue;
      }

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