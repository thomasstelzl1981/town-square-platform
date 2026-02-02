/**
 * Golden Path Seeds Hook
 * Idempotent seeding for MOD-04, MOD-07, MOD-03 demo data
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
  link_konto_finanz: '00000000-0000-4000-a000-000000000034',
};

export interface SeedCounts {
  properties: number;
  units: number;
  loans: number;
  finance_requests: number;
  applicant_profiles: number;
  documents: number;
  storage_nodes: number;
  document_links: number;
}

export interface SeedResult {
  success: boolean;
  before: SeedCounts;
  after: SeedCounts;
  error?: string;
}

async function getCounts(tenantId: string): Promise<SeedCounts> {
  const [props, units, loans, finReqs, appProfiles, docs, nodes, links] = await Promise.all([
    supabase.from('properties').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('units').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('loans').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('finance_requests').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('applicant_profiles').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('documents').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('storage_nodes').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
    supabase.from('document_links').select('id', { count: 'exact', head: true }).eq('tenant_id', tenantId),
  ]);

  return {
    properties: props.count || 0,
    units: units.count || 0,
    loans: loans.count || 0,
    finance_requests: finReqs.count || 0,
    applicant_profiles: appProfiles.count || 0,
    documents: docs.count || 0,
    storage_nodes: nodes.count || 0,
    document_links: links.count || 0,
  };
}

export function useGoldenPathSeeds(tenantId: string | undefined) {
  const [isSeeding, setIsSeeding] = useState(false);
  const [lastResult, setLastResult] = useState<SeedResult | null>(null);

  const runSeeds = useCallback(async (): Promise<SeedResult> => {
    if (!tenantId) {
      return { success: false, before: {} as SeedCounts, after: {} as SeedCounts, error: 'No tenant ID' };
    }

    setIsSeeding(true);

    try {
      const before = await getCounts(tenantId);

      // ============ (A) PROPERTY + UNIT + LOAN ============
      
      // Upsert Property (MOD-04)
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

      // Upsert Unit
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

      // Upsert Loan
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

      // ============ (B) FINANCE REQUEST + APPLICANT PROFILE ============

      // Upsert Finance Request (MOD-07)
      const financeRequestData = {
        id: SEED_IDS.finance_request,
        tenant_id: tenantId,
        public_id: 'FIN-DEMO-2026-001',
        status: 'submitted',
        object_source: 'mod04_property',
        property_id: SEED_IDS.property,
      };

      await supabase.from('finance_requests').upsert([financeRequestData], { onConflict: 'id' });

      // Upsert Applicant Profile
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

      // Upsert Documents
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

      // Upsert Storage Nodes (Tree structure)
      const storageNodesData = [
        // Root folders with template_id for system behavior
        {
          id: SEED_IDS.node_inbox,
          tenant_id: tenantId,
          parent_id: null,
          name: 'Posteingang',
          node_type: 'folder',
          template_id: 'inbox',
        },
        {
          id: SEED_IDS.node_immobilien,
          tenant_id: tenantId,
          parent_id: null,
          name: 'Immobilien',
          node_type: 'folder',
          template_id: 'immobilien',
        },
        {
          id: SEED_IDS.node_finanzierung,
          tenant_id: tenantId,
          parent_id: null,
          name: 'Finanzierung',
          node_type: 'folder',
          template_id: 'finanzierung',
        },
        {
          id: SEED_IDS.node_bonitaet,
          tenant_id: tenantId,
          parent_id: null,
          name: 'Bonitätsunterlagen',
          node_type: 'folder',
          template_id: 'bonitaetsunterlagen',
        },
        // Property subfolder
        {
          id: SEED_IDS.node_immobilien_demo,
          tenant_id: tenantId,
          parent_id: SEED_IDS.node_immobilien,
          name: 'DEMO-001 Musterstraße 42',
          node_type: 'folder',
          property_id: SEED_IDS.property,
        },
        {
          id: SEED_IDS.node_immobilien_demo_expose,
          tenant_id: tenantId,
          parent_id: SEED_IDS.node_immobilien_demo,
          name: 'Exposé',
          node_type: 'folder',
          property_id: SEED_IDS.property,
        },
        {
          id: SEED_IDS.node_immobilien_demo_finanz,
          tenant_id: tenantId,
          parent_id: SEED_IDS.node_immobilien_demo,
          name: 'Finanzierung',
          node_type: 'folder',
          property_id: SEED_IDS.property,
        },
        // Finance request subfolder
        {
          id: SEED_IDS.node_finanzierung_demo,
          tenant_id: tenantId,
          parent_id: SEED_IDS.node_finanzierung,
          name: 'FIN-DEMO-2026-001 Unterlagen',
          node_type: 'folder',
        },
      ];

      for (const node of storageNodesData) {
        await supabase.from('storage_nodes').upsert([node], { onConflict: 'id' });
      }

      // ============ (D) DOCUMENT LINKS ============

      const documentLinksData = [
        // Exposé -> Property
        {
          id: SEED_IDS.link_expose_property,
          tenant_id: tenantId,
          document_id: SEED_IDS.doc_expose,
          node_id: SEED_IDS.node_immobilien_demo_expose,
          object_type: 'property',
          object_id: SEED_IDS.property,
        },
        // Darlehensvertrag -> Property (Finanzierung folder)
        {
          id: SEED_IDS.link_darlehen_property,
          tenant_id: tenantId,
          document_id: SEED_IDS.doc_darlehen,
          node_id: SEED_IDS.node_immobilien_demo_finanz,
          object_type: 'property',
          object_id: SEED_IDS.property,
        },
        // Ausweis -> finance_case (maps to finance request)
        {
          id: SEED_IDS.link_ausweis_finanz,
          tenant_id: tenantId,
          document_id: SEED_IDS.doc_ausweis,
          node_id: SEED_IDS.node_finanzierung_demo,
          object_type: 'finance_case',
          object_id: SEED_IDS.finance_request,
        },
        // Gehaltsnachweis -> finance_case
        {
          id: SEED_IDS.link_gehalt_finanz,
          tenant_id: tenantId,
          document_id: SEED_IDS.doc_gehalt,
          node_id: SEED_IDS.node_finanzierung_demo,
          object_type: 'finance_case',
          object_id: SEED_IDS.finance_request,
        },
        // Kontoauszug -> contact (applicant)
        {
          id: SEED_IDS.link_konto_finanz,
          tenant_id: tenantId,
          document_id: SEED_IDS.doc_konto,
          node_id: SEED_IDS.node_bonitaet,
          object_type: 'contact',
          object_id: SEED_IDS.applicant_profile,
        },
      ];

      for (const link of documentLinksData) {
        await supabase.from('document_links').upsert([link], { onConflict: 'id' });
      }

      const after = await getCounts(tenantId);

      const result: SeedResult = {
        success: true,
        before,
        after,
      };

      setLastResult(result);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const result: SeedResult = {
        success: false,
        before: {} as SeedCounts,
        after: {} as SeedCounts,
        error: errorMessage,
      };
      setLastResult(result);
      return result;
    } finally {
      setIsSeeding(false);
    }
  }, [tenantId]);

  return {
    runSeeds,
    isSeeding,
    lastResult,
  };
}

export { SEED_IDS };
