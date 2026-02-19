/**
 * Demo Cleanup — Deletes all demo entities tracked in test_data_registry
 * 
 * Uses the registry as the single source of truth for which entities to remove.
 * Deletion order respects FK constraints (RESTRICT on contacts).
 * Most child tables are now ON DELETE CASCADE, so only the core entities
 * need explicit deletion.
 * 
 * @demo-data
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Entity types in deletion order (children first).
 * 
 * After the FK CASCADE migration (2026-02-19), the following cascades exist:
 * - properties → listings, property_accounting, partner_pipelines, finance_packages,
 *   msv_enrollments, rental_listings, dev_project_units, calendar_events,
 *   nk_beleg_extractions, nk_tenant_settlements, units → leases → rent_payments, rent_reminders
 * - listings → listing_publications, listing_activities, listing_inquiries,
 *   listing_partner_terms, reservations, sale_transactions
 * - contacts → SET NULL on all references (leads, etc.)
 * - msv_bank_accounts → bank_account_meta (CASCADE), leases.linked_bank_account_id (SET NULL)
 * 
 * Only RESTRICT constraints remain on contacts (leases.tenant_contact_id, renter_invites.contact_id),
 * so leases must be deleted before contacts.
 */
const CLEANUP_ORDER = [
  // bank_transactions has no FK to msv_bank_accounts (linked via text account_ref)
  // but must be deleted explicitly since it's in the registry
  'bank_transactions',
  // loans reference properties via SET NULL, but are in the registry → delete explicitly
  'loans',
  // leases are CASCADE'd from units→properties, but also RESTRICT on contacts
  // → delete explicitly before contacts to be safe
  'leases',
  // units CASCADE from properties, but delete explicitly for registry tracking
  'units',
  // msv_bank_accounts: leases.linked_bank_account_id is now SET NULL
  'msv_bank_accounts',
  // properties: all children CASCADE (listings, accounting, etc.)
  'properties',
  // contacts: all references SET NULL, RESTRICT children already deleted above
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
