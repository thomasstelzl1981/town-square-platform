/**
 * Akquise-Kalkulations-Engine — Reine Funktionen (SSOT)
 * 
 * Konsolidiert ALLE Berechnungslogik für Bestand (Hold) und Aufteiler (Flip).
 * Kein DB-Zugriff, kein React — rein testbar.
 * 
 * Consumers:
 * - BestandCalculation.tsx (30-year projection)
 * - AufteilerCalculation.tsx (yield-based flip)
 * - ProjectAufteilerCalculation.tsx (project-level flip)
 * - QuickCalcTool.tsx (quick KPIs)
 * - useAcqOffers.ts (DB persistence helpers)
 */

import type {
  BestandFullParams, BestandFullResult, BestandYearlyData,
  BestandQuickParams, BestandQuickResult,
  AufteilerFullParams, AufteilerFullResult, AufteilerSensitivityRow,
  AufteilerQuickParams, AufteilerQuickResult,
  AufteilerProjectParams, AufteilerProjectResult,
} from './spec';

// ============================================================================
// BESTAND (HOLD)
// ============================================================================

/**
 * Full 30-year hold projection with amortization schedule.
 * Used by BestandCalculation.tsx
 */
export function calcBestandFull(params: BestandFullParams): BestandFullResult {
  const {
    purchasePrice, monthlyRent, equityPercent, interestRate, repaymentRate,
    rentIncreaseRate, valueIncreaseRate, ancillaryCostPercent,
  } = params;

  const yearlyRent = monthlyRent * 12;
  const ancillaryCosts = purchasePrice * (ancillaryCostPercent / 100);
  const totalInvestment = purchasePrice + ancillaryCosts;
  const equity = totalInvestment * (equityPercent / 100);
  const loanAmount = totalInvestment - equity;

  const annuityRate = (interestRate + repaymentRate) / 100;
  const yearlyAnnuity = loanAmount * annuityRate;
  const monthlyRate = yearlyAnnuity / 12;

  const grossYield = purchasePrice > 0 ? (yearlyRent / purchasePrice) * 100 : 0;
  const maxFinancing = (yearlyRent * 0.8 / 5) * 100;

  // 30-year projection
  const yearlyData: BestandYearlyData[] = [];
  let currentDebt = loanAmount;
  let currentRent = yearlyRent;
  let currentValue = purchasePrice;
  let totalInterest = 0;
  let totalRepayment = 0;

  for (let year = 1; year <= 30; year++) {
    const interest = currentDebt * (interestRate / 100);
    const repayment = Math.min(yearlyAnnuity - interest, currentDebt);

    totalInterest += interest;
    totalRepayment += repayment;
    currentDebt = Math.max(0, currentDebt - repayment);
    currentRent *= (1 + rentIncreaseRate / 100);
    currentValue *= (1 + valueIncreaseRate / 100);

    yearlyData.push({
      year,
      rent: currentRent,
      interest,
      repayment,
      remainingDebt: currentDebt,
      propertyValue: currentValue,
      equity: currentValue - currentDebt,
    });
  }

  const fullRepaymentYear = yearlyData.findIndex(d => d.remainingDebt <= 0) + 1 || 30;

  let value40 = purchasePrice;
  for (let i = 0; i < 40; i++) {
    value40 *= (1 + valueIncreaseRate / 100);
  }

  const wealthGrowth = value40 - equity;
  const roi = equity > 0 ? (wealthGrowth / equity) * 100 : 0;

  return {
    totalInvestment, equity, loanAmount, yearlyAnnuity, monthlyRate,
    grossYield, maxFinancing, yearlyData, fullRepaymentYear,
    totalInterest, totalRepayment,
    value10: yearlyData[9]?.propertyValue || 0,
    value20: yearlyData[19]?.propertyValue || 0,
    debt10: yearlyData[9]?.remainingDebt || 0,
    debt20: yearlyData[19]?.remainingDebt || 0,
    wealth10: yearlyData[9]?.equity || 0,
    wealth20: yearlyData[19]?.equity || 0,
    value40, wealthGrowth, roi,
  };
}

/**
 * Quick Bestand KPIs (fewer inputs, no projection timeline).
 * Used by QuickCalcTool.tsx and useAcqOffers.ts persistence.
 */
export function calcBestandQuick(params: BestandQuickParams): BestandQuickResult {
  const purchasePrice = params.purchasePrice || 0;
  const monthlyRent = params.monthlyRent || 0;
  const equity = params.equity ?? purchasePrice * 0.2;
  const interestRate = params.interestRate ?? 3.5;
  const repaymentRate = params.repaymentRate ?? 2;
  const managementCostPercent = params.managementCostPercent ?? 25;
  const ancillaryCostPercent = params.ancillaryCostPercent ?? 10;

  const yearlyRent = monthlyRent * 12;
  const ancillaryCosts = purchasePrice * (ancillaryCostPercent / 100);
  const totalInvestment = purchasePrice + ancillaryCosts;
  const loanAmount = totalInvestment - equity;

  const grossYield = purchasePrice > 0 ? (yearlyRent / purchasePrice) * 100 : 0;
  const managementCosts = yearlyRent * (managementCostPercent / 100);
  const noi = yearlyRent - managementCosts;
  const netYield = purchasePrice > 0 ? (noi / purchasePrice) * 100 : 0;

  const yearlyInterest = loanAmount * (interestRate / 100);
  const yearlyRepayment = loanAmount * (repaymentRate / 100);
  const yearlyDebtService = yearlyInterest + yearlyRepayment;
  const monthlyCashflow = (noi - yearlyDebtService) / 12;

  const ltv = totalInvestment > 0 ? (loanAmount / totalInvestment) * 100 : 0;
  const dscr = yearlyDebtService > 0 ? noi / yearlyDebtService : 0;
  const cashOnCash = equity > 0 ? ((noi - yearlyDebtService) / equity) * 100 : 0;
  const multiplier = yearlyRent > 0 ? purchasePrice / yearlyRent : 0;

  return {
    purchasePrice,
    totalInvestment,
    equity,
    loanAmount,
    yearlyRent,
    noi,
    grossYield: Math.round(grossYield * 100) / 100,
    netYield: Math.round(netYield * 100) / 100,
    monthlyCashflow: Math.round(monthlyCashflow),
    ltv: Math.round(ltv * 10) / 10,
    dscr: Math.round(dscr * 100) / 100,
    cashOnCash: Math.round(cashOnCash * 100) / 100,
    multiplier: Math.round(multiplier * 10) / 10,
  };
}

// ============================================================================
// AUFTEILER (FLIP)
// ============================================================================

/**
 * Full yield-based flip calculation with sensitivity analysis.
 * Used by AufteilerCalculation.tsx
 */
export function calcAufteilerFull(params: AufteilerFullParams): AufteilerFullResult {
  const {
    purchasePrice, yearlyRent, targetYield, salesCommission,
    holdingPeriodMonths, ancillaryCostPercent, interestRate,
    equityPercent, projectCosts,
  } = params;

  const ancillaryCosts = purchasePrice * (ancillaryCostPercent / 100);
  const totalAcquisitionCosts = purchasePrice + ancillaryCosts + projectCosts;
  const loanAmount = totalAcquisitionCosts * (1 - equityPercent / 100);
  const equity = totalAcquisitionCosts * (equityPercent / 100);
  const interestCosts = loanAmount * (interestRate / 100) * (holdingPeriodMonths / 12);
  const rentIncome = yearlyRent * (holdingPeriodMonths / 12);
  const netCosts = totalAcquisitionCosts + interestCosts - rentIncome;

  const salesPriceGross = yearlyRent / (targetYield / 100);
  const factor = salesPriceGross / yearlyRent;
  const salesCommissionAmount = salesPriceGross * (salesCommission / 100);
  const salesPriceNet = salesPriceGross - salesCommissionAmount;

  const profit = salesPriceNet - netCosts;
  const profitMargin = salesPriceNet > 0 ? (profit / salesPriceNet) * 100 : 0;
  const roiOnEquity = equity > 0 ? (profit / equity) * 100 : 0;

  const sensitivityData = calcSensitivity(targetYield, yearlyRent, salesCommission, netCosts);

  return {
    ancillaryCosts, totalAcquisitionCosts, loanAmount, equity,
    interestCosts, rentIncome, netCosts,
    salesPriceGross, factor, salesCommissionAmount, salesPriceNet,
    profit, profitMargin, roiOnEquity, sensitivityData,
  };
}

/**
 * Quick unit-based flip KPIs.
 * Used by QuickCalcTool.tsx and useAcqOffers.ts persistence.
 */
export function calcAufteilerQuick(params: AufteilerQuickParams): AufteilerQuickResult {
  const purchasePrice = params.purchasePrice || 0;
  const unitsCount = params.unitsCount || 1;
  const avgUnitSalePrice = params.avgUnitSalePrice || 0;
  const renovationCostPerUnit = params.renovationCostPerUnit ?? 0;
  const salesCommissionPercent = params.salesCommissionPercent ?? 3;
  const holdingPeriodMonths = params.holdingPeriodMonths ?? 24;
  const ancillaryCostPercent = params.ancillaryCostPercent ?? 10;

  const totalSaleProceeds = avgUnitSalePrice * unitsCount;
  const salesCommission = totalSaleProceeds * (salesCommissionPercent / 100);
  const totalRenovationCosts = renovationCostPerUnit * unitsCount;
  const ancillaryCosts = purchasePrice * (ancillaryCostPercent / 100);

  const totalCosts = purchasePrice + ancillaryCosts + totalRenovationCosts + salesCommission;
  const grossProfit = totalSaleProceeds - totalCosts;
  const profitMarginPercent = totalCosts > 0 ? (grossProfit / totalCosts) * 100 : 0;

  const annualizedReturn = holdingPeriodMonths > 0
    ? (profitMarginPercent / holdingPeriodMonths) * 12
    : 0;

  const pricePerUnit = purchasePrice / unitsCount;
  const profitPerUnit = grossProfit / unitsCount;

  return {
    purchasePrice,
    unitsCount,
    totalSaleProceeds,
    totalCosts,
    grossProfit: Math.round(grossProfit),
    profitMarginPercent: Math.round(profitMarginPercent * 100) / 100,
    annualizedReturn: Math.round(annualizedReturn * 100) / 100,
    pricePerUnit: Math.round(pricePerUnit),
    profitPerUnit: Math.round(profitPerUnit),
    holdingPeriodMonths,
  };
}

/**
 * Project-level flip calculation (MOD-13).
 * Uses total list prices and yearly rent from units.
 */
export function calcAufteilerProject(params: AufteilerProjectParams): AufteilerProjectResult {
  const {
    purchasePrice, renovationBudget, targetYield, salesCommission,
    holdingPeriodMonths, ancillaryCostPercent, interestRate,
    equityPercent, totalListPrice, totalYearlyRent, unitsCount,
  } = params;

  const ancillaryCosts = purchasePrice * (ancillaryCostPercent / 100);
  const totalAcquisitionCosts = purchasePrice + ancillaryCosts + renovationBudget;

  const loanAmount = totalAcquisitionCosts * (1 - equityPercent / 100);
  const equity = totalAcquisitionCosts * (equityPercent / 100);
  const interestCosts = loanAmount * (interestRate / 100) * (holdingPeriodMonths / 12);

  const rentIncome = totalYearlyRent * (holdingPeriodMonths / 12);
  const netCosts = totalAcquisitionCosts + interestCosts - rentIncome;

  // Use list prices if available, otherwise derive from yield
  const salesPriceGross = totalListPrice > 0
    ? totalListPrice
    : (totalYearlyRent > 0 ? totalYearlyRent / (targetYield / 100) : 0);
  const salesCommissionAmount = salesPriceGross * (salesCommission / 100);
  const salesPriceNet = salesPriceGross - salesCommissionAmount;

  const profit = salesPriceNet - netCosts;
  const profitMargin = netCosts > 0 ? (profit / netCosts) * 100 : 0;
  const roiOnEquity = equity > 0 ? (profit / equity) * 100 : 0;
  const profitPerUnit = unitsCount > 0 ? profit / unitsCount : 0;
  const avgUnitPrice = unitsCount > 0 ? salesPriceGross / unitsCount : 0;
  const breakEvenUnits = avgUnitPrice > 0
    ? Math.ceil(netCosts / (avgUnitPrice * (1 - salesCommission / 100)))
    : unitsCount;
  const factor = totalYearlyRent > 0 ? salesPriceGross / totalYearlyRent : 0;

  const sensitivityData = calcSensitivity(targetYield, totalYearlyRent, salesCommission, netCosts);

  return {
    ancillaryCosts, totalAcquisitionCosts, loanAmount, equity,
    interestCosts, rentIncome, netCosts,
    salesPriceGross, factor, salesCommissionAmount, salesPriceNet,
    profit, profitMargin, roiOnEquity, sensitivityData,
    profitPerUnit, breakEvenUnits,
  };
}

// ============================================================================
// HELPERS (internal)
// ============================================================================

function calcSensitivity(
  targetYield: number,
  yearlyRent: number,
  salesCommission: number,
  netCosts: number,
): AufteilerSensitivityRow[] {
  return [-0.5, 0, 0.5].map(delta => {
    const y = targetYield + delta;
    const price = yearlyRent > 0 ? yearlyRent / (y / 100) : 0;
    const comm = price * (salesCommission / 100);
    const net = price - comm;
    const prof = net - netCosts;
    return { yield: y, label: `${y.toFixed(1)}%`, salesPrice: price, profit: prof };
  });
}
