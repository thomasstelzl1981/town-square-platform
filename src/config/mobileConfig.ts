/**
 * MOBILE CONFIG — Central governance for mobile UI/UX
 * 
 * Controls which modules, features, and UI elements are visible on mobile.
 * This is the single source of truth for mobile visibility decisions.
 */

/**
 * Modules hidden on mobile devices.
 * These are either too complex for mobile, redundant (Armstrong handles them),
 * or role-gated partner/manager tools.
 */
export const MOBILE_HIDDEN_MODULES: string[] = [
  'MOD-02',  // KI Office — Armstrong handles email/calendar/contacts
  'MOD-05',  // Pets — activation-required niche module
  'MOD-09',  // Immomanager — partner-only, complex advisory UI
  'MOD-10',  // Lead Manager — partner-only, commission management
  'MOD-11',  // Finanzierungsmanager — role-gated, complex workbench
  'MOD-12',  // Akquisemanager — role-gated, mandate/object intake
  'MOD-14',  // Communication Pro — partner-only, serial emails/social
  'MOD-17',  // Fahrzeuge — activation-required niche module
];

/**
 * Modules that ARE visible on mobile (for reference/documentation):
 * - MOD-01: Stammdaten (profile, contracts — read-friendly)
 * - MOD-03: DMS/Dokumente (document inbox — essential)
 * - MOD-04: Immobilien/Portfolio (core feature)
 * - MOD-06: Verkauf (status checking)
 * - MOD-07: Finanzierung (self-disclosure status)
 * - MOD-08: Investment-Suche (PRIORITY — prominent mobile search)
 * - MOD-13: Projektmanager (dashboard, project overview)
 * - MOD-15: Fortbildung (courses, reading — mobile-friendly)
 * - MOD-16: Shop (external links — simple)
 * - MOD-18: Finanzen (overview, insurance)
 * - MOD-19: Photovoltaik (system status)
 */

/**
 * Check if a module should be hidden on mobile
 */
export function isModuleHiddenOnMobile(moduleCode: string): boolean {
  return MOBILE_HIDDEN_MODULES.includes(moduleCode);
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
