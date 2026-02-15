/**
 * Bewirtschaftungs-/BWA-Engine — Reine Funktionen
 */

import type {
  BWAInput,
  BWAResult,
  InstandhaltungInput,
  InstandhaltungResult,
  LeaseInfo,
  LeerstandResult,
  MietpotenzialResult,
} from './spec';
import { BEWIRTSCHAFTUNG_DEFAULTS } from './spec';

export function calcBWA(input: BWAInput): BWAResult {
  const { grossRentalIncome, nonRecoverableCosts, annualDebtService, depreciation } = input;

  const totalCosts = nonRecoverableCosts.reduce((s, c) => s + c.amount, 0);
  const noi = grossRentalIncome - totalCosts;
  const cashflowBeforeTax = noi - annualDebtService;
  const cashflowAfterDepreciation = cashflowBeforeTax + depreciation; // steuerlich relevant

  const bruttoRendite = grossRentalIncome; // wird normiert wenn propertyValue verfuegbar
  const nettoRendite = noi;
  const costRatio = grossRentalIncome > 0 ? totalCosts / grossRentalIncome : 0;

  return {
    grossIncome: grossRentalIncome,
    totalCosts,
    noi,
    cashflowBeforeTax,
    cashflowAfterDepreciation,
    bruttoRendite,
    nettoRendite,
    costRatio,
  };
}

export function calcInstandhaltungsruecklage(input: InstandhaltungInput): InstandhaltungResult {
  const currentYear = input.currentYear ?? new Date().getFullYear();
  const buildingAge = currentYear - input.yearBuilt;

  const tier = BEWIRTSCHAFTUNG_DEFAULTS.petersFactorByAge.find((t) => buildingAge <= t.maxAge)!;
  const petersFactor = tier.factor;

  const annualReserve = input.buildingCost * petersFactor;

  return {
    annualReserve,
    monthlyReserve: annualReserve / 12,
    petersFactor,
    buildingAge,
  };
}

export function calcLeerstandsquote(
  units: LeaseInfo[],
  avgMonthlyRentPerUnit?: number
): LeerstandResult {
  const totalUnits = units.length;
  const vacantUnits = units.filter((u) => u.isVacant).length;
  const vacancyRate = totalUnits > 0 ? vacantUnits / totalUnits : 0;

  const totalVacantDays = units.reduce((s, u) => s + u.vacantDays, 0);
  const totalDays = units.reduce((s, u) => s + u.totalDays, 0);
  const dayBasedRate = totalDays > 0 ? totalVacantDays / totalDays : 0;

  const estimatedLoss = avgMonthlyRentPerUnit
    ? dayBasedRate * avgMonthlyRentPerUnit * totalUnits * 12
    : 0;

  return { vacancyRate, vacantUnits, totalUnits, estimatedLoss };
}

export function calcMietpotenzial(currentRent: number, marketRent: number): MietpotenzialResult {
  const delta = marketRent - currentRent;
  const deltaPercent = currentRent > 0 ? delta / currentRent : 0;

  const tolerance = BEWIRTSCHAFTUNG_DEFAULTS.marketRentTolerance;
  let potential: MietpotenzialResult['potential'] = 'at_market';
  if (deltaPercent > tolerance) potential = 'below_market';
  else if (deltaPercent < -tolerance) potential = 'above_market';

  return { currentRent, marketRent, delta, deltaPercent, potential };
}
