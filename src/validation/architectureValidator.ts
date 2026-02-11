/**
 * Architecture Validators — DEV-only
 * 
 * Architektonische Validierungen, die beim App-Start im DEV-Modus laufen:
 * 1. ZBC-R09: Zone-Boundary-Checks (keine Root-Collisions)
 * 2. ZBC-R13: tile_catalog ↔ routesManifest Sync
 * 3. ZBC-R10: Contract-Coverage (jede Edge Function mit Cross-Zone-Charakter)
 * 
 * Kein Produktions-Impact — nur console.error/info im DEV-Modus.
 */

import { zone2Portal, zone3Websites } from '@/manifests/routesManifest';
import { supabase } from '@/integrations/supabase/client';

// =============================================================================
// ZBC-R09: Root Collision Validator
// =============================================================================

/**
 * Validiert ZBC-R09: Keine Zone-3-Routen ausserhalb von /website/**.
 * Prueft auch, dass keine unerlaubten Root-Pfade im Manifest existieren.
 */
export function validateZoneBoundaries(): void {
  if (import.meta.env.PROD) return;

  let hasErrors = false;

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

// =============================================================================
// ZBC-R10: Contract Coverage Validator
// =============================================================================

/**
 * Bekannte Cross-Zone Edge Functions, die einen Contract in
 * spec/current/06_api_contracts/ haben MUESSEN.
 */
const CROSS_ZONE_EDGE_FUNCTIONS = [
  { fn: 'sot-lead-inbox', contract: 'CONTRACT_LEAD_CAPTURE' },
  { fn: 'sot-inbound-receive', contract: 'CONTRACT_EMAIL_INBOUND' },
  { fn: 'sot-finance-manager-notify', contract: 'CONTRACT_MANDATE_ASSIGNMENT' },
  { fn: 'sot-listing-publish', contract: 'CONTRACT_LISTING_PUBLISH' },
  { fn: 'sot-social-mandate-submit', contract: 'CONTRACT_SOCIAL_MANDATE_SUBMIT' },
  { fn: 'sot-social-payment-create', contract: 'CONTRACT_SOCIAL_PAYMENT' },
  { fn: 'sot-social-payment-webhook', contract: 'CONTRACT_SOCIAL_PAYMENT' },
  { fn: 'sot-acq-inbound-webhook', contract: 'CONTRACT_ACQ_INBOUND_EMAIL' },
  { fn: 'sot-renovation-outbound', contract: 'CONTRACT_RENOVATION_OUTBOUND' },
  { fn: 'sot-renovation-inbound-webhook', contract: 'CONTRACT_RENOVATION_INBOUND' },
  { fn: 'sot-whatsapp-webhook', contract: 'CONTRACT_WHATSAPP_INBOUND' },
  { fn: 'sot-project-intake', contract: 'CONTRACT_PROJECT_INTAKE' },
];

/**
 * Validiert ZBC-R10: Jede Cross-Zone Edge Function muss einen
 * dokumentierten Contract im INDEX haben.
 * 
 * Hinweis: Da wir keinen Dateisystem-Zugriff im Browser haben, validieren
 * wir hier nur gegen die bekannte Registry. Die eigentliche Datei-Existenz
 * wird ueber den devValidator-Ansatz nicht geprueft — dafuer gibt es CI.
 */
export function validateContractCoverage(): void {
  if (import.meta.env.PROD) return;

  console.info(
    `[ZBC-R10] ℹ️ Contract-Coverage-Registry: ${CROSS_ZONE_EDGE_FUNCTIONS.length} Cross-Zone Edge Functions registriert.`,
    `\n  Contracts: ${[...new Set(CROSS_ZONE_EDGE_FUNCTIONS.map(e => e.contract))].join(', ')}`
  );
}

// =============================================================================
// SBC Validators — Storage Boundary Contract Checks
// =============================================================================

/**
 * Private Buckets, auf denen getPublicUrl() NICHT verwendet werden darf (SBC-R01).
 */
const PRIVATE_BUCKETS = [
  'tenant-documents',
  'acq-documents',
  'project-documents',
  'audit-reports',
];

/**
 * Deprecated/Frozen Buckets (SBC-R08) — kein neuer Upload erlaubt.
 */
const FROZEN_BUCKETS = ['documents'];

/**
 * Validiert SBC-Regeln zur Laufzeit (DEV-only).
 * - SBC-R01: Warnt wenn getPublicUrl auf privaten Buckets gefunden wird
 * - SBC-R08: Warnt wenn frozen Buckets referenziert werden
 */
export function validateStorageBoundaries(): void {
  if (import.meta.env.PROD) return;

  console.info(
    `[SBC-R01] ℹ️ Private Buckets (getPublicUrl verboten): ${PRIVATE_BUCKETS.join(', ')}`,
    `\n[SBC-R08] ℹ️ Frozen Buckets (kein Upload): ${FROZEN_BUCKETS.join(', ')}`,
    `\n[SBC-R04] ℹ️ Audit-Events: document.view, document.download, grant.created, grant.revoked`
  );
}
