/**
 * Engine 9: Vorsorge-Lückenrechner — Berechnungslogik
 * Pure TypeScript, keine React/Supabase-Imports.
 * Strikte Datenisolation: Keine anderen Engines importiert.
 */
import type {
  VLPersonInput,
  VLPensionInput,
  VLContractInput,
  AltersvorsorgeResult,
  BuLueckeResult,
  GesetzlicheQuelleAlter,
  GesetzlicheQuelleBU,
} from './spec';

import {
  DEFAULT_NEED_PERCENT,
  DEFAULT_ANNUITY_YEARS,
  BEAMTE_MAX_VERSORGUNGSSATZ,
  BEAMTE_SATZ_PRO_JAHR,
  EM_FALLBACK_PERCENT,
  ALTERSVORSORGE_TYPES,
  BU_TYPES,
} from './spec';

// ─── Helpers ─────────────────────────────────────────────────

function isAltersvorsorgeType(type: string | null): boolean {
  if (!type) return false;
  return ALTERSVORSORGE_TYPES.some(t =>
    type.toLowerCase().includes(t.toLowerCase()),
  );
}

function isBuType(type: string | null): boolean {
  if (!type) return false;
  return BU_TYPES.some(t =>
    type.toLowerCase().includes(t.toLowerCase()),
  );
}

function isActiveContract(c: VLContractInput): boolean {
  if (!c.status) return true;
  const s = c.status.toLowerCase();
  return s === 'aktiv' || s === 'active';
}

function isVorsorgeCategory(c: VLContractInput): boolean {
  return !c.category || c.category === 'vorsorge';
}

// ─── Altersvorsorge ──────────────────────────────────────────

export function calcAltersvorsorge(
  person: VLPersonInput,
  pension: VLPensionInput | null,
  contracts: VLContractInput[],
  needPercent: number = DEFAULT_NEED_PERCENT,
): AltersvorsorgeResult {
  // 1) Gesetzliche Versorgung
  let gesetzliche = 0;
  let quelle: GesetzlicheQuelleAlter = 'missing';

  const empStatus = person.employment_status?.toLowerCase() ?? '';

  if (empStatus === 'civil_servant' || empStatus === 'beamter') {
    if (pension?.projected_pension && pension.projected_pension > 0) {
      gesetzliche = pension.projected_pension;
      quelle = 'pension';
    } else if (
      person.ruhegehaltfaehiges_grundgehalt &&
      person.ruhegehaltfaehige_dienstjahre
    ) {
      const satz = Math.min(
        person.ruhegehaltfaehige_dienstjahre * BEAMTE_SATZ_PRO_JAHR,
        BEAMTE_MAX_VERSORGUNGSSATZ,
      );
      gesetzliche = person.ruhegehaltfaehiges_grundgehalt * satz;
      quelle = 'pension';
    }
  } else {
    // employee / self_employed
    if (pension?.projected_pension && pension.projected_pension > 0) {
      gesetzliche = pension.projected_pension;
      quelle = 'drv';
    }
  }

  // 2) Private Altersvorsorge
  let privateRenten = 0;
  let privateVerrentung = 0;

  const relevantContracts = contracts.filter(
    c =>
      isVorsorgeCategory(c) &&
      isActiveContract(c) &&
      isAltersvorsorgeType(c.contract_type) &&
      c.person_id === person.id,
  );

  for (const c of relevantContracts) {
    if (c.monthly_benefit && c.monthly_benefit > 0) {
      privateRenten += c.monthly_benefit;
    } else {
      const capital = c.insured_sum || c.current_balance || 0;
      if (capital > 0) {
        privateVerrentung += capital / DEFAULT_ANNUITY_YEARS / 12;
      }
    }
  }

  // 3) Ergebnis
  const expectedTotal = gesetzliche + privateRenten + privateVerrentung;
  const need = (person.net_income_monthly || 0) * needPercent;
  const gap = Math.max(0, need - expectedTotal);
  const surplus = Math.max(0, expectedTotal - need);
  const capitalNeeded = gap * 12 * DEFAULT_ANNUITY_YEARS;

  return {
    gesetzliche_versorgung: gesetzliche,
    gesetzliche_quelle: quelle,
    private_renten: privateRenten,
    private_verrentung: Math.round(privateVerrentung * 100) / 100,
    expected_total: Math.round(expectedTotal * 100) / 100,
    retirement_need: Math.round(need * 100) / 100,
    retirement_need_percent: needPercent,
    gap: Math.round(gap * 100) / 100,
    surplus: Math.round(surplus * 100) / 100,
    capital_needed: Math.round(capitalNeeded),
  };
}

// ─── BU / EU Lücke ───────────────────────────────────────────

export function calcBuLuecke(
  person: VLPersonInput,
  pension: VLPensionInput | null,
  contracts: VLContractInput[],
  needPercent: number = DEFAULT_NEED_PERCENT,
): BuLueckeResult {
  // 1) Gesetzliche BU/EU
  let gesetzliche = 0;
  let quelle: GesetzlicheQuelleBU = 'missing';

  const empStatus = person.employment_status?.toLowerCase() ?? '';

  if (empStatus === 'civil_servant' || empStatus === 'beamter') {
    // Dienstunfähigkeit: erreichter Versorgungssatz * Grundgehalt
    if (
      person.ruhegehaltfaehiges_grundgehalt &&
      person.ruhegehaltfaehige_dienstjahre
    ) {
      const satz = Math.min(
        person.ruhegehaltfaehige_dienstjahre * BEAMTE_SATZ_PRO_JAHR,
        BEAMTE_MAX_VERSORGUNGSSATZ,
      );
      gesetzliche = person.ruhegehaltfaehiges_grundgehalt * satz;
      quelle = 'dienstunfaehigkeit';
    }
  } else if (empStatus === 'employee' || empStatus === 'angestellt') {
    if (pension?.disability_pension && pension.disability_pension > 0) {
      gesetzliche = pension.disability_pension;
      quelle = 'drv_em';
    } else if (person.gross_income_monthly) {
      gesetzliche = person.gross_income_monthly * EM_FALLBACK_PERCENT;
      quelle = 'fallback';
    }
  }
  // self_employed: 0

  // 2) Private BU
  let privateBu = 0;
  const buContracts = contracts.filter(
    c =>
      isVorsorgeCategory(c) &&
      isActiveContract(c) &&
      isBuType(c.contract_type) &&
      c.person_id === person.id,
  );

  for (const c of buContracts) {
    if (c.monthly_benefit && c.monthly_benefit > 0) {
      privateBu += c.monthly_benefit;
    }
  }

  // 3) Ergebnis
  const total = gesetzliche + privateBu;
  const need = (person.net_income_monthly || 0) * needPercent;
  const gap = Math.max(0, need - total);
  const surplus = Math.max(0, total - need);

  return {
    gesetzliche_absicherung: Math.round(gesetzliche * 100) / 100,
    gesetzliche_quelle: quelle,
    private_bu: privateBu,
    total_absicherung: Math.round(total * 100) / 100,
    bu_need: Math.round(need * 100) / 100,
    bu_need_percent: needPercent,
    bu_gap: Math.round(gap * 100) / 100,
    bu_surplus: Math.round(surplus * 100) / 100,
  };
}
