import { describe, it, expect } from 'vitest';
import { calculateLeaseDaysInPeriod, allocateCostItem, calculateProratedPrepayments } from './allocationLogic';
import { AllocationKeyType, NKCostCategory } from './spec';
import type { NKCostItem } from './spec';

function makeCostItem(overrides: Partial<NKCostItem> = {}): NKCostItem {
  return {
    id: 'ci1', nkPeriodId: 'np1', categoryCode: NKCostCategory.WASSER,
    labelRaw: 'Wasser', labelDisplay: 'Wasser/Abwasser',
    amountTotalHouse: 1200, amountUnit: null,
    keyType: AllocationKeyType.AREA_SQM, keyBasisUnit: null, keyBasisTotal: null,
    isApportionable: true, reasonCode: '', mappingConfidence: 1, mappingSource: 'rule',
    sourceDocumentId: null, sortOrder: 1,
    ...overrides,
  };
}

const baseAllocation = {
  unitAreaSqm: 80, totalAreaSqm: 400, unitMea: 200, totalMea: 1000,
  unitPersons: 2, totalPersons: 10, totalUnits: 5,
};

describe('NK-Abrechnung allocationLogic', () => {
  describe('calculateLeaseDaysInPeriod', () => {
    it('returns full year for year-long lease', () => {
      const result = calculateLeaseDaysInPeriod({
        periodStart: '2024-01-01', periodEnd: '2024-12-31',
        leaseStart: '2020-01-01', leaseEnd: null,
      });
      expect(result.leaseDays).toBe(366); // 2024 is leap year
      expect(result.totalDays).toBe(366);
      expect(result.ratio).toBe(1);
    });

    it('returns partial days for mid-year lease start', () => {
      const result = calculateLeaseDaysInPeriod({
        periodStart: '2024-01-01', periodEnd: '2024-12-31',
        leaseStart: '2024-06-01', leaseEnd: null,
      });
      expect(result.leaseDays).toBe(214); // Jun 1 to Dec 31
      expect(result.totalDays).toBe(366);
      expect(result.ratio).toBeCloseTo(214 / 366, 4);
    });
  });

  describe('allocateCostItem', () => {
    it('allocates by AREA_SQM', () => {
      const costItem = makeCostItem({ keyType: AllocationKeyType.AREA_SQM, amountTotalHouse: 1000 });
      const result = allocateCostItem({ costItem, ...baseAllocation });
      // 1000 * (80/400) = 200
      expect(result.shareUnit).toBe(200);
    });

    it('allocates by MEA', () => {
      const costItem = makeCostItem({ keyType: AllocationKeyType.MEA, amountTotalHouse: 1000 });
      const result = allocateCostItem({ costItem, ...baseAllocation });
      // 1000 * (200/1000) = 200
      expect(result.shareUnit).toBe(200);
    });

    it('allocates by PERSONS', () => {
      const costItem = makeCostItem({ keyType: AllocationKeyType.PERSONS, amountTotalHouse: 1000 });
      const result = allocateCostItem({ costItem, ...baseAllocation });
      // 1000 * (2/10) = 200
      expect(result.shareUnit).toBe(200);
    });

    it('uses amountUnit directly when provided', () => {
      const costItem = makeCostItem({ amountUnit: 150, keyBasisUnit: 80, keyBasisTotal: 400 });
      const result = allocateCostItem({ costItem, ...baseAllocation });
      expect(result.shareUnit).toBe(150);
    });

    it('applies pro-rata for partial period', () => {
      const costItem = makeCostItem({ keyType: AllocationKeyType.AREA_SQM, amountTotalHouse: 1000 });
      const period = { periodStart: '2024-01-01', periodEnd: '2024-12-31', leaseStart: '2024-07-01', leaseEnd: null };
      const result = allocateCostItem({ costItem, ...baseAllocation }, period);
      // Full share: 200, ratio ~184/366
      expect(result.shareUnit).toBeLessThan(200);
      expect(result.shareUnit).toBeGreaterThan(0);
    });
  });

  describe('calculateProratedPrepayments', () => {
    it('calculates full year prepayments for full lease', () => {
      const period = { periodStart: '2024-01-01', periodEnd: '2024-12-31', leaseStart: '2020-01-01', leaseEnd: null };
      const result = calculateProratedPrepayments(200, 80, period);
      expect(result.prepaidNK).toBe(2400);
      expect(result.prepaidHeating).toBe(960);
    });

    it('prorates for partial period', () => {
      const period = { periodStart: '2024-01-01', periodEnd: '2024-12-31', leaseStart: '2024-07-01', leaseEnd: null };
      const result = calculateProratedPrepayments(200, 80, period);
      expect(result.prepaidNK).toBeLessThan(2400);
      expect(result.prepaidNK).toBeGreaterThan(0);
    });
  });
});
