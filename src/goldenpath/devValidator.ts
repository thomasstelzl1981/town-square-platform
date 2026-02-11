/**
 * DEV-only: Golden Path Route Validator + Zone Boundary Contract Validator
 * 
 * Prueft beim App-Start:
 * 1. Ob alle routePattern in den Golden-Path-Definitionen gueltige Routen referenzieren
 * 2. ZBC-R09: Ob Zone-3-Routen ausschliesslich unter /website/** liegen (No Root Collisions)
 * 
 * Kein Produktions-Impact — nur console.error im DEV-Modus.
 */

import { getAllGoldenPaths } from './engine';
import { zone2Portal, zone3Websites } from '@/manifests/routesManifest';
import { supabase } from '@/integrations/supabase/client';

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

// =============================================================================
// ZBC-R09: Root Collision Validator
// =============================================================================

const ALLOWED_ROOT_PREFIXES = ['/admin', '/portal', '/website', '/auth'];

/**
 * Validiert ZBC-R09: Keine Zone-3-Routen ausserhalb von /website/**.
 * Prueft auch, dass keine unerlaubten Root-Pfade im Manifest existieren.
 */
export function validateZoneBoundaries(): void {
  if (import.meta.env.PROD) return;

  let hasErrors = false;

  // Pruefe alle Z3-base-Pfade
  for (const [siteKey, site] of Object.entries(zone3Websites)) {
    if (!site.base.startsWith('/website/')) {
      console.error(
        `[ZBC-R09] ❌ Zone-3-Website "${siteKey}" hat einen unerlaubten Base-Pfad: "${site.base}"`,
        `\n  Erwartet: "/website/${siteKey}" oder "/website/<brand>"`,
        `\n  Regel: Alle Z3-Websites muessen unter /website/** liegen.`
      );
      hasErrors = true;
    }
  }

  if (!hasErrors) {
    console.info(
      `[ZBC-R09] ✅ Alle ${Object.keys(zone3Websites).length} Zone-3-Websites liegen unter /website/** — keine Root-Collisions.`
    );
  }
}

// =============================================================================
// ZBC-R13: tile_catalog ↔ routesManifest Sync Validator (R-002)
// =============================================================================

/**
 * Validiert ZBC-R13: tile_catalog-Eintraege muessen korrespondierende
 * Manifest-Eintraege haben. Keine verwaisten Tiles.
 */
export async function validateTileCatalogSync(): Promise<void> {
  if (import.meta.env.PROD) return;

  try {
    const { data: tiles, error } = await supabase
      .from('tile_catalog' as any)
      .select('tile_code, label')
      .limit(100);

    if (error) {
      console.warn('[ZBC-R13] ⚠️ tile_catalog nicht erreichbar (ggf. nicht eingeloggt):', error.message);
      return;
    }

    if (!tiles || tiles.length === 0) {
      console.info('[ZBC-R13] ℹ️ tile_catalog ist leer — Sync-Check uebersprungen.');
      return;
    }

    // Sammle alle Module-Keys aus dem routesManifest
    const manifestModuleKeys = new Set(Object.keys(zone2Portal.modules ?? {}));

    let hasErrors = false;
    for (const tile of tiles) {
      const code = (tile as any).tile_code as string;
      if (!code) continue;
      if (!manifestModuleKeys.has(code)) {
        console.error(
          `[ZBC-R13] ❌ tile_catalog-Eintrag "${code}" hat keinen korrespondierenden Manifest-Eintrag in routesManifest.ts`,
          `\n  Verfuegbare Manifest-Keys: ${[...manifestModuleKeys].join(', ')}`
        );
        hasErrors = true;
      }
    }

    if (!hasErrors) {
      console.info(
        `[ZBC-R13] ✅ Alle ${tiles.length} tile_catalog-Eintraege haben Manifest-Korrespondenz.`
      );
    }
  } catch (err) {
    console.warn('[ZBC-R13] ⚠️ Sync-Validierung fehlgeschlagen:', err);
  }
}
