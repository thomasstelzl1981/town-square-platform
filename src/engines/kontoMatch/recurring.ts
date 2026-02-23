/**
 * Engine 17 Extension: Recurring Contract Detection
 * Pure function — detects recurring payment patterns from categorized transactions.
 */

import {
  type DetectedContract,
  type RecurringPattern,
  type RecurringFrequency,
  type ContractTargetTable,
  TransactionCategory,
  ENERGY_PATTERNS,
  INSURANCE_PATTERNS,
  SUBSCRIPTION_PATTERNS,
  RECURRING_DETECTION,
} from './spec';

// ─── Input Type (from DB row shape) ──────────────────────

export interface TransactionRow {
  id: string;
  booking_date: string;
  amount_eur: number;
  counterparty: string | null;
  purpose_text: string | null;
  match_category: string | null;
  match_status: string | null;
}

// ─── Helpers ─────────────────────────────────────────────

function normalizeCounterparty(raw: string | null): string {
  if (!raw) return '';
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9äöüß\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function daysBetween(a: string, b: string): number {
  const da = new Date(a).getTime();
  const db = new Date(b).getTime();
  return Math.abs(db - da) / (1000 * 60 * 60 * 24);
}

function amountsAreSimilar(a: number, b: number): boolean {
  const absA = Math.abs(a);
  const absB = Math.abs(b);
  if (absA === 0 && absB === 0) return true;
  const avg = (absA + absB) / 2;
  if (avg === 0) return true;
  return Math.abs(absA - absB) / avg <= RECURRING_DETECTION.AMOUNT_TOLERANCE_PERCENT;
}

function detectFrequency(intervals: number[]): RecurringFrequency | null {
  if (intervals.length === 0) return null;
  const avg = intervals.reduce((s, v) => s + v, 0) / intervals.length;

  const { MONTHLY_INTERVAL, QUARTERLY_INTERVAL, YEARLY_INTERVAL } = RECURRING_DETECTION;

  if (avg >= MONTHLY_INTERVAL.min && avg <= MONTHLY_INTERVAL.max) return 'monatlich';
  if (avg >= QUARTERLY_INTERVAL.min && avg <= QUARTERLY_INTERVAL.max) return 'quartalsweise';
  if (avg >= YEARLY_INTERVAL.min && avg <= YEARLY_INTERVAL.max) return 'jaehrlich';
  return null;
}

function haystackContains(haystack: string, patterns: string[]): boolean {
  return patterns.some(p => haystack.includes(p));
}

function resolveTargetTable(
  category: TransactionCategory,
  counterparty: string,
  purpose: string,
): { table: ContractTargetTable; label: string } {
  const haystack = `${counterparty} ${purpose}`.toLowerCase();

  if (category === TransactionCategory.VERSICHERUNG) {
    return { table: 'insurance_contracts', label: 'Versicherung' };
  }

  if (haystackContains(haystack, INSURANCE_PATTERNS)) {
    return { table: 'insurance_contracts', label: 'Versicherung' };
  }
  if (haystackContains(haystack, ENERGY_PATTERNS)) {
    return { table: 'miety_contracts', label: 'Energievertrag' };
  }
  if (haystackContains(haystack, SUBSCRIPTION_PATTERNS)) {
    return { table: 'user_subscriptions', label: 'Abo' };
  }

  return { table: 'user_subscriptions', label: 'Abo' };
}

function generateTempId(): string {
  return 'temp-' + Math.random().toString(36).slice(2, 10);
}

// ─── Main Detection Function ─────────────────────────────

export function detectRecurringContracts(
  transactions: TransactionRow[],
): DetectedContract[] {
  const SKIP_CATEGORIES = new Set([
    TransactionCategory.MIETE,
    TransactionCategory.HAUSGELD,
    TransactionCategory.GRUNDSTEUER,
    TransactionCategory.DARLEHEN,
    TransactionCategory.INSTANDHALTUNG,
    TransactionCategory.EINSPEISEVERGUETUNG,
    TransactionCategory.WARTUNG,
    TransactionCategory.PACHT,
    TransactionCategory.GEHALT,
    TransactionCategory.SONSTIG_EINGANG,
  ]);

  const candidates = transactions.filter(tx => {
    if (tx.amount_eur >= 0) return false;
    if (!tx.counterparty) return false;
    const cat = tx.match_category as TransactionCategory;
    if (SKIP_CATEGORIES.has(cat)) return false;
    return true;
  });

  const groups = new Map<string, TransactionRow[]>();
  for (const tx of candidates) {
    const key = normalizeCounterparty(tx.counterparty);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(tx);
  }

  const results: DetectedContract[] = [];

  for (const [counterpartyKey, txs] of groups) {
    const sorted = [...txs].sort(
      (a, b) => new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime(),
    );

    const used = new Set<number>();
    for (let i = 0; i < sorted.length; i++) {
      if (used.has(i)) continue;
      const cluster: TransactionRow[] = [sorted[i]];
      used.add(i);

      for (let j = i + 1; j < sorted.length; j++) {
        if (used.has(j)) continue;
        if (amountsAreSimilar(sorted[i].amount_eur, sorted[j].amount_eur)) {
          cluster.push(sorted[j]);
          used.add(j);
        }
      }

      if (cluster.length < RECURRING_DETECTION.MIN_OCCURRENCES) continue;

      const intervals: number[] = [];
      for (let k = 1; k < cluster.length; k++) {
        intervals.push(daysBetween(cluster[k - 1].booking_date, cluster[k].booking_date));
      }

      const frequency = detectFrequency(intervals);
      if (!frequency) continue;

      const avgAmount = cluster.reduce((s, t) => s + Math.abs(t.amount_eur), 0) / cluster.length;
      const avgInterval = intervals.reduce((s, v) => s + v, 0) / intervals.length;
      const rawCounterparty = sorted[i].counterparty || counterpartyKey;
      const rawPurpose = sorted[i].purpose_text || '';
      const category = (sorted[i].match_category as TransactionCategory) || TransactionCategory.SONSTIG_AUSGANG;

      const { table, label } = resolveTargetTable(category, rawCounterparty, rawPurpose);

      const intervalVariance = intervals.length > 0
        ? intervals.reduce((s, v) => s + Math.abs(v - avgInterval), 0) / intervals.length
        : 0;
      let confidence = Math.min(0.95, 0.6 + (cluster.length * 0.05) - (intervalVariance * 0.005));
      confidence = Math.max(0.5, Math.min(1, confidence));

      const pattern: RecurringPattern = {
        counterparty: rawCounterparty,
        averageAmount: Math.round(avgAmount * 100) / 100,
        frequency,
        intervalDays: Math.round(avgInterval),
        occurrences: cluster.length,
        firstSeen: cluster[0].booking_date,
        lastSeen: cluster[cluster.length - 1].booking_date,
        sampleTransactionIds: cluster.slice(0, 5).map(t => t.id),
      };

      results.push({
        id: generateTempId(),
        counterparty: rawCounterparty,
        amount: Math.round(avgAmount * 100) / 100,
        frequency,
        category,
        targetTable: table,
        targetLabel: label,
        confidence,
        pattern,
        selected: true,
      });
    }
  }

  return results.sort((a, b) => b.confidence - a.confidence);
}
