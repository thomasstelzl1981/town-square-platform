/**
 * Engine 17: Konto-Matching Engine (ENG-KONTOMATCH)
 * Pure functions for transaction unification, categorisation, and matching.
 */

import {
  type UnifiedTransaction,
  type CsvTransactionRow,
  type FinapiTransactionRow,
  type MatchRule,
  type MatchResult,
  type OwnerContext,
  type LeaseContext,
  type RentMatchResult,
  type PVPlantContext,
  type PVMatchResult,
  type LoanContext,
  type LoanMatchResult,
  TransactionCategory,
  DEFAULT_MATCH_RULES,
  MATCH_TOLERANCES,
} from './spec';

// ─── Unification ──────────────────────────────────────────────

export function unifyCsvTransaction(row: CsvTransactionRow): UnifiedTransaction {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    accountRef: row.account_ref,
    bookingDate: row.booking_date,
    amount: Number(row.amount_eur),
    purpose: (row.purpose_text || '').trim(),
    counterparty: (row.counterparty || '').trim(),
    source: 'csv',
  };
}

export function unifyFinapiTransaction(row: FinapiTransactionRow): UnifiedTransaction {
  return {
    id: row.finapi_transaction_id,
    tenantId: row.tenant_id,
    accountRef: row.finapi_account_id,
    bookingDate: row.booking_date,
    amount: Number(row.amount),
    purpose: (row.purpose || '').trim(),
    counterparty: (row.counterparty_name || '').trim(),
    source: 'finapi',
  };
}

// ─── Rule-based categorisation ────────────────────────────────

function matchesRule(tx: UnifiedTransaction, rule: MatchRule): boolean {
  // Direction check
  const isCredit = tx.amount > 0;
  if (rule.direction === 'credit' && !isCredit) return false;
  if (rule.direction === 'debit' && isCredit) return false;

  // Amount range check
  if (rule.amountRange) {
    const abs = Math.abs(tx.amount);
    if (rule.amountRange.min !== undefined && abs < rule.amountRange.min) return false;
    if (rule.amountRange.max !== undefined && abs > rule.amountRange.max) return false;
  }

  // Pattern check
  const haystack = `${tx.purpose} ${tx.counterparty}`.toLowerCase();
  if (rule.requireAllPatterns) {
    return rule.patterns.every((p) => haystack.includes(p));
  }
  return rule.patterns.some((p) => haystack.includes(p));
}

/**
 * Categorise a single transaction using rule-based matching.
 * Returns the best match or a SONSTIG fallback.
 */
export function categorizeTransaction(
  tx: UnifiedTransaction,
  context: OwnerContext,
  rules: MatchRule[] = DEFAULT_MATCH_RULES,
): MatchResult {
  const applicableRules = rules.filter((r) => r.ownerTypes.includes(context.ownerType));

  for (const rule of applicableRules) {
    if (matchesRule(tx, rule)) {
      return {
        transactionId: tx.id,
        category: rule.category,
        confidence: 0.85,
        matchedBy: 'rule',
        ruleCode: rule.ruleCode,
      };
    }
  }

  // Fallback
  const fallbackCategory = tx.amount > 0
    ? TransactionCategory.SONSTIG_EINGANG
    : TransactionCategory.SONSTIG_AUSGANG;

  return {
    transactionId: tx.id,
    category: fallbackCategory,
    confidence: 0.1,
    matchedBy: 'rule',
    ruleCode: 'FALLBACK',
  };
}

// ─── Rent matching (extracted from sot-rent-match) ────────────

export function matchRentPayment(
  tx: UnifiedTransaction,
  lease: LeaseContext,
  tolerance: number = MATCH_TOLERANCES.rentAmountEur,
): RentMatchResult {
  if (tx.amount <= 0) {
    return { matched: false, status: 'partial', amountDiff: 0, confidence: 0 };
  }

  const diff = tx.amount - lease.warmRent;
  const absDiff = Math.abs(diff);

  // Too far off — skip
  if (absDiff > lease.warmRent * 0.5) {
    return { matched: false, status: 'partial', amountDiff: diff, confidence: 0 };
  }

  const isExact = absDiff <= tolerance;

  // Purpose / name matching boost
  const haystack = `${tx.purpose} ${tx.counterparty}`.toLowerCase();
  const searchTerms: string[] = [];
  if (lease.tenantLastName) searchTerms.push(lease.tenantLastName.toLowerCase());
  if (lease.tenantCompany) searchTerms.push(lease.tenantCompany.toLowerCase());
  if (lease.unitCode) searchTerms.push(lease.unitCode.toLowerCase());

  const hasPurposeMatch = searchTerms.length > 0 && searchTerms.some((t) => haystack.includes(t));

  if (!isExact && !hasPurposeMatch) {
    return { matched: false, status: 'partial', amountDiff: diff, confidence: 0 };
  }

  let confidence = isExact ? 0.95 : 0.7;
  if (hasPurposeMatch) confidence = Math.min(1, confidence + 0.1);

  const status = isExact ? 'paid' : diff > 0 ? 'overpaid' : 'partial';

  return { matched: true, status, amountDiff: diff, confidence };
}

// ─── PV feed-in matching ──────────────────────────────────────

export function matchPVIncome(
  tx: UnifiedTransaction,
  plant: PVPlantContext,
): PVMatchResult {
  if (tx.amount <= 0) {
    return { matched: false, category: TransactionCategory.SONSTIG_AUSGANG, confidence: 0 };
  }

  const haystack = `${tx.purpose} ${tx.counterparty}`.toLowerCase();
  const pvPatterns = ['einspeisevergütung', 'einspeisung', 'netzbetreiber', 'eeg'];

  const hasPattern = pvPatterns.some((p) => haystack.includes(p));
  const hasOperator = plant.gridOperator
    ? haystack.includes(plant.gridOperator.toLowerCase())
    : false;

  if (!hasPattern && !hasOperator) {
    return { matched: false, category: TransactionCategory.SONSTIG_EINGANG, confidence: 0 };
  }

  let confidence = hasPattern ? 0.8 : 0.6;
  if (hasOperator) confidence = Math.min(1, confidence + 0.15);
  if (plant.expectedMonthlyFeedIn) {
    const diff = Math.abs(tx.amount - plant.expectedMonthlyFeedIn);
    if (diff <= MATCH_TOLERANCES.pvFeedInEur) confidence = Math.min(1, confidence + 0.1);
  }

  return { matched: true, category: TransactionCategory.EINSPEISEVERGUETUNG, confidence };
}

// ─── Loan payment matching ────────────────────────────────────

export function matchLoanPayment(
  tx: UnifiedTransaction,
  loan: LoanContext,
): LoanMatchResult {
  // Loans are debits (negative amounts)
  if (tx.amount >= 0) {
    return { matched: false, confidence: 0 };
  }

  let confidence = 0;

  // IBAN check
  if (loan.bankIban) {
    const haystack = `${tx.purpose} ${tx.counterparty}`.toLowerCase();
    const ibanNorm = loan.bankIban.replace(/\s/g, '').toLowerCase();
    if (haystack.includes(ibanNorm)) {
      confidence += 0.6;
    }
  }

  // Amount check
  if (loan.monthlyRate) {
    const diff = Math.abs(Math.abs(tx.amount) - loan.monthlyRate);
    if (diff <= MATCH_TOLERANCES.loanAmountEur) {
      confidence += 0.35;
    }
  }

  // Pattern check
  const haystack = `${tx.purpose} ${tx.counterparty}`.toLowerCase();
  const loanPatterns = ['darlehen', 'tilgung', 'annuität', 'kreditrate'];
  if (loanPatterns.some((p) => haystack.includes(p))) {
    confidence += 0.2;
  }

  confidence = Math.min(1, confidence);

  return {
    matched: confidence >= MATCH_TOLERANCES.minConfidence,
    confidence,
  };
}
