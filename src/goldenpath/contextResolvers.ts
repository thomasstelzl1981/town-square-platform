/**
 * Context Resolver Registry — Modul-spezifische Flag-Resolver
 * 
 * Jedes Modul registriert seinen eigenen Resolver, der aus DB-Daten
 * die Flags fuer die GoldenPathEngine baut.
 * 
 * Der Hook useGoldenPath nutzt diese Registry generisch.
 */

import { supabase } from '@/integrations/supabase/client';

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export interface ResolverParams {
  tenantId?: string;
  entityId?: string; // propertyId, mandateId, etc.
}

export type ContextResolver = (params: ResolverParams) => Promise<Record<string, boolean>>;

// ═══════════════════════════════════════════════════════════════
// Registry
// ═══════════════════════════════════════════════════════════════

const RESOLVER_REGISTRY: Record<string, ContextResolver> = {};

export function registerContextResolver(
  moduleCode: string,
  resolver: ContextResolver
): void {
  RESOLVER_REGISTRY[moduleCode] = resolver;
}

export function getContextResolver(
  moduleCode: string
): ContextResolver | undefined {
  return RESOLVER_REGISTRY[moduleCode];
}

// ═══════════════════════════════════════════════════════════════
// MOD-04 Resolver (extrahiert aus useGoldenPath.ts)
// ═══════════════════════════════════════════════════════════════

const mod04Resolver: ContextResolver = async ({ tenantId, entityId: propertyId }) => {
  const flags: Record<string, boolean> = {
    user_authenticated: true,
    tenant_exists: !!tenantId,
  };

  if (!propertyId || !tenantId) {
    return flags;
  }

  // Property
  const propertyRes = await supabase
    .from('properties')
    .select('id')
    .eq('id', propertyId)
    .eq('tenant_id', tenantId)
    .maybeSingle();

  // Unit
  const unitRes = await supabase
    .from('units')
    .select('id')
    .eq('property_id', propertyId)
    .limit(1)
    .maybeSingle();

  // Storage (recursive types bypass)
  const { count: storageCount } = await supabase
    .from('storage_nodes' as never)
    .select('*', { count: 'exact', head: true })
    .eq('entity_id' as never, propertyId)
    .eq('entity_type' as never, 'property') as unknown as { count: number | null };

  // Features
  const featuresRes = await supabase
    .from('property_features')
    .select('feature_code, status')
    .eq('property_id', propertyId);

  // Listing
  const listingRes = await supabase
    .from('listings')
    .select('id, status, sales_mandate_consent_id')
    .eq('property_id', propertyId)
    .maybeSingle();

  flags.property_exists = !!propertyRes.data;
  flags.main_unit_exists = !!unitRes.data;
  flags.folder_structure_exists = (storageCount ?? 0) > 0;
  flags.unit_visible_in_mod05 = !!unitRes.data;

  // Property Features
  const features = (featuresRes.data ?? []) as Array<{ feature_code: string; status: string }>;
  const verkaufsauftrag = features.find((f) => f.feature_code === 'verkaufsauftrag');
  const kaufy = features.find((f) => f.feature_code === 'kaufy_sichtbarkeit');

  flags.verkaufsauftrag_active = verkaufsauftrag?.status === 'active';
  flags.kaufy_sichtbarkeit_active = kaufy?.status === 'active';
  flags.features_inactive =
    (!verkaufsauftrag || verkaufsauftrag.status === 'inactive') &&
    (!kaufy || kaufy.status === 'inactive');

  // Listing
  const listing = listingRes.data;
  flags.listing_active = listing?.status === 'active';
  flags.listing_withdrawn = listing?.status === 'withdrawn';
  flags.listing_deleted = !listing; // true wenn kein Listing existiert (hard-deleted)
  flags.sales_mandate_consent_linked = !!listing?.sales_mandate_consent_id;
  flags.contract_visible = !!listing?.sales_mandate_consent_id;
  flags.sales_desk_entry_visible = !!listing?.sales_mandate_consent_id && listing?.status === 'active';

  // Listing Publications
  if (listing?.id) {
    const pubRes = await supabase
      .from('listing_publications')
      .select('channel, status')
      .eq('listing_id', listing.id);

    const pubs = pubRes.data ?? [];
    const partnerPub = pubs.find((p) => p.channel === 'partner_network');
    const kaufyPub = pubs.find((p) => p.channel === 'kaufy');

    flags.partner_network_active = partnerPub?.status === 'active';
    flags.kaufy_publication_active = kaufyPub?.status === 'active';
    flags.katalog_visible = partnerPub?.status === 'active';
    flags.suche_visible = listing?.status === 'active';
    flags.kaufy_website_visible = kaufyPub?.status === 'active';
    flags.publications_paused = pubs.every((p) => p.status === 'paused');
  } else {
    flags.partner_network_active = false;
    flags.kaufy_publication_active = false;
    flags.katalog_visible = false;
    flags.suche_visible = false;
    flags.kaufy_website_visible = false;
    flags.publications_paused = false;
  }

  // Contract check (verkaufsauftrag_consent)
  flags.verkaufsauftrag_consent = flags.sales_mandate_consent_linked;

  return flags;
};

// Register MOD-04
registerContextResolver('MOD-04', mod04Resolver);

// ═══════════════════════════════════════════════════════════════
// GP-PET / MOD-22 Resolver
// ═══════════════════════════════════════════════════════════════

const gpPetResolver: ContextResolver = async ({ tenantId, entityId: customerId }) => {
  const flags: Record<string, boolean> = {
    user_authenticated: true,
    tenant_exists: !!tenantId,
  };

  if (!tenantId) return flags;

  // Check if any pet_customers exist for this tenant
  if (customerId) {
    const { data: customer } = await supabase
      .from('pet_customers')
      .select('id')
      .eq('id', customerId)
      .eq('tenant_id', tenantId)
      .maybeSingle();
    flags.customer_exists = !!customer;
  } else {
    const { count } = await supabase
      .from('pet_customers')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);
    flags.customer_exists = (count ?? 0) > 0;
  }

  // Check if pets exist for this tenant
  const { count: petCount } = await supabase
    .from('pets')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);
  flags.pet_exists = (petCount ?? 0) > 0;

  // Check if any booking is completed
  const { count: bookingCount } = await supabase
    .from('pet_bookings')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .in('status', ['confirmed', 'completed']);
  flags.first_booking_completed = (bookingCount ?? 0) > 0;

  return flags;
};

registerContextResolver('GP-PET', gpPetResolver);
