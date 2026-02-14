/**
 * OPERATIVE DESK MANIFEST — SSOT for Zone 1 Desk ↔ Manager ↔ Website-Profil Mapping
 * 
 * Every Manager-Module (Zone 2) has exactly ONE corresponding Operative Desk (Zone 1)
 * and ONE Website Profile (Zone 3 / Website Builder).
 * 
 * This manifest is the single source of truth for that 1:1:1 relationship.
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
// DESK DEFINITIONS — 1:1 with Manager-Modules
// =============================================================================

export const OPERATIVE_DESKS: OperativeDeskDefinition[] = [
  {
    deskId: 'sales-desk',
    displayName: 'Sales Desk',
    managerModuleCode: 'MOD-09',
    managerModuleName: 'Vertriebsmanager',
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
    websiteProfileId: '', // Kein Landing Page für MOD-10
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
    deskId: 'petmanager',
    displayName: 'Petmanager',
    managerModuleCode: 'MOD-05',
    managerModuleName: 'Pets',
    websiteProfileId: 'pet_services',
    route: 'petmanager',
    icon: 'PawPrint',
    responsibilities: [
      'Tier-Registrierung',
      'Service-Governance',
      'Shop-Management',
      'Content-Moderation',
    ],
  },
  {
    deskId: 'futureroom',
    displayName: 'FutureRoom',
    managerModuleCode: 'MOD-11',
    managerModuleName: 'Finanzierungsmanager',
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

/** Get the desk for a given Website Profile */
export function getDeskByProfile(profileId: string): OperativeDeskDefinition | undefined {
  return OPERATIVE_DESKS.find(d => d.websiteProfileId === profileId);
}
