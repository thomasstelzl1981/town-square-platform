/**
 * Manifest-Driven Route Tests
 * 
 * Auto-generates test cases from routesManifest.ts (SSOT)
 * Validates: Route existence, Legacy redirects, Parameter preservation
 * 
 * UPDATED: 2026-02-18 — Synchronized with current manifest state
 */

import { describe, it, expect } from 'vitest';
import {
  zone1Admin,
  zone2Portal,
  zone3Websites,
  legacyRoutes,
  specialRoutes,
  getModulesSorted,
} from '@/manifests/routesManifest';

// =============================================================================
// ZONE 1: ADMIN ROUTES
// =============================================================================
describe('Zone 1: Admin Routes', () => {
  it('should have admin base path defined', () => {
    expect(zone1Admin.base).toBe('/admin');
    expect(zone1Admin.layout).toBe('AdminLayout');
  });

  it('should have required admin routes', () => {
    const adminPaths = zone1Admin.routes?.map(r => r.path) || [];
    expect(adminPaths).toContain('');
    expect(adminPaths).toContain('organizations');
    expect(adminPaths).toContain('users');
    expect(adminPaths).toContain('delegations');
    expect(adminPaths).toContain('audit');
  });

  it('should have FutureRoom sub-routes', () => {
    const adminPaths = zone1Admin.routes?.map(r => r.path) || [];
    expect(adminPaths).toContain('futureroom');
    expect(adminPaths).toContain('futureroom/bankkontakte');
    expect(adminPaths).toContain('futureroom/finanzierungsmanager');
  });

  it('should have new Zone 1 desks', () => {
    const adminPaths = zone1Admin.routes?.map(r => r.path) || [];
    expect(adminPaths).toContain('acquiary');
    expect(adminPaths).toContain('sales-desk');
    expect(adminPaths).toContain('finance-desk');
  });

  it('should require platform_admin role', () => {
    expect(zone1Admin.requires_role).toContain('platform_admin');
  });
});

// =============================================================================
// ZONE 2: PORTAL MODULES
// =============================================================================
describe('Zone 2: Portal Modules', () => {
  it('should have portal base path defined', () => {
    expect(zone2Portal.base).toBe('/portal');
    expect(zone2Portal.layout).toBe('PortalLayout');
  });

  it('should have portal dashboard', () => {
    expect(zone2Portal.dashboard).toBeDefined();
    expect(zone2Portal.dashboard?.path).toBe('');
    expect(zone2Portal.dashboard?.component).toBe('PortalDashboard');
  });

  it('should have 23 modules (MOD-00 to MOD-22, excl. MOD-21 hidden but active)', () => {
    const modules = Object.keys(zone2Portal.modules || {});
    expect(modules.length).toBe(23);
  });

  it('should have modules sorted by display_order ascending', () => {
    const sorted = getModulesSorted();
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].module.display_order).toBeGreaterThan(sorted[i - 1].module.display_order);
    }
  });

  // Current tile counts per manifest (2026-02-18)
  const expectedTileCounts: Record<string, number> = {
    'MOD-00': 0,
    'MOD-01': 5,
    'MOD-02': 7,
    'MOD-03': 5,
    'MOD-04': 4,
    'MOD-05': 4,
    'MOD-06': 4,
    'MOD-07': 5,
    'MOD-08': 4,
    'MOD-09': 5,
    'MOD-10': 5,
    'MOD-11': 5,
    'MOD-12': 6,
    'MOD-13': 6,
    'MOD-14': 4,
    'MOD-15': 4,
    'MOD-16': 5,
    'MOD-17': 4,
    'MOD-18': 9,
    'MOD-19': 4,
    'MOD-20': 4,
    'MOD-21': 5,
    'MOD-22': 7,
  };

  describe('Tile Counts', () => {
    const modules = Object.entries(zone2Portal.modules || {});
    modules.forEach(([code, module]) => {
      const expected = expectedTileCounts[code];
      if (expected !== undefined) {
        it(`${code} (${module.name}) should have ${expected} tiles`, () => {
          expect(module.tiles.length).toBe(expected);
        });
      }
    });
  });

  describe('Module Definitions', () => {
    const modules = Object.entries(zone2Portal.modules || {});
    modules.forEach(([code, module]) => {
      it(`${code} should have required properties`, () => {
        expect(module.name).toBeDefined();
        expect(module.base).toBeDefined();
        expect(module.icon).toBeDefined();
        expect(module.display_order).toBeGreaterThanOrEqual(0);
        expect(module.visibility).toBeDefined();
        expect(module.visibility.org_types).toBeDefined();
        expect(Array.isArray(module.tiles)).toBe(true);
      });
    });
  });
});

// =============================================================================
// ZONE 3: WEBSITES
// =============================================================================
describe('Zone 3: Websites', () => {
  it('should have 8 website definitions', () => {
    expect(Object.keys(zone3Websites).length).toBe(8);
  });

  it('should have Kaufy website', () => {
    expect(zone3Websites.kaufy).toBeDefined();
    expect(zone3Websites.kaufy.base).toBe('/website/kaufy');
    expect(zone3Websites.kaufy.layout).toBe('Kaufy2026Layout');
  });

  it('should have FutureRoom website', () => {
    expect(zone3Websites.futureroom).toBeDefined();
    expect(zone3Websites.futureroom.base).toBe('/website/futureroom');
  });

  it('should have SOT website', () => {
    expect(zone3Websites.sot).toBeDefined();
    expect(zone3Websites.sot.base).toBe('/website/sot');
  });

  it('should have Acquiary website', () => {
    expect(zone3Websites.acquiary).toBeDefined();
    expect(zone3Websites.acquiary.base).toBe('/website/acquiary');
    expect(zone3Websites.acquiary.layout).toBe('AcquiaryLayout');
  });

  it('should have Lennox website', () => {
    expect(zone3Websites.lennox).toBeDefined();
    expect(zone3Websites.lennox.base).toBe('/website/tierservice');
    expect(zone3Websites.lennox.layout).toBe('LennoxLayout');
  });
});

// =============================================================================
// LEGACY REDIRECTS
// =============================================================================
describe('Legacy Redirects', () => {
  it('should have legacy routes defined', () => {
    expect(Array.isArray(legacyRoutes)).toBe(true);
    expect(legacyRoutes.length).toBeGreaterThan(0);
  });

  it('should preserve parameters in redirects', () => {
    const portfolioIdRedirect = legacyRoutes.find(r => r.path === '/portfolio/:id');
    expect(portfolioIdRedirect).toBeDefined();
    expect(portfolioIdRedirect?.redirect_to).toBe('/portal/immobilien/:id');
  });

  it('should redirect /portfolio to /portal/immobilien/portfolio', () => {
    const portfolioRedirect = legacyRoutes.find(r => r.path === '/portfolio');
    expect(portfolioRedirect?.redirect_to).toBe('/portal/immobilien/portfolio');
  });

  describe('All legacy routes should have valid redirects', () => {
    legacyRoutes.forEach((route) => {
      it(`${route.path} → ${route.redirect_to}`, () => {
        expect(route.redirect_to).toBeDefined();
        expect(route.redirect_to.startsWith('/')).toBe(true);
        expect(route.reason).toBeDefined();
      });
    });
  });
});

// =============================================================================
// SPECIAL ROUTES
// =============================================================================
describe('Special Routes', () => {
  it('should have root redirect', () => {
    const rootRoute = specialRoutes.find(r => r.path === '/');
    expect(rootRoute?.redirect_to).toBe('/portal');
  });

  it('should have auth route', () => {
    const authRoute = specialRoutes.find(r => r.path === '/auth');
    expect(authRoute?.component).toBe('Auth');
    expect(authRoute?.public).toBe(true);
  });

  it('should have hidden presentation route', () => {
    const presentationRoute = specialRoutes.find(r => r.path?.includes('presentation'));
    expect(presentationRoute?.hidden).toBe(true);
  });
});

// =============================================================================
// ROUTE COUNT VALIDATION
// =============================================================================
describe('Route Counts', () => {
  it('should calculate total Zone 1 routes', () => {
    const z1Count = zone1Admin.routes?.length || 0;
    expect(z1Count).toBeGreaterThan(20);
  });

  it('should calculate total Zone 2 tile routes', () => {
    const modules = Object.values(zone2Portal.modules || {});
    const tileCount = modules.reduce((sum, m) => sum + m.tiles.length, 0);
    // Sum of all tile counts from expectedTileCounts (updated: MOD-01=5, MOD-13=6)
    expect(tileCount).toBe(111);
  });

  it('should calculate total Zone 3 routes', () => {
    const z3Count = Object.values(zone3Websites).reduce(
      (sum, w) => sum + w.routes.length,
      0
    );
    expect(z3Count).toBeGreaterThan(20);
  });
});
