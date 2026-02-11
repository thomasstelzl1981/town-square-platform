/**
 * DEV-only: Golden Path Route Validator
 * 
 * Prueft beim App-Start, ob alle routePattern in den Golden-Path-Definitionen
 * gueltige Routen im routesManifest referenzieren.
 * 
 * Kein Produktions-Impact — nur console.error im DEV-Modus.
 */

import { getAllGoldenPaths } from './engine';
import { zone2Portal } from '@/manifests/routesManifest';

/**
 * Sammelt alle registrierten Route-Patterns aus dem routesManifest.
 */
function collectManifestRoutes(): Set<string> {
  const routes = new Set<string>();
  const modules = zone2Portal.modules ?? {};

  for (const [, moduleConfig] of Object.entries(modules)) {
    if (!moduleConfig || typeof moduleConfig !== 'object') continue;
    const config = moduleConfig as { base?: string; tiles?: Array<{ path: string }>; dynamic_routes?: Array<{ path: string }> };
    
    const base = config.base;
    if (!base) continue;

    // Tile routes
    for (const tile of config.tiles ?? []) {
      routes.add(`/portal/${base}/${tile.path}`);
    }

    // Dynamic routes
    for (const dr of config.dynamic_routes ?? []) {
      routes.add(`/portal/${base}/${dr.path}`);
    }
  }

  return routes;
}

/**
 * Normalisiert ein routePattern fuer den Vergleich.
 * z.B. '/portal/immobilien/:propertyId' → '/portal/immobilien/:id'
 */
function normalizePattern(pattern: string): string {
  // Ersetze alle :param Varianten durch ein einheitliches :id
  return pattern.replace(/:[a-zA-Z]+/g, ':id');
}

/**
 * Validiert alle Golden-Path-Definitionen gegen das routesManifest.
 * Nur im DEV-Modus aufrufen.
 */
export function validateGoldenPaths(): void {
  if (import.meta.env.PROD) return;

  const manifestRoutes = collectManifestRoutes();
  const normalizedManifest = new Set([...manifestRoutes].map(normalizePattern));
  const goldenPaths = getAllGoldenPaths();

  let hasErrors = false;

  for (const gp of goldenPaths) {
    for (const step of gp.steps) {
      if (!step.routePattern) continue;

      const normalized = normalizePattern(step.routePattern);
      
      // Pruefe ob das Pattern im Manifest vorkommt
      const found = normalizedManifest.has(normalized) || 
        // Sonderfall: Admin-Routen und Stammdaten-Routen sind nicht im Module-Manifest
        normalized.startsWith('/admin/') ||
        normalized.startsWith('/portal/stammdaten/');
      
      if (!found) {
        console.error(
          `[GoldenPath] ❌ Route-Mismatch in ${gp.moduleCode} Step "${step.id}":`,
          `\n  routePattern: "${step.routePattern}"`,
          `\n  Nicht gefunden im routesManifest.`,
          `\n  Verfuegbare Routen:`,
          [...manifestRoutes].filter((r) => r.includes(gp.moduleCode.replace('MOD-', '').toLowerCase()) || r.includes('immobilien'))
        );
        hasErrors = true;
      }
    }
  }

  if (!hasErrors) {
    console.info(
      `[GoldenPath] ✅ Alle ${goldenPaths.length} Golden Path(s) validiert — keine Route-Mismatches.`
    );
  }
}
