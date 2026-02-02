// ============================================================
// Types for the Immobilienakte (Unit Dossier) SSOT System
// MOD-04 - All property/unit data lives here as Single Source of Truth
// ============================================================

// ============================================================
// ENUMS
// ============================================================

export type PropertyCategory = 'einzelobjekt' | 'globalobjekt';
export type PropertyStatus = 'aktiv' | 'in_pruefung' | 'archiviert' | 'verkauft';
export type ReportingRegime = 'VuV' | 'SuSa_BWA';
export type UsageType = 'wohnen' | 'gewerbe' | 'mischnutzung';
export type HeatingType = 'zentralheizung' | 'etagenheizung' | 'fernwaerme' | 'waermepumpe' | 'sonstige';
export type EnergySource = 'gas' | 'oel' | 'strom' | 'pellets' | 'solar' | 'fernwaerme' | 'sonstige';
export type AllocationKey = 'SQM' | 'PERSONS' | 'MEA' | 'CONSUMPTION' | 'UNITS';
export type LeaseType = 'unbefristet' | 'befristet' | 'staffel' | 'index' | 'gewerbe';
export type DepositStatus = 'PAID' | 'OPEN' | 'PARTIAL';
export type RentModel = 'FIX' | 'INDEX' | 'STAFFEL';
export type TenancyStatus = 'ACTIVE' | 'VACANT' | 'TERMINATING' | 'ENDED';
export type DossierStatus = 'VERMIETET' | 'LEERSTAND' | 'IN_NEUVERMIETUNG';
export type DataQuality = 'OK' | 'PRUEFEN';
export type AfaMethod = 'linear' | 'degressiv';
export type NKPeriodStatus = 'geplant' | 'laufend' | 'abgeschlossen' | 'korrigiert';

// ============================================================
// BLOCK A: Identity & Stammdaten
// ============================================================
export interface IdentityData {
  propertyId: string;
  unitId?: string;
  tenantId: string;
  publicId: string;
  unitCode: string;
  propertyType?: string;
  category: PropertyCategory;
  status: PropertyStatus;
  saleEnabled: boolean;
  rentalManaged: boolean;
  vermieterKontextId?: string;
  reportingRegime: ReportingRegime;
}

// ============================================================
// BLOCK B: Address & Location
// ============================================================
export interface AddressData {
  street: string;
  houseNumber?: string;
  postalCode: string;
  city: string;
  locationLabel?: string;
  locationNotes?: string;
  latitude?: number;
  longitude?: number;
}

// ============================================================
// BLOCK C: Building & Areas
// ============================================================
export interface BuildingData {
  buildYear?: number;
  usageType: UsageType;
  areaLivingSqm: number;
  areaUsableSqm?: number;
  roomsCount?: number;
  bathroomsCount?: number;
  floor?: number;
  unitNumber?: string;
  heatingType?: HeatingType;
  energySource?: EnergySource;
  energyCertType?: string;
  energyCertValue?: number;
  energyCertValidUntil?: string;
  featuresTags?: string[];
}

// ============================================================
// BLOCK D: Legal / Land Register & Acquisition
// ============================================================
export interface LegalData {
  landRegisterCourt?: string;
  landRegisterOf?: string;
  landRegisterSheet?: string;
  landRegisterVolume?: string;
  parcelNumber?: string;
  teNumber?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  marketValue?: number;
  acquisitionCosts?: number;
}

// ============================================================
// BLOCK E: Investment KPIs (Derived)
// ============================================================
export interface InvestmentKPIs {
  annualIncome?: number;
  grossYieldPercent?: number;
  netYieldPercent?: number;
  cashflowMonthly?: number;
  vacancyDays?: number;
}

// ============================================================
// BLOCK F: Tenancy / Lease Data
// ============================================================
export interface TenancyData {
  leaseId?: string;
  tenantContactId?: string;
  tenantName?: string;
  tenancyStatus: TenancyStatus;
  leaseType: LeaseType;
  startDate?: string;
  endDate?: string;
  rentColdEur?: number;
  rentWarmEur?: number;
  nkAdvanceEur?: number;
  heatingAdvanceEur?: number;
  depositAmountEur?: number;
  depositStatus: DepositStatus;
  paymentDueDay?: number;
  rentModel: RentModel;
  nextRentAdjustmentDate?: string;
}

// ============================================================
// BLOCK G: WEG & Hausgeld / NK
// ============================================================
export interface WEGData {
  wegFlag: boolean;
  meaShare?: number;
  meaTotal?: number;
  hausgeldMonthlyEur?: number;
  allocationKeyDefault: AllocationKey;
  managerContactId?: string;
  managerContactName?: string;
  periodCurrent?: string;
  lastSettlementDate?: string;
  lastSettlementBalanceEur?: number;
  allocatablePaEur?: number;
  nonAllocatablePaEur?: number;
  topCostBlocks?: Record<string, number>;
}

// ============================================================
// BLOCK H: Financing / Loans
// ============================================================
export interface FinancingData {
  loanId?: string;
  bankName?: string;
  loanNumber?: string;
  originalAmountEur?: number;
  outstandingBalanceEur?: number;
  balanceAsofDate?: string;
  interestRatePercent?: number;
  fixedInterestEndDate?: string;
  annuityMonthlyEur?: number;
  repaymentRatePercent?: number;
  specialRepaymentRightEur?: number;
  contactPerson?: ContactInfo;
}

// ============================================================
// BLOCK I: Accounting / AfA
// ============================================================
export interface AccountingData {
  accountingId?: string;
  landSharePercent?: number;
  buildingSharePercent?: number;
  bookValueEur?: number;
  afaRatePercent?: number;
  afaStartDate?: string;
  afaMethod: AfaMethod;
  remainingUsefulLifeYears?: number;
  modernizationCostsEur?: number;
  modernizationYear?: number;
  coaVersion: string;
  accountMappings?: Record<string, string>;
}

// ============================================================
// BLOCK J: Documents
// ============================================================
export interface DocumentStatus {
  docType: string;
  label: string;
  status: 'complete' | 'missing' | 'review';
  documentId?: string;
  path?: string;
}

export interface ContactInfo {
  name?: string;
  phone?: string;
  email?: string;
}

// ============================================================
// FULL DOSSIER DATA (Aggregated View)
// ============================================================
export interface UnitDossierData {
  // Header Display
  unitCode: string;
  address: string;
  locationLabel?: string;
  status: DossierStatus;
  asofDate?: string;
  dataQuality: DataQuality;

  // Block A: Identity
  propertyId: string;
  unitId?: string;
  tenantId: string;
  publicId: string;
  propertyType?: string;
  category: PropertyCategory;
  propertyStatus: PropertyStatus;
  saleEnabled: boolean;
  rentalManaged: boolean;
  vermieterKontextId?: string;
  reportingRegime: ReportingRegime;

  // Block B: Address
  street: string;
  houseNumber?: string;
  postalCode: string;
  city: string;
  locationNotes?: string;
  latitude?: number;
  longitude?: number;

  // Block C: Building
  buildYear?: number;
  usageType: UsageType;
  areaLivingSqm: number;
  areaUsableSqm?: number;
  roomsCount?: number;
  bathroomsCount?: number;
  floor?: number;
  unitNumber?: string;
  heatingType?: string;
  energySource?: string;
  energyCertType?: string;
  energyCertValue?: number;
  energyCertValidUntil?: string;
  featuresTags?: string[];

  // Block D: Legal
  landRegisterCourt?: string;
  landRegisterOf?: string;
  landRegisterSheet?: string;
  landRegisterVolume?: string;
  parcelNumber?: string;
  teNumber?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  marketValue?: number;
  acquisitionCosts?: number;
  wegFlag: boolean;
  meaOrTeNo?: string;

  // Block E: Investment KPIs
  annualIncome?: number;
  grossYieldPercent?: number;
  netYieldPercent?: number;
  cashflowMonthly?: number;
  vacancyDays?: number;
  // Legacy compatibility
  purchasePriceEur?: number;
  purchaseCostsEur?: number;
  valuationEur?: number;
  netColdRentPaEur?: number;
  nonAllocCostsPaEur?: number;
  cashflowPreTaxMonthlyEur?: number;

  // Block F: Tenancy
  leaseId?: string;
  tenantContactId?: string;
  tenantName?: string;
  tenancyStatus: TenancyStatus;
  leaseType: LeaseType;
  startDate?: string;
  endDate?: string;
  rentColdEur?: number;
  rentWarmEur?: number;
  nkAdvanceEur?: number;
  heatingAdvanceEur?: number;
  depositAmountEur?: number;
  depositStatus: DepositStatus;
  paymentDueDay?: number;
  rentModel: RentModel;
  nextRentAdjustmentDate?: string;

  // Block G: WEG/NK
  meaShare?: number;
  meaTotal?: number;
  hausgeldMonthlyEur?: number;
  allocationKeyDefault: AllocationKey;
  managerContactId?: string;
  managerContact?: ContactInfo;
  periodCurrent?: string;
  lastSettlementDate?: string;
  lastSettlementBalanceEur?: number;
  allocatablePaEur?: number;
  nonAllocatablePaEur?: number;
  topCostBlocks?: Record<string, number>;

  // Block H: Financing
  loanId?: string;
  bankName?: string;
  loanNumber?: string;
  originalAmountEur?: number;
  outstandingBalanceEur?: number;
  outstandingBalanceAsof?: string;
  interestRatePercent?: number;
  fixedInterestEndDate?: string;
  annuityMonthlyEur?: number;
  repaymentRatePercent?: number;
  specialRepaymentRight?: { enabled: boolean; amountEur?: number };
  loanContactPerson?: ContactInfo;
  // Legacy compatibility
  contactPerson?: ContactInfo;

  // Block I: Accounting
  accountingId?: string;
  landSharePercent?: number;
  buildingSharePercent?: number;
  bookValueEur?: number;
  afaRatePercent?: number;
  afaStartDate?: string;
  afaMethod: AfaMethod;
  remainingUsefulLifeYears?: number;
  modernizationCostsEur?: number;
  modernizationYear?: number;
  coaVersion: string;
  accountMappings?: Record<string, string>;

  // Block J: Documents
  documents: DocumentStatus[];

  // Legacy compatibility fields
  landRegisterShort?: string;
}

// ============================================================
// EDITABLE FORM DATA (for mutations)
// ============================================================
export interface PropertyFormData {
  // Identity
  code?: string;
  propertyType: string;
  category: PropertyCategory;
  status: PropertyStatus;
  saleEnabled: boolean;
  rentalManaged: boolean;
  landlordContextId?: string;
  reportingRegime: ReportingRegime;

  // Address
  address: string;
  addressHouseNo?: string;
  postalCode: string;
  city: string;
  locationLabel?: string;
  locationNotes?: string;
  latitude?: number;
  longitude?: number;

  // Building
  yearBuilt?: number;
  usageType: string;
  totalAreaSqm?: number;
  heatingType?: string;
  energySource?: string;

  // Legal
  landRegisterCourt?: string;
  landRegisterSheet?: string;
  landRegisterVolume?: string;
  parcelNumber?: string;
  teNumber?: string;
  notaryDate?: string;
  purchasePrice?: number;
  marketValue?: number;
  acquisitionCosts?: number;

  // WEG
  wegFlag: boolean;
  meaTotal?: number;
  allocationKey: AllocationKey;
  managerContact?: ContactInfo;
}

export interface UnitFormData {
  unitNumber: string;
  code?: string;
  areaSqm: number;
  areaUsableSqm?: number;
  rooms?: number;
  bathroomsCount?: number;
  floor?: number;
  heatingSupply?: string;
  energyCertificateValue?: number;
  energyCertificateValidUntil?: string;
  featuresTags?: string[];
  meaShare?: number;
  hausgeldMonthly?: number;
  vacancyDays?: number;
}

export interface LeaseFormData {
  tenantContactId: string;
  unitId: string;
  startDate: string;
  endDate?: string;
  leaseType: LeaseType;
  rentColdEur: number;
  nkAdvanceEur?: number;
  heatingAdvanceEur?: number;
  depositAmountEur?: number;
  depositStatus: DepositStatus;
  paymentDueDay?: number;
  rentModel: RentModel;
  nextRentAdjustmentEarliestDate?: string;
}

export interface LoanFormData {
  bankName: string;
  loanNumber: string;
  originalAmount?: number;
  outstandingBalanceEur?: number;
  outstandingBalanceAsof?: string;
  interestRatePercent?: number;
  fixedInterestEndDate?: string;
  annuityMonthlyEur?: number;
  repaymentRatePercent?: number;
  specialRepaymentRightEurPerYear?: number;
  contactPerson?: ContactInfo;
  propertyId?: string;
  unitId?: string;
}

export interface NKPeriodFormData {
  propertyId: string;
  periodStart: string;
  periodEnd: string;
  allocationKeyDefault?: AllocationKey;
  settlementDate?: string;
  settlementBalanceEur?: number;
  allocatableEur?: number;
  nonAllocatableEur?: number;
  topCostBlocks?: Record<string, number>;
  status?: NKPeriodStatus;
}

export interface AccountingFormData {
  propertyId: string;
  landSharePercent?: number;
  buildingSharePercent?: number;
  bookValueEur?: number;
  afaRatePercent?: number;
  afaStartDate?: string;
  afaMethod: AfaMethod;
  remainingUsefulLifeYears?: number;
  modernizationCostsEur?: number;
  modernizationYear?: number;
  coaVersion: string;
  accountMappings?: Record<string, string>;
}

// ============================================================
// DOCUMENT EXTRACTION TYPES (unchanged from original)
// ============================================================

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

export const CONFIDENCE_GATES = {
  AUTO_ACCEPTED: 0.90,
  NEEDS_REVIEW: 0.70,
  UNASSIGNED: 0.00,
} as const;

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

export type PostingStatus = 'DRAFT' | 'CONFIRMED' | 'LOCKED';
export type MatchStatus = 'AUTO_MATCHED' | 'NEEDS_REVIEW' | 'UNMATCHED';
