/**
 * MOBILE CONFIG — Central governance for mobile UI/UX
 * 
 * Controls which modules, features, and UI elements are visible on mobile.
 * This is the single source of truth for mobile visibility decisions.
 */

/**
 * Modules hidden on mobile devices.
 * Only partner/manager role-gated tools that are too complex for mobile.
 */
/**
 * Areas hidden on mobile devices.
 * Manager/operations area is partner-only and too complex for mobile.
 */
export const MOBILE_HIDDEN_AREAS: string[] = ['operations'];

export const MOBILE_HIDDEN_MODULES: string[] = [
  'MOD-09',  // Immomanager — partner-only, complex advisory UI
  'MOD-10',  // Lead Manager — partner-only, commission management
  'MOD-11',  // Finanzierungsmanager — role-gated, complex workbench
  'MOD-12',  // Akquisemanager — role-gated, mandate/object intake
  'MOD-14',  // Communication Pro — partner-only, serial emails/social
];

/**
 * Tiles (Sub-Tabs) hidden on mobile within specific modules.
 * Key = moduleBase (route segment), Value = array of tile paths to hide.
 */
export const MOBILE_HIDDEN_TILES: Record<string, string[]> = {
  'office': ['email', 'kontakte', 'kalender'],
};

/**
 * Check if a module should be hidden on mobile
 */
export function isModuleHiddenOnMobile(moduleCode: string): boolean {
  return MOBILE_HIDDEN_MODULES.includes(moduleCode);
}

/**
 * Check if a specific tile within a module should be hidden on mobile
 */
export function isTileHiddenOnMobile(moduleBase: string, tilePath: string): boolean {
  const hiddenTiles = MOBILE_HIDDEN_TILES[moduleBase];
  if (!hiddenTiles) return false;
  return hiddenTiles.includes(tilePath);
}

/**
 * Filter module list for mobile visibility
 */
export function filterModulesForMobile(modules: string[]): string[] {
  return modules.filter(code => !MOBILE_HIDDEN_MODULES.includes(code));
}

/**
 * Feature flags for mobile UI elements
 */
export const MOBILE_UI_FLAGS = {
  /** Hide AreaPromoCard (advertising widgets) on mobile */
  hidePromoCards: true,
  /** Minimum touch target size in px */
  minTouchTarget: 44,
  /** Mobile bottom nav height in px */
  bottomNavHeight: 56,
} as const;
