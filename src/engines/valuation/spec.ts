/**
 * ENG-VALUATION — SoT Valuation Engine V5.0
 * 
 * SPEC FILE: Types, Interfaces, Constants, Defaults (NO logic)
 * 
 * Purpose: KI-gestützte Immobilienbewertung mit deterministischem Rechenkern
 * Entry Points: MOD-04 (Immobilienakte), MOD-12 (Acquiary Tools), MOD-13 (Inbox)
 * Credits: 20 Credits pro Bewertungsfall (fix)
 * 
 * @version 1.0.0
 */

// ============================================================================
// CONSTANTS
// ============================================================================

export const VALUATION_ENGINE_VERSION = '1.0.0';
export const VALUATION_CREDITS_PER_CASE = 20;
export const VALUATION_MAX_FILES = 20;
export const VALUATION_MAX_PAGES = 120;
export const VALUATION_MAX_RETRIES = 2;
export const VALUATION_REPORT_MAX_PAGES = 12;

/** Google API cost guards */
export const GOOGLE_LIMITS = {
  maxGeocodeRequests: 1,
  maxNearbySearches: 5,
  maxRouteMatrixDestinations: 6,
  maxStaticMaps: 2,
} as const;

/** Comp search defaults */
export const COMP_SEARCH_DEFAULTS = {
  radiusUrbanKm: 3,
  radiusSuburbanKm: 7,
  radiusRuralKm: 15,
  areaTolerancePercent: 20,
  areaRelaxPercent: 30,
  yearToleranceYears: 15,
  priceTolerancePercent: 30,
  targetListingsRaw: 30,
  targetListingsDeduped: 20,
  minListingsRequired: 5,
} as const;

/** POI categories for Google Places API */
export const POI_CATEGORIES = [
  { key: 'transit', types: ['transit_station', 'bus_station'], label: 'ÖPNV' },
  { key: 'daily', types: ['supermarket', 'pharmacy'], label: 'Alltag' },
  { key: 'family', types: ['school'], label: 'Familie' },
  { key: 'health', types: ['doctor', 'hospital'], label: 'Gesundheit' },
  { key: 'leisure', types: ['park', 'gym'], label: 'Freizeit' },
] as const;

/** Default financing scenario configs */
export const DEFAULT_FINANCING_SCENARIOS = [
  { name: 'konservativ', ltv: 0.60, interestRate: 0.038, repaymentRate: 0.03 },
  { name: 'realistisch', ltv: 0.75, interestRate: 0.035, repaymentRate: 0.02 },
  { name: 'offensiv', ltv: 0.90, interestRate: 0.042, repaymentRate: 0.015 },
] as const;

/** Stress test scenarios */
export const DEFAULT_STRESS_TESTS = [
  { label: 'Zins +2%', interestDelta: 0.02, rentDelta: 0, capexDelta: 0 },
  { label: 'Miete -10%', interestDelta: 0, rentDelta: -0.10, capexDelta: 0 },
  { label: 'CapEx +20%', interestDelta: 0, rentDelta: 0, capexDelta: 0.20 },
  { label: 'Kombination', interestDelta: 0.02, rentDelta: -0.10, capexDelta: 0.20 },
] as const;

/** Bewirtschaftung defaults (% of gross rent) */
export const BEWIRTSCHAFTUNG_DEFAULTS = {
  verwaltungPercent: 0.05,
  instandhaltungPerSqmYear: 12.0,
  mietausfallPercent: 0.02,
  nichtUmlagefaehigPercent: 0.03,
} as const;

/** Sachwert proxy: Herstellkosten pro m² nach Baujahr-Cluster */
export const HERSTELLKOSTEN_CLUSTERS: Record<string, number> = {
  'pre_1950': 1200,
  '1950_1970': 1400,
  '1970_1990': 1600,
  '1990_2010': 2000,
  'post_2010': 2600,
};

// ============================================================================
// ENUMS & LITERALS
// ============================================================================

export type ValuationCaseStatus = 'draft' | 'running' | 'needs_info' | 'final' | 'failed';

export type ValuationSourceContext = 'MOD_04' | 'ACQUIARY_TOOLS' | 'MOD_13_INBOX';

export type ValuationStageId = 0 | 1 | 2 | 3 | 4 | 5;

export type ValuationStageStatus = 'queued' | 'running' | 'done' | 'warn' | 'fail' | 'needs_info';

export type ValuationMethodType = 'ertrag' | 'comp_proxy' | 'sachwert_proxy';

export type TrafficLight = 'green' | 'yellow' | 'red';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type FieldConfidence = 'verified' | 'extracted' | 'derived' | 'assumed' | 'missing';

// ============================================================================
// STAGE DEFINITIONS
// ============================================================================

export interface ValuationStageDefinition {
  id: ValuationStageId;
  name: string;
  description: string;
  estimatedDurationMs: [number, number]; // [min, max]
}

export const VALUATION_STAGES: ValuationStageDefinition[] = [
  { id: 0, name: 'Preflight & Credit Gate', description: 'Kosten, Quellen, Limits prüfen', estimatedDurationMs: [500, 2000] },
  { id: 1, name: 'Intake & Dokumentauslesung', description: 'Quellen sammeln, Felder extrahieren, Evidence Map', estimatedDurationMs: [15000, 40000] },
  { id: 2, name: 'Normalisierung & Standort', description: 'Plausibilisierung, Google POIs, Karten', estimatedDurationMs: [10000, 20000] },
  { id: 3, name: 'Vergleichsangebote', description: 'Portal-Comps scrapen, normalisieren, deduplizieren', estimatedDurationMs: [10000, 30000] },
  { id: 4, name: 'Bewertung & Finanzierung', description: 'Deterministischer Rechenkern: Wertband, Szenarien, KDF', estimatedDurationMs: [2000, 10000] },
  { id: 5, name: 'Report Composer', description: 'Web-Reader + PDF (max 12 Seiten)', estimatedDurationMs: [10000, 20000] },
];

// ============================================================================
// CANONICAL PROPERTY SNAPSHOT
// ============================================================================

export interface CanonicalPropertySnapshot {
  // Identity
  address: string;
  postalCode: string;
  city: string;
  lat?: number;
  lng?: number;
  
  // Classification
  objectType: 'etw' | 'mfh' | 'efh' | 'dhh' | 'gew' | 'mixed' | 'grundstueck' | 'other';
  
  // Dimensions
  livingAreaSqm: number | null;
  plotAreaSqm: number | null;
  usableAreaSqm: number | null;
  commercialAreaSqm: number | null;
  rooms: number | null;
  units: number | null;
  floors: number | null;
  parkingSpots: number | null;
  
  // Condition
  yearBuilt: number | null;
  condition: 'new' | 'renovated' | 'good' | 'average' | 'poor' | 'derelict' | null;
  energyClass: string | null;
  modernizations: string[];
  
  // Financials
  askingPrice: number | null;
  netColdRentMonthly: number | null;
  netColdRentPerSqm: number | null;
  hausgeldMonthly: number | null;
  vacancyRate: number | null;
  rentalStatus: 'fully_rented' | 'partially_rented' | 'vacant' | 'owner_occupied' | null;
  
  // Extras
  groundBookEntry: string | null;
  partitionDeclaration: boolean | null;
  providerName: string | null;
  providerContact: string | null;
}

// ============================================================================
// EVIDENCE & DATA QUALITY
// ============================================================================

export interface EvidenceEntry {
  field: string;
  value: string | number | boolean;
  source: string; // document name / URL / "SSOT"
  sourceSection?: string; // page/paragraph reference
  confidence: FieldConfidence;
  confidenceScore: number; // 0.0–1.0
}

export interface MissingField {
  field: string;
  critical: boolean;
  hint: string;
  impact: 'high' | 'medium' | 'low';
}

export interface Assumption {
  id: number;
  text: string;
  impact: 'high' | 'medium' | 'low';
  howToVerify: string;
}

export interface DataQuality {
  completenessPercent: number;
  criticalGaps: number;
  fieldsVerified: number;
  fieldsDerived: number;
  fieldsMissing: number;
  globalConfidence: ConfidenceLevel;
  globalConfidenceScore: number; // 0.0–1.0
}

// ============================================================================
// LOCATION ANALYSIS
// ============================================================================

export interface LocationScoreDimension {
  key: string;
  label: string;
  score: number; // 0–10
  topPois: LocationPoi[];
}

export interface LocationPoi {
  name: string;
  type: string;
  distanceMeters: number;
  rating?: number;
}

export interface ReachabilityEntry {
  destinationName: string;
  drivingMinutes: number | null;
  transitMinutes: number | null;
}

export interface LocationAnalysis {
  overallScore: number; // 0–100
  dimensions: LocationScoreDimension[];
  reachability: ReachabilityEntry[];
  microMapUrl: string | null;
  macroMapUrl: string | null;
  narrative: string;
  narrativeConfidence: ConfidenceLevel;
}

// ============================================================================
// COMP POSTINGS (PORTAL VERGLEICHSANGEBOTE)
// ============================================================================

export interface CompPosting {
  id: string;
  title: string;
  price: number;
  area: number;
  priceSqm: number;
  rooms: number | null;
  yearBuilt: number | null;
  distanceKm: number | null;
  url: string;
  portal: string;
  scrapedAt: string;
}

export interface CompSearchMeta {
  radiusKm: number;
  objectTypeFilter: string;
  areaRangeFilter: string;
  relaxSteps: string[];
  rawCount: number;
  dedupedCount: number;
}

export interface CompStats {
  count: number;
  dedupedCount: number;
  medianPriceSqm: number;
  p25PriceSqm: number;
  p50PriceSqm: number;
  p75PriceSqm: number;
  iqr: number;
  meanPriceSqm: number;
  stdDevPriceSqm: number;
}

// ============================================================================
// VALUATION METHODS
// ============================================================================

export interface ValuationMethodResult {
  method: ValuationMethodType;
  value: number;
  confidence: ConfidenceLevel;
  confidenceScore: number;
  params: Record<string, number | string>;
  notes: string[];
}

export interface ValueBand {
  p25: number;
  p50: number;
  p75: number;
  confidence: ConfidenceLevel;
  confidenceScore: number;
  weightingTable: WeightingEntry[];
  reasoning: string;
}

export interface WeightingEntry {
  method: ValuationMethodType;
  weight: number;
  value: number;
  confidence: ConfidenceLevel;
}

// ============================================================================
// ERTRAGSWERT SPECIFICS
// ============================================================================

export interface ErtragswertParams {
  netColdRentYearly: number;
  verwaltungPercent: number;
  instandhaltungYearly: number;
  mietausfallPercent: number;
  nichtUmlagefaehigPercent: number;
  bodenwertProxy: number;
  liegenschaftszins: number;
  restnutzungsdauer: number;
}

export interface ErtragswertResult {
  rohertrag: number;
  bewirtschaftungAbzug: number;
  reinertrag: number;
  barwertfaktor: number;
  ertragswertGebaeude: number;
  bodenwertProxy: number;
  ertragswertGesamt: number;
}

// ============================================================================
// FINANCING
// ============================================================================

export interface FinancingScenarioConfig {
  name: string;
  ltv: number;
  interestRate: number;
  repaymentRate: number;
}

export interface FinancingScenario {
  name: string;
  ltv: number;
  loanAmount: number;
  equity: number;
  interestRate: number;
  repaymentRate: number;
  monthlyRate: number;
  annualDebtService: number;
  cashflowAfterDebt: number | null; // null if no rent data
  trafficLight: TrafficLight;
}

export interface StressTestConfig {
  label: string;
  interestDelta: number;
  rentDelta: number; // -0.10 = -10%
  capexDelta: number;
}

export interface StressTestResult {
  label: string;
  monthlyRate: number;
  annualDebtService: number;
  cashflowAfterDebt: number | null;
  dscr: number | null;
  trafficLight: TrafficLight;
}

// ============================================================================
// LIEN PROXY (BELEIHUNGSWERT PROXY)
// ============================================================================

export interface LienProxyRiskDriver {
  factor: string;
  discountPercent: number;
  reasoning: string;
}

export interface LienProxy {
  marketValueP50: number;
  totalDiscount: number;
  lienValueLow: number;
  lienValueHigh: number;
  safeLtvWindow: [number, number]; // e.g. [0.55, 0.70]
  riskDrivers: LienProxyRiskDriver[];
}

// ============================================================================
// DEBT SERVICE / KAPITALDIENSTFÄHIGKEIT
// ============================================================================

export interface DebtServiceResult {
  dscr: number | null; // Debt Service Coverage Ratio
  breakEvenRentMonthly: number | null;
  isViable: boolean | null;
  cashflowAfterDebt: number | null;
  notes: string[];
}

// ============================================================================
// SENSITIVITY
// ============================================================================

export interface SensitivityVariation {
  parameter: string;
  delta: number; // e.g. +0.10 = +10%
  resultingValue: number;
  deltaFromBase: number;
}

export interface SensitivityMatrix {
  baseValue: number;
  variations: SensitivityVariation[];
}

// ============================================================================
// PLAUSIBILITY
// ============================================================================

export interface PlausibilityWarning {
  field: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestedAction?: string;
}

// ============================================================================
// REPORT
// ============================================================================

export type ReportChapter = 
  | 'cover'
  | 'executive_summary'
  | 'object_profile'
  | 'data_quality'
  | 'location'
  | 'comps'
  | 'valuation_method'
  | 'valuation_calc'
  | 'financing'
  | 'stress_kdf'
  | 'lien_risk'
  | 'appendix';

export const REPORT_CHAPTERS: { key: ReportChapter; title: string; pageTarget: number }[] = [
  { key: 'cover', title: 'Cover + Objekt-Snapshot', pageTarget: 1 },
  { key: 'executive_summary', title: 'Executive Summary', pageTarget: 1 },
  { key: 'object_profile', title: 'Objektprofil', pageTarget: 1 },
  { key: 'data_quality', title: 'Datenlage & Annahmen', pageTarget: 1 },
  { key: 'location', title: 'Standortanalyse', pageTarget: 1 },
  { key: 'comps', title: 'Vergleichsangebote', pageTarget: 1 },
  { key: 'valuation_method', title: 'Bewertung: Methodik & Ergebnis', pageTarget: 1 },
  { key: 'valuation_calc', title: 'Bewertung: Rechenlogik', pageTarget: 1 },
  { key: 'financing', title: 'Finanzierbarkeit', pageTarget: 1 },
  { key: 'stress_kdf', title: 'Stress-Tests & KDF', pageTarget: 1 },
  { key: 'lien_risk', title: 'Beleihung (Proxy) & Risiko', pageTarget: 1 },
  { key: 'appendix', title: 'Appendix Light', pageTarget: 1 },
];

// ============================================================================
// STAGE OUTPUT SHAPES (what each stage produces)
// ============================================================================

export interface PreflightOutput {
  creditsCost: number;
  sources: { name: string; type: string; pages?: number }[];
  totalEstimatedPages: number;
  limitsOk: boolean;
  googleApiAvailable: boolean;
  scraperAvailable: boolean;
}

export interface IntakeOutput {
  snapshot: CanonicalPropertySnapshot;
  extractedFields: EvidenceEntry[];
  missingFields: MissingField[];
  evidenceMap: EvidenceEntry[];
}

export interface NormLocationOutput {
  normalizedSnapshot: CanonicalPropertySnapshot;
  warnings: PlausibilityWarning[];
  assumptions: Assumption[];
  locationAnalysis: LocationAnalysis;
  dataQuality: DataQuality;
}

export interface CompsOutput {
  searchMeta: CompSearchMeta;
  postings: CompPosting[];
  stats: CompStats;
}

export interface CalculationOutput {
  valueBand: ValueBand;
  methods: ValuationMethodResult[];
  financing: FinancingScenario[];
  stressTests: StressTestResult[];
  lienProxy: LienProxy;
  debtService: DebtServiceResult;
  sensitivity: SensitivityMatrix;
}

export interface ReportOutput {
  chapters: { key: ReportChapter; htmlContent: string }[];
  webRenderHash: string;
  generatedAt: string;
}

// ============================================================================
// FULL CASE AGGREGATE
// ============================================================================

export interface ValuationCase {
  id: string;
  tenantId: string;
  sourceContext: ValuationSourceContext;
  sourceRef: string | null;
  status: ValuationCaseStatus;
  creditsCharged: number;
  currentStage: ValuationStageId;
  stageTimings: Record<string, number>; // stageId → durationMs
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
