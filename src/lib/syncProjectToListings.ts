/**
 * syncProjectToListings — Propagates changes from dev_project_units
 * to downstream properties, listings, and listing_publications.
 *
 * This is a manual sync triggered by the user in MOD-13 Vertrieb-Tab.
 * It does NOT create new properties/listings — only updates existing ones.
 */
import { supabase } from '@/integrations/supabase/client';
import { computeListingHash } from '@/lib/listingHash';
import { syncProjectImagesToProperty } from '@/lib/syncProjectImagesToProperty';

export interface SyncResult {
  updated: number;
  unchanged: number;
  imagesSynced: number;
  errors: string[];
}

export async function syncProjectToListings(
  projectId: string,
  tenantId: string,
  projectName?: string,
): Promise<SyncResult> {
  const result: SyncResult = { updated: 0, unchanged: 0, imagesSynced: 0, errors: [] };

  // 1. Fetch all units that have a linked property
  const { data: units, error: unitsErr } = await supabase
    .from('dev_project_units')
    .select('id, unit_number, area_sqm, list_price, current_rent, rooms_count, property_id')
    .eq('project_id', projectId)
    .not('property_id', 'is', null);

  if (unitsErr) {
    result.errors.push(`Units laden: ${unitsErr.message}`);
    return result;
  }
  if (!units?.length) return result;

  const propertyIds = units.map(u => u.property_id!).filter(Boolean);

  // 2. Fetch current properties
  const { data: properties } = await supabase
    .from('properties')
    .select('id, purchase_price, total_area_sqm, annual_income, description')
    .in('id', propertyIds);

  const propMap = new Map((properties ?? []).map(p => [p.id, p]));

  // 3. Fetch current listings (one per property)
  const { data: listings } = await supabase
    .from('listings')
    .select('id, property_id, asking_price, title, commission_rate, description, status')
    .in('property_id', propertyIds)
    .eq('tenant_id', tenantId);

  const listingByProp = new Map((listings ?? []).map(l => [l.property_id, l]));

  // 3b. Fetch project description for content sync
  const { data: project } = await supabase
    .from('dev_projects')
    .select('full_description')
    .eq('id', projectId)
    .maybeSingle();

  const projectDescription = project?.full_description || null;

  // 4. IMAGE RESYNC PASS — propagate project images to all linked properties
  for (const unit of units) {
    const pid = unit.property_id!;
    try {
      const imgResult = await syncProjectImagesToProperty(tenantId, projectId, pid);
      result.imagesSynced += imgResult.synced;
      if (imgResult.errors.length > 0) {
        result.errors.push(...imgResult.errors.map(e => `Bilder ${unit.unit_number}: ${e}`));
      }
    } catch (err: unknown) {
      result.errors.push(`Bilder ${unit.unit_number}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // 5. Compare & update each unit (structure + content)
  for (const unit of units) {
    const pid = unit.property_id!;
    const prop = propMap.get(pid);
    const listing = listingByProp.get(pid);

    if (!prop) {
      result.errors.push(`Property ${pid} nicht gefunden für Einheit ${unit.unit_number}`);
      continue;
    }

    // Determine what changed on property level
    const propUpdates: Record<string, unknown> = {};

    // list_price → purchase_price on properties
    if (unit.list_price != null && unit.list_price !== prop.purchase_price) {
      propUpdates.purchase_price = unit.list_price;
    }
    // area_sqm → total_area_sqm on properties
    if (unit.area_sqm != null && unit.area_sqm !== prop.total_area_sqm) {
      propUpdates.total_area_sqm = unit.area_sqm;
    }
    // current_rent → annual_income (×12) on properties
    if (unit.current_rent != null) {
      const annualIncome = unit.current_rent * 12;
      if (annualIncome !== prop.annual_income) {
        propUpdates.annual_income = annualIncome;
      }
    }
    // Content sync: project description → property description
    if (projectDescription && projectDescription !== prop.description) {
      propUpdates.description = projectDescription;
    }

    // Determine what changed on listing level
    const listingUpdates: Record<string, unknown> = {};
    if (listing) {
      const expectedTitle = `${projectName || 'Projekt'} – ${unit.unit_number}`;
      if (listing.title !== expectedTitle) {
        listingUpdates.title = expectedTitle;
      }
      if (unit.list_price != null && unit.list_price !== listing.asking_price) {
        listingUpdates.asking_price = unit.list_price;
      }
      // Content sync: project description → listing description
      if (projectDescription && projectDescription !== listing.description) {
        listingUpdates.description = projectDescription;
      }
    }

    const hasChanges = Object.keys(propUpdates).length > 0 || Object.keys(listingUpdates).length > 0;

    if (!hasChanges) {
      result.unchanged++;
      continue;
    }

    // Apply property updates
    if (Object.keys(propUpdates).length > 0) {
      const { error } = await supabase
        .from('properties')
        .update(propUpdates)
        .eq('id', pid);
      if (error) {
        result.errors.push(`Property ${unit.unit_number}: ${error.message}`);
        continue;
      }
    }

    // Apply listing updates
    if (listing && Object.keys(listingUpdates).length > 0) {
      const { error } = await supabase
        .from('listings')
        .update(listingUpdates)
        .eq('id', listing.id);
      if (error) {
        result.errors.push(`Listing ${unit.unit_number}: ${error.message}`);
        continue;
      }
    }

    // Refresh drift hash on listing_publications
    if (listing) {
      const newHash = computeListingHash({
        title: (listingUpdates.title as string) ?? listing.title,
        asking_price: (listingUpdates.asking_price as number) ?? listing.asking_price,
        description: (listingUpdates.description as string) ?? listing.description,
        commission_rate: listing.commission_rate,
        status: listing.status,
      });

      await supabase
        .from('listing_publications')
        .update({ expected_hash: newHash, last_synced_hash: newHash })
        .eq('listing_id', listing.id);
    }

    result.updated++;
  }

  return result;
}
