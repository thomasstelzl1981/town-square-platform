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

async function executeSeeds(tenantId: string): Promise<{ success: boolean; error?: string; data?: unknown }> {
  // Use SECURITY DEFINER function to bypass RLS
  const { data, error } = await supabase.rpc('seed_golden_path_data');
  
  if (error) {
    console.error('Seed error:', error);
    return { success: false, error: error.message };
  }
  
  console.log('Seed result:', data);
  return { success: true, data };
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
