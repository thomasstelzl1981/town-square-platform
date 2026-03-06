/**
 * ENG-VALUATION — SoT Valuation Engine V6.0
 * 
 * ENGINE FILE: Pure deterministic functions (NO side effects, NO DB calls, NO UI imports)
 * 
 * All functions are pure TypeScript — given the same inputs, they produce the same outputs.
 * KI-Extraktion, Normalisierung, Narrative and Report-Text are handled by the Edge Function
 * orchestrator (sot-valuation-engine), NOT here.
 * 
 * V6.0: Added SSOT snapshot builder, merge/diff logic, legal title extraction
 * 
 * @version 2.0.0
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
  SSOTPropertyData,
  LegalTitleBlock,
  ExistingLoanData,
  DiffEntry,
  ValuationSourceMode,
} from './spec';

import {
  BEWIRTSCHAFTUNG_DEFAULTS,
  HERSTELLKOSTEN_CLUSTERS,
  BPI_FACTOR,
  LIEGENSCHAFTSZINS_BY_TYPE,
  GESAMTNUTZUNGSDAUER_BY_TYPE,
  PLOT_AREA_HEURISTIC_BY_TYPE,
  BODENRICHTWERT_STUFEN,
  BODENRICHTWERT_FLOOR,
  DEFAULT_FINANCING_SCENARIOS,
  DEFAULT_STRESS_TESTS,
} from './spec';

// ============================================================================
// V6.0: SSOT SNAPSHOT BUILDER
// ============================================================================

/**
 * Build a CanonicalPropertySnapshot from structured SSOT data (MOD-04 tables).
 * This is the PRIMARY data source in SSOT_FINAL mode.
 */
export function buildSnapshotFromSSOT(data: SSOTPropertyData): CanonicalPropertySnapshot {
  const { property, units, leases, loans } = data;

  // Aggregate unit data
  const totalAreaSqm = units.reduce((sum, u) => sum + (u.area_sqm || 0), 0) || property.total_area_sqm || null;
  const totalRooms = units.reduce((sum, u) => sum + (u.rooms || 0), 0) || null;
  const totalHausgeld = units.reduce((sum, u) => sum + (u.hausgeld_monthly || 0), 0) || null;
  const totalParkingSpots = units.reduce((sum, u) => sum + (u.parking_count || 0), 0) || null;
  const totalMeaShare = units.length === 1 ? units[0].mea_share : null;

  // Aggregate lease data for rent
  const activeLeases = leases.filter(l => l.status === 'active' || l.status === 'aktiv');
  const totalNetColdRent = activeLeases.reduce((sum, l) => sum + (l.rent_cold_eur || 0), 0) || null;
  const netColdRentPerSqm = totalNetColdRent && totalAreaSqm ? Math.round((totalNetColdRent / totalAreaSqm) * 100) / 100 : null;

  // Determine rental status
  let rentalStatus: CanonicalPropertySnapshot['rentalStatus'] = null;
  if (activeLeases.length > 0 && units.length > 0) {
    rentalStatus = activeLeases.length >= units.length ? 'fully_rented' : 'partially_rented';
  }

  // Map condition
  const conditionMap: Record<string, CanonicalPropertySnapshot['condition']> = {
    'neu': 'new', 'new': 'new',
    'renoviert': 'renovated', 'renovated': 'renovated',
    'gut': 'good', 'good': 'good',
    'mittel': 'average', 'average': 'average',
    'schlecht': 'poor', 'poor': 'poor',
    'sanierungsbedürftig': 'derelict', 'derelict': 'derelict',
  };

  // Map object type
  const typeMap: Record<string, CanonicalPropertySnapshot['objectType']> = {
    'ETW': 'etw', 'etw': 'etw', 'Eigentumswohnung': 'etw',
    'MFH': 'mfh', 'mfh': 'mfh', 'Mehrfamilienhaus': 'mfh',
    'EFH': 'efh', 'efh': 'efh', 'Einfamilienhaus': 'efh',
    'DHH': 'dhh', 'dhh': 'dhh', 'Doppelhaushälfte': 'dhh',
    'Gewerbe': 'gew', 'gew': 'gew',
    'Mixed': 'mixed', 'mixed': 'mixed',
    'Grundstück': 'grundstueck', 'grundstueck': 'grundstueck',
  };

  // Build legal title block
  const legalTitle = buildLegalTitleBlock(data);

  // Build existing loan data
  const existingLoanData = buildExistingLoanData(loans);

  return {
    sourceMode: 'SSOT_FINAL',
    address: property.address || '',
    postalCode: property.postal_code || '',
    city: property.city || '',
    lat: property.latitude ?? undefined,
    lng: property.longitude ?? undefined,
    objectType: typeMap[property.property_type] || 'other',
    livingAreaSqm: totalAreaSqm,
    plotAreaSqm: property.plot_area_sqm || null,
    usableAreaSqm: null,
    commercialAreaSqm: null,
    rooms: totalRooms,
    units: units.length || null,
    floors: null,
    parkingSpots: totalParkingSpots,
    yearBuilt: property.year_built,
    condition: conditionMap[property.condition_grade || ''] || null,
    energyClass: property.energy_certificate_value || null,
    modernizations: [],
    askingPrice: property.market_value || property.purchase_price || null,
    netColdRentMonthly: totalNetColdRent,
    netColdRentPerSqm,
    hausgeldMonthly: totalHausgeld,
    vacancyRate: null,
    rentalStatus,
    purchasePrice: property.purchase_price || null,
    acquisitionCosts: property.acquisition_costs || null,
    notaryDate: null,
    legalTitle,
    existingLoanData,
    groundBookEntry: property.land_register_court ? `${property.land_register_court} Blatt ${property.land_register_sheet || '–'}` : null,
    partitionDeclaration: property.weg_flag ? true : null,
    providerName: null,
    providerContact: null,
  };
}

/**
 * Build LegalTitleBlock from SSOT property data.
 */
export function buildLegalTitleBlock(data: SSOTPropertyData): LegalTitleBlock {
  const p = data.property;
  return {
    landRegisterCourt: p.land_register_court || null,
    landRegisterSheet: p.land_register_sheet || null,
    landRegisterVolume: p.land_register_volume || null,
    parcelNumber: p.parcel_number || null,
    ownershipSharePercent: p.ownership_share_percent || null,
    wegFlag: p.weg_flag || false,
    teNumber: p.te_number || null,
    unitOwnershipNr: p.unit_ownership_nr || null,
    meaShare: data.units.length === 1 ? data.units[0].mea_share || null : null,
    landRegisterExtractAvailable: !!(p.land_register_court && p.land_register_sheet),
    partitionDeclarationAvailable: p.weg_flag && !!p.te_number,
    encumbrancesNote: 'Belastungen nicht automatisch ausgewertet — manuelle Prüfung empfohlen',
  };
}

/**
 * Build ExistingLoanData from SSOT loans (uses first/primary loan).
 */
export function buildExistingLoanData(loans: SSOTPropertyData['loans']): ExistingLoanData | null {
  if (!loans || loans.length === 0) return null;
  const primary = loans[0];
  return {
    outstandingBalance: primary.outstanding_balance_eur || null,
    interestRatePercent: primary.interest_rate_percent || null,
    repaymentRatePercent: primary.repayment_rate_percent || null,
    annuityMonthly: primary.annuity_monthly_eur || null,
    fixedInterestEndDate: primary.fixed_interest_end_date || null,
    bankName: primary.bank_name || null,
  };
}

/**
 * Create a default (empty) snapshot for DRAFT_INTAKE mode.
 */
export function createDraftSnapshot(): CanonicalPropertySnapshot {
  return {
    sourceMode: 'DRAFT_INTAKE',
    address: '', postalCode: '', city: '',
    objectType: 'other',
    livingAreaSqm: null, plotAreaSqm: null, usableAreaSqm: null, commercialAreaSqm: null,
    rooms: null, units: null, floors: null, parkingSpots: null,
    yearBuilt: null, condition: null, energyClass: null, modernizations: [],
    askingPrice: null, netColdRentMonthly: null, netColdRentPerSqm: null,
    hausgeldMonthly: null, vacancyRate: null, rentalStatus: null,
    purchasePrice: null, acquisitionCosts: null, notaryDate: null,
    legalTitle: null, existingLoanData: null,
    groundBookEntry: null, partitionDeclaration: null,
    providerName: null, providerContact: null,
  };
}

// ============================================================================
// V6.0: MERGE & DIFF LOGIC
// ============================================================================

/** Fields that can be compared between SSOT and Extracted */
const MERGE_FIELDS: { key: keyof CanonicalPropertySnapshot; label: string }[] = [
  { key: 'address', label: 'Adresse' },
  { key: 'postalCode', label: 'PLZ' },
  { key: 'city', label: 'Stadt' },
  { key: 'objectType', label: 'Objektart' },
  { key: 'livingAreaSqm', label: 'Wohnfläche (m²)' },
  { key: 'plotAreaSqm', label: 'Grundstücksfläche (m²)' },
  { key: 'rooms', label: 'Zimmer' },
  { key: 'units', label: 'Einheiten' },
  { key: 'yearBuilt', label: 'Baujahr' },
  { key: 'askingPrice', label: 'Angebotspreis' },
  { key: 'netColdRentMonthly', label: 'Nettokaltmiete (mtl.)' },
  { key: 'hausgeldMonthly', label: 'Hausgeld (mtl.)' },
  { key: 'condition', label: 'Zustand' },
  { key: 'energyClass', label: 'Energieklasse' },
  { key: 'parkingSpots', label: 'Stellplätze' },
];

/**
 * Merge two snapshots: SSOT wins, Extracted fills gaps.
 * Returns the merged snapshot (SSOT fields always preserved).
 */
export function mergeSnapshots(
  ssot: CanonicalPropertySnapshot,
  extracted: Partial<CanonicalPropertySnapshot>
): CanonicalPropertySnapshot {
  const merged = { ...ssot };

  for (const { key } of MERGE_FIELDS) {
    const ssotVal = ssot[key];
    const extractedVal = extracted[key];

    // SSOT wins if it has a non-null value (0 is a valid value, e.g. vacancyRate: 0)
    if (ssotVal === null || ssotVal === undefined || ssotVal === '') {
      if (extractedVal !== null && extractedVal !== undefined && extractedVal !== '') {
        (merged as any)[key] = extractedVal;
      }
    }
  }

  return merged;
}

/**
 * Detect differences between SSOT snapshot and extracted data.
 * Only returns entries where both have a non-null value AND they differ.
 */
export function detectDiffs(
  ssot: CanonicalPropertySnapshot,
  extracted: Partial<CanonicalPropertySnapshot>
): DiffEntry[] {
  const diffs: DiffEntry[] = [];

  for (const { key, label } of MERGE_FIELDS) {
    const ssotVal = ssot[key];
    const extractedVal = extracted[key];

    // Both must have values to create a diff
    if (
      ssotVal !== null && ssotVal !== undefined && ssotVal !== '' &&
      extractedVal !== null && extractedVal !== undefined && extractedVal !== ''
    ) {
      // Compare values (handle number vs string)
      const ssotStr = String(ssotVal);
      const extractedStr = String(extractedVal);

      if (ssotStr !== extractedStr) {
        diffs.push({
          field: key,
          fieldLabel: label,
          ssotValue: ssotVal as any,
          extractedValue: extractedVal as any,
          decision: 'pending',
        });
      }
    }
  }

  return diffs;
}

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
  const objectType = snapshot.objectType || 'other';
  
  const gnd = GESAMTNUTZUNGSDAUER_BY_TYPE[objectType] || 70;
  const restnutzungsdauer = assumptions.restnutzungsdauer || Math.max(10, gnd - age);
  const liegenschaftszins = assumptions.liegenschaftszins || LIEGENSCHAFTSZINS_BY_TYPE[objectType] || 0.045;
  
  // Bodenwert: use actual plot area or heuristic
  const plotHeuristic = PLOT_AREA_HEURISTIC_BY_TYPE[objectType] || 1.0;
  const plotArea = snapshot.plotAreaSqm || (area * plotHeuristic);
  const bodenwertPerSqm = assumptions.bodenwertPerSqm || BODENRICHTWERT_FLOOR;

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
  
  const lageAdj = adjusters.lageAdjust || 0;
  const zustandAdj = adjusters.zustandAdjust || 0;
  const flächeAdj = adjusters.flächeAdjust || 0;
  const totalAdj = 1 + lageAdj + zustandAdj + flächeAdj;
  
  const adjustedPriceSqm = basePriceSqm * totalAdj;
  const value = Math.round(adjustedPriceSqm * area);
  
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
  const objectType = snapshot.objectType || 'other';
  
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
  
  let cluster: string;
  if (yearBuilt < 1950) cluster = 'pre_1950';
  else if (yearBuilt < 1970) cluster = '1950_1970';
  else if (yearBuilt < 1990) cluster = '1970_1990';
  else if (yearBuilt < 2010) cluster = '1990_2010';
  else cluster = 'post_2010';
  
  const herstellkostenPerSqmBase = HERSTELLKOSTEN_CLUSTERS[cluster];
  const herstellkostenPerSqm = Math.round(herstellkostenPerSqmBase * BPI_FACTOR);
  const age = new Date().getFullYear() - yearBuilt;
  const alterswertminderung = Math.min(0.70, age * 0.01);
  
  const herstellkostenGesamt = area * herstellkostenPerSqm;
  const nachAbschreibung = herstellkostenGesamt * (1 - alterswertminderung);
  
  // Bodenwert: use actual plot area or heuristic by type
  const plotHeuristic = PLOT_AREA_HEURISTIC_BY_TYPE[objectType] || 1.0;
  const plotArea = snapshot.plotAreaSqm || (area * plotHeuristic);
  const bodenwertProxy = plotArea * BODENRICHTWERT_FLOOR;
  
  const value = Math.round(nachAbschreibung + bodenwertProxy);

  return {
    method: 'sachwert_proxy',
    value,
    confidence: 'low',
    confidenceScore: 0.35,
    params: {
      herstellkostenPerSqm,
      herstellkostenPerSqmBase,
      bpiFactor: BPI_FACTOR,
      cluster,
      alterswertminderung: Math.round(alterswertminderung * 100),
      herstellkostenGesamt: Math.round(herstellkostenGesamt),
      nachAbschreibung: Math.round(nachAbschreibung),
      bodenwertProxy: Math.round(bodenwertProxy),
      plotArea: Math.round(plotArea),
    },
    notes: [
      'Vereinfachter Sachwert als Plausibilitäts-Check',
      `Herstellkosten ${herstellkostenPerSqm} €/m² (Basis ${herstellkostenPerSqmBase} × BPI ${BPI_FACTOR}, Cluster: ${cluster})`,
      `Alterswertminderung: ${Math.round(alterswertminderung * 100)}% (max 70%)`,
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
  
  const defaultWeights: Record<string, number> = {
    ertrag: 0.55,
    comp_proxy: 0.35,
    sachwert_proxy: 0.10,
  };
  
  const weights = validMethods.map(m => ({
    method: m.method,
    weight: customWeights?.[m.method] ?? defaultWeights[m.method] ?? 0.1,
    value: m.value,
    confidence: m.confidence,
    confidenceScore: m.confidenceScore,
  }));
  
  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  weights.forEach(w => { w.weight = w.weight / totalWeight; });
  
  const p50 = Math.round(weights.reduce((sum, w) => sum + w.value * w.weight, 0));
  
  const allValues = validMethods.map(m => m.value).sort((a, b) => a - b);
  const spread = allValues.length > 1
    ? (allValues[allValues.length - 1] - allValues[0]) / p50
    : 0.15;
  
  const halfSpread = Math.max(0.05, Math.min(0.20, spread / 2));
  const p25 = Math.round(p50 * (1 - halfSpread));
  const p75 = Math.round(p50 * (1 + halfSpread));
  
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
 */
export function calculateLienProxy(
  valueBand: ValueBand,
  dataQuality: DataQuality,
  locationScore: number
): LienProxy {
  const riskDrivers: LienProxyRiskDriver[] = [];
  let totalDiscount = 0;
  
  if (dataQuality.completenessPercent < 60) {
    const disc = 0.10;
    riskDrivers.push({ factor: 'Datenlücken', discountPercent: disc * 100, reasoning: `Completeness nur ${dataQuality.completenessPercent}%` });
    totalDiscount += disc;
  } else if (dataQuality.completenessPercent < 80) {
    const disc = 0.05;
    riskDrivers.push({ factor: 'Datenlücken (gering)', discountPercent: disc * 100, reasoning: `Completeness ${dataQuality.completenessPercent}%` });
    totalDiscount += disc;
  }
  
  if (locationScore < 40) {
    const disc = 0.08;
    riskDrivers.push({ factor: 'Standort-Risiko', discountPercent: disc * 100, reasoning: `Standort-Score nur ${locationScore}/100` });
    totalDiscount += disc;
  } else if (locationScore < 60) {
    const disc = 0.04;
    riskDrivers.push({ factor: 'Standort (durchschnittlich)', discountPercent: disc * 100, reasoning: `Standort-Score ${locationScore}/100` });
    totalDiscount += disc;
  }
  
  if (valueBand.confidenceScore < 0.4) {
    const disc = 0.08;
    riskDrivers.push({ factor: 'Niedrige Bewertungs-Confidence', discountPercent: disc * 100, reasoning: `Confidence Score ${valueBand.confidenceScore}` });
    totalDiscount += disc;
  }
  
  const baseSafetyMargin = 0.10;
  riskDrivers.push({ factor: 'Sicherheitsabschlag (Basis)', discountPercent: baseSafetyMargin * 100, reasoning: 'Standard-Sicherheitsabschlag für Proxy' });
  totalDiscount += baseSafetyMargin;
  
  totalDiscount = Math.min(totalDiscount, 0.40);
  
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
    ? Math.round(annualDebtService * 1.1 / 12)
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
  
  if (snapshot.netColdRentMonthly) {
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
  
  variations.push({
    parameter: 'Instandhaltung +20%',
    delta: 0.20,
    resultingValue: Math.round(baseP50 * 0.97),
    deltaFromBase: Math.round(baseP50 * -0.03),
  });
  
  variations.push({
    parameter: 'Zins +2%',
    delta: 0.02,
    resultingValue: Math.round(baseP50 * 0.92),
    deltaFromBase: Math.round(baseP50 * -0.08),
  });
  
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
    sourceMode: raw.sourceMode || 'DRAFT_INTAKE',
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
    purchasePrice: raw.purchasePrice ?? null,
    acquisitionCosts: raw.acquisitionCosts ?? null,
    notaryDate: raw.notaryDate ?? null,
    legalTitle: raw.legalTitle ?? null,
    existingLoanData: raw.existingLoanData ?? null,
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
  
  if (snapshot.askingPrice && snapshot.livingAreaSqm) {
    const priceSqm = snapshot.askingPrice / snapshot.livingAreaSqm;
    if (priceSqm < 500) {
      warnings.push({ field: 'askingPrice', severity: 'warning', message: `€/m² sehr niedrig (${Math.round(priceSqm)} €/m²)` });
    }
    if (priceSqm > 15000) {
      warnings.push({ field: 'askingPrice', severity: 'warning', message: `€/m² sehr hoch (${Math.round(priceSqm)} €/m²)` });
    }
  }
  
  if (snapshot.netColdRentPerSqm) {
    if (snapshot.netColdRentPerSqm < 3) {
      warnings.push({ field: 'netColdRentPerSqm', severity: 'warning', message: `Miete sehr niedrig (${snapshot.netColdRentPerSqm} €/m²)` });
    }
    if (snapshot.netColdRentPerSqm > 25) {
      warnings.push({ field: 'netColdRentPerSqm', severity: 'warning', message: `Miete sehr hoch (${snapshot.netColdRentPerSqm} €/m²)` });
    }
  }
  
  if (snapshot.yearBuilt) {
    const currentYear = new Date().getFullYear();
    if (snapshot.yearBuilt < 1800 || snapshot.yearBuilt > currentYear + 2) {
      warnings.push({ field: 'yearBuilt', severity: 'error', message: `Baujahr unplausibel: ${snapshot.yearBuilt}` });
    }
  }
  
  if (snapshot.livingAreaSqm && snapshot.usableAreaSqm && snapshot.usableAreaSqm < snapshot.livingAreaSqm) {
    warnings.push({ field: 'usableAreaSqm', severity: 'warning', message: 'Nutzfläche < Wohnfläche — prüfen' });
  }
  
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
  
  // V6.0: SSOT_FINAL mode gets a boost — all SSOT fields count as verified
  const isSSOT = snapshot.sourceMode === 'SSOT_FINAL';
  
  for (const field of allFields) {
    const val = (snapshot as any)[field];
    const ev = evidence.find(e => e.field === field);
    
    if (val === null || val === undefined || val === '') {
      missing++;
      if (criticalFields.includes(field)) criticalGaps++;
    } else if (isSSOT) {
      // In SSOT mode, all present fields are considered verified
      verified++;
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
