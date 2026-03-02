/**
 * Shared Controller Conventions — SSOT for cross-controller patterns
 * 
 * Universal constants shared by TLC, SLC, FLC, FDC.
 * Individual controllers re-export or extend these as needed.
 * 
 * @version 1.0.0
 */

// ─── Universal Actor Types ───────────────────────────────────
// All four controllers MUST support at least these actor types.
export const CONTROLLER_ACTOR_TYPES = {
  USER: 'user',
  SYSTEM: 'system',
  CRON: 'cron',
  EDGE_FN: 'edge_fn',
} as const;

export type ControllerActorType = typeof CONTROLLER_ACTOR_TYPES[keyof typeof CONTROLLER_ACTOR_TYPES];

// ─── Universal Action/Task Status Model ──────────────────────
// All controllers with repair actions or tasks MUST use this status set.
export const CONTROLLER_ACTION_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  SUPPRESSED: 'suppressed',
} as const;

export type ControllerActionStatus = typeof CONTROLLER_ACTION_STATUS[keyof typeof CONTROLLER_ACTION_STATUS];

// ─── Universal Severity Levels ───────────────────────────────
export const CONTROLLER_SEVERITY = {
  INFO: 'info',
  WARN: 'warn',
  BLOCK: 'block',
} as const;

export type ControllerSeverity = typeof CONTROLLER_SEVERITY[keyof typeof CONTROLLER_SEVERITY];

// ─── Ledger Direction Values ─────────────────────────────────
// Used by data_event_ledger across all controllers.
export const LEDGER_DIRECTIONS = {
  INGRESS: 'ingress',
  EGRESS: 'egress',
  MUTATE: 'mutate',
  DELETE: 'delete',
} as const;

export type LedgerDirection = typeof LEDGER_DIRECTIONS[keyof typeof LEDGER_DIRECTIONS];

// ─── Zone Values ─────────────────────────────────────────────
export const CONTROLLER_ZONES = {
  Z1: 'Z1',
  Z2: 'Z2',
  Z3: 'Z3',
  EXTERN: 'EXTERN',
} as const;

export type ControllerZone = typeof CONTROLLER_ZONES[keyof typeof CONTROLLER_ZONES];
