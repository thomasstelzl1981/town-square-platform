import { describe, it, expect } from 'vitest';
import { calcAltersvorsorge, calcBuLuecke } from './engine';
import type { VLPersonInput, VLPensionInput, VLContractInput } from './spec';
import { DEFAULT_NEED_PERCENT, DEFAULT_ANNUITY_YEARS, BEAMTE_SATZ_PRO_JAHR, BEAMTE_MAX_VERSORGUNGSSATZ, EM_FALLBACK_PERCENT } from './spec';

const basePerson: VLPersonInput = {
  id: 'person1', first_name: 'Max', last_name: 'Mustermann', is_primary: true,
  employment_status: 'employee', net_income_monthly: 3500, gross_income_monthly: 5500,
  ruhegehaltfaehiges_grundgehalt: null, ruhegehaltfaehige_dienstjahre: null,
  planned_retirement_date: null, business_income_monthly: 0,
};

const basePension: VLPensionInput = { person_id: 'person1', projected_pension: 1400, disability_pension: 800, pension_type: 'drv' };

function makeContract(overrides: Partial<VLContractInput>): VLContractInput {
  return {
    id: 'c1', person_id: 'person1', contract_type: 'Rentenversicherung', monthly_benefit: null,
    bu_monthly_benefit: null, insured_sum: null, current_balance: null, premium: null,
    payment_interval: null, status: 'aktiv', category: 'vorsorge', projected_end_value: null, growth_rate_override: null,
    ...overrides,
  };
}

describe('Vorsorge-Lückenrechner', () => {
  describe('calcAltersvorsorge', () => {
    it('calculates gap for employee with DRV pension', () => {
      const result = calcAltersvorsorge(basePerson, basePension, []);
      expect(result.gesetzliche_versorgung).toBe(1400);
      expect(result.gesetzliche_quelle).toBe('drv');
      expect(result.retirement_need).toBe(3500 * DEFAULT_NEED_PERCENT);
      expect(result.gap).toBeGreaterThan(0);
    });

    it('calculates civil servant pension from Dienstjahre', () => {
      const beamter: VLPersonInput = {
        ...basePerson, employment_status: 'beamter',
        ruhegehaltfaehiges_grundgehalt: 4000, ruhegehaltfaehige_dienstjahre: 30,
      };
      const result = calcAltersvorsorge(beamter, null, []);
      const expectedSatz = Math.min(30 * BEAMTE_SATZ_PRO_JAHR, BEAMTE_MAX_VERSORGUNGSSATZ);
      expect(result.gesetzliche_versorgung).toBe(4000 * expectedSatz);
      expect(result.gesetzliche_quelle).toBe('pension');
    });

    it('uses projected_end_value when set', () => {
      const contract = makeContract({ projected_end_value: 300000 });
      const result = calcAltersvorsorge(basePerson, basePension, [contract]);
      // 300000 / 25 / 12 = 1000
      expect(result.private_verrentung).toBe(1000);
    });

    it('adds monthly_benefit from private contracts', () => {
      const contract = makeContract({ monthly_benefit: 500 });
      const result = calcAltersvorsorge(basePerson, basePension, [contract]);
      expect(result.private_renten).toBe(500);
    });

    it('includes business_income_monthly in need', () => {
      const person: VLPersonInput = { ...basePerson, business_income_monthly: 1000 };
      const result = calcAltersvorsorge(person, basePension, []);
      expect(result.retirement_need).toBe((3500 + 1000) * DEFAULT_NEED_PERCENT);
    });
  });

  describe('calcBuLuecke', () => {
    it('uses DRV EM pension for employee', () => {
      const result = calcBuLuecke(basePerson, basePension, []);
      expect(result.gesetzliche_absicherung).toBe(800);
      expect(result.gesetzliche_quelle).toBe('drv_em');
    });

    it('falls back to 35% gross for employee without EM data', () => {
      const result = calcBuLuecke(basePerson, { ...basePension, disability_pension: null }, []);
      expect(result.gesetzliche_absicherung).toBeCloseTo(5500 * EM_FALLBACK_PERCENT, 2);
      expect(result.gesetzliche_quelle).toBe('fallback');
    });

    it('calculates Dienstunfähigkeit for civil servants', () => {
      const beamter: VLPersonInput = {
        ...basePerson, employment_status: 'civil_servant',
        ruhegehaltfaehiges_grundgehalt: 4000, ruhegehaltfaehige_dienstjahre: 20,
      };
      const result = calcBuLuecke(beamter, null, []);
      const satz = Math.min(20 * BEAMTE_SATZ_PRO_JAHR, BEAMTE_MAX_VERSORGUNGSSATZ);
      expect(result.gesetzliche_absicherung).toBe(Math.round(4000 * satz * 100) / 100);
      expect(result.gesetzliche_quelle).toBe('dienstunfaehigkeit');
    });

    it('aggregates bu_monthly_benefit from combo contracts', () => {
      const combo = makeContract({ contract_type: 'Rürup', bu_monthly_benefit: 1500 });
      const result = calcBuLuecke(basePerson, basePension, [combo]);
      expect(result.private_bu).toBe(1500);
    });

    it('uses monthly_benefit for pure BU contracts', () => {
      const buContract = makeContract({ contract_type: 'Berufsunfähigkeit', monthly_benefit: 2000 });
      const result = calcBuLuecke(basePerson, basePension, [buContract]);
      expect(result.private_bu).toBe(2000);
    });

    it('self_employed without DRV has missing source', () => {
      const self: VLPersonInput = { ...basePerson, employment_status: 'self_employed', gross_income_monthly: 6000 };
      const result = calcBuLuecke(self, { ...basePension, disability_pension: null }, []);
      expect(result.gesetzliche_absicherung).toBe(0);
      expect(result.gesetzliche_quelle).toBe('missing');
    });
  });
});
