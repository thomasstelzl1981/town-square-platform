import { describe, it, expect } from 'vitest';
import { calcBestandFull, calcBestandQuick, calcAufteilerFull, calcAufteilerQuick, calcAufteilerProject } from './engine';

describe('AkquiseCalc Engine', () => {
  describe('calcBestandQuick', () => {
    it('calculates basic KPIs for a hold scenario', () => {
      const result = calcBestandQuick({ purchasePrice: 500_000, monthlyRent: 2_000 });
      expect(result.yearlyRent).toBe(24_000);
      expect(result.grossYield).toBeCloseTo(4.8, 1);
      expect(result.totalInvestment).toBe(550_000); // 10% ancillary
      expect(result.loanAmount).toBe(450_000); // 80% LTV default
      expect(result.monthlyCashflow).toBeLessThan(0); // high LTV => negative cashflow
    });

    it('handles zero purchase price', () => {
      const result = calcBestandQuick({ purchasePrice: 0, monthlyRent: 1_000 });
      expect(result.grossYield).toBe(0);
      expect(result.multiplier).toBe(0);
    });
  });

  describe('calcBestandFull', () => {
    it('produces 30-year projection', () => {
      const result = calcBestandFull({
        purchasePrice: 300_000, monthlyRent: 1_500,
        equityPercent: 30, interestRate: 3.5, repaymentRate: 2,
        rentIncreaseRate: 1.5, valueIncreaseRate: 2,
        managementCostPercent: 25, maintenancePercent: 1,
        ancillaryCostPercent: 10,
      });
      expect(result.yearlyData).toHaveLength(30);
      expect(result.equity).toBe(99_000);
      expect(result.loanAmount).toBe(231_000);
      expect(result.yearlyData[29].remainingDebt).toBeLessThan(result.loanAmount);
    });
  });

  describe('calcAufteilerQuick', () => {
    it('calculates flip profit', () => {
      const result = calcAufteilerQuick({
        purchasePrice: 1_000_000, unitsCount: 10,
        avgUnitSalePrice: 150_000,
      });
      expect(result.totalSaleProceeds).toBe(1_500_000);
      expect(result.grossProfit).toBeGreaterThan(0);
      expect(result.profitMarginPercent).toBeGreaterThan(0);
    });
  });

  describe('calcAufteilerFull', () => {
    it('includes sensitivity data', () => {
      const result = calcAufteilerFull({
        purchasePrice: 800_000, yearlyRent: 48_000,
        targetYield: 4, salesCommission: 3,
        holdingPeriodMonths: 24, ancillaryCostPercent: 10,
        interestRate: 4, equityPercent: 30, projectCosts: 50_000,
      });
      expect(result.sensitivityData).toHaveLength(3);
      expect(result.salesPriceGross).toBe(1_200_000); // 48k / 4%
    });
  });

  describe('calcAufteilerProject', () => {
    it('uses totalListPrice when available', () => {
      const result = calcAufteilerProject({
        purchasePrice: 500_000, renovationBudget: 100_000,
        targetYield: 5, salesCommission: 3,
        holdingPeriodMonths: 18, ancillaryCostPercent: 10,
        interestRate: 4, equityPercent: 25,
        totalListPrice: 900_000, totalYearlyRent: 40_000, unitsCount: 6,
      });
      expect(result.salesPriceGross).toBe(900_000);
      expect(result.profitPerUnit).toBeDefined();
      expect(result.breakEvenUnits).toBeGreaterThan(0);
    });
  });
});
