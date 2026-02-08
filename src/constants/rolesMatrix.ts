/**
 * ROLES MATRIX — Zentrale Rollendefinition
 * 
 * SSOT für Rollen-Dokumentation in Zone 1
 * Diese Konstanten werden im RolesManagement-Modul visualisiert.
 */

export interface RoleDefinition {
  code: string;
  label: string;
  zone: string;
  description: string;
  modules: string[];
  dbNote?: string; // Hinweis auf DB-Abweichung
}

export interface ModuleDefinition {
  code: string;
  name: string;
  zone: string;
  description: string;
}

// =============================================================================
// ROLLEN-KATALOG
// =============================================================================
export const ROLES_CATALOG: RoleDefinition[] = [
  // --- GLOBALE / SYSTEMROLLEN ---
  {
    code: 'platform_admin',
    label: 'Platform Admin',
    zone: 'Zone 1',
    description: 'Plattformbetreiber (God Mode) — Governance, Oversight, Delegation, Support',
    modules: [
      'Zone 1: ALLE Admin-Module',
      'Zone 2: ALLE Module (Read + Steuerung, kein operatives Daily-Work)',
    ],
  },
  
  // --- ORGANISATIONSROLLEN ---
  {
    code: 'org_admin',
    label: 'Org Admin',
    zone: 'Zone 2',
    description: 'Eigentümer / Geschäftsführer / Hauptnutzer eines Tenants',
    modules: [
      'MOD-00 Dashboard (voll)',
      'MOD-01 Stammdaten (voll)',
      'MOD-02 KI Office (voll)',
      'MOD-03 DMS (voll)',
      'MOD-04 Immobilien (voll, SSOT)',
      'MOD-05 MSV (voll)',
      'MOD-06 Verkauf (voll)',
      'MOD-07 Finanzierung (voll)',
      'MOD-08 Investment-Suche (voll)',
      'MOD-09 Vertriebspartner (eigene Struktur)',
      'MOD-10 Leads',
      'MOD-13 Projekte',
      'MOD-14 Communication Pro',
      'MOD-15 Fortbildung',
      'MOD-16 Services',
      'MOD-17 Car-Management',
      'MOD-18 Finanzanalyse',
      'MOD-19 Photovoltaik',
      'MOD-20 Miety (Vermieter-Sicht)',
    ],
  },
  {
    code: 'internal_user',
    label: 'Internal User',
    zone: 'Zone 2',
    description: 'Mitarbeiter im Kunden-Tenant — Operative Nutzung, keine Governance',
    modules: [
      'MOD-00 Dashboard',
      'MOD-02 KI Office',
      'MOD-03 DMS',
      'MOD-04 Immobilien (read / eingeschränkt write)',
      'MOD-05 MSV (operativ)',
      'MOD-06 Verkauf (mit Freigaben)',
      'MOD-07 Finanzierung (vorbereitend)',
      'MOD-13 Projekte',
      'MOD-14 Communication Pro',
      'MOD-17 Car-Management',
    ],
    dbNote: 'DB hat aktuell: internal_ops (Umbenennung in Phase 11)',
  },
  
  // --- SPEZIALROLLEN ---
  {
    code: 'sales_partner',
    label: 'Sales Partner',
    zone: 'Zone 2',
    description: 'Externer oder interner Vertriebspartner — Deal-, Pipeline- und Provisionsfokus',
    modules: [
      'MOD-00 Dashboard',
      'MOD-06 Verkauf (read-only Listings)',
      'MOD-07 Finanzierung (Übergabe / Status)',
      'MOD-08 Investment-Suche (Mandate, Suche, Favoriten)',
      'MOD-09 Vertriebspartner (Pipeline, Netzwerk)',
      'MOD-10 Leads (zugewiesene Leads)',
    ],
  },
  {
    code: 'finance_manager',
    label: 'Finanzierungsmanager',
    zone: 'Zone 2 (Spezialmodul)',
    description: 'FutureRoom Finanzierungsmanager — Bearbeitet übergebene Finanzierungsfälle',
    modules: [
      'MOD-00 Dashboard',
      'MOD-03 DMS (finanzierungsbezogene Dokumente)',
      'MOD-07 Finanzierung (read / status sync)',
      'MOD-11 Finanzierungsmanager (SoT nach Annahme)',
    ],
  },
  {
    code: 'akquise_manager',
    label: 'Akquise-Manager',
    zone: 'Zone 2 (Spezialmodul)',
    description: 'Acquiary Manager — Bearbeitung von Investment- & Akquise-Mandaten',
    modules: [
      'MOD-00 Dashboard',
      'MOD-03 DMS',
      'MOD-04 Immobilien (Objekteingang, read/write begrenzt)',
      'MOD-08 Investment-Suche (Mandate)',
      'MOD-12 Akquise-Manager',
    ],
  },
  
  // --- LITE-ROLLEN ---
  {
    code: 'future_room_web_user_lite',
    label: 'FutureRoom Lite',
    zone: 'Zone 3 Entry',
    description: 'Nutzer von Zone-3-FutureRoom — Keine volle Portalnutzung',
    modules: [
      'MOD-00 Dashboard (stark eingeschränkt)',
      'MOD-07 Finanzierung (Selbstauskunft / Upload)',
    ],
  },
  {
    code: 'tenant_renter_lite',
    label: 'Mieter (Lite)',
    zone: 'Zone 2 Andock',
    description: 'Mieter (eingeladen aus MOD-05) — Eigener Mini-Tenant',
    modules: [
      'MOD-03 DMS (eigene Dokumente)',
      'MOD-14 Communication Pro (eingeschränkt)',
      'MOD-20 Miety',
    ],
    dbNote: 'DB hat aktuell: renter_user (Umbenennung in Phase 11)',
  },
];

// =============================================================================
// MODUL-KATALOG (für Matrix-Ansicht)
// =============================================================================
export const MODULES_CATALOG: ModuleDefinition[] = [
  { code: 'MOD-00', name: 'Dashboard', zone: 'Zone 2', description: 'Zentrale Home-/Einstiegsseite' },
  { code: 'MOD-01', name: 'Stammdaten', zone: 'Zone 2', description: 'Profil, Verträge, Abrechnung' },
  { code: 'MOD-02', name: 'KI Office', zone: 'Zone 2', description: 'E-Mail, Brief, Kontakte, Kalender' },
  { code: 'MOD-03', name: 'DMS', zone: 'Zone 2', description: 'Dokumentenmanagement' },
  { code: 'MOD-04', name: 'Immobilien', zone: 'Zone 2', description: 'Portfolio, Kontexte, Bewertung' },
  { code: 'MOD-05', name: 'MSV', zone: 'Zone 2', description: 'Mietverwaltung' },
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
  { code: 'MOD-16', name: 'Services', zone: 'Zone 2', description: 'Handwerker, Wartung' },
  { code: 'MOD-17', name: 'Car-Management', zone: 'Zone 2', description: 'Fahrzeuge, Fahrtenbuch' },
  { code: 'MOD-18', name: 'Finanzanalyse', zone: 'Zone 2', description: 'Investment-Analyse' },
  { code: 'MOD-19', name: 'Photovoltaik', zone: 'Zone 2', description: 'PV-Anlagen-Verwaltung' },
  { code: 'MOD-20', name: 'Miety', zone: 'Zone 2', description: 'Mieter-Portal' },
];

// =============================================================================
// MODUL-ROLLEN-MATRIX (welche Rolle hat Zugriff auf welches Modul)
// =============================================================================
export const MODULE_ROLE_MATRIX: Record<string, string[]> = {
  'MOD-00': ['platform_admin', 'org_admin', 'internal_user', 'sales_partner', 'finance_manager', 'akquise_manager', 'future_room_web_user_lite', 'tenant_renter_lite'],
  'MOD-01': ['platform_admin', 'org_admin', 'internal_user', 'sales_partner', 'tenant_renter_lite'],
  'MOD-02': ['platform_admin', 'org_admin', 'internal_user', 'sales_partner'],
  'MOD-03': ['platform_admin', 'org_admin', 'internal_user', 'sales_partner', 'finance_manager', 'akquise_manager', 'tenant_renter_lite'],
  'MOD-04': ['platform_admin', 'org_admin', 'internal_user', 'akquise_manager'],
  'MOD-05': ['platform_admin', 'org_admin', 'internal_user', 'tenant_renter_lite'],
  'MOD-06': ['platform_admin', 'org_admin', 'internal_user', 'sales_partner'],
  'MOD-07': ['platform_admin', 'org_admin', 'internal_user', 'sales_partner', 'finance_manager', 'future_room_web_user_lite'],
  'MOD-08': ['platform_admin', 'org_admin', 'internal_user', 'sales_partner', 'akquise_manager'],
  'MOD-09': ['platform_admin', 'sales_partner'],
  'MOD-10': ['platform_admin', 'org_admin', 'sales_partner'],
  'MOD-11': ['platform_admin', 'finance_manager'],
  'MOD-12': ['platform_admin', 'akquise_manager'],
  'MOD-13': ['platform_admin', 'org_admin', 'internal_user'],
  'MOD-14': ['platform_admin', 'org_admin', 'internal_user', 'tenant_renter_lite'],
  'MOD-15': ['platform_admin', 'org_admin'],
  'MOD-16': ['platform_admin', 'org_admin'],
  'MOD-17': ['platform_admin', 'org_admin', 'internal_user'],
  'MOD-18': ['platform_admin', 'org_admin'],
  'MOD-19': ['platform_admin', 'org_admin'],
  'MOD-20': ['platform_admin', 'org_admin', 'tenant_renter_lite'],
};

// =============================================================================
// HILFSFUNKTIONEN
// =============================================================================

/** Prüft ob eine Rolle Zugriff auf ein Modul hat */
export function hasModuleAccess(roleCode: string, moduleCode: string): boolean {
  const allowedRoles = MODULE_ROLE_MATRIX[moduleCode];
  if (!allowedRoles) return false;
  return allowedRoles.includes(roleCode);
}

/** Gibt alle Module zurück, auf die eine Rolle Zugriff hat */
export function getModulesForRole(roleCode: string): string[] {
  return Object.entries(MODULE_ROLE_MATRIX)
    .filter(([_, roles]) => roles.includes(roleCode))
    .map(([moduleCode]) => moduleCode);
}

/** Gibt alle Rollen zurück, die Zugriff auf ein Modul haben */
export function getRolesForModule(moduleCode: string): string[] {
  return MODULE_ROLE_MATRIX[moduleCode] || [];
}
