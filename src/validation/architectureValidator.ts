/**
 * Architecture Validators — DEV-only
 * 
 * Architektonische Validierungen, die beim App-Start im DEV-Modus laufen:
 * 1. ZBC-R09: Zone-Boundary-Checks (keine Root-Collisions)
 * 2. ZBC-R13: tile_catalog ↔ routesManifest Sync
 * 3. ZBC-R10: Contract-Coverage (jede Edge Function mit Cross-Zone-Charakter)
 * 4. SBC: Storage Boundary Contract Checks
 * 5. GTC: Golden Tenant Contract / Data Hygiene Checks
 * 
 * Kein Produktions-Impact — nur console.error/info im DEV-Modus.
 */

import { zone2Portal, zone3Websites } from '@/manifests/routesManifest';
import { supabase } from '@/integrations/supabase/client';

// =============================================================================
// ZBC-R09: Root Collision Validator
// =============================================================================

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
// ZBC-R13: tile_catalog ↔ routesManifest Sync Validator
// =============================================================================

export async function validateTileCatalogSync(): Promise<void> {
  if (import.meta.env.PROD) return;

  try {
    const { data: tiles, error } = await supabase
      .from('tile_catalog' as any)
      .select('tile_code, title')
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

const PRIVATE_BUCKETS = [
  'tenant-documents',
  'acq-documents',
  'project-documents',
  'audit-reports',
];

const FROZEN_BUCKETS = ['documents'];

export function validateStorageBoundaries(): void {
  if (import.meta.env.PROD) return;

  console.info(
    `[SBC-R01] ℹ️ Private Buckets (getPublicUrl verboten): ${PRIVATE_BUCKETS.join(', ')}`,
    `\n[SBC-R08] ℹ️ Frozen Buckets (kein Upload): ${FROZEN_BUCKETS.join(', ')}`,
    `\n[SBC-R04] ℹ️ Audit-Events: document.view, document.download, grant.created, grant.revoked`
  );
}

// =============================================================================
// GTC: Golden Tenant Contract — Tenant Hygiene Checks
// =============================================================================

export function validateTenantHygiene(): void {
  if (import.meta.env.PROD) return;

  const forceDevTenant = import.meta.env.VITE_FORCE_DEV_TENANT === 'true';

  console.info(
    `[GTC] ℹ️ Tenant Hygiene Status:`,
    `\n  VITE_FORCE_DEV_TENANT: ${forceDevTenant ? '✅ AKTIV (Dev-Bypass enabled)' : '❌ INAKTIV (Login erforderlich)'}`,
  );

  // Dynamically check demo data registry
  import('@/config/demoDataRegistry').then(({ DEMO_DATA_SOURCES }) => {
    const hardcoded = DEMO_DATA_SOURCES.filter(s => s.type === 'hardcoded');
    const fallback = DEMO_DATA_SOURCES.filter(s => s.type === 'fallback');
    const seeds = DEMO_DATA_SOURCES.filter(s => s.type === 'seed_rpc');

    console.info(
      `[GTC] ℹ️ Demo-Daten-Registry: ${DEMO_DATA_SOURCES.length} Quellen registriert`,
      `\n  Hardcoded: ${hardcoded.length} (${hardcoded.map(s => s.module).join(', ')})`,
      `\n  Fallback: ${fallback.length} (${fallback.map(s => s.module).join(', ')})`,
      `\n  Seed RPC: ${seeds.length}`,
    );
  }).catch(() => {
    console.warn('[GTC] ⚠️ demoDataRegistry nicht ladbar');
  });
}
