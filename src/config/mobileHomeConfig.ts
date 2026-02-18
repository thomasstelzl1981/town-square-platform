/**
 * MOBILE HOME CONFIG — Defines entries shown on the mobile home module list
 * 
 * Each entry maps to a module or a specific tile within a module.
 * The list is rendered top-to-bottom on the mobile home screen.
 */

export interface MobileHomeEntry {
  /** 'module' navigates to the module base, 'tile' navigates to a specific tile */
  type: 'module' | 'tile';
  /** Module code from routesManifest (e.g. 'MOD-18') */
  code: string;
  /** For type 'tile': the tile path within the module */
  tile?: string;
  /** Display label on the home screen */
  label: string;
  /** Optional icon name from lucide-react */
  icon?: string;
}

export const mobileHomeEntries: MobileHomeEntry[] = [
  { type: 'module', code: 'MOD-18', label: 'Finanzen', icon: 'TrendingUp' },
  { type: 'module', code: 'MOD-04', label: 'Immobilien', icon: 'Building2' },
  { type: 'tile', code: 'MOD-02', tile: 'brief', label: 'Briefe', icon: 'FileText' },
  { type: 'module', code: 'MOD-03', label: 'Dokumente', icon: 'FolderOpen' },
  { type: 'tile', code: 'MOD-03', tile: 'posteingang', label: 'Posteingang', icon: 'Inbox' },
  { type: 'module', code: 'MOD-15', label: 'Sparen', icon: 'PiggyBank' },
  { type: 'module', code: 'MOD-16', label: 'Versicherungen', icon: 'Shield' },
  { type: 'module', code: 'MOD-17', label: 'Fahrzeuge', icon: 'Car' },
  { type: 'module', code: 'MOD-05', label: 'Haustiere', icon: 'PawPrint' },
  { type: 'module', code: 'MOD-07', label: 'Finanzierung', icon: 'Landmark' },
  { type: 'module', code: 'MOD-08', label: 'Immo Suche', icon: 'Search' },
  { type: 'module', code: 'MOD-00', label: 'Armstrong Tasks', icon: 'ListChecks' },
];
