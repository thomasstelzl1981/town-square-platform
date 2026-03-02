/**
 * ENG-FLC — Conventions SSOT (Fix #5)
 * 
 * Single Source of Truth for:
 * - Event type catalog
 * - Idempotency key schema
 * - Event source values
 * 
 * ALL producers (Edge Functions, Hooks, Cron) MUST use these patterns.
 * NO free-form strings allowed.
 * 
 * @engine ENG-FLC
 * @version 1.1.0
 */

// ─── Event Source Values ──────────────────────────────────────
export const FLC_EVENT_SOURCES = {
  // Zone 3 intake
  Z3_SUBMIT: 'edge_fn:sot-futureroom-public-submit',
  // Zone 1 admin actions
  ZONE1_ADMIN: 'zone1_admin',
  // MOD-07 portal submit
  MOD07: 'mod07',
  // MOD-11 manager actions
  MOD11: 'mod11',
  // Finance manager notify edge function
  NOTIFY: 'edge_fn:sot-finance-manager-notify',
  // Lifecycle cron patrol
  CRON: 'cron:sot-flc-lifecycle',
  // Backfill (one-time migration)
  BACKFILL: 'backfill',
} as const;

export type FLCEventSource = typeof FLC_EVENT_SOURCES[keyof typeof FLC_EVENT_SOURCES];

// ─── Idempotency Key Schema ──────────────────────────────────
// Pattern: <action>:<primary_id>[:<secondary_id>]
// All keys MUST follow these patterns to prevent duplicates.
export const FLC_IDEMPOTENCY_KEYS = {
  /** case.created — one per finance_request */
  caseCreated: (requestId: string) => `case_created:${requestId}`,
  
  /** dataroom.linked — one per finance_request */
  dataroomLinked: (requestId: string) => `dataroom_linked:${requestId}`,
  
  /** manager.accepted — one per mandate+manager combination */
  managerAccepted: (mandateId: string, managerId: string) => `manager_accepted:${mandateId}:${managerId}`,
  
  /** manager.assigned — one per mandate+manager */
  managerAssigned: (mandateId: string, managerId: string) => `manager_assigned:${mandateId}:${managerId}`,
  
  /** commission.terms_accepted — one per mandate */
  commissionTerms: (mandateId: string) => `commission_terms:${mandateId}`,
  
  /** email.customer_intro_sent — one per request */
  emailCustomerIntro: (requestId: string) => `email_customer_intro:${requestId}`,
  
  /** email.manager_confirm_sent — one per mandate */
  emailManagerConfirm: (mandateId: string) => `email_manager_confirm:${mandateId}`,
  
  /** handoff.to_mod11 — one per case */
  handoffToMod11: (caseId: string) => `handoff_mod11:${caseId}`,
  
  /** submission.bank_email — one per submission log entry */
  submissionBankEmail: (submissionLogId: string) => `submission_bank_email:${submissionLogId}`,
  
  /** submission.europace — one per submission log entry */
  submissionEuropace: (submissionLogId: string) => `submission_europace:${submissionLogId}`,
  
  /** case.stuck_detected — one per request+phase+day (daily idempotency) */
  stuckDetected: (requestId: string, phase: string, dateYYYYMMDD: string) => `stuck:${requestId}:${phase}:${dateYYYYMMDD}`,
  
  /** case.sla_breach — one per request+phase+day */
  slaBreach: (requestId: string, phase: string, dateYYYYMMDD: string) => `sla_breach:${requestId}:${phase}:${dateYYYYMMDD}`,
} as const;

// ─── Actor Types ──────────────────────────────────────────────
export const FLC_ACTOR_TYPES = {
  USER: 'user',
  SYSTEM: 'system',
  CRON: 'cron',
  EDGE_FN: 'edge_fn',
} as const;

export type FLCActorType = typeof FLC_ACTOR_TYPES[keyof typeof FLC_ACTOR_TYPES];
