/**
 * Akquise-Kalkulations-Engine — Typen & Konstanten (SSOT)
 * 
 * Alle Berechnungstypen für Bestand (Hold) und Aufteiler (Flip)
 * werden hier zentral definiert. Keine UI-Abhängigkeiten.
 */

// ============================================================================
// BESTAND (HOLD) — Types
// ============================================================================

/** Full parameter set for 30-year hold projection */
export interface BestandFullParams {
  purchasePrice: number;
  monthlyRent: number;
  equityPercent: number;
  interestRate: number;
  repaymentRate: number;
  rentIncreaseRate: number;
  valueIncreaseRate: number;
  managementCostPercent: number;
  maintenancePercent: number;
  ancillaryCostPercent: number;
}

/** Quick KPI parameter set (fewer inputs) */
export interface BestandQuickParams {
  purchasePrice: number;
  monthlyRent: number;
  equity?: number;
  interestRate?: number;
  repaymentRate?: number;
  managementCostPercent?: number;
  ancillaryCostPercent?: number;
}

/** Per-year row in the 30-year projection */
export interface BestandYearlyData {
  year: number;
  rent: number;
  interest: number;
  repayment: number;
  remainingDebt: number;
  propertyValue: number;
  equity: number;
}

/** Full 30-year hold result */
export interface BestandFullResult {
  totalInvestment: number;
  equity: number;
  loanAmount: number;
  yearlyAnnuity: number;
  monthlyRate: number;
  grossYield: number;
  maxFinancing: number;
  yearlyData: BestandYearlyData[];
  fullRepaymentYear: number;
  totalInterest: number;
  totalRepayment: number;
  value10: number;
  value20: number;
  debt10: number;
  debt20: number;
  wealth10: number;
  wealth20: number;
  value40: number;
  wealthGrowth: number;
  roi: number;
}

/** Quick KPI result */
export interface BestandQuickResult {
  purchasePrice: number;
  totalInvestment: number;
  equity: number;
  loanAmount: number;
  yearlyRent: number;
  noi: number;
  grossYield: number;
  netYield: number;
  monthlyCashflow: number;
  ltv: number;
  dscr: number;
  cashOnCash: number;
  multiplier: number;
}

// ============================================================================
// AUFTEILER (FLIP) — Types
// ============================================================================

/** Full parameter set for yield-based flip calc */
export interface AufteilerFullParams {
  purchasePrice: number;
  yearlyRent: number;
  targetYield: number;
  salesCommission: number;
  holdingPeriodMonths: number;
  ancillaryCostPercent: number;
  interestRate: number;
  equityPercent: number;
  projectCosts: number;
}

/** Sensitivity row */
export interface AufteilerSensitivityRow {
  yield: number;
  label: string;
  salesPrice: number;
  profit: number;
}

/** Full flip result */
export interface AufteilerFullResult {
  ancillaryCosts: number;
  totalAcquisitionCosts: number;
  loanAmount: number;
  equity: number;
  interestCosts: number;
  rentIncome: number;
  netCosts: number;
  salesPriceGross: number;
  factor: number;
  salesCommissionAmount: number;
  salesPriceNet: number;
  profit: number;
  profitMargin: number;
  roiOnEquity: number;
  sensitivityData: AufteilerSensitivityRow[];
}

/** Quick unit-based flip params */
export interface AufteilerQuickParams {
  purchasePrice: number;
  unitsCount: number;
  avgUnitSalePrice: number;
  renovationCostPerUnit?: number;
  salesCommissionPercent?: number;
  holdingPeriodMonths?: number;
  ancillaryCostPercent?: number;
}

/** Quick unit-based flip result */
export interface AufteilerQuickResult {
  purchasePrice: number;
  unitsCount: number;
  totalSaleProceeds: number;
  totalCosts: number;
  grossProfit: number;
  profitMarginPercent: number;
  annualizedReturn: number;
  pricePerUnit: number;
  profitPerUnit: number;
  holdingPeriodMonths: number;
}

/** Project-specific flip params (uses total values instead of per-unit) */
export interface AufteilerProjectParams {
  purchasePrice: number;
  renovationBudget: number;
  targetYield: number;
  salesCommission: number;
  holdingPeriodMonths: number;
  ancillaryCostPercent: number;
  interestRate: number;
  equityPercent: number;
  totalListPrice: number;
  totalYearlyRent: number;
  unitsCount: number;
}

/** Project flip result */
export interface AufteilerProjectResult extends AufteilerFullResult {
  profitPerUnit: number;
  breakEvenUnits: number;
}

// ============================================================================
// DEFAULTS
// ============================================================================

export const BESTAND_DEFAULTS = {
  equityPercent: 20,
  interestRate: 4.0,
  repaymentRate: 2.0,
  rentIncreaseRate: 2.0,
  valueIncreaseRate: 2.0,
  managementCostPercent: 25,
  maintenancePercent: 1.0,
  ancillaryCostPercent: 10,
  projectionYears: 30,
  longTermYears: 40,
} as const;

export const AUFTEILER_DEFAULTS = {
  targetYield: 4.0,
  salesCommission: 8.0,
  holdingPeriodMonths: 24,
  ancillaryCostPercent: 10,
  interestRate: 5.0,
  equityPercent: 30,
  quickSalesCommissionPercent: 3,
} as const;
