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
  {
    path: 'src/components/projekte/demoProjectData.ts',
    module: 'MOD-13',
    type: 'hardcoded',
    entities: ['project', 'units', 'developer', 'images'],
    exports: ['DEMO_PROJECT', 'DEMO_UNITS', 'DEMO_UNIT_DETAIL', 'DEMO_PROJECT_DESCRIPTION', 'DEMO_DEVELOPER_CONTEXT', 'DEMO_PROJECT_IMAGES'],
  },
  {
    path: 'src/components/portal/cars/CarsAngebote.tsx',
    module: 'MOD-17',
    type: 'hardcoded',
    entities: ['leasing_offers', 'rental_offers'],
    exports: ['DEMO_LEASING_OFFERS', 'DEMO_RENTAL_OFFERS'],
  },
  {
    path: 'src/pages/portal/communication-pro/recherche/ResearchCandidatesTray.tsx',
    module: 'MOD-16',
    type: 'hardcoded',
    entities: ['candidates'],
    exports: ['DEMO_CANDIDATES'],
  },
  {
    path: 'src/hooks/useFinanceData.ts',
    module: 'MOD-06',
    type: 'fallback',
    entities: ['markets'],
    exports: ['DEMO_MARKETS'],
  },
  {
    path: 'src/hooks/useNewsData.ts',
    module: 'MOD-06',
    type: 'fallback',
    entities: ['headlines'],
    exports: ['DEMO_HEADLINES'],
  },
  {
    path: 'src/hooks/useGoldenPathSeeds.ts',
    module: 'SYSTEM',
    type: 'seed_rpc',
    entities: ['properties', 'units', 'contacts', 'documents', 'leases', 'loans', 'landlord_contexts', 'applicant_profiles'],
    exports: ['SEED_IDS', 'ALL_MODULES'],
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
  {
    path: 'src/engines/demoData/data.ts',
    module: 'SYSTEM',
    type: 'hardcoded',
    entities: ['persona', 'insurance_contracts', 'vorsorge_contracts', 'subscriptions', 'kv_contracts', 'portfolio_refs'],
    exports: ['DEMO_FAMILY', 'DEMO_INSURANCES', 'DEMO_VORSORGE', 'DEMO_SUBSCRIPTIONS', 'DEMO_KV_CONTRACTS', 'DEMO_PORTFOLIO', 'ALL_DEMO_IDS'],
  },
  {
    path: 'src/components/portal/cars/CarsAutos.tsx',
    module: 'MOD-17',
    type: 'hardcoded',
    entities: ['vehicles', 'vehicle_insurances', 'trips'],
    exports: ['DEMO_VEHICLES', 'DEMO_INSURANCES', 'DEMO_TRIPS'],
  },
  {
    path: 'src/components/portal/cars/CarsBikes.tsx',
    module: 'MOD-17',
    type: 'hardcoded',
    entities: ['bikes'],
    exports: ['DEMO_BIKES'],
  },
  {
    path: 'src/components/portal/cars/CarsFahrzeuge.tsx',
    module: 'MOD-17',
    type: 'hardcoded',
    entities: ['vehicles', 'trips'],
    exports: ['DEMO_VEHICLES', 'DEMO_TRIPS'],
  },
  {
    path: 'src/components/projekte/landing-page/LandingPageLegalTab.tsx',
    module: 'MOD-13',
    type: 'hardcoded',
    entities: ['project_documents'],
    exports: ['DEMO_DOCUMENTS'],
  },
  {
    path: 'src/pages/zone3/kaufy2026/Kaufy2026Verkaeufer.tsx',
    module: 'MOD-13',
    type: 'hardcoded',
    entities: ['project'],
    exports: ['DEMO_PROJECT'],
  },
  {
    path: 'src/pages/portal/immobilien/SanierungTab.tsx',
    module: 'MOD-04',
    type: 'hardcoded',
    entities: ['sanierung_scope', 'sanierung_providers'],
    exports: ['DEMO_SCOPE_ITEMS', 'DEMO_PROVIDERS'],
  },
  {
    path: 'src/pages/portal/photovoltaik/AnlagenTab.tsx',
    module: 'MOD-19',
    type: 'hardcoded',
    entities: ['pv_plant'],
    exports: ['DEMO_PLANT'],
  },
  {
    path: 'src/pages/portal/communication-pro/recherche/ResearchDemoSimulation.tsx',
    module: 'MOD-14',
    type: 'hardcoded',
    entities: ['research_contacts'],
    exports: ['DEMO_CONTACTS'],
  },
  {
    path: 'src/pages/portal/communication-pro/recherche/ResearchDemoResultsTable.tsx',
    module: 'MOD-14',
    type: 'hardcoded',
    entities: ['research_results'],
    exports: ['DEMO_RESULTS'],
  },
  {
    path: 'src/pages/portal/projekte/LandingPageTab.tsx',
    module: 'MOD-13',
    type: 'hardcoded',
    entities: ['landing_page'],
    exports: ['DEMO_LANDING_PAGE'],
  },
  {
    path: 'src/hooks/useDemoDepot.ts',
    module: 'MOD-18',
    type: 'hardcoded',
    entities: ['depot_positions', 'depot_transactions', 'tax_report'],
    exports: ['DEMO_POSITIONS', 'DEMO_TRANSACTIONS', 'DEMO_TAX_REPORT'],
  },
] as const;

/** Total count of registered demo data sources */
export const DEMO_DATA_COUNT = DEMO_DATA_SOURCES.length;
