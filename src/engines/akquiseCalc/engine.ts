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
  AufteilerFinancingBreakdown, AlternativenMatrixCell,
  AufteilerQuickParams, AufteilerQuickResult,
  AufteilerProjectParams, AufteilerProjectResult,
  AncillaryCostBreakdown,
} from './spec';
import { GREST_BY_STATE, PLZ_TO_STATE, ANCILLARY_DEFAULTS, PROPERTY_TYPE_MAP } from './spec';

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
    maintenancePercent, managementCostPercent,
    renovationCosts = 0, constructionAncillaryPercent = 15, areaSqm = 0,
  } = params;

  const yearlyRent = monthlyRent * 12;
  const ancillaryCosts = purchasePrice * (ancillaryCostPercent / 100);

  // Construction / renovation costs
  const constructionAncillaryCosts = renovationCosts * (constructionAncillaryPercent / 100);
  const totalConstructionCosts = renovationCosts + constructionAncillaryCosts;

  const totalInvestment = purchasePrice + ancillaryCosts + totalConstructionCosts;
  const equity = totalInvestment * (equityPercent / 100);
  const loanAmount = totalInvestment - equity;

  const annuityRate = (interestRate + repaymentRate) / 100;
  const yearlyAnnuity = loanAmount * annuityRate;
  const monthlyRate = yearlyAnnuity / 12;

  const grossYield = purchasePrice > 0 ? (yearlyRent / purchasePrice) * 100 : 0;
  const maxFinancing = (yearlyRent * 0.8 / 5) * 100;

  // Maintenance & management costs (annual)
  const yearlyMaintenance = purchasePrice * ((maintenancePercent || 0) / 100);
  const yearlyManagement = yearlyRent * ((managementCostPercent || 0) / 100);

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
    const mgmt = currentRent * ((managementCostPercent || 0) / 100);
    const maint = currentValue * ((maintenancePercent || 0) / 100);
    const noi = currentRent - mgmt - maint;

    totalInterest += interest;
    totalRepayment += repayment;
    currentDebt = Math.max(0, currentDebt - repayment);
    currentRent *= (1 + rentIncreaseRate / 100);
    currentValue *= (1 + valueIncreaseRate / 100);

    yearlyData.push({
      year,
      rent: currentRent,
      noi,
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

  // Year 1 monthly cashflow KPIs
  const y1Noi = yearlyData[0]?.noi ?? 0;
  const y1Interest = yearlyData[0]?.interest ?? 0;
  const y1Repayment = yearlyData[0]?.repayment ?? 0;
  const noiMonthly = y1Noi / 12;
  const monthlyExpenses = (y1Interest + y1Repayment + yearlyManagement + yearlyMaintenance) / 12;
  const monthlyCashflow = monthlyRent - monthlyExpenses;
  const yearlyCashflow = monthlyCashflow * 12;
  const cashOnCash = equity > 0 ? (yearlyCashflow / equity) * 100 : 0;
  const costPerSqm = areaSqm > 0 ? totalInvestment / areaSqm : 0;

  return {
    totalInvestment, ancillaryCosts, equity, loanAmount, yearlyAnnuity, monthlyRate,
    grossYield, maxFinancing, yearlyData, fullRepaymentYear,
    totalInterest, totalRepayment,
    value10: yearlyData[9]?.propertyValue || 0,
    value20: yearlyData[19]?.propertyValue || 0,
    debt10: yearlyData[9]?.remainingDebt || 0,
    debt20: yearlyData[19]?.remainingDebt || 0,
    wealth10: yearlyData[9]?.equity || 0,
    wealth20: yearlyData[19]?.equity || 0,
    value40, wealthGrowth, roi,
    totalConstructionCosts, constructionAncillaryCosts, costPerSqm,
    noiMonthly, monthlyExpenses, monthlyCashflow, cashOnCash,
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
 * Full yield-based flip calculation with financing breakdown and alternatives matrix.
 * Used by AufteilerCalculation.tsx
 */
export function calcAufteilerFull(params: AufteilerFullParams): AufteilerFullResult {
  const {
    purchasePrice, yearlyRent, targetYield, salesCommission,
    holdingPeriodMonths, ancillaryCostPercent, interestRate,
    equityPercent, projectCosts,
    renovationCosts = 0, partitioningCosts = 0,
    constructionAncillaryPercent = 0, marketingCosts = 0,
    projectManagementCosts = 0, disagio = 0,
    areaSqm = 0, garageSaleProceeds = 0,
  } = params;

  // ── 1. Acquisition costs ──
  const ancillaryCosts = purchasePrice * (ancillaryCostPercent / 100);
  const totalAcquisitionCosts = purchasePrice + ancillaryCosts;

  // ── 2. Construction / renovation costs ──
  const granularConstruction = renovationCosts + partitioningCosts;
  const effectiveConstruction = granularConstruction > 0 ? granularConstruction : projectCosts;
  const constructionAncillaryCosts = effectiveConstruction * (constructionAncillaryPercent / 100);
  const totalConstructionCosts = effectiveConstruction + constructionAncillaryCosts;

  // ── 3. Developer tasks ──
  const totalDeveloperCosts = projectManagementCosts + marketingCosts;

  // ── 4. Financing ──
  const totalCostBase = totalAcquisitionCosts + totalConstructionCosts + totalDeveloperCosts;
  const loanAmount = totalCostBase * (1 - equityPercent / 100);
  const equity = totalCostBase * (equityPercent / 100);

  const holdingYears = holdingPeriodMonths / 12;
  // Acquisition loan runs full holding period
  const loanAmountAcquisition = totalAcquisitionCosts * (1 - equityPercent / 100);
  const interestAcquisition = loanAmountAcquisition * (interestRate / 100) * holdingYears;
  // Construction loan averages ~50% draw over the period (simplified)
  const loanAmountConstruction = (totalConstructionCosts + totalDeveloperCosts) * (1 - equityPercent / 100);
  const interestConstruction = loanAmountConstruction * (interestRate / 100) * holdingYears * 0.5;
  const effectiveDisagio = disagio;
  const rentalIncomeOffset = yearlyRent * holdingYears;
  // FIX: Financing costs = pure costs (interest + disagio). Rental income is REVENUE, not cost reduction.
  const totalFinancingCosts = interestAcquisition + interestConstruction + effectiveDisagio;

  const financingBreakdown: AufteilerFinancingBreakdown = {
    loanAmountAcquisition, loanAmountConstruction,
    interestAcquisition, interestConstruction,
    disagio: effectiveDisagio, rentalIncomeOffset,
    totalFinancingCosts,
  };

  const interestCosts = interestAcquisition + interestConstruction + effectiveDisagio;
  const rentIncome = rentalIncomeOffset;
  // FIX: netCosts = totalCostBase + financing (no rental deduction — rental is on revenue side)
  const netCosts = totalCostBase + interestCosts;
  const totalInvestmentGross = totalCostBase + totalFinancingCosts;

  // ── 5. Exit / Revenue ──
  const salesPriceGross = targetYield > 0 && yearlyRent > 0 ? yearlyRent / (targetYield / 100) : 0;
  const factor = yearlyRent > 0 ? salesPriceGross / yearlyRent : 0;
  const salesCommissionAmount = salesPriceGross * (salesCommission / 100);
  const salesPriceNet = salesPriceGross - salesCommissionAmount;
  const totalRevenue = salesPriceNet + garageSaleProceeds + rentIncome;

  // ── 6. Result ──
  const profit = totalRevenue - totalInvestmentGross;
  const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
  const roiOnEquity = equity > 0 ? (profit / equity) * 100 : 0;
  const costPerSqm = areaSqm > 0 ? totalInvestmentGross / areaSqm : 0;

  // ── Sensitivity ──
  const sensitivityData = calcSensitivity(targetYield, yearlyRent, salesCommission, netCosts);

  // ── Alternatives matrix (3x3: construction ±10% × sale price ±10%) ──
  const alternativenMatrix = calcAlternativenMatrix(
    totalConstructionCosts, salesPriceGross,
    totalAcquisitionCosts, totalDeveloperCosts,
    interestRate, equityPercent, holdingYears, disagio, yearlyRent,
    salesCommission, garageSaleProceeds,
  );

  return {
    ancillaryCosts, totalAcquisitionCosts,
    totalConstructionCosts, constructionAncillaryCosts,
    totalDeveloperCosts,
    loanAmount, equity, interestCosts, rentIncome, netCosts, financingBreakdown,
    salesPriceGross, factor, salesCommissionAmount, salesPriceNet,
    garageSaleProceeds, totalRevenue,
    totalInvestmentGross, profit, profitMargin, roiOnEquity, costPerSqm,
    sensitivityData, alternativenMatrix,
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

  // Delegate to calcAufteilerFull with mapped params
  const fullResult = calcAufteilerFull({
    purchasePrice, yearlyRent: totalYearlyRent, targetYield, salesCommission,
    holdingPeriodMonths, ancillaryCostPercent, interestRate, equityPercent,
    projectCosts: 0, renovationCosts: renovationBudget,
  });

  // Override salesPriceGross if totalListPrice is provided
  const salesPriceGross = totalListPrice > 0 ? totalListPrice : fullResult.salesPriceGross;
  const salesCommissionAmount = salesPriceGross * (salesCommission / 100);
  const salesPriceNet = salesPriceGross - salesCommissionAmount;
  const profit = salesPriceNet - fullResult.netCosts;
  const profitMargin = fullResult.netCosts > 0 ? (profit / fullResult.netCosts) * 100 : 0;
  const roiOnEquity = fullResult.equity > 0 ? (profit / fullResult.equity) * 100 : 0;
  const profitPerUnit = unitsCount > 0 ? profit / unitsCount : 0;
  const avgUnitPrice = unitsCount > 0 ? salesPriceGross / unitsCount : 0;
  const breakEvenUnits = avgUnitPrice > 0
    ? Math.ceil(fullResult.netCosts / (avgUnitPrice * (1 - salesCommission / 100)))
    : unitsCount;
  const factor = totalYearlyRent > 0 ? salesPriceGross / totalYearlyRent : 0;
  const sensitivityData = calcSensitivity(targetYield, totalYearlyRent, salesCommission, fullResult.netCosts);

  return {
    ...fullResult,
    salesPriceGross, factor, salesCommissionAmount, salesPriceNet,
    profit, profitMargin, roiOnEquity, sensitivityData,
    profitPerUnit, breakEvenUnits,
  };
}

// ============================================================================
// ANKAUFSNEBENKOSTEN (Acquisition Ancillary Costs)
// ============================================================================

/**
 * Resolve GrESt rate from PLZ prefix.
 * Returns state code + rate, or fallback to Berlin (6.0%) if unknown.
 */
export function resolveGrestFromPlz(postalCode?: string | null): { stateCode: string; stateName: string; rate: number } {
  if (!postalCode || postalCode.length < 2) {
    return { stateCode: 'BE', stateName: 'Berlin (Standard)', rate: 6.0 };
  }
  const prefix = postalCode.substring(0, 2);
  const stateCode = PLZ_TO_STATE[prefix];
  if (!stateCode || !GREST_BY_STATE[stateCode]) {
    return { stateCode: 'BE', stateName: 'Berlin (Standard)', rate: 6.0 };
  }
  return { stateCode, stateName: GREST_BY_STATE[stateCode].label, rate: GREST_BY_STATE[stateCode].rate };
}

/**
 * Calculate full ancillary cost breakdown for a property purchase.
 * Used by ObjektAnkaufskosten.tsx
 */
export function calcAncillaryCosts(
  purchasePrice: number,
  postalCode?: string | null,
  brokerRateOverride?: number,
  notaryRateOverride?: number,
): AncillaryCostBreakdown {
  const { stateCode, stateName, rate: grestRate } = resolveGrestFromPlz(postalCode);
  const notaryRate = notaryRateOverride ?? ANCILLARY_DEFAULTS.notaryRate;
  const brokerRate = brokerRateOverride ?? ANCILLARY_DEFAULTS.brokerRate;

  const grestAmount = purchasePrice * (grestRate / 100);
  const notaryAmount = purchasePrice * (notaryRate / 100);
  const brokerAmount = purchasePrice * (brokerRate / 100);
  const totalRate = grestRate + notaryRate + brokerRate;
  const totalAmount = grestAmount + notaryAmount + brokerAmount;

  return {
    purchasePrice, grestRate, grestAmount, notaryRate, notaryAmount,
    brokerRate, brokerAmount, totalRate, totalAmount, stateName, stateCode,
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
    if (y <= 0 || yearlyRent <= 0) {
      return { yield: y, label: `${y.toFixed(1)}%`, salesPrice: 0, profit: -netCosts };
    }
    const price = yearlyRent / (y / 100);
    const comm = price * (salesCommission / 100);
    const net = price - comm;
    const prof = net - netCosts;
    return { yield: y, label: `${y.toFixed(1)}%`, salesPrice: price, profit: prof };
  });
}

/**
 * 3×3 Alternatives Matrix: Construction costs ±10% × Sale price ±10%
 */
function calcAlternativenMatrix(
  totalConstructionCosts: number,
  baseSalePrice: number,
  totalAcquisitionCosts: number,
  totalDeveloperCosts: number,
  interestRate: number,
  equityPercent: number,
  holdingYears: number,
  disagio: number,
  yearlyRent: number,
  salesCommission: number,
  garageSaleProceeds: number,
): AlternativenMatrixCell[] {
  const deltas = [-10, 0, 10];
  const matrix: AlternativenMatrixCell[] = [];

  for (const cDelta of deltas) {
    for (const sDelta of deltas) {
      const adjConstruction = totalConstructionCosts * (1 + cDelta / 100);
      const adjSalePrice = baseSalePrice * (1 + sDelta / 100);

      const totalCostBase = totalAcquisitionCosts + adjConstruction + totalDeveloperCosts;
      const loan = totalCostBase * (1 - equityPercent / 100);
      const interest = loan * (interestRate / 100) * holdingYears;
      const rental = yearlyRent * holdingYears;
      // FIX: totalInv = pure costs (no rental deduction). Rental is on revenue side only.
      const totalInv = totalCostBase + interest + disagio;

      const commAmount = adjSalePrice * (salesCommission / 100);
      const netSale = adjSalePrice - commAmount;
      const totalRev = netSale + garageSaleProceeds + rental;
      const profit = totalRev - totalInv;
      const margin = totalRev > 0 ? (profit / totalRev) * 100 : 0;

      matrix.push({
        constructionDelta: cDelta,
        salePriceDelta: sDelta,
        constructionLabel: cDelta === 0 ? 'Plan' : `${cDelta > 0 ? '+' : ''}${cDelta}%`,
        salePriceLabel: sDelta === 0 ? 'Plan' : `${sDelta > 0 ? '+' : ''}${sDelta}%`,
        profit,
        margin,
      });
    }
  }

  return matrix;
}

// ============================================================================
// ACQ-OFFER → VALUATION SNAPSHOT BUILDER
// ============================================================================

// PROPERTY_TYPE_MAP imported from spec.ts (SSOT)

/**
 * Build a CanonicalPropertySnapshot from an acq_offers row + extracted_data.
 * Used by sot-valuation-engine to get intake data from MOD-12 offers.
 * 
 * This is a pure function — no DB, no side effects.
 */
export function buildSnapshotFromAcqOffer(offer: {
  address?: string | null;
  postal_code?: string | null;
  city?: string | null;
  area_sqm?: number | null;
  units_count?: number | null;
  year_built?: number | null;
  price_asking?: number | null;
  price_counter?: number | null;
  noi_indicated?: number | null;
  yield_indicated?: number | null;
  provider_name?: string | null;
  provider_contact?: string | null;
  extracted_data?: Record<string, any> | null;
}): Record<string, any> {
  const ed = (offer.extracted_data || {}) as Record<string, any>;
  const effectivePrice = offer.price_counter ?? offer.price_asking ?? null;

  // Derive monthly rent from NOI or yield
  let netColdRentMonthly: number | null = null;
  if (offer.noi_indicated && offer.noi_indicated > 0) {
    netColdRentMonthly = Math.round(offer.noi_indicated / 12);
  } else if (effectivePrice && offer.yield_indicated && offer.yield_indicated > 0) {
    netColdRentMonthly = Math.round((effectivePrice * (offer.yield_indicated / 100)) / 12);
  } else if (ed.monthly_rent || ed.kaltmiete || ed.net_cold_rent) {
    const rent = ed.monthly_rent ?? ed.kaltmiete ?? ed.net_cold_rent;
    netColdRentMonthly = typeof rent === 'number' ? rent : null;
  }

  // Resolve object type
  const rawType = ed.property_type ?? ed.objektart ?? ed.object_type ?? '';
  const objectType = PROPERTY_TYPE_MAP[rawType] || rawType || 'MFH';

  // Year built — from offer column or extracted
  const yearBuilt = offer.year_built ?? ed.year_built ?? ed.baujahr ?? null;

  // Area — from offer column or extracted
  const areaSqm = offer.area_sqm ?? ed.living_area_sqm ?? ed.wohnflaeche ?? null;

  // Units
  const unitsCount = offer.units_count ?? ed.units_count ?? ed.wohneinheiten ?? null;

  // Compute rent per sqm
  const rentPerSqm = netColdRentMonthly && areaSqm && areaSqm > 0
    ? Math.round((netColdRentMonthly / areaSqm) * 100) / 100
    : null;

  return {
    source_mode: 'DRAFT_INTAKE',
    address: offer.address || ed.address || ed.adresse || '',
    city: offer.city || ed.city || ed.stadt || ed.ort || '',
    postal_code: offer.postal_code || ed.postal_code || ed.plz || '',
    object_type: objectType,
    living_area_sqm: areaSqm,
    plot_area_sqm: ed.plot_area_sqm ?? ed.grundstuecksflaeche ?? null,
    rooms: ed.rooms ?? ed.zimmer ?? null,
    units_count: unitsCount,
    unit_count_actual: unitsCount,
    year_built: yearBuilt,
    condition: ed.condition ?? ed.zustand ?? null,
    energy_class: ed.energy_class ?? ed.energieklasse ?? null,
    energy_certificate_value: ed.energy_certificate_value ?? ed.energiekennwert ?? null,
    heating_type: ed.heating_type ?? ed.heizungsart ?? null,
    energy_source: ed.energy_source ?? ed.energietraeger ?? null,
    ownership_share_percent: null,
    asking_price: effectivePrice,
    purchase_price: effectivePrice,
    acquisition_costs: null,
    net_cold_rent_monthly: netColdRentMonthly,
    net_cold_rent_per_sqm: rentPerSqm,
    hausgeld_monthly: ed.hausgeld ?? ed.hausgeld_monthly ?? null,
    parking_spots: ed.parking_spaces ?? ed.stellplaetze ?? null,
    lat: ed.latitude ?? ed.lat ?? null,
    lng: ed.longitude ?? ed.lng ?? null,
    rental_status: ed.vacancy_rate != null
      ? (ed.vacancy_rate === 0 ? 'fully_rented' : 'partially_rented')
      : (netColdRentMonthly ? 'unknown_rented' : null),
    legal_title: null,
    existing_loan: null,
    mfh_multi_unit: objectType === 'MFH' && unitsCount != null && unitsCount > 1,
    units_detail: [],
    avg_unit_area: unitsCount && areaSqm && unitsCount > 1
      ? Math.round(areaSqm / unitsCount)
      : null,
    core_renovated: ed.core_renovated ?? ed.kernsaniert ?? false,
    renovation_year: ed.renovation_year ?? ed.sanierungsjahr ?? null,
    // Additional expose-derived fields
    construction_type: ed.construction_type ?? ed.bauweise ?? null,
    floor_count: ed.floor_count ?? ed.geschosse ?? ed.etagen ?? null,
    commercial_area_sqm: ed.commercial_area_sqm ?? ed.gewerbeflaeche ?? null,
    vacancy_rate: ed.vacancy_rate ?? ed.leerstandsquote ?? null,
    provider_name: offer.provider_name ?? null,
    provider_contact: offer.provider_contact ?? null,
  };
}
