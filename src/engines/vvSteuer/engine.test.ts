import { describe, it, expect } from 'vitest';
import { calculateAfaBasis, calculateAfaAmount, calculatePropertyResult, buildContextSummary } from './engine';
import type { VVPropertyTaxData } from './spec';

function makePropertyData(overrides: Partial<VVPropertyTaxData> = {}): VVPropertyTaxData {
  return {
    propertyId: 'p1',
    propertyName: 'Test Objekt',
    propertyType: 'ETW',
    address: 'Musterstr. 1',
    city: 'Berlin',
    postalCode: '10115',
    yearBuilt: 1990,
    purchasePrice: 200000,
    acquisitionCosts: 20000,
    taxReferenceNumber: '123/456/789',
    ownershipSharePercent: 100,
    areaSqm: 80,
    afa: { buildingSharePercent: 80, landSharePercent: 20, afaRatePercent: 2, afaStartDate: null, afaMethod: 'linear', modernizationCostsEur: 0, modernizationYear: null },
    incomeAggregated: { coldRentAnnual: 12000, nkAdvanceAnnual: 2400, nkNachzahlung: 0 },
    financingAggregated: { loanInterestAnnual: 3000 },
    nkAggregated: { grundsteuer: 300, nonRecoverableCosts: 500 },
    manualData: {
      propertyId: 'p1', taxYear: 2024, incomeOther: 0, incomeInsurancePayout: 0,
      costDisagio: 0, costFinancingFees: 0, costMaintenance: 1000, costManagementFee: 500,
      costLegalAdvisory: 0, costInsuranceNonRecoverable: 200, costTravel: 100, costBankFees: 50, costOther: 0,
      vacancyDays: 0, vacancyIntentConfirmed: false, relativeRental: false,
      heritageAfaAmount: 0, specialAfaAmount: 0, confirmed: true, status: 'confirmed', notes: '',
    },
    ...overrides,
  };
}

describe('VV-Steuer Engine', () => {
  describe('calculateAfaBasis', () => {
    it('calculates building share of purchase price + acquisition costs', () => {
      // (200000 * 0.8) + (20000 * 0.8) = 160000 + 16000 = 176000
      expect(calculateAfaBasis(200000, 20000, 80)).toBe(176000);
    });

    it('handles 100% building share', () => {
      expect(calculateAfaBasis(100000, 10000, 100)).toBe(110000);
    });

    it('handles 0% building share', () => {
      expect(calculateAfaBasis(100000, 10000, 0)).toBe(0);
    });
  });

  describe('calculateAfaAmount', () => {
    it('calculates annual AfA from basis and rate', () => {
      // 176000 * 0.02 = 3520
      expect(calculateAfaAmount(176000, 2)).toBe(3520);
    });
  });

  describe('calculatePropertyResult', () => {
    it('computes full income-expense surplus', () => {
      const data = makePropertyData();
      const result = calculatePropertyResult(data);

      // Income: 12000 + 2400 + 0 + 0 + 0 = 14400
      expect(result.totalIncome).toBe(14400);

      // Financing subtotal: 3000 + 0 + 0 = 3000
      expect(result.costsBreakdown.financing.subtotal).toBe(3000);

      // AfA basis: (200000+20000)*0.8 = 176000, amount = 176000*0.02 = 3520
      expect(result.costsBreakdown.afa.basis).toBe(176000);
      expect(result.costsBreakdown.afa.amount).toBe(3520);
      expect(result.costsBreakdown.afa.subtotal).toBe(3520);

      // Operating: 300+500+1000+500+0+200+100+50+0 = 2650
      expect(result.costsBreakdown.operating.subtotal).toBe(2650);

      // Total costs: 3000 + 2650 + 3520 = 9170
      expect(result.totalCosts).toBe(9170);

      // Surplus: 14400 - 9170 = 5230
      expect(result.surplus).toBe(5230);
    });
  });

  describe('buildContextSummary', () => {
    it('aggregates multiple properties', () => {
      const p1 = makePropertyData({ propertyId: 'p1', propertyName: 'Objekt A' });
      const p2 = makePropertyData({
        propertyId: 'p2', propertyName: 'Objekt B',
        incomeAggregated: { coldRentAnnual: 6000, nkAdvanceAnnual: 1200, nkNachzahlung: 0 },
      });

      const summary = buildContextSummary('ctx1', 'Familie Müller', 'eheleute', '123/456', 2024, [p1, p2]);

      expect(summary.properties).toHaveLength(2);
      expect(summary.totalIncome).toBe(14400 + (6000 + 1200));
      expect(summary.allConfirmed).toBe(true);
    });

    it('marks allConfirmed false when one property is unconfirmed', () => {
      const p1 = makePropertyData();
      const p2 = makePropertyData({
        propertyId: 'p2',
        manualData: { ...makePropertyData().manualData, confirmed: false, status: 'draft' },
      });

      const summary = buildContextSummary('ctx1', 'Test', 'eheleute', '123', 2024, [p1, p2]);
      expect(summary.allConfirmed).toBe(false);
    });
  });
});
