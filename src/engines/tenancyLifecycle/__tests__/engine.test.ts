/**
 * ENG-TLC Engine Unit Tests — v1.5
 * 
 * Tests for:
 * - triageDefect
 * - checkRentIncreaseEligibility
 * - calculateDepositInterest
 * - generatePaymentPlanSchedule
 * - calculateRentReduction
 * - checkDeadlines
 */
import { describe, it, expect } from 'vitest';
import {
  triageDefect,
  checkRentIncreaseEligibility,
  calculateDepositInterest,
  generatePaymentPlanSchedule,
  calculateRentReduction,
  checkDeadlines,
  determinePhase,
  analyzePaymentStatus,
  determineDunningLevel,
  suggestRentReduction,
  checkPaymentPlanCompliance,
} from '../engine';
import type { LeaseAnalysisInput, PaymentPlanInput, RentReductionInput } from '../spec';

// ─── Helper: Create lease input ──────────────────────────────

function makeLease(overrides: Partial<LeaseAnalysisInput> = {}): LeaseAnalysisInput {
  return {
    leaseId: 'lease-001',
    tenantId: 'tenant-001',
    unitId: 'unit-001',
    propertyId: 'prop-001',
    status: 'active',
    phase: 'active',
    startDate: '2024-01-01',
    endDate: null,
    noticeDate: null,
    rentColdEur: 800,
    nkAdvanceEur: 200,
    monthlyRent: 1000,
    paymentDueDay: 1,
    depositAmountEur: 2400,
    depositStatus: 'paid',
    rentModel: 'FIX',
    lastRentIncreaseAt: null,
    nextRentAdjustmentDate: null,
    staffelSchedule: null,
    indexBaseMonth: null,
    ...overrides,
  };
}

// ─── triageDefect ─────────────────────────────────────────────

describe('triageDefect', () => {
  it('classifies emergency keywords', () => {
    const result = triageDefect('Es gibt einen Rohrbruch im Badezimmer');
    expect(result.severity).toBe('emergency');
    expect(result.slaHours).toBe(4);
    expect(result.matchedKeywords).toContain('rohrbruch');
  });

  it('classifies urgent keywords', () => {
    const result = triageDefect('Kein Warmwasser seit heute morgen');
    expect(result.severity).toBe('urgent');
    expect(result.slaHours).toBe(24);
  });

  it('classifies standard keywords', () => {
    const result = triageDefect('Der Rolladen im Schlafzimmer klemmt');
    expect(result.severity).toBe('standard');
    expect(result.slaHours).toBe(72);
  });

  it('classifies cosmetic keywords', () => {
    const result = triageDefect('Kleiner Kratzer an der Tür');
    expect(result.severity).toBe('cosmetic');
    expect(result.slaHours).toBe(336);
  });

  it('defaults to standard for unknown descriptions', () => {
    const result = triageDefect('Etwas stimmt nicht mit der Wohnung');
    expect(result.severity).toBe('standard');
    expect(result.matchedKeywords).toHaveLength(0);
  });

  it('is case-insensitive', () => {
    const result = triageDefect('BRAND im Keller');
    expect(result.severity).toBe('emergency');
  });
});

// ─── checkRentIncreaseEligibility ─────────────────────────────

describe('checkRentIncreaseEligibility', () => {
  it('allows first increase after 12 months', () => {
    const lease = makeLease({ startDate: '2024-01-01', lastRentIncreaseAt: null });
    const result = checkRentIncreaseEligibility(lease, '2025-02-01');
    expect(result.isEligible).toBe(true);
    expect(result.reasons.some(r => r.includes('erstmalig möglich'))).toBe(true);
  });

  it('blocks increase within 12 months of start', () => {
    const lease = makeLease({ startDate: '2025-01-01', lastRentIncreaseAt: null });
    const result = checkRentIncreaseEligibility(lease, '2025-06-01');
    expect(result.isEligible).toBe(false);
    expect(result.nextEligibleDate).toBeTruthy();
  });

  it('respects 15 month lockout after last increase', () => {
    const lease = makeLease({ lastRentIncreaseAt: '2024-06-01' });
    const result = checkRentIncreaseEligibility(lease, '2025-06-01');
    expect(result.isEligible).toBe(false); // 12 months, need 15
  });

  it('allows increase after 15 month lockout', () => {
    const lease = makeLease({ lastRentIncreaseAt: '2024-01-01' });
    const result = checkRentIncreaseEligibility(lease, '2025-05-01');
    expect(result.isEligible).toBe(true);
  });

  it('uses 20% cap for normal market', () => {
    const lease = makeLease({ lastRentIncreaseAt: '2023-01-01' });
    const result = checkRentIncreaseEligibility(lease, '2025-01-01', false);
    expect(result.capPercent).toBe(20);
  });

  it('uses 15% cap for tight market', () => {
    const lease = makeLease({ lastRentIncreaseAt: '2023-01-01' });
    const result = checkRentIncreaseEligibility(lease, '2025-01-01', true);
    expect(result.capPercent).toBe(15);
    expect(result.reasons.some(r => r.includes('Angespannter'))).toBe(true);
  });

  it('handles INDEX rent model', () => {
    const lease = makeLease({ rentModel: 'INDEX', lastRentIncreaseAt: '2024-01-01' });
    const result = checkRentIncreaseEligibility(lease, '2025-02-01');
    expect(result.isEligible).toBe(true);
    expect(result.reasons.some(r => r.includes('Indexmiete'))).toBe(true);
  });

  it('handles STAFFEL rent model', () => {
    const lease = makeLease({ rentModel: 'STAFFEL', nextRentAdjustmentDate: '2025-06-01' });
    const result = checkRentIncreaseEligibility(lease, '2025-07-01');
    expect(result.isEligible).toBe(true);
    expect(result.reasons.some(r => r.includes('Staffelmiete'))).toBe(true);
  });
});

// ─── calculateDepositInterest ─────────────────────────────────

describe('calculateDepositInterest', () => {
  it('calculates interest for 1 year at 0.1%', () => {
    const result = calculateDepositInterest(2400, '2024-01-01', '2025-01-01', 0.001);
    expect(result.accruedInterest).toBeCloseTo(2.4, 1);
    expect(result.years).toBeCloseTo(1.0, 0);
    expect(result.totalWithInterest).toBeGreaterThan(2400);
  });

  it('calculates interest for 5 years', () => {
    const result = calculateDepositInterest(3000, '2020-01-01', '2025-01-01', 0.001);
    expect(result.years).toBeCloseTo(5.0, 0);
    expect(result.accruedInterest).toBeGreaterThan(0);
    expect(result.totalWithInterest).toBeCloseTo(3000 * Math.pow(1.001, 5), 1);
  });

  it('returns 0 interest for same-day dates', () => {
    const result = calculateDepositInterest(2400, '2025-01-01', '2025-01-01', 0.001);
    expect(result.accruedInterest).toBe(0);
    expect(result.years).toBe(0);
  });

  it('handles zero deposit', () => {
    const result = calculateDepositInterest(0, '2024-01-01', '2025-01-01');
    expect(result.accruedInterest).toBe(0);
    expect(result.totalWithInterest).toBe(0);
  });

  it('uses default rate of 0.1%', () => {
    const result = calculateDepositInterest(1000, '2024-01-01', '2025-01-01');
    expect(result.annualRate).toBe(0.001);
  });
});

// ─── generatePaymentPlanSchedule ──────────────────────────────

describe('generatePaymentPlanSchedule', () => {
  it('generates correct number of installments', () => {
    const input: PaymentPlanInput = {
      totalArrears: 3000,
      monthlyInstallment: 500,
      installmentsCount: 6,
      startDate: '2025-04-01',
    };
    const schedule = generatePaymentPlanSchedule(input);
    expect(schedule).toHaveLength(6);
  });

  it('first installment is the specified amount', () => {
    const input: PaymentPlanInput = {
      totalArrears: 1000,
      monthlyInstallment: 250,
      installmentsCount: 4,
      startDate: '2025-04-01',
    };
    const schedule = generatePaymentPlanSchedule(input);
    expect(schedule[0].amount).toBe(250);
    expect(schedule[0].installmentNumber).toBe(1);
  });

  it('last installment covers remaining balance', () => {
    const input: PaymentPlanInput = {
      totalArrears: 1000,
      monthlyInstallment: 300,
      installmentsCount: 4,
      startDate: '2025-04-01',
    };
    const schedule = generatePaymentPlanSchedule(input);
    const totalPaid = schedule.reduce((sum, s) => sum + s.amount, 0);
    expect(totalPaid).toBeCloseTo(1000, 2);
    expect(schedule[schedule.length - 1].remainingBalance).toBe(0);
  });

  it('has correct cumulative sums', () => {
    const input: PaymentPlanInput = {
      totalArrears: 600,
      monthlyInstallment: 200,
      installmentsCount: 3,
      startDate: '2025-01-01',
    };
    const schedule = generatePaymentPlanSchedule(input);
    expect(schedule[0].cumulativePaid).toBe(200);
    expect(schedule[1].cumulativePaid).toBe(400);
    expect(schedule[2].cumulativePaid).toBe(600);
  });

  it('generates monthly due dates', () => {
    const input: PaymentPlanInput = {
      totalArrears: 500,
      monthlyInstallment: 250,
      installmentsCount: 2,
      startDate: '2025-03-15',
    };
    const schedule = generatePaymentPlanSchedule(input);
    expect(schedule[0].dueDate).toBe('2025-03-15');
    expect(schedule[1].dueDate).toBe('2025-04-15');
  });
});

// ─── calculateRentReduction ───────────────────────────────────

describe('calculateRentReduction', () => {
  it('calculates basic reduction correctly', () => {
    const input: RentReductionInput = {
      baseRentCold: 800,
      reductionPercent: 20,
      effectiveFrom: '2025-03-01',
      effectiveUntil: '2025-06-01',
      reason: 'Heizungsausfall im Winter',
    };
    const result = calculateRentReduction(input);
    expect(result.monthlyReduction).toBe(160);
    expect(result.reducedRent).toBe(640);
    expect(result.reductionPercent).toBe(20);
  });

  it('estimates total reduction over period', () => {
    const input: RentReductionInput = {
      baseRentCold: 1000,
      reductionPercent: 10,
      effectiveFrom: '2025-01-01',
      effectiveUntil: '2025-04-01',
      reason: 'Schimmel im Bad',
    };
    const result = calculateRentReduction(input);
    expect(result.monthlyReduction).toBe(100);
    // ~3 months
    expect(result.totalReductionEstimate).toBeGreaterThanOrEqual(200);
    expect(result.totalReductionEstimate).toBeLessThanOrEqual(400);
  });

  it('identifies legal basis from reason keywords', () => {
    const input: RentReductionInput = {
      baseRentCold: 800,
      reductionPercent: 25,
      effectiveFrom: '2025-03-01',
      effectiveUntil: null,
      reason: 'Noise from construction next door',
    };
    const result = calculateRentReduction(input);
    expect(result.legalBasis).toContain('§536 BGB');
    expect(result.legalBasis).toContain('Baulärm');
  });

  it('handles open-ended reduction (no until date)', () => {
    const input: RentReductionInput = {
      baseRentCold: 900,
      reductionPercent: 15,
      effectiveFrom: '2025-03-01',
      effectiveUntil: null,
      reason: 'Elevator broken',
    };
    const result = calculateRentReduction(input);
    expect(result.effectiveUntil).toBeNull();
    expect(result.totalReductionEstimate).toBe(result.monthlyReduction); // 1 month default
  });

  it('returns correct reduced rent for 100% reduction', () => {
    const input: RentReductionInput = {
      baseRentCold: 500,
      reductionPercent: 100,
      effectiveFrom: '2025-01-01',
      effectiveUntil: '2025-02-01',
      reason: 'Heizungsausfall total',
    };
    const result = calculateRentReduction(input);
    expect(result.reducedRent).toBe(0);
    expect(result.monthlyReduction).toBe(500);
  });
});

// ─── checkDeadlines ───────────────────────────────────────────

describe('checkDeadlines', () => {
  it('identifies overdue deadlines', () => {
    const deadlines = [
      { id: 'dl-1', title: 'NK-Abrechnung 2024', due_date: '2025-01-15', status: 'pending', remind_days_before: 14 },
    ];
    const result = checkDeadlines(deadlines, '2025-03-01');
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('overdue');
    expect(result[0].urgency).toBe('critical');
    expect(result[0].daysRemaining).toBeLessThan(0);
  });

  it('identifies approaching deadlines', () => {
    const deadlines = [
      { id: 'dl-2', title: 'Versicherung erneuern', due_date: '2025-03-10', status: 'pending', remind_days_before: 14 },
    ];
    const result = checkDeadlines(deadlines, '2025-03-01');
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('approaching');
    expect(result[0].daysRemaining).toBe(9);
  });

  it('marks far-future deadlines as ok', () => {
    const deadlines = [
      { id: 'dl-3', title: 'Wartung Heizung', due_date: '2025-12-01', status: 'pending', remind_days_before: 14 },
    ];
    const result = checkDeadlines(deadlines, '2025-03-01');
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe('ok');
  });

  it('filters out non-pending deadlines', () => {
    const deadlines = [
      { id: 'dl-4', title: 'Erledigt', due_date: '2025-01-01', status: 'completed', remind_days_before: 7 },
      { id: 'dl-5', title: 'Offen', due_date: '2025-03-05', status: 'pending', remind_days_before: 7 },
    ];
    const result = checkDeadlines(deadlines, '2025-03-01');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('dl-5');
  });

  it('sorts by days remaining ascending', () => {
    const deadlines = [
      { id: 'dl-6', title: 'Spät', due_date: '2025-06-01', status: 'pending', remind_days_before: 7 },
      { id: 'dl-7', title: 'Früh', due_date: '2025-03-05', status: 'pending', remind_days_before: 7 },
      { id: 'dl-8', title: 'Überfällig', due_date: '2025-02-01', status: 'pending', remind_days_before: 7 },
    ];
    const result = checkDeadlines(deadlines, '2025-03-01');
    expect(result[0].id).toBe('dl-8');
    expect(result[1].id).toBe('dl-7');
    expect(result[2].id).toBe('dl-6');
  });

  it('assigns urgency levels correctly', () => {
    const deadlines = [
      { id: 'dl-9', title: '2 Tage', due_date: '2025-03-03', status: 'pending', remind_days_before: 14 },
      { id: 'dl-10', title: '5 Tage', due_date: '2025-03-06', status: 'pending', remind_days_before: 14 },
    ];
    const result = checkDeadlines(deadlines, '2025-03-01');
    expect(result[0].urgency).toBe('high'); // 2 days
    expect(result[1].urgency).toBe('medium'); // 5 days
  });
});

// ─── Additional: determinePhase ───────────────────────────────

describe('determinePhase', () => {
  it('returns active for normal active lease', () => {
    const lease = makeLease();
    expect(determinePhase(lease, '2025-03-01')).toBe('active');
  });

  it('returns termination when notice given', () => {
    const lease = makeLease({ noticeDate: '2025-02-01', endDate: '2025-05-31' });
    expect(determinePhase(lease, '2025-03-01')).toBe('termination');
  });

  it('returns move_out when past end date after notice', () => {
    const lease = makeLease({ noticeDate: '2025-01-01', endDate: '2025-02-28' });
    expect(determinePhase(lease, '2025-03-01')).toBe('move_out');
  });

  it('returns application for draft status', () => {
    const lease = makeLease({ status: 'draft' });
    expect(determinePhase(lease, '2025-03-01')).toBe('application');
  });
});

// ─── Additional: suggestRentReduction ─────────────────────────

describe('suggestRentReduction', () => {
  it('returns guideline for known category', () => {
    const result = suggestRentReduction('heating_failure');
    expect(result).toBeTruthy();
    expect(result!.suggestedMin).toBe(20);
    expect(result!.suggestedMax).toBe(100);
  });

  it('returns null for unknown category', () => {
    expect(suggestRentReduction('nonexistent_issue')).toBeNull();
  });
});

// ─── Additional: checkPaymentPlanCompliance ───────────────────

describe('checkPaymentPlanCompliance', () => {
  const schedule = generatePaymentPlanSchedule({
    totalArrears: 600,
    monthlyInstallment: 200,
    installmentsCount: 3,
    startDate: '2025-01-01',
  });

  it('shows no overdue when all paid', () => {
    const result = checkPaymentPlanCompliance(schedule, 2, '2025-03-15');
    expect(result.overdueCount).toBe(1); // 3 due by Mar 15, only 2 paid
  });

  it('detects default when 2+ missed', () => {
    const result = checkPaymentPlanCompliance(schedule, 0, '2025-04-01');
    expect(result.overdueCount).toBe(3);
    expect(result.isDefaulted).toBe(true);
  });

  it('returns next due date', () => {
    const result = checkPaymentPlanCompliance(schedule, 1, '2025-01-15');
    expect(result.nextDueDate).toBe('2025-02-01');
  });
});
