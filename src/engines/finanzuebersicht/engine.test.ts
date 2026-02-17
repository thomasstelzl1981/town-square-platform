import { describe, it, expect } from 'vitest';
import { monthlyFromInterval, calcIncome, calcAssets, calcLiabilities, calcProjection } from './engine';
import { LIVING_EXPENSE_RATE, BUILDING_VALUE_FRACTION, AFA_RATE, MARGINAL_TAX_RATE, PROJECTION_YEARS } from './spec';

describe('Finanzübersicht Engine', () => {
  describe('monthlyFromInterval', () => {
    it('returns monthly as-is', () => {
      expect(monthlyFromInterval(120, 'monatlich')).toBe(120);
    });
    it('converts jaehrlich', () => {
      expect(monthlyFromInterval(1200, 'jaehrlich')).toBe(100);
    });
    it('converts halbjaehrlich', () => {
      expect(monthlyFromInterval(600, 'halbjaehrlich')).toBe(100);
    });
    it('converts vierteljaehrlich', () => {
      expect(monthlyFromInterval(300, 'vierteljaehrlich')).toBe(100);
    });
    it('returns 0 for null premium', () => {
      expect(monthlyFromInterval(null, 'monatlich')).toBe(0);
    });
  });

  describe('calcIncome', () => {
    it('sums all income sources', () => {
      const profiles = [{ net_income_monthly: 3000, self_employed_income_monthly: 500, side_job_income_monthly: 200, child_benefit_monthly: 250, other_regular_income_monthly: 100 }];
      const portfolioSummary = { annualIncome: 12000, annualInterest: 5000, annualAmortization: 3000, totalValue: 300000, totalDebt: 200000 };
      const portfolioProperties = [{ id: 'p1', purchase_price: 250000 }];
      const pvPlants = [{ id: 'pv1', annual_revenue: 2400 }];

      const result = calcIncome(profiles, portfolioSummary, portfolioProperties, pvPlants);

      expect(result.netIncomeTotal).toBe(3000);
      expect(result.selfEmployedIncome).toBe(500);
      expect(result.rentalIncomePortfolio).toBe(1000); // 12000/12
      expect(result.sideJobIncome).toBe(200);
      expect(result.childBenefit).toBe(250);
      expect(result.otherIncome).toBe(100);
      expect(result.pvIncome).toBe(200); // 2400/12

      // Tax benefit: rent=12000, interest=5000, AfA=250000*0.8*0.02=4000 => loss=12000-5000-4000=3000 (positive, no benefit)
      expect(result.taxBenefitRental).toBe(0);
    });

    it('calculates tax benefit when rental creates loss', () => {
      const profiles = [{ net_income_monthly: 3000 }];
      const portfolioSummary = { annualIncome: 6000, annualInterest: 8000, annualAmortization: 2000, totalValue: 300000, totalDebt: 200000 };
      const portfolioProperties = [{ id: 'p1', purchase_price: 300000 }];

      const result = calcIncome(profiles, portfolioSummary, portfolioProperties, []);
      // AfA: 300000*0.8*0.02=4800, loss=6000-8000-4800=-6800 => benefit=6800*0.42/12=238
      expect(result.taxBenefitRental).toBe(6800 * MARGINAL_TAX_RATE / 12);
    });
  });

  describe('calcAssets', () => {
    it('sums portfolio, homes, savings, securities, surrender values', () => {
      const portfolioSummary = { annualIncome: 0, annualInterest: 0, annualAmortization: 0, totalValue: 500000, totalDebt: 0 };
      const homes = [{ id: 'h1', market_value: 350000 }];
      const profiles = [{ bank_savings: 20000, securities_value: 15000, life_insurance_value: 10000 }];

      const result = calcAssets(portfolioSummary, homes, profiles);
      expect(result.propertyValue).toBe(500000);
      expect(result.homeValue).toBe(350000);
      expect(result.bankSavings).toBe(20000);
      expect(result.securities).toBe(15000);
      expect(result.surrenderValues).toBe(10000);
      expect(result.totalAssets).toBe(895000);
    });
  });

  describe('calcLiabilities', () => {
    it('sums all debt categories', () => {
      const portfolioSummary = { annualIncome: 0, annualInterest: 0, annualAmortization: 0, totalValue: 0, totalDebt: 200000 };
      const mietyLoans = [{ id: 'l1', remaining_balance: 150000 }];
      const pvPlants = [{ id: 'pv1', loan_remaining_balance: 25000 }];
      const privateLoans = [{ id: 'pl1', remaining_balance: 10000, status: 'aktiv' }];

      const result = calcLiabilities(portfolioSummary, mietyLoans, pvPlants, privateLoans);
      expect(result.portfolioDebt).toBe(200000);
      expect(result.homeDebt).toBe(150000);
      expect(result.pvDebt).toBe(25000);
      expect(result.otherDebt).toBe(10000);
      expect(result.totalLiabilities).toBe(385000);
    });
  });

  describe('calcProjection', () => {
    it('produces PROJECTION_YEARS+1 entries', () => {
      const result = calcProjection({
        portfolioPropertyValue: 300000, homeValue: 200000, totalLiabilities: 200000,
        bankSavings: 10000, securities: 5000, portfolioLoansMonthly: 1000,
        privateLoansMonthly: 200, pvMonthlyLoanRate: 0, monthlySavings: 500,
      });
      expect(result).toHaveLength(PROJECTION_YEARS + 1);
      expect(result[0].year).toBe(new Date().getFullYear());
    });

    it('reduces debt over time', () => {
      const result = calcProjection({
        portfolioPropertyValue: 0, homeValue: 0, totalLiabilities: 100000,
        bankSavings: 0, securities: 0, portfolioLoansMonthly: 1000,
        privateLoansMonthly: 0, pvMonthlyLoanRate: 0, monthlySavings: 0,
      });
      expect(result[result.length - 1].remainingDebt).toBeLessThan(result[0].remainingDebt);
    });
  });
});
