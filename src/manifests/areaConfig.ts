/**
 * AREA CONFIG — Navigation Grouping for Zone 2
 * 
 * This file defines the 4 navigation areas for the portal UI.
 * This is PRESENTATION ONLY — routes remain unchanged and are derived from routesManifest.ts.
 * 
 * Area groupings determine which modules appear together in the top-level navigation.
 */

export type AreaKey = 'base' | 'missions' | 'operations' | 'services';

export interface AreaDefinition {
  key: AreaKey;
  label: string;
  labelShort: string;
  icon: string;
  modules: string[]; // Module codes: MOD-01, MOD-02, etc.
}

/**
 * Area configuration defining the 4 navigation zones
 */
export const areaConfig: AreaDefinition[] = [
  {
    key: 'base',
    label: 'Base',
    labelShort: 'Base',
    icon: 'Layers',
    modules: ['MOD-20', 'MOD-02', 'MOD-03', 'MOD-16', 'MOD-01'],
  },
  {
    key: 'missions',
    label: 'Missions',
    labelShort: 'Missions',
    icon: 'Target',
    modules: ['MOD-04', 'MOD-05', 'MOD-06', 'MOD-07', 'MOD-08'],
  },
  {
    key: 'operations',
    label: 'Operations',
    labelShort: 'Ops',
    icon: 'Settings',
    modules: ['MOD-12', 'MOD-11', 'MOD-13', 'MOD-09', 'MOD-10'],
  },
  {
    key: 'services',
    label: 'Services',
    labelShort: 'Services',
    icon: 'Grid',
    modules: ['MOD-14', 'MOD-15', 'MOD-17', 'MOD-18', 'MOD-19'],
  },
];

/**
 * UI-only label overrides for modules
 * Routes remain unchanged - these are display labels only
 */
export const moduleLabelOverrides: Record<string, string> = {
  'MOD-03': 'Dokumente',           // DMS → Dokumente
  'MOD-05': 'Mietverwaltung',      // MSV → Mietverwaltung
  'MOD-14': 'Kommunikation Pro',   // Communication Pro → Kommunikation Pro
  'MOD-17': 'Fahrzeuge',           // Car-Management → Fahrzeuge
};

/**
 * Get display label for a module (with override if defined)
 */
export function getModuleDisplayLabel(code: string, defaultLabel: string): string {
  return moduleLabelOverrides[code] || defaultLabel;
}

/**
 * Find which area a module belongs to
 */
export function getAreaForModule(moduleCode: string): AreaKey | null {
  const area = areaConfig.find(a => a.modules.includes(moduleCode));
  return area?.key || null;
}

/**
 * Get area definition by key
 */
export function getAreaByKey(key: AreaKey): AreaDefinition | undefined {
  return areaConfig.find(a => a.key === key);
}

/**
 * Derive area from current pathname
 * Returns the area that contains the active module, or 'base' as default
 */
export function deriveAreaFromPath(pathname: string, moduleRouteMap: Record<string, string>): AreaKey | null {
  // Dashboard path = no area active
  if (pathname === '/portal' || pathname === '/portal/') {
    return null;
  }
  
  // First: Check for Area-Overview paths (/portal/area/:areaKey)
  const areaMatch = pathname.match(/^\/portal\/area\/([a-z]+)/);
  if (areaMatch) {
    const areaKey = areaMatch[1] as AreaKey;
    if (areaConfig.find(a => a.key === areaKey)) {
      return areaKey;
    }
  }
  
  // Second: Check which module's route matches the current path
  for (const [code, route] of Object.entries(moduleRouteMap)) {
    if (pathname === route || pathname.startsWith(route + '/')) {
      const area = getAreaForModule(code);
      if (area) return area;
    }
  }
  // Default: null (no fallback to 'base')
  return null;
}
