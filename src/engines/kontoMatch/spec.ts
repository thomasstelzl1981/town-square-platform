/**
 * Engine 17: Konto-Matching Engine (ENG-KONTOMATCH)
 * SSOT für Transaktions-Kategorisierung und -Zuordnung
 *
 * Ordnet Kontobewegungen automatisch Immobilien, PV-Anlagen
 * und Verträgen zu (MOD-04, MOD-18, MOD-19).
 */

// ─── Kategorien ───────────────────────────────────────────────

export enum TransactionCategory {
  // Immobilien (property)
  MIETE = 'MIETE',
  HAUSGELD = 'HAUSGELD',
  GRUNDSTEUER = 'GRUNDSTEUER',
  VERSICHERUNG = 'VERSICHERUNG',
  DARLEHEN = 'DARLEHEN',
  INSTANDHALTUNG = 'INSTANDHALTUNG',

  // PV-Anlage (pv_plant)
  EINSPEISEVERGUETUNG = 'EINSPEISEVERGUETUNG',
  WARTUNG = 'WARTUNG',
  PACHT = 'PACHT',

  // Person
  GEHALT = 'GEHALT',

  // Generisch
  SONSTIG_EINGANG = 'SONSTIG_EINGANG',
  SONSTIG_AUSGANG = 'SONSTIG_AUSGANG',
}

export type TransactionDirection = 'credit' | 'debit';

export type OwnerType = 'person' | 'property' | 'pv_plant';

// ─── Unified Transaction ──────────────────────────────────────

export interface UnifiedTransaction {
  id: string;
  tenantId: string;
  accountRef: string;
  bookingDate: string; // YYYY-MM-DD
  amount: number; // positive = credit, negative = debit
  purpose: string;
  counterparty: string;
  source: 'csv' | 'finapi';
}

// ─── CSV / FinAPI raw row shapes ──────────────────────────────

export interface CsvTransactionRow {
  id: string;
  tenant_id: string;
  account_ref: string;
  booking_date: string;
  amount_eur: number;
  purpose_text: string | null;
  counterparty: string | null;
  match_status: string | null;
}

export interface FinapiTransactionRow {
  finapi_transaction_id: string;
  tenant_id: string;
  finapi_account_id: string;
  booking_date: string;
  amount: number;
  purpose: string | null;
  counterparty_name: string | null;
}

// ─── Match Rules ──────────────────────────────────────────────

export interface MatchRule {
  ruleCode: string;
  category: TransactionCategory;
  ownerTypes: OwnerType[];
  direction: TransactionDirection;
  /** Lowercase substrings to search in purpose + counterparty */
  patterns: string[];
  /** If set, ALL patterns must match (AND). Default: any one matches (OR). */
  requireAllPatterns?: boolean;
  /** Optional amount range filter (absolute value) */
  amountRange?: { min?: number; max?: number };
}

export interface MatchResult {
  transactionId: string;
  category: TransactionCategory;
  confidence: number; // 0..1
  matchedBy: 'rule' | 'amount' | 'ai';
  ruleCode: string;
}

// ─── Rent-specific types ──────────────────────────────────────

export interface LeaseContext {
  leaseId: string;
  tenantId: string;
  warmRent: number;
  tenantLastName?: string;
  tenantCompany?: string;
  unitCode?: string;
}

export interface RentMatchResult {
  matched: boolean;
  status: 'paid' | 'partial' | 'overpaid';
  amountDiff: number;
  confidence: number;
}

// ─── PV-specific types ────────────────────────────────────────

export interface PVPlantContext {
  plantId: string;
  gridOperator?: string;
  expectedMonthlyFeedIn?: number;
  loanBankIban?: string;
}

export interface PVMatchResult {
  matched: boolean;
  category: TransactionCategory;
  confidence: number;
}

// ─── Loan-specific types ──────────────────────────────────────

export interface LoanContext {
  loanId: string;
  bankIban?: string;
  monthlyRate?: number;
}

export interface LoanMatchResult {
  matched: boolean;
  confidence: number;
}

// ─── Owner Context (passed to categorize) ─────────────────────

export interface OwnerContext {
  ownerType: OwnerType;
  leases?: LeaseContext[];
  pvPlants?: PVPlantContext[];
  loans?: LoanContext[];
  knownIbans?: Record<string, string>; // IBAN → label
}

// ─── Tolerances & Constants ───────────────────────────────────

export const MATCH_TOLERANCES = {
  rentAmountEur: 1,
  loanAmountEur: 0.5,
  pvFeedInEur: 5,
  minConfidence: 0.75,
} as const;

export const ENGINE_VERSION = '1.0.0';

// ─── Default Matching Rules (SSOT) ────────────────────────────

export const DEFAULT_MATCH_RULES: MatchRule[] = [
  // ── Property rules ──
  {
    ruleCode: 'PROP_HAUSGELD',
    category: TransactionCategory.HAUSGELD,
    ownerTypes: ['property'],
    direction: 'debit',
    patterns: ['hausgeld', 'weg', 'hausverwaltung', 'wohnungseigentümer'],
  },
  {
    ruleCode: 'PROP_GRUNDSTEUER',
    category: TransactionCategory.GRUNDSTEUER,
    ownerTypes: ['property'],
    direction: 'debit',
    patterns: ['grundsteuer', 'finanzamt'],
  },
  {
    ruleCode: 'PROP_VERSICHERUNG',
    category: TransactionCategory.VERSICHERUNG,
    ownerTypes: ['property'],
    direction: 'debit',
    patterns: ['versicherung', 'gebäudeversicherung', 'wohngebäude'],
  },
  {
    ruleCode: 'PROP_INSTANDHALTUNG',
    category: TransactionCategory.INSTANDHALTUNG,
    ownerTypes: ['property'],
    direction: 'debit',
    patterns: ['reparatur', 'sanierung', 'handwerker', 'instandhaltung', 'wartung'],
  },

  // ── PV rules ──
  {
    ruleCode: 'PV_EINSPEISUNG',
    category: TransactionCategory.EINSPEISEVERGUETUNG,
    ownerTypes: ['pv_plant'],
    direction: 'credit',
    patterns: ['einspeisevergütung', 'einspeisung', 'netzbetreiber', 'eeg'],
  },
  {
    ruleCode: 'PV_WARTUNG',
    category: TransactionCategory.WARTUNG,
    ownerTypes: ['pv_plant'],
    direction: 'debit',
    patterns: ['wartung', 'service', 'solar', 'photovoltaik', 'pv'],
  },
  {
    ruleCode: 'PV_PACHT',
    category: TransactionCategory.PACHT,
    ownerTypes: ['pv_plant'],
    direction: 'debit',
    patterns: ['pacht', 'dachmiete', 'dachpacht', 'flächenmiete'],
  },
  {
    ruleCode: 'PV_VERSICHERUNG',
    category: TransactionCategory.VERSICHERUNG,
    ownerTypes: ['pv_plant'],
    direction: 'debit',
    patterns: ['versicherung'],
  },

  // ── Shared rules ──
  {
    ruleCode: 'SHARED_DARLEHEN',
    category: TransactionCategory.DARLEHEN,
    ownerTypes: ['property', 'pv_plant'],
    direction: 'debit',
    patterns: ['darlehen', 'tilgung', 'annuität', 'kreditrate', 'zins und tilgung'],
  },

  // ── Person rules ──
  {
    ruleCode: 'PERSON_GEHALT',
    category: TransactionCategory.GEHALT,
    ownerTypes: ['person'],
    direction: 'credit',
    patterns: ['gehalt', 'lohn', 'bezüge', 'entgelt'],
  },
];

// ─── Recurring Contract Detection ──────────────────────────

export type ContractTargetTable = 'user_subscriptions' | 'insurance_contracts' | 'miety_contracts';

export type RecurringFrequency = 'monatlich' | 'quartalsweise' | 'jaehrlich';

export interface RecurringPattern {
  counterparty: string;
  averageAmount: number;
  frequency: RecurringFrequency;
  intervalDays: number;
  occurrences: number;
  firstSeen: string;
  lastSeen: string;
  sampleTransactionIds: string[];
}

export interface DetectedContract {
  id: string;
  counterparty: string;
  amount: number;
  frequency: RecurringFrequency;
  category: TransactionCategory;
  targetTable: ContractTargetTable;
  targetLabel: string;
  confidence: number;
  pattern: RecurringPattern;
  selected: boolean;
  homeId?: string;  // Required for miety_contracts (home assignment)
}

// (CATEGORY_TARGET_MAP removed — dead code, cleaned up 2026-02-24)


export const ENERGY_PATTERNS: string[] = [
  'stadtwerke', 'swm', 'eon', 'e.on', 'vattenfall', 'rwe', 'enbw',
  'strom', 'gas', 'fernwaerme', 'grundversorgung', 'energie',
  'unitymedia', 'kabel deutschland', 'glasfaser',
];

export const INSURANCE_PATTERNS: string[] = [
  'allianz', 'axa', 'ergo', 'huk', 'huk-coburg', 'devk', 'generali',
  'zurich', 'nuernberger', 'debeka', 'signal iduna', 'versicherung',
  'haftpflicht', 'hausrat', 'rechtsschutz', 'berufsunfaehigkeit',
  'krankenversicherung', 'kfz-versicherung', 'lebensversicherung',
];

export const SUBSCRIPTION_PATTERNS: string[] = [
  'netflix', 'spotify', 'amazon prime', 'disney', 'apple',
  'youtube', 'dazn', 'sky', 'microsoft', 'adobe', 'google one',
  'dropbox', 'icloud', 'playstation', 'xbox', 'nintendo',
  'fitx', 'mcfit', 'urban sports', 'gym', 'fitness',
  'zeit', 'spiegel', 'faz', 'sueddeutsche', 'handelsblatt',
  'telekom', 'vodafone', 'o2', 'telefonica', '1und1', '1&1',
  'internet', 'mobilfunk',
];

export const RECURRING_DETECTION = {
  MIN_OCCURRENCES: 2,
  AMOUNT_TOLERANCE_PERCENT: 0.05,
  MONTHLY_INTERVAL: { min: 25, max: 35 },
  QUARTERLY_INTERVAL: { min: 80, max: 100 },
  YEARLY_INTERVAL: { min: 350, max: 380 },
} as const;
