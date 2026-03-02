/**
 * ENG-TLC — Tenancy Lifecycle Controller: Specification
 * 
 * Pure types, interfaces, constants. NO logic, NO side effects.
 * 
 * @engine ENG-TLC
 * @version 1.0.0
 * @module MOD-04 (Immobilien)
 */

// ─── TLC Phases ───────────────────────────────────────────────
export type TLCPhase =
  | 'application'    // Bewerbung
  | 'contract'       // Vertragserstellung
  | 'move_in'        // Einzug
  | 'active'         // Laufendes Mietverhältnis
  | 'termination'    // Kündigung
  | 'move_out'       // Auszug
  | 'reletting';     // Wiedervermietung

export const TLC_PHASE_ORDER: TLCPhase[] = [
  'application', 'contract', 'move_in', 'active', 'termination', 'move_out', 'reletting'
];

export const TLC_PHASE_LABELS: Record<TLCPhase, string> = {
  application: 'Bewerbung',
  contract: 'Vertragserstellung',
  move_in: 'Einzug',
  active: 'Laufend',
  termination: 'Kündigung',
  move_out: 'Auszug',
  reletting: 'Wiedervermietung',
};

// ─── Event Types ──────────────────────────────────────────────
export type TLCEventType =
  // Phase transitions
  | 'phase_transition'
  // Payment
  | 'payment_received' | 'payment_missed' | 'payment_partial'
  // Dunning
  | 'dunning_reminder' | 'dunning_level_1' | 'dunning_level_2' | 'dunning_final'
  | 'dunning_escalation_inkasso'
  // NK
  | 'nk_period_opened' | 'nk_settlement_created' | 'nk_settlement_finalized'
  | 'nk_objection_received' | 'nk_prepayment_adjusted'
  // Rent increase
  | 'rent_increase_eligible' | 'rent_increase_proposed' | 'rent_increase_approved'
  | 'rent_increase_sent' | 'rent_increase_accepted' | 'rent_increase_effective'
  // Index/Staffel
  | 'index_trigger_detected' | 'staffel_step_due'
  // Deposit
  | 'deposit_received' | 'deposit_partial' | 'deposit_settlement_started'
  | 'deposit_settled' | 'deposit_payout'
  // Defects/Damage
  | 'defect_reported' | 'defect_dispatched' | 'defect_resolved'
  | 'damage_reported' | 'damage_insurance_filed' | 'damage_settled'
  // Termination/Move-out
  | 'termination_received' | 'termination_confirmed' | 'move_out_scheduled'
  | 'handover_inspection' | 'handover_completed' | 'reletting_started'
  // Deadlines
  | 'deadline_approaching' | 'deadline_missed'
  // AI
  | 'ai_analysis_completed' | 'ai_next_best_action' | 'ai_anomaly_detected'
  // Audit
  | 'document_added' | 'document_signed' | 'access_granted' | 'access_revoked';

export type TLCSeverity = 'info' | 'warning' | 'critical' | 'action_required';

export type TLCTriggeredBy = 'system' | 'user' | 'cron' | 'ai';

// ─── Task Types ───────────────────────────────────────────────
export type TenancyTaskType = 'task' | 'ticket' | 'defect' | 'damage' | 'reminder' | 'inspection' | 'handover';
export type TenancyTaskCategory = 'payment' | 'nk' | 'maintenance' | 'insurance' | 'communication' | 'legal' | 'deposit' | 'rent_increase';
export type TenancyTaskPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TenancyTaskStatus = 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed' | 'cancelled';

// ─── Dunning ──────────────────────────────────────────────────
export interface DunningLevel {
  level: number;       // 0=reminder, 1=first, 2=second, 3=final, 4=escalation
  label: string;
  daysAfterDue: number;
  templateCode: string | null;
  sendChannel: 'email' | 'letter' | 'both';
  feeEur: number;
  autoSend: boolean;
  escalationTarget: 'inkasso' | 'anwalt' | null;
}

export const DEFAULT_DUNNING_LEVELS: DunningLevel[] = [
  { level: 0, label: 'Zahlungserinnerung', daysAfterDue: 5, templateCode: 'MAHNUNG_ERINNERUNG', sendChannel: 'email', feeEur: 0, autoSend: true, escalationTarget: null },
  { level: 1, label: '1. Mahnung', daysAfterDue: 14, templateCode: 'MAHNUNG_1', sendChannel: 'email', feeEur: 5, autoSend: false, escalationTarget: null },
  { level: 2, label: '2. Mahnung', daysAfterDue: 28, templateCode: 'MAHNUNG_2', sendChannel: 'both', feeEur: 10, autoSend: false, escalationTarget: null },
  { level: 3, label: 'Letzte Mahnung', daysAfterDue: 42, templateCode: 'MAHNUNG_FINAL', sendChannel: 'both', feeEur: 15, autoSend: false, escalationTarget: null },
  { level: 4, label: 'Inkasso-Übergabe', daysAfterDue: 60, templateCode: null, sendChannel: 'letter', feeEur: 0, autoSend: false, escalationTarget: 'inkasso' },
];

// ─── Rent Increase (§558 BGB) ─────────────────────────────────
export interface RentIncreaseCheck {
  leaseId: string;
  currentRentCold: number;
  lastIncreaseAt: string | null;
  rentModel: string | null; // FIX, INDEX, STAFFEL
  leaseStartDate: string;
  lockoutMonths: number;       // §558 BGB: 15 Monate
  capPercent: number;          // Kappungsgrenze: 20% (normal) or 15% (angespannt)
  capPeriodYears: number;      // 3 Jahre
  isEligible: boolean;
  nextEligibleDate: string | null;
  reasons: string[];
}

export const RENT_INCREASE_DEFAULTS = {
  lockoutMonths: 15,           // §558 Abs. 1 BGB
  capPercentNormal: 20,        // §558 Abs. 3 BGB
  capPercentTight: 15,         // §558 Abs. 3 BGB (angespannter Markt)
  capPeriodYears: 3,           // Vergleichszeitraum
  indexMinMonths: 12,          // Mindestabstand Indexerhöhung
  staffelMinMonths: 12,        // Mindestabstand Staffelschritt
} as const;

// ─── Lease Analysis Input ─────────────────────────────────────
export interface LeaseAnalysisInput {
  leaseId: string;
  tenantId: string;
  unitId: string;
  propertyId: string;
  status: string;
  phase: TLCPhase;
  startDate: string;
  endDate: string | null;
  noticeDate: string | null;
  rentColdEur: number | null;
  nkAdvanceEur: number | null;
  monthlyRent: number;
  paymentDueDay: number | null;
  depositAmountEur: number | null;
  depositStatus: string | null;
  rentModel: string | null;
  lastRentIncreaseAt: string | null;
  nextRentAdjustmentDate: string | null;
  staffelSchedule: unknown;
  indexBaseMonth: string | null;
}

// ─── TLC Check Result ─────────────────────────────────────────
export interface TLCCheckResult {
  leaseId: string;
  phase: TLCPhase;
  events: TLCEventCandidate[];
  tasks: TLCTaskCandidate[];
  nextBestActions: string[];
  riskScore: number; // 0-100
}

export interface TLCEventCandidate {
  eventType: TLCEventType;
  severity: TLCSeverity;
  title: string;
  description: string;
  payload: Record<string, unknown>;
}

export interface TLCTaskCandidate {
  taskType: TenancyTaskType;
  category: TenancyTaskCategory;
  title: string;
  description: string;
  priority: TenancyTaskPriority;
  dueDate: string | null;
}

// ─── Engine Version ───────────────────────────────────────────
export const TLC_ENGINE_VERSION = '1.0.0';
