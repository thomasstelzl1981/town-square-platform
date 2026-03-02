/**
 * ENG-PLC — Pet Service Lifecycle Controller: Engine
 * 
 * Pure functions. NO side effects, NO DB calls, NO UI imports.
 * 
 * @engine ENG-PLC
 * @version 1.0.0
 */

import {
  type PLCPhase,
  type PLCCase,
  type PLCEvent,
  type PLCEventType,
  type PLCComputedState,
  type PLCNextAction,
  PLC_PHASE_ORDER,
  PLC_PHASE_LABELS,
  PLC_EVENT_PHASE_MAP,
  PLC_VALID_TRANSITIONS,
  PLC_STUCK_THRESHOLDS,
  PLC_PLATFORM_FEE_PCT,
  PLC_MIN_DEPOSIT_CENTS,
  PLC_ENGINE_VERSION,
} from './spec';

// ─── Deposit Calculation ──────────────────────────────────────

/**
 * Calculate the non-refundable platform deposit (7.5%).
 * Enforces a minimum of €5 (500 cents).
 */
export function calculatePLCDeposit(totalPriceCents: number): number {
  if (totalPriceCents <= 0) return 0;
  const deposit = Math.ceil(totalPriceCents * (PLC_PLATFORM_FEE_PCT / 100));
  return Math.max(deposit, PLC_MIN_DEPOSIT_CENTS);
}

/**
 * Calculate the remainder after deposit.
 */
export function calculatePLCRemainder(totalPriceCents: number, depositCents: number): number {
  return Math.max(0, totalPriceCents - depositCents);
}

// ─── Phase Computation ────────────────────────────────────────

/**
 * Compute the current phase from an ordered list of events.
 * Events must be sorted by created_at ASC.
 */
export function computePLCPhase(events: Pick<PLCEvent, 'event_type'>[]): PLCPhase {
  let phase: PLCPhase = 'search_initiated';
  for (const event of events) {
    const mapped = PLC_EVENT_PHASE_MAP[event.event_type];
    if (mapped) {
      phase = mapped;
    }
  }
  return phase;
}

/**
 * Check if a phase transition is valid.
 */
export function isValidPLCTransition(from: PLCPhase, to: PLCPhase): boolean {
  const allowed = PLC_VALID_TRANSITIONS[from];
  return allowed?.includes(to) ?? false;
}

// ─── Stuck Detection ──────────────────────────────────────────

/**
 * Calculate hours a case has been in its current phase.
 */
export function getPLCPhaseAgeHours(phaseEnteredAt: string, now: Date = new Date()): number {
  const entered = new Date(phaseEnteredAt);
  const diffMs = now.getTime() - entered.getTime();
  return diffMs / (1000 * 60 * 60);
}

/**
 * Check if a PLC case is stuck based on SLA thresholds.
 */
export function isPLCStuck(phase: PLCPhase, phaseEnteredAt: string, now: Date = new Date()): boolean {
  const threshold = PLC_STUCK_THRESHOLDS[phase];
  if (!threshold) return false;
  return getPLCPhaseAgeHours(phaseEnteredAt, now) > threshold;
}

// ─── Computed State ───────────────────────────────────────────

/**
 * Compute the full state of a PLC case for UI rendering.
 */
export function computePLCState(plcCase: PLCCase, now: Date = new Date()): PLCComputedState {
  const phase = plcCase.current_phase;
  const phaseIndex = PLC_PHASE_ORDER.indexOf(phase);
  const progressPercent = phaseIndex >= 0
    ? Math.round((phaseIndex / (PLC_PHASE_ORDER.length - 1)) * 100)
    : 0;

  const stuckHours = plcCase.phase_entered_at
    ? getPLCPhaseAgeHours(plcCase.phase_entered_at, now)
    : null;

  const depositStatus: PLCComputedState['depositStatus'] = plcCase.deposit_paid_at
    ? 'paid'
    : phase === 'deposit_requested'
      ? 'pending'
      : 'not_applicable';

  const remainderCents = calculatePLCRemainder(plcCase.total_price_cents, plcCase.deposit_cents);

  const nextActions = getNextActions(phase, depositStatus);

  return {
    phase,
    phaseLabel: PLC_PHASE_LABELS[phase],
    phaseIndex: Math.max(0, phaseIndex),
    progressPercent,
    stuckHours,
    isStuck: isPLCStuck(phase, plcCase.phase_entered_at, now),
    depositStatus,
    remainderCents,
    nextActions,
  };
}

// ─── Next Actions ─────────────────────────────────────────────

function getNextActions(phase: PLCPhase, depositStatus: string): PLCNextAction[] {
  const actions: PLCNextAction[] = [];

  switch (phase) {
    case 'search_initiated':
      actions.push({
        code: 'SELECT_PROVIDER',
        label: 'Anbieter auswählen',
        owner: 'customer',
        priority: 'high',
      });
      break;
    case 'provider_selected':
      actions.push({
        code: 'REQUEST_DEPOSIT',
        label: 'Anzahlung anfordern',
        owner: 'system',
        priority: 'high',
      });
      break;
    case 'deposit_requested':
      actions.push({
        code: 'PAY_DEPOSIT',
        label: 'Anzahlung bezahlen (7,5%)',
        owner: 'customer',
        priority: 'high',
      });
      break;
    case 'deposit_paid':
      actions.push({
        code: 'CONFIRM_BOOKING',
        label: 'Buchung bestätigen',
        owner: 'provider',
        priority: 'high',
      });
      break;
    case 'provider_confirmed':
      actions.push({
        code: 'CHECK_IN',
        label: 'Tier einchecken',
        owner: 'provider',
        priority: 'medium',
      });
      break;
    case 'checked_in':
      actions.push({
        code: 'CHECK_OUT',
        label: 'Tier auschecken',
        owner: 'provider',
        priority: 'medium',
      });
      break;
    case 'checked_out':
      actions.push({
        code: 'SETTLE',
        label: 'Restbetrag abrechnen',
        owner: 'system',
        priority: 'high',
      });
      break;
    case 'settlement':
      actions.push({
        code: 'CLOSE',
        label: 'Fall abschließen',
        owner: 'system',
        priority: 'medium',
      });
      break;
  }

  return actions;
}

// ─── Exports ──────────────────────────────────────────────────

export { PLC_ENGINE_VERSION };
