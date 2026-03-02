/**
 * ENG-TLC — Tenancy Lifecycle Controller: Specification
 * 
 * Pure types, interfaces, constants. NO logic, NO side effects.
 * 
 * @engine ENG-TLC
 * @version 1.1.0
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
  | 'dunning_mail_sent' | 'dunning_mail_failed'
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
  | 'deposit_settled' | 'deposit_payout' | 'deposit_interest_calculated'
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
export type TenancyTaskCategory = 'payment' | 'nk' | 'maintenance' | 'insurance' | 'communication' | 'legal' | 'deposit' | 'rent_increase' | 'move_in' | 'move_out' | 'meter_reading';
export type TenancyTaskPriority = 'low' | 'normal' | 'high' | 'urgent';
export type TenancyTaskStatus = 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed' | 'cancelled';

// ─── Handover Protocol ───────────────────────────────────────
export type HandoverProtocolType = 'move_in' | 'move_out';
export type HandoverProtocolStatus = 'draft' | 'completed' | 'signed';

export interface HandoverRoom {
  name: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  notes: string;
  photos: string[];
}

export interface HandoverKeyItem {
  type: string;
  count: number;
  serial: string | null;
  handed_over: boolean;
}

export interface HandoverMeterReading {
  meter_type: MeterType;
  meter_number: string;
  value: number;
}

// ─── Meter Readings ──────────────────────────────────────────
export type MeterType = 'electricity' | 'gas' | 'water' | 'heating' | 'hot_water';
export type MeterReadingType = 'regular' | 'move_in' | 'move_out' | 'interim';

// ─── Defect Severity (Mängel-Triage) ─────────────────────────
export type DefectSeverity = 'emergency' | 'urgent' | 'standard' | 'cosmetic';

export const DEFECT_SLA_HOURS: Record<DefectSeverity, number> = {
  emergency: 4,
  urgent: 24,
  standard: 72,
  cosmetic: 336,
};

export const DEFECT_TRIAGE_KEYWORDS: Record<DefectSeverity, string[]> = {
  emergency: ['rohrbruch', 'wasserrohrbruch', 'gasaustritt', 'brand', 'feuer', 'stromausfall', 'heizungsausfall'],
  urgent: ['kein warmwasser', 'toilette defekt', 'eingangstür', 'schloss defekt', 'schimmel'],
  standard: ['fenster', 'rolladen', 'herd', 'backofen', 'kühlschrank', 'spülmaschine', 'tropft'],
  cosmetic: ['kratzer', 'farbe', 'tapete', 'leiste', 'dichtung', 'silikon'],
};

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
  depositInterestRate: 0.001,  // 0.1% Sparbuchzins (§551 BGB)
  depositSettlementMonths: 6,  // 6 Monate Abrechnungsfrist nach Auszug
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

// ─── Move-In/Move-Out Checklist ──────────────────────────────
export interface MoveChecklist {
  leaseId: string;
  type: 'move_in' | 'move_out';
  items: MoveChecklistItem[];
  completedCount: number;
  totalCount: number;
  percentComplete: number;
}

export interface MoveChecklistItem {
  key: string;
  label: string;
  category: string;
  required: boolean;
  completed: boolean;
  completedAt: string | null;
}

export const MOVE_IN_CHECKLIST_ITEMS: Omit<MoveChecklistItem, 'completed' | 'completedAt'>[] = [
  { key: 'deposit_received', label: 'Kaution eingegangen', category: 'finanzen', required: true },
  { key: 'contract_signed', label: 'Mietvertrag unterzeichnet', category: 'vertrag', required: true },
  { key: 'handover_protocol', label: 'Übergabeprotokoll erstellt', category: 'übergabe', required: true },
  { key: 'meter_readings_recorded', label: 'Zählerstände abgelesen', category: 'übergabe', required: true },
  { key: 'keys_handed_over', label: 'Schlüssel übergeben', category: 'übergabe', required: true },
  { key: 'mailbox_label', label: 'Briefkasten beschriftet', category: 'übergabe', required: false },
  { key: 'utility_registration', label: 'Versorger angemeldet', category: 'verwaltung', required: false },
  { key: 'tenant_registered', label: 'Mieter im System angelegt', category: 'verwaltung', required: true },
];

export const MOVE_OUT_CHECKLIST_ITEMS: Omit<MoveChecklistItem, 'completed' | 'completedAt'>[] = [
  { key: 'notice_confirmed', label: 'Kündigung bestätigt', category: 'vertrag', required: true },
  { key: 'handover_date_set', label: 'Übergabetermin vereinbart', category: 'übergabe', required: true },
  { key: 'handover_protocol', label: 'Übergabeprotokoll erstellt', category: 'übergabe', required: true },
  { key: 'meter_readings_final', label: 'Zählerstände (Endablesung)', category: 'übergabe', required: true },
  { key: 'keys_returned', label: 'Schlüssel zurückgegeben', category: 'übergabe', required: true },
  { key: 'deposit_settlement', label: 'Kautionsabrechnung erstellt', category: 'finanzen', required: true },
  { key: 'nk_settlement', label: 'NK-Abrechnung erstellt', category: 'finanzen', required: true },
  { key: 'defects_resolved', label: 'Mängel behoben / dokumentiert', category: 'übergabe', required: false },
  { key: 'utility_deregistration', label: 'Versorger abgemeldet', category: 'verwaltung', required: false },
  { key: 'deposit_paid_out', label: 'Kaution ausgezahlt', category: 'finanzen', required: true },
];

// ─── Payment Plan (Ratenplan) ─────────────────────────────────
export interface PaymentPlanInput {
  totalArrears: number;
  monthlyInstallment: number;
  installmentsCount: number;
  startDate: string;
}

export interface PaymentPlanSchedule {
  installmentNumber: number;
  dueDate: string;
  amount: number;
  cumulativePaid: number;
  remainingBalance: number;
}

// ─── Rent Reduction (Mietminderung) ──────────────────────────
export interface RentReductionInput {
  baseRentCold: number;
  reductionPercent: number;
  effectiveFrom: string;
  effectiveUntil: string | null;
  reason: string;
}

export interface RentReductionResult {
  baseRent: number;
  reductionPercent: number;
  reducedRent: number;
  monthlyReduction: number;
  effectiveFrom: string;
  effectiveUntil: string | null;
  totalReductionEstimate: number;
  legalBasis: string;
}

/** Standard rent reduction percentages by defect category (case law guidance) */
export const RENT_REDUCTION_GUIDELINES: Record<string, { minPercent: number; maxPercent: number; description: string }> = {
  heating_failure: { minPercent: 20, maxPercent: 100, description: 'Heizungsausfall (Wintermonate bis 100%)' },
  hot_water_failure: { minPercent: 10, maxPercent: 20, description: 'Kein Warmwasser' },
  mold: { minPercent: 10, maxPercent: 25, description: 'Schimmelbefall' },
  noise_construction: { minPercent: 10, maxPercent: 30, description: 'Baulärm in der Umgebung' },
  elevator_broken: { minPercent: 3, maxPercent: 10, description: 'Aufzug defekt (obere Stockwerke höher)' },
  window_defect: { minPercent: 5, maxPercent: 15, description: 'Undichte Fenster' },
  water_damage: { minPercent: 20, maxPercent: 50, description: 'Wasserschaden / Feuchtigkeit' },
  pest_infestation: { minPercent: 10, maxPercent: 50, description: 'Schädlingsbefall' },
  area_deviation: { minPercent: 0, maxPercent: 100, description: 'Flächenabweichung >10% (BGH)' },
};

// ─── Deadline Types ──────────────────────────────────────────
export const DEADLINE_TYPES = {
  nk_settlement: 'NK-Abrechnung',
  rent_increase: 'Mieterhöhung',
  lease_renewal: 'Vertragsverlängerung',
  deposit_settlement: 'Kautionsabrechnung',
  inspection: 'Begehung/Inspektion',
  insurance_renewal: 'Versicherung',
  maintenance: 'Wartung',
  legal: 'Rechtliche Frist',
  custom: 'Individuell',
} as const;

export type DeadlineType = keyof typeof DEADLINE_TYPES;

// ─── Engine Version ───────────────────────────────────────────
export const TLC_ENGINE_VERSION = '1.5.0';
