/**
 * ENG-FDC — Finance Data Controller: Conventions
 *
 * SSOT for event sources, ledger event types, idempotency patterns.
 * Mirrors FLC/SLC/TLC conventions pattern for consistency.
 *
 * @engine ENG-FDC
 * @version 1.0.0
 */

// ─── Event Sources ────────────────────────────────────────────
export const FDC_EVENT_SOURCES = {
  CONTROL_TAB: 'mod18:control_tab',
  CRON_PATROL: 'cron:sot-fdc-patrol',
  SYSTEM_BACKFILL: 'system:fdc_backfill',
  SYSTEM_AUTO: 'system:auto',
} as const;

export type FDCEventSource = typeof FDC_EVENT_SOURCES[keyof typeof FDC_EVENT_SOURCES];

// ─── Ledger Event Types ───────────────────────────────────────
export const FDC_LEDGER_EVENTS = {
  REGISTRY_CREATED: 'finance.registry.created',
  REGISTRY_UPDATED: 'finance.registry.updated',
  REGISTRY_DELETED: 'finance.registry.deleted',
  LINK_CREATED: 'finance.links.created',
  LINK_DELETED: 'finance.links.deleted',
  ACTION_CREATED: 'finance.action.created',
  ACTION_UPDATED: 'finance.action.updated',
  ACTION_RESOLVED: 'finance.action.resolved',
} as const;

export type FDCLedgerEvent = typeof FDC_LEDGER_EVENTS[keyof typeof FDC_LEDGER_EVENTS];

// ─── Actor Types ──────────────────────────────────────────────
export const FDC_ACTOR_TYPES = {
  USER: 'user',
  SYSTEM: 'system',
  CRON: 'cron',
  EDGE_FN: 'edge_fn',
} as const;

// ─── Source Modules ───────────────────────────────────────────
export const FDC_SOURCE_MODULES = {
  MOD18: 'MOD18',
  MOD20: 'MOD20',
  MOD04: 'MOD04',
  FINAPI: 'FinAPI',
  UPLOAD: 'Upload',
} as const;

// ─── Entity Status ────────────────────────────────────────────
export const FDC_ENTITY_STATUS = {
  ACTIVE: 'active',
  CANDIDATE: 'candidate',
  SUPPRESSED: 'suppressed',
  ARCHIVED: 'archived',
} as const;

// ─── Action Status ────────────────────────────────────────────
export const FDC_ACTION_STATUS = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  SUPPRESSED: 'suppressed',
} as const;
