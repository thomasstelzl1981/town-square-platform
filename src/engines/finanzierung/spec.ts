/**
 * Finanzierungs-Engine — Typen & Konstanten (SSOT)
 */

// ─── Haushaltsrechnung ───────────────────────────────────────────

export interface IncomeItem {
  label: string;
  amount: number; // monatlich, EUR
  category: 'salary' | 'rental' | 'pension' | 'child_benefit' | 'alimony' | 'side_job' | 'self_employed' | 'other';
}

export interface ExpenseItem {
  label: string;
  amount: number; // monatlich, EUR
  category: 'rent' | 'loan' | 'insurance' | 'living' | 'car_leasing' | 'child_support' | 'other';
}

export interface HaushaltsrechnungInput {
  incomes: IncomeItem[];
  expenses: ExpenseItem[];
  /** Geplante neue Rate (z.B. Immobilienfinanzierung) */
  plannedRate?: number;
}

export interface HaushaltsrechnungResult {
  totalIncome: number;
  totalExpenses: number;
  surplus: number;
  surplusAfterPlannedRate: number;
  /** Debt-Service-Ratio: Gesamtbelastung / Einkommen */
  dsr: number;
  dsrAfterPlannedRate: number;
  isViable: boolean;
}

// ─── Bonitaet ────────────────────────────────────────────────────

export interface BonitaetInput {
  purchasePrice: number;
  loanAmount: number;
  propertyValue: number;
  annualNetIncome: number;
  annualDebtService: number;
  /** Geplanter jaehrlicher Schuldendienst (neue Finanzierung) */
  plannedAnnualDebtService: number;
}

export type TrafficLight = 'green' | 'yellow' | 'red';

export interface BonitaetResult {
  ltv: number;
  dscr: number;
  maxLoanAmount: number;
  rating: TrafficLight;
  messages: string[];
}

// ─── Annuitaet ───────────────────────────────────────────────────

export interface AnnuityParams {
  loanAmount: number;
  interestRatePercent: number;
  repaymentRatePercent: number;
  fixedRatePeriodYears: number;
}

export interface AnnuityResult {
  monthlyRate: number;
  yearlyRate: number;
  totalInterest: number;
  totalRepayment: number;
  remainingDebt: number;
  /** Tilgungsplan pro Jahr */
  schedule: AnnuityYearRow[];
}

export interface AnnuityYearRow {
  year: number;
  startBalance: number;
  interestPaid: number;
  principalPaid: number;
  endBalance: number;
}

// ─── Consumer Loan (Mock) ────────────────────────────────────────

export interface ConsumerLoanOffer {
  bankName: string;
  interestRate: number;
  monthlyRate: number;
  totalCost: number;
  termMonths: number;
}

// ─── Applicant Snapshot ──────────────────────────────────────────

export interface ApplicantSnapshotInput {
  profile: Record<string, unknown>;
}

export interface ApplicantSnapshotResult {
  snapshot: Record<string, unknown>;
  snapshotAt: string;
}

// ─── Defaults ────────────────────────────────────────────────────

// ─── Completion Score ────────────────────────────────────────────

export interface CompletionScoreInput {
  formData: Record<string, unknown>;
  requiredFields: string[];
}

export interface CompletionScoreResult {
  filledCount: number;
  totalRequired: number;
  percent: number;
}

// ─── Defaults ────────────────────────────────────────────────────

export const FINANZIERUNG_DEFAULTS = {
  fixedRatePeriodYears: 10,
  repaymentRatePercent: 2,
  interestRatePercent: 3.5,
  ltvMaxGreen: 0.8,
  ltvMaxYellow: 0.9,
  dscrMinGreen: 1.2,
  dscrMinYellow: 1.0,
  dsrMaxViable: 0.4,
  /** Mindest-Completion-Score fuer Einreichung */
  minCompletionScore: 80,
  mockBanks: ['Sparkasse', 'Deutsche Bank', 'ING', 'Commerzbank', 'KfW'] as const,
} as const;
