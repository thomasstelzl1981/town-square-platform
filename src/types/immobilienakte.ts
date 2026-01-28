// Types for the Immobilienakte (Unit Dossier) system

export interface UnitDossierData {
  // Header (Block 1)
  unitCode: string;
  address: string;
  locationLabel?: string;
  status: 'VERMIETET' | 'LEERSTAND' | 'IN_NEUVERMIETUNG';
  asofDate?: string;
  dataQuality: 'OK' | 'PRUEFEN';
  
  // Identity (Block 1)
  propertyType?: string;
  buildYear?: number;
  wegFlag?: boolean;
  meaOrTeNo?: string;
  
  // Core Data (Block 2)
  areaLivingSqm: number;
  roomsCount?: number;
  bathroomsCount?: number;
  heatingType?: string;
  energySource?: string;
  energyCertificateValue?: number;
  energyCertificateValidUntil?: string;
  featuresTags?: string[];
  
  // Tenancy (Block 3)
  tenancyStatus: 'ACTIVE' | 'VACANT' | 'TERMINATING' | 'ENDED';
  startDate?: string;
  rentColdEur?: number;
  nkAdvanceEur?: number;
  heatingAdvanceEur?: number;
  rentWarmEur?: number;
  paymentDueDay?: number;
  depositAmountEur?: number;
  depositStatus?: 'PAID' | 'OPEN' | 'PARTIAL';
  rentModel?: 'FIX' | 'INDEX' | 'STAFFEL';
  nextRentAdjustmentDate?: string;
  
  // NK/WEG (Block 4)
  periodCurrent?: string;
  allocationKeyDefault?: 'SQM' | 'PERSONS' | 'MEA' | 'CONSUMPTION' | 'UNITS';
  lastSettlementDate?: string;
  lastSettlementBalanceEur?: number;
  hausgeldMonthlyEur?: number;
  allocatablePaEur?: number;
  nonAllocatablePaEur?: number;
  topCostBlocks?: Record<string, number>;
  
  // Investment KPIs (Block 5)
  purchasePriceEur?: number;
  purchaseCostsEur?: number;
  valuationEur?: number;
  netColdRentPaEur?: number;
  nonAllocCostsPaEur?: number;
  cashflowPreTaxMonthlyEur?: number;
  grossYieldPercent?: number;
  netYieldPercent?: number;
  
  // Financing (Block 6)
  bankName?: string;
  loanNumber?: string;
  outstandingBalanceEur?: number;
  outstandingBalanceAsof?: string;
  interestRatePercent?: number;
  fixedInterestEndDate?: string;
  annuityMonthlyEur?: number;
  specialRepaymentRight?: { enabled: boolean; amountEur?: number };
  contactPerson?: ContactInfo;
  
  // Legal (Block 7)
  landRegisterShort?: string;
  managerContact?: ContactInfo;
  
  // Documents (Block 8)
  documents?: DocumentStatus[];
}

export interface ContactInfo {
  name?: string;
  phone?: string;
  email?: string;
}

export interface DocumentStatus {
  docType: string;
  label: string;
  status: 'complete' | 'missing' | 'review';
  path?: string;
}

// Sidecar JSON structure for document extraction
export interface DocumentSidecar {
  doc_meta: {
    doc_id: string;
    doc_type: string;
    scope: 'LANDLORD_CONTEXT' | 'PROPERTY' | 'UNIT' | 'TENANCY' | 'LOAN';
    doc_date: string | null;
    service_period_start: string | null;
    service_period_end: string | null;
    vendor: string | null;
    source_channel: 'UPLOAD' | 'EMAIL' | 'CONNECTOR' | 'API';
    classification_trace?: { classifier: string; confidence: number };
  };
  extracted_fields: Array<{
    dp_key: string;
    value: unknown;
    confidence: number;
    evidence_span?: string;
  }>;
  entity_matches: {
    property_id?: { id: string; confidence: number };
    unit_id?: { id: string; confidence: number };
    tenancy_id?: { id: string; confidence: number };
    loan_id?: { id: string; confidence: number };
  };
  posting_suggestions?: Array<{
    posting_type: string;
    amount: number;
    accounting_category: string;
    tax_category: string;
    confidence: number;
    source_refs: string[];
  }>;
  review_state: 'AUTO_ACCEPTED' | 'NEEDS_REVIEW' | 'UNASSIGNED';
  versioning: {
    extracted_at: string;
    extractor_version: string;
    mapping_rules_version: string;
  };
}

// Matching confidence gates
export const CONFIDENCE_GATES = {
  AUTO_ACCEPTED: 0.90,   // Can create draft records
  NEEDS_REVIEW: 0.70,    // Queue for user confirmation
  UNASSIGNED: 0.00,      // Store only
} as const;

// Document types from the catalog
export type DocType = 
  | 'DOC_PROJECT'
  | 'DOC_EXPOSE_BUY'
  | 'DOC_EXPOSE_MISC'
  | 'DOC_LAND_REGISTER'
  | 'DOC_DIVISION_DECLARATION'
  | 'DOC_FLOORPLAN'
  | 'DOC_VALUATION_SHORT'
  | 'DOC_PURCHASE_CONTRACT'
  | 'DOC_LEASE_CONTRACT'
  | 'DOC_INVOICE'
  | 'DOC_WEG_BUCKET'
  | 'DOC_WEG_BUDGET_PLAN'
  | 'DOC_WEG_ANNUAL_STATEMENT'
  | 'DOC_WEG_MINUTES'
  | 'DOC_WEG_RESERVE_DEV'
  | 'DOC_PHOTOS'
  | 'DOC_ENERGY_CERT'
  | 'DOC_INSURANCE_BUILDING'
  | 'DOC_MISC'
  | 'DOC_LOAN_BUCKET'
  | 'DOC_LOAN_CONTRACT'
  | 'DOC_LOAN_BALANCE_NOTICE'
  | 'DOC_RENOVATION'
  | 'DOC_PROPERTY_TAX'
  | 'DOC_NK_STATEMENT'
  | 'DOC_HEATING_STATEMENT';

// Accounting categories for posting engine
export type AccountingCategory =
  | 'INCOME_RENT_COLD'
  | 'INCOME_NK_ADVANCE'
  | 'INCOME_OTHER'
  | 'EXP_BETRKV_UMLEG'
  | 'EXP_NON_UMLEG_ADMIN'
  | 'EXP_MAINTENANCE_REPAIR'
  | 'EXP_INSURANCE'
  | 'EXP_TAX_PROPERTY'
  | 'EXP_BANK_FEES'
  | 'EXP_INTEREST'
  | 'EXP_DEPRECIATION_AFA';

// Posting status workflow
export type PostingStatus = 'DRAFT' | 'CONFIRMED' | 'LOCKED';

// Bank transaction match status
export type MatchStatus = 'AUTO_MATCHED' | 'NEEDS_REVIEW' | 'UNMATCHED';
