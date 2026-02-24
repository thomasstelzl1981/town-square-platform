/**
 * ROLES MATRIX — Zentrale Rollendefinition (Konsolidiert)
 * 
 * @status seed-only — Runtime-SSOT ist DB tile_catalog / get_tiles_for_role()
 * 
 * Diese Datei dient ausschliesslich als initialer Seed fuer tile_catalog
 * bei Tenant-Erstellung und als Referenz-Dokumentation fuer Zone 1 Admin.
 * Sie wird NICHT zur Laufzeit fuer Berechtigungspruefungen herangezogen.
 * Runtime-Code MUSS die DB-Funktion get_tiles_for_role() via RPC nutzen.
 * 
 * Siehe: ZBC-R12 in spec/current/02_zones.md
 * 
 * membership_role steuert Tile-Aktivierung (tenant-bezogen).
 * app_role steuert globale Rechte (Zone-1-Zugang, God Mode).
 * 
 * 8 Rollen: platform_admin, super_user, client_user,
 *           akquise_manager, finance_manager, sales_partner,
 *           project_manager, pet_manager
 * 22 Module: MOD-00 bis MOD-20 + MOD-22
 */

// =============================================================================
// TYPES
// =============================================================================

export interface RoleDefinition {
  code: string;
  label: string;
  description: string;
  membershipRole: string;        // Wert in memberships.role
  appRole?: string;              // Optionaler Wert in user_roles.role
  totalModules: number;
  isSystem?: boolean;            // Nicht wählbar bei Signup
  isLegacy?: boolean;            // Legacy, nicht mehr aktiv
}

export interface ModuleDefinition {
  code: string;
  name: string;
  zone: string;
  description: string;
}

// =============================================================================
// TILE-SETS — SSOT (spiegelt DB-Funktion get_tiles_for_role())
// =============================================================================

/** 14 Basis-Module — alle User-Rollen */
export const BASE_TILES: string[] = [
  'MOD-00', 'MOD-01', 'MOD-02', 'MOD-03', 'MOD-04', 'MOD-05',
  'MOD-06', 'MOD-07', 'MOD-08', 'MOD-15', 'MOD-16', 'MOD-17',
  'MOD-18', 'MOD-20',
];

/** Zusatz-Module pro Spezialrolle */
export const ROLE_EXTRA_TILES: Record<string, string[]> = {
  sales_partner: ['MOD-09', 'MOD-10'],
  finance_manager: ['MOD-11'],
  akquise_manager: ['MOD-12'],
  project_manager: ['MOD-13'],
  pet_manager: ['MOD-22', 'MOD-10'],
};

/** 8 Spezial-Module (nicht im Basis-Set) */
export const SPECIALIST_TILES: string[] = [
  'MOD-09', 'MOD-10', 'MOD-11', 'MOD-12', 'MOD-13', 'MOD-14', 'MOD-19', 'MOD-22',
];

/** Alle 22 Module */
export const ALL_TILES: string[] = [...BASE_TILES, ...SPECIALIST_TILES].sort();

// =============================================================================
// ROLLEN-KATALOG (8 aktive Rollen)
// =============================================================================

export const ROLES_CATALOG: RoleDefinition[] = [
  {
    code: 'platform_admin',
    label: 'Platform Admin',
    description: 'Plattformbetreiber (God Mode) — Zone 1 Governance, Oversight, Support. Uneingeschränkter Zugriff auf alle Tenants.',
    membershipRole: 'platform_admin',
    appRole: 'platform_admin',
    totalModules: 22,
    isSystem: true,
  },
  {
    code: 'super_user',
    label: 'Super-User',
    description: 'Vollzugriff auf alle 22 Module. Membership bleibt org_admin, zusätzlich app_role super_user.',
    membershipRole: 'org_admin',
    appRole: 'super_user',
    totalModules: 22,
  },
  {
    code: 'client_user',
    label: 'Standardkunde',
    description: 'Standard-Nutzer mit 14 Basis-Modulen. Automatische Zuweisung bei Signup.',
    membershipRole: 'org_admin',
    totalModules: 14,
  },
  {
    code: 'akquise_manager',
    label: 'Akquise-Manager',
    description: 'Akquise-Spezialist — Basis-Module + MOD-12 Akquise-Manager.',
    membershipRole: 'akquise_manager',
    appRole: 'akquise_manager',
    totalModules: 15,
  },
  {
    code: 'finance_manager',
    label: 'Finanzierungsmanager',
    description: 'Finanzierungs-Spezialist — Basis-Module + MOD-11 Finanzierungsmanager.',
    membershipRole: 'finance_manager',
    appRole: 'finance_manager',
    totalModules: 15,
  },
  {
    code: 'sales_partner',
    label: 'Vertriebspartner',
    description: 'Vertriebspartner — Basis-Module + MOD-09 Vertriebspartner + MOD-10 Leads.',
    membershipRole: 'sales_partner',
    appRole: 'sales_partner',
    totalModules: 16,
  },
  {
    code: 'project_manager',
    label: 'Projektmanager',
    description: 'Projektmanager — Basis-Module + MOD-13 Projekte.',
    membershipRole: 'project_manager',
    appRole: 'project_manager',
    totalModules: 15,
  },
  {
    code: 'pet_manager',
    label: 'Pet Manager',
    description: 'Pet Manager — Basis-Module + MOD-22 Pet Manager + MOD-10 Leads.',
    membershipRole: 'pet_manager',
    appRole: 'pet_manager',
    totalModules: 16,
  },
];

// Legacy-Rollen (im Enum, nicht mehr aktiv)
export const LEGACY_ROLES = [
  { code: 'internal_ops', label: 'Internal Ops (Legacy)', note: 'Bleibt im Enum, wird nicht genutzt' },
  { code: 'renter_user', label: 'Renter User (Legacy)', note: 'Bleibt im Enum, wird nicht genutzt' },
  { code: 'future_room_web_user_lite', label: 'FutureRoom Lite (Legacy)', note: 'Bleibt im Enum, wird nicht genutzt' },
];

// =============================================================================
// MODUL-KATALOG (22 Module)
// =============================================================================

export const MODULES_CATALOG: ModuleDefinition[] = [
  { code: 'MOD-00', name: 'Dashboard', zone: 'Zone 2', description: 'Zentrale Home-/Einstiegsseite' },
  { code: 'MOD-01', name: 'Stammdaten', zone: 'Zone 2', description: 'Profil, Verträge, Abrechnung' },
  { code: 'MOD-02', name: 'KI Office', zone: 'Zone 2', description: 'E-Mail, Brief, Kontakte, Kalender' },
  { code: 'MOD-03', name: 'DMS', zone: 'Zone 2', description: 'Dokumentenmanagement' },
  { code: 'MOD-04', name: 'Immobilien', zone: 'Zone 2', description: 'Portfolio, Kontexte, Bewertung' },
  { code: 'MOD-05', name: 'Website Builder', zone: 'Zone 2', description: 'KI-Website-Baukasten' },
  { code: 'MOD-06', name: 'Verkauf', zone: 'Zone 2', description: 'Objekte, Anfragen, Vorgänge' },
  { code: 'MOD-07', name: 'Finanzierung', zone: 'Zone 2', description: 'Selbstauskunft, Dokumente, Anfrage' },
  { code: 'MOD-08', name: 'Investment-Suche', zone: 'Zone 2', description: 'Suche, Favoriten, Mandate' },
  { code: 'MOD-09', name: 'Vertriebspartner', zone: 'Zone 2', description: 'Katalog, Beratung, Netzwerk' },
  { code: 'MOD-10', name: 'Leads', zone: 'Zone 2', description: 'Inbox, Pipeline, Werbung' },
  { code: 'MOD-11', name: 'Finanzierungsmanager', zone: 'Zone 2', description: 'Manager-Workbench (finance_manager)' },
  { code: 'MOD-12', name: 'Akquise-Manager', zone: 'Zone 2', description: 'Akquise-Workbench (akquise_manager)' },
  { code: 'MOD-13', name: 'Projekte', zone: 'Zone 2', description: 'Übersicht, Timeline, Dokumente' },
  { code: 'MOD-14', name: 'Communication Pro', zone: 'Zone 2', description: 'Serien-E-Mails, Social' },
  { code: 'MOD-15', name: 'Fortbildung', zone: 'Zone 2', description: 'Kurse, Zertifikate' },
  { code: 'MOD-16', name: 'Services', zone: 'Zone 2', description: 'Shops & Marktplätze' },
  { code: 'MOD-17', name: 'Car-Management', zone: 'Zone 2', description: 'Fahrzeuge, Fahrtenbuch' },
  { code: 'MOD-18', name: 'Finanzanalyse', zone: 'Zone 2', description: 'Investment-Analyse' },
  { code: 'MOD-19', name: 'Photovoltaik', zone: 'Zone 2', description: 'PV-Anlagen-Verwaltung' },
  { code: 'MOD-20', name: 'ZUHAUSE', zone: 'Zone 2', description: 'Mieter-Portal' },
  { code: 'MOD-22', name: 'PetManager', zone: 'Zone 2', description: 'Haustier-Verwaltung' },
];

// =============================================================================
// MODUL-ROLLEN-MATRIX
// =============================================================================

export const MODULE_ROLE_MATRIX: Record<string, string[]> = {
  // Basis-Module: alle 8 Rollen
  'MOD-00': ['platform_admin', 'super_user', 'client_user', 'akquise_manager', 'finance_manager', 'sales_partner', 'project_manager', 'pet_manager'],
  'MOD-01': ['platform_admin', 'super_user', 'client_user', 'akquise_manager', 'finance_manager', 'sales_partner', 'project_manager', 'pet_manager'],
  'MOD-02': ['platform_admin', 'super_user', 'client_user', 'akquise_manager', 'finance_manager', 'sales_partner', 'project_manager', 'pet_manager'],
  'MOD-03': ['platform_admin', 'super_user', 'client_user', 'akquise_manager', 'finance_manager', 'sales_partner', 'project_manager', 'pet_manager'],
  'MOD-04': ['platform_admin', 'super_user', 'client_user', 'akquise_manager', 'finance_manager', 'sales_partner', 'project_manager', 'pet_manager'],
  'MOD-05': ['platform_admin', 'super_user', 'client_user', 'akquise_manager', 'finance_manager', 'sales_partner', 'project_manager', 'pet_manager'],
  'MOD-06': ['platform_admin', 'super_user', 'client_user', 'akquise_manager', 'finance_manager', 'sales_partner', 'project_manager', 'pet_manager'],
  'MOD-07': ['platform_admin', 'super_user', 'client_user', 'akquise_manager', 'finance_manager', 'sales_partner', 'project_manager', 'pet_manager'],
  'MOD-08': ['platform_admin', 'super_user', 'client_user', 'akquise_manager', 'finance_manager', 'sales_partner', 'project_manager', 'pet_manager'],
  'MOD-15': ['platform_admin', 'super_user', 'client_user', 'akquise_manager', 'finance_manager', 'sales_partner', 'project_manager', 'pet_manager'],
  'MOD-16': ['platform_admin', 'super_user', 'client_user', 'akquise_manager', 'finance_manager', 'sales_partner', 'project_manager', 'pet_manager'],
  'MOD-17': ['platform_admin', 'super_user', 'client_user', 'akquise_manager', 'finance_manager', 'sales_partner', 'project_manager', 'pet_manager'],
  'MOD-18': ['platform_admin', 'super_user', 'client_user', 'akquise_manager', 'finance_manager', 'sales_partner', 'project_manager', 'pet_manager'],
  'MOD-20': ['platform_admin', 'super_user', 'client_user', 'akquise_manager', 'finance_manager', 'sales_partner', 'project_manager', 'pet_manager'],
  // Spezial-Module
  'MOD-09': ['platform_admin', 'super_user', 'sales_partner'],
  'MOD-10': ['platform_admin', 'super_user', 'sales_partner', 'pet_manager'],
  'MOD-11': ['platform_admin', 'super_user', 'finance_manager'],
  'MOD-12': ['platform_admin', 'super_user', 'akquise_manager'],
  'MOD-13': ['platform_admin', 'super_user', 'project_manager'],
  'MOD-14': ['platform_admin', 'super_user'],
  'MOD-19': ['platform_admin', 'super_user'],
  'MOD-22': ['platform_admin', 'super_user', 'pet_manager'],
};

// =============================================================================
// HILFSFUNKTIONEN
// =============================================================================

/** 
 * Prüft ob eine Rolle Zugriff auf ein Modul hat.
 * @deprecated Seed-only — Runtime-Code soll get_tiles_for_role() RPC nutzen (ZBC-R12)
 */
export function hasModuleAccess(roleCode: string, moduleCode: string): boolean {
  const allowedRoles = MODULE_ROLE_MATRIX[moduleCode];
  if (!allowedRoles) return false;
  return allowedRoles.includes(roleCode);
}

/** 
 * Gibt alle Module zurück, auf die eine Rolle Zugriff hat.
 * @deprecated Seed-only — Runtime-Code soll get_tiles_for_role() RPC nutzen (ZBC-R12)
 */
export function getModulesForRole(roleCode: string): string[] {
  return Object.entries(MODULE_ROLE_MATRIX)
    .filter(([_, roles]) => roles.includes(roleCode))
    .map(([moduleCode]) => moduleCode);
}

/** Gibt alle Rollen zurück, die Zugriff auf ein Modul haben */
export function getRolesForModule(moduleCode: string): string[] {
  return MODULE_ROLE_MATRIX[moduleCode] || [];
}

/** Prüft ob ein Modul im Basis-Set ist */
export function isBaseTile(moduleCode: string): boolean {
  return BASE_TILES.includes(moduleCode);
}

/** 
 * Gibt die Tiles für eine Rolle zurück (Frontend-Spiegel der DB-Funktion).
 * @deprecated Seed-only — Runtime-Code soll get_tiles_for_role() RPC nutzen (ZBC-R12)
 */
export function getTilesForRole(roleCode: string): string[] {
  if (roleCode === 'platform_admin' || roleCode === 'super_user') return ALL_TILES;
  const extras = ROLE_EXTRA_TILES[roleCode] || [];
  return [...BASE_TILES, ...extras];
}
