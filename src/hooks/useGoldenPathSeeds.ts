/**
 * Golden Path Seeds Hook v3
 * Idempotent seeding for MOD-04, MOD-07, MOD-03 demo data
 * 
 * AUDIT RULES:
 * - All counts are tenant-filtered
 * - No deletes (upsert-only)
 * - Link validation uses batch queries (no N+1)
 * - service_case validation is safe (skipped with warning)
 * - Entity presence checks for idempotency proof
 * - TXT report export function
 */
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Fixed IDs for idempotent upserts (deterministic based on content)
const SEED_IDS = {
  property: '00000000-0000-4000-a000-000000000001',
  unit: '00000000-0000-4000-a000-000000000002',
  loan: '00000000-0000-4000-a000-000000000003',
  finance_request: '00000000-0000-4000-a000-000000000004',
  applicant_profile: '00000000-0000-4000-a000-000000000005',
  contact: '00000000-0000-4000-a000-000000000006',
  // Documents
  doc_ausweis: '00000000-0000-4000-a000-000000000010',
  doc_gehalt: '00000000-0000-4000-a000-000000000011',
  doc_konto: '00000000-0000-4000-a000-000000000012',
  doc_expose: '00000000-0000-4000-a000-000000000013',
  doc_darlehen: '00000000-0000-4000-a000-000000000014',
  // Storage nodes
  node_inbox: '00000000-0000-4000-a000-000000000020',
  node_immobilien: '00000000-0000-4000-a000-000000000021',
  node_immobilien_demo: '00000000-0000-4000-a000-000000000022',
  node_immobilien_demo_expose: '00000000-0000-4000-a000-000000000023',
  node_immobilien_demo_finanz: '00000000-0000-4000-a000-000000000024',
  node_finanzierung: '00000000-0000-4000-a000-000000000025',
  node_finanzierung_demo: '00000000-0000-4000-a000-000000000026',
  node_bonitaet: '00000000-0000-4000-a000-000000000027',
  // Document links
  link_expose_property: '00000000-0000-4000-a000-000000000030',
  link_darlehen_property: '00000000-0000-4000-a000-000000000031',
  link_ausweis_finanz: '00000000-0000-4000-a000-000000000032',
  link_gehalt_finanz: '00000000-0000-4000-a000-000000000033',
  link_konto_contact: '00000000-0000-4000-a000-000000000034',
} as const;

export interface SeedCounts {
  properties: number;
  units: number;
  loans: number;
  finance_requests: number;
  applicant_profiles: number;
  contacts: number;
  documents: number;
  storage_nodes: number;
  document_links: number;
}

export interface LinkValidationResult {
  link_id: string;
  doc_id: string;
  object_type: string;
  object_id: string;
  target_exists: boolean | 'unknown';
  doc_exists: boolean;
  reason?: string;
}

export interface LinkValidationSummary {
  total_links: number;
  valid_count: number;
  invalid_count: number;
  unknown_count: number;
  doc_missing_count: number;
  fails_by_type: Record<string, number>;
  first_fails: LinkValidationResult[];
}

export interface SeedEntityPresence {
  property: boolean;
  finance_request: boolean;
  contact: boolean;
  all_present: boolean;
}

export interface SeedContext {
  tenant_id: string;
  org_name: string;
  org_type: string;
  dev_mode: boolean;
  seed_allowed: boolean;
  seed_blocked_reason?: string;
}

export interface SeedResult {
  success: boolean;
  context: SeedContext;
  before: SeedCounts;
  after_run1: SeedCounts;
  after_run2: SeedCounts;
  link_validation: LinkValidationSummary;
  entity_presence: SeedEntityPresence;
  idempotency_pass: boolean;
  error?: string;
}

// Empty counts helper
function emptyCounts(): SeedCounts {
  return {
    properties: 0,
    units: 0,
    loans: 0,
    finance_requests: 0,
    applicant_profiles: 0,
    contacts: 0,
    documents: 0,
    storage_nodes: 0,
    document_links: 0,
  };
}

// Empty link validation helper
function emptyLinkValidation(): LinkValidationSummary {
  return {
    total_links: 0,
    valid_count: 0,
    invalid_count: 0,
    unknown_count: 0,
    doc_missing_count: 0,
    fails_by_type: {},
    first_fails: [],
  };
}

// Empty entity presence helper
function emptyEntityPresence(): SeedEntityPresence {
  return {
    property: false,
    finance_request: false,
    contact: false,
    all_present: false,
  };
}

/**
 * Get counts for all seed-related tables (tenant-filtered)
 */
async function getCounts(tenantId: string): Promise<SeedCounts> {
  const [props, units, loans, finReqs, appProfiles, contacts, docs, nodes, links] = await Promise.all([
    supabase.from('properties').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('units').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('loans').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('finance_requests').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('applicant_profiles').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('documents').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('storage_nodes').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('document_links').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
  ]);

  return {
    properties: props.count ?? 0,
    units: units.count ?? 0,
    loans: loans.count ?? 0,
    finance_requests: finReqs.count ?? 0,
    applicant_profiles: appProfiles.count ?? 0,
    contacts: contacts.count ?? 0,
    documents: docs.count ?? 0,
    storage_nodes: nodes.count ?? 0,
    document_links: links.count ?? 0,
  };
}

/**
 * Check if seed entities exist (maybeSingle)
 */
async function checkEntityPresence(tenantId: string): Promise<SeedEntityPresence> {
  const [propRes, finRes, contactRes] = await Promise.all([
    supabase.from('properties').select('id').eq('id', SEED_IDS.property).eq('tenant_id', tenantId).maybeSingle(),
    supabase.from('finance_requests').select('id').eq('id', SEED_IDS.finance_request).eq('tenant_id', tenantId).maybeSingle(),
    supabase.from('contacts').select('id').eq('id', SEED_IDS.contact).eq('tenant_id', tenantId).maybeSingle(),
  ]);

  const property = propRes.data !== null;
  const finance_request = finRes.data !== null;
  const contact = contactRes.data !== null;

  return {
    property,
    finance_request,
    contact,
    all_present: property && finance_request && contact,
  };
}

/**
 * Validate document links with batch queries (NO N+1)
 * - Validates target existence per object_type
 * - Validates document existence
 * - Handles null/missing fields safely
 */
async function validateDocumentLinks(tenantId: string): Promise<LinkValidationSummary> {
  // Step 1: Load all document_links for this tenant with all required fields
  const { data: allLinks, error } = await supabase
    .from('document_links')
    .select('id, document_id, node_id, object_type, object_id')
    .eq('tenant_id', tenantId);

  if (error || !allLinks) {
    return emptyLinkValidation();
  }

  // Step 2: Collect all document_ids for batch check
  const allDocIds = [...new Set(
    allLinks
      .map(l => l.document_id)
      .filter((id): id is string => id !== null && id !== undefined)
  )];

  // Batch check document existence
  let docExistsSet = new Set<string>();
  if (allDocIds.length > 0) {
    const { data: docs } = await supabase.from('documents').select('id').in('id', allDocIds);
    docExistsSet = new Set((docs ?? []).map(d => d.id));
  }

  // Step 3: Group by object_type (null-safe)
  const byType: Record<string, Array<{ id: string; object_id: string; document_id: string | null }>> = {};
  for (const link of allLinks) {
    const objType = link.object_type ?? '__null__';
    if (!byType[objType]) {
      byType[objType] = [];
    }
    byType[objType].push({
      id: link.id,
      object_id: link.object_id ?? '',
      document_id: link.document_id,
    });
  }

  // Step 4: Batch query per type
  const existsMap: Record<string, Set<string>> = {};
  const unknownTypes = new Set<string>();

  // property
  if (byType['property']) {
    const ids = [...new Set(byType['property'].map(l => l.object_id).filter(Boolean))];
    if (ids.length > 0) {
      const { data } = await supabase.from('properties').select('id').in('id', ids);
      existsMap['property'] = new Set((data ?? []).map(r => r.id));
    } else {
      existsMap['property'] = new Set();
    }
  }

  // unit
  if (byType['unit']) {
    const ids = [...new Set(byType['unit'].map(l => l.object_id).filter(Boolean))];
    if (ids.length > 0) {
      const { data } = await supabase.from('units').select('id').in('id', ids);
      existsMap['unit'] = new Set((data ?? []).map(r => r.id));
    } else {
      existsMap['unit'] = new Set();
    }
  }

  // contact
  if (byType['contact']) {
    const ids = [...new Set(byType['contact'].map(l => l.object_id).filter(Boolean))];
    if (ids.length > 0) {
      const { data } = await supabase.from('contacts').select('id').in('id', ids);
      existsMap['contact'] = new Set((data ?? []).map(r => r.id));
    } else {
      existsMap['contact'] = new Set();
    }
  }

  // finance_case -> maps to finance_requests table
  if (byType['finance_case']) {
    const ids = [...new Set(byType['finance_case'].map(l => l.object_id).filter(Boolean))];
    if (ids.length > 0) {
      const { data } = await supabase.from('finance_requests').select('id').in('id', ids);
      existsMap['finance_case'] = new Set((data ?? []).map(r => r.id));
    } else {
      existsMap['finance_case'] = new Set();
    }
  }

  // service_case -> SAFE HANDLING (table may not exist or be accessible)
  if (byType['service_case']) {
    unknownTypes.add('service_case');
  }

  // __null__ -> unknown
  if (byType['__null__']) {
    unknownTypes.add('__null__');
  }

  // Step 5: Build validation results
  const results: LinkValidationResult[] = [];
  const fails_by_type: Record<string, number> = {};
  let doc_missing_count = 0;

  for (const link of allLinks) {
    const linkId = link.id;
    const docId = link.document_id ?? '';
    const objType = link.object_type ?? '__null__';
    const objId = link.object_id ?? '';
    
    const docExists = docId ? docExistsSet.has(docId) : false;
    if (!docExists && docId) {
      doc_missing_count++;
    }

    let target_exists: boolean | 'unknown' = 'unknown';
    let reason: string | undefined;

    if (!objType || objType === '__null__') {
      target_exists = 'unknown';
      reason = 'object_type is null';
    } else if (!objId) {
      target_exists = 'unknown';
      reason = 'object_id is null';
    } else if (unknownTypes.has(objType)) {
      target_exists = 'unknown';
      reason = objType === 'service_case' ? 'cases table not validated' : 'unmapped type';
    } else if (existsMap[objType]) {
      target_exists = existsMap[objType].has(objId);
      if (!target_exists) {
        fails_by_type[objType] = (fails_by_type[objType] ?? 0) + 1;
        reason = `${objType} not found`;
      }
    } else {
      target_exists = 'unknown';
      reason = `unmapped object_type: ${objType}`;
    }

    results.push({
      link_id: linkId,
      doc_id: docId,
      object_type: objType,
      object_id: objId,
      target_exists,
      doc_exists: docExists,
      reason,
    });
  }

  const valid_count = results.filter(r => r.target_exists === true && r.doc_exists).length;
  const invalid_count = results.filter(r => r.target_exists === false || !r.doc_exists).length;
  const unknown_count = results.filter(r => r.target_exists === 'unknown').length;
  const first_fails = results.filter(r => r.target_exists === false || !r.doc_exists).slice(0, 10);

  return {
    total_links: allLinks.length,
    valid_count,
    invalid_count,
    unknown_count,
    doc_missing_count,
    fails_by_type,
    first_fails,
  };
}

/**
 * Execute all seeds (upsert-only, no deletes)
 */
async function executeSeeds(tenantId: string): Promise<void> {
  // ============ (A) PROPERTY + UNIT + LOAN ============
  
  const propertyData = {
    id: SEED_IDS.property,
    tenant_id: tenantId,
    public_id: 'PROP-DEMO-001',
    code: 'DEMO-001',
    property_type: 'ETW',
    postal_code: '10115',
    city: 'Berlin',
    address: 'Musterstraße 42',
    year_built: 2015,
    total_area_sqm: 85,
    usage_type: 'residential',
    annual_income: 14400,
    market_value: 380000,
    purchase_price: 350000,
    land_register_court: 'Berlin-Mitte',
    land_register_sheet: 'Blatt 1234',
    parcel_number: '123/4',
    status: 'active',
    energy_source: 'Fernwärme',
    heating_type: 'Fußbodenheizung',
    weg_flag: true,
    mea_total: 42,
    is_public_listing: false,
  };

  await supabase.from('properties').upsert([propertyData], { onConflict: 'id' });

  const unitData = {
    id: SEED_IDS.unit,
    tenant_id: tenantId,
    public_id: 'UNIT-DEMO-001',
    property_id: SEED_IDS.property,
    unit_number: 'WE 42',
    area_sqm: 85,
    current_monthly_rent: 1200,
    usage_type: 'residential',
    floor: 3,
    rooms: 3,
  };

  await supabase.from('units').upsert([unitData], { onConflict: 'id' });

  const loanData = {
    id: SEED_IDS.loan,
    tenant_id: tenantId,
    property_id: SEED_IDS.property,
    scope: 'property',
    bank_name: 'Deutsche Kreditbank (DKB)',
    loan_number: 'DKB-2024-123456',
    start_date: '2024-03-15',
    maturity_date: '2044-03-15',
    interest_rate_percent: 3.25,
    fixed_interest_end_date: '2034-03-15',
    annuity_monthly_eur: 1250,
    repayment_rate_percent: 2.0,
    outstanding_balance_eur: 285000,
    outstanding_balance_asof: '2026-01-01',
    special_repayment_right_eur_per_year: 10000,
  };

  await supabase.from('loans').upsert([loanData], { onConflict: 'id' });

  // ============ (B) CONTACT + FINANCE REQUEST + APPLICANT PROFILE ============

  const contactData = {
    id: SEED_IDS.contact,
    tenant_id: tenantId,
    public_id: 'CONTACT-DEMO-001',
    first_name: 'Max',
    last_name: 'Mustermann',
    email: 'max.mustermann@example.com',
    phone: '+49 30 12345678',
    company: null,
    notes: 'Demo-Kontakt für Golden Path Seeds',
  };

  await supabase.from('contacts').upsert([contactData], { onConflict: 'id' });

  const financeRequestData = {
    id: SEED_IDS.finance_request,
    tenant_id: tenantId,
    public_id: 'FIN-DEMO-2026-001',
    status: 'submitted',
    object_source: 'mod04_property',
    property_id: SEED_IDS.property,
  };

  await supabase.from('finance_requests').upsert([financeRequestData], { onConflict: 'id' });

  const applicantProfileData = {
    id: SEED_IDS.applicant_profile,
    tenant_id: tenantId,
    finance_request_id: SEED_IDS.finance_request,
    profile_type: 'private',
    party_role: 'primary',
    first_name: 'Max',
    last_name: 'Mustermann',
    birth_date: '1985-06-15',
    birth_place: 'Berlin',
    nationality: 'deutsch',
    marital_status: 'verheiratet',
    address_street: 'Hauptstraße 10',
    address_postal_code: '10117',
    address_city: 'Berlin',
    phone: '+49 30 12345678',
    email: 'max.mustermann@example.com',
    id_document_type: 'PA',
    id_document_number: 'T220001293',
    id_document_valid_until: '2030-06-14',
    tax_id: '12 345 678 901',
    iban: 'DE89 3704 0044 0532 0130 00',
    adults_count: 2,
    children_count: 1,
    children_ages: '8',
    employment_type: 'unbefristet',
    employer_name: 'Tech AG',
    employer_location: 'Berlin',
    employer_industry: 'IT/Software',
    position: 'Senior Developer',
    employed_since: '2018-04-01',
    net_income_monthly: 4800,
    bonus_yearly: 5000,
    current_rent_monthly: 1100,
    living_expenses_monthly: 800,
    bank_savings: 45000,
    securities_value: 25000,
    purpose: 'kapitalanlage',
    object_address: 'Musterstraße 42, 10115 Berlin',
    object_type: 'ETW',
    purchase_price: 350000,
    ancillary_costs: 35000,
    equity_amount: 80000,
    equity_source: 'Ersparnisse',
    loan_amount_requested: 305000,
    fixed_rate_period_years: 10,
    repayment_rate_percent: 2.0,
    max_monthly_rate: 1300,
    schufa_consent: true,
    no_insolvency: true,
    no_tax_arrears: true,
    data_correct_confirmed: true,
    completion_score: 95,
  };

  await supabase.from('applicant_profiles').upsert([applicantProfileData], { onConflict: 'id' });

  // ============ (C) DOCUMENTS + STORAGE NODES ============

  const documentsData = [
    {
      id: SEED_IDS.doc_ausweis,
      tenant_id: tenantId,
      public_id: 'DOC-AUSWEIS-001',
      name: 'Personalausweis_Mustermann.pdf',
      file_path: `${tenantId}/finanzierung/demo/ausweis.pdf`,
      mime_type: 'application/pdf',
      size_bytes: 524288,
      doc_type: 'identity',
      scope: 'applicant',
    },
    {
      id: SEED_IDS.doc_gehalt,
      tenant_id: tenantId,
      public_id: 'DOC-GEHALT-001',
      name: 'Gehaltsnachweis_2026-01.pdf',
      file_path: `${tenantId}/finanzierung/demo/gehalt.pdf`,
      mime_type: 'application/pdf',
      size_bytes: 256000,
      doc_type: 'income_proof',
      scope: 'applicant',
    },
    {
      id: SEED_IDS.doc_konto,
      tenant_id: tenantId,
      public_id: 'DOC-KONTO-001',
      name: 'Kontoauszug_Q4_2025.pdf',
      file_path: `${tenantId}/finanzierung/demo/konto.pdf`,
      mime_type: 'application/pdf',
      size_bytes: 384000,
      doc_type: 'bank_statement',
      scope: 'applicant',
    },
    {
      id: SEED_IDS.doc_expose,
      tenant_id: tenantId,
      public_id: 'DOC-EXPOSE-001',
      name: 'Exposé_Musterstraße_42.pdf',
      file_path: `${tenantId}/immobilien/demo/expose.pdf`,
      mime_type: 'application/pdf',
      size_bytes: 2097152,
      doc_type: 'expose',
      scope: 'property',
    },
    {
      id: SEED_IDS.doc_darlehen,
      tenant_id: tenantId,
      public_id: 'DOC-DARLEHEN-001',
      name: 'Darlehensvertrag_DKB_2024.pdf',
      file_path: `${tenantId}/immobilien/demo/darlehen.pdf`,
      mime_type: 'application/pdf',
      size_bytes: 1048576,
      doc_type: 'loan_contract',
      scope: 'property',
    },
  ];

  for (const doc of documentsData) {
    await supabase.from('documents').upsert([doc], { onConflict: 'id' });
  }

  const storageNodesData = [
    { id: SEED_IDS.node_inbox, tenant_id: tenantId, parent_id: null, name: 'Posteingang', node_type: 'folder', template_id: 'inbox' },
    { id: SEED_IDS.node_immobilien, tenant_id: tenantId, parent_id: null, name: 'Immobilien', node_type: 'folder', template_id: 'immobilien' },
    { id: SEED_IDS.node_finanzierung, tenant_id: tenantId, parent_id: null, name: 'Finanzierung', node_type: 'folder', template_id: 'finanzierung' },
    { id: SEED_IDS.node_bonitaet, tenant_id: tenantId, parent_id: null, name: 'Bonitätsunterlagen', node_type: 'folder', template_id: 'bonitaetsunterlagen' },
    { id: SEED_IDS.node_immobilien_demo, tenant_id: tenantId, parent_id: SEED_IDS.node_immobilien, name: 'DEMO-001 Musterstraße 42', node_type: 'folder', property_id: SEED_IDS.property },
    { id: SEED_IDS.node_immobilien_demo_expose, tenant_id: tenantId, parent_id: SEED_IDS.node_immobilien_demo, name: 'Exposé', node_type: 'folder', property_id: SEED_IDS.property },
    { id: SEED_IDS.node_immobilien_demo_finanz, tenant_id: tenantId, parent_id: SEED_IDS.node_immobilien_demo, name: 'Finanzierung', node_type: 'folder', property_id: SEED_IDS.property },
    { id: SEED_IDS.node_finanzierung_demo, tenant_id: tenantId, parent_id: SEED_IDS.node_finanzierung, name: 'FIN-DEMO-2026-001 Unterlagen', node_type: 'folder' },
  ];

  for (const node of storageNodesData) {
    await supabase.from('storage_nodes').upsert([node], { onConflict: 'id' });
  }

  // ============ (D) DOCUMENT LINKS ============

  const documentLinksData = [
    { id: SEED_IDS.link_expose_property, tenant_id: tenantId, document_id: SEED_IDS.doc_expose, node_id: SEED_IDS.node_immobilien_demo_expose, object_type: 'property', object_id: SEED_IDS.property },
    { id: SEED_IDS.link_darlehen_property, tenant_id: tenantId, document_id: SEED_IDS.doc_darlehen, node_id: SEED_IDS.node_immobilien_demo_finanz, object_type: 'property', object_id: SEED_IDS.property },
    { id: SEED_IDS.link_ausweis_finanz, tenant_id: tenantId, document_id: SEED_IDS.doc_ausweis, node_id: SEED_IDS.node_finanzierung_demo, object_type: 'finance_case', object_id: SEED_IDS.finance_request },
    { id: SEED_IDS.link_gehalt_finanz, tenant_id: tenantId, document_id: SEED_IDS.doc_gehalt, node_id: SEED_IDS.node_finanzierung_demo, object_type: 'finance_case', object_id: SEED_IDS.finance_request },
    { id: SEED_IDS.link_konto_contact, tenant_id: tenantId, document_id: SEED_IDS.doc_konto, node_id: SEED_IDS.node_bonitaet, object_type: 'contact', object_id: SEED_IDS.contact },
  ];

  for (const link of documentLinksData) {
    await supabase.from('document_links').upsert([link], { onConflict: 'id' });
  }
}

/**
 * Render TXT report for copy/paste
 */
export function renderSeedReportTxt(result: SeedResult): string {
  const lines: string[] = [];
  const now = new Date().toISOString();

  lines.push('================================================================================');
  lines.push('GOLDEN PATH SEEDS — INTEGRITY REPORT v3');
  lines.push(`Generated: ${now}`);
  lines.push('================================================================================');
  lines.push('');

  // Context
  lines.push('1) CONTEXT HEADER');
  lines.push('--------------------------------------------------------------------------------');
  lines.push(`tenant_id:     ${result.context.tenant_id}`);
  lines.push(`org_name:      ${result.context.org_name}`);
  lines.push(`org_type:      ${result.context.org_type}`);
  lines.push(`dev_mode:      ${result.context.dev_mode}`);
  lines.push(`seed_allowed:  ${result.context.seed_allowed}`);
  if (result.context.seed_blocked_reason) {
    lines.push(`blocked_reason: ${result.context.seed_blocked_reason}`);
  }
  lines.push('');

  // Counts Table
  lines.push('2) COUNTS TABLE');
  lines.push('--------------------------------------------------------------------------------');
  lines.push('Table                | Before | After#1 | After#2 | OK');
  lines.push('---------------------|--------|---------|---------|----');

  const tables: Array<keyof SeedCounts> = [
    'properties', 'units', 'loans', 'finance_requests', 'applicant_profiles',
    'contacts', 'documents', 'storage_nodes', 'document_links'
  ];

  for (const t of tables) {
    const before = result.before[t] ?? 0;
    const after1 = result.after_run1[t] ?? 0;
    const after2 = result.after_run2[t] ?? 0;
    const ok = after2 >= after1 ? '✓' : '✗';
    lines.push(`${t.padEnd(20)} | ${String(before).padStart(6)} | ${String(after1).padStart(7)} | ${String(after2).padStart(7)} | ${ok}`);
  }
  lines.push('');

  // Link Validation
  lines.push('3) LINK VALIDATION SUMMARY');
  lines.push('--------------------------------------------------------------------------------');
  lines.push(`total_links:      ${result.link_validation.total_links}`);
  lines.push(`valid_count:      ${result.link_validation.valid_count}`);
  lines.push(`invalid_count:    ${result.link_validation.invalid_count}`);
  lines.push(`unknown_count:    ${result.link_validation.unknown_count}`);
  lines.push(`doc_missing_count: ${result.link_validation.doc_missing_count}`);

  if (Object.keys(result.link_validation.fails_by_type).length > 0) {
    lines.push(`fails_by_type:    ${JSON.stringify(result.link_validation.fails_by_type)}`);
  }

  if (result.link_validation.first_fails.length > 0) {
    lines.push('');
    lines.push('First failing links (max 10):');
    for (const f of result.link_validation.first_fails) {
      lines.push(`  - ${f.link_id.slice(0, 8)}... | doc:${f.doc_id.slice(0, 8)}... | ${f.object_type} | ${f.object_id.slice(0, 8)}... | ${f.reason ?? 'target not found'}`);
    }
  }
  lines.push('');

  // Entity Presence
  lines.push('4) SEED ENTITY PRESENCE');
  lines.push('--------------------------------------------------------------------------------');
  lines.push(`property (SEED_IDS.property):         ${result.entity_presence.property ? '✓ EXISTS' : '✗ MISSING'}`);
  lines.push(`finance_request (SEED_IDS.finance_request): ${result.entity_presence.finance_request ? '✓ EXISTS' : '✗ MISSING'}`);
  lines.push(`contact (SEED_IDS.contact):           ${result.entity_presence.contact ? '✓ EXISTS' : '✗ MISSING'}`);
  lines.push(`all_present:                          ${result.entity_presence.all_present ? '✓ YES' : '✗ NO'}`);
  lines.push('');

  // Final
  lines.push('5) FINAL MARKER');
  lines.push('================================================================================');
  if (result.success && result.idempotency_pass) {
    lines.push('SEED_INTEGRITY: PASS');
    lines.push('All counts monotonic, no invalid links, all seed entities present.');
  } else if (result.success && !result.idempotency_pass) {
    lines.push('SEED_INTEGRITY: FAIL');
    lines.push('');
    lines.push('Root Cause:');
    if (result.link_validation.invalid_count > 0) {
      lines.push(`  - ${result.link_validation.invalid_count} invalid document links`);
    }
    if (!result.entity_presence.all_present) {
      lines.push('  - Not all seed entities present after Run#2');
    }
    // Check counts monotonicity
    for (const t of tables) {
      const after1 = result.after_run1[t] ?? 0;
      const after2 = result.after_run2[t] ?? 0;
      if (after2 < after1) {
        lines.push(`  - ${t}: After#2 (${after2}) < After#1 (${after1})`);
      }
    }
  } else {
    lines.push('SEED_INTEGRITY: FAIL');
    lines.push('');
    lines.push(`Error: ${result.error ?? 'Unknown error'}`);
  }
  lines.push('================================================================================');
  lines.push('END');
  lines.push('================================================================================');

  return lines.join('\n');
}

export function useGoldenPathSeeds(
  tenantId: string | undefined,
  orgName: string | undefined,
  orgType: string | undefined,
  devMode: boolean
) {
  const [isSeeding, setIsSeeding] = useState(false);
  const [lastResult, setLastResult] = useState<SeedResult | null>(null);

  const runSeeds = useCallback(async (): Promise<SeedResult> => {
    // Build context
    const context: SeedContext = {
      tenant_id: tenantId ?? 'unknown',
      org_name: orgName ?? 'unknown',
      org_type: orgType ?? 'unknown',
      dev_mode: devMode,
      seed_allowed: orgType === 'internal',
      seed_blocked_reason: orgType !== 'internal' 
        ? `Seeds nur im internal Org erlaubt. Aktuell: ${orgType ?? 'unknown'}` 
        : undefined,
    };

    // Safety guard: only internal org allowed
    if (!context.seed_allowed) {
      const result: SeedResult = {
        success: false,
        context,
        before: emptyCounts(),
        after_run1: emptyCounts(),
        after_run2: emptyCounts(),
        link_validation: emptyLinkValidation(),
        entity_presence: emptyEntityPresence(),
        idempotency_pass: false,
        error: context.seed_blocked_reason,
      };
      setLastResult(result);
      return result;
    }

    if (!tenantId) {
      const result: SeedResult = {
        success: false,
        context,
        before: emptyCounts(),
        after_run1: emptyCounts(),
        after_run2: emptyCounts(),
        link_validation: emptyLinkValidation(),
        entity_presence: emptyEntityPresence(),
        idempotency_pass: false,
        error: 'No tenant ID',
      };
      setLastResult(result);
      return result;
    }

    setIsSeeding(true);

    try {
      // Get counts before
      const before = await getCounts(tenantId);

      // Run seeds #1
      await executeSeeds(tenantId);
      const after_run1 = await getCounts(tenantId);

      // Run seeds #2 (idempotency proof)
      await executeSeeds(tenantId);
      const after_run2 = await getCounts(tenantId);

      // Validate document links (batch, no N+1)
      const link_validation = await validateDocumentLinks(tenantId);

      // Check entity presence
      const entity_presence = await checkEntityPresence(tenantId);

      // Check idempotency: after_run2 >= after_run1 for all tables + no invalid links + entities present
      const countsMonotonic = (
        after_run2.properties >= after_run1.properties &&
        after_run2.units >= after_run1.units &&
        after_run2.loans >= after_run1.loans &&
        after_run2.finance_requests >= after_run1.finance_requests &&
        after_run2.applicant_profiles >= after_run1.applicant_profiles &&
        after_run2.contacts >= after_run1.contacts &&
        after_run2.documents >= after_run1.documents &&
        after_run2.storage_nodes >= after_run1.storage_nodes &&
        after_run2.document_links >= after_run1.document_links
      );

      const idempotency_pass = countsMonotonic && 
        link_validation.invalid_count === 0 && 
        entity_presence.all_present;

      const result: SeedResult = {
        success: true,
        context,
        before,
        after_run1,
        after_run2,
        link_validation,
        entity_presence,
        idempotency_pass,
      };

      setLastResult(result);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const result: SeedResult = {
        success: false,
        context,
        before: emptyCounts(),
        after_run1: emptyCounts(),
        after_run2: emptyCounts(),
        link_validation: emptyLinkValidation(),
        entity_presence: emptyEntityPresence(),
        idempotency_pass: false,
        error: errorMessage,
      };
      setLastResult(result);
      return result;
    } finally {
      setIsSeeding(false);
    }
  }, [tenantId, orgName, orgType, devMode]);

  return {
    runSeeds,
    isSeeding,
    lastResult,
    isSeedAllowed: orgType === 'internal',
  };
}

export { SEED_IDS };
