/**
 * Golden Path Engine — Kern-Logik
 * 
 * Reine Funktionen ohne DB-Zugriff.
 * Die Engine evaluiert Steps gegen einen vorbereiteten Context (flags).
 */

import type {
  GoldenPathDefinition,
  GoldenPathContext,
  GoldenPathStep,
  StepEvaluation,
  StepPrecondition,
  StepCompletion,
} from '@/manifests/goldenPaths';
import { MOD_04_GOLDEN_PATH } from '@/manifests/goldenPaths';

// ═══════════════════════════════════════════════════════════════
// Registry
// ═══════════════════════════════════════════════════════════════

const GOLDEN_PATH_REGISTRY: Record<string, GoldenPathDefinition> = {
  'MOD-04': MOD_04_GOLDEN_PATH,
};

/**
 * Liefert die Golden-Path-Definition fuer ein Modul.
 */
export function getGoldenPath(moduleCode: string): GoldenPathDefinition | undefined {
  return GOLDEN_PATH_REGISTRY[moduleCode];
}

/**
 * Registriert alle bekannten Golden Paths.
 */
export function getAllGoldenPaths(): GoldenPathDefinition[] {
  return Object.values(GOLDEN_PATH_REGISTRY);
}

// ═══════════════════════════════════════════════════════════════
// Evaluation
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

/**
 * Prueft ob eine Route betreten werden darf.
 * Sucht den Step mit passendem routePattern und prueft Preconditions.
 */
export function canEnterRoute(
  gp: GoldenPathDefinition,
  routePattern: string,
  ctx: GoldenPathContext
): { allowed: boolean; redirectTo?: string; message?: string } {
  const step = gp.steps.find((s) => s.routePattern === routePattern);
  
  // Kein Step fuer diese Route definiert → kein Guard noetig
  if (!step) {
    return { allowed: true };
  }

  const evaluation = evaluateStep(step, ctx);
  
  if (evaluation.canEnter) {
    return { allowed: true };
  }

  // Finde den letzten erlaubten Step fuer Redirect
  const redirectStep = gp.steps
    .filter((s) => s.type === 'route' || s.type === 'action')
    .filter((s) => s.routePattern)
    .reverse()
    .find((s) => evaluateStep(s, ctx).canEnter);

  return {
    allowed: false,
    redirectTo: redirectStep?.routePattern ?? '/portal/immobilien/portfolio',
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
  
  // Finde den ersten Step der betreten werden kann aber noch nicht complete ist
  const next = evaluations.find((e) => e.canEnter && !e.isComplete);
  return next?.step;
}
