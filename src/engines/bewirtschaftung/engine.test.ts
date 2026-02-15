import { describe, it, expect } from 'vitest';
import { calcBWA, calcInstandhaltungsruecklage, calcLeerstandsquote, calcMietpotenzial } from './engine';

describe('Bewirtschaftung Engine', () => {
  describe('calcBWA', () => {
    it('calculates NOI and cashflow', () => {
      const result = calcBWA({
        grossRentalIncome: 48_000,
        nonRecoverableCosts: [
          { label: 'Verwaltung', amount: 3_600, category: 'verwaltung' },
          { label: 'Instandhaltung', amount: 4_800, category: 'instandhaltung' },
        ],
        annualDebtService: 12_000,
        depreciation: 6_000,
      });
      expect(result.totalCosts).toBe(8_400);
      expect(result.noi).toBe(39_600);
      expect(result.cashflowBeforeTax).toBe(27_600);
      expect(result.costRatio).toBeCloseTo(0.175, 2);
    });
  });

  describe('calcInstandhaltungsruecklage', () => {
    it('uses Peters factor by building age', () => {
      const result = calcInstandhaltungsruecklage({
        buildingCost: 500_000, yearBuilt: 2000, currentYear: 2026,
      });
      expect(result.buildingAge).toBe(26);
      expect(result.petersFactor).toBe(0.011); // age 26 => maxAge 30 tier
      expect(result.annualReserve).toBe(5_500);
      expect(result.monthlyReserve).toBeCloseTo(458.33, 0);
    });

    it('handles very old buildings', () => {
      const result = calcInstandhaltungsruecklage({
        buildingCost: 300_000, yearBuilt: 1920, currentYear: 2026,
      });
      expect(result.petersFactor).toBe(0.015); // age > 50
    });
  });

  describe('calcLeerstandsquote', () => {
    it('calculates vacancy rate', () => {
      const result = calcLeerstandsquote([
        { unitId: '1', isVacant: false, vacantDays: 0, totalDays: 365 },
        { unitId: '2', isVacant: true, vacantDays: 180, totalDays: 365 },
        { unitId: '3', isVacant: false, vacantDays: 30, totalDays: 365 },
      ], 800);
      expect(result.vacantUnits).toBe(1);
      expect(result.totalUnits).toBe(3);
      expect(result.vacancyRate).toBeCloseTo(0.333, 2);
      expect(result.estimatedLoss).toBeGreaterThan(0);
    });

    it('handles empty units', () => {
      const result = calcLeerstandsquote([]);
      expect(result.vacancyRate).toBe(0);
    });
  });

  describe('calcMietpotenzial', () => {
    it('detects below-market rent', () => {
      const result = calcMietpotenzial(800, 1000);
      expect(result.potential).toBe('below_market');
      expect(result.delta).toBe(200);
      expect(result.deltaPercent).toBe(0.25);
    });

    it('detects above-market rent', () => {
      const result = calcMietpotenzial(1200, 1000);
      expect(result.potential).toBe('above_market');
    });

    it('detects at-market rent within tolerance', () => {
      const result = calcMietpotenzial(1000, 1020);
      expect(result.potential).toBe('at_market');
    });
  });
});
