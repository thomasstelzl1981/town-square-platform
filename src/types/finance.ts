/**
 * Finance Module Types (MOD-07, MOD-11)
 * 
 * TypeScript definitions for the financing workflow:
 * - Applicant profiles (self-disclosure)
 * - Finance requests
 * - Mandates and case management
 */

// ============================================
// Applicant Profile Types
// ============================================

export type ProfileType = 'private' | 'entrepreneur';
export type PartyRole = 'primary' | 'co_applicant';
export type EmploymentType = 'unbefristet' | 'befristet' | 'beamter' | 'selbststaendig' | 'rentner';
export type MaritalStatus = 'ledig' | 'verheiratet' | 'geschieden' | 'verwitwet' | 'getrennt';
export type FinancePurpose = 'eigennutzung' | 'kapitalanlage' | 'neubau' | 'modernisierung' | 'umschuldung';
export type RentalStatus = 'vermietet' | 'leer' | 'teil';
export type IdDocumentType = 'PA' | 'RP';
export type TaxAssessmentType = 'EINZEL' | 'SPLITTING';

export interface ApplicantProfile {
  id: string;
  tenant_id: string;
  finance_request_id: string | null;
  
  // Type
  profile_type: ProfileType;
  party_role: PartyRole;
  
  // Section 1: Identity (from PDF selbstauskunft.pdf)
  salutation: string | null;
  first_name: string | null;
  last_name: string | null;
  birth_name: string | null;
  birth_date: string | null;
  birth_place: string | null;
  birth_country: string | null;
  nationality: string | null;
  marital_status: MaritalStatus | null;
  address_street: string | null;
  address_postal_code: string | null;
  address_city: string | null;
  address_since: string | null;
  previous_address_street: string | null;
  previous_address_postal_code: string | null;
  previous_address_city: string | null;
  phone: string | null;
  phone_mobile: string | null;
  email: string | null;
  id_document_type: IdDocumentType | null;
  id_document_number: string | null;
  id_document_valid_until: string | null;
  tax_id: string | null;
  
  // Section 2: Household
  property_separation: boolean | null;
  adults_count: number | null;
  children_count: number | null;
  children_ages: string | null;
  children_birth_dates: string | null;
  child_support_obligation: boolean;
  child_support_amount_monthly: number | null;
  child_benefit_monthly: number | null;
  other_regular_income_monthly: number | null;
  other_income_description: string | null;
  
  // Section 3: Employment (Angestellt)
  employer_name: string | null;
  employer_location: string | null;
  employer_industry: string | null;
  employment_type: EmploymentType | null;
  position: string | null;
  employed_since: string | null;
  contract_type: string | null;
  probation_until: string | null;
  employer_in_germany: boolean | null;
  salary_currency: string | null;
  salary_payments_per_year: number | null;
  net_income_monthly: number | null;
  bonus_yearly: number | null;
  
  // Section 3: Employment (Nebentätigkeit)
  has_side_job: boolean | null;
  side_job_type: string | null;
  side_job_since: string | null;
  side_job_income_monthly: number | null;
  
  // Section 3: Employment (Rente)
  vehicles_count: number | null;
  retirement_date: string | null;
  pension_state_monthly: number | null;
  pension_private_monthly: number | null;
  
  // Section 3: Self-employed / Entrepreneur Extension
  company_name: string | null;
  company_legal_form: string | null;
  company_address: string | null;
  company_founded: string | null;
  company_register_number: string | null;
  company_vat_id: string | null;
  company_industry: string | null;
  company_employees: number | null;
  company_ownership_percent: number | null;
  company_managing_director: boolean | null;
  self_employed_income_monthly: number | null;
  
  // Section 4: Bankverbindung
  iban: string | null;
  bic: string | null;
  
  // Section 5: Income (additional fields)
  rental_income_monthly: number | null;
  alimony_income_monthly: number | null;
  
  // Section 6: Expenses
  current_rent_monthly: number | null;
  living_expenses_monthly: number | null;
  car_leasing_monthly: number | null;
  health_insurance_monthly: number | null;
  other_fixed_costs_monthly: number | null;
  
  // Section 7: Assets
  bank_savings: number | null;
  securities_value: number | null;
  building_society_value: number | null;
  life_insurance_value: number | null;
  other_assets_value: number | null;
  other_assets_description: string | null;
  
  // Tax basis fields (mirrored from landlord_contexts)
  taxable_income_yearly: number | null;
  church_tax: boolean | null;
  tax_assessment_type: TaxAssessmentType | null;
  marginal_tax_rate: number | null;
  
  // Legacy: Financing Request fields (now moved to finance_requests table)
  // Keep for backward compatibility but marked as deprecated
  /** @deprecated Use finance_requests table instead */
  purpose: FinancePurpose | null;
  /** @deprecated Use finance_requests table instead */
  object_address: string | null;
  /** @deprecated Use finance_requests table instead */
  object_type: string | null;
  /** @deprecated Use finance_requests table instead */
  purchase_price: number | null;
  /** @deprecated Use finance_requests table instead */
  ancillary_costs: number | null;
  /** @deprecated Use finance_requests table instead */
  modernization_costs: number | null;
  /** @deprecated Use finance_requests table instead */
  planned_rent_monthly: number | null;
  /** @deprecated Use finance_requests table instead */
  rental_status: RentalStatus | null;
  /** @deprecated Use finance_requests table instead */
  equity_amount: number | null;
  /** @deprecated Use finance_requests table instead */
  equity_source: string | null;
  /** @deprecated Use finance_requests table instead */
  loan_amount_requested: number | null;
  /** @deprecated Use finance_requests table instead */
  fixed_rate_period_years: number | null;
  /** @deprecated Use finance_requests table instead */
  repayment_rate_percent: number | null;
  /** @deprecated Use finance_requests table instead */
  max_monthly_rate: number | null;
  
  // Section 9: Self-declarations
  schufa_consent: boolean;
  no_insolvency: boolean;
  no_tax_arrears: boolean;
  data_correct_confirmed: boolean;
  
  // Meta
  completion_score: number;
  last_synced_from_finapi_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// Finance Request Types
// ============================================

/**
 * Finance Request Status Machine (FROZEN)
 * 
 * Flow: draft → collecting → ready → submitted → [Zone 1] → assigned → [MOD-11] → in_processing → completed/rejected
 * 
 * MOD-07 can edit: draft, collecting, ready
 * Zone 1 controls: submitted → assigned
 * MOD-11 controls: in_processing, needs_customer_action, completed, rejected
 */
export type FinanceRequestStatus = 
  | 'draft'                  // Initial state, no data
  | 'collecting'             // Self-disclosure in progress
  | 'ready'                  // All required fields + docs complete
  | 'submitted'              // Submitted to Zone 1 (SoT transfers)
  | 'assigned'               // Manager assigned by Zone 1
  | 'in_processing'          // Manager is working on it
  | 'needs_customer_action'  // Customer needs to provide more info
  | 'completed'              // Successfully finished
  | 'rejected';              // Rejected

export type ObjectSource = 'mod04_property' | 'custom';
export interface FinanceRequest {
  id: string;
  tenant_id: string;
  public_id: string | null;
  status: FinanceRequestStatus;
  
  // Object Source
  object_source: ObjectSource | string | null;
  property_id: string | null;
  listing_id: string | null;
  custom_object_data: unknown;
  
  // Storage
  storage_folder_id: string | null;
  
  created_by: string | null;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// Finance Mandate Types (Zone 1)
// ============================================

export type MandateStatus = 'new' | 'triage' | 'delegated' | 'accepted' | 'rejected' | 'assigned' | 'submitted_to_zone1' | string;

export interface FinanceMandate {
  id: string;
  tenant_id: string;
  finance_request_id: string;
  public_id: string | null;
  
  status: MandateStatus;
  priority: number;
  
  // Delegation
  assigned_manager_id: string | null;
  delegated_at: string | null;
  delegated_by: string | null;
  accepted_at: string | null;
  
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// Future Room Case Types (MOD-11)
// ============================================

export type FutureRoomCaseStatus = 'active' | 'missing_docs' | 'ready_to_submit' | 'submitted' | 'closed' | 'completed';

export interface FutureRoomCase {
  id: string;
  manager_tenant_id: string;
  finance_mandate_id: string;
  
  status: FutureRoomCaseStatus | string;
  
  // Bank Submission
  target_bank_id: string | null;
  submitted_to_bank_at: string | null;
  bank_response: string | null;
  
  // Timestamps
  first_action_at?: string | null;
  created_at: string;
  updated_at: string;
  
  // Joined relations (from useFutureRoomCases query) - using any for flexibility
  finance_mandates?: any;
}

// ============================================
// Credibility Flag Types
// ============================================

export type FlagType = 'income_mismatch' | 'missing_doc' | 'expired_doc' | 'period_gap' | 'employer_mismatch';
export type FlagSeverity = 'info' | 'warn' | 'block';

export interface CredibilityFlag {
  id: string;
  tenant_id: string;
  applicant_profile_id: string;
  
  flag_type: FlagType;
  severity: FlagSeverity;
  
  field_name: string | null;
  declared_value: string | null;
  detected_value: string | null;
  source_document_id: string | null;
  
  resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  resolution_note: string | null;
  
  created_at: string;
}

// ============================================
// Bank Contact Types
// ============================================

export interface FinanceBankContact {
  id: string;
  public_id: string | null;
  bank_name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  portal_url: string | null;
  preferred_loan_types: string[] | null;
  preferred_regions: string[] | null;
  min_loan_amount: number | null;
  max_loan_amount: number | null;
  notes: string | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// Form State Types
// ============================================

export interface ApplicantFormData extends Omit<ApplicantProfile, 'id' | 'tenant_id' | 'created_at' | 'updated_at'> {}

export interface FinanceRequestFormData {
  object_source: ObjectSource;
  property_id?: string;
  listing_id?: string;
  custom_object_data?: Record<string, unknown>;
}

// ============================================
// Completion Score Helpers
// ============================================

export const REQUIRED_FIELDS_PRIVATE: (keyof ApplicantProfile)[] = [
  'first_name', 'last_name', 'birth_date', 'address_street', 'address_postal_code',
  'address_city', 'phone', 'email', 'id_document_type', 'id_document_number',
  'tax_id', 'iban', 'employment_type', 'net_income_monthly', 'purpose',
  'purchase_price', 'equity_amount', 'loan_amount_requested'
];

export const REQUIRED_FIELDS_ENTREPRENEUR: (keyof ApplicantProfile)[] = [
  ...REQUIRED_FIELDS_PRIVATE,
  'company_name', 'company_legal_form', 'company_founded'
];

export function calculateCompletionScore(profile: Partial<ApplicantProfile>): number {
  const requiredFields = profile.profile_type === 'entrepreneur' 
    ? REQUIRED_FIELDS_ENTREPRENEUR 
    : REQUIRED_FIELDS_PRIVATE;
  
  const filledCount = requiredFields.filter(field => {
    const value = profile[field];
    return value !== null && value !== undefined && value !== '';
  }).length;
  
  return Math.round((filledCount / requiredFields.length) * 100);
}
