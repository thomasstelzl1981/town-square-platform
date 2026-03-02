/**
 * ENG-FLC — Financing Lifecycle Controller: Specification
 * 
 * Pure types, interfaces, constants. NO logic, NO side effects.
 * 
 * Backbone for: Z3 Intake → Z1 Assignment → MOD-11 Processing → Bank/Europace → Settlement
 * 
 * @engine ENG-FLC
 * @version 1.0.0
 * @scope Cross-Module (MOD-07, MOD-11, Zone 1 Finance Desk)
 */

// ─── FLC Phases ───────────────────────────────────────────────
export type FLCPhase =
  | 'intake_received'
  | 'dataroom_linked'
  | 'validation_ok'
  | 'ready_for_assignment'
  | 'assigned_to_manager'
  | 'commission_terms_ready'
  | 'accepted_by_manager'
  | 'intro_emails_sent'
  | 'handoff_to_mod11'
  | 'in_progress'
  | 'docs_complete'
  | 'bank_submission_ready'
  | 'submitted_bank_email'
  | 'submitted_europace'
  | 'decision_pending'
  | 'approved'
  | 'declined'
  | 'signed'
  | 'paid_out'
  | 'commission_confirmed'
  | 'platform_fee_invoiced'
  | 'platform_fee_paid'
  | 'closed';

export const FLC_PHASE_ORDER: FLCPhase[] = [
  'intake_received',
  'dataroom_linked',
  'validation_ok',
  'ready_for_assignment',
  'assigned_to_manager',
  'commission_terms_ready',
  'accepted_by_manager',
  'intro_emails_sent',
  'handoff_to_mod11',
  'in_progress',
  'docs_complete',
  'bank_submission_ready',
  'submitted_bank_email', // or submitted_europace (parallel branch)
  'decision_pending',
  'approved',
  'signed',
  'paid_out',
  'commission_confirmed',
  'platform_fee_invoiced',
  'platform_fee_paid',
  'closed',
];

export const FLC_PHASE_LABELS: Record<FLCPhase, string> = {
  intake_received: 'Anfrage eingegangen',
  dataroom_linked: 'Datenraum verknüpft',
  validation_ok: 'Vorprüfung bestanden',
  ready_for_assignment: 'Bereit zur Zuweisung',
  assigned_to_manager: 'Manager zugewiesen',
  commission_terms_ready: 'Provisionskonditionen bereit',
  accepted_by_manager: 'Manager hat angenommen',
  intro_emails_sent: 'Vorstellungsmails versendet',
  handoff_to_mod11: 'Übergabe an Finanzierungsmanager',
  in_progress: 'In Bearbeitung',
  docs_complete: 'Unterlagen vollständig',
  bank_submission_ready: 'Bankeinreichung bereit',
  submitted_bank_email: 'Per E-Mail eingereicht',
  submitted_europace: 'Via Europace eingereicht',
  decision_pending: 'Bankentscheidung ausstehend',
  approved: 'Genehmigt',
  declined: 'Abgelehnt',
  signed: 'Unterschrieben',
  paid_out: 'Ausgezahlt',
  commission_confirmed: 'Provision bestätigt',
  platform_fee_invoiced: 'Plattformgebühr berechnet',
  platform_fee_paid: 'Plattformgebühr bezahlt',
  closed: 'Abgeschlossen',
};

// ─── Event Types ──────────────────────────────────────────────
export type FLCEventType =
  // Intake
  | 'case.created'
  | 'dataroom.linked'
  | 'validation.passed'
  | 'validation.failed'
  // Assignment
  | 'manager.assigned'
  | 'manager.accepted'
  | 'manager.declined'
  | 'manager.reassigned'
  | 'commission.terms_accepted'
  // Emails
  | 'email.customer_intro_sent'
  | 'email.manager_confirm_sent'
  // Handoff
  | 'handoff.to_mod11'
  // Processing
  | 'doc.requested'
  | 'doc.uploaded'
  | 'doc.checklist_complete'
  // Submission
  | 'submission.bank_email'
  | 'submission.europace'
  | 'bank.decision_received'
  // Deal
  | 'deal.signed'
  | 'deal.paid_out'
  // Settlement
  | 'settlement.commission_confirmed'
  | 'settlement.platform_fee_invoiced'
  | 'settlement.platform_fee_paid'
  | 'case.closed'
  // Monitoring (cron only)
  | 'case.stuck_detected'
  | 'case.sla_breach'
  | 'repair.triggered';

// ─── Event→Phase Mapping ──────────────────────────────────────
export const FLC_EVENT_PHASE_MAP: Partial<Record<FLCEventType, FLCPhase>> = {
  'case.created': 'intake_received',
  'dataroom.linked': 'dataroom_linked',
  'validation.passed': 'validation_ok',
  'manager.assigned': 'assigned_to_manager',
  'commission.terms_accepted': 'commission_terms_ready',
  'manager.accepted': 'accepted_by_manager',
  'email.customer_intro_sent': 'intro_emails_sent',
  'handoff.to_mod11': 'handoff_to_mod11',
  'doc.checklist_complete': 'docs_complete',
  'submission.bank_email': 'submitted_bank_email',
  'submission.europace': 'submitted_europace',
  'bank.decision_received': 'decision_pending',
  'deal.signed': 'signed',
  'deal.paid_out': 'paid_out',
  'settlement.commission_confirmed': 'commission_confirmed',
  'settlement.platform_fee_invoiced': 'platform_fee_invoiced',
  'settlement.platform_fee_paid': 'platform_fee_paid',
  'case.closed': 'closed',
  // NOTE: stuck_detected, sla_breach, repair.triggered have NO phase mapping
};

// ─── SLA Thresholds (in days) ─────────────────────────────────
export const FLC_STUCK_THRESHOLDS: Partial<Record<FLCPhase, number>> = {
  intake_received: 2,          // 48h bis Zuweisung
  ready_for_assignment: 2,     // 48h 
  assigned_to_manager: 3,      // 72h bis Annahme
  accepted_by_manager: 1,      // 24h bis Emails
  handoff_to_mod11: 7,         // 7d bis erste Aktion
  in_progress: 14,             // 14d ohne Fortschritt
  bank_submission_ready: 14,   // 14d bis Einreichung
  submitted_bank_email: 60,    // 60d bis Entscheidung
  submitted_europace: 60,      // 60d bis Entscheidung
  decision_pending: 30,        // 30d bis Unterschrift
  approved: 30,                // 30d bis Unterschrift
  signed: 14,                  // 14d bis Auszahlung
  paid_out: 14,                // 14d bis Settlement
};

// ─── Quality Gates ────────────────────────────────────────────
export type FLCGateCode =
  | 'CONTACT_GATE'
  | 'CONSENT_GATE'
  | 'DATAROOM_GATE'
  | 'ASSIGNMENT_GATE'
  | 'COMMISSION_GATE'
  | 'SUBMISSION_GATE'
  | 'SETTLEMENT_GATE';

export interface FLCGateResult {
  code: FLCGateCode;
  passed: boolean;
  message: string;
}

// ─── Computed State Output ────────────────────────────────────
export interface FLCComputedState {
  phase: FLCPhase;
  phaseLabel: string;
  phaseIndex: number;
  progressPercent: number;
  gates: FLCGateResult[];
  blockingGates: FLCGateResult[];
  stuckDays: number | null;
  isStuck: boolean;
  isSLABreach: boolean;
  nextActions: FLCNextAction[];
}

export interface FLCNextAction {
  code: string;
  label: string;
  owner: 'system' | 'admin' | 'manager' | 'customer';
  priority: 'high' | 'medium' | 'low';
}

// ─── Hydrated Case Snapshot (input to engine) ─────────────────
export interface FLCCaseSnapshot {
  // finance_requests
  request_id: string;
  request_status: string;
  request_source: string | null;
  public_id: string | null;
  submitted_at: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  contact_first_name: string | null;
  contact_last_name: string | null;
  // finance_mandates (may be null)
  mandate_id: string | null;
  mandate_status: string | null;
  assigned_manager_id: string | null;
  delegated_at: string | null;
  accepted_at: string | null;
  // future_room_cases (may be null)
  case_id: string | null;
  case_status: string | null;
  first_action_at: string | null;
  submission_channel: string | null;
  submission_status: string | null;
  submitted_to_bank_at: string | null;
  bank_response: string | null;
  // applicant
  completion_score: number | null;
  schufa_consent: boolean | null;
  data_correct_confirmed: boolean | null;
  // finance_packages
  package_status: string | null;
  // commissions
  commission_status: string | null;
  platform_share_pct: number | null;
  // latest events
  last_event_type: string | null;
  last_event_at: string | null;
}

// ─── Constants ────────────────────────────────────────────────
export const FLC_ENGINE_VERSION = '1.0.0';
export const FLC_PLATFORM_SHARE_PCT = 25;
