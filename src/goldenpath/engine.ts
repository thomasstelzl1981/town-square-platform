/**
 * Golden Path Engine V1.0 — Kern-Logik
 * 
 * Reine Funktionen ohne DB-Zugriff.
 * Registry-basiert: Module registrieren sich via registerGoldenPath().
 * Camunda-Ready: validateNoDirectCross() erzwingt Backbone-Regel.
 */

import type {
  GoldenPathDefinition,
  GoldenPathContext,
  GoldenPathStep,
  StepEvaluation,
  StepPrecondition,
  StepCompletion,
  PhaseEvaluation,
  PreconditionResult,
  ContractResult,
  BackboneValidationResult,
  ContractDirection,
} from '@/manifests/goldenPaths/types';

// ═══════════════════════════════════════════════════════════════
// Registry (dynamisch, kein Import von Definitionen)
// ═══════════════════════════════════════════════════════════════

const GOLDEN_PATH_REGISTRY: Record<string, GoldenPathDefinition> = {};

const ALLOWED_DIRECTIONS: ReadonlySet<ContractDirection> = new Set([
  'Z2->Z1', 'Z1->Z2', 'Z3->Z1', 'EXTERN->Z1',
]);

/**
 * Registriert eine Golden-Path-Definition.
 * Aufgerufen aus src/manifests/goldenPaths/index.ts.
 */
export function registerGoldenPath(moduleCode: string, gp: GoldenPathDefinition): void {
  GOLDEN_PATH_REGISTRY[moduleCode] = gp;
}

/**
 * Liefert die Golden-Path-Definition fuer ein Modul.
 */
export function getGoldenPath(moduleCode: string): GoldenPathDefinition | undefined {
  return GOLDEN_PATH_REGISTRY[moduleCode];
}

/**
 * Liefert alle registrierten Golden Paths.
 */
export function getAllGoldenPaths(): GoldenPathDefinition[] {
  return Object.values(GOLDEN_PATH_REGISTRY);
}

// ═══════════════════════════════════════════════════════════════
// Step Evaluation (bestehend)
// ═══════════════════════════════════════════════════════════════

function evaluatePrecondition(pre: StepPrecondition, ctx: GoldenPathContext): boolean {
  return ctx.flags[pre.key] === true;
}

function evaluateCompletion(comp: StepCompletion, ctx: GoldenPathContext): boolean {
  return ctx.flags[comp.key] === true;
}

/**
 * Evaluiert einen einzelnen Step gegen den Context.
 */
export function evaluateStep(step: GoldenPathStep, ctx: GoldenPathContext): StepEvaluation {
  const failedPreconditions = (step.preconditions ?? []).filter(
    (p) => !evaluatePrecondition(p, ctx)
  );
  const failedCompletions = (step.completion ?? []).filter(
    (c) => !evaluateCompletion(c, ctx)
  );

  return {
    step,
    canEnter: failedPreconditions.length === 0,
    isComplete: (step.completion ?? []).length > 0 ? failedCompletions.length === 0 : false,
    failedPreconditions,
    failedCompletions,
  };
}

/**
 * Evaluiert alle Steps eines Golden Path.
 */
export function evaluateGoldenPath(
  gp: GoldenPathDefinition,
  ctx: GoldenPathContext
): StepEvaluation[] {
  return gp.steps.map((step) => evaluateStep(step, ctx));
}

// ═══════════════════════════════════════════════════════════════
// V1.0: Neue Pure Functions
// ═══════════════════════════════════════════════════════════════

/**
 * Evaluiert eine Phase (alle Steps mit gleicher phase-Nummer).
 */
export function evaluatePhase(
  gp: GoldenPathDefinition,
  phaseNumber: number,
  ctx: GoldenPathContext
): PhaseEvaluation {
  const phaseSteps = gp.steps.filter((s) => s.phase === phaseNumber);
  const evaluations = phaseSteps.map((s) => evaluateStep(s, ctx));

  return {
    phase: phaseNumber,
    steps: evaluations,
    allComplete: evaluations.length > 0 && evaluations.every((e) => e.isComplete),
    canEnter: evaluations.length > 0 && evaluations.every((e) => e.canEnter),
  };
}

/**
 * Prueft ob alle required_entities im Context vorhanden sind.
 * Mapping: entity.scope → ctx.flags lookup.
 */
export function checkPreconditions(
  gp: GoldenPathDefinition,
  ctx: GoldenPathContext
): PreconditionResult {
  const missing = gp.required_entities.filter((entity) => {
    // Pruefe ob die Entity-bezogenen Flags gesetzt sind
    // Convention: Flag-Name ist "<table>_exists" oder direkt im context
    const flagKey = `${entity.table.replace(/s$/, '')}_exists`;
    // Check multiple possible flag patterns
    return !(ctx.flags[flagKey] === true || ctx.flags[`${entity.table}_exists`] === true);
  });

  return {
    met: missing.length === 0,
    missingEntities: missing,
  };
}

/**
 * Prueft ob alle required_contracts erfuellt sind.
 */
export function checkContracts(
  gp: GoldenPathDefinition,
  ctx: GoldenPathContext
): ContractResult {
  const missing = gp.required_contracts.filter((contract) => {
    return ctx.flags[contract.key] !== true;
  });

  return {
    met: missing.length === 0,
    missingContracts: missing,
  };
}

/**
 * Bestimmt den naechsten nicht-abgeschlossenen Step.
 * Alias fuer nextStep() — API-Konsistenz.
 */
export function getNextStep(
  gp: GoldenPathDefinition,
  ctx: GoldenPathContext
): GoldenPathStep | undefined {
  return nextStep(gp, ctx);
}

/**
 * Prueft ob der success_state erreicht ist.
 */
export function isCompleted(
  gp: GoldenPathDefinition,
  ctx: GoldenPathContext
): boolean {
  return gp.success_state.required_flags.every(
    (flag) => ctx.flags[flag] === true
  );
}

/**
 * Backbone Guardrail: Validiert dass contract_refs keine verbotenen Richtungen enthalten.
 * Kein throw — liefert {allowed: false} bei Verstoß.
 */
export function validateNoDirectCross(
  contractRefs: GoldenPathStep['contract_refs'],
  failureRedirect?: string
): BackboneValidationResult {
  if (!contractRefs || contractRefs.length === 0) {
    return { allowed: true };
  }

  for (const ref of contractRefs) {
    if (!ALLOWED_DIRECTIONS.has(ref.direction)) {
      return {
        allowed: false,
        message: `Cross-zone must go through Zone 1. Invalid direction: "${ref.direction}" on contract "${ref.key}"`,
        redirectTo: failureRedirect,
      };
    }
  }

  return { allowed: true };
}

// ═══════════════════════════════════════════════════════════════
// Bestehende Public API (abwaertskompatibel)
// ═══════════════════════════════════════════════════════════════

/**
 * Prueft ob eine Route betreten werden darf.
 */
export function canEnterRoute(
  gp: GoldenPathDefinition,
  routePattern: string,
  ctx: GoldenPathContext
): { allowed: boolean; redirectTo?: string; message?: string } {
  const step = gp.steps.find((s) => s.routePattern === routePattern);

  if (!step) {
    return { allowed: true };
  }

  // Backbone-Check fuer contract_refs
  const backboneResult = validateNoDirectCross(step.contract_refs, gp.failure_redirect);
  if (!backboneResult.allowed) {
    return backboneResult;
  }

  const evaluation = evaluateStep(step, ctx);

  if (evaluation.canEnter) {
    return { allowed: true };
  }

  const redirectStep = gp.steps
    .filter((s) => s.type === 'route' || s.type === 'action')
    .filter((s) => s.routePattern)
    .reverse()
    .find((s) => evaluateStep(s, ctx).canEnter);

  return {
    allowed: false,
    redirectTo: redirectStep?.routePattern ?? gp.failure_redirect,
    message: `Voraussetzung nicht erfuellt: ${evaluation.failedPreconditions
      .map((p) => p.description)
      .join(', ')}`,
  };
}

/**
 * Prueft ob eine Action ausgefuehrt werden darf.
 */
export function canRunAction(
  gp: GoldenPathDefinition,
  actionId: string,
  ctx: GoldenPathContext
): { allowed: boolean; message?: string } {
  const step = gp.steps.find((s) => s.id === actionId);

  if (!step) {
    return { allowed: true };
  }

  const evaluation = evaluateStep(step, ctx);

  if (evaluation.canEnter) {
    return { allowed: true };
  }

  return {
    allowed: false,
    message: evaluation.failedPreconditions.map((p) => p.description).join(', '),
  };
}

/**
 * Bestimmt den naechsten nicht-abgeschlossenen Step.
 */
export function nextStep(
  gp: GoldenPathDefinition,
  ctx: GoldenPathContext
): GoldenPathStep | undefined {
  const evaluations = evaluateGoldenPath(gp, ctx);
  const next = evaluations.find((e) => e.canEnter && !e.isComplete);
  return next?.step;
}
