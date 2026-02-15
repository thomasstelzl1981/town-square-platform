import { describe, it, expect } from 'vitest';
import {
  calcHaushaltsrechnung, calcBonitaet, calcAnnuity,
  calcConsumerLoanOffers, createApplicantSnapshot, calcCompletionScore,
} from './engine';

describe('Finanzierung Engine', () => {
  describe('calcHaushaltsrechnung', () => {
    it('calculates surplus and DSR', () => {
      const result = calcHaushaltsrechnung({
        incomes: [{ label: 'Gehalt', amount: 4000, category: 'salary' }],
        expenses: [{ label: 'Miete', amount: 1200, category: 'rent' }],
        plannedRate: 800,
      });
      expect(result.totalIncome).toBe(4000);
      expect(result.totalExpenses).toBe(1200);
      expect(result.surplus).toBe(2800);
      expect(result.surplusAfterPlannedRate).toBe(2000);
      expect(result.dsr).toBeCloseTo(0.3, 1);
      expect(result.dsrAfterPlannedRate).toBe(0.5);
      expect(result.isViable).toBe(false); // 0.5 > 0.4
    });

    it('marks viable when DSR below threshold', () => {
      const result = calcHaushaltsrechnung({
        incomes: [{ label: 'Gehalt', amount: 5000, category: 'salary' }],
        expenses: [{ label: 'Miete', amount: 1000, category: 'rent' }],
        plannedRate: 500,
      });
      expect(result.isViable).toBe(true); // (1000+500)/5000 = 0.3
    });
  });

  describe('calcBonitaet', () => {
    it('returns green for low LTV and high DSCR', () => {
      const result = calcBonitaet({
        purchasePrice: 300_000, loanAmount: 200_000, propertyValue: 350_000,
        annualNetIncome: 80_000, annualDebtService: 5_000, plannedAnnualDebtService: 15_000,
      });
      expect(result.ltv).toBeLessThan(0.8);
      expect(result.rating).toBe('green');
    });

    it('returns red for high LTV', () => {
      const result = calcBonitaet({
        purchasePrice: 300_000, loanAmount: 330_000, propertyValue: 300_000,
        annualNetIncome: 50_000, annualDebtService: 0, plannedAnnualDebtService: 20_000,
      });
      expect(result.ltv).toBeGreaterThan(0.9);
      expect(result.rating).toBe('red');
    });
  });

  describe('calcAnnuity', () => {
    it('produces correct monthly rate and schedule', () => {
      const result = calcAnnuity({
        loanAmount: 200_000, interestRatePercent: 3.5,
        repaymentRatePercent: 2, fixedRatePeriodYears: 10,
      });
      expect(result.monthlyRate).toBeCloseTo(916.67, 0);
      expect(result.schedule).toHaveLength(10);
      expect(result.remainingDebt).toBeLessThan(200_000);
      expect(result.totalInterest).toBeGreaterThan(0);
    });
  });

  describe('calcConsumerLoanOffers', () => {
    it('returns 5 offers sorted by interest rate', () => {
      const offers = calcConsumerLoanOffers(20_000, 60);
      expect(offers).toHaveLength(5);
      expect(offers[0].monthlyRate).toBeGreaterThan(0);
      expect(offers[0].interestRate).toBeLessThanOrEqual(offers[4].interestRate);
    });

    it('returns empty array for invalid input', () => {
      expect(calcConsumerLoanOffers(0, 60)).toHaveLength(0);
      expect(calcConsumerLoanOffers(10_000, 0)).toHaveLength(0);
    });
  });

  describe('createApplicantSnapshot', () => {
    it('creates a shallow copy with timestamp', () => {
      const result = createApplicantSnapshot({ profile: { name: 'Test', income: 5000 } });
      expect(result.snapshot).toEqual({ name: 'Test', income: 5000 });
      expect(result.snapshotAt).toBeDefined();
    });
  });

  describe('calcCompletionScore', () => {
    it('calculates percent of filled required fields', () => {
      const result = calcCompletionScore({
        formData: { first_name: 'Max', last_name: '', email: 'max@test.de' },
        requiredFields: ['first_name', 'last_name', 'email'],
      });
      expect(result.filledCount).toBe(2);
      expect(result.totalRequired).toBe(3);
      expect(result.percent).toBe(67);
    });

    it('handles empty form', () => {
      const result = calcCompletionScore({
        formData: {},
        requiredFields: ['a', 'b'],
      });
      expect(result.percent).toBe(0);
    });

    it('handles no required fields', () => {
      const result = calcCompletionScore({ formData: { a: 1 }, requiredFields: [] });
      expect(result.percent).toBe(0);
    });
  });
});
