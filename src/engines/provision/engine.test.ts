import { describe, it, expect } from 'vitest';
import { calcCommission, calcPartnerShare, calcTippgeberFee, aggregateCommissions } from './engine';

describe('Provision Engine', () => {
  describe('calcCommission', () => {
    it('calculates buyer + seller commission with VAT', () => {
      const result = calcCommission({
        dealValue: 500_000,
        buyerCommissionPercent: 3.57,
        sellerCommissionPercent: 3.57,
      });
      expect(result.buyer.netto).toBeCloseTo(17_850, 0);
      expect(result.buyer.vat).toBeCloseTo(3_391.5, 0);
      expect(result.buyer.brutto).toBeCloseTo(21_241.5, 0);
      expect(result.total.netto).toBeCloseTo(35_700, 0);
    });

    it('supports custom VAT rate', () => {
      const result = calcCommission({
        dealValue: 100_000, buyerCommissionPercent: 5, sellerCommissionPercent: 0, vatPercent: 7,
      });
      expect(result.buyer.vat).toBeCloseTo(350, 0);
      expect(result.seller.netto).toBe(0);
    });
  });

  describe('calcPartnerShare', () => {
    it('splits commission by percentage', () => {
      const result = calcPartnerShare({ commissionNetto: 10_000, partnerSharePercent: 60 });
      expect(result.partnerAmount).toBe(6_000);
      expect(result.houseAmount).toBe(4_000);
    });

    it('uses fix amount when provided', () => {
      const result = calcPartnerShare({
        commissionNetto: 10_000, partnerSharePercent: 60, partnerFixAmount: 3_000,
      });
      expect(result.partnerAmount).toBe(3_000);
      expect(result.houseAmount).toBe(7_000);
    });
  });

  describe('calcTippgeberFee', () => {
    it('calculates tippgeber fee from SoT share', () => {
      const result = calcTippgeberFee({ commissionNetto: 20_000 });
      // Default: 50% SoT share = 10_000, 25% of that = 2_500
      expect(result.sotAmount).toBe(10_000);
      expect(result.tippgeberFee).toBe(2_500);
      expect(result.remaining).toBe(17_500);
    });
  });

  describe('aggregateCommissions', () => {
    it('sums paid and pending amounts', () => {
      const items = [
        { amount: 1000, status: 'paid' },
        { amount: 2000, status: 'pending' },
        { amount: 500, status: 'paid' },
        { amount: 300, status: 'cancelled' },
      ];
      const result = aggregateCommissions(items, ['paid'], ['cancelled']);
      expect(result.paid).toBe(1500);
      expect(result.pending).toBe(2000);
      expect(result.total).toBe(3500); // excludes cancelled
      expect(result.paidCount).toBe(2);
      expect(result.pendingCount).toBe(1);
    });

    it('handles empty array', () => {
      const result = aggregateCommissions([]);
      expect(result.total).toBe(0);
      expect(result.paidCount).toBe(0);
    });
  });
});
