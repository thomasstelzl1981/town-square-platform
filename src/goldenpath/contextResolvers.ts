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
// MOD-07 Resolver (Finanzierung)
// ═══════════════════════════════════════════════════════════════

const mod07Resolver: ContextResolver = async ({ tenantId, entityId: requestId }) => {
  const flags: Record<string, boolean> = {
    user_authenticated: true,
    tenant_exists: !!tenantId,
  };
  if (!tenantId) return flags;

  if (requestId) {
    const { data: req } = await supabase
      .from('finance_requests')
      .select('id, status')
      .eq('id', requestId)
      .eq('tenant_id', tenantId)
      .maybeSingle();
    flags.finance_request_exists = !!req;
    flags.finance_request_submitted = req?.status === 'submitted' || req?.status === 'in_review' || req?.status === 'approved';
  }

  // Check applicant profile exists
  const { count: profileCount } = await supabase
    .from('applicant_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);
  flags.applicant_profile_complete = (profileCount ?? 0) > 0;

  return flags;
};

registerContextResolver('MOD-07', mod07Resolver);

// ═══════════════════════════════════════════════════════════════
// MOD-08/12 Resolver (Akquise)
// ═══════════════════════════════════════════════════════════════

const mod08Resolver: ContextResolver = async ({ tenantId, entityId: mandateId }) => {
  const flags: Record<string, boolean> = {
    user_authenticated: true,
    tenant_exists: !!tenantId,
  };
  if (!tenantId) return flags;

  if (mandateId) {
    const { data: mandate } = await supabase
      .from('acq_mandates')
      .select('id, status')
      .eq('id', mandateId)
      .eq('tenant_id', tenantId)
      .maybeSingle();
    flags.mandate_draft_exists = !!mandate;
    flags.mandate_submitted = mandate?.status === 'submitted_to_zone1' || mandate?.status === 'active';
    flags.mandate_assigned = mandate?.status === 'active';
  }

  return flags;
};

registerContextResolver('MOD-08', mod08Resolver);
registerContextResolver('MOD-12', mod08Resolver);

// ═══════════════════════════════════════════════════════════════
// MOD-13 Resolver (Projekte)
// ═══════════════════════════════════════════════════════════════

const mod13Resolver: ContextResolver = async ({ tenantId, entityId: projectId }) => {
  const flags: Record<string, boolean> = {
    user_authenticated: true,
    tenant_exists: !!tenantId,
  };
  if (!tenantId) return flags;

  if (projectId) {
    const { data: project } = await supabase
      .from('dev_projects')
      .select('id, status')
      .eq('id', projectId)
      .eq('tenant_id', tenantId)
      .maybeSingle();
    flags.project_exists = !!project;

    if (project) {
      const { count: unitCount } = await supabase
        .from('dev_project_units')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);
      flags.units_created = (unitCount ?? 0) > 0;
    }
  }

  return flags;
};

registerContextResolver('MOD-13', mod13Resolver);

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

// ═══════════════════════════════════════════════════════════════
// GP-VERMIETUNG Resolver (Mietverwaltung-Workflow)
// ═══════════════════════════════════════════════════════════════

const gpVermietungResolver: ContextResolver = async ({ tenantId, entityId: propertyId }) => {
  const flags: Record<string, boolean> = {
    user_authenticated: true,
    tenant_exists: !!tenantId,
  };
  if (!tenantId || !propertyId) return flags;

  // Check property exists
  const { data: prop } = await supabase
    .from('properties')
    .select('id')
    .eq('id', propertyId)
    .eq('tenant_id', tenantId)
    .maybeSingle();
  flags.property_exists = !!prop;

  // Check units exist and collect unit IDs for lease lookup
  const { data: units } = await supabase
    .from('units')
    .select('id')
    .eq('property_id', propertyId);
  flags.units_exist = (units?.length ?? 0) > 0;

  // Check active leases via unit_id (leases belong to units, not properties)
  if (units && units.length > 0) {
    const unitIds = units.map(u => u.id);
    const { count: leaseCount } = await supabase
      .from('leases' as never)
      .select('*', { count: 'exact', head: true })
      .in('unit_id' as never, unitIds)
      .eq('status' as never, 'active') as unknown as { count: number | null };
    flags.lease_active = (leaseCount ?? 0) > 0;
    flags.nk_settlement_exists = (leaseCount ?? 0) > 0;
  } else {
    flags.lease_active = false;
    flags.nk_settlement_exists = false;
  }

  return flags;
};

registerContextResolver('GP-VERMIETUNG', gpVermietungResolver);

// ═══════════════════════════════════════════════════════════════
// GP-LEAD Resolver (Lead-Pipeline-Workflow)
// ═══════════════════════════════════════════════════════════════

const gpLeadResolver: ContextResolver = async ({ tenantId, entityId: leadId }) => {
  const flags: Record<string, boolean> = {
    user_authenticated: true,
    tenant_exists: !!tenantId,
  };
  if (!tenantId) return flags;

  if (leadId) {
    const { data: lead } = await supabase
      .from('leads')
      .select('id, status, assigned_partner_id')
      .eq('id', leadId)
      .eq('tenant_id', tenantId)
      .maybeSingle();
    flags.lead_exists = !!lead;
    flags.lead_assigned = !!lead?.assigned_partner_id;
    flags.lead_qualified = lead?.status === 'qualified' || lead?.status === 'converted';
    flags.lead_converted = lead?.status === 'converted';
  } else {
    const { count } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);
    flags.lead_exists = (count ?? 0) > 0;
  }

  return flags;
};

registerContextResolver('GP-LEAD', gpLeadResolver);

// ═══════════════════════════════════════════════════════════════
// GP-FINANCE-Z3 Resolver (Finance Intake Workflow)
// ═══════════════════════════════════════════════════════════════

const gpFinanceZ3Resolver: ContextResolver = async ({ tenantId, entityId: requestId }) => {
  const flags: Record<string, boolean> = {
    user_authenticated: true,
    tenant_exists: !!tenantId,
  };
  if (!tenantId) return flags;

  // Check if any finance requests exist
  if (requestId) {
    const { data: req } = await supabase
      .from('finance_requests')
      .select('id, status')
      .eq('id', requestId)
      .eq('tenant_id', tenantId)
      .maybeSingle();
    flags.request_exists = !!req;
    flags.request_submitted = req?.status === 'submitted' || req?.status === 'in_review';
    flags.request_approved = req?.status === 'approved';
  }

  // Check applicant profile completeness
  const { count: profileCount } = await supabase
    .from('applicant_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);
  flags.profile_exists = (profileCount ?? 0) > 0;

  return flags;
};

registerContextResolver('GP-FINANCE-Z3', gpFinanceZ3Resolver);

// ═══════════════════════════════════════════════════════════════
// GP-COMMISSION Resolver (Provisions-Workflow)
// ═══════════════════════════════════════════════════════════════

const gpCommissionResolver: ContextResolver = async ({ tenantId }) => {
  const flags: Record<string, boolean> = {
    user_authenticated: true,
    tenant_exists: !!tenantId,
  };
  if (!tenantId) return flags;

  // Check commission entries exist
  const { count: commCount } = await supabase
    .from('commissions')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);
  flags.commission_entries_exist = (commCount ?? 0) > 0;

  // Check if any commissions are paid
  const { count: paidCount } = await supabase
    .from('commissions')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('status', 'paid');
  flags.commission_settled = (paidCount ?? 0) > 0;

  return flags;
};

registerContextResolver('GP-COMMISSION', gpCommissionResolver);

// ═══════════════════════════════════════════════════════════════
// GP-MANAGER-LIFECYCLE Resolver (Manager-Bewerbung & Freischaltung)
// ═══════════════════════════════════════════════════════════════

const gpManagerLifecycleResolver: ContextResolver = async ({ tenantId, entityId: applicationId }) => {
  const flags: Record<string, boolean> = {
    user_authenticated: true,
    tenant_exists: !!tenantId,
  };
  if (!tenantId) return flags;

  // Check manager application status
  if (applicationId) {
    const { data: app } = await supabase
      .from('manager_applications' as never)
      .select('id, status' as never)
      .eq('id' as never, applicationId)
      .eq('tenant_id' as never, tenantId)
      .maybeSingle() as unknown as { data: { id: string; status: string } | null };
    flags.application_submitted = app?.status === 'submitted' || app?.status === 'in_review' || app?.status === 'approved';
    flags.application_in_review = app?.status === 'in_review' || app?.status === 'approved';
    flags.qualification_passed = app?.status === 'approved';
    flags.application_approved = app?.status === 'approved';
  } else {
    const { count } = await supabase
      .from('manager_applications' as never)
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id' as never, tenantId) as unknown as { count: number | null };
    flags.application_submitted = (count ?? 0) > 0;
  }

  // Check org_type
  const { data: org } = await supabase
    .from('organizations')
    .select('org_type')
    .eq('id', tenantId)
    .maybeSingle();
  flags.org_type_upgraded = org?.org_type === 'partner';

  // Check org_links (manages)
  const { count: linkCount } = await supabase
    .from('org_links')
    .select('*', { count: 'exact', head: true })
    .eq('from_org_id', tenantId)
    .eq('link_type', 'manages')
    .eq('status', 'active');
  flags.first_client_assigned = (linkCount ?? 0) > 0;
  flags.org_link_active = (linkCount ?? 0) > 0;

  // Check org_delegations
  const { count: delCount } = await supabase
    .from('org_delegations')
    .select('*', { count: 'exact', head: true })
    .eq('delegate_org_id', tenantId)
    .eq('status', 'active');
  flags.delegation_active = (delCount ?? 0) > 0;

  // Check tile activation
  const { count: tileCount } = await supabase
    .from('tenant_tile_activation')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .in('tile_code', ['MOD-09', 'MOD-10', 'MOD-11', 'MOD-12', 'MOD-13', 'MOD-22'])
    .eq('status', 'active');
  flags.tiles_activated = (tileCount ?? 0) > 0;

  return flags;
};

registerContextResolver('GP-MANAGER-LIFECYCLE', gpManagerLifecycleResolver);

// ═══════════════════════════════════════════════════════════════
// GP-CLIENT-ASSIGNMENT Resolver (Kunden-Zuweisung)
// ═══════════════════════════════════════════════════════════════

const gpClientAssignmentResolver: ContextResolver = async ({ tenantId, entityId: assignmentId }) => {
  const flags: Record<string, boolean> = {
    user_authenticated: true,
    tenant_exists: !!tenantId,
  };
  if (!tenantId) return flags;

  // Check org_links (active manages links for this tenant as manager)
  const { count: linkCount } = await supabase
    .from('org_links')
    .select('*', { count: 'exact', head: true })
    .eq('from_org_id', tenantId)
    .eq('link_type', 'manages')
    .eq('status', 'active');
  flags.org_link_created = (linkCount ?? 0) > 0;
  flags.manager_selected = (linkCount ?? 0) > 0;

  // Check org_delegations
  const { count: delCount } = await supabase
    .from('org_delegations')
    .select('*', { count: 'exact', head: true })
    .eq('delegate_org_id', tenantId)
    .eq('status', 'active');
  flags.delegation_scoped = (delCount ?? 0) > 0;

  // General flags
  flags.request_received = true; // If resolver is called, a request exists
  flags.triage_completed = (linkCount ?? 0) > 0;
  flags.manager_accepted = (linkCount ?? 0) > 0;

  return flags;
};

registerContextResolver('GP-CLIENT-ASSIGNMENT', gpClientAssignmentResolver);

// ═══════════════════════════════════════════════════════════════
// MOD-21 / GP-BROWSER-SESSION Resolver (KI-Browser)
// ═══════════════════════════════════════════════════════════════

const gpBrowserSessionResolver: ContextResolver = async ({ tenantId, entityId: sessionId }) => {
  const flags: Record<string, boolean> = {
    user_authenticated: true,
    tenant_exists: !!tenantId,
  };
  if (!tenantId) return flags;

  if (sessionId) {
    const { data: session } = await supabase
      .from('ki_browser_sessions' as never)
      .select('id, status' as never)
      .eq('id' as never, sessionId)
      .eq('tenant_id' as never, tenantId)
      .maybeSingle() as unknown as { data: { id: string; status: string } | null };
    flags.session_exists = !!session;
    flags.session_active = session?.status === 'active';
    flags.session_completed = session?.status === 'completed';
  }

  return flags;
};

registerContextResolver('MOD-21', gpBrowserSessionResolver);
registerContextResolver('GP-BROWSER-SESSION', gpBrowserSessionResolver);
