/**
 * R-8: Extracted types from PortfolioTab.tsx
 */
export interface PortfolioLandlordContext {
  id: string;
  name: string;
  context_type: string;
  is_default: boolean | null;
  tax_regime: string | null;
  tax_rate_percent: number | null;
  street: string | null;
  house_number: string | null;
  postal_code: string | null;
  city: string | null;
  hrb_number: string | null;
  ust_id: string | null;
  legal_form: string | null;
  managing_director: string | null;
  taxable_income_yearly?: number | null;
  tax_assessment_type?: string | null;
  church_tax?: boolean | null;
  children_count?: number | null;
}

export interface UnitWithProperty {
  id: string;
  unit_number: string | null;
  area_sqm: number | null;
  property_id: string;
  property_code: string | null;
  property_type: string;
  address: string;
  city: string;
  postal_code: string | null;
  market_value: number | null;
  annual_net_cold_rent: number;
  annuity_pa: number;
  interest_pa: number;
  amortization_pa: number;
  financing_balance: number | null;
  tenant_name: string | null;
  leases_count: number;
}

export interface LoanData {
  id: string;
  property_id: string;
  outstanding_balance_eur: number | null;
  annuity_monthly_eur: number | null;
  interest_rate_percent: number | null;
}

export interface LeaseData {
  unit_id: string;
  monthly_rent: number | null;
  rent_cold_eur: number | null;
  status: string;
  contacts: {
    first_name: string;
    last_name: string;
    company: string | null;
  } | null;
}

export interface PortfolioTotals {
  unitCount: number;
  propertyCount: number;
  totalArea: number;
  totalValue: number;
  totalIncome: number;
  totalDebt: number;
  totalAnnuity: number;
  netWealth: number;
  avgYield: number;
  avgInterestRate: number;
}

export interface NkAggregation {
  hasData: boolean;
  annualTotal: number | null;
}
