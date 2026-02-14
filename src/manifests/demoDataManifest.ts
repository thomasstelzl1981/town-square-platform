/**
 * Demo Data Manifest — SSOT für alle Golden Path Demo-Daten
 * 
 * Definiert pro Prozess: welcher Hook die Daten liefert, welche Zonen
 * betroffen sind und welche Dateien die Daten konsumieren.
 * 
 * Regeln:
 * - Rein clientseitig/synthetisch — keine DB-Einträge
 * - Toggle ON = Daten sichtbar, Toggle OFF = vollständig verschwunden
 * - Demo-IDs verwenden das Präfix `__demo__` oder `demo-` zur Collision-Vermeidung
 * - Jeder Consumer zeigt ein smaragdgrünes "DEMO"-Badge
 * - DB-Mutationen für Demo-IDs werden blockiert (UI-only)
 * 
 * @see src/docs/backlog-v6.2-demo-data-universal.json
 */

export type DemoZone = 1 | 2 | 3;
export type DemoMergeStrategy = 'prepend' | 'replace' | 'inject';
export type DemoScope = 'z2_only' | 'cross_zone' | 'manager';

export interface DemoConsumer {
  /** File path relative to project root */
  file: string;
  /** Zone this consumer lives in */
  zone: DemoZone;
  /** How the demo data is merged into existing data */
  mergeStrategy: DemoMergeStrategy;
  /** Brief description of what this consumer shows */
  description: string;
}

export interface DemoDataEntry {
  /** Golden Path Process ID, e.g. "GP-PORTFOLIO" */
  processId: string;
  /** Module code, e.g. "MOD-04" */
  moduleCode: string;
  /** The useDemoToggles key (same as processId) */
  toggleKey: string;
  /** Path to the hook file that provides the data */
  dataHookFile: string;
  /** Export name of the hook */
  dataHookExport: string;
  /** Entity types this demo covers */
  entities: readonly string[];
  /** Which zones are affected */
  zones: readonly DemoZone[];
  /** Scope classification */
  scope: DemoScope;
  /** Files that consume the demo data */
  consumers: readonly DemoConsumer[];
  /** Implementation status */
  status: 'done' | 'planned' | 'not_applicable';
}

// =============================================================================
// MANIFEST: All 15 Golden Path Demo Data Entries
// =============================================================================

export const DEMO_DATA_MANIFEST: readonly DemoDataEntry[] = [
  // ─── MOD-04: Immobilien ─────────────────────────────────
  {
    processId: 'GP-PORTFOLIO',
    moduleCode: 'MOD-04',
    toggleKey: 'GP-PORTFOLIO',
    dataHookFile: 'src/hooks/useDemoListings.ts',
    dataHookExport: 'useDemoListings',
    entities: ['property', 'listing', 'publication', 'mandate'],
    zones: [1, 2, 3],
    scope: 'cross_zone',
    consumers: [
      { file: 'src/pages/portal/immobilien/PortfolioTab.tsx', zone: 2, mergeStrategy: 'prepend', description: 'Demo-Properties im Portfolio-Grid' },
      { file: 'src/pages/portal/immobilien/PropertyDetailPage.tsx', zone: 2, mergeStrategy: 'replace', description: 'Demo-Guard + Badge auf Detailseite' },
      { file: 'src/components/portfolio/VerkaufsauftragTab.tsx', zone: 2, mergeStrategy: 'inject', description: 'isDemo-Prop, UI-only Switches' },
      { file: 'src/hooks/useSalesDeskListings.ts', zone: 1, mergeStrategy: 'prepend', description: 'Demo-Listings im Sales Desk' },
      { file: 'src/pages/admin/desks/SalesDesk.tsx', zone: 1, mergeStrategy: 'inject', description: 'Demo-Badge + Mutation-Guard' },
      { file: 'src/pages/zone3/kaufy2026/Kaufy2026Home.tsx', zone: 3, mergeStrategy: 'prepend', description: 'Demo-Listings auf Kaufy' },
      { file: 'src/pages/zone3/kaufy2026/Kaufy2026ExposeDetail.tsx', zone: 3, mergeStrategy: 'replace', description: 'Demo-Expose-Detailseite' },
      { file: 'src/pages/portal/vertriebspartner/KatalogTab.tsx', zone: 2, mergeStrategy: 'prepend', description: 'Demo-Listings im Katalog' },
    ],
    status: 'done',
  },
  {
    processId: 'GP-VERWALTUNG',
    moduleCode: 'MOD-04',
    toggleKey: 'GP-VERWALTUNG',
    dataHookFile: 'src/hooks/useDemoLocalEntity.ts',
    dataHookExport: 'useDemoLocalEntity',
    entities: ['rental_object', 'tenant', 'ancillary_costs'],
    zones: [2],
    scope: 'z2_only',
    consumers: [
      { file: 'src/pages/portal/immobilien/VerwaltungTab.tsx', zone: 2, mergeStrategy: 'inject', description: 'Demo-Guard für MFH Düsseldorf' },
    ],
    status: 'done',
  },
  {
    processId: 'GP-SANIERUNG',
    moduleCode: 'MOD-04',
    toggleKey: 'GP-SANIERUNG',
    dataHookFile: 'src/hooks/useDemoLocalEntity.ts',
    dataHookExport: 'useDemoLocalEntity',
    entities: ['sanierung_case', 'scope_items', 'contractors'],
    zones: [2],
    scope: 'z2_only',
    consumers: [
      { file: 'src/pages/portal/immobilien/SanierungTab.tsx', zone: 2, mergeStrategy: 'inject', description: 'Demo: Kernsanierung BER-01 Schadowstr.' },
    ],
    status: 'done',
  },

  // ─── MOD-07: Finanzierung ───────────────────────────────
  {
    processId: 'GP-FINANZIERUNG',
    moduleCode: 'MOD-07',
    toggleKey: 'GP-FINANZIERUNG',
    dataHookFile: 'src/hooks/useDemoFinanceCase.ts',
    dataHookExport: 'useDemoFinanceCase',
    entities: ['finance_request', 'applicant_profile', 'fm_case'],
    zones: [1, 2, 3],
    scope: 'cross_zone',
    consumers: [
      { file: 'src/components/finanzierung/FinanceRequestWidgets.tsx', zone: 2, mergeStrategy: 'prepend', description: 'Demo-Finanzierungsanfrage im Grid' },
      { file: 'src/pages/portal/finanzierungsmanager/FMDashboard.tsx', zone: 1, mergeStrategy: 'prepend', description: 'Demo-Fall im FM-Cockpit' },
    ],
    status: 'done',
  },

  // ─── MOD-08: Investment-Suche ───────────────────────────
  {
    processId: 'GP-SUCHMANDAT',
    moduleCode: 'MOD-08',
    toggleKey: 'GP-SUCHMANDAT',
    dataHookFile: 'src/hooks/useDemoAcquisition.ts',
    dataHookExport: 'useDemoAcquisition',
    entities: ['search_mandate', 'am_case', 'pipeline_offers'],
    zones: [1, 2],
    scope: 'cross_zone',
    consumers: [
      { file: 'src/pages/portal/investments/MandatTab.tsx', zone: 2, mergeStrategy: 'prepend', description: 'Demo-Suchmandat im Grid' },
      { file: 'src/pages/portal/akquise-manager/AkquiseMandate.tsx', zone: 1, mergeStrategy: 'prepend', description: 'Demo-Mandat im AM-Cockpit' },
    ],
    status: 'done',
  },
  {
    processId: 'GP-SIMULATION',
    moduleCode: 'MOD-08',
    toggleKey: 'GP-SIMULATION',
    dataHookFile: 'src/hooks/useDemoLocalEntity.ts',
    dataHookExport: 'useDemoLocalEntity',
    entities: ['simulation_scenario'],
    zones: [2],
    scope: 'z2_only',
    consumers: [
      { file: 'src/pages/portal/investments/SimulationTab.tsx', zone: 2, mergeStrategy: 'inject', description: 'Demo-Guard für Portfolio-Simulation' },
    ],
    status: 'done',
  },

  // ─── MOD-11: Finanzierungsmanager ───────────────────────
  {
    processId: 'GP-FM-FALL',
    moduleCode: 'MOD-11',
    toggleKey: 'GP-FM-FALL',
    dataHookFile: 'src/hooks/useDemoLocalEntity.ts',
    dataHookExport: 'useDemoLocalEntity',
    entities: ['fm_case', 'fm_documents', 'bank_assignment'],
    zones: [2],
    scope: 'manager',
    consumers: [
      { file: 'src/pages/portal/finanzierungsmanager/FMDashboard.tsx', zone: 2, mergeStrategy: 'inject', description: 'Demo-Akte Max Muster im FM-Dashboard' },
    ],
    status: 'done',
  },

  // ─── MOD-12: Akquise Manager ────────────────────────────
  {
    processId: 'GP-AKQUISE-MANDAT',
    moduleCode: 'MOD-12',
    toggleKey: 'GP-AKQUISE-MANDAT',
    dataHookFile: 'src/hooks/useDemoLocalEntity.ts',
    dataHookExport: 'useDemoLocalEntity',
    entities: ['acq_mandate', 'acq_pipeline', 'acq_outreach'],
    zones: [2],
    scope: 'manager',
    consumers: [
      { file: 'src/pages/portal/akquise-manager/AkquiseMandate.tsx', zone: 2, mergeStrategy: 'inject', description: 'Demo-Akte MFH Rheinland im AM-Dashboard' },
    ],
    status: 'done',
  },

  // ─── MOD-13: Projekte ───────────────────────────────────
  {
    processId: 'GP-PROJEKT',
    moduleCode: 'MOD-13',
    toggleKey: 'GP-PROJEKT',
    dataHookFile: 'src/hooks/useDemoListings.ts',
    dataHookExport: 'useDemoListings',
    entities: ['project', 'project_units', 'project_listing'],
    zones: [1, 2, 3],
    scope: 'cross_zone',
    consumers: [
      { file: 'src/pages/portal/projekte/ProjekteDashboard.tsx', zone: 2, mergeStrategy: 'prepend', description: 'Demo-Projekt im Grid' },
      { file: 'src/pages/admin/desks/SalesDesk.tsx', zone: 1, mergeStrategy: 'prepend', description: 'Demo-Projekt-Listing im Sales Desk' },
      { file: 'src/pages/zone3/kaufy2026/Kaufy2026Home.tsx', zone: 3, mergeStrategy: 'prepend', description: 'Demo-Projekt auf Kaufy' },
      { file: 'src/pages/portal/vertriebspartner/KatalogTab.tsx', zone: 2, mergeStrategy: 'prepend', description: 'Demo-Projekt im Katalog' },
    ],
    status: 'done',
  },

  // ─── MOD-14: Communication Pro ──────────────────────────
  {
    processId: 'GP-SERIEN-EMAIL',
    moduleCode: 'MOD-14',
    toggleKey: 'GP-SERIEN-EMAIL',
    dataHookFile: 'src/hooks/useDemoLocalEntity.ts',
    dataHookExport: 'useDemoLocalEntity',
    entities: ['email_sequence', 'sequence_steps', 'enrollments'],
    zones: [2],
    scope: 'z2_only',
    consumers: [
      { file: 'src/pages/portal/communication-pro/SerienEmailsPage.tsx', zone: 2, mergeStrategy: 'inject', description: 'Demo-Guard für Willkommens-Sequenz' },
    ],
    status: 'done',
  },
  {
    processId: 'GP-RECHERCHE',
    moduleCode: 'MOD-14',
    toggleKey: 'GP-RECHERCHE',
    dataHookFile: 'src/hooks/useDemoLocalEntity.ts',
    dataHookExport: 'useDemoLocalEntity',
    entities: ['research_job', 'research_candidates'],
    zones: [2],
    scope: 'z2_only',
    consumers: [
      { file: 'src/pages/portal/communication-pro/ResearchTab.tsx', zone: 2, mergeStrategy: 'inject', description: 'Demo-Guard für Hausverwaltungen NRW' },
    ],
    status: 'done',
  },

  // ─── MOD-17: Cars & Assets ──────────────────────────────
  {
    processId: 'GP-FAHRZEUG',
    moduleCode: 'MOD-17',
    toggleKey: 'GP-FAHRZEUG',
    dataHookFile: 'src/hooks/useDemoLocalEntity.ts',
    dataHookExport: 'useDemoLocalEntity',
    entities: ['vehicle', 'leasing_contract', 'insurance'],
    zones: [2],
    scope: 'z2_only',
    consumers: [
      { file: 'src/components/portal/cars/CarsFahrzeuge.tsx', zone: 2, mergeStrategy: 'inject', description: 'Demo-Guard für BMW M4' },
    ],
    status: 'done',
  },

  // ─── MOD-19: Photovoltaik ──────────────────────────────
  {
    processId: 'GP-PV-ANLAGE',
    moduleCode: 'MOD-19',
    toggleKey: 'GP-PV-ANLAGE',
    dataHookFile: 'src/hooks/useDemoLocalEntity.ts',
    dataHookExport: 'useDemoLocalEntity',
    entities: ['pv_system', 'yield_data', 'monitoring'],
    zones: [2],
    scope: 'z2_only',
    consumers: [
      { file: 'src/pages/portal/photovoltaik/AnlagenTab.tsx', zone: 2, mergeStrategy: 'inject', description: 'Demo-Guard für SMA 9.8 kWp' },
    ],
    status: 'done',
  },

  // ─── MOD-05: Website Builder (ehemals MOD-21) ───────────────────
  {
    processId: 'GP-WEBSITE',
    moduleCode: 'MOD-05',
    toggleKey: 'GP-WEBSITE',
    dataHookFile: 'src/hooks/useDemoLocalEntity.ts',
    dataHookExport: 'useDemoLocalEntity',
    entities: ['website_order', 'design_config', 'seo_config'],
    zones: [2],
    scope: 'z2_only',
    consumers: [
      { file: 'src/pages/portal/WebsiteBuilderPage.tsx', zone: 2, mergeStrategy: 'inject', description: 'Demo-Guard für Muster GmbH' },
    ],
    status: 'done',
  },
] as const;

// =============================================================================
// HELPERS
// =============================================================================

/** Get manifest entry by process ID */
export function getDemoEntry(processId: string): DemoDataEntry | undefined {
  return DEMO_DATA_MANIFEST.find(e => e.processId === processId);
}

/** Get all entries for a given module */
export function getDemoEntriesByModule(moduleCode: string): DemoDataEntry[] {
  return DEMO_DATA_MANIFEST.filter(e => e.moduleCode === moduleCode);
}

/** Get all cross-zone entries */
export function getCrossZoneEntries(): DemoDataEntry[] {
  return DEMO_DATA_MANIFEST.filter(e => e.scope === 'cross_zone');
}

/** Get all entries that are not yet implemented */
export function getPlannedEntries(): DemoDataEntry[] {
  return DEMO_DATA_MANIFEST.filter(e => e.status === 'planned');
}

/** Summary counts */
export const DEMO_MANIFEST_STATS = {
  total: DEMO_DATA_MANIFEST.length,
  done: DEMO_DATA_MANIFEST.filter(e => e.status === 'done').length,
  planned: DEMO_DATA_MANIFEST.filter(e => e.status === 'planned').length,
  crossZone: DEMO_DATA_MANIFEST.filter(e => e.scope === 'cross_zone').length,
  z2Only: DEMO_DATA_MANIFEST.filter(e => e.scope === 'z2_only').length,
  manager: DEMO_DATA_MANIFEST.filter(e => e.scope === 'manager').length,
} as const;
