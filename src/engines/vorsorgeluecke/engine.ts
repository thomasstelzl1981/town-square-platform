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
  DEFAULT_GROWTH_RATE,
  DEFAULT_FALLBACK_YEARS_TO_RETIREMENT,
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

function isCivilServant(empStatus: string): boolean {
  return empStatus === 'civil_servant' || empStatus === 'beamter' || empStatus === 'beamte';
}

function isEmployee(empStatus: string): boolean {
  return empStatus === 'employee' || empStatus === 'angestellt';
}

function yearsToRetirement(person: VLPersonInput): number {
  if (person.planned_retirement_date) {
    const diff = new Date(person.planned_retirement_date).getTime() - Date.now();
    const years = diff / (365.25 * 24 * 60 * 60 * 1000);
    return Math.max(0, years);
  }
  return DEFAULT_FALLBACK_YEARS_TO_RETIREMENT;
}

function normalizeToMonthly(premium: number, interval: string | null): number {
  switch (interval?.toLowerCase()) {
    case 'jaehrlich':
    case 'jährlich':
      return premium / 12;
    case 'halbjaehrlich':
    case 'halbjährlich':
      return premium / 6;
    case 'vierteljaehrlich':
    case 'vierteljährlich':
      return premium / 3;
    case 'einmalig':
      return 0; // einmalig wird nicht als laufender Beitrag hochgerechnet
    default:
      return premium;
  }
}

function projectCapital(
  currentBalance: number,
  monthlyPremium: number,
  years: number,
  growthRate: number = DEFAULT_GROWTH_RATE,
): number {
  if (years <= 0) return currentBalance;

  // Kapital hochrechnen: FV = PV * (1+r)^n
  const futureBalance = currentBalance * Math.pow(1 + growthRate, years);

  // Laufende Sparleistung hochrechnen (Endwert einer nachschüssigen Rente)
  let futurePremiums = 0;
  if (monthlyPremium > 0) {
    const annualPremium = monthlyPremium * 12;
    futurePremiums = annualPremium * ((Math.pow(1 + growthRate, years) - 1) / growthRate);
  }

  return futureBalance + futurePremiums;
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

  if (isCivilServant(empStatus)) {
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
    // employee / self_employed / sonstige — alle können DRV-Ansprüche haben
    if (pension?.projected_pension && pension.projected_pension > 0) {
      gesetzliche = pension.projected_pension;
      quelle = 'drv';
    }
  }

  // 2) Private Altersvorsorge
  let privateRenten = 0;
  let privateVerrentung = 0;
  const ytr = yearsToRetirement(person);

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
      let futureCapital: number;

      if (c.projected_end_value && c.projected_end_value > 0) {
        // Manuell eingetragene Ablaufleistung (z.B. aus Versorgungsmitteilung)
        futureCapital = c.projected_end_value;
      } else {
        const capital = c.insured_sum || c.current_balance || 0;
        if (capital <= 0) continue;
        const rate = c.growth_rate_override ?? DEFAULT_GROWTH_RATE;
        const monthlyPremium = (c.premium && c.premium > 0)
          ? normalizeToMonthly(c.premium, c.payment_interval)
          : 0;
        futureCapital = projectCapital(capital, monthlyPremium, ytr, rate);
      }

      privateVerrentung += futureCapital / DEFAULT_ANNUITY_YEARS / 12;
    }
  }

  // 3) Ergebnis
  const expectedTotal = gesetzliche + privateRenten + privateVerrentung;
  const totalNetIncome = (person.net_income_monthly || 0) + (person.business_income_monthly || 0);
  const need = totalNetIncome * needPercent;
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

  if (isCivilServant(empStatus)) {
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
  } else {
    // employee / self_employed / sonstige — alle können DRV-EM-Ansprüche haben
    if (pension?.disability_pension && pension.disability_pension > 0) {
      gesetzliche = pension.disability_pension;
      quelle = 'drv_em';
    } else if (isEmployee(empStatus) && person.gross_income_monthly) {
      // 35% Brutto-Fallback NUR für Angestellte
      gesetzliche = person.gross_income_monthly * EM_FALLBACK_PERCENT;
      quelle = 'fallback';
    }
    // self_employed ohne DRV-Daten: bleibt 0, quelle bleibt 'missing'
  }

  // 2) Private BU — Kombiversicherungen korrekt aggregieren
  let privateBu = 0;

  const vorsorgeContracts = contracts.filter(
    c =>
      isVorsorgeCategory(c) &&
      isActiveContract(c) &&
      c.person_id === person.id,
  );

  // 2a) Alle Verträge mit explizitem bu_monthly_benefit (Kombiversicherungen)
  for (const c of vorsorgeContracts) {
    if (c.bu_monthly_benefit && c.bu_monthly_benefit > 0) {
      privateBu += c.bu_monthly_benefit;
    }
  }

  // 2b) Reine BU-Verträge OHNE bu_monthly_benefit: Fallback auf monthly_benefit
  for (const c of vorsorgeContracts) {
    if (
      isBuType(c.contract_type) &&
      (!c.bu_monthly_benefit || c.bu_monthly_benefit <= 0)
    ) {
      if (c.monthly_benefit && c.monthly_benefit > 0) {
        privateBu += c.monthly_benefit;
      }
    }
  }

  // 3) Ergebnis
  const total = gesetzliche + privateBu;
  const totalNetIncome = (person.net_income_monthly || 0) + (person.business_income_monthly || 0);
  const need = totalNetIncome * needPercent;
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
