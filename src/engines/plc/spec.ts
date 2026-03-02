/**
 * ENG-PLC — Pet Service Lifecycle Controller: Specification
 * 
 * Pure types, interfaces, constants. NO logic, NO side effects.
 * 
 * Marketplace model: Customer searches → selects provider → pays 7.5% deposit → provider confirms → service delivered.
 * Z1 is passive monitor only (no assignment role).
 * 
 * @engine ENG-PLC
 * @version 1.0.0
 * @scope Cross-Zone (Z3 Lennox, Z2 MOD-05, Z2 MOD-22, Z1 Pet Desk)
 */

// ─── PLC Phases ───────────────────────────────────────────────
export type PLCPhase =
  | 'search_initiated'      // Kunde sucht nach Provider
  | 'provider_selected'     // Kunde hat Provider ausgewählt
  | 'deposit_requested'     // Anzahlung (7,5%) angefordert
  | 'deposit_paid'          // Anzahlung bezahlt → Buchung erstellt
  | 'provider_confirmed'    // Provider hat bestätigt
  | 'provider_declined'     // Provider hat abgelehnt (Gebühr bleibt)
  | 'checked_in'            // Tier beim Provider angekommen
  | 'checked_out'           // Tier zurückgegeben
  | 'settlement'            // Restbetrag fällig / abgerechnet
  | 'closed_completed'      // Erfolgreich abgeschlossen
  | 'closed_cancelled';     // Storniert (Gebühr nicht erstattbar)

export const PLC_PHASE_ORDER: PLCPhase[] = [
  'search_initiated',
  'provider_selected',
  'deposit_requested',
  'deposit_paid',
  'provider_confirmed',
  'checked_in',
  'checked_out',
  'settlement',
  'closed_completed',
];

export const PLC_PHASE_LABELS: Record<PLCPhase, string> = {
  search_initiated: 'Suche gestartet',
  provider_selected: 'Anbieter ausgewählt',
  deposit_requested: 'Anzahlung angefordert',
  deposit_paid: 'Anzahlung bezahlt',
  provider_confirmed: 'Vom Anbieter bestätigt',
  provider_declined: 'Vom Anbieter abgelehnt',
  checked_in: 'Tier eingecheckt',
  checked_out: 'Tier ausgecheckt',
  settlement: 'Abrechnung',
  closed_completed: 'Abgeschlossen',
  closed_cancelled: 'Storniert',
};

// ─── Event Types ──────────────────────────────────────────────
export type PLCEventType =
  // Search & Selection
  | 'search.initiated'
  | 'provider.selected'
  | 'provider.profile_viewed'
  // Deposit
  | 'deposit.requested'
  | 'deposit.checkout_created'
  | 'deposit.paid'
  | 'deposit.payment_failed'
  // Provider Response
  | 'provider.confirmed'
  | 'provider.declined'
  | 'provider.message_sent'
  // Service Delivery
  | 'service.checked_in'
  | 'service.checked_out'
  | 'service.note_added'
  // Settlement
  | 'settlement.remainder_invoiced'
  | 'settlement.remainder_paid'
  | 'settlement.completed'
  // Cancellation
  | 'case.cancelled_by_customer'
  | 'case.cancelled_by_provider'
  | 'case.cancelled_by_admin'
  // Lifecycle
  | 'case.closed_completed'
  | 'case.closed_cancelled'
  // Monitoring (cron only, no phase transition)
  | 'case.stuck_detected'
  | 'case.review_submitted';

// ─── Event → Phase Mapping ────────────────────────────────────
export const PLC_EVENT_PHASE_MAP: Partial<Record<PLCEventType, PLCPhase>> = {
  'search.initiated': 'search_initiated',
  'provider.selected': 'provider_selected',
  'deposit.requested': 'deposit_requested',
  'deposit.paid': 'deposit_paid',
  'provider.confirmed': 'provider_confirmed',
  'provider.declined': 'provider_declined',
  'service.checked_in': 'checked_in',
  'service.checked_out': 'checked_out',
  'settlement.completed': 'settlement',
  'case.closed_completed': 'closed_completed',
  'case.closed_cancelled': 'closed_cancelled',
  'case.cancelled_by_customer': 'closed_cancelled',
  'case.cancelled_by_provider': 'closed_cancelled',
  'case.cancelled_by_admin': 'closed_cancelled',
};

// ─── Phase-Changing Events ────────────────────────────────────
export const PLC_PHASE_CHANGE_EVENTS: Set<PLCEventType> = new Set(
  Object.keys(PLC_EVENT_PHASE_MAP) as PLCEventType[]
);

// ─── SLA Thresholds (in hours) ────────────────────────────────
export const PLC_STUCK_THRESHOLDS: Partial<Record<PLCPhase, number>> = {
  deposit_requested: 24,       // 24h to complete payment
  deposit_paid: 48,            // 48h for provider to respond
  provider_confirmed: 168,     // 7d until check-in (or scheduled date)
  checked_in: 336,             // 14d max stay without check-out
  checked_out: 72,             // 3d for settlement
  settlement: 168,             // 7d to close
};

// ─── Valid Transitions ────────────────────────────────────────
export const PLC_VALID_TRANSITIONS: Record<PLCPhase, PLCPhase[]> = {
  search_initiated: ['provider_selected', 'closed_cancelled'],
  provider_selected: ['deposit_requested', 'closed_cancelled'],
  deposit_requested: ['deposit_paid', 'closed_cancelled'],
  deposit_paid: ['provider_confirmed', 'provider_declined'],
  provider_confirmed: ['checked_in', 'closed_cancelled'],
  provider_declined: ['closed_cancelled'],
  checked_in: ['checked_out'],
  checked_out: ['settlement'],
  settlement: ['closed_completed'],
  closed_completed: [],
  closed_cancelled: [],
};

// ─── Constants ────────────────────────────────────────────────

/** Platform fee percentage (non-refundable deposit) */
export const PLC_PLATFORM_FEE_PCT = 7.5;

/** Minimum deposit in cents (€5) */
export const PLC_MIN_DEPOSIT_CENTS = 500;

export const PLC_ENGINE_VERSION = '1.0.0';

// ─── Interfaces ───────────────────────────────────────────────

export interface PLCCase {
  id: string;
  customer_user_id: string | null;
  customer_email: string | null;
  customer_name: string | null;
  provider_id: string;
  service_type: PLCServiceType;
  pet_id: string | null;
  current_phase: PLCPhase;
  phase_entered_at: string;
  total_price_cents: number;
  deposit_cents: number;
  deposit_paid_at: string | null;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  scheduled_start: string | null;
  scheduled_end: string | null;
  provider_notes: string | null;
  customer_notes: string | null;
  tenant_id: string;
  created_at: string;
  closed_at: string | null;
}

export interface PLCEvent {
  id: string;
  case_id: string;
  event_type: PLCEventType;
  phase_before: PLCPhase | null;
  phase_after: PLCPhase | null;
  actor_id: string | null;
  actor_type: 'customer' | 'provider' | 'admin' | 'system';
  payload: Record<string, unknown>;
  created_at: string;
}

export type PLCServiceType = 'pension' | 'grooming' | 'walking' | 'daycare' | 'training' | 'veterinary' | 'other';

export const PLC_SERVICE_TYPE_LABELS: Record<PLCServiceType, string> = {
  pension: 'Tierpension',
  grooming: 'Fellpflege',
  walking: 'Gassi-Service',
  daycare: 'Tagesbetreuung',
  training: 'Training',
  veterinary: 'Tierarzt',
  other: 'Sonstiges',
};

// ─── Computed State ───────────────────────────────────────────

export interface PLCComputedState {
  phase: PLCPhase;
  phaseLabel: string;
  phaseIndex: number;
  progressPercent: number;
  stuckHours: number | null;
  isStuck: boolean;
  depositStatus: 'pending' | 'paid' | 'not_applicable';
  remainderCents: number;
  nextActions: PLCNextAction[];
}

export interface PLCNextAction {
  code: string;
  label: string;
  owner: 'customer' | 'provider' | 'admin' | 'system';
  priority: 'high' | 'medium' | 'low';
}
