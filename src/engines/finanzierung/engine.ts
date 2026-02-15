/**
 * Finanzierungs-Engine — Reine Funktionen
 *
 * Kein DB-Zugriff, kein State, vollstaendig testbar.
 */

import type {
  HaushaltsrechnungInput,
  HaushaltsrechnungResult,
  BonitaetInput,
  BonitaetResult,
  TrafficLight,
  AnnuityParams,
  AnnuityResult,
  AnnuityYearRow,
  ConsumerLoanOffer,
  ApplicantSnapshotInput,
  ApplicantSnapshotResult,
  CompletionScoreInput,
  CompletionScoreResult,
} from './spec';
import { FINANZIERUNG_DEFAULTS } from './spec';

// ─── Haushaltsrechnung ───────────────────────────────────────────

export function calcHaushaltsrechnung(input: HaushaltsrechnungInput): HaushaltsrechnungResult {
  const totalIncome = input.incomes.reduce((s, i) => s + i.amount, 0);
  const totalExpenses = input.expenses.reduce((s, e) => s + e.amount, 0);
  const surplus = totalIncome - totalExpenses;
  const plannedRate = input.plannedRate ?? 0;
  const surplusAfterPlannedRate = surplus - plannedRate;

  const dsr = totalIncome > 0 ? totalExpenses / totalIncome : 1;
  const dsrAfterPlannedRate = totalIncome > 0 ? (totalExpenses + plannedRate) / totalIncome : 1;

  return {
    totalIncome,
    totalExpenses,
    surplus,
    surplusAfterPlannedRate,
    dsr,
    dsrAfterPlannedRate,
    isViable: dsrAfterPlannedRate <= FINANZIERUNG_DEFAULTS.dsrMaxViable,
  };
}

// ─── Bonitaet ────────────────────────────────────────────────────

export function calcBonitaet(input: BonitaetInput): BonitaetResult {
  const { purchasePrice, loanAmount, propertyValue, annualNetIncome, annualDebtService, plannedAnnualDebtService } = input;

  const ltv = propertyValue > 0 ? loanAmount / propertyValue : 1;
  const totalDebtService = annualDebtService + plannedAnnualDebtService;
  const dscr = totalDebtService > 0 ? annualNetIncome / totalDebtService : 99;

  // Max Darlehensbetrag bei max. LTV
  const maxLoanAmount = propertyValue * FINANZIERUNG_DEFAULTS.ltvMaxGreen;

  const messages: string[] = [];
  let rating: TrafficLight = 'green';

  if (ltv > FINANZIERUNG_DEFAULTS.ltvMaxYellow) {
    rating = 'red';
    messages.push(`LTV ${(ltv * 100).toFixed(1)}% ueberschreitet 90%-Grenze`);
  } else if (ltv > FINANZIERUNG_DEFAULTS.ltvMaxGreen) {
    rating = 'yellow';
    messages.push(`LTV ${(ltv * 100).toFixed(1)}% liegt ueber 80%`);
  }

  if (dscr < FINANZIERUNG_DEFAULTS.dscrMinYellow) {
    rating = 'red';
    messages.push(`DSCR ${dscr.toFixed(2)} unter Minimum 1.0`);
  } else if (dscr < FINANZIERUNG_DEFAULTS.dscrMinGreen) {
    if (rating !== 'red') rating = 'yellow';
    messages.push(`DSCR ${dscr.toFixed(2)} unter Komfortzone 1.2`);
  }

  if (messages.length === 0) {
    messages.push('Bonität im grünen Bereich');
  }

  return { ltv, dscr, maxLoanAmount, rating, messages };
}

// ─── Annuitaet ───────────────────────────────────────────────────

export function calcAnnuity(params: AnnuityParams): AnnuityResult {
  const { loanAmount, interestRatePercent, repaymentRatePercent, fixedRatePeriodYears } = params;

  const interestRate = interestRatePercent / 100;
  const repaymentRate = repaymentRatePercent / 100;
  const yearlyRate = loanAmount * (interestRate + repaymentRate);
  const monthlyRate = yearlyRate / 12;

  const schedule: AnnuityYearRow[] = [];
  let balance = loanAmount;
  let totalInterest = 0;
  let totalRepayment = 0;

  for (let year = 1; year <= fixedRatePeriodYears; year++) {
    const interestPaid = balance * interestRate;
    const principalPaid = yearlyRate - interestPaid;
    const endBalance = Math.max(0, balance - principalPaid);

    totalInterest += interestPaid;
    totalRepayment += principalPaid;

    schedule.push({
      year,
      startBalance: balance,
      interestPaid,
      principalPaid,
      endBalance,
    });

    balance = endBalance;
    if (balance <= 0) break;
  }

  return {
    monthlyRate,
    yearlyRate,
    totalInterest,
    totalRepayment,
    remainingDebt: balance,
    schedule,
  };
}

// ─── Consumer Loan Mock Offers ───────────────────────────────────

export function calcConsumerLoanOffers(amount: number, termMonths: number): ConsumerLoanOffer[] {
  if (amount <= 0 || termMonths <= 0) return [];

  return FINANZIERUNG_DEFAULTS.mockBanks.map((bankName, i) => {
    const baseRate = 3.5 + i * 0.8;
    const interestRate = baseRate + (amount > 50000 ? 0.5 : 0);
    const monthlyInterestRate = interestRate / 100 / 12;

    const monthlyRate =
      monthlyInterestRate > 0
        ? (amount * monthlyInterestRate) / (1 - Math.pow(1 + monthlyInterestRate, -termMonths))
        : amount / termMonths;

    const totalCost = monthlyRate * termMonths;

    return { bankName, interestRate, monthlyRate, totalCost, termMonths };
  });
}

// ─── Applicant Snapshot ──────────────────────────────────────────

export function createApplicantSnapshot(input: ApplicantSnapshotInput): ApplicantSnapshotResult {
  return {
    snapshot: { ...input.profile },
    snapshotAt: new Date().toISOString(),
  };
}

// ─── Completion Score ────────────────────────────────────────────

export function calcCompletionScore(input: CompletionScoreInput): CompletionScoreResult {
  const filledCount = input.requiredFields.filter(f => {
    const val = input.formData[f];
    return val !== null && val !== undefined && val !== '';
  }).length;
  return {
    filledCount,
    totalRequired: input.requiredFields.length,
    percent: input.requiredFields.length > 0
      ? Math.round((filledCount / input.requiredFields.length) * 100)
      : 0,
  };
}
