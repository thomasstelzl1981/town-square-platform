/**
 * V+V Steuer Engine — Type Specifications
 * Pure types for Anlage V tax calculation
 */

/** Data from property_accounting table */
export interface VVAfaStammdaten {
  buildingSharePercent: number;
  landSharePercent: number;
  afaRatePercent: number;
  afaStartDate: string | null;
  afaMethod: string | null;
  modernizationCostsEur: number;
  modernizationYear: number | null;
}

/** Aggregated from leases for a property+year */
export interface VVIncomeAggregated {
  coldRentAnnual: number;
  nkAdvanceAnnual: number;
  nkNachzahlung: number;
}

/** Aggregated from loans/property_financing */
export interface VVFinancingAggregated {
  loanInterestAnnual: number;
}

/** Aggregated from nk_cost_items */
export interface VVNKAggregated {
  grundsteuer: number;
  nonRecoverableCosts: number;
}

/** Manual yearly entries from vv_annual_data */
export interface VVAnnualManualData {
  id?: string;
  propertyId: string;
  taxYear: number;
  
  incomeOther: number;
  incomeInsurancePayout: number;
  
  costDisagio: number;
  costFinancingFees: number;
  costMaintenance: number;
  costManagementFee: number;
  costLegalAdvisory: number;
  costInsuranceNonRecoverable: number;
  costTravel: number;
  costBankFees: number;
  costOther: number;
  
  vacancyDays: number;
  vacancyIntentConfirmed: boolean;
  relativeRental: boolean;
  heritageAfaAmount: number;
  specialAfaAmount: number;
  
  confirmed: boolean;
  status: 'draft' | 'confirmed' | 'locked';
  notes: string;
}

/** Complete property tax data (merged from all sources) */
export interface VVPropertyTaxData {
  propertyId: string;
  propertyName: string;
  propertyType: string;
  address: string;
  city: string;
  postalCode: string;
  yearBuilt: number | null;
  purchasePrice: number;
  acquisitionCosts: number;
  taxReferenceNumber: string;
  ownershipSharePercent: number;
  areaSqm: number | null;
  
  afa: VVAfaStammdaten;
  incomeAggregated: VVIncomeAggregated;
  financingAggregated: VVFinancingAggregated;
  nkAggregated: VVNKAggregated;
  manualData: VVAnnualManualData;
}

/** Calculated result for a single property */
export interface VVPropertyResult {
  // Einnahmen
  totalIncome: number;
  incomeBreakdown: {
    coldRent: number;
    nkAdvance: number;
    nkNachzahlung: number;
    other: number;
    insurancePayout: number;
  };
  
  // Werbungskosten
  totalCosts: number;
  costsBreakdown: {
    financing: {
      loanInterest: number;
      disagio: number;
      financingFees: number;
      subtotal: number;
    };
    operating: {
      grundsteuer: number;
      nonRecoverableNK: number;
      maintenance: number;
      managementFee: number;
      legalAdvisory: number;
      insuranceNonRecoverable: number;
      travel: number;
      bankFees: number;
      other: number;
      subtotal: number;
    };
    afa: {
      basis: number;
      rate: number;
      amount: number;
      heritage: number;
      special: number;
      subtotal: number;
    };
  };
  
  // Ergebnis
  surplus: number; // positive = Überschuss, negative = Verlust
}

/** Context-level summary (all properties of a Vermietereinheit) */
export interface VVContextSummary {
  contextId: string;
  contextName: string;
  contextType: string;
  taxNumber: string;
  taxYear: number;
  properties: Array<{
    propertyId: string;
    propertyName: string;
    result: VVPropertyResult;
    confirmed: boolean;
  }>;
  totalIncome: number;
  totalCosts: number;
  totalSurplus: number;
  allConfirmed: boolean;
}
