/**
 * Demo Data Registry — Central inventory of all inline demo/mock data
 * 
 * Every hardcoded demo dataset in the codebase MUST be registered here.
 * Used by architectureValidator to verify completeness.
 * 
 * @see spec/current/08_data_provenance/DPR_V1.md
 */

export interface DemoDataSource {
  /** File path relative to project root */
  path: string;
  /** Module code (MOD-XX or SYSTEM) */
  module: string;
  /** 'hardcoded' = always inline, 'fallback' = only when API fails, 'seed_rpc' = DB seeder */
  type: 'hardcoded' | 'fallback' | 'seed_rpc';
  /** Entity types contained */
  entities: readonly string[];
  /** Constant name(s) exported */
  exports: readonly string[];
}

/** @demo-data */
export const DEMO_DATA_SOURCES: readonly DemoDataSource[] = [
  // ─── SSOT CSV-Dateien (Phase 1: Realistic Seeding) ─────────
  {
    path: 'public/demo-data/demo_properties.csv',
    module: 'MOD-04',
    type: 'hardcoded',
    entities: ['properties'],
    exports: ['CSV'],
  },
  {
    path: 'public/demo-data/demo_units.csv',
    module: 'MOD-04',
    type: 'hardcoded',
    entities: ['units'],
    exports: ['CSV'],
  },
  {
    path: 'public/demo-data/demo_contacts.csv',
    module: 'MOD-01',
    type: 'hardcoded',
    entities: ['contacts'],
    exports: ['CSV'],
  },
  {
    path: 'public/demo-data/demo_leases.csv',
    module: 'MOD-04',
    type: 'hardcoded',
    entities: ['leases'],
    exports: ['CSV'],
  },
  {
    path: 'public/demo-data/demo_loans.csv',
    module: 'MOD-04',
    type: 'hardcoded',
    entities: ['loans'],
    exports: ['CSV'],
  },
  {
    path: 'public/demo-data/demo_bank_accounts.csv',
    module: 'MOD-18',
    type: 'hardcoded',
    entities: ['bank_accounts'],
    exports: ['CSV'],
  },
  {
    path: 'public/demo-data/demo_bank_transactions.csv',
    module: 'MOD-18',
    type: 'hardcoded',
    entities: ['bank_transactions'],
    exports: ['CSV'],
  },
  {
    path: 'public/demo-data/demo_manifest.json',
    module: 'SYSTEM',
    type: 'hardcoded',
    entities: ['manifest'],
    exports: ['JSON'],
  },
  {
    path: 'public/demo-data/demo_property_features.csv',
    module: 'MOD-04',
    type: 'hardcoded',
    entities: ['property_features'],
    exports: ['CSV'],
  },
  {
    path: 'public/demo-data/demo_listings.csv',
    module: 'MOD-06',
    type: 'hardcoded',
    entities: ['listings'],
    exports: ['CSV'],
  },
  {
    path: 'public/demo-data/demo_listing_publications.csv',
    module: 'MOD-06',
    type: 'hardcoded',
    entities: ['listing_publications'],
    exports: ['CSV'],
  },
  {
    path: 'public/demo-data/demo_finance_requests.csv',
    module: 'MOD-07',
    type: 'hardcoded',
    entities: ['finance_requests'],
    exports: ['CSV'],
  },
  {
    path: 'public/demo-data/demo_applicant_profiles.csv',
    module: 'MOD-07',
    type: 'hardcoded',
    entities: ['applicant_profiles'],
    exports: ['CSV'],
  },
  {
    path: 'public/demo-data/demo_finance_mandates.csv',
    module: 'MOD-11',
    type: 'hardcoded',
    entities: ['finance_mandates'],
    exports: ['CSV'],
  },
  {
    path: 'public/demo-data/demo_pet_providers.csv',
    module: 'MOD-22',
    type: 'hardcoded',
    entities: ['pet_providers'],
    exports: ['CSV'],
  },
  {
    path: 'public/demo-data/demo_pet_services.csv',
    module: 'MOD-22',
    type: 'hardcoded',
    entities: ['pet_services'],
    exports: ['CSV'],
  },
  {
    path: 'public/demo-data/demo_miety_homes.csv',
    module: 'MOD-20',
    type: 'hardcoded',
    entities: ['miety_homes'],
    exports: ['CSV'],
  },
  {
    path: 'public/demo-data/demo_miety_contracts.csv',
    module: 'MOD-20',
    type: 'hardcoded',
    entities: ['miety_contracts'],
    exports: ['CSV'],
  },
  {
    path: 'public/demo-data/demo_household_persons.csv',
    module: 'MOD-01',
    type: 'hardcoded',
    entities: ['household_persons'],
    exports: ['CSV'],
  },
  {
    path: 'public/demo-data/demo_vehicles.csv',
    module: 'MOD-17',
    type: 'hardcoded',
    entities: ['vehicles'],
    exports: ['CSV'],
  },
  {
    path: 'public/demo-data/demo_pv_plants.csv',
    module: 'MOD-19',
    type: 'hardcoded',
    entities: ['pv_plants'],
    exports: ['CSV'],
  },
  {
    path: 'public/demo-data/demo_vorsorge_contracts.csv',
    module: 'MOD-18',
    type: 'hardcoded',
    entities: ['vorsorge_contracts'],
    exports: ['CSV'],
  },
  {
    path: 'public/demo-data/demo_private_loans.csv',
    module: 'MOD-18',
    type: 'hardcoded',
    entities: ['private_loans'],
    exports: ['CSV'],
  },
  {
    path: 'public/demo-data/demo_user_subscriptions.csv',
    module: 'MOD-18',
    type: 'hardcoded',
    entities: ['user_subscriptions'],
    exports: ['CSV'],
  },
  {
    path: 'public/demo-data/demo_pension_records.csv',
    module: 'MOD-18',
    type: 'hardcoded',
    entities: ['pension_records'],
    exports: ['CSV'],
  },
  {
    path: 'public/demo-data/demo_acq_offers.csv',
    module: 'MOD-12',
    type: 'hardcoded',
    entities: ['acq_offers'],
    exports: ['CSV'],
  },
  {
    path: 'public/demo-data/demo_pet_bookings.csv',
    module: 'MOD-22',
    type: 'hardcoded',
    entities: ['pet_bookings'],
    exports: ['CSV'],
  },
  {
    path: 'public/demo-data/demo_pet_customers.csv',
    module: 'MOD-22',
    type: 'hardcoded',
    entities: ['pet_customers'],
    exports: ['CSV'],
  },
  {
    path: 'public/demo-data/demo_pet_z1_customers.csv',
    module: 'MOD-22',
    type: 'hardcoded',
    entities: ['pet_z1_customers'],
    exports: ['CSV'],
  },
  {
    path: 'public/demo-data/demo_profile.csv',
    module: 'MOD-01',
    type: 'hardcoded',
    entities: ['profile'],
    exports: ['CSV'],
  },
  // ─── Armstrong Knowledge Base CSVs ─────────────────────────
  {
    path: 'public/demo-data/demo_kb_vehicles.csv',
    module: 'MOD-17',
    type: 'hardcoded',
    entities: ['kb_vehicles'],
    exports: ['CSV'],
  },
  {
    path: 'public/demo-data/demo_kb_pet_services.csv',
    module: 'MOD-22',
    type: 'hardcoded',
    entities: ['kb_pet_services'],
    exports: ['CSV'],
  },
  {
    path: 'public/demo-data/demo_kb_education.csv',
    module: 'MOD-15',
    type: 'hardcoded',
    entities: ['kb_education'],
    exports: ['CSV'],
  },
  {
    path: 'public/demo-data/demo_kb_tenant_rights.csv',
    module: 'MOD-20',
    type: 'hardcoded',
    entities: ['kb_tenant_rights'],
    exports: ['CSV'],
  },
  {
    path: 'public/demo-data/demo_kb_photovoltaik_extended.csv',
    module: 'MOD-19',
    type: 'hardcoded',
    entities: ['kb_photovoltaik'],
    exports: ['CSV'],
  },
  {
    path: 'public/demo-data/demo_kb_ncore.csv',
    module: 'ZONE3',
    type: 'hardcoded',
    entities: ['kb_ncore'],
    exports: ['CSV'],
  },
  {
    path: 'public/demo-data/demo_kb_otto_advisory.csv',
    module: 'ZONE3',
    type: 'hardcoded',
    entities: ['kb_otto_advisory'],
    exports: ['CSV'],
  },
  // ─── Seed Engine (Phase 2) ─────────────────────────────────
  {
    path: 'src/hooks/useDemoSeedEngine.ts',
    module: 'SYSTEM',
    type: 'seed_rpc',
    entities: ['properties', 'units', 'contacts', 'leases', 'loans'],
    exports: ['seedDemoData', 'isDemoSeeded'],
  },
  {
    path: 'src/hooks/useDemoCleanup.ts',
    module: 'SYSTEM',
    type: 'seed_rpc',
    entities: ['cleanup'],
    exports: ['cleanupDemoData'],
  },
  // ─── Legacy (to be deprecated) ─────────────────────────────
  {
    path: 'src/hooks/useGoldenPathSeeds.ts',
    module: 'SYSTEM',
    type: 'seed_rpc',
    entities: ['properties', 'units', 'contacts', 'documents', 'leases', 'loans', 'landlord_contexts', 'applicant_profiles'],
    exports: ['SEED_IDS', 'ALL_MODULES'],
  },
  {
    path: 'src/engines/demoData/data.ts',
    module: 'SYSTEM',
    type: 'hardcoded',
    entities: ['persona', 'insurance_contracts', 'vorsorge_contracts', 'subscriptions', 'kv_contracts', 'portfolio_refs'],
    exports: ['DEMO_FAMILY', 'DEMO_INSURANCES', 'DEMO_VORSORGE', 'DEMO_SUBSCRIPTIONS', 'DEMO_KV_CONTRACTS', 'DEMO_PORTFOLIO', 'ALL_DEMO_IDS'],
  },
  {
    path: 'src/constants/demoKontoData.ts',
    module: 'MOD-18',
    type: 'hardcoded',
    entities: ['bank_accounts', 'bank_transactions'],
    exports: ['DEMO_KONTO', 'DEMO_TRANSACTIONS', 'buildDemoTransactions'],
  },
  {
    path: 'src/engines/demoData/demoPropertyData.ts',
    module: 'MOD-04',
    type: 'hardcoded',
    entities: ['property_accounting'],
    exports: ['DEMO_PROPERTY_ACCOUNTING', 'getDemoPropertyAccounting'],
  },
  {
    path: 'src/hooks/useDemoListings.ts',
    module: 'MOD-04',
    type: 'hardcoded',
    entities: ['listings', 'publications', 'mandates', 'project_listings'],
    exports: ['useDemoListings', 'isDemoListingId', 'DEMO_LISTING_PREFIX'],
  },
  {
    path: 'src/hooks/useDemoLocalEntity.ts',
    module: 'SYSTEM',
    type: 'hardcoded',
    entities: ['generic_demo_guard'],
    exports: ['useDemoLocalEntity', 'isDemoEntityId'],
  },
  {
    path: 'src/hooks/useDemoFinanceCase.ts',
    module: 'MOD-07',
    type: 'hardcoded',
    entities: ['finance_requests', 'fm_cases'],
    exports: ['useDemoFinanceCase', 'isDemoFinanceId'],
  },
  {
    path: 'src/hooks/useDemoAcquisition.ts',
    module: 'MOD-08',
    type: 'hardcoded',
    entities: ['search_mandates', 'am_cases'],
    exports: ['useDemoAcquisition', 'isDemoAcquisitionId'],
  },
  {
    path: 'src/manifests/demoDataManifest.ts',
    module: 'SYSTEM',
    type: 'hardcoded',
    entities: ['manifest_entries'],
    exports: ['DEMO_DATA_MANIFEST', 'getDemoEntry', 'DEMO_MANIFEST_STATS'],
  },
] as const;

/** Total count of registered demo data sources */
export const DEMO_DATA_COUNT = DEMO_DATA_SOURCES.length;
