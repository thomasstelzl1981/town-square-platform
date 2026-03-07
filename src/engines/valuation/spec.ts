/**
 * ENG-VALUATION — SoT Valuation Engine V9.0
 * 
 * SPEC FILE: Types, Interfaces, Constants, Defaults (NO logic)
 * 
 * Purpose: KI-gestützte Immobilienbewertung nach Kurzgutachten-Standard (Bankenqualität)
 * Entry Points: MOD-04 (Immobilienakte/SSOT-Final)
 * Credits: 20 Credits pro Bewertungsfall (fix)
 * 
 * V9.0 Changes:
 * - Gemini AI Research for Liegenschaftszins, Bodenrichtwert, Vergleichsmieten
 * - BelWertV Beleihungswert (dual-track: Marktwert + Beleihungswert)
 * - Kurzgutachten-Standard Report (12 Seiten)
 * - Plot area heuristic MFH updated to 2.5×
 * 
 * @version 9.0.0
 */

// ============================================================================
// CONSTANTS
// ============================================================================

export const VALUATION_ENGINE_VERSION = '9.0.0';
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

/** Bewirtschaftung defaults (% of gross rent) — Marktwert-Track */
export const BEWIRTSCHAFTUNG_DEFAULTS = {
  verwaltungPercent: 0.05,
  instandhaltungPerSqmYear: 12.0,
  mietausfallPercent: 0.02,
  nichtUmlagefaehigPercent: 0.03,
} as const;

/** V9.0: BelWertV Bewirtschaftung — konservativere Ansätze für Beleihungswert */
export const BEWIRTSCHAFTUNG_BELWERTV = {
  verwaltungPercent: 0.06,
  instandhaltungPerSqmYear: 15.0,
  mietausfallPercent: 0.04,
  nichtUmlagefaehigPercent: 0.04,
} as const;

/** V9.0: BelWertV Constants */
export const BELWERTV = {
  /** BelWertV §12: Fest 5,0% Liegenschaftszins für Beleihungswert */
  liegenschaftszinsFest: 0.05,
  /** Sicherheitsabschlag auf Zeitwert */
  sicherheitsabschlagProzent: 0.10,
  /** Baunebenkosten-Zuschlag (BelWertV) */
  baunebenkostenProzent: 0.1867,
  /** Regionalfaktor-Default (BKI) */
  regionalfaktorDefault: 1.0,
} as const;

/** Baupreisindex-Korrektor 2010→2026 (Statistisches Bundesamt, Wohngebäude) */
export const BPI_FACTOR = 1.38;

/** Sachwert proxy: Herstellkosten pro m² nach Baujahr-Cluster (NHK 2010 Basis, VOR BPI) */
export const HERSTELLKOSTEN_CLUSTERS: Record<string, number> = {
  'pre_1950': 1200,
  '1950_1970': 1400,
  '1970_1990': 1600,
  '1990_2010': 2000,
  'post_2010': 2600,
};

/** V9.0: Liegenschaftszinssatz — Fallback-Tabelle (wird durch Gemini-Recherche überschrieben) */
export const LIEGENSCHAFTSZINS_BY_TYPE: Record<string, number> = {
  'mfh': 0.04,
  'etw': 0.03,
  'efh': 0.025,
  'dhh': 0.025,
  'gew': 0.06,
  'mixed': 0.05,
  'grundstueck': 0.04,
  'other': 0.04,
};

/** Gesamtnutzungsdauer nach Objektart (Jahre) */
export const GESAMTNUTZUNGSDAUER_BY_TYPE: Record<string, number> = {
  'mfh': 80,
  'etw': 80,
  'efh': 80,
  'dhh': 80,
  'gew': 60,
  'mixed': 70,
  'grundstueck': 0,
  'other': 70,
};

/** V9.0: Heuristik für Grundstücksfläche — MFH jetzt 2.5× */
export const PLOT_AREA_HEURISTIC_BY_TYPE: Record<string, number> = {
  'mfh': 2.5,
  'efh': 3.0,
  'dhh': 2.0,
  'etw': 0.3,
  'gew': 1.2,
  'mixed': 1.3,
  'grundstueck': 1.0,
  'other': 1.0,
};

/** Bodenrichtwert-Proxy nach Lage-Score (5 Stufen) — Fallback wenn Gemini keinen Wert liefert */
export const BODENRICHTWERT_STUFEN: { maxScore: number; value: number }[] = [
  { maxScore: 30, value: 120 },
  { maxScore: 45, value: 200 },
  { maxScore: 60, value: 300 },
  { maxScore: 75, value: 400 },
  { maxScore: 100, value: 550 },
];

/** Mindest-Bodenrichtwert für Städte (Floor) */
export const BODENRICHTWERT_FLOOR = 200;

// ============================================================================
// ENUMS & LITERALS
// ============================================================================

export type ValuationCaseStatus = 'draft' | 'running' | 'needs_info' | 'final' | 'failed';

export type ValuationSourceContext = 'MOD_04' | 'ACQUIARY_TOOLS' | 'MOD_13_INBOX';

export type ValuationStageId = 0 | 1 | 2 | 3 | 4 | 5;

export type ValuationStageStatus = 'queued' | 'running' | 'done' | 'warn' | 'fail' | 'needs_info';

export type ValuationMethodType = 'ertrag' | 'ertragswert' | 'comp_proxy' | 'sachwert_proxy';

export type TrafficLight = 'green' | 'yellow' | 'red';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export type FieldConfidence = 'verified' | 'extracted' | 'derived' | 'assumed' | 'missing';

// ============================================================================
// V6.0: SOURCE MODE & FIELD PROVENANCE
// ============================================================================

export type ValuationSourceMode = 'SSOT_FINAL' | 'DRAFT_INTAKE';

export type FieldSource = 'SSOT' | 'Extracted' | 'User' | 'Derived';

export interface SnapshotField<T> {
  value: T;
  source: FieldSource;
  confidence: number;
  evidenceRefs: string[];
}

export interface DiffEntry {
  field: string;
  fieldLabel: string;
  ssotValue: string | number | boolean | null;
  extractedValue: string | number | boolean | null;
  decision: 'ssot_kept' | 'ssot_updated' | 'ignored' | 'pending';
}

export interface LegalTitleBlock {
  landRegisterCourt: string | null;
  landRegisterSheet: string | null;
  landRegisterVolume: string | null;
  parcelNumber: string | null;
  ownershipSharePercent: number | null;
  wegFlag: boolean;
  teNumber: string | null;
  unitOwnershipNr: string | null;
  meaShare: number | null;
  landRegisterExtractAvailable: boolean;
  partitionDeclarationAvailable: boolean;
  encumbrancesNote: string;
}

export interface ExistingLoanData {
  outstandingBalance: number | null;
  interestRatePercent: number | null;
  repaymentRatePercent: number | null;
  annuityMonthly: number | null;
  fixedInterestEndDate: string | null;
  bankName: string | null;
}

// ============================================================================
// V9.0: GEMINI AI RESEARCH RESULTS
// ============================================================================

/** Result from Gemini research for Liegenschaftszins */
export interface GeminiLiegenschaftszinsResult {
  marktwertZins: number;
  beleihungswertZins: number;
  quelle: string;
  stichtag: string;
  min: number;
  max: number;
  begruendung?: string | null;
  confidence: ConfidenceLevel;
}

/** Result from Gemini research for Bodenrichtwert */
export interface GeminiBodenrichtwertResult {
  bodenrichtwertEurSqm: number;
  stichtag: string;
  quelle: string;
  artDerNutzung: string;
  begruendung?: string | null;
  confidence: ConfidenceLevel;
}

/** Result from Gemini research for Vergleichsmieten */
export interface GeminiVergleichsmietenResult {
  mieteMin: number;
  mieteMedian: number;
  mieteMax: number;
  quelle: string;
  begruendung?: string | null;
  confidence: ConfidenceLevel;
}

/** Combined Gemini research output */
export interface GeminiResearchResult {
  liegenschaftszins: GeminiLiegenschaftszinsResult | null;
  bodenrichtwert: GeminiBodenrichtwertResult | null;
  vergleichsmieten: GeminiVergleichsmietenResult | null;
  researchedAt: string;
}

// ============================================================================
// V9.0: BELEIHUNGSWERT (BelWertV)
// ============================================================================

/** Beleihungswert result — calculated per BelWertV standards */
export interface BeleihungswertResult {
  /** Ertragswert nach BelWertV (fester 5% Liegenschaftszins) */
  ertragswertBelwertv: number;
  /** Sachwert nach BelWertV (mit Sicherheitsabschlag) */
  sachwertBelwertv: number;
  /** Finale Beleihungswert (konservativster Wert) */
  beleihungswert: number;
  /** Verhältnis Beleihungswert / Marktwert */
  beleihungswertQuote: number;
  /** BelWertV-spezifische BWK (konservativ) */
  bwkBelwertv: number;
  /** Sicherheitsabschlag in % */
  sicherheitsabschlag: number;
}

// ============================================================================
// STAGE DEFINITIONS
// ============================================================================

export interface ValuationStageDefinition {
  id: ValuationStageId;
  name: string;
  description: string;
  estimatedDurationMs: [number, number];
}

export const VALUATION_STAGES: ValuationStageDefinition[] = [
  { id: 0, name: 'Preflight & Credit Gate', description: 'Kosten, Quellen, Limits prüfen', estimatedDurationMs: [500, 2000] },
  { id: 1, name: 'Intake & Dokumentauslesung', description: 'Quellen sammeln, Felder extrahieren, Evidence Map', estimatedDurationMs: [15000, 40000] },
  { id: 2, name: 'AI-Recherche & Standort', description: 'Gemini-Recherche (Liegenschaftszins, Bodenrichtwert), Google Maps', estimatedDurationMs: [15000, 30000] },
  { id: 3, name: 'Vergleichsangebote', description: 'Portal-Comps scrapen, normalisieren, deduplizieren', estimatedDurationMs: [10000, 30000] },
  { id: 4, name: 'Bewertung (Marktwert + Beleihungswert)', description: 'ImmoWertV + BelWertV Kalkulation, dual-track', estimatedDurationMs: [2000, 10000] },
  { id: 5, name: 'Report Composer', description: 'Kurzgutachten Web-Reader + PDF (12 Seiten)', estimatedDurationMs: [10000, 20000] },
];

// ============================================================================
// CANONICAL PROPERTY SNAPSHOT (V6.0 Extended)
// ============================================================================

export interface CanonicalPropertySnapshot {
  sourceMode: ValuationSourceMode;
  address: string;
  postalCode: string;
  city: string;
  lat?: number;
  lng?: number;
  objectType: 'etw' | 'mfh' | 'efh' | 'dhh' | 'gew' | 'mixed' | 'grundstueck' | 'other';
  livingAreaSqm: number | null;
  plotAreaSqm: number | null;
  usableAreaSqm: number | null;
  commercialAreaSqm: number | null;
  rooms: number | null;
  units: number | null;
  floors: number | null;
  parkingSpots: number | null;
  yearBuilt: number | null;
  condition: 'new' | 'renovated' | 'good' | 'average' | 'poor' | 'derelict' | null;
  energyClass: string | null;
  modernizations: string[];
  askingPrice: number | null;
  netColdRentMonthly: number | null;
  netColdRentPerSqm: number | null;
  hausgeldMonthly: number | null;
  vacancyRate: number | null;
  rentalStatus: 'fully_rented' | 'partially_rented' | 'vacant' | 'owner_occupied' | null;
  purchasePrice: number | null;
  acquisitionCosts: number | null;
  notaryDate: string | null;
  legalTitle: LegalTitleBlock | null;
  existingLoanData: ExistingLoanData | null;
  groundBookEntry: string | null;
  partitionDeclaration: boolean | null;
  providerName: string | null;
  providerContact: string | null;
  /** V9.4: Erweiterte Gebäudedaten */
  heatingType?: string | null;
  energySource?: string | null;
  coreRenovated?: boolean | null;
  renovationYear?: number | null;
  ownershipSharePercent?: number | null;
  energyCertificateValue?: number | null;
}

// ============================================================================
// EVIDENCE & DATA QUALITY
// ============================================================================

export interface EvidenceEntry {
  field: string;
  value: string | number | boolean;
  source: string;
  sourceSection?: string;
  confidence: FieldConfidence;
  confidenceScore: number;
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
  globalConfidenceScore: number;
}

// ============================================================================
// LOCATION ANALYSIS
// ============================================================================

export interface LocationScoreDimension {
  key: string;
  label: string;
  score: number;
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
  overallScore: number;
  dimensions: LocationScoreDimension[];
  reachability: ReachabilityEntry[];
  microMapUrl: string | null;
  macroMapUrl: string | null;
  streetViewUrl: string | null;
  /** V9.3: Additional map types */
  satelliteMapUrl?: string | null;
  hybridMapUrl?: string | null;
  terrainMapUrl?: string | null;
  /** Pre-fetched Base64 images for CORS-free PDF embedding */
  microMapBase64?: string | null;
  macroMapBase64?: string | null;
  streetViewBase64?: string | null;
  satelliteMapBase64?: string | null;
  hybridMapBase64?: string | null;
  narrative: string;
  /** V9.3: Rich multi-paragraph property assessment */
  propertyAssessment?: string | null;
  /** V9.1: MFH Unit-aware valuation */
  unitsDetail?: ValuationUnitDetail[] | null;
  mfhMultiUnit?: boolean;
  narrativeConfidence: ConfidenceLevel;
}

// ============================================================================
// V9.1: MFH UNIT DETAIL (für Einzelwohnungs-basierte Bewertung)
// ============================================================================

export interface ValuationUnitDetail {
  id: string;
  areaSqm: number;
  rooms: number | null;
  floor: number | null;
  rentCold: number | null;
}

/** V9.2: Modernisierungsbonus + Kernsanierung für Report */
export interface RenovationData {
  coreRenovated: boolean;
  renovationYear: number | null;
  modernisierungsbonus: number;
}

// ============================================================================
// COMP POSTINGS
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
  cashflowAfterDebt: number | null;
  trafficLight: TrafficLight;
}

export interface StressTestConfig {
  label: string;
  interestDelta: number;
  rentDelta: number;
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
// LIEN PROXY (BELEIHUNGSWERT PROXY — legacy, kept for backwards compat)
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
  safeLtvWindow: [number, number];
  riskDrivers: LienProxyRiskDriver[];
}

// ============================================================================
// DEBT SERVICE
// ============================================================================

export interface DebtServiceResult {
  dscr: number | null;
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
  delta: number;
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
// REPORT (V9.0: Kurzgutachten-Standard)
// ============================================================================

export type ReportChapter = 
  | 'deckblatt'
  | 'grundbuch'
  | 'bodenwert'
  | 'sachwert_marktwert'
  | 'sachwert_beleihungswert'
  | 'ertragswert_marktwert'
  | 'ertragswert_beleihungswert'
  | 'vergleichswert'
  | 'vorschlagswerte'
  | 'standortanalyse'
  | 'ergebnisuebersicht'
  | 'audit_trail';

export const REPORT_CHAPTERS: { key: ReportChapter; title: string; pageTarget: number }[] = [
  { key: 'deckblatt', title: 'Deckblatt — Marktwert & Beleihungswert', pageTarget: 1 },
  { key: 'grundbuch', title: 'Grundbuch & Eigentum', pageTarget: 1 },
  { key: 'bodenwert', title: 'Bodenwert & Restnutzungsdauer', pageTarget: 1 },
  { key: 'sachwert_marktwert', title: 'Sachwert (Marktwert)', pageTarget: 1 },
  { key: 'sachwert_beleihungswert', title: 'Sachwert (Beleihungswert)', pageTarget: 1 },
  { key: 'ertragswert_marktwert', title: 'Ertragswert (Marktwert)', pageTarget: 1 },
  { key: 'ertragswert_beleihungswert', title: 'Ertragswert (Beleihungswert)', pageTarget: 1 },
  { key: 'vergleichswert', title: 'Vergleichswert', pageTarget: 1 },
  { key: 'vorschlagswerte', title: 'Vorschlagswerte & KI-Recherche', pageTarget: 1 },
  { key: 'standortanalyse', title: 'Standortanalyse', pageTarget: 1 },
  { key: 'ergebnisuebersicht', title: 'Ergebnisübersicht', pageTarget: 1 },
  { key: 'audit_trail', title: 'Geänderte Werte & Annahmen', pageTarget: 1 },
];

// ============================================================================
// STAGE OUTPUT SHAPES
// ============================================================================

/** V9.2: Preflight warning/blocker for KI-Validierung */
export interface PreflightWarning {
  field: string;
  severity: 'warning' | 'blocker';
  message: string;
  suggestedAction?: string;
}

export interface PreflightOutput {
  creditsCost: number;
  sources: { name: string; type: string; pages?: number }[];
  totalEstimatedPages: number;
  limitsOk: boolean;
  googleApiAvailable: boolean;
  scraperAvailable: boolean;
  sourceMode: ValuationSourceMode;
  sourceModeLabel: string;
  /** V9.2: KI-Preflight validation warnings */
  warnings?: PreflightWarning[];
  /** V9.2: KI-Preflight blockers — prevent valuation start */
  blockers?: PreflightWarning[];
}

export interface IntakeOutput {
  snapshot: CanonicalPropertySnapshot;
  extractedFields: EvidenceEntry[];
  missingFields: MissingField[];
  evidenceMap: EvidenceEntry[];
  diffs: DiffEntry[];
}

export interface NormLocationOutput {
  normalizedSnapshot: CanonicalPropertySnapshot;
  warnings: PlausibilityWarning[];
  assumptions: Assumption[];
  locationAnalysis: LocationAnalysis;
  dataQuality: DataQuality;
  geminiResearch: GeminiResearchResult;
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
  beleihungswert: BeleihungswertResult;
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
  sourceMode: ValuationSourceMode;
  propertyId: string | null;
  draftSourceRef: string | null;
  status: ValuationCaseStatus;
  creditsCharged: number;
  currentStage: ValuationStageId;
  stageTimings: Record<string, number>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// SSOT PROPERTY DATA SHAPES
// ============================================================================

export interface SSOTPropertyData {
  property: {
    id: string;
    address: string;
    city: string;
    postal_code: string;
    property_type: string;
    year_built: number | null;
    market_value: number | null;
    purchase_price: number | null;
    acquisition_costs: number | null;
    total_area_sqm: number | null;
    plot_area_sqm: number | null;
    latitude: number | null;
    longitude: number | null;
    land_register_court: string | null;
    land_register_sheet: string | null;
    land_register_volume: string | null;
    parcel_number: string | null;
    weg_flag: boolean;
    te_number: string | null;
    ownership_share_percent: number | null;
    unit_ownership_nr: string | null;
    condition_grade: string | null;
    energy_certificate_value: string | null;
  };
  units: Array<{
    id: string;
    area_sqm: number | null;
    rooms: number | null;
    hausgeld_monthly: number | null;
    current_monthly_rent: number | null;
    condition_grade: string | null;
    mea_share: number | null;
    parking_count: number | null;
  }>;
  leases: Array<{
    id: string;
    rent_cold_eur: number | null;
    nk_advance_eur: number | null;
    heating_advance_eur: number | null;
    status: string | null;
    start_date: string | null;
  }>;
  loans: Array<{
    id: string;
    outstanding_balance_eur: number | null;
    interest_rate_percent: number | null;
    repayment_rate_percent: number | null;
    annuity_monthly_eur: number | null;
    fixed_interest_end_date: string | null;
    bank_name: string | null;
  }>;
}
