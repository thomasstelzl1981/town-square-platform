/**
 * ENG-VALUATION — SoT Valuation Engine V5.0
 * 
 * ENGINE FILE: Pure deterministic functions (NO side effects, NO DB calls, NO UI imports)
 * 
 * All functions are pure TypeScript — given the same inputs, they produce the same outputs.
 * KI-Extraktion, Normalisierung, Narrative and Report-Text are handled by the Edge Function
 * orchestrator (sot-valuation-engine), NOT here.
 * 
 * @version 1.0.0
 */

import type {
  CanonicalPropertySnapshot,
  ErtragswertParams,
  ErtragswertResult,
  ValuationMethodResult,
  ValueBand,
  WeightingEntry,
  FinancingScenarioConfig,
  FinancingScenario,
  StressTestConfig,
  StressTestResult,
  LienProxy,
  LienProxyRiskDriver,
  DebtServiceResult,
  SensitivityMatrix,
  SensitivityVariation,
  PlausibilityWarning,
  DataQuality,
  EvidenceEntry,
  CompStats,
  TrafficLight,
  ConfidenceLevel,
} from './spec';

import {
  BEWIRTSCHAFTUNG_DEFAULTS,
  HERSTELLKOSTEN_CLUSTERS,
  DEFAULT_FINANCING_SCENARIOS,
  DEFAULT_STRESS_TESTS,
} from './spec';

// ============================================================================
// ERTRAGSWERT (Capitalized Earnings Method)
// ============================================================================

/**
 * Calculate Ertragswert (capitalized earnings value) from rental income.
 * This is the PRIMARY deterministic valuation method.
 */
export function calculateErtragswert(params: ErtragswertParams): ErtragswertResult {
  const {
    netColdRentYearly,
    verwaltungPercent,
    instandhaltungYearly,
    mietausfallPercent,
    nichtUmlagefaehigPercent,
    bodenwertProxy,
    liegenschaftszins,
    restnutzungsdauer,
  } = params;

  const rohertrag = netColdRentYearly;
  
  // Bewirtschaftungskosten
  const verwaltung = rohertrag * verwaltungPercent;
  const mietausfall = rohertrag * mietausfallPercent;
  const nichtUmlagefaehig = rohertrag * nichtUmlagefaehigPercent;
  const bewirtschaftungAbzug = verwaltung + instandhaltungYearly + mietausfall + nichtUmlagefaehig;
  
  const reinertrag = rohertrag - bewirtschaftungAbzug;
  
  // Reinertragsanteil Boden abziehen
  const bodenertrag = bodenwertProxy * liegenschaftszins;
  const reinertragsanteilGebaeude = reinertrag - bodenertrag;
  
  // Vervielfältiger (Barwertfaktor der Restnutzungsdauer)
  const barwertfaktor = restnutzungsdauer > 0 && liegenschaftszins > 0
    ? (1 - Math.pow(1 + liegenschaftszins, -restnutzungsdauer)) / liegenschaftszins
    : 0;
  
  const ertragswertGebaeude = reinertragsanteilGebaeude * barwertfaktor;
  const ertragswertGesamt = Math.max(0, ertragswertGebaeude + bodenwertProxy);

  return {
    rohertrag,
    bewirtschaftungAbzug,
    reinertrag,
    barwertfaktor: Math.round(barwertfaktor * 100) / 100,
    ertragswertGebaeude: Math.round(ertragswertGebaeude),
    bodenwertProxy: Math.round(bodenwertProxy),
    ertragswertGesamt: Math.round(ertragswertGesamt),
  };
}

/**
 * Derive Ertragswert params from a canonical snapshot + assumptions.
 */
export function deriveErtragswertParams(
  snapshot: CanonicalPropertySnapshot,
  assumptions: { liegenschaftszins?: number; bodenwertPerSqm?: number; restnutzungsdauer?: number } = {}
): ErtragswertParams | null {
  const rent = snapshot.netColdRentMonthly;
  if (!rent || rent <= 0) return null;

  const area = snapshot.livingAreaSqm || snapshot.usableAreaSqm || 0;
  const yearBuilt = snapshot.yearBuilt || 1980;
  const age = new Date().getFullYear() - yearBuilt;
  
  const restnutzungsdauer = assumptions.restnutzungsdauer || Math.max(10, 80 - age);
  const liegenschaftszins = assumptions.liegenschaftszins || 0.05;
  const bodenwertPerSqm = assumptions.bodenwertPerSqm || 150;
  const plotArea = snapshot.plotAreaSqm || area * 0.5;

  return {
    netColdRentYearly: rent * 12,
    verwaltungPercent: BEWIRTSCHAFTUNG_DEFAULTS.verwaltungPercent,
    instandhaltungYearly: area * BEWIRTSCHAFTUNG_DEFAULTS.instandhaltungPerSqmYear,
    mietausfallPercent: BEWIRTSCHAFTUNG_DEFAULTS.mietausfallPercent,
    nichtUmlagefaehigPercent: BEWIRTSCHAFTUNG_DEFAULTS.nichtUmlagefaehigPercent,
    bodenwertProxy: plotArea * bodenwertPerSqm,
    liegenschaftszins,
    restnutzungsdauer,
  };
}

// ============================================================================
// COMP PROXY (Comparison Value from Portal Listings)
// ============================================================================

/**
 * Calculate a comparison value proxy from deduplicated portal listings stats.
 * Applies simple adjustments based on property characteristics.
 */
export function calculateCompProxy(
  compStats: CompStats,
  snapshot: CanonicalPropertySnapshot,
  adjusters: { lageAdjust?: number; zustandAdjust?: number; flächeAdjust?: number } = {}
): ValuationMethodResult {
  if (compStats.dedupedCount < 3) {
    return {
      method: 'comp_proxy',
      value: 0,
      confidence: 'low',
      confidenceScore: 0.2,
      params: { reason: 'insufficient_comps', count: compStats.dedupedCount },
      notes: ['Zu wenige Vergleichsangebote für belastbare Aussage'],
    };
  }

  const area = snapshot.livingAreaSqm || snapshot.usableAreaSqm || 80;
  const basePriceSqm = compStats.p50PriceSqm;
  
  // Apply adjustments (each is a multiplier delta, e.g. +0.05 = +5%)
  const lageAdj = adjusters.lageAdjust || 0;
  const zustandAdj = adjusters.zustandAdjust || 0;
  const flächeAdj = adjusters.flächeAdjust || 0;
  const totalAdj = 1 + lageAdj + zustandAdj + flächeAdj;
  
  const adjustedPriceSqm = basePriceSqm * totalAdj;
  const value = Math.round(adjustedPriceSqm * area);
  
  // Confidence based on sample size + IQR
  const cvScore = compStats.stdDevPriceSqm > 0 
    ? 1 - Math.min(1, compStats.stdDevPriceSqm / compStats.meanPriceSqm)
    : 0.5;
  const countScore = Math.min(1, compStats.dedupedCount / 15);
  const confidenceScore = (cvScore * 0.6 + countScore * 0.4);
  
  const confidence: ConfidenceLevel = confidenceScore > 0.7 ? 'high' : confidenceScore > 0.4 ? 'medium' : 'low';

  return {
    method: 'comp_proxy',
    value,
    confidence,
    confidenceScore: Math.round(confidenceScore * 100) / 100,
    params: {
      basePriceSqm: Math.round(basePriceSqm),
      adjustedPriceSqm: Math.round(adjustedPriceSqm),
      area,
      compsUsed: compStats.dedupedCount,
      lageAdj,
      zustandAdj,
      flächeAdj,
    },
    notes: [
      `Basierend auf ${compStats.dedupedCount} Angeboten (Median €${Math.round(basePriceSqm)}/m²)`,
      'Angebotsdaten, keine Transaktionspreise',
    ],
  };
}

// ============================================================================
// SACHWERT PROXY (Replacement Cost Plausibility)
// ============================================================================

/**
 * Calculate a simplified Sachwert (replacement cost) proxy for plausibility.
 */
export function calculateSachwertProxy(snapshot: CanonicalPropertySnapshot): ValuationMethodResult {
  const area = snapshot.livingAreaSqm || snapshot.usableAreaSqm || 0;
  const yearBuilt = snapshot.yearBuilt || 1980;
  
  if (area <= 0) {
    return {
      method: 'sachwert_proxy',
      value: 0,
      confidence: 'low',
      confidenceScore: 0.1,
      params: { reason: 'no_area' },
      notes: ['Keine Fläche vorhanden für Sachwertberechnung'],
    };
  }
  
  // Determine cost cluster
  let cluster: string;
  if (yearBuilt < 1950) cluster = 'pre_1950';
  else if (yearBuilt < 1970) cluster = '1950_1970';
  else if (yearBuilt < 1990) cluster = '1970_1990';
  else if (yearBuilt < 2010) cluster = '1990_2010';
  else cluster = 'post_2010';
  
  const herstellkostenPerSqm = HERSTELLKOSTEN_CLUSTERS[cluster];
  const age = new Date().getFullYear() - yearBuilt;
  const alterswertminderung = Math.min(0.70, age * 0.01); // max 70% depreciation
  
  const herstellkostenGesamt = area * herstellkostenPerSqm;
  const nachAbschreibung = herstellkostenGesamt * (1 - alterswertminderung);
  
  // Bodenwert proxy
  const plotArea = snapshot.plotAreaSqm || area * 0.5;
  const bodenwertProxy = plotArea * 150; // conservative default
  
  const value = Math.round(nachAbschreibung + bodenwertProxy);

  return {
    method: 'sachwert_proxy',
    value,
    confidence: 'low',
    confidenceScore: 0.35,
    params: {
      herstellkostenPerSqm,
      cluster,
      alterswertminderung: Math.round(alterswertminderung * 100),
      herstellkostenGesamt: Math.round(herstellkostenGesamt),
      nachAbschreibung: Math.round(nachAbschreibung),
      bodenwertProxy: Math.round(bodenwertProxy),
    },
    notes: [
      'Vereinfachter Sachwert als Plausibilitäts-Check',
      `Herstellkosten ${herstellkostenPerSqm} €/m² (Cluster: ${cluster})`,
      `Alterswertminderung: ${Math.round(alterswertminderung * 100)}%`,
    ],
  };
}

// ============================================================================
// VALUE BAND FUSION
// ============================================================================

/**
 * Fuse multiple valuation methods into a weighted value band (P25/P50/P75).
 */
export function fuseValueBand(methods: ValuationMethodResult[], customWeights?: Partial<Record<string, number>>): ValueBand {
  const validMethods = methods.filter(m => m.value > 0 && m.confidenceScore > 0.15);
  
  if (validMethods.length === 0) {
    return {
      p25: 0, p50: 0, p75: 0,
      confidence: 'low',
      confidenceScore: 0,
      weightingTable: [],
      reasoning: 'Keine validen Bewertungsmethoden verfügbar',
    };
  }
  
  // Default weights by method
  const defaultWeights: Record<string, number> = {
    ertrag: 0.55,
    comp_proxy: 0.35,
    sachwert_proxy: 0.10,
  };
  
  // Apply custom weights or defaults
  const weights = validMethods.map(m => ({
    method: m.method,
    weight: customWeights?.[m.method] ?? defaultWeights[m.method] ?? 0.1,
    value: m.value,
    confidence: m.confidence,
    confidenceScore: m.confidenceScore,
  }));
  
  // Normalize weights
  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  weights.forEach(w => { w.weight = w.weight / totalWeight; });
  
  // Weighted average = P50
  const p50 = Math.round(weights.reduce((sum, w) => sum + w.value * w.weight, 0));
  
  // P25/P75 from spread of values
  const allValues = validMethods.map(m => m.value).sort((a, b) => a - b);
  const spread = allValues.length > 1
    ? (allValues[allValues.length - 1] - allValues[0]) / p50
    : 0.15; // default 15% spread if single method
  
  const halfSpread = Math.max(0.05, Math.min(0.20, spread / 2));
  const p25 = Math.round(p50 * (1 - halfSpread));
  const p75 = Math.round(p50 * (1 + halfSpread));
  
  // Overall confidence
  const avgConfidence = weights.reduce((sum, w) => sum + w.confidenceScore * w.weight, 0);
  const confidence: ConfidenceLevel = avgConfidence > 0.65 ? 'high' : avgConfidence > 0.4 ? 'medium' : 'low';

  const weightingTable: WeightingEntry[] = weights.map(w => ({
    method: w.method as any,
    weight: Math.round(w.weight * 100) / 100,
    value: w.value,
    confidence: w.confidence,
  }));

  return {
    p25,
    p50,
    p75,
    confidence,
    confidenceScore: Math.round(avgConfidence * 100) / 100,
    weightingTable,
    reasoning: `Gewichtetes Wertband aus ${validMethods.length} Verfahren`,
  };
}

// ============================================================================
// FINANCING SCENARIOS
// ============================================================================

/**
 * Calculate financing scenarios for a given property price.
 */
export function calculateFinancingScenarios(
  price: number,
  configs: FinancingScenarioConfig[] = DEFAULT_FINANCING_SCENARIOS as unknown as FinancingScenarioConfig[],
  annualNetRent: number | null = null
): FinancingScenario[] {
  return configs.map(cfg => {
    const loanAmount = Math.round(price * cfg.ltv);
    const equity = price - loanAmount;
    const annualRate = cfg.interestRate + cfg.repaymentRate;
    const monthlyRate = Math.round(loanAmount * annualRate / 12);
    const annualDebtService = monthlyRate * 12;
    
    const cashflowAfterDebt = annualNetRent !== null
      ? Math.round(annualNetRent - annualDebtService)
      : null;
    
    let trafficLight: TrafficLight = 'green';
    if (cashflowAfterDebt !== null) {
      if (cashflowAfterDebt < 0) trafficLight = 'red';
      else if (cashflowAfterDebt < annualDebtService * 0.1) trafficLight = 'yellow';
    } else {
      trafficLight = cfg.ltv > 0.85 ? 'red' : cfg.ltv > 0.75 ? 'yellow' : 'green';
    }

    return {
      name: cfg.name,
      ltv: cfg.ltv,
      loanAmount,
      equity,
      interestRate: cfg.interestRate,
      repaymentRate: cfg.repaymentRate,
      monthlyRate,
      annualDebtService,
      cashflowAfterDebt,
      trafficLight,
    };
  });
}

// ============================================================================
// STRESS TESTS
// ============================================================================

/**
 * Run stress test scenarios against a base financing scenario.
 */
export function calculateStressTests(
  baseScenario: FinancingScenario,
  stresses: StressTestConfig[] = DEFAULT_STRESS_TESTS as unknown as StressTestConfig[],
  annualNetRent: number | null = null
): StressTestResult[] {
  return stresses.map(stress => {
    const stressedInterest = baseScenario.interestRate + stress.interestDelta;
    const annualRate = stressedInterest + baseScenario.repaymentRate;
    const monthlyRate = Math.round(baseScenario.loanAmount * annualRate / 12);
    const annualDebtService = monthlyRate * 12;
    
    const stressedRent = annualNetRent !== null
      ? annualNetRent * (1 + stress.rentDelta)
      : null;
    
    const cashflowAfterDebt = stressedRent !== null
      ? Math.round(stressedRent - annualDebtService)
      : null;
    
    const dscr = stressedRent !== null && annualDebtService > 0
      ? Math.round((stressedRent / annualDebtService) * 100) / 100
      : null;
    
    let trafficLight: TrafficLight = 'green';
    if (dscr !== null) {
      if (dscr < 1.0) trafficLight = 'red';
      else if (dscr < 1.2) trafficLight = 'yellow';
    } else if (cashflowAfterDebt !== null && cashflowAfterDebt < 0) {
      trafficLight = 'red';
    }

    return {
      label: stress.label,
      monthlyRate,
      annualDebtService,
      cashflowAfterDebt,
      dscr,
      trafficLight,
    };
  });
}

// ============================================================================
// LIEN PROXY (BELEIHUNGSWERT)
// ============================================================================

/**
 * Calculate SoT Lien Proxy (conservative valuation for LTV estimation).
 * NOT a bank Beleihungswert — clearly labeled as proxy.
 */
export function calculateLienProxy(
  valueBand: ValueBand,
  dataQuality: DataQuality,
  locationScore: number // 0–100
): LienProxy {
  const riskDrivers: LienProxyRiskDriver[] = [];
  let totalDiscount = 0;
  
  // Data quality discount
  if (dataQuality.completenessPercent < 60) {
    const disc = 0.10;
    riskDrivers.push({ factor: 'Datenlücken', discountPercent: disc * 100, reasoning: `Completeness nur ${dataQuality.completenessPercent}%` });
    totalDiscount += disc;
  } else if (dataQuality.completenessPercent < 80) {
    const disc = 0.05;
    riskDrivers.push({ factor: 'Datenlücken (gering)', discountPercent: disc * 100, reasoning: `Completeness ${dataQuality.completenessPercent}%` });
    totalDiscount += disc;
  }
  
  // Location risk
  if (locationScore < 40) {
    const disc = 0.08;
    riskDrivers.push({ factor: 'Standort-Risiko', discountPercent: disc * 100, reasoning: `Standort-Score nur ${locationScore}/100` });
    totalDiscount += disc;
  } else if (locationScore < 60) {
    const disc = 0.04;
    riskDrivers.push({ factor: 'Standort (durchschnittlich)', discountPercent: disc * 100, reasoning: `Standort-Score ${locationScore}/100` });
    totalDiscount += disc;
  }
  
  // Confidence discount
  if (valueBand.confidenceScore < 0.4) {
    const disc = 0.08;
    riskDrivers.push({ factor: 'Niedrige Bewertungs-Confidence', discountPercent: disc * 100, reasoning: `Confidence Score ${valueBand.confidenceScore}` });
    totalDiscount += disc;
  }
  
  // Base safety margin
  const baseSafetyMargin = 0.10;
  riskDrivers.push({ factor: 'Sicherheitsabschlag (Basis)', discountPercent: baseSafetyMargin * 100, reasoning: 'Standard-Sicherheitsabschlag für Proxy' });
  totalDiscount += baseSafetyMargin;
  
  totalDiscount = Math.min(totalDiscount, 0.40); // cap at 40%
  
  const lienValueHigh = Math.round(valueBand.p50 * (1 - totalDiscount));
  const lienValueLow = Math.round(valueBand.p25 * (1 - totalDiscount));
  
  const safeLtvHigh = Math.min(0.80, 0.70 - (totalDiscount - baseSafetyMargin) * 0.5);
  const safeLtvLow = Math.max(0.40, safeLtvHigh - 0.15);

  return {
    marketValueP50: valueBand.p50,
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    lienValueLow,
    lienValueHigh,
    safeLtvWindow: [Math.round(safeLtvLow * 100) / 100, Math.round(safeLtvHigh * 100) / 100],
    riskDrivers,
  };
}

// ============================================================================
// DEBT SERVICE (DSCR)
// ============================================================================

/**
 * Calculate Debt Service Coverage Ratio and break-even rent.
 */
export function calculateDSCR(
  annualNetRent: number | null,
  annualDebtService: number
): DebtServiceResult {
  if (annualNetRent === null || annualNetRent <= 0) {
    return {
      dscr: null,
      breakEvenRentMonthly: annualDebtService > 0 ? Math.round(annualDebtService * 1.1 / 12) : null,
      isViable: null,
      cashflowAfterDebt: null,
      notes: ['Keine Mietdaten vorhanden — DSCR kann nicht berechnet werden'],
    };
  }
  
  const dscr = annualDebtService > 0 
    ? Math.round((annualNetRent / annualDebtService) * 100) / 100
    : null;
  
  const cashflowAfterDebt = Math.round(annualNetRent - annualDebtService);
  const breakEvenRentMonthly = annualDebtService > 0 
    ? Math.round(annualDebtService * 1.1 / 12) // 1.1x for DSCR=1.1
    : null;
  
  const isViable = dscr !== null ? dscr >= 1.1 : null;
  
  const notes: string[] = [];
  if (dscr !== null) {
    if (dscr >= 1.3) notes.push('DSCR ≥ 1.3 — komfortable Deckung');
    else if (dscr >= 1.1) notes.push('DSCR ≥ 1.1 — ausreichende Deckung');
    else if (dscr >= 1.0) notes.push('DSCR ≥ 1.0 — knappe Deckung, kein Puffer');
    else notes.push('DSCR < 1.0 — Schuldendienst übersteigt Mieteinnahmen');
  }

  return { dscr, breakEvenRentMonthly, isViable, cashflowAfterDebt, notes };
}

// ============================================================================
// SENSITIVITY ANALYSIS
// ============================================================================

/**
 * Calculate sensitivity variations for a base value.
 */
export function calculateSensitivity(
  baseP50: number,
  snapshot: CanonicalPropertySnapshot,
  compStats: CompStats | null
): SensitivityMatrix {
  const variations: SensitivityVariation[] = [];
  
  // Rent sensitivity ±10%
  if (snapshot.netColdRentMonthly) {
    const rentUp = snapshot.netColdRentMonthly * 1.10;
    const rentDown = snapshot.netColdRentMonthly * 0.90;
    // Rough: 1% rent change ≈ 1% value change for Ertragswert
    variations.push({
      parameter: 'Miete +10%',
      delta: 0.10,
      resultingValue: Math.round(baseP50 * 1.10),
      deltaFromBase: Math.round(baseP50 * 0.10),
    });
    variations.push({
      parameter: 'Miete -10%',
      delta: -0.10,
      resultingValue: Math.round(baseP50 * 0.90),
      deltaFromBase: Math.round(baseP50 * -0.10),
    });
  }
  
  // CapEx sensitivity ±20% (impacts via Bewirtschaftung)
  variations.push({
    parameter: 'Instandhaltung +20%',
    delta: 0.20,
    resultingValue: Math.round(baseP50 * 0.97), // ~3% impact
    deltaFromBase: Math.round(baseP50 * -0.03),
  });
  
  // Interest rate sensitivity
  variations.push({
    parameter: 'Zins +2%',
    delta: 0.02,
    resultingValue: Math.round(baseP50 * 0.92), // ~8% impact via Ertragswert
    deltaFromBase: Math.round(baseP50 * -0.08),
  });
  
  // Vacancy sensitivity
  variations.push({
    parameter: 'Leerstand +5%',
    delta: 0.05,
    resultingValue: Math.round(baseP50 * 0.95),
    deltaFromBase: Math.round(baseP50 * -0.05),
  });

  return { baseValue: baseP50, variations };
}

// ============================================================================
// NORMALIZATION & PLAUSIBILITY
// ============================================================================

/**
 * Normalize raw extracted fields into a canonical property snapshot.
 */
export function normalizeSnapshot(raw: Partial<CanonicalPropertySnapshot>): CanonicalPropertySnapshot {
  return {
    address: raw.address || '',
    postalCode: raw.postalCode || '',
    city: raw.city || '',
    lat: raw.lat,
    lng: raw.lng,
    objectType: raw.objectType || 'other',
    livingAreaSqm: raw.livingAreaSqm ?? null,
    plotAreaSqm: raw.plotAreaSqm ?? null,
    usableAreaSqm: raw.usableAreaSqm ?? null,
    commercialAreaSqm: raw.commercialAreaSqm ?? null,
    rooms: raw.rooms ?? null,
    units: raw.units ?? null,
    floors: raw.floors ?? null,
    parkingSpots: raw.parkingSpots ?? null,
    yearBuilt: raw.yearBuilt ?? null,
    condition: raw.condition ?? null,
    energyClass: raw.energyClass ?? null,
    modernizations: raw.modernizations || [],
    askingPrice: raw.askingPrice ?? null,
    netColdRentMonthly: raw.netColdRentMonthly ?? null,
    netColdRentPerSqm: raw.netColdRentPerSqm ?? null,
    hausgeldMonthly: raw.hausgeldMonthly ?? null,
    vacancyRate: raw.vacancyRate ?? null,
    rentalStatus: raw.rentalStatus ?? null,
    groundBookEntry: raw.groundBookEntry ?? null,
    partitionDeclaration: raw.partitionDeclaration ?? null,
    providerName: raw.providerName ?? null,
    providerContact: raw.providerContact ?? null,
  };
}

/**
 * Run plausibility checks on a canonical snapshot.
 */
export function runPlausibilityChecks(snapshot: CanonicalPropertySnapshot): PlausibilityWarning[] {
  const warnings: PlausibilityWarning[] = [];
  
  // Price per sqm check
  if (snapshot.askingPrice && snapshot.livingAreaSqm) {
    const priceSqm = snapshot.askingPrice / snapshot.livingAreaSqm;
    if (priceSqm < 500) {
      warnings.push({ field: 'askingPrice', severity: 'warning', message: `€/m² sehr niedrig (${Math.round(priceSqm)} €/m²)` });
    }
    if (priceSqm > 15000) {
      warnings.push({ field: 'askingPrice', severity: 'warning', message: `€/m² sehr hoch (${Math.round(priceSqm)} €/m²)` });
    }
  }
  
  // Rent per sqm check
  if (snapshot.netColdRentPerSqm) {
    if (snapshot.netColdRentPerSqm < 3) {
      warnings.push({ field: 'netColdRentPerSqm', severity: 'warning', message: `Miete sehr niedrig (${snapshot.netColdRentPerSqm} €/m²)` });
    }
    if (snapshot.netColdRentPerSqm > 25) {
      warnings.push({ field: 'netColdRentPerSqm', severity: 'warning', message: `Miete sehr hoch (${snapshot.netColdRentPerSqm} €/m²)` });
    }
  }
  
  // Year built plausibility
  if (snapshot.yearBuilt) {
    const currentYear = new Date().getFullYear();
    if (snapshot.yearBuilt < 1800 || snapshot.yearBuilt > currentYear + 2) {
      warnings.push({ field: 'yearBuilt', severity: 'error', message: `Baujahr unplausibel: ${snapshot.yearBuilt}` });
    }
  }
  
  // Area consistency
  if (snapshot.livingAreaSqm && snapshot.usableAreaSqm && snapshot.usableAreaSqm < snapshot.livingAreaSqm) {
    warnings.push({ field: 'usableAreaSqm', severity: 'warning', message: 'Nutzfläche < Wohnfläche — prüfen' });
  }
  
  // Rent vs Area consistency
  if (snapshot.netColdRentMonthly && snapshot.livingAreaSqm) {
    const derivedPerSqm = snapshot.netColdRentMonthly / snapshot.livingAreaSqm;
    if (snapshot.netColdRentPerSqm && Math.abs(derivedPerSqm - snapshot.netColdRentPerSqm) > 2) {
      warnings.push({ field: 'netColdRentPerSqm', severity: 'warning', message: 'Miete/m² stimmt nicht mit Gesamtmiete/Fläche überein' });
    }
  }

  return warnings;
}

/**
 * Score overall data quality from evidence entries.
 */
export function scoreDataQuality(
  snapshot: CanonicalPropertySnapshot,
  evidence: EvidenceEntry[]
): DataQuality {
  const criticalFields = [
    'address', 'objectType', 'livingAreaSqm', 'askingPrice', 'yearBuilt',
  ];
  const importantFields = [
    'netColdRentMonthly', 'rooms', 'units', 'plotAreaSqm', 'condition',
    'rentalStatus', 'hausgeldMonthly',
  ];
  
  const allFields = [...criticalFields, ...importantFields];
  
  let verified = 0;
  let derived = 0;
  let missing = 0;
  let criticalGaps = 0;
  
  for (const field of allFields) {
    const val = (snapshot as any)[field];
    const ev = evidence.find(e => e.field === field);
    
    if (val === null || val === undefined || val === '') {
      missing++;
      if (criticalFields.includes(field)) criticalGaps++;
    } else if (ev && (ev.confidence === 'verified' || ev.confidence === 'extracted')) {
      verified++;
    } else {
      derived++;
    }
  }
  
  const completenessPercent = Math.round(((allFields.length - missing) / allFields.length) * 100);
  const globalConfidenceScore = Math.max(0, Math.min(1, 
    (completenessPercent / 100) * 0.5 + 
    (verified / Math.max(1, allFields.length)) * 0.3 +
    (criticalGaps === 0 ? 0.2 : 0)
  ));
  
  const globalConfidence: ConfidenceLevel = globalConfidenceScore > 0.7 ? 'high' : globalConfidenceScore > 0.4 ? 'medium' : 'low';

  return {
    completenessPercent,
    criticalGaps,
    fieldsVerified: verified,
    fieldsDerived: derived,
    fieldsMissing: missing,
    globalConfidence,
    globalConfidenceScore: Math.round(globalConfidenceScore * 100) / 100,
  };
}
