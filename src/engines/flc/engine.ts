/**
 * ENG-FLC — Financing Lifecycle Controller: Engine
 * 
 * Pure functions implementing FLC logic. NO side effects, NO DB calls, NO UI imports.
 * 
 * @engine ENG-FLC
 * @version 1.0.0
 */

import type {
  FLCPhase,
  FLCComputedState,
  FLCCaseSnapshot,
  FLCGateResult,
  FLCGateCode,
  FLCNextAction,
  FLCEventType,
} from './spec';
import {
  FLC_PHASE_ORDER,
  FLC_PHASE_LABELS,
  FLC_EVENT_PHASE_MAP,
  FLC_STUCK_THRESHOLDS,
  FLC_PLATFORM_SHARE_PCT,
} from './spec';

// ─── Phase Determination ──────────────────────────────────────

/**
 * Determines the current FLC phase from a hydrated case snapshot.
 * Uses actual DB state (not events) for robust phase computation.
 */
export function determineFLCPhase(snapshot: FLCCaseSnapshot): FLCPhase {
  // Terminal
  if (snapshot.request_status === 'completed' || snapshot.request_status === 'closed') return 'closed';
  if (snapshot.request_status === 'cancelled' || snapshot.request_status === 'rejected') return 'closed';

  // Settlement track
  if (snapshot.commission_status === 'paid') return 'platform_fee_paid';
  if (snapshot.commission_status === 'invoiced') return 'platform_fee_invoiced';
  if (snapshot.commission_status === 'approved') return 'commission_confirmed';

  // Deal track
  if (snapshot.bank_response === 'paid_out') return 'paid_out';
  if (snapshot.bank_response === 'signed') return 'signed';
  if (snapshot.bank_response === 'declined') return 'declined';
  if (snapshot.bank_response === 'approved') return 'approved';

  // Submission track
  if (snapshot.submitted_to_bank_at) return 'decision_pending';
  if (snapshot.submission_channel === 'europace' && snapshot.submission_status === 'submitted') return 'submitted_europace';
  if (snapshot.submission_channel === 'email' && snapshot.submission_status === 'submitted') return 'submitted_bank_email';
  if (snapshot.submission_status === 'ready' || snapshot.package_status === 'ready_for_handoff' || snapshot.package_status === 'complete') return 'bank_submission_ready';

  // Processing track (MOD-11)
  if (snapshot.case_status === 'docs_complete' || snapshot.case_status === 'ready_to_submit') return 'docs_complete';
  if (snapshot.case_id && snapshot.first_action_at) return 'in_progress';
  if (snapshot.case_id) return 'handoff_to_mod11';

  // Assignment track
  if (snapshot.accepted_at) return 'accepted_by_manager';
  if (snapshot.assigned_manager_id && snapshot.mandate_status === 'accepted') return 'accepted_by_manager';
  if (snapshot.assigned_manager_id) return 'assigned_to_manager';
  if (snapshot.mandate_id && (snapshot.mandate_status === 'new' || snapshot.mandate_status === 'triage')) return 'ready_for_assignment';

  // Intake track
  if (snapshot.completion_score && snapshot.completion_score >= 80) return 'validation_ok';
  return 'intake_received';
}

/**
 * Recovery: Determine phase from event history (for audit/recomputation).
 */
export function determineFLCPhaseFromEvents(events: { event_type: string; created_at: string }[]): FLCPhase {
  const sorted = [...events].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  let phase: FLCPhase = 'intake_received';
  for (const evt of sorted) {
    const nextPhase = FLC_EVENT_PHASE_MAP[evt.event_type as FLCEventType];
    if (nextPhase) phase = nextPhase;
  }
  return phase;
}

// ─── Gate Evaluation ──────────────────────────────────────────

function evaluateGates(snapshot: FLCCaseSnapshot): FLCGateResult[] {
  const gates: FLCGateResult[] = [];

  // Contact Gate
  gates.push({
    code: 'CONTACT_GATE' as FLCGateCode,
    passed: !!(snapshot.contact_email && snapshot.contact_first_name),
    message: snapshot.contact_email ? 'Kontaktdaten vorhanden' : 'E-Mail oder Name fehlt',
  });

  // Consent Gate
  gates.push({
    code: 'CONSENT_GATE' as FLCGateCode,
    passed: !!(snapshot.schufa_consent && snapshot.data_correct_confirmed),
    message: (snapshot.schufa_consent && snapshot.data_correct_confirmed) ? 'Einwilligungen erteilt' : 'SCHUFA-Einwilligung oder Datenbestätigung fehlt',
  });

  // Dataroom Gate
  const completionOk = (snapshot.completion_score ?? 0) >= 80;
  gates.push({
    code: 'DATAROOM_GATE' as FLCGateCode,
    passed: completionOk,
    message: completionOk ? `Selbstauskunft ${snapshot.completion_score}% vollständig` : `Selbstauskunft nur ${snapshot.completion_score ?? 0}% (mind. 80%)`,
  });

  // Assignment Gate
  gates.push({
    code: 'ASSIGNMENT_GATE' as FLCGateCode,
    passed: !!snapshot.assigned_manager_id,
    message: snapshot.assigned_manager_id ? 'Manager zugewiesen' : 'Kein Manager zugewiesen',
  });

  // Commission Gate
  const commissionOk = snapshot.platform_share_pct === FLC_PLATFORM_SHARE_PCT;
  gates.push({
    code: 'COMMISSION_GATE' as FLCGateCode,
    passed: commissionOk,
    message: commissionOk ? `Plattformanteil ${FLC_PLATFORM_SHARE_PCT}% korrekt` : `Plattformanteil ${snapshot.platform_share_pct ?? 'n/a'}% (soll: ${FLC_PLATFORM_SHARE_PCT}%)`,
  });

  // Submission Gate
  const submissionReady = snapshot.package_status === 'complete' || snapshot.package_status === 'ready_for_handoff';
  gates.push({
    code: 'SUBMISSION_GATE' as FLCGateCode,
    passed: submissionReady,
    message: submissionReady ? 'Bankpaket vollständig' : 'Bankpaket unvollständig',
  });

  // Settlement Gate
  const settlementOk = snapshot.commission_status === 'approved' || snapshot.commission_status === 'invoiced' || snapshot.commission_status === 'paid';
  gates.push({
    code: 'SETTLEMENT_GATE' as FLCGateCode,
    passed: settlementOk,
    message: settlementOk ? 'Settlement in Bearbeitung' : 'Settlement ausstehend',
  });

  return gates;
}

// ─── Next Actions ─────────────────────────────────────────────

function computeNextActions(phase: FLCPhase, snapshot: FLCCaseSnapshot, gates: FLCGateResult[]): FLCNextAction[] {
  const actions: FLCNextAction[] = [];

  const blocked = gates.filter(g => !g.passed);

  // Phase-specific actions
  if (phase === 'intake_received' || phase === 'validation_ok') {
    if (blocked.some(g => g.code === 'DATAROOM_GATE')) {
      actions.push({ code: 'RA_REQUEST_MISSING_FIELDS', label: 'Fehlende Pflichtfelder anfordern', owner: 'system', priority: 'high' });
    }
    if (!snapshot.mandate_id) {
      actions.push({ code: 'RA_CREATE_MANDATE', label: 'Mandat erstellen', owner: 'admin', priority: 'high' });
    }
  }

  if (phase === 'ready_for_assignment') {
    actions.push({ code: 'RA_ASSIGN_MANAGER', label: 'Manager zuweisen', owner: 'admin', priority: 'high' });
  }

  if (phase === 'assigned_to_manager') {
    actions.push({ code: 'RA_AWAIT_ACCEPTANCE', label: 'Manager-Annahme abwarten', owner: 'manager', priority: 'high' });
  }

  if (phase === 'accepted_by_manager' || phase === 'intro_emails_sent') {
    if (!snapshot.case_id) {
      actions.push({ code: 'RA_CREATE_MOD11_CASE', label: 'Fall in MOD-11 erstellen', owner: 'system', priority: 'high' });
    }
  }

  if (phase === 'in_progress' || phase === 'handoff_to_mod11') {
    if (blocked.some(g => g.code === 'DATAROOM_GATE')) {
      actions.push({ code: 'RA_REQUEST_MISSING_DOCUMENTS', label: 'Fehlende Dokumente anfordern', owner: 'manager', priority: 'medium' });
    }
  }

  if (phase === 'docs_complete' || phase === 'bank_submission_ready') {
    actions.push({ code: 'RA_PREPARE_BANK_SUBMISSION', label: 'Bankpaket vorbereiten', owner: 'manager', priority: 'high' });
  }

  if (phase === 'paid_out') {
    if (blocked.some(g => g.code === 'SETTLEMENT_GATE')) {
      actions.push({ code: 'RA_TRIGGER_PLATFORM_FEE', label: 'Plattformgebühr abrechnen', owner: 'admin', priority: 'medium' });
    }
  }

  if (blocked.some(g => g.code === 'COMMISSION_GATE') && snapshot.commission_status && !['invoiced', 'paid'].includes(snapshot.commission_status)) {
    actions.push({ code: 'RA_FIX_COMMISSION_SHARE', label: 'Plattformanteil korrigieren (25%)', owner: 'admin', priority: 'high' });
  }

  return actions;
}

// ─── Stuck Detection ──────────────────────────────────────────

export function isFLCStuck(
  currentPhase: FLCPhase,
  phaseEnteredAt: string | Date,
  referenceDate: Date = new Date()
): { isStuck: boolean; isBreach: boolean; days: number } {
  const threshold = FLC_STUCK_THRESHOLDS[currentPhase];
  if (!threshold) return { isStuck: false, isBreach: false, days: 0 };

  const enteredAt = typeof phaseEnteredAt === 'string' ? new Date(phaseEnteredAt) : phaseEnteredAt;
  const days = (referenceDate.getTime() - enteredAt.getTime()) / (1000 * 60 * 60 * 24);

  return {
    isStuck: days > threshold,
    isBreach: days > threshold * 2,
    days: Math.round(days),
  };
}

// ─── Phase Progress ───────────────────────────────────────────

export function getFLCPhaseIndex(phase: FLCPhase): number {
  const idx = FLC_PHASE_ORDER.indexOf(phase);
  return idx >= 0 ? idx : 0;
}

export function getFLCPhaseProgress(phase: FLCPhase): number {
  if (phase === 'closed' || phase === 'declined') return 100;
  const idx = FLC_PHASE_ORDER.indexOf(phase);
  if (idx < 0) return 0;
  return Math.round((idx / (FLC_PHASE_ORDER.length - 1)) * 100);
}

// ─── Main Computed State ──────────────────────────────────────

/**
 * Computes the full FLC state from a hydrated case snapshot.
 * Pure function — no side effects, fully deterministic.
 */
export function computeFLCState(
  snapshot: FLCCaseSnapshot,
  now: Date = new Date()
): FLCComputedState {
  const phase = determineFLCPhase(snapshot);
  const gates = evaluateGates(snapshot);
  const blockingGates = gates.filter(g => !g.passed);
  const nextActions = computeNextActions(phase, snapshot, gates);

  const phaseEnteredAt = snapshot.last_event_at || snapshot.submitted_at || now.toISOString();
  const stuck = isFLCStuck(phase, phaseEnteredAt, now);

  return {
    phase,
    phaseLabel: FLC_PHASE_LABELS[phase] || phase,
    phaseIndex: getFLCPhaseIndex(phase),
    progressPercent: getFLCPhaseProgress(phase),
    gates,
    blockingGates,
    stuckDays: stuck.isStuck ? stuck.days : null,
    isStuck: stuck.isStuck,
    isSLABreach: stuck.isBreach,
    nextActions,
  };
}

// ─── Transition Validation ────────────────────────────────────

export function isValidFLCTransition(from: FLCPhase, to: FLCPhase): boolean {
  if (to === 'closed') return true; // Can close from any phase
  if (to === 'declined') return true; // Bank can decline at any point
  if (from === 'closed' || from === 'declined') return false; // Terminal

  // Submission branch: allow both bank_email and europace from bank_submission_ready
  if (from === 'bank_submission_ready' && (to === 'submitted_bank_email' || to === 'submitted_europace')) return true;

  const fromIdx = FLC_PHASE_ORDER.indexOf(from);
  const toIdx = FLC_PHASE_ORDER.indexOf(to);
  return toIdx > fromIdx;
}
