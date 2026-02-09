/**
 * MOD-13 PROJEKTE - Type Definitions
 * Developer/Aufteiler Project Management System
 */

// ============================================================================
// Developer Contexts (Verkäufer-Gesellschaften)
// ============================================================================

export type ContextType = 'company' | 'private' | 'fund';

export interface DeveloperContext {
  id: string;
  tenant_id: string;
  name: string;
  context_type: ContextType;
  legal_form: string | null;
  hrb_number: string | null;
  ust_id: string | null;
  managing_director: string | null;
  street: string | null;
  house_number: string | null;
  postal_code: string | null;
  city: string | null;
  tax_rate_percent: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateDeveloperContextInput {
  name: string;
  context_type?: ContextType;
  legal_form?: string;
  hrb_number?: string;
  ust_id?: string;
  managing_director?: string;
  street?: string;
  house_number?: string;
  postal_code?: string;
  city?: string;
  tax_rate_percent?: number;
  is_default?: boolean;
}

// ============================================================================
// Dev Projects
// ============================================================================

// Extended project status for Aufteiler lifecycle
export type ProjectStatus = 
  // New Aufteiler lifecycle statuses
  | 'draft_intake'        // KI-Import läuft
  | 'draft_ready'         // Import bestätigt, bereit zur Aktivierung
  | 'in_sales_setup'      // Vertrieb wird vorbereitet
  | 'in_distribution'     // Aktiv im Verkauf
  | 'sellout_in_progress' // Abverkauf läuft (>50% verkauft)
  | 'sold_out'            // Alle Einheiten verkauft
  | 'closed'              // Archiviert/Abgeschlossen
  // Legacy values (for backward compatibility)
  | 'draft'
  | 'active'
  | 'paused'
  | 'completed'
  | 'archived';

export interface DevProject {
  id: string;
  tenant_id: string;
  developer_context_id: string;
  project_code: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  address: string | null;
  city: string | null;
  postal_code: string | null;
  state: string | null;
  country: string;
  total_units_count: number;
  purchase_price: number | null;
  renovation_budget: number | null;
  total_sale_target: number | null;
  avg_unit_price: number | null;
  commission_rate_percent: number;
  ancillary_cost_percent: number;
  holding_period_months: number;
  project_start_date: string | null;
  target_end_date: string | null;
  // Marketing fields
  kaufy_listed: boolean;
  kaufy_featured: boolean;
  landingpage_slug: string | null;
  landingpage_enabled: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  // Joined fields
  developer_context?: DeveloperContext;
}

export interface CreateProjectInput {
  developer_context_id: string;
  project_code: string;
  name: string;
  description?: string;
  address?: string;
  city?: string;
  postal_code?: string;
  purchase_price?: number;
  renovation_budget?: number;
  total_sale_target?: number;
  commission_rate_percent?: number;
  ancillary_cost_percent?: number;
  holding_period_months?: number;
  project_start_date?: string;
  target_end_date?: string;
}

// ============================================================================
// Dev Project Units
// ============================================================================

export type UnitStatus = 'available' | 'reserved' | 'sold' | 'blocked';

export interface DevProjectUnit {
  id: string;
  tenant_id: string;
  project_id: string;
  unit_number: string;
  floor: number | null;
  area_sqm: number | null;
  rooms_count: number | null;
  list_price: number | null;
  min_price: number | null;
  price_per_sqm: number | null;
  status: UnitStatus;
  grundbuchblatt: string | null;
  te_number: string | null;
  tenant_name: string | null;
  current_rent: number | null;
  rent_net: number | null;
  rent_nk: number | null;
  balcony: boolean;
  garden: boolean;
  parking: boolean;
  parking_type: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectUnitInput {
  project_id: string;
  unit_number: string;
  floor?: number;
  area_sqm?: number;
  rooms_count?: number;
  list_price?: number;
  min_price?: number;
  grundbuchblatt?: string;
  te_number?: string;
  tenant_name?: string;
  current_rent?: number;
  rent_net?: number;
  rent_nk?: number;
  balcony?: boolean;
  garden?: boolean;
  parking?: boolean;
  parking_type?: string;
  notes?: string;
}

// ============================================================================
// Dev Project Reservations
// ============================================================================

export type ReservationStatus = 'pending' | 'confirmed' | 'notary_scheduled' | 'completed' | 'cancelled' | 'expired';

export interface DevProjectReservation {
  id: string;
  tenant_id: string;
  project_id: string;
  unit_id: string;
  buyer_contact_id: string | null;
  partner_org_id: string | null;
  partner_user_id: string | null;
  status: ReservationStatus;
  reserved_price: number | null;
  commission_amount: number | null;
  reservation_date: string;
  expiry_date: string | null;
  confirmation_date: string | null;
  notary_date: string | null;
  completion_date: string | null;
  cancellation_date: string | null;
  cancellation_reason: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  // Joined fields
  unit?: DevProjectUnit;
  buyer_contact?: { id: string; first_name: string; last_name: string; email: string };
  partner_org?: { id: string; name: string };
}

export interface CreateReservationInput {
  project_id: string;
  unit_id: string;
  buyer_contact_id?: string;
  partner_org_id?: string;
  reserved_price?: number;
  commission_amount?: number;
  expiry_date?: string;
  notes?: string;
}

// ============================================================================
// Dev Project Calculations (Aufteilerkalkulation)
// ============================================================================

export interface DevProjectCalculation {
  id: string;
  project_id: string;
  calculation_name: string;
  // Inputs
  purchase_price: number | null;
  ancillary_cost_percent: number;
  renovation_total: number | null;
  renovation_per_sqm: number | null;
  sales_commission_percent: number;
  holding_period_months: number;
  financing_rate_percent: number;
  financing_ltv_percent: number;
  // Outputs
  total_investment: number | null;
  total_sale_proceeds: number | null;
  gross_profit: number | null;
  net_profit: number | null;
  profit_margin_percent: number | null;
  annualized_return: number | null;
  profit_per_unit: number | null;
  break_even_units: number | null;
  // Meta
  is_active: boolean;
  calculated_at: string;
  created_at: string;
  updated_at: string;
}

export interface CalculationInputs {
  purchase_price: number;
  ancillary_cost_percent: number;
  renovation_total: number;
  sales_commission_percent: number;
  holding_period_months: number;
  total_sale_proceeds: number;
  financing_rate_percent?: number;
  financing_ltv_percent?: number;
  units_count: number;
}

export interface CalculationOutputs {
  total_investment: number;
  total_sale_proceeds: number;
  gross_profit: number;
  net_profit: number;
  profit_margin_percent: number;
  annualized_return: number;
  profit_per_unit: number;
  break_even_units: number;
}

// ============================================================================
// Dev Project Documents
// ============================================================================

export type ProjectDocType = 
  | 'general' 
  | 'expose' 
  | 'floor_plan' 
  | 'energy_cert' 
  | 'grundbuch' 
  | 'teilungserklaerung' 
  | 'purchase_contract' 
  | 'reservation' 
  | 'other';

export interface DevProjectDocument {
  id: string;
  tenant_id: string;
  project_id: string;
  unit_id: string | null;
  document_id: string | null;
  storage_node_id: string | null;
  doc_type: ProjectDocType;
  display_name: string | null;
  notes: string | null;
  created_at: string;
  created_by: string | null;
}

// ============================================================================
// Aggregated Views
// ============================================================================

export interface ProjectPortfolioRow {
  id: string;
  project_code: string;
  name: string;
  city: string | null;
  postal_code: string | null;
  project_type: string | null; // 'neubau' | 'aufteilung'
  status: ProjectStatus;
  total_units_count: number;
  units_available: number;
  units_reserved: number;
  units_sold: number;
  purchase_price: number | null;
  total_sale_target: number | null;
  sale_revenue_actual: number | null; // Sum of sold units × price
  profit_margin_percent: number | null;
  progress_percent: number;
  // Marketing flags
  kaufy_listed: boolean;
  kaufy_featured: boolean;
  landingpage_enabled: boolean;
}

export interface ProjectDossierData {
  project: DevProject;
  units: DevProjectUnit[];
  reservations: DevProjectReservation[];
  calculation: DevProjectCalculation | null;
  documents: DevProjectDocument[];
  context: DeveloperContext;
}

// ============================================================================
// KPI Helpers
// ============================================================================

export interface ProjectKPIs {
  totalUnits: number;
  unitsAvailable: number;
  unitsReserved: number;
  unitsSold: number;
  progressPercent: number;
  purchasePrice: number;
  saleTarget: number;
  grossProfit: number;
  marginPercent: number;
  annualizedReturn: number;
}

export function calculateProjectKPIs(
  project: DevProject,
  units: DevProjectUnit[],
  calculation?: DevProjectCalculation | null
): ProjectKPIs {
  const unitsAvailable = units.filter(u => u.status === 'available').length;
  const unitsReserved = units.filter(u => u.status === 'reserved').length;
  const unitsSold = units.filter(u => u.status === 'sold').length;
  const totalUnits = units.length;
  const progressPercent = totalUnits > 0 ? Math.round((unitsSold / totalUnits) * 100) : 0;

  const purchasePrice = project.purchase_price || 0;
  const saleTarget = project.total_sale_target || units.reduce((sum, u) => sum + (u.list_price || 0), 0);
  const grossProfit = calculation?.gross_profit || (saleTarget - purchasePrice - (project.renovation_budget || 0));
  const marginPercent = calculation?.profit_margin_percent || (purchasePrice > 0 ? (grossProfit / purchasePrice) * 100 : 0);
  const annualizedReturn = calculation?.annualized_return || 0;

  return {
    totalUnits,
    unitsAvailable,
    unitsReserved,
    unitsSold,
    progressPercent,
    purchasePrice,
    saleTarget,
    grossProfit,
    marginPercent,
    annualizedReturn,
  };
}

// ============================================================================
// Aufteiler Calculation Engine (from MOD-12)
// ============================================================================

export function calculateAufteiler(inputs: CalculationInputs): CalculationOutputs {
  const {
    purchase_price,
    ancillary_cost_percent,
    renovation_total,
    sales_commission_percent,
    holding_period_months,
    total_sale_proceeds,
    financing_rate_percent = 4,
    financing_ltv_percent = 70,
    units_count,
  } = inputs;

  // Calculate total investment
  const ancillary_costs = purchase_price * (ancillary_cost_percent / 100);
  const total_investment = purchase_price + ancillary_costs + renovation_total;

  // Calculate financing costs
  const loan_amount = purchase_price * (financing_ltv_percent / 100);
  const financing_cost = loan_amount * (financing_rate_percent / 100) * (holding_period_months / 12);

  // Calculate sales commission
  const commission = total_sale_proceeds * (sales_commission_percent / 100);

  // Calculate profits
  const gross_profit = total_sale_proceeds - total_investment - commission;
  const net_profit = gross_profit - financing_cost;

  // Calculate margins and returns
  const profit_margin_percent = total_investment > 0 
    ? (gross_profit / total_investment) * 100 
    : 0;
  
  const annualized_return = total_investment > 0 && holding_period_months > 0
    ? (profit_margin_percent / holding_period_months) * 12
    : 0;

  const profit_per_unit = units_count > 0 ? gross_profit / units_count : 0;

  // Break-even: how many units need to sell to cover investment
  const avg_unit_price = units_count > 0 ? total_sale_proceeds / units_count : 0;
  const break_even_units = avg_unit_price > 0 
    ? Math.ceil(total_investment / (avg_unit_price * (1 - sales_commission_percent / 100)))
    : units_count;

  return {
    total_investment: Math.round(total_investment),
    total_sale_proceeds: Math.round(total_sale_proceeds),
    gross_profit: Math.round(gross_profit),
    net_profit: Math.round(net_profit),
    profit_margin_percent: Math.round(profit_margin_percent * 100) / 100,
    annualized_return: Math.round(annualized_return * 100) / 100,
    profit_per_unit: Math.round(profit_per_unit),
    break_even_units,
  };
}
