/**
 * useSLCInquiry — Records deal.inquiry_received events from Zone 3 contact forms
 * Can be used without auth (Zone 3 public pages).
 */
import { supabase } from '@/integrations/supabase/client';
import { findOrCreateCase } from './useSLCEventRecorder';

/**
 * Record an inquiry event for a listing from Zone 3.
 * Does NOT require authentication — fires and forgets.
 */
export async function recordInquiryForListing(opts: {
  listingId: string;
  propertyId?: string;
  source: string;
  contactEmail?: string;
  contactName?: string;
}): Promise<void> {
  try {
    // Look up listing to get tenant_id
    const { data: listing } = await supabase
      .from('listings')
      .select('id, tenant_id, property_id')
      .eq('id', opts.listingId)
      .maybeSingle();

    if (!listing) return;

    const tenantId = listing.tenant_id;
    const slcCase = await findOrCreateCase({
      listingId: opts.listingId,
      propertyId: opts.propertyId || listing.property_id || undefined,
      assetType: 'property_unit',
      assetId: opts.listingId,
      tenantId,
      userId: '', // No user in Zone 3
    });

    await supabase.from('sales_lifecycle_events').insert({
      case_id: slcCase.id,
      event_type: 'deal.inquiry_received',
      severity: 'info',
      phase_before: slcCase.current_phase as any,
      phase_after: slcCase.current_phase as any, // Phase advance handled by trigger logic
      payload: {
        source: opts.source,
        contact_email: opts.contactEmail,
        contact_name: opts.contactName,
      } as any,
      tenant_id: tenantId,
    });

    // Advance phase if currently in published
    if (slcCase.current_phase === 'published') {
      await supabase.from('sales_cases')
        .update({ current_phase: 'inquiry' as any, updated_at: new Date().toISOString() })
        .eq('id', slcCase.id);
    }
  } catch (e) {
    console.warn('[SLC] Inquiry recording failed:', e);
  }
}

/**
 * Record an inquiry event for a project unit (dev_project_units) from Zone 3.
 * Project units don't have a listing record, so we log directly to sales_lifecycle_events
 * via the Edge Function or as a standalone event.
 */
export async function recordInquiryForProjectUnit(opts: {
  unitId: string;
  source: string;
  contactEmail?: string;
  contactName?: string;
}): Promise<void> {
  try {
    // Look up project unit to get tenant_id
    const { data: unit } = await supabase
      .from('dev_project_units')
      .select('id, project_id, dev_projects!inner(tenant_id)')
      .eq('id', opts.unitId)
      .maybeSingle();

    if (!unit) return;

    const tenantId = (unit as any).dev_projects?.tenant_id;
    if (!tenantId) return;

    // Find or create SLC case for this project unit
    const slcCase = await findOrCreateCase({
      listingId: opts.unitId, // Use unitId as listingId stand-in for project units
      assetType: 'project_unit',
      assetId: opts.unitId,
      tenantId,
      userId: '',
    });

    await supabase.from('sales_lifecycle_events').insert({
      case_id: slcCase.id,
      event_type: 'deal.inquiry_received',
      severity: 'info',
      phase_before: slcCase.current_phase as any,
      phase_after: slcCase.current_phase as any,
      payload: {
        source: opts.source,
        contact_email: opts.contactEmail,
        contact_name: opts.contactName,
        entity_type: 'project_unit',
      } as any,
      tenant_id: tenantId,
    });

    if (slcCase.current_phase === 'published') {
      await supabase.from('sales_cases')
        .update({ current_phase: 'inquiry' as any, updated_at: new Date().toISOString() })
        .eq('id', slcCase.id);
    }
  } catch (e) {
    console.warn('[SLC] Project unit inquiry recording failed:', e);
  }
}
