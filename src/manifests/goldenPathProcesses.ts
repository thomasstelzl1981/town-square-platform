/**
 * Golden Path Process Registry — SSOT für alle Prozess-Seiten
 * 
 * DESIGN MANIFEST V4.0 KONFORMITÄT:
 * Jeder Prozess MUSS folgendes Layout einhalten:
 * - PageShell → ModulePageHeader (TYPOGRAPHY.PAGE_TITLE)
 * - WidgetGrid (WIDGET_GRID.FULL, max 4 cols) mit WidgetCell (WIDGET_CELL.DIMENSIONS)
 * - Demo-Widget an Position 0 (ID: __demo__, Badge: bg-primary/10 text-primary)
 * - Inline-Detail-Flow (SPACING.SECTION, CARD.CONTENT, FORM_GRID.FULL)
 * - Kein Tab-Wechsel, kein Sub-Routing — alles vertikal scrollbar
 */

export interface GoldenPathDemoWidget {
  id: '__demo__';
  title: string;
  subtitle: string;
  status: 'demo';
  badgeLabel: string;
  /** Prozess-spezifische Demo-Daten (clientseitig, kein DB-Speichern) */
  data: Record<string, unknown>;
  /** Bei Schließen/Wechsel: Reset auf diesen Standard */
  resetOnClose: true;
}

export interface GoldenPathSection {
  id: string;
  title: string;
  component: string;
  readOnlyInDemo: boolean;
}

export interface GoldenPathCompliance {
  modulePageHeader: boolean;
  widgetGrid: boolean;
  widgetCell: boolean;
  demoWidget: boolean;
  inlineFlow: boolean;
  noSubNavigation: boolean;
}

export interface GoldenPathProcess {
  /** Eindeutige Prozess-ID, z.B. "GP-PORTFOLIO" */
  id: string;
  /** Modul-Code, z.B. "MOD-04" */
  moduleCode: string;
  /** Anzeigename des Moduls */
  moduleName: string;
  /** Route-Pfad zum Prozess */
  tilePath: string;
  /** Fachlicher Prozessname */
  processName: string;
  /** Kurzbeschreibung */
  description: string;
  /** Anzahl beteiligter Menüpunkte (1 oder 2) */
  menuPoints: 1 | 2;
  /** Beteiligte Pfade */
  menuPointPaths: string[];
  /** Compliance-Status gemäß Design Manifest V4.0 */
  compliance: GoldenPathCompliance;
  /** Demo-Widget-Konfiguration */
  demoWidget: GoldenPathDemoWidget;
  /** Sektionen des Inline-Flows */
  sections: GoldenPathSection[];
  /** Implementierungsphase */
  phase: '1' | '2A' | '2B' | '2C' | '3' | 'done';
}

// =============================================================================
// REGISTRY: Alle 15 Golden Path Prozesse
// =============================================================================

export const GOLDEN_PATH_PROCESSES: GoldenPathProcess[] = [
  // ─── MOD-04: Immobilien ─────────────────────────────────
  {
    id: 'GP-PORTFOLIO',
    moduleCode: 'MOD-04',
    moduleName: 'Immobilien',
    tilePath: '/portal/immobilien/portfolio',
    processName: 'Immobilien-Portfolio',
    description: 'Vermietereinheiten verwalten und Portfoliokennzahlen überwachen.',
    menuPoints: 1,
    menuPointPaths: ['/portal/immobilien/portfolio'],
    compliance: {
      modulePageHeader: true,
      widgetGrid: true,
      widgetCell: true,
      demoWidget: true,
      inlineFlow: true,
      noSubNavigation: true,
    },
    demoWidget: {
      id: '__demo__',
      title: 'Demo: Vermietereinheit Berlin',
      subtitle: 'Beispiel-Portfolio mit 3 Einheiten',
      status: 'demo',
      badgeLabel: 'Demo',
      data: {
        units: 3,
        marketValue: 850000,
        remainingDebt: 520000,
        netAssetValue: 330000,
        netRentMonthly: 2800,
      },
      resetOnClose: true,
    },
    sections: [
      { id: 'kpi', title: 'Portfoliokennzahlen', component: 'PortfolioKPIs', readOnlyInDemo: true },
      { id: 'units', title: 'Einheiten', component: 'PortfolioUnits', readOnlyInDemo: true },
    ],
    phase: 'done',
  },
  {
    id: 'GP-VERWALTUNG',
    moduleCode: 'MOD-04',
    moduleName: 'Immobilien',
    tilePath: '/portal/immobilien/verwaltung',
    processName: 'Mietverwaltung',
    description: 'Mietobjekte, Mieter und Nebenkostenabrechnungen verwalten.',
    menuPoints: 1,
    menuPointPaths: ['/portal/immobilien/verwaltung'],
    compliance: {
      modulePageHeader: true,
      widgetGrid: true,
      widgetCell: true,
      demoWidget: true,
      inlineFlow: true,
      noSubNavigation: true,
    },
    demoWidget: {
      id: '__demo__',
      title: 'Demo: MFH Düsseldorf',
      subtitle: 'Mietverwaltung mit 6 Einheiten',
      status: 'demo',
      badgeLabel: 'Demo',
      data: {
        address: 'Königsallee 42, 40212 Düsseldorf',
        units: 6,
        occupancyRate: 0.83,
        monthlyRent: 4200,
      },
      resetOnClose: true,
    },
    sections: [
      { id: 'tenants', title: 'Mieterübersicht', component: 'TenantList', readOnlyInDemo: true },
      { id: 'costs', title: 'Nebenkosten', component: 'AncillaryCosts', readOnlyInDemo: true },
    ],
    phase: 'done',
  },
  {
    id: 'GP-SANIERUNG',
    moduleCode: 'MOD-04',
    moduleName: 'Immobilien',
    tilePath: '/portal/immobilien/sanierung',
    processName: 'Sanierungsauftrag',
    description: 'Sanierungsprojekte anlegen, Leistungsverzeichnisse erstellen und Dienstleister beauftragen.',
    menuPoints: 1,
    menuPointPaths: ['/portal/immobilien/sanierung'],
    compliance: {
      modulePageHeader: true,
      widgetGrid: true,
      widgetCell: true,
      demoWidget: true,
      inlineFlow: true,
      noSubNavigation: true,
    },
    demoWidget: {
      id: '__demo__',
      title: 'Demo: Kernsanierung BER-01',
      subtitle: 'Schadowstr., Berlin — Böden und Bäder, mittlerer Standard',
      status: 'demo',
      badgeLabel: 'Demo',
      data: {
        propertyAddress: 'Schadowstr., 10117 Berlin',
        totalBudget: 22500,
        positionsCount: 5,
        offersReceived: 2,
        status: 'in_progress',
      },
      resetOnClose: true,
    },
    sections: [
      { id: 'scope', title: 'Leistungsumfang', component: 'SanierungScope', readOnlyInDemo: false },
      { id: 'costs', title: 'Kostenschätzung', component: 'SanierungCosts', readOnlyInDemo: false },
      { id: 'contractors', title: 'Dienstleister', component: 'SanierungContractors', readOnlyInDemo: false },
    ],
    phase: 'done',
  },

  // ─── MOD-07: Finanzierung ───────────────────────────────
  {
    id: 'GP-FINANZIERUNG',
    moduleCode: 'MOD-07',
    moduleName: 'Finanzierung',
    tilePath: '/portal/finanzierung/anfrage',
    processName: 'Finanzierungsanfrage',
    description: 'Immobilienfinanzierung vorbereiten, Selbstauskunft ausfüllen und bei FutureRoom einreichen.',
    menuPoints: 2,
    menuPointPaths: ['/portal/finanzierung/anfrage', '/portal/finanzierung/status'],
    compliance: {
      modulePageHeader: true,
      widgetGrid: true,
      widgetCell: true,
      demoWidget: true,
      inlineFlow: true,
      noSubNavigation: true,
    },
    demoWidget: {
      id: '__demo__',
      title: 'Demo: ETW Düsseldorf',
      subtitle: 'Beispiel-Finanzierung mit vollständiger Kalkulation',
      status: 'demo',
      badgeLabel: 'Demo',
      data: {
        purchasePrice: 320000,
        loanAmount: 280000,
        interestRate: 3.2,
        fixedRateYears: 10,
        monthlyRate: 1200,
      },
      resetOnClose: true,
    },
    sections: [
      { id: 'object', title: 'Objektdaten', component: 'FinanceObjectSection', readOnlyInDemo: false },
      { id: 'calculation', title: 'Kalkulation', component: 'FinanceCalculation', readOnlyInDemo: false },
      { id: 'documents', title: 'Dokumente', component: 'FinanceDocuments', readOnlyInDemo: true },
    ],
    phase: 'done',
  },

  // ─── MOD-08: Investment-Suche ───────────────────────────
  {
    id: 'GP-SUCHMANDAT',
    moduleCode: 'MOD-08',
    moduleName: 'Investment-Suche',
    tilePath: '/portal/investments/mandat',
    processName: 'Investment-Suchmandat',
    description: 'Suchmandat für die professionelle Immobilienakquise anlegen.',
    menuPoints: 1,
    menuPointPaths: ['/portal/investments/mandat'],
    compliance: {
      modulePageHeader: true,
      widgetGrid: true,
      widgetCell: true,
      demoWidget: true,
      inlineFlow: true,
      noSubNavigation: true,
    },
    demoWidget: {
      id: '__demo__',
      title: 'Demo: MFH NRW ab 1 Mio',
      subtitle: 'Beispiel-Suchmandat mit Profil und Ergebnissen',
      status: 'demo',
      badgeLabel: 'Demo',
      data: {
        assetType: 'MFH',
        region: 'NRW',
        budgetMin: 1000000,
        budgetMax: 3000000,
        yieldTarget: 5.0,
      },
      resetOnClose: true,
    },
    sections: [
      { id: 'profile', title: 'Suchprofil', component: 'MandatProfile', readOnlyInDemo: false },
      { id: 'results', title: 'Ergebnisse', component: 'MandatResults', readOnlyInDemo: true },
    ],
    phase: 'done',
  },
  {
    id: 'GP-SIMULATION',
    moduleCode: 'MOD-08',
    moduleName: 'Investment-Suche',
    tilePath: '/portal/investments/simulation',
    processName: 'Investment-Simulation',
    description: 'Eigenes Investment-Portfolio simulieren und Szenarien durchspielen.',
    menuPoints: 1,
    menuPointPaths: ['/portal/investments/simulation'],
    compliance: {
      modulePageHeader: true,
      widgetGrid: false,
      widgetCell: false,
      demoWidget: true,
      inlineFlow: true,
      noSubNavigation: true,
    },
    demoWidget: {
      id: '__demo__',
      title: 'Demo: Portfolio-Simulation',
      subtitle: 'Beispiel-Szenario mit 3 Objekten über 40 Jahre',
      status: 'demo',
      badgeLabel: 'Demo',
      data: {
        objectCount: 3,
        totalInvestment: 950000,
        equity: 200000,
        projectedReturn40y: 2800000,
      },
      resetOnClose: true,
    },
    sections: [
      { id: 'engine', title: 'Investment Engine', component: 'SimulationEngine', readOnlyInDemo: false },
      { id: 'results', title: '40-Jahres-Projektion', component: 'SimulationResults', readOnlyInDemo: false },
    ],
    phase: 'done',
  },

  // ─── MOD-11: Finanzierungsmanager ───────────────────────
  {
    id: 'GP-FM-FALL',
    moduleCode: 'MOD-11',
    moduleName: 'Finanzierungsmanager',
    tilePath: '/portal/finanzierungsmanager',
    processName: 'Finanzierungsfall',
    description: 'Finanzierungsfälle als §34i-Manager bearbeiten — von Intake bis Auszahlung.',
    menuPoints: 2,
    menuPointPaths: ['/portal/finanzierungsmanager', '/portal/finanzierungsmanager/einreichung'],
    compliance: {
      modulePageHeader: true,
      widgetGrid: true,
      widgetCell: true,
      demoWidget: true,
      inlineFlow: true,
      noSubNavigation: true,
    },
    demoWidget: {
      id: '__demo__',
      title: 'Demo: Finanzierungsakte',
      subtitle: 'Antragsteller Max Muster, Objekt Berlin, Volumen 450.000',
      status: 'demo',
      badgeLabel: 'Demo',
      data: {
        applicantName: 'Max Muster',
        objectAddress: 'Friedrichstr. 100, 10117 Berlin',
        loanVolume: 450000,
        status: 'in_review',
      },
      resetOnClose: true,
    },
    sections: [
      { id: 'intake', title: 'Falldaten', component: 'FMCaseIntake', readOnlyInDemo: false },
      { id: 'documents', title: 'Dokumente', component: 'FMCaseDocuments', readOnlyInDemo: true },
      { id: 'bank', title: 'Bankzuweisung', component: 'FMCaseBank', readOnlyInDemo: true },
    ],
    phase: 'done',
  },

  // ─── MOD-12: Akquisemanager ─────────────────────────────
  {
    id: 'GP-AKQUISE-MANDAT',
    moduleCode: 'MOD-12',
    moduleName: 'Akquisemanager',
    tilePath: '/portal/akquise-manager',
    processName: 'Akquisemandat',
    description: 'Suchmandante von Investoren als Akquisemanager bearbeiten.',
    menuPoints: 2,
    menuPointPaths: ['/portal/akquise-manager', '/portal/akquise-manager/objekte'],
    compliance: {
      modulePageHeader: true,
      widgetGrid: true,
      widgetCell: true,
      demoWidget: true,
      inlineFlow: true,
      noSubNavigation: true,
    },
    demoWidget: {
      id: '__demo__',
      title: 'Demo: MFH-Akquise Rheinland',
      subtitle: 'Suchprofil: MFH ab 10 WE, Region Köln/Düsseldorf',
      status: 'demo',
      badgeLabel: 'Demo',
      data: {
        clientName: 'Investoren GbR Rhein',
        assetFocus: ['MFH'],
        region: 'Köln/Düsseldorf',
        minUnits: 10,
        budgetMax: 5000000,
      },
      resetOnClose: true,
    },
    sections: [
      { id: 'profile', title: 'Mandatsprofil', component: 'AkquiseMandateProfile', readOnlyInDemo: false },
      { id: 'pipeline', title: 'Objekt-Pipeline', component: 'AkquisePipeline', readOnlyInDemo: true },
      { id: 'outreach', title: 'Kontaktierung', component: 'AkquiseOutreach', readOnlyInDemo: true },
    ],
    phase: 'done',
  },

  // ─── MOD-13: Projektmanager ─────────────────────────────
  {
    id: 'GP-PROJEKT',
    moduleCode: 'MOD-13',
    moduleName: 'Projektmanager',
    tilePath: '/portal/projekte',
    processName: 'Projektanlage',
    description: 'Bauprojekte anlegen, Einheiten verwalten und im Vertrieb veröffentlichen.',
    menuPoints: 1,
    menuPointPaths: ['/portal/projekte'],
    compliance: {
      modulePageHeader: true,
      widgetGrid: true,
      widgetCell: true,
      demoWidget: true,
      inlineFlow: true,
      noSubNavigation: true,
    },
    demoWidget: {
      id: '__demo__',
      title: 'Demo: Residenz am Stadtpark',
      subtitle: '24 Einheiten, München — vollständiges Beispielprojekt',
      status: 'demo',
      badgeLabel: 'Demo',
      data: {
        publicId: 'SOT-BT-DEMO',
        name: 'Residenz am Stadtpark',
        city: 'München',
        units: 24,
        status: 'approved',
      },
      resetOnClose: true,
    },
    sections: [
      { id: 'overview', title: 'Projektübersicht', component: 'ProjectOverview', readOnlyInDemo: true },
      { id: 'units', title: 'Einheiten', component: 'ProjectUnits', readOnlyInDemo: true },
      { id: 'publications', title: 'Veröffentlichungen', component: 'ProjectPublications', readOnlyInDemo: true },
    ],
    phase: 'done',
  },

  // ─── MOD-14: Communication Pro ──────────────────────────
  {
    id: 'GP-SERIEN-EMAIL',
    moduleCode: 'MOD-14',
    moduleName: 'Communication Pro',
    tilePath: '/portal/communication-pro/serien-emails',
    processName: 'Serien-E-Mail-Kampagne',
    description: 'E-Mail-Sequenzen für automatisierte Kontaktansprache erstellen.',
    menuPoints: 1,
    menuPointPaths: ['/portal/communication-pro/serien-emails'],
    compliance: {
      modulePageHeader: true,
      widgetGrid: true,
      widgetCell: true,
      demoWidget: true,
      inlineFlow: true,
      noSubNavigation: true,
    },
    demoWidget: {
      id: '__demo__',
      title: 'Demo: Willkommens-Sequenz',
      subtitle: '3-Schritt-E-Mail-Sequenz für Neukunden',
      status: 'demo',
      badgeLabel: 'Demo',
      data: {
        name: 'Willkommen bei SOTREAL',
        steps: 3,
        enrolled: 42,
        openRate: 0.68,
        status: 'active',
      },
      resetOnClose: true,
    },
    sections: [
      { id: 'sequence', title: 'Sequenz-Editor', component: 'SequenceEditor', readOnlyInDemo: false },
      { id: 'stats', title: 'Statistiken', component: 'SequenceStats', readOnlyInDemo: true },
    ],
    phase: 'done',
  },
  {
    id: 'GP-RECHERCHE',
    moduleCode: 'MOD-14',
    moduleName: 'Communication Pro',
    tilePath: '/portal/communication-pro/recherche',
    processName: 'Rechercheauftrag',
    description: 'Asynchrone Lead-Engine — Rechercheaufträge anlegen, durchführen und Kontakte übernehmen.',
    menuPoints: 1,
    menuPointPaths: ['/portal/communication-pro/recherche'],
    compliance: {
      modulePageHeader: true,
      widgetGrid: true,
      widgetCell: true,
      demoWidget: true,
      inlineFlow: true,
      noSubNavigation: true,
    },
    demoWidget: {
      id: '__demo__',
      title: 'Demo: Hausverwaltungen NRW',
      subtitle: 'Abgeschlossener Auftrag mit 37 Treffern',
      status: 'demo',
      badgeLabel: 'Demo',
      data: {
        query: 'Hausverwaltungen in NRW',
        resultsCount: 37,
        status: 'completed',
      },
      resetOnClose: true,
    },
    sections: [
      { id: 'results', title: 'Ergebnisse', component: 'ResearchResults', readOnlyInDemo: true },
      { id: 'analysis', title: 'KI-Analyse', component: 'ResearchAnalysis', readOnlyInDemo: true },
    ],
    phase: 'done',
  },

  // ─── MOD-17: Cars & Assets ──────────────────────────────
  {
    id: 'GP-FAHRZEUG',
    moduleCode: 'MOD-17',
    moduleName: 'Cars & Assets',
    tilePath: '/portal/cars/fahrzeuge',
    processName: 'Fahrzeugverwaltung',
    description: 'Fahrzeuge anlegen, Leasing verwalten und Versicherungsdaten pflegen.',
    menuPoints: 1,
    menuPointPaths: ['/portal/cars/fahrzeuge'],
    compliance: {
      modulePageHeader: true,
      widgetGrid: true,
      widgetCell: true,
      demoWidget: true,
      inlineFlow: true,
      noSubNavigation: true,
    },
    demoWidget: {
      id: '__demo__',
      title: 'Demo: BMW M4 Competition',
      subtitle: 'Leasing 36 Mon., Versicherung bis 15.03.2027',
      status: 'demo',
      badgeLabel: 'Demo',
      data: {
        make: 'BMW',
        model: 'M4 Competition',
        leasingMonths: 36,
        insuranceExpiry: '2027-03-15',
        monthlyRate: 890,
      },
      resetOnClose: true,
    },
    sections: [
      { id: 'details', title: 'Fahrzeugdaten', component: 'CarDetails', readOnlyInDemo: false },
      { id: 'leasing', title: 'Leasing & Kosten', component: 'CarLeasing', readOnlyInDemo: false },
    ],
    phase: 'done',
  },

  // ─── MOD-19: Photovoltaik ──────────────────────────────
  {
    id: 'GP-PV-ANLAGE',
    moduleCode: 'MOD-19',
    moduleName: 'Photovoltaik',
    tilePath: '/portal/photovoltaik/anlagen',
    processName: 'PV-Anlagenanlage',
    description: 'PV-Anlagen anlegen, Ertragsdaten erfassen und Monitoring einrichten.',
    menuPoints: 1,
    menuPointPaths: ['/portal/photovoltaik/anlagen'],
    compliance: {
      modulePageHeader: true,
      widgetGrid: true,
      widgetCell: true,
      demoWidget: true,
      inlineFlow: true,
      noSubNavigation: true,
    },
    demoWidget: {
      id: '__demo__',
      title: 'Demo: EFH SMA 9,8 kWp',
      subtitle: 'Beispiel-PV-Anlage mit Ertragsmonitoring',
      status: 'demo',
      badgeLabel: 'Demo',
      data: {
        capacity: 9.8,
        inverter: 'SMA Sunny Tripower',
        annualYield: 9500,
        commissioning: '2024-06-15',
      },
      resetOnClose: true,
    },
    sections: [
      { id: 'system', title: 'Anlagendaten', component: 'PVSystemData', readOnlyInDemo: false },
      { id: 'yield', title: 'Ertragsmonitoring', component: 'PVYieldMonitor', readOnlyInDemo: true },
    ],
    phase: 'done',
  },

  // ─── MOD-05: Pets ───────────────
  {
    id: 'GP-PETS',
    moduleCode: 'MOD-05',
    moduleName: 'Pets',
    tilePath: '/portal/pets/meine-tiere',
    processName: 'Tierverwaltung',
    description: 'Haustiere anlegen, Pflege verwalten und Services buchen.',
    menuPoints: 1,
    menuPointPaths: ['/portal/pets/meine-tiere'],
    compliance: {
      modulePageHeader: true,
      widgetGrid: true,
      widgetCell: true,
      demoWidget: true,
      inlineFlow: true,
      noSubNavigation: true,
    },
    demoWidget: {
      id: '__demo__',
      title: 'Demo: Luna (Golden Retriever)',
      subtitle: 'Beispiel-Tierakte mit Pflege-Kalender',
      status: 'demo',
      badgeLabel: 'Demo',
      data: {
        name: 'Luna',
        species: 'Hund',
        breed: 'Golden Retriever',
        age: 3,
      },
      resetOnClose: true,
    },
    sections: [
      { id: 'profile', title: 'Tierprofil', component: 'PetProfile', readOnlyInDemo: false },
      { id: 'caring', title: 'Pflege & Termine', component: 'PetCaring', readOnlyInDemo: true },
    ],
    phase: '1',
  },
];

// =============================================================================
// HELPER: Prozess nach ID finden
// =============================================================================

export function getProcessById(id: string): GoldenPathProcess | undefined {
  return GOLDEN_PATH_PROCESSES.find(p => p.id === id);
}

export function getProcessesByModule(moduleCode: string): GoldenPathProcess[] {
  return GOLDEN_PATH_PROCESSES.filter(p => p.moduleCode === moduleCode);
}

export function getCompliantProcesses(): GoldenPathProcess[] {
  return GOLDEN_PATH_PROCESSES.filter(p =>
    Object.values(p.compliance).every(Boolean)
  );
}

export function getNonCompliantProcesses(): GoldenPathProcess[] {
  return GOLDEN_PATH_PROCESSES.filter(p =>
    !Object.values(p.compliance).every(Boolean)
  );
}
