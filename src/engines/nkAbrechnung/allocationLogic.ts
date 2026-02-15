/**
 * Verteilerschluessel-Berechnung (Allocation Logic)
 * 
 * Berechnet den Anteil einer Kostenposition fuer eine Einheit/Lease.
 * Unterstuetzt unterjaehrige Mietverhaeltnisse (anteilige Tage).
 */

import { AllocationKeyType, NKCostItem, NKMatrixRow } from './spec';
import { differenceInDays, parseISO, max, min } from 'date-fns';

interface AllocationInput {
  costItem: NKCostItem;
  unitAreaSqm: number;
  totalAreaSqm: number;
  unitMea: number;
  totalMea: number;
  unitPersons: number;
  totalPersons: number;
  totalUnits: number;
}

interface PeriodInfo {
  periodStart: string; // ISO date
  periodEnd: string;
  leaseStart: string;
  leaseEnd: string | null; // null = unbefristet
}

/**
 * Berechnet die Anzahl der Tage, die ein Lease innerhalb einer Periode aktiv ist.
 */
export function calculateLeaseDaysInPeriod(period: PeriodInfo): {
  leaseDays: number;
  totalDays: number;
  ratio: number;
} {
  const pStart = parseISO(period.periodStart);
  const pEnd = parseISO(period.periodEnd);
  const lStart = parseISO(period.leaseStart);
  const lEnd = period.leaseEnd ? parseISO(period.leaseEnd) : pEnd;

  const effectiveStart = max([pStart, lStart]);
  const effectiveEnd = min([pEnd, lEnd]);

  const totalDays = differenceInDays(pEnd, pStart) + 1;
  const leaseDays = Math.max(0, differenceInDays(effectiveEnd, effectiveStart) + 1);

  return {
    leaseDays,
    totalDays,
    ratio: totalDays > 0 ? leaseDays / totalDays : 0,
  };
}

/**
 * Berechnet den Anteil einer Kostenposition fuer eine Einheit basierend auf dem Schluessel.
 * 
 * Wenn die WEG-Abrechnung bereits einen unit amount liefert (amountUnit),
 * wird dieser bevorzugt (Direktuebernahme).
 */
export function allocateCostItem(
  input: AllocationInput,
  periodInfo?: PeriodInfo
): NKMatrixRow {
  const { costItem } = input;

  let shareUnit: number;
  let basisUnit: number | null = null;
  let basisTotal: number | null = null;

  // Wenn die WEG-Abrechnung bereits den Einheitsanteil liefert
  if (costItem.amountUnit !== null && costItem.amountUnit > 0) {
    shareUnit = costItem.amountUnit;
    basisUnit = costItem.keyBasisUnit;
    basisTotal = costItem.keyBasisTotal;
  } else {
    // Berechnung nach Verteilerschluessel
    const result = calculateShare(
      costItem.amountTotalHouse,
      costItem.keyType,
      input
    );
    shareUnit = result.share;
    basisUnit = result.basisUnit;
    basisTotal = result.basisTotal;
  }

  // Unterjaehrige Anpassung
  if (periodInfo) {
    const { ratio } = calculateLeaseDaysInPeriod(periodInfo);
    if (ratio < 1) {
      shareUnit = Math.round(shareUnit * ratio * 100) / 100;
    }
  }

  return {
    categoryCode: costItem.categoryCode,
    label: costItem.labelDisplay,
    keyType: costItem.keyType,
    totalHouse: costItem.amountTotalHouse,
    basisUnit,
    basisTotal,
    shareUnit: Math.round(shareUnit * 100) / 100,
    isApportionable: costItem.isApportionable,
  };
}

function calculateShare(
  totalAmount: number,
  keyType: AllocationKeyType,
  input: AllocationInput
): { share: number; basisUnit: number | null; basisTotal: number | null } {
  switch (keyType) {
    case AllocationKeyType.AREA_SQM:
      if (input.totalAreaSqm <= 0) return { share: 0, basisUnit: input.unitAreaSqm, basisTotal: input.totalAreaSqm };
      return {
        share: totalAmount * (input.unitAreaSqm / input.totalAreaSqm),
        basisUnit: input.unitAreaSqm,
        basisTotal: input.totalAreaSqm,
      };

    case AllocationKeyType.MEA:
      if (input.totalMea <= 0) return { share: 0, basisUnit: input.unitMea, basisTotal: input.totalMea };
      return {
        share: totalAmount * (input.unitMea / input.totalMea),
        basisUnit: input.unitMea,
        basisTotal: input.totalMea,
      };

    case AllocationKeyType.PERSONS:
      if (input.totalPersons <= 0) return { share: 0, basisUnit: input.unitPersons, basisTotal: input.totalPersons };
      return {
        share: totalAmount * (input.unitPersons / input.totalPersons),
        basisUnit: input.unitPersons,
        basisTotal: input.totalPersons,
      };

    case AllocationKeyType.UNIT_COUNT:
      if (input.totalUnits <= 0) return { share: 0, basisUnit: 1, basisTotal: input.totalUnits };
      return {
        share: totalAmount / input.totalUnits,
        basisUnit: 1,
        basisTotal: input.totalUnits,
      };

    case AllocationKeyType.CONSUMPTION:
    case AllocationKeyType.CUSTOM:
      // Verbrauch/Custom: Muss direkt aus Dokument kommen (amountUnit)
      return { share: 0, basisUnit: null, basisTotal: null };

    default:
      return { share: 0, basisUnit: null, basisTotal: null };
  }
}

/**
 * Berechnet die anteiligen Vorauszahlungen fuer einen unterjaehrigen Zeitraum.
 */
export function calculateProratedPrepayments(
  monthlyNK: number,
  monthlyHeating: number,
  periodInfo: PeriodInfo
): { prepaidNK: number; prepaidHeating: number } {
  const { leaseDays, totalDays } = calculateLeaseDaysInPeriod(periodInfo);
  const months = totalDays > 0 ? (leaseDays / totalDays) * 12 : 12;

  return {
    prepaidNK: Math.round(monthlyNK * months * 100) / 100,
    prepaidHeating: Math.round(monthlyHeating * months * 100) / 100,
  };
}
