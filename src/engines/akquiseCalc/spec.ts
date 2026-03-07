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
  /** Renovation / modernization costs (default 0) */
  renovationCosts?: number;
  /** Construction ancillary % on renovation costs (default 15) */
  constructionAncillaryPercent?: number;
  /** Total area in sqm for €/m² display (default 0) */
  areaSqm?: number;
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
  /** Net Operating Income (rent - management - maintenance) */
  noi?: number;
  interest: number;
  repayment: number;
  remainingDebt: number;
  propertyValue: number;
  equity: number;
}

/** Full 30-year hold result */
export interface BestandFullResult {
  totalInvestment: number;
  ancillaryCosts: number;
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
  /** Renovation + construction ancillary costs */
  totalConstructionCosts: number;
  /** Construction ancillary amount */
  constructionAncillaryCosts: number;
  /** Total investment per sqm */
  costPerSqm: number;
  /** Year 1 NOI / 12 */
  noiMonthly: number;
  /** Year 1 monthly expenses (interest + repayment + management + maintenance) */
  monthlyExpenses: number;
  /** Year 1 monthly cashflow (rent - expenses) */
  monthlyCashflow: number;
  /** Cash-on-Cash return % */
  cashOnCash: number;
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
  /** @deprecated Use granular costs instead. Kept for backward compat. */
  projectCosts: number;
  // ── Granular cost breakdown ──
  renovationCosts?: number;
  partitioningCosts?: number;
  constructionAncillaryPercent?: number;
  marketingCosts?: number;
  projectManagementCosts?: number;
  disagio?: number;
  // ── Additional data ──
  areaSqm?: number;
  garageSaleProceeds?: number;
}

/** Financing breakdown for flip projects */
export interface AufteilerFinancingBreakdown {
  loanAmountAcquisition: number;
  loanAmountConstruction: number;
  interestAcquisition: number;
  interestConstruction: number;
  disagio: number;
  rentalIncomeOffset: number;
  totalFinancingCosts: number;
}

/** 3x3 alternatives matrix cell */
export interface AlternativenMatrixCell {
  constructionDelta: number;
  salePriceDelta: number;
  constructionLabel: string;
  salePriceLabel: string;
  profit: number;
  margin: number;
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
  // ── Acquisition ──
  ancillaryCosts: number;
  totalAcquisitionCosts: number;
  // ── Construction ──
  totalConstructionCosts: number;
  constructionAncillaryCosts: number;
  // ── Developer tasks ──
  totalDeveloperCosts: number;
  // ── Financing ──
  loanAmount: number;
  equity: number;
  interestCosts: number;
  rentIncome: number;
  netCosts: number;
  financingBreakdown: AufteilerFinancingBreakdown;
  // ── Exit ──
  salesPriceGross: number;
  factor: number;
  salesCommissionAmount: number;
  salesPriceNet: number;
  garageSaleProceeds: number;
  totalRevenue: number;
  // ── Result ──
  totalInvestmentGross: number;
  profit: number;
  profitMargin: number;
  roiOnEquity: number;
  costPerSqm: number;
  // ── Sensitivity ──
  sensitivityData: AufteilerSensitivityRow[];
  alternativenMatrix: AlternativenMatrixCell[];
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
// ANKAUFSNEBENKOSTEN (Acquisition Ancillary Costs) — Types
// ============================================================================

/** Grunderwerbsteuer (GrESt) rates by German federal state */
export const GREST_BY_STATE: Record<string, { label: string; rate: number }> = {
  'BW': { label: 'Baden-Württemberg', rate: 5.0 },
  'BY': { label: 'Bayern', rate: 3.5 },
  'BE': { label: 'Berlin', rate: 6.0 },
  'BB': { label: 'Brandenburg', rate: 6.5 },
  'HB': { label: 'Bremen', rate: 5.0 },
  'HH': { label: 'Hamburg', rate: 5.5 },
  'HE': { label: 'Hessen', rate: 6.0 },
  'MV': { label: 'Mecklenburg-Vorpommern', rate: 6.0 },
  'NI': { label: 'Niedersachsen', rate: 5.0 },
  'NW': { label: 'Nordrhein-Westfalen', rate: 6.5 },
  'RP': { label: 'Rheinland-Pfalz', rate: 5.0 },
  'SL': { label: 'Saarland', rate: 6.5 },
  'SN': { label: 'Sachsen', rate: 5.5 },
  'ST': { label: 'Sachsen-Anhalt', rate: 5.0 },
  'SH': { label: 'Schleswig-Holstein', rate: 6.5 },
  'TH': { label: 'Thüringen', rate: 5.0 },
};

/** PLZ prefix → federal state code mapping (first 2 digits) */
export const PLZ_TO_STATE: Record<string, string> = {
  '01': 'SN', '02': 'SN', '03': 'BB', '04': 'SN', '06': 'ST', '07': 'TH', '08': 'SN',
  '09': 'SN', '10': 'BE', '12': 'BE', '13': 'BE', '14': 'BB', '15': 'BB', '16': 'BB',
  '17': 'MV', '18': 'MV', '19': 'MV', '20': 'HH', '21': 'NI', '22': 'HH', '23': 'SH',
  '24': 'SH', '25': 'SH', '26': 'NI', '27': 'NI', '28': 'HB', '29': 'NI', '30': 'NI',
  '31': 'NI', '32': 'NW', '33': 'NW', '34': 'HE', '35': 'HE', '36': 'HE', '37': 'NI',
  '38': 'NI', '39': 'ST', '40': 'NW', '41': 'NW', '42': 'NW', '44': 'NW', '45': 'NW',
  '46': 'NW', '47': 'NW', '48': 'NW', '49': 'NI', '50': 'NW', '51': 'NW', '52': 'NW',
  '53': 'NW', '54': 'RP', '55': 'RP', '56': 'RP', '57': 'NW', '58': 'NW', '59': 'NW',
  '60': 'HE', '61': 'HE', '63': 'HE', '64': 'HE', '65': 'HE', '66': 'SL', '67': 'RP',
  '68': 'BW', '69': 'BW', '70': 'BW', '71': 'BW', '72': 'BW', '73': 'BW', '74': 'BW',
  '75': 'BW', '76': 'BW', '77': 'BW', '78': 'BW', '79': 'BW', '80': 'BY', '81': 'BY',
  '82': 'BY', '83': 'BY', '84': 'BY', '85': 'BY', '86': 'BY', '87': 'BY', '88': 'BW',
  '89': 'BW', '90': 'BY', '91': 'BY', '92': 'BY', '93': 'BY', '94': 'BY', '95': 'BY',
  '96': 'BY', '97': 'BY', '98': 'TH', '99': 'TH',
};

/** Ancillary cost breakdown for display */
export interface AncillaryCostBreakdown {
  purchasePrice: number;
  grestRate: number;
  grestAmount: number;
  notaryRate: number;
  notaryAmount: number;
  brokerRate: number;
  brokerAmount: number;
  totalRate: number;
  totalAmount: number;
  stateName: string;
  stateCode: string;
}

/** Default ancillary cost rates (excl. GrESt which is state-dependent) */
export const ANCILLARY_DEFAULTS = {
  notaryRate: 1.5,
  brokerRate: 3.57,
} as const;

// ============================================================================
// PROPERTY TYPE MAPPING (shared SSOT for engine + edge function)
// ============================================================================

/** Canonical property type mapping from German expose labels to internal codes.
 *  Mirror maintained in supabase/functions/sot-valuation-engine/index.ts (OFFER_TYPE_MAP).
 *  Keep both in sync when adding new types.
 */
export const PROPERTY_TYPE_MAP: Record<string, string> = {
  'Mehrfamilienhaus': 'MFH', 'MFH': 'MFH', 'mfh': 'MFH',
  'Wohnhaus': 'MFH', 'Wohn- und Geschäftshaus': 'Mixed',
  'Eigentumswohnung': 'ETW', 'ETW': 'ETW', 'etw': 'ETW', 'Wohnung': 'ETW',
  'Einfamilienhaus': 'EFH', 'EFH': 'EFH', 'efh': 'EFH',
  'Doppelhaushälfte': 'DHH', 'DHH': 'DHH', 'dhh': 'DHH', 'Reihenhaus': 'DHH',
  'Gewerbe': 'Gewerbe', 'Büro': 'Gewerbe', 'Laden': 'Gewerbe',
  'Mixed': 'Mixed', 'mixed': 'Mixed', 'Gemischt': 'Mixed',
};

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
