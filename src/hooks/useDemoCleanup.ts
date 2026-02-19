/**
 * Demo Cleanup — Deletes all demo entities tracked in test_data_registry
 * 
 * Uses the registry as the single source of truth for which entities to remove.
 * Deletion order respects FK constraints (leases → loans → units → properties → contacts).
 * 
 * @demo-data
 */

import { supabase } from '@/integrations/supabase/client';

/** Entity types in deletion order (children first) */
const CLEANUP_ORDER = [
  'leases',
  'loans',
  'units',
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
      if (!ids || ids.length === 0) {
        deleted[entityType] = 0;
        continue;
      }

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

    // Also handle any entity types not in the standard order
    for (const [entityType, ids] of Object.entries(grouped)) {
      if (CLEANUP_ORDER.includes(entityType as any)) continue;
      
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
