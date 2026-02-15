/**
 * V+V Steuer Engine — Pure Calculation Logic
 * No side effects, no DB access. Pure functions only.
 */
import type { VVPropertyTaxData, VVPropertyResult, VVContextSummary } from './spec';

/**
 * Calculate AfA basis: (purchase_price * building_share_percent/100) + (acquisition_costs * building_share_percent/100)
 */
export function calculateAfaBasis(purchasePrice: number, acquisitionCosts: number, buildingSharePercent: number): number {
  const share = buildingSharePercent / 100;
  return (purchasePrice * share) + (acquisitionCosts * share);
}

/**
 * Calculate annual AfA amount
 */
export function calculateAfaAmount(afaBasis: number, afaRatePercent: number): number {
  return afaBasis * (afaRatePercent / 100);
}

/**
 * Calculate the full tax result for a single property
 */
export function calculatePropertyResult(data: VVPropertyTaxData): VVPropertyResult {
  const { incomeAggregated: inc, financingAggregated: fin, nkAggregated: nk, manualData: m, afa, purchasePrice, acquisitionCosts } = data;
  
  // Einnahmen
  const incomeBreakdown = {
    coldRent: inc.coldRentAnnual,
    nkAdvance: inc.nkAdvanceAnnual,
    nkNachzahlung: inc.nkNachzahlung,
    other: m.incomeOther,
    insurancePayout: m.incomeInsurancePayout,
  };
  const totalIncome = Object.values(incomeBreakdown).reduce((a, b) => a + b, 0);
  
  // Werbungskosten: Finanzierung
  const financing = {
    loanInterest: fin.loanInterestAnnual,
    disagio: m.costDisagio,
    financingFees: m.costFinancingFees,
    subtotal: fin.loanInterestAnnual + m.costDisagio + m.costFinancingFees,
  };
  
  // Werbungskosten: Bewirtschaftung
  const operating = {
    grundsteuer: nk.grundsteuer,
    nonRecoverableNK: nk.nonRecoverableCosts,
    maintenance: m.costMaintenance,
    managementFee: m.costManagementFee,
    legalAdvisory: m.costLegalAdvisory,
    insuranceNonRecoverable: m.costInsuranceNonRecoverable,
    travel: m.costTravel,
    bankFees: m.costBankFees,
    other: m.costOther,
    subtotal: 0,
  };
  operating.subtotal = nk.grundsteuer + nk.nonRecoverableCosts + m.costMaintenance + m.costManagementFee +
    m.costLegalAdvisory + m.costInsuranceNonRecoverable + m.costTravel + m.costBankFees + m.costOther;
  
  // Werbungskosten: AfA
  const afaBasis = calculateAfaBasis(purchasePrice, acquisitionCosts, afa.buildingSharePercent);
  const afaAmount = calculateAfaAmount(afaBasis, afa.afaRatePercent);
  const afaBreakdown = {
    basis: afaBasis,
    rate: afa.afaRatePercent,
    amount: afaAmount,
    heritage: m.heritageAfaAmount,
    special: m.specialAfaAmount,
    subtotal: afaAmount + m.heritageAfaAmount + m.specialAfaAmount,
  };
  
  const totalCosts = financing.subtotal + operating.subtotal + afaBreakdown.subtotal;
  
  return {
    totalIncome,
    incomeBreakdown,
    totalCosts,
    costsBreakdown: { financing, operating, afa: afaBreakdown },
    surplus: totalIncome - totalCosts,
  };
}

/**
 * Build a context-level summary from multiple property results
 */
export function buildContextSummary(
  contextId: string,
  contextName: string,
  contextType: string,
  taxNumber: string,
  taxYear: number,
  propertyData: VVPropertyTaxData[],
): VVContextSummary {
  const properties = propertyData.map(pd => {
    const result = calculatePropertyResult(pd);
    return {
      propertyId: pd.propertyId,
      propertyName: pd.propertyName,
      result,
      confirmed: pd.manualData.confirmed,
    };
  });
  
  return {
    contextId,
    contextName,
    contextType,
    taxNumber,
    taxYear,
    properties,
    totalIncome: properties.reduce((s, p) => s + p.result.totalIncome, 0),
    totalCosts: properties.reduce((s, p) => s + p.result.totalCosts, 0),
    totalSurplus: properties.reduce((s, p) => s + p.result.surplus, 0),
    allConfirmed: properties.every(p => p.confirmed),
  };
}
