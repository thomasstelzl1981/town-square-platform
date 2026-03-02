/**
 * ENG-TLC — Tenancy Lifecycle Controller: Conventions
 * 
 * SSOT for event sources, idempotency key patterns, actor types.
 * Mirrors FLC/SLC conventions pattern for consistency.
 * 
 * @engine ENG-TLC
 * @version 1.0.0
 */

// ─── Event Sources ────────────────────────────────────────────
export const TLC_EVENT_SOURCES = {
  // Edge Functions
  CRON_LIFECYCLE: 'cron:sot-tenancy-lifecycle',
  // Client-side producers
  MOD04_TENANCY_TAB: 'mod04:tenancy_tab',
  MOD04_DUNNING: 'mod04:dunning',
  MOD04_DEPOSIT: 'mod04:deposit',
  MOD04_RENT_INCREASE: 'mod04:rent_increase',
  MOD04_DEFECT: 'mod04:defect',
  MOD04_HANDOVER: 'mod04:handover',
  MOD04_METER: 'mod04:meter_reading',
  ZONE1_PROPERTY_DESK: 'zone1:property_desk',
  ZONE1_ADMIN: 'zone1:admin',
  // System
  SYSTEM_AUTO: 'system:auto',
} as const;

export type TLCEventSource = typeof TLC_EVENT_SOURCES[keyof typeof TLC_EVENT_SOURCES];

// ─── Actor Types ──────────────────────────────────────────────
export const TLC_ACTOR_TYPES = {
  USER: 'user',
  SYSTEM: 'system',
  CRON: 'cron',
  AI: 'ai',
  EDGE_FN: 'edge_fn',
} as const;

export type TLCActorType = typeof TLC_ACTOR_TYPES[keyof typeof TLC_ACTOR_TYPES];

// ─── Idempotency Key Patterns ─────────────────────────────────
/**
 * Idempotency keys ensure at-most-once event creation per lease.
 * Format: <event_category>:<lease_id>[:<qualifier>][:<date>]
 * 
 * Cron-generated keys include date for daily idempotency.
 * User-generated keys omit date (one-time per action).
 * 
 * Examples:
 *   dunning:abc123:2:2026-03-02
 *   rent_increase_eligible:abc123:2026-03-02
 *   deposit_partial:abc123:2026-03-02
 *   deadline_missed:abc123:dl456:2026-03-02
 *   defect_sla:abc123:def789:2026-03-02
 *   staffel_step:abc123:2026-03-02
 *   deposit_settlement:abc123
 *   phase_transition:abc123:active:termination
 */
export const TLC_IDEMPOTENCY_KEYS = {
  // Payment / Dunning (cron — daily idempotency)
  dunning: (leaseId: string, level: number, date: string) =>
    `dunning:${leaseId}:${level}:${date}`,
  paymentMissed: (leaseId: string, date: string) =>
    `payment_missed:${leaseId}:${date}`,
  paymentPartial: (leaseId: string, date: string) =>
    `payment_partial:${leaseId}:${date}`,
  dunningMailSent: (leaseId: string, date: string) =>
    `dunning_mail_sent:${leaseId}:${date}`,

  // Rent increase (cron — daily)
  rentIncreaseEligible: (leaseId: string, date: string) =>
    `rent_increase_eligible:${leaseId}:${date}`,
  staffelStepDue: (leaseId: string, date: string) =>
    `staffel_step:${leaseId}:${date}`,

  // Deposit (cron — daily)
  depositPartial: (leaseId: string, date: string) =>
    `deposit_partial:${leaseId}:${date}`,
  depositInterest: (leaseId: string, date: string) =>
    `deposit_interest:${leaseId}:${date}`,
  depositSettlement: (leaseId: string) =>
    `deposit_settlement:${leaseId}`,

  // Deadlines (cron — daily)
  deadlineMissed: (leaseId: string, deadlineId: string, date: string) =>
    `deadline_missed:${leaseId}:${deadlineId}:${date}`,
  deadlineApproaching: (leaseId: string, deadlineId: string, date: string) =>
    `deadline_approaching:${leaseId}:${deadlineId}:${date}`,

  // Defect SLA (cron — daily)
  defectSla: (leaseId: string, defectId: string, date: string) =>
    `defect_sla:${leaseId}:${defectId}:${date}`,

  // Termination (cron — daily)
  terminationDeadline: (leaseId: string, date: string) =>
    `termination_deadline:${leaseId}:${date}`,

  // Phase transitions (user — one-time)
  phaseTransition: (leaseId: string, from: string, to: string) =>
    `phase_transition:${leaseId}:${from}:${to}`,

  // Task idempotency keys
  taskDunning: (leaseId: string, level: number, date: string) =>
    `task:dunning:${leaseId}:${level}:${date}`,
  taskStaffel: (leaseId: string, date: string) =>
    `task:staffel:${leaseId}:${date}`,
  taskDeposit: (leaseId: string, type: string) =>
    `task:deposit:${leaseId}:${type}`,
  taskHandover: (leaseId: string) =>
    `task:handover:${leaseId}`,
} as const;
