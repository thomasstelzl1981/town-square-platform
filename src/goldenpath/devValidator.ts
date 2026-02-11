/**
 * DEV-only: Golden Path Validator V1.1
 * 
 * Prueft beim App-Start:
 * 1. Route-Pattern Validation (bestehend)
 * 2. Guard-Registrierung
 * 3. Ledger-Event Validation
 * 4. ContractRef Backbone
 * 5. P0 Hardening: Fail-State Vollstaendigkeit
 */

import { getAllGoldenPaths } from './engine';
import { zone2Portal } from '@/manifests/routesManifest';
import { LEDGER_EVENT_WHITELIST } from '@/manifests/goldenPaths';
import type { ContractDirection } from '@/manifests/goldenPaths/types';

const ALLOWED_DIRECTIONS: ReadonlySet<ContractDirection> = new Set([
  'Z2->Z1', 'Z1->Z2', 'Z3->Z1', 'EXTERN->Z1',
]);

function collectManifestRoutes(): Set<string> {
  const routes = new Set<string>();
  const modules = zone2Portal.modules ?? {};
  for (const [, moduleConfig] of Object.entries(modules)) {
    if (!moduleConfig || typeof moduleConfig !== 'object') continue;
    const config = moduleConfig as { base?: string; tiles?: Array<{ path: string }>; dynamic_routes?: Array<{ path: string }> };
    const base = config.base;
    if (!base) continue;
    for (const tile of config.tiles ?? []) {
      routes.add(`/portal/${base}/${tile.path}`);
    }
    for (const dr of config.dynamic_routes ?? []) {
      routes.add(`/portal/${base}/${dr.path}`);
    }
  }
  return routes;
}

function collectGuardedModules(): Set<string> {
  const guarded = new Set<string>();
  const modules = zone2Portal.modules ?? {};
  for (const [, moduleConfig] of Object.entries(modules)) {
    if (!moduleConfig || typeof moduleConfig !== 'object') continue;
    const config = moduleConfig as { dynamic_routes?: Array<{ goldenPath?: { moduleCode: string } }> };
    for (const dr of config.dynamic_routes ?? []) {
      if (dr.goldenPath?.moduleCode) {
        guarded.add(dr.goldenPath.moduleCode);
      }
    }
  }
  return guarded;
}

function normalizePattern(pattern: string): string {
  return pattern.replace(/:[a-zA-Z]+/g, ':id');
}

export function validateGoldenPaths(): void {
  if (import.meta.env.PROD) return;

  const manifestRoutes = collectManifestRoutes();
  const normalizedManifest = new Set([...manifestRoutes].map(normalizePattern));
  const guardedModules = collectGuardedModules();
  const goldenPaths = getAllGoldenPaths();

  let hasErrors = false;
  let hasWarnings = false;

  for (const gp of goldenPaths) {
    // ═══════════════════════════════════════════════════════════
    // 1. Route-Pattern Validation
    // ═══════════════════════════════════════════════════════════
    for (const step of gp.steps) {
      if (!step.routePattern) continue;
      const normalized = normalizePattern(step.routePattern);
      const found = normalizedManifest.has(normalized) ||
        normalized.startsWith('/admin/') ||
        normalized.startsWith('/portal/stammdaten/');
      if (!found) {
        console.error(
          `[GoldenPath] ❌ Route-Mismatch in ${gp.moduleCode} Step "${step.id}":`,
          `\n  routePattern: "${step.routePattern}"`,
          `\n  Nicht gefunden im routesManifest.`,
        );
        hasErrors = true;
      }
    }

    // ═══════════════════════════════════════════════════════════
    // 2. Guard-Registrierung
    // ═══════════════════════════════════════════════════════════
    const hasRouteSteps = gp.steps.some((s) => s.type === 'route' || (s.type === 'action' && s.routePattern));
    if (hasRouteSteps && !guardedModules.has(gp.moduleCode)) {
      console.warn(
        `[GoldenPath] ⚠️ GP "${gp.moduleCode}" hat Route-Steps aber KEINE Route im Manifest mit goldenPath.moduleCode="${gp.moduleCode}" registriert.`,
        '\n  Guard wird nicht automatisch angewendet.',
      );
      hasWarnings = true;
    }

    // ═══════════════════════════════════════════════════════════
    // 3. Ledger-Event Validation
    // ═══════════════════════════════════════════════════════════
    for (const event of gp.ledger_events ?? []) {
      if (!LEDGER_EVENT_WHITELIST.has(event.event_type)) {
        console.error(
          `[GoldenPath] ❌ Ledger-Event "${event.event_type}" in ${gp.moduleCode}`,
          `ist NICHT in der data_event_ledger Whitelist.`,
        );
        hasErrors = true;
      }
    }

    // ═══════════════════════════════════════════════════════════
    // 4. ContractRef Backbone Validation
    // ═══════════════════════════════════════════════════════════
    for (const step of gp.steps) {
      if (!step.contract_refs) continue;
      for (const ref of step.contract_refs) {
        if (!ALLOWED_DIRECTIONS.has(ref.direction)) {
          console.error(
            `[GoldenPath] ❌ BACKBONE VIOLATION in ${gp.moduleCode} Step "${step.id}":`,
            `\n  ContractRef "${ref.key}" hat direction "${ref.direction}"`,
            `\n  Erlaubt: ${[...ALLOWED_DIRECTIONS].join(', ')}`,
            `\n  Cross-Zone Kommunikation MUSS über Zone 1 laufen!`,
          );
          hasErrors = true;
        }
        if (!ref.correlation_keys || ref.correlation_keys.length === 0) {
          console.warn(
            `[GoldenPath] ⚠️ ContractRef "${ref.key}" in ${gp.moduleCode} Step "${step.id}" hat keine correlation_keys.`,
          );
          hasWarnings = true;
        }
      }
    }

    // ═══════════════════════════════════════════════════════════
    // 5. P0 Hardening: Fail-State Vollstaendigkeit
    // ═══════════════════════════════════════════════════════════
    for (const step of gp.steps) {
      const needsFailState = 
        (step.contract_refs && step.contract_refs.length > 0) ||
        step.task_kind === 'wait_message';

      if (!needsFailState) continue;

      if (!step.on_timeout) {
        console.error(
          `[GoldenPath] ❌ FAIL-STATE MISSING in ${gp.moduleCode} Step "${step.id}":`,
          `\n  Step hat contract_refs oder task_kind=wait_message aber KEIN on_timeout definiert.`,
        );
        hasErrors = true;
      }

      if (!step.on_error) {
        console.error(
          `[GoldenPath] ❌ FAIL-STATE MISSING in ${gp.moduleCode} Step "${step.id}":`,
          `\n  Step hat contract_refs oder task_kind=wait_message aber KEIN on_error definiert.`,
        );
        hasErrors = true;
      }

      // Validate fail-state ledger events are in whitelist
      const failStates = [step.on_timeout, step.on_rejected, step.on_duplicate, step.on_error].filter(Boolean);
      for (const fs of failStates) {
        if (fs && !LEDGER_EVENT_WHITELIST.has(fs.ledger_event)) {
          console.error(
            `[GoldenPath] ❌ Fail-State Ledger-Event "${fs.ledger_event}" in ${gp.moduleCode} Step "${step.id}"`,
            `ist NICHT in der Whitelist.`,
          );
          hasErrors = true;
        }
      }
    }
  }

  // Summary
  if (!hasErrors && !hasWarnings) {
    console.info(
      `[GoldenPath] ✅ Alle ${goldenPaths.length} Golden Path(s) validiert — keine Fehler.`
    );
  } else if (!hasErrors) {
    console.info(
      `[GoldenPath] ✅ ${goldenPaths.length} Golden Path(s) validiert — nur Warnings.`
    );
  }
}
