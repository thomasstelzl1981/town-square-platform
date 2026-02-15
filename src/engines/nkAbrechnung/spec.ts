/**
 * NK-Abrechnung Engine SPEC — Single Source of Truth
 * 
 * Typdefinitionen, Enums und Interfaces fuer die Nebenkostenabrechnungs-Engine.
 * Grundsteuer wird IMMER als Direktzahlung des Eigentuemers behandelt
 * (nicht im Hausgeld enthalten). Der Grundsteuerbescheid ist Pflichtdokument.
 */

// ─── Kostenarten-Taxonomie (BetrKV §2) ─────────────────────────────────────

export enum NKCostCategory {
  // Umlagefaehige Kosten (BetrKV §2 Nr. 1–17)
  GRUNDSTEUER = 'grundsteuer',
  WASSER = 'wasser',
  ABWASSER = 'abwasser',
  HEIZUNG = 'heizung',
  WARMWASSER = 'warmwasser',
  AUFZUG = 'aufzug',
  STRASSENREINIGUNG = 'strassenreinigung',
  MUELL = 'muell',
  GEBAEUDEREINIGUNG = 'gebaeudereinigung',
  GARTENPFLEGE = 'gartenpflege',
  BELEUCHTUNG = 'beleuchtung',
  SCHORNSTEINFEGER = 'schornsteinfeger',
  SACHVERSICHERUNG = 'sachversicherung',
  HAUSMEISTER = 'hausmeister',
  ANTENNE_KABEL = 'antenne_kabel',
  WASCHEINRICHTUNG = 'wascheinrichtung',
  SONSTIGE_BETRIEBSKOSTEN = 'sonstige_betriebskosten',
  NIEDERSCHLAGSWASSER = 'niederschlagswasser',

  // Nicht umlagefaehige Kosten
  VERWALTUNG = 'verwaltung',
  RUECKLAGE = 'ruecklage',
  INSTANDHALTUNG = 'instandhaltung',
  NICHT_UMLAGEFAEHIG = 'nicht_umlagefaehig',
}

export const APPORTIONABLE_CATEGORIES = new Set<NKCostCategory>([
  NKCostCategory.GRUNDSTEUER,
  NKCostCategory.WASSER,
  NKCostCategory.ABWASSER,
  NKCostCategory.HEIZUNG,
  NKCostCategory.WARMWASSER,
  NKCostCategory.AUFZUG,
  NKCostCategory.STRASSENREINIGUNG,
  NKCostCategory.MUELL,
  NKCostCategory.GEBAEUDEREINIGUNG,
  NKCostCategory.GARTENPFLEGE,
  NKCostCategory.BELEUCHTUNG,
  NKCostCategory.SCHORNSTEINFEGER,
  NKCostCategory.SACHVERSICHERUNG,
  NKCostCategory.HAUSMEISTER,
  NKCostCategory.ANTENNE_KABEL,
  NKCostCategory.WASCHEINRICHTUNG,
  NKCostCategory.SONSTIGE_BETRIEBSKOSTEN,
  NKCostCategory.NIEDERSCHLAGSWASSER,
]);

// ─── Verteilerschluessel ────────────────────────────────────────────────────

export enum AllocationKeyType {
  AREA_SQM = 'area_sqm',
  MEA = 'mea',
  PERSONS = 'persons',
  CONSUMPTION = 'consumption',
  UNIT_COUNT = 'unit_count',
  CUSTOM = 'custom',
}

// ─── Readiness / Workflow Status ────────────────────────────────────────────

export enum NKReadinessStatus {
  MISSING_DOCS = 'MISSING_DOCS',
  NEEDS_REVIEW = 'NEEDS_REVIEW',
  READY = 'READY',
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  EXPORTED = 'EXPORTED',
}

// ─── Interfaces ─────────────────────────────────────────────────────────────

/** Extrahierte Kostenposition aus WEG-Abrechnung oder Grundsteuerbescheid */
export interface NKCostItem {
  id: string;
  nkPeriodId: string;
  categoryCode: NKCostCategory;
  labelRaw: string;
  labelDisplay: string;
  amountTotalHouse: number;
  amountUnit: number | null;
  keyType: AllocationKeyType;
  keyBasisUnit: number | null;
  keyBasisTotal: number | null;
  isApportionable: boolean;
  reasonCode: string;
  mappingConfidence: number;
  mappingSource: 'rule' | 'ai' | 'manual';
  sourceDocumentId: string | null;
  sortOrder: number;
}

/** Pflichtdokument-Anforderung */
export interface NKDocRequirement {
  docType: string;
  label: string;
  required: boolean;
  status: 'missing' | 'pending' | 'needs_review' | 'accepted';
  documentId: string | null;
  acceptedAt: string | null;
}

/** Einzelzeile in der Abrechnungsmatrix */
export interface NKMatrixRow {
  categoryCode: NKCostCategory;
  label: string;
  keyType: AllocationKeyType;
  totalHouse: number;
  basisUnit: number | null;
  basisTotal: number | null;
  shareUnit: number;
  isApportionable: boolean;
}

/** Zusammenfassung der Abrechnung */
export interface NKSettlementSummary {
  totalApportionable: number;
  totalHeating: number;
  totalCostsTenant: number;
  prepaidNK: number;
  prepaidHeating: number;
  totalPrepaid: number;
  balance: number; // positiv = Nachzahlung, negativ = Guthaben
}

/** Vollstaendige Abrechnungsmatrix pro Lease */
export interface NKSettlementMatrix {
  header: {
    propertyId: string;
    propertyName: string;
    unitId: string;
    unitLabel: string;
    leaseId: string;
    tenantName: string;
    periodStart: string;
    periodEnd: string;
    leasePeriodStart: string;
    leasePeriodEnd: string;
    daysRatio: string;
    leaseDaysInPeriod: number;
    totalDaysInPeriod: number;
  };
  rows: NKMatrixRow[];
  summary: NKSettlementSummary;
  validation: {
    warnings: string[];
    missingDocs: string[];
    lowConfidenceItems: string[];
  };
}

/** Readiness-Pruefergebnis fuer eine Property + Jahr */
export interface NKReadinessResult {
  status: NKReadinessStatus;
  propertyId: string;
  year: number;
  documents: NKDocRequirement[];
  leaseCount: number;
  canCalculate: boolean;
  blockers: string[];
}
