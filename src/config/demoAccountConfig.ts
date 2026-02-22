/**
 * Demo Account Configuration
 * 
 * Credentials are intentionally stored client-side.
 * The demo account is read-only (viewer role) and contains only demo data.
 * This is an accepted tradeoff for a frictionless demo experience.
 */

export const DEMO_EMAIL = 'demo@systemofatown.com';
export const DEMO_PASSWORD = 'DemoSoT2026!public';

/** Demo tenant ID (Golden Tenant) */
export const DEMO_TENANT_ID = 'a0000000-0000-4000-a000-000000000001';

/** Areas hidden in demo mode */
export const DEMO_HIDDEN_AREAS = ['operations'] as const;

/** Check if the current user is the demo account */
export function isDemoSession(userEmail?: string | null): boolean {
  if (!userEmail) {
    // Fallback: check sessionStorage
    try {
      return sessionStorage.getItem('demo_mode') === 'true';
    } catch {
      return false;
    }
  }
  return userEmail === DEMO_EMAIL;
}

/** Mark current session as demo */
export function setDemoSessionFlag(active: boolean): void {
  try {
    if (active) {
      sessionStorage.setItem('demo_mode', 'true');
    } else {
      sessionStorage.removeItem('demo_mode');
    }
  } catch {
    // ignore
  }
}
