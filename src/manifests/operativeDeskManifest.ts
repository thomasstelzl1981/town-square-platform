/**
 * OPERATIVE DESK MANIFEST — SSOT for Zone 1 Desk ↔ Manager ↔ Client ↔ Website-Profil Mapping
 * 
 * Every Manager-Module (Zone 2) has exactly ONE corresponding Operative Desk (Zone 1),
 * an optional Client-Module (Zone 2), and an optional Website Profile (Zone 3).
 * 
 * This manifest is the single source of truth for the Z2-Client ↔ Z1-Desk ↔ Z2-Manager chain.
 */

export interface OperativeDeskDefinition {
  /** Unique desk identifier (matches route slug) */
  deskId: string;
  /** Human-readable desk name */
  displayName: string;
  /** Associated Manager-Module code (Zone 2) */
  managerModuleCode: string;
  /** Manager-Module display name */
  managerModuleName: string;
  /** Associated Client-Module code (Zone 2) — empty if intake is Z3-only */
  clientModuleCode: string;
  /** Client-Module display name */
  clientModuleName: string;
  /** Associated Website Profile ID (from websiteProfileManifest.ts) */
  websiteProfileId: string;
  /** Route path in Zone 1 (relative to /admin/) */
  route: string;
  /** Lucide icon name for navigation */
  icon: string;
  /** Core governance responsibilities */
  responsibilities: string[];
}

// =============================================================================
// DESK DEFINITIONS — Z2-Client ↔ Z1-Desk ↔ Z2-Manager
// =============================================================================

export const OPERATIVE_DESKS: OperativeDeskDefinition[] = [
  {
    deskId: 'sales-desk',
    displayName: 'Sales Desk',
    managerModuleCode: 'MOD-09',
    managerModuleName: 'Vertriebsmanager',
    clientModuleCode: 'MOD-06',
    clientModuleName: 'Verkauf',
    websiteProfileId: 'sales_partner',
    route: 'sales-desk',
    icon: 'ShoppingBag',
    responsibilities: [
      'Partner-Distribution',
      'Listing-Governance',
      'Lead-Routing an Partner',
      'Vertriebspartner-Verifizierung',
    ],
  },
  {
    deskId: 'lead-desk',
    displayName: 'Lead Desk',
    managerModuleCode: 'MOD-10',
    managerModuleName: 'Leadmanager',
    clientModuleCode: '',
    clientModuleName: '',
    websiteProfileId: '',
    route: 'lead-desk',
    icon: 'Target',
    responsibilities: [
      'Lead-Pool-Governance',
      'Kampagnen-Monitoring',
      'Lead-Qualifizierung',
      'Provisions-Abrechnung',
    ],
  },
  {
    deskId: 'pet-desk',
    displayName: 'Pet Desk',
    managerModuleCode: 'MOD-22',
    managerModuleName: 'Pet Manager',
    clientModuleCode: 'MOD-05',
    clientModuleName: 'Pets',
    websiteProfileId: 'pet_services',
    route: 'pet-desk',
    icon: 'PawPrint',
    responsibilities: [
      'Provider-Übersicht & Verifizierung',
      'Umsatz- & Zahlungs-Governance',
      'Service-Katalog-Moderation',
      'Franchise-Netzwerk-Monitoring',
    ],
  },
  {
    deskId: 'futureroom',
    displayName: 'FutureRoom',
    managerModuleCode: 'MOD-11',
    managerModuleName: 'Finanzierungsmanager',
    clientModuleCode: 'MOD-07',
    clientModuleName: 'Finanzierung',
    websiteProfileId: 'finance_broker',
    route: 'futureroom',
    icon: 'Landmark',
    responsibilities: [
      'Finanzierungsanträge',
      'Bank-Routing',
      'Manager-Zuweisung',
      'Antrags-Monitoring',
    ],
  },
  {
    deskId: 'acquiary',
    displayName: 'Acquiary',
    managerModuleCode: 'MOD-12',
    managerModuleName: 'Akquisemanager',
    clientModuleCode: 'MOD-08',
    clientModuleName: 'Investment-Suche',
    websiteProfileId: 'acquisition_agent',
    route: 'acquiary',
    icon: 'Briefcase',
    responsibilities: [
      'Mandat-Governance',
      'Objekt-Routing',
      'Kontakt-Staging',
      'E-Mail-Inbound-Orchestrierung',
    ],
  },
  {
    deskId: 'projekt-desk',
    displayName: 'Projekt Desk',
    managerModuleCode: 'MOD-13',
    managerModuleName: 'Projektmanager',
    clientModuleCode: '',
    clientModuleName: '',
    websiteProfileId: 'project_developer',
    route: 'projekt-desk',
    icon: 'Building2',
    responsibilities: [
      'Projekt-Intake',
      'Listing-Aktivierung',
      'Landing-Page-Governance',
      'Einheiten-Monitoring',
    ],
  },
  {
    deskId: 'finance-desk',
    displayName: 'Finance Desk',
    managerModuleCode: '',
    managerModuleName: '',
    clientModuleCode: 'MOD-18',
    clientModuleName: 'Finanzen',
    websiteProfileId: '',
    route: 'finance-desk',
    icon: 'LineChart',
    responsibilities: [
      'Finanzberater-Zuweisung',
      'Service-Portfolio-Governance',
      'Kunden-Intake-Triage',
      'Monitoring',
    ],
  },
  {
    deskId: 'ncore-desk',
    displayName: 'Ncore Desk',
    managerModuleCode: '',
    managerModuleName: '',
    clientModuleCode: '',
    clientModuleName: '',
    websiteProfileId: 'ncore_consulting',
    route: 'ncore-desk',
    icon: 'Cpu',
    responsibilities: [
      'Projekt-Anfragen',
      'Kooperations-Anfragen',
      'Netzwerk-Lead-Routing',
      'Beratungs-Triage',
    ],
  },
  {
    deskId: 'otto-desk',
    displayName: 'Otto² Advisory Desk',
    managerModuleCode: '',
    managerModuleName: '',
    clientModuleCode: '',
    clientModuleName: '',
    websiteProfileId: 'otto_advisory',
    route: 'otto-desk',
    icon: 'Wallet',
    responsibilities: [
      'Finanzierungsanfragen',
      'Beratungsanfragen',
      'Lead-Qualifizierung',
      'Kunden-Triage',
    ],
  },
  {
    deskId: 'commpro-desk',
    displayName: 'CommPro Desk',
    managerModuleCode: 'MOD-14',
    managerModuleName: 'Communication Pro',
    clientModuleCode: '',
    clientModuleName: '',
    websiteProfileId: '',
    route: 'commpro-desk',
    icon: 'Phone',
    responsibilities: [
      'Marken-Telefonassistenten',
      'Premium-Voice (ElevenLabs)',
      'Nummernverwaltung',
      'Anrufprotokoll',
    ],
  },
];

// =============================================================================
// HELPERS
// =============================================================================

/** Get a desk definition by its ID */
export function getDeskById(deskId: string): OperativeDeskDefinition | undefined {
  return OPERATIVE_DESKS.find(d => d.deskId === deskId);
}

/** Get the desk for a given Manager-Module */
export function getDeskByModule(moduleCode: string): OperativeDeskDefinition | undefined {
  return OPERATIVE_DESKS.find(d => d.managerModuleCode === moduleCode);
}

/** Get the desk for a given Client-Module */
export function getDeskByClientModule(moduleCode: string): OperativeDeskDefinition | undefined {
  return OPERATIVE_DESKS.find(d => d.clientModuleCode === moduleCode);
}

/** Get the desk for a given Website Profile */
export function getDeskByProfile(profileId: string): OperativeDeskDefinition | undefined {
  return OPERATIVE_DESKS.find(d => d.websiteProfileId === profileId);
}
