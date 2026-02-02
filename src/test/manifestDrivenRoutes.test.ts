/**
 * Manifest-Driven Route Tests
 * 
 * Auto-generates test cases from routesManifest.ts (SSOT)
 * Validates: Route existence, Legacy redirects, Parameter preservation
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
    
    // Core admin routes
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
    
    // Agents
    expect(adminPaths).toContain('agents');
    expect(adminPaths).toContain('agents/catalog');
    
    // Acquiary
    expect(adminPaths).toContain('acquiary');
    
    // Sales Desk
    expect(adminPaths).toContain('sales-desk');
    
    // Finance Desk
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

  it('should have exactly 20 modules', () => {
    const modules = Object.keys(zone2Portal.modules || {});
    expect(modules.length).toBe(20);
  });

  it('should have modules sorted by display_order 1-20', () => {
    const sorted = getModulesSorted();
    sorted.forEach((item, index) => {
      expect(item.module.display_order).toBe(index + 1);
    });
  });

  describe('4-Tile Pattern', () => {
    const modules = Object.entries(zone2Portal.modules || {});
    
    modules.forEach(([code, module]) => {
      if (code === 'MOD-20') {
        it(`${code} (Miety) should have exactly 6 tiles (exception)`, () => {
          expect(module.tiles.length).toBe(6);
        });
      } else {
        it(`${code} (${module.name}) should have exactly 4 tiles`, () => {
          expect(module.tiles.length).toBe(4);
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
        expect(module.display_order).toBeGreaterThan(0);
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
  it('should have 4 website definitions', () => {
    expect(Object.keys(zone3Websites).length).toBe(4);
  });

  it('should have Kaufy website', () => {
    expect(zone3Websites.kaufy).toBeDefined();
    expect(zone3Websites.kaufy.base).toBe('/kaufy');
    expect(zone3Websites.kaufy.layout).toBe('KaufyLayout');
  });

  it('should have Miety website', () => {
    expect(zone3Websites.miety).toBeDefined();
    expect(zone3Websites.miety.base).toBe('/miety');
  });

  it('should have FutureRoom website', () => {
    expect(zone3Websites.futureroom).toBeDefined();
    expect(zone3Websites.futureroom.base).toBe('/futureroom');
  });

  it('should have SOT website', () => {
    expect(zone3Websites.sot).toBeDefined();
    expect(zone3Websites.sot.base).toBe('/sot');
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
    expect(z1Count).toBeGreaterThan(20); // At least 20+ admin routes
  });

  it('should calculate total Zone 2 tile routes', () => {
    const modules = Object.values(zone2Portal.modules || {});
    const tileCount = modules.reduce((sum, m) => sum + m.tiles.length, 0);
    expect(tileCount).toBe(82); // 19 modules * 4 tiles + 1 module * 6 tiles = 82
  });

  it('should calculate total Zone 3 routes', () => {
    const z3Count = Object.values(zone3Websites).reduce(
      (sum, w) => sum + w.routes.length,
      0
    );
    expect(z3Count).toBeGreaterThan(20); // At least 20+ website routes
  });
});
