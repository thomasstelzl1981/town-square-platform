import { describe, it, expect } from 'vitest';
import { calcProjektKalkulation, calcUnitPricing, calcVertriebsStatus } from './engine';
import type { ProjektUnit } from './spec';

describe('ProjektCalc Engine', () => {
  describe('calcProjektKalkulation', () => {
    it('aggregates costs and revenue', () => {
      const result = calcProjektKalkulation({
        units: [
          { id: '1', label: 'W1', areaSqm: 80, targetPricePerSqm: 5000, status: 'available' },
          { id: '2', label: 'W2', areaSqm: 60, targetPricePerSqm: 4800, soldPrice: 300_000, status: 'sold' },
        ],
        costs: [
          { label: 'Grundstück', amount: 200_000, category: 'grundstueck' },
          { label: 'Bau', amount: 400_000, category: 'bau' },
        ],
      });
      expect(result.totalCosts).toBe(600_000);
      expect(result.totalRevenue).toBe(700_000); // 400k + 300k (sold price used)
      expect(result.totalAreaSqm).toBe(140);
      expect(result.margin).toBe(100_000);
      expect(result.marginPercent).toBeCloseTo(16.67, 1);
      expect(result.costsByCategory['grundstueck']).toBe(200_000);
    });
  });

  describe('calcUnitPricing', () => {
    it('calculates final price with premiums and discount', () => {
      const result = calcUnitPricing({
        areaSqm: 75, basePricePerSqm: 5000,
        floorPremiumPercent: 4, balconyPremiumFlat: 15_000, discountPercent: 2,
      });
      expect(result.basePrice).toBe(375_000);
      expect(result.premiums).toBe(30_000); // 15000 floor + 15000 balcony
      expect(result.finalPrice).toBeLessThan(375_000 + 30_000);
      expect(result.finalPricePerSqm).toBeGreaterThan(0);
    });

    it('handles zero area', () => {
      const result = calcUnitPricing({ areaSqm: 0, basePricePerSqm: 5000 });
      expect(result.finalPrice).toBe(0);
      expect(result.finalPricePerSqm).toBe(0);
    });
  });

  describe('calcVertriebsStatus', () => {
    it('aggregates sales status', () => {
      const units: ProjektUnit[] = [
        { id: '1', label: 'W1', areaSqm: 80, targetPricePerSqm: 5000, status: 'sold', soldPrice: 420_000 },
        { id: '2', label: 'W2', areaSqm: 60, targetPricePerSqm: 5000, status: 'reserved' },
        { id: '3', label: 'W3', areaSqm: 70, targetPricePerSqm: 5000, status: 'available' },
      ];
      const result = calcVertriebsStatus(units);
      expect(result.totalUnits).toBe(3);
      expect(result.sold).toBe(1);
      expect(result.reserved).toBe(1);
      expect(result.available).toBe(1);
      expect(result.soldPercent).toBeCloseTo(33.33, 1);
      expect(result.soldRevenue).toBe(420_000);
      expect(result.expectedTotalRevenue).toBe(420_000 + 300_000 + 350_000);
    });

    it('handles empty units', () => {
      const result = calcVertriebsStatus([]);
      expect(result.totalUnits).toBe(0);
      expect(result.soldPercent).toBe(0);
    });
  });
});
