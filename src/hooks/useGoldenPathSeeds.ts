/**
 * Golden Path Seeds Hook v4
 * Complete Dev-Tenant Blueprint with:
 * - 5 Contacts (Max, Lisa, Mieter, Hausverwaltung, Bankberater)
 * - 1 Property (Kapitalanlage Leipzig 62m²)
 * - 1 Lease with Tenant
 * - 1 Loan (80% LTV)
 * - 1 Landlord Context (Familie Mustermann - Ehepaar)
 * - 12 Demo-PDFs
 * - 20 Module Activation
 * - 18+ Storage Folders
 */
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Fixed Dev-Tenant UUID
const DEV_TENANT_UUID = 'a0000000-0000-4000-a000-000000000001';

// Fixed IDs for idempotent upserts
const SEED_IDS = {
  // Contacts
  contact_max: '00000000-0000-4000-a000-000000000101',
  contact_lisa: '00000000-0000-4000-a000-000000000102',
  contact_mieter: '00000000-0000-4000-a000-000000000103',
  contact_hausverwaltung: '00000000-0000-4000-a000-000000000104',
  contact_bankberater: '00000000-0000-4000-a000-000000000105',
  // Landlord Context
  landlord_context: '00000000-0000-4000-a000-000000000110',
  context_member_max: '00000000-0000-4000-a000-000000000111',
  context_member_lisa: '00000000-0000-4000-a000-000000000112',
  // Property & Unit
  property: '00000000-0000-4000-a000-000000000001',
  unit: '00000000-0000-4000-a000-000000000002',
  // Lease & Loan
  lease: '00000000-0000-4000-a000-000000000120',
  loan: '00000000-0000-4000-a000-000000000003',
  // Finance
  finance_request: '00000000-0000-4000-a000-000000000004',
  applicant_profile: '00000000-0000-4000-a000-000000000005',
  // Documents (12)
  doc_expose_ankauf: '00000000-0000-4000-a000-000000000201',
  doc_grundbuch: '00000000-0000-4000-a000-000000000202',
  doc_teilungserklaerung: '00000000-0000-4000-a000-000000000203',
  doc_grundriss: '00000000-0000-4000-a000-000000000204',
  doc_kaufvertrag: '00000000-0000-4000-a000-000000000205',
  doc_mietvertrag: '00000000-0000-4000-a000-000000000206',
  doc_wirtschaftsplan: '00000000-0000-4000-a000-000000000207',
  doc_versicherung: '00000000-0000-4000-a000-000000000208',
  doc_darlehen: '00000000-0000-4000-a000-000000000209',
  doc_energieausweis: '00000000-0000-4000-a000-000000000210',
  doc_estbescheid: '00000000-0000-4000-a000-000000000211',
  doc_lohnsteuer: '00000000-0000-4000-a000-000000000212',
} as const;

// All 20 modules
const ALL_MODULES = [
  'MOD-01', 'MOD-02', 'MOD-03', 'MOD-04', 'MOD-05',
  'MOD-06', 'MOD-07', 'MOD-08', 'MOD-09', 'MOD-10',
  'MOD-11', 'MOD-12', 'MOD-13', 'MOD-14', 'MOD-15',
  'MOD-16', 'MOD-17', 'MOD-18', 'MOD-19', 'MOD-20',
];

export interface SeedCounts {
  properties: number;
  units: number;
  loans: number;
  leases: number;
  finance_requests: number;
  applicant_profiles: number;
  contacts: number;
  documents: number;
  storage_nodes: number;
  document_links: number;
  landlord_contexts: number;
  context_members: number;
  tile_activations: number;
}

export interface SeedResult {
  success: boolean;
  tenant_id: string;
  before: SeedCounts;
  after: SeedCounts;
  error?: string;
}

function emptyCounts(): SeedCounts {
  return {
    properties: 0,
    units: 0,
    loans: 0,
    leases: 0,
    finance_requests: 0,
    applicant_profiles: 0,
    contacts: 0,
    documents: 0,
    storage_nodes: 0,
    document_links: 0,
    landlord_contexts: 0,
    context_members: 0,
    tile_activations: 0,
  };
}

async function getCounts(tenantId: string): Promise<SeedCounts> {
  const [props, units, loans, leases, finReqs, appProfiles, contacts, docs, nodes, links, contexts, members, tiles] = await Promise.all([
    supabase.from('properties').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('units').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('loans').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('leases').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('finance_requests').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('applicant_profiles').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('contacts').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('documents').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('storage_nodes').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('document_links').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('landlord_contexts').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('context_members').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('tenant_tile_activation').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
  ]);

  return {
    properties: props.count ?? 0,
    units: units.count ?? 0,
    loans: loans.count ?? 0,
    leases: leases.count ?? 0,
    finance_requests: finReqs.count ?? 0,
    applicant_profiles: appProfiles.count ?? 0,
    contacts: contacts.count ?? 0,
    documents: docs.count ?? 0,
    storage_nodes: nodes.count ?? 0,
    document_links: links.count ?? 0,
    landlord_contexts: contexts.count ?? 0,
    context_members: members.count ?? 0,
    tile_activations: tiles.count ?? 0,
  };
}

async function executeSeeds(tenantId: string): Promise<void> {
  // ============ 1. CONTACTS (5) ============
  const contactsData = [
    {
      id: SEED_IDS.contact_max,
      tenant_id: tenantId,
      public_id: 'SOT-K-MAXMUSTER',
      first_name: 'Max',
      last_name: 'Mustermann',
      email: 'max@mustermann.de',
      phone: '0170 1234567',
      company: null,
      notes: 'Eigentümer/Power-User - Dev Account Owner',
    },
    {
      id: SEED_IDS.contact_lisa,
      tenant_id: tenantId,
      public_id: 'SOT-K-LISAMUST',
      first_name: 'Lisa',
      last_name: 'Mustermann',
      email: 'lisa@mustermann.de',
      phone: '0170 2345678',
      company: null,
      notes: 'Ehepartnerin von Max Mustermann',
    },
    {
      id: SEED_IDS.contact_mieter,
      tenant_id: tenantId,
      public_id: 'SOT-K-BERGMANN',
      first_name: 'Thomas',
      last_name: 'Bergmann',
      email: 't.bergmann@email.de',
      phone: '0151 9876543',
      company: null,
      notes: 'Mieter der Demo-Wohnung DEMO-001',
    },
    {
      id: SEED_IDS.contact_hausverwaltung,
      tenant_id: tenantId,
      public_id: 'SOT-K-HOFFMANN',
      first_name: 'Sandra',
      last_name: 'Hoffmann',
      email: 's.hoffmann@immo-hv.de',
      phone: '0221 4567890',
      company: 'Immo-HV GmbH',
      notes: 'Hausverwaltung für WEG Leipziger Straße',
    },
    {
      id: SEED_IDS.contact_bankberater,
      tenant_id: tenantId,
      public_id: 'SOT-K-WEBER',
      first_name: 'Michael',
      last_name: 'Weber',
      email: 'm.weber@sparkasse.de',
      phone: '069 1234000',
      company: 'Sparkasse Leipzig',
      notes: 'Bankberater für Finanzierung DEMO-001',
    },
  ];

  for (const contact of contactsData) {
    await supabase.from('contacts').upsert([contact], { onConflict: 'id' });
  }

  // ============ 2. LANDLORD CONTEXT (Familie Mustermann) ============
  const contextData = {
    id: SEED_IDS.landlord_context,
    tenant_id: tenantId,
    name: 'Familie Mustermann',
    context_type: 'married_couple',
    tax_bracket: 'III/V',
    taxable_income_yearly: 98000,
    marginal_tax_rate: 42.00,
    solidarity_surcharge: true,
    church_tax: false,
    church_tax_rate: null,
    children_count: 1,
    child_allowance: true,
    notes: 'Zusammenveranlagung Ehepaar',
  };

  await supabase.from('landlord_contexts').upsert([contextData], { onConflict: 'id' });

  // Context Members
  const membersData = [
    {
      id: SEED_IDS.context_member_max,
      context_id: SEED_IDS.landlord_context,
      tenant_id: tenantId,
      first_name: 'Max',
      last_name: 'Mustermann',
      ownership_share: 50.00,
      profession: 'Softwareentwickler',
      gross_income_yearly: 72000,
      tax_class: 'III',
      church_tax: false,
    },
    {
      id: SEED_IDS.context_member_lisa,
      context_id: SEED_IDS.landlord_context,
      tenant_id: tenantId,
      first_name: 'Lisa',
      last_name: 'Mustermann',
      ownership_share: 50.00,
      profession: 'Marketing-Managerin',
      gross_income_yearly: 54000,
      tax_class: 'V',
      church_tax: false,
    },
  ];

  for (const member of membersData) {
    await supabase.from('context_members').upsert([member], { onConflict: 'id' });
  }

  // ============ 3. PROPERTY (Kapitalanlage Leipzig) ============
  const propertyData = {
    id: SEED_IDS.property,
    tenant_id: tenantId,
    public_id: 'SOT-I-DEMO001',
    code: 'DEMO-001',
    property_type: 'ETW',
    postal_code: '04109',
    city: 'Leipzig',
    address: 'Leipziger Straße 42',
    year_built: 1998,
    total_area_sqm: 62,
    usage_type: 'residential',
    annual_income: 8184, // 682 × 12
    market_value: 220000,
    purchase_price: 200000,
    land_register_court: 'AG Leipzig',
    land_register_sheet: 'Blatt 12345',
    parcel_number: 'Flurstück 42/5',
    status: 'active',
    energy_source: 'Fernwärme',
    heating_type: 'Zentralheizung',
    weg_flag: true,
    mea_total: 62, // 62/1000 MEA
    is_public_listing: false,
    owner_context_id: SEED_IDS.landlord_context,
  };

  await supabase.from('properties').upsert([propertyData], { onConflict: 'id' });

  // ============ 4. UNIT ============
  const unitData = {
    id: SEED_IDS.unit,
    tenant_id: tenantId,
    public_id: 'SOT-E-DEMO001M',
    property_id: SEED_IDS.property,
    unit_number: 'MAIN',
    code: 'WE 42',
    area_sqm: 62,
    current_monthly_rent: 682,
    usage_type: 'residential',
    floor: 3,
    rooms: 2,
  };

  await supabase.from('units').upsert([unitData], { onConflict: 'id' });

  // ============ 5. LEASE (Mietvertrag Bergmann) ============
  const leaseData = {
    id: SEED_IDS.lease,
    tenant_id: tenantId,
    unit_id: SEED_IDS.unit,
    tenant_contact_id: SEED_IDS.contact_mieter,
    tenant_name: 'Thomas Bergmann',
    start_date: '2022-06-01',
    end_date: null, // Unbefristet
    monthly_rent: 682,
    nk_advance: 155,
    deposit_eur: 2046, // 3 Kaltmieten
    payment_day: 3,
    status: 'active',
    notes: 'Unbefristeter Mietvertrag seit 01.06.2022',
  };

  await supabase.from('leases').upsert([leaseData], { onConflict: 'id' });

  // ============ 6. LOAN (80% LTV Sparkasse) ============
  const loanData = {
    id: SEED_IDS.loan,
    tenant_id: tenantId,
    property_id: SEED_IDS.property,
    scope: 'property',
    bank_name: 'Sparkasse Leipzig',
    loan_number: 'SPK-2022-123456',
    start_date: '2022-03-15',
    maturity_date: '2042-03-15',
    interest_rate_percent: 3.60,
    fixed_interest_end_date: '2032-03-15',
    annuity_monthly_eur: 747,
    repayment_rate_percent: 2.00,
    outstanding_balance_eur: 152000,
    outstanding_balance_asof: '2026-01-01',
    special_repayment_right_eur_per_year: 8000,
  };

  await supabase.from('loans').upsert([loanData], { onConflict: 'id' });

  // ============ 7. DOCUMENTS (12 Demo-PDFs) ============
  const docsData = [
    { id: SEED_IDS.doc_expose_ankauf, name: 'Exposé_Ankauf_2022.pdf', doc_type: 'expose_buy', folder: '01_Exposee_Ankauf' },
    { id: SEED_IDS.doc_grundbuch, name: 'Grundbuchauszug_Leipzig_12345.pdf', doc_type: 'land_register', folder: '03_Grundbuchauszug' },
    { id: SEED_IDS.doc_teilungserklaerung, name: 'Teilungserklaerung_WEG.pdf', doc_type: 'division_declaration', folder: '04_Teilungserklaerung' },
    { id: SEED_IDS.doc_grundriss, name: 'Grundriss_62qm.pdf', doc_type: 'floorplan', folder: '05_Grundriss' },
    { id: SEED_IDS.doc_kaufvertrag, name: 'Kaufvertrag_2022-03-15.pdf', doc_type: 'purchase_contract', folder: '07_Kaufvertrag' },
    { id: SEED_IDS.doc_mietvertrag, name: 'Mietvertrag_Bergmann_2022.pdf', doc_type: 'lease_contract', folder: '08_Mietvertrag' },
    { id: SEED_IDS.doc_wirtschaftsplan, name: 'WEG_Wirtschaftsplan_2024.pdf', doc_type: 'weg_plan', folder: '10_Wirtschaftsplaene' },
    { id: SEED_IDS.doc_versicherung, name: 'Versicherungspolice_2024.pdf', doc_type: 'insurance', folder: '13_Versicherung' },
    { id: SEED_IDS.doc_darlehen, name: 'Darlehensvertrag_Sparkasse.pdf', doc_type: 'loan_contract', folder: '15_Finanzierung' },
    { id: SEED_IDS.doc_energieausweis, name: 'Energieausweis_2022.pdf', doc_type: 'energy_cert', folder: '12_Energieausweis' },
    { id: SEED_IDS.doc_estbescheid, name: 'Einkommensteuerbescheid_2023.pdf', doc_type: 'tax_assessment', folder: 'Stammdaten' },
    { id: SEED_IDS.doc_lohnsteuer, name: 'Lohnsteuerbescheinigung_Max_2024.pdf', doc_type: 'income_proof', folder: 'Stammdaten' },
  ];

  for (const doc of docsData) {
    await supabase.from('documents').upsert([{
      id: doc.id,
      tenant_id: tenantId,
      public_id: `SOT-D-${doc.id.slice(-6).toUpperCase()}`,
      name: doc.name,
      file_path: `${tenantId}/demo/${doc.folder}/${doc.name}`,
      mime_type: 'application/pdf',
      size_bytes: 100000 + Math.floor(Math.random() * 500000),
      doc_type: doc.doc_type,
      scope: doc.folder.includes('Stammdaten') ? 'applicant' : 'property',
      source: 'golden_path_seed',
    }], { onConflict: 'id' });
  }

  // ============ 8. MODULE ACTIVATION (all 20) ============
  for (const moduleCode of ALL_MODULES) {
    await supabase.from('tenant_tile_activation').upsert([{
      tenant_id: tenantId,
      tile_code: moduleCode,
      is_active: true,
      activated_at: new Date().toISOString(),
    }], { onConflict: 'tenant_id,tile_code' });
  }

  // ============ 9. FINANCE REQUEST (optional for MOD-07 demo) ============
  const finReqData = {
    id: SEED_IDS.finance_request,
    tenant_id: tenantId,
    public_id: 'SOT-FR-DEMO001',
    status: 'draft',
    object_source: 'mod04_property',
    property_id: SEED_IDS.property,
  };

  await supabase.from('finance_requests').upsert([finReqData], { onConflict: 'id' });

  // ============ 10. APPLICANT PROFILE ============
  const applicantData = {
    id: SEED_IDS.applicant_profile,
    tenant_id: tenantId,
    finance_request_id: SEED_IDS.finance_request,
    profile_type: 'private',
    party_role: 'primary',
    first_name: 'Max',
    last_name: 'Mustermann',
    birth_date: '1985-08-15',
    birth_place: 'München',
    nationality: 'deutsch',
    marital_status: 'verheiratet',
    address_street: 'Hauptstraße 10',
    address_postal_code: '04109',
    address_city: 'Leipzig',
    phone: '0170 1234567',
    email: 'max@mustermann.de',
    tax_id: '12 345 678 901',
    adults_count: 2,
    children_count: 1,
    children_ages: '7',
    employment_type: 'unbefristet',
    employer_name: 'TechCorp GmbH',
    employer_location: 'Leipzig',
    employer_industry: 'IT/Software',
    position: 'Senior Developer',
    employed_since: '2018-01-15',
    net_income_monthly: 4200,
    bonus_yearly: 6000,
    current_rent_monthly: 0, // Eigentum
    living_expenses_monthly: 1200,
    bank_savings: 35000,
    securities_value: 18000,
    purpose: 'refinanzierung',
    completion_score: 85,
  };

  await supabase.from('applicant_profiles').upsert([applicantData], { onConflict: 'id' });
}

export function useGoldenPathSeeds(
  tenantId: string | undefined,
  orgName: string | undefined,
  orgType: string | undefined,
  devMode: boolean
) {
  const [isSeeding, setIsSeeding] = useState(false);
  const [lastResult, setLastResult] = useState<SeedResult | null>(null);

  // Use fixed dev tenant if in dev mode and no tenant provided
  const effectiveTenantId = tenantId || (devMode ? DEV_TENANT_UUID : undefined);

  const runSeeds = useCallback(async (): Promise<SeedResult> => {
    if (!effectiveTenantId) {
      const result: SeedResult = {
        success: false,
        tenant_id: 'unknown',
        before: emptyCounts(),
        after: emptyCounts(),
        error: 'No tenant ID available',
      };
      setLastResult(result);
      return result;
    }

    // Only allow seeding for internal org type
    if (orgType && orgType !== 'internal') {
      const result: SeedResult = {
        success: false,
        tenant_id: effectiveTenantId,
        before: emptyCounts(),
        after: emptyCounts(),
        error: `Seeds nur für internal Org erlaubt. Aktuell: ${orgType}`,
      };
      setLastResult(result);
      return result;
    }

    setIsSeeding(true);

    try {
      const before = await getCounts(effectiveTenantId);
      await executeSeeds(effectiveTenantId);
      const after = await getCounts(effectiveTenantId);

      const result: SeedResult = {
        success: true,
        tenant_id: effectiveTenantId,
        before,
        after,
      };

      setLastResult(result);
      return result;
    } catch (error) {
      const result: SeedResult = {
        success: false,
        tenant_id: effectiveTenantId,
        before: emptyCounts(),
        after: emptyCounts(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      setLastResult(result);
      return result;
    } finally {
      setIsSeeding(false);
    }
  }, [effectiveTenantId, orgType]);

  return {
    runSeeds,
    isSeeding,
    lastResult,
    isSeedAllowed: orgType === 'internal' || devMode,
  };
}

export { SEED_IDS, DEV_TENANT_UUID, ALL_MODULES };
