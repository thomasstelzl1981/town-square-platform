/**
 * ENG-SLC — Sales Lifecycle Controller: Conventions
 * 
 * SSOT for event sources, idempotency key patterns, actor types.
 * Mirrors FLC conventions pattern for consistency.
 * 
 * @engine ENG-SLC
 * @version 1.0.0
 */

// ─── Event Sources ────────────────────────────────────────────
export const SLC_EVENT_SOURCES = {
  // Edge Functions
  CRON_LIFECYCLE: 'edge_fn:sot-slc-lifecycle',
  // Client-side producers
  MOD04_IMMOBILIEN: 'mod04:immobilien',
  MOD06_VERKAUF: 'mod06:verkauf',
  MOD13_PROJEKTE: 'mod13:projekte',
  ZONE1_SALES_DESK: 'zone1:sales_desk',
  ZONE1_ADMIN: 'zone1:admin',
  // System
  SYSTEM_AUTO: 'system:auto',
} as const;

export type SLCEventSource = typeof SLC_EVENT_SOURCES[keyof typeof SLC_EVENT_SOURCES];

// ─── Actor Types ──────────────────────────────────────────────
export const SLC_ACTOR_TYPES = {
  USER: 'user',
  SYSTEM: 'system',
  CRON: 'cron',
  EDGE_FN: 'edge_fn',
} as const;

export type SLCActorType = typeof SLC_ACTOR_TYPES[keyof typeof SLC_ACTOR_TYPES];

// ─── Idempotency Key Patterns ─────────────────────────────────
/**
 * Idempotency keys ensure at-most-once event creation.
 * Format: <event_category>:<entity_id>[:<qualifier>]
 * 
 * Examples:
 *   asset_captured:abc123
 *   mandate_activated:abc123
 *   channel_published:abc123:kaufy
 *   stuck:abc123:published:2026-03-02
 *   drift:abc123:kaufy:2026-03-02
 *   reservation_expired:res123
 *   settlement_pending:abc123:2026-03-02
 */
export const SLC_IDEMPOTENCY_KEYS = {
  assetCaptured: (caseId: string) => `asset_captured:${caseId}`,
  readinessApproved: (caseId: string) => `readiness_approved:${caseId}`,
  mandateActivated: (caseId: string) => `mandate_activated:${caseId}`,
  mandateRevoked: (caseId: string) => `mandate_revoked:${caseId}`,
  channelPublished: (caseId: string, channel: string) => `channel_published:${caseId}:${channel}`,
  channelRemoved: (caseId: string, channel: string) => `channel_removed:${caseId}:${channel}`,
  dealReserved: (caseId: string, reservationId: string) => `deal_reserved:${caseId}:${reservationId}`,
  dealReservationExpired: (reservationId: string) => `reservation_expired:${reservationId}`,
  dealReservationCancelled: (reservationId: string) => `reservation_cancelled:${reservationId}`,
  dealFinanceSubmitted: (caseId: string) => `finance_submitted:${caseId}`,
  dealContractDrafted: (caseId: string) => `contract_drafted:${caseId}`,
  dealNotaryScheduled: (caseId: string) => `notary_scheduled:${caseId}`,
  dealNotaryCompleted: (caseId: string) => `notary_completed:${caseId}`,
  dealHandoverCompleted: (caseId: string) => `handover_completed:${caseId}`,
  commissionCalculated: (caseId: string) => `commission_calculated:${caseId}`,
  platformShareSettled: (caseId: string) => `platform_settled:${caseId}`,
  closedWon: (caseId: string) => `closed_won:${caseId}`,
  closedLost: (caseId: string) => `closed_lost:${caseId}`,
  reopened: (caseId: string, date: string) => `reopened:${caseId}:${date}`,
  // Cron-generated (daily idempotency)
  stuck: (caseId: string, phase: string, date: string) => `stuck:${caseId}:${phase}:${date}`,
  slaBreach: (caseId: string, phase: string, date: string) => `sla_breach:${caseId}:${phase}:${date}`,
  drift: (caseId: string, channel: string, date: string) => `drift:${caseId}:${channel}:${date}`,
  settlementPending: (caseId: string, date: string) => `settlement_pending:${caseId}:${date}`,
} as const;
