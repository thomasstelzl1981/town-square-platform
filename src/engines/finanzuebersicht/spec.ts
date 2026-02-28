/**
 * Engine 8: Finanzübersicht — Types & Constants
 * Pure type definitions for the financial overview aggregation engine.
 */

// ─── Output Types ────────────────────────────────────────────

export interface FUIncome {
  netIncomeTotal: number;
  selfEmployedIncome: number;
  rentalIncomePortfolio: number;
  sideJobIncome: number;
  childBenefit: number;
  otherIncome: number;
  pvIncome: number;
  taxBenefitRental: number;
  totalIncome: number;
}

export interface FUExpenses {
  warmRent: number;
  privateLoans: number;
  portfolioLoans: number;
  pvLoans: number;
  healthInsurance: number;
  insurancePremiums: number;
  savingsContracts: number;
  investmentContracts: number;
  subscriptions: number;
  livingExpenses: number;
  manualRent: number;
  alimony: number;
  otherManualExpenses: number;
  totalExpenses: number;
}

export interface FUAssets {
  propertyValue: number;
  homeValue: number;
  bankSavings: number;
  securities: number;
  surrenderValues: number;
  depotValue: number;
  vorsorgeBalance: number;
  vehicleValue: number;
  totalAssets: number;
}

export interface FULiabilities {
  portfolioDebt: number;
  homeDebt: number;
  pvDebt: number;
  otherDebt: number;
  totalLiabilities: number;
}

export interface FUProjectionYear {
  year: number;
  propertyValue: number;
  cumulativeSavings: number;
  remainingDebt: number;
  netWealth: number;
}

export interface FUContractSummary {
  id: string;
  type: string;
  provider: string;
  monthlyAmount: number;
  contractNo?: string;
}

export interface FUSubscriptionsByCategory {
  category: string;
  label: string;
  items: Array<{ id: string; merchant: string; amount: number; status: string }>;
  subtotal: number;
}

export interface FUEnergyContract {
  id: string;
  category: string;
  providerName: string;
  contractNumber: string | null;
  monthlyCost: number;
  startDate: string | null;
}

export interface FUPropertyListItem {
  id: string;
  label: string;
  city: string;
  type: string;
  marketValue: number;
  purchasePrice: number;
}

export interface FULoanListItem {
  id: string;
  bank: string;
  assignment: string;
  loanAmount: number;
  remainingBalance: number;
  interestRate: number;
  monthlyRate: number;
}

export interface FUDepotPositionItem {
  id: string;
  depotName: string;
  name: string;
  isin: string | null;
  currentValue: number;
  purchaseValue: number;
  profitOrLoss: number;
}

export interface FUResult {
  income: FUIncome;
  expenses: FUExpenses;
  assets: FUAssets;
  liabilities: FULiabilities;
  monthlyAmortization: number;
  monthlySavings: number;
  netWealth: number;
  liquidityPercent: number;
  projection: FUProjectionYear[];
  savingsContracts: FUContractSummary[];
  investmentContracts: FUContractSummary[];
  insuranceContracts: FUContractSummary[];
  loanContracts: FUContractSummary[];
  vorsorgeContracts: FUContractSummary[];
  subscriptionsByCategory: FUSubscriptionsByCategory[];
  energyContracts: FUEnergyContract[];
  propertyList: FUPropertyListItem[];
  loanList: FULoanListItem[];
  depotPositionList: FUDepotPositionItem[];
  testamentCompleted: boolean;
  patientenverfuegungCompleted: boolean;
}

// ─── Input Types (raw DB rows, loosely typed) ────────────────

export interface FUHouseholdPerson {
  id: string;
  role?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  net_income_monthly?: number | null;
  gross_income_monthly?: number | null;
  business_income_monthly?: number | null;
  pv_income_monthly?: number | null;
  child_allowances?: number | null;
  employment_status?: string | null;
  other_income_monthly?: number | null;
}

export interface FUDepotAccount {
  id: string;
  account_name?: string | null;
  bank_name?: string | null;
  status?: string | null;
}

export interface FUDepotPosition {
  id: string;
  depot_account_id?: string | null;
  name?: string | null;
  isin?: string | null;
  current_value?: number | null;
  purchase_value?: number | null;
  profit_or_loss?: number | null;
}

export interface FUVehicle {
  id: string;
  make?: string | null;
  model?: string | null;
  estimated_value_eur?: number | null;
}

export interface FUApplicantProfile {
  net_income_monthly?: number | null;
  self_employed_income_monthly?: number | null;
  side_job_income_monthly?: number | null;
  child_benefit_monthly?: number | null;
  other_regular_income_monthly?: number | null;
  rental_income_monthly?: number | null;
  living_expenses_monthly?: number | null;
  current_rent_monthly?: number | null;
  health_insurance_monthly?: number | null;
  bank_savings?: number | null;
  securities_value?: number | null;
  life_insurance_value?: number | null;
}

export interface FUPortfolioSummary {
  annualIncome: number;
  annualInterest: number;
  annualAmortization: number;
  totalValue: number;
  totalDebt: number;
  avgInterestRate?: number;
}

export interface FUHome {
  id: string;
  name?: string;
  market_value?: number | null;
  ownership_type?: string | null;
  city?: string | null;
  address?: string | null;
}

export interface FUMietyLoan {
  id: string;
  bank_name?: string | null;
  loan_amount?: number | null;
  remaining_balance?: number | null;
  monthly_rate?: number | null;
  interest_rate?: number | null;
  loan_type?: string | null;
}

export interface FUTenancy {
  total_rent?: number | null;
  base_rent?: number | null;
  additional_costs?: number | null;
}

export interface FUInsuranceContract {
  id: string;
  category?: string | null;
  insurer?: string | null;
  premium?: number | null;
  payment_interval?: string | null;
  policy_no?: string | null;
  status?: string | null;
}

export interface FUVorsorgeContract {
  id: string;
  contract_type?: string | null;
  provider?: string | null;
  premium?: number | null;
  payment_interval?: string | null;
  contract_no?: string | null;
  status?: string | null;
  current_balance?: number | null;
}

export interface FUSubscription {
  id: string;
  merchant?: string | null;
  category?: string | null;
  amount?: number | null;
  frequency?: string | null;
  status?: string | null;
}

export interface FUMietyContract {
  id: string;
  category?: string | null;
  provider_name?: string | null;
  contract_number?: string | null;
  monthly_cost?: number | null;
  start_date?: string | null;
}

export interface FUPvPlant {
  id: string;
  loan_bank?: string | null;
  loan_amount?: number | null;
  loan_monthly_rate?: number | null;
  loan_interest_rate?: number | null;
  loan_remaining_balance?: number | null;
  annual_yield_kwh?: number | null;
  feed_in_tariff_cents?: number | null;
  annual_revenue?: number | null;
}

export interface FUPrivateLoan {
  id: string;
  loan_purpose?: string | null;
  bank_name?: string | null;
  loan_amount?: number | null;
  remaining_balance?: number | null;
  interest_rate?: number | null;
  monthly_rate?: number | null;
  status?: string | null;
}

export interface FUPortfolioLoan {
  id: string;
  bank_name?: string | null;
  original_amount?: number | null;
  outstanding_balance_eur?: number | null;
  annuity_monthly_eur?: number | null;
  interest_rate_percent?: number | null;
  property_id: string;
}

export interface FUPortfolioProperty {
  id: string;
  code?: string | null;
  city?: string | null;
  address?: string | null;
  market_value?: number | null;
  purchase_price?: number | null;
  property_type?: string | null;
  status?: string | null;
}

export interface FULegalDoc {
  document_type?: string | null;
  is_completed?: boolean | null;
}

export interface FUKVContract {
  type: string;
  monthlyPremium: number;
  employerContribution?: number;
}

/** Manual expense entry from manual_expenses table */
export interface FUManualExpense {
  id: string;
  category: 'miete' | 'unterhalt' | 'sonstige';
  label: string;
  monthly_amount: number;
}

/** All raw inputs needed by the engine */
export interface FUInput {
  applicantProfiles: FUApplicantProfile[];
  householdPersons: FUHouseholdPerson[];
  portfolioSummary: FUPortfolioSummary | null;
  homes: FUHome[];
  mietyLoans: FUMietyLoan[];
  tenancies: FUTenancy[];
  insuranceData: FUInsuranceContract[];
  vorsorgeData: FUVorsorgeContract[];
  subscriptions: FUSubscription[];
  mietyContracts: FUMietyContract[];
  pvPlants: FUPvPlant[];
  privateLoans: FUPrivateLoan[];
  portfolioLoans: FUPortfolioLoan[];
  portfolioProperties: FUPortfolioProperty[];
  legalDocs: FULegalDoc[];
  kvContracts: FUKVContract[];
  depotAccounts: FUDepotAccount[];
  depotPositions: FUDepotPosition[];
  vehicles: FUVehicle[];
  manualExpenses: FUManualExpense[];
}

// ─── Constants ───────────────────────────────────────────────

/** Living expense rate as fraction of employment income */
export const LIVING_EXPENSE_RATE = 0.35;

/** Annual property appreciation rate */
export const PROPERTY_APPRECIATION_RATE = 0.02;

/** Projection horizon in years */
export const PROJECTION_YEARS = 40;

/** Building value fraction for AfA calculation */
export const BUILDING_VALUE_FRACTION = 0.80;

/** AfA rate per year */
export const AFA_RATE = 0.02;

/** Marginal tax rate for rental tax benefit */
export const MARGINAL_TAX_RATE = 0.42;

/** Default average interest rate if not provided */
export const DEFAULT_AVG_INTEREST_RATE = 0.03;

/** Kindergeld per child (2026 rate) */
export const KINDERGELD_PER_CHILD = 250;

/** Subscription category labels */
export const SUBSCRIPTION_CATEGORY_LABELS: Record<string, string> = {
  streaming_video: 'Streaming (Video)',
  streaming_audio: 'Streaming (Audio)',
  telecom_mobile: 'Mobilfunk',
  telecom_internet: 'Internet',
  software: 'Software',
  news_media: 'Nachrichten & Medien',
  fitness: 'Fitness & Sport',
  other: 'Sonstiges',
};
