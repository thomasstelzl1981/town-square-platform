/**
 * FDC Snapshot Loader — Read-only aggregation of SSOT counts/flags.
 * 
 * Loads minimal data needed for the FDC integrity engine.
 * No sensitive payloads — only counts and existence flags.
 */

import { supabase } from '@/integrations/supabase/client';
import type { FDCSnapshotCounts } from '@/engines/fdc/spec';

export async function loadFDCSnapshot(tenantId: string): Promise<FDCSnapshotCounts> {
  const [
    accountsRes,
    accountMetaRes,
    insuranceSachRes,
    kvRes,
    vorsorgeRes,
    pensionRes,
    privateLoansRes,
    mortgagesRes,
    mietyHomesRes,
    mietyContractsRes,
    mietyLoansRes,
    legalDocsRes,
    propertiesRes,
    candidatesRes,
  ] = await Promise.all([
    // bank_accounts
    supabase.from('bank_accounts').select('id, owner_id, owner_type', { count: 'exact', head: false }).eq('tenant_id', tenantId),
    // bank_account_meta
    supabase.from('bank_account_meta').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    // insurance_contracts
    supabase.from('insurance_contracts').select('id, user_id', { count: 'exact', head: false }).eq('tenant_id', tenantId),
    // kv_contracts
    supabase.from('kv_contracts').select('id, person_id', { count: 'exact', head: false }).eq('tenant_id', tenantId),
    // vorsorge_contracts
    supabase.from('vorsorge_contracts').select('id, person_id', { count: 'exact', head: false }).eq('tenant_id', tenantId),
    // pension_records
    supabase.from('pension_records').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    // private_loans
    supabase.from('private_loans').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    // loans (mortgages)
    supabase.from('loans').select('id, property_id', { count: 'exact', head: false }).eq('tenant_id', tenantId),
    // miety_homes
    supabase.from('miety_homes').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    // miety_contracts
    supabase.from('miety_contracts').select('id, home_id', { count: 'exact', head: false }).eq('tenant_id', tenantId),
    // miety_loans
    supabase.from('miety_loans').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    // legal_documents
    supabase.from('legal_documents').select('id, document_type', { count: 'exact', head: false }).eq('tenant_id', tenantId),
    // properties
    supabase.from('properties').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    // contract_candidates
    supabase.from('contract_candidates').select('id, status', { count: 'exact', head: false }).eq('tenant_id', tenantId).eq('status', 'pending'),
  ]);

  const accounts = accountsRes.data || [];
  const insuranceSach = insuranceSachRes.data || [];
  const kv = kvRes.data || [];
  const vorsorge = vorsorgeRes.data || [];
  const mortgages = mortgagesRes.data || [];
  const mietyContracts = mietyContractsRes.data || [];
  const legalDocs = legalDocsRes.data || [];

  return {
    accounts: accounts.length,
    accountsWithMeta: accountMetaRes.count || 0,
    accountsWithOwner: accounts.filter((a: any) => a.owner_id).length,
    insuranceSach: insuranceSach.length,
    insuranceSachWithOwner: insuranceSach.filter((c: any) => c.user_id).length,
    insuranceKv: kv.length,
    insuranceKvWithOwner: kv.filter((c: any) => c.person_id).length,
    vorsorge: vorsorge.length,
    vorsorgeWithOwner: vorsorge.filter((c: any) => c.person_id).length,
    pensions: pensionRes.count || 0,
    privateLoans: privateLoansRes.count || 0,
    mortgages: mortgages.length,
    mortgagesWithProperty: mortgages.filter((l: any) => l.property_id).length,
    mietyHomes: mietyHomesRes.count || 0,
    mietyContracts: mietyContracts.length,
    mietyContractsLinkedToHome: mietyContracts.filter((c: any) => c.home_id).length,
    mietyLoans: mietyLoansRes.count || 0,
    legalDocs: legalDocs.length,
    legalDocsTestament: legalDocs.filter((d: any) => d.document_type === 'testament').length,
    legalDocsPatVfg: legalDocs.filter((d: any) => d.document_type === 'patientenverfuegung').length,
    properties: propertiesRes.count || 0,
    propertiesWithLoan: mortgages.filter((l: any) => l.property_id).length,
    contractCandidatesPending: candidatesRes.count || 0,
    hasFinanceConsent: true, // Default true for Wave 1; extend with consent check later
  };
}
