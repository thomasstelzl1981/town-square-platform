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
] as const;

/** Total count of registered demo data sources */
export const DEMO_DATA_COUNT = DEMO_DATA_SOURCES.length;
