-- ============================================================================
-- PHASE A: MOD-04/05 IMMOBILIENAKTE + DATENKERN - SCHEMA-ERWEITERUNGEN
-- ============================================================================

-- A1: Properties-Tabelle erweitern
ALTER TABLE properties ADD COLUMN IF NOT EXISTS address_house_no TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS mea_total NUMERIC(12,4);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS weg_flag BOOLEAN DEFAULT false;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS land_register_refs JSONB;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS manager_contact JSONB;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS insurance_policy_no TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS multi_unit_enabled BOOLEAN DEFAULT false;

-- A2: Units-Tabelle erweitern
ALTER TABLE units ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE units ADD COLUMN IF NOT EXISTS floor TEXT;
ALTER TABLE units ADD COLUMN IF NOT EXISTS position TEXT;
ALTER TABLE units ADD COLUMN IF NOT EXISTS condition_grade TEXT;
ALTER TABLE units ADD COLUMN IF NOT EXISTS last_renovation_year INT;
ALTER TABLE units ADD COLUMN IF NOT EXISTS energy_certificate_type TEXT;
ALTER TABLE units ADD COLUMN IF NOT EXISTS energy_certificate_value NUMERIC(6,2);
ALTER TABLE units ADD COLUMN IF NOT EXISTS energy_certificate_valid_until DATE;
ALTER TABLE units ADD COLUMN IF NOT EXISTS features_tags JSONB;
ALTER TABLE units ADD COLUMN IF NOT EXISTS heating_supply TEXT;
ALTER TABLE units ADD COLUMN IF NOT EXISTS balcony_flag BOOLEAN;
ALTER TABLE units ADD COLUMN IF NOT EXISTS garden_flag BOOLEAN;
ALTER TABLE units ADD COLUMN IF NOT EXISTS parking_count INT;
ALTER TABLE units ADD COLUMN IF NOT EXISTS bathrooms_count INT;
ALTER TABLE units ADD COLUMN IF NOT EXISTS dossier_asof_date DATE;
ALTER TABLE units ADD COLUMN IF NOT EXISTS dossier_data_quality TEXT DEFAULT 'PRUEFEN';

-- A3: Leases-Tabelle erweitern
ALTER TABLE leases ADD COLUMN IF NOT EXISTS rent_cold_eur NUMERIC(12,2);
ALTER TABLE leases ADD COLUMN IF NOT EXISTS nk_advance_eur NUMERIC(12,2);
ALTER TABLE leases ADD COLUMN IF NOT EXISTS heating_advance_eur NUMERIC(12,2);
ALTER TABLE leases ADD COLUMN IF NOT EXISTS payment_due_day INT;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS deposit_amount_eur NUMERIC(12,2);
ALTER TABLE leases ADD COLUMN IF NOT EXISTS deposit_status TEXT DEFAULT 'OPEN';
ALTER TABLE leases ADD COLUMN IF NOT EXISTS rent_model TEXT DEFAULT 'FIX';
ALTER TABLE leases ADD COLUMN IF NOT EXISTS index_base_month DATE;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS last_rent_adjustment_date DATE;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS next_rent_adjustment_earliest_date DATE;
ALTER TABLE leases ADD COLUMN IF NOT EXISTS staffel_schedule JSONB;

-- A4: Storage-Nodes erweitern
ALTER TABLE storage_nodes ADD COLUMN IF NOT EXISTS template_id TEXT;
ALTER TABLE storage_nodes ADD COLUMN IF NOT EXISTS doc_type_hint TEXT;
ALTER TABLE storage_nodes ADD COLUMN IF NOT EXISTS scope_hint TEXT;
ALTER TABLE storage_nodes ADD COLUMN IF NOT EXISTS sort_index INT DEFAULT 0;

-- A5: Documents-Tabelle erweitern (für Matching)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS doc_type TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS scope TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS review_state TEXT DEFAULT 'UNASSIGNED';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS match_confidence NUMERIC(3,2);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS sidecar_json JSONB;

-- ============================================================================
-- NEUE TABELLEN
-- ============================================================================

-- Loans (erweitertes Finanzierungsmodell)
CREATE TABLE IF NOT EXISTS loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id TEXT UNIQUE,
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  scope TEXT NOT NULL DEFAULT 'PROPERTY',
  
  bank_name TEXT NOT NULL,
  loan_number TEXT NOT NULL,
  contact_person JSONB,
  
  start_date DATE,
  maturity_date DATE,
  interest_rate_percent NUMERIC(5,3),
  fixed_interest_end_date DATE,
  annuity_monthly_eur NUMERIC(12,2),
  repayment_rate_percent NUMERIC(5,3),
  outstanding_balance_eur NUMERIC(14,2),
  outstanding_balance_asof DATE,
  special_repayment_right_eur_per_year NUMERIC(12,2),
  payment_account_ref TEXT,
  collateral_refs JSONB,
  allocated_unit_shares JSONB,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Meters (Zähler)
CREATE TABLE IF NOT EXISTS meters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE CASCADE,
  scope TEXT NOT NULL DEFAULT 'UNIT',
  
  meter_type TEXT NOT NULL,
  serial_no TEXT,
  readings JSONB,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Bank Transactions
CREATE TABLE IF NOT EXISTS bank_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  account_ref TEXT NOT NULL,
  
  booking_date DATE NOT NULL,
  value_date DATE,
  amount_eur NUMERIC(14,2) NOT NULL,
  counterparty TEXT,
  purpose_text TEXT,
  
  match_status TEXT DEFAULT 'UNMATCHED',
  matched_entity JSONB,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Postings (Buchungswahrheit)
CREATE TABLE IF NOT EXISTS postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
  
  posting_date DATE NOT NULL,
  amount_eur NUMERIC(14,2) NOT NULL,
  direction TEXT NOT NULL,
  accounting_category TEXT NOT NULL,
  tax_category TEXT,
  bwa_group TEXT,
  
  source_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'DRAFT',
  confidence NUMERIC(3,2) DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- NK Periods
CREATE TABLE IF NOT EXISTS nk_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  allocation_key_default TEXT DEFAULT 'SQM',
  settlement_date DATE,
  settlement_balance_eur NUMERIC(12,2),
  top_cost_blocks JSONB,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- DataPoint Catalog (Konfiguration)
CREATE TABLE IF NOT EXISTS dp_catalog (
  dp_key TEXT PRIMARY KEY,
  entity TEXT NOT NULL,
  label_de TEXT NOT NULL,
  datatype TEXT NOT NULL,
  required_level TEXT DEFAULT 'OPTIONAL',
  validation JSONB,
  privacy TEXT DEFAULT 'internal',
  calc_role JSONB,
  evidence_doc_types TEXT[],
  aliases TEXT[],
  default_source_priority TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- DocType Catalog (Konfiguration)
CREATE TABLE IF NOT EXISTS doc_type_catalog (
  doc_type TEXT PRIMARY KEY,
  scope_default TEXT NOT NULL,
  required_meta TEXT[],
  anchors JSONB,
  extractable_dp_keys TEXT[],
  posting_suggestion_rules JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Posting Categories (Kategorie-Matrix)
CREATE TABLE IF NOT EXISTS posting_categories (
  accounting_category TEXT PRIMARY KEY,
  direction TEXT NOT NULL,
  tax_category_vv TEXT,
  bwa_group TEXT,
  description_de TEXT
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_loans_tenant ON loans(tenant_id);
CREATE INDEX IF NOT EXISTS idx_loans_property ON loans(property_id);
CREATE INDEX IF NOT EXISTS idx_loans_loan_number ON loans(loan_number);
CREATE INDEX IF NOT EXISTS idx_meters_tenant ON meters(tenant_id);
CREATE INDEX IF NOT EXISTS idx_meters_property ON meters(property_id);
CREATE INDEX IF NOT EXISTS idx_meters_unit ON meters(unit_id);
CREATE INDEX IF NOT EXISTS idx_bank_tx_tenant ON bank_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bank_tx_booking_date ON bank_transactions(booking_date);
CREATE INDEX IF NOT EXISTS idx_bank_tx_match_status ON bank_transactions(match_status);
CREATE INDEX IF NOT EXISTS idx_postings_tenant ON postings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_postings_property ON postings(property_id);
CREATE INDEX IF NOT EXISTS idx_postings_status ON postings(status);
CREATE INDEX IF NOT EXISTS idx_postings_date ON postings(posting_date);
CREATE INDEX IF NOT EXISTS idx_nk_periods_tenant ON nk_periods(tenant_id);
CREATE INDEX IF NOT EXISTS idx_nk_periods_property ON nk_periods(property_id);
CREATE INDEX IF NOT EXISTS idx_documents_doc_type ON documents(doc_type);
CREATE INDEX IF NOT EXISTS idx_documents_review_state ON documents(review_state);
CREATE INDEX IF NOT EXISTS idx_storage_nodes_doc_type_hint ON storage_nodes(doc_type_hint);
CREATE INDEX IF NOT EXISTS idx_storage_nodes_template ON storage_nodes(template_id);
CREATE INDEX IF NOT EXISTS idx_units_code ON units(code);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Loans RLS
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view loans in their organization"
ON loans FOR SELECT
USING (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));

CREATE POLICY "Users can insert loans in their organization"
ON loans FOR INSERT
WITH CHECK (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));

CREATE POLICY "Users can update loans in their organization"
ON loans FOR UPDATE
USING (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));

CREATE POLICY "Users can delete loans in their organization"
ON loans FOR DELETE
USING (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));

-- Meters RLS
ALTER TABLE meters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view meters in their organization"
ON meters FOR SELECT
USING (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));

CREATE POLICY "Users can insert meters in their organization"
ON meters FOR INSERT
WITH CHECK (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));

CREATE POLICY "Users can update meters in their organization"
ON meters FOR UPDATE
USING (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));

CREATE POLICY "Users can delete meters in their organization"
ON meters FOR DELETE
USING (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));

-- Bank Transactions RLS
ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view bank_transactions in their organization"
ON bank_transactions FOR SELECT
USING (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));

CREATE POLICY "Users can insert bank_transactions in their organization"
ON bank_transactions FOR INSERT
WITH CHECK (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));

CREATE POLICY "Users can update bank_transactions in their organization"
ON bank_transactions FOR UPDATE
USING (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));

CREATE POLICY "Users can delete bank_transactions in their organization"
ON bank_transactions FOR DELETE
USING (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));

-- Postings RLS
ALTER TABLE postings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view postings in their organization"
ON postings FOR SELECT
USING (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));

CREATE POLICY "Users can insert postings in their organization"
ON postings FOR INSERT
WITH CHECK (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));

CREATE POLICY "Users can update postings in their organization"
ON postings FOR UPDATE
USING (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));

CREATE POLICY "Users can delete postings in their organization"
ON postings FOR DELETE
USING (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));

-- NK Periods RLS
ALTER TABLE nk_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view nk_periods in their organization"
ON nk_periods FOR SELECT
USING (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));

CREATE POLICY "Users can insert nk_periods in their organization"
ON nk_periods FOR INSERT
WITH CHECK (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));

CREATE POLICY "Users can update nk_periods in their organization"
ON nk_periods FOR UPDATE
USING (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));

CREATE POLICY "Users can delete nk_periods in their organization"
ON nk_periods FOR DELETE
USING (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));

-- Catalog tables are public read (configuration data)
-- dp_catalog - public read
CREATE POLICY "Anyone can read dp_catalog"
ON dp_catalog FOR SELECT
USING (true);

-- doc_type_catalog - public read
CREATE POLICY "Anyone can read doc_type_catalog"
ON doc_type_catalog FOR SELECT
USING (true);

-- posting_categories - public read
CREATE POLICY "Anyone can read posting_categories"
ON posting_categories FOR SELECT
USING (true);

-- ============================================================================
-- TRIGGER: Loans public_id
-- ============================================================================
CREATE OR REPLACE FUNCTION set_loan_public_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.public_id IS NULL THEN
    NEW.public_id := generate_public_id('L');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS set_loan_public_id_trigger ON loans;
CREATE TRIGGER set_loan_public_id_trigger
  BEFORE INSERT ON loans
  FOR EACH ROW
  EXECUTE FUNCTION set_loan_public_id();

-- ============================================================================
-- SEED DATA: Posting Categories
-- ============================================================================
INSERT INTO posting_categories (accounting_category, direction, tax_category_vv, bwa_group, description_de) VALUES
('INCOME_RENT_COLD', 'INCOME', 'VV_RENT_INCOME', 'ERLOESE_MIETE', 'Kaltmiete'),
('INCOME_NK_ADVANCE', 'INCOME', 'VV_UMLAGEN_INCOME', 'ERLOESE_NK', 'NK-Vorauszahlung'),
('INCOME_OTHER', 'INCOME', 'VV_OTHER_INCOME', 'SONST_ERTRAEGE', 'Sonstige Einnahmen'),
('EXP_BETRKV_UMLEG', 'EXPENSE', 'VV_PASS_THROUGH_OR_COST', 'AUFWAND_BETRIEBSKOSTEN', 'Betriebskosten umlagefähig'),
('EXP_NON_UMLEG_ADMIN', 'EXPENSE', 'VV_ADM_COSTS', 'VERWALTUNGSAUFWAND', 'Verwaltungskosten'),
('EXP_MAINTENANCE_REPAIR', 'EXPENSE', 'VV_MAINTENANCE', 'INSTANDHALTUNG', 'Instandhaltung'),
('EXP_INSURANCE', 'EXPENSE', 'VV_INSURANCE', 'VERSICHERUNGEN', 'Versicherungen'),
('EXP_TAX_PROPERTY', 'EXPENSE', 'VV_PROPERTY_TAX', 'STEUERN_GRUNDSTEUER', 'Grundsteuer'),
('EXP_BANK_FEES', 'EXPENSE', 'VV_BANK_FEES', 'BANKGEBUEHREN', 'Bankgebühren'),
('EXP_INTEREST', 'EXPENSE', 'VV_INTEREST', 'ZINSAUFWAND', 'Zinsen'),
('EXP_DEPRECIATION_AFA', 'EXPENSE', 'VV_AFA', 'AFA', 'Abschreibung')
ON CONFLICT (accounting_category) DO NOTHING;

-- ============================================================================
-- SEED DATA: DocType Catalog (Core Types)
-- ============================================================================
INSERT INTO doc_type_catalog (doc_type, scope_default, required_meta, anchors, extractable_dp_keys) VALUES
('DOC_PROJECT', 'PROPERTY', ARRAY['doc_date'], '{"weak": ["property_address"]}', ARRAY[]::TEXT[]),
('DOC_EXPOSE_BUY', 'PROPERTY', ARRAY['doc_date'], '{"weak": ["property_address", "price"]}', ARRAY['investment.purchase_price_eur']),
('DOC_EXPOSE_MISC', 'PROPERTY', ARRAY['doc_date'], '{"weak": ["property_address"]}', ARRAY[]::TEXT[]),
('DOC_LAND_REGISTER', 'PROPERTY', ARRAY['doc_date'], '{"strong": ["land_register_refs"]}', ARRAY['property.land_register_refs']),
('DOC_DIVISION_DECLARATION', 'PROPERTY', ARRAY['doc_date'], '{"strong": ["mea_te_no"]}', ARRAY['property.mea_total', 'unit.mea']),
('DOC_FLOORPLAN', 'UNIT', ARRAY[]::TEXT[], '{"weak": ["unit_code", "address"]}', ARRAY['unit.area_living_sqm', 'unit.rooms_count']),
('DOC_VALUATION_SHORT', 'PROPERTY', ARRAY['doc_date'], '{"weak": ["property_address"]}', ARRAY['investment.valuation_eur']),
('DOC_PURCHASE_CONTRACT', 'PROPERTY', ARRAY['doc_date'], '{"strong": ["notary_date", "purchase_price"]}', ARRAY['investment.purchase_price_eur', 'investment.purchase_costs_eur']),
('DOC_LEASE_CONTRACT', 'TENANCY', ARRAY['doc_date', 'start_date'], '{"strong": ["address", "start_date", "rent_cold"]}', ARRAY['tenancy.start_date', 'tenancy.rent_cold_eur', 'tenancy.nk_advance_eur', 'tenancy.deposit_amount_eur']),
('DOC_INVOICE', 'PROPERTY', ARRAY['doc_date', 'vendor', 'amount'], '{"weak": ["vendor", "amount", "period"]}', ARRAY['invoice.vendor_name', 'invoice.total_gross_eur', 'invoice.service_period_start']),
('DOC_WEG_BUCKET', 'PROPERTY', ARRAY['doc_date', 'period'], '{"weak": ["address", "year"]}', ARRAY[]::TEXT[]),
('DOC_WEG_BUDGET_PLAN', 'PROPERTY', ARRAY['doc_date', 'period'], '{"weak": ["address", "year"]}', ARRAY['weg.hausgeld_monthly_eur']),
('DOC_WEG_ANNUAL_STATEMENT', 'PROPERTY', ARRAY['doc_date', 'period'], '{"weak": ["address", "year", "settlement_total"]}', ARRAY['nk.last_settlement_balance_eur']),
('DOC_PHOTOS', 'UNIT', ARRAY[]::TEXT[], '{"weak": ["unit_code"]}', ARRAY[]::TEXT[]),
('DOC_ENERGY_CERT', 'PROPERTY', ARRAY['doc_date', 'valid_until'], '{"weak": ["address", "energy_value"]}', ARRAY['unit.energy_certificate_type', 'unit.energy_certificate_value', 'unit.energy_certificate_valid_until']),
('DOC_INSURANCE_BUILDING', 'PROPERTY', ARRAY['doc_date'], '{"weak": ["address", "policy_no"]}', ARRAY['property.insurance_policy_no']),
('DOC_MISC', 'PROPERTY', ARRAY[]::TEXT[], '{}', ARRAY[]::TEXT[]),
('DOC_LOAN_BUCKET', 'LOAN', ARRAY[]::TEXT[], '{"strong": ["loan_number", "bank_name"]}', ARRAY[]::TEXT[]),
('DOC_LOAN_CONTRACT', 'LOAN', ARRAY['doc_date'], '{"strong": ["loan_number", "bank_name"]}', ARRAY['loan.bank_name', 'loan.loan_number', 'loan.interest_rate_percent', 'loan.annuity_monthly_eur']),
('DOC_LOAN_BALANCE_NOTICE', 'LOAN', ARRAY['doc_date', 'asof_date'], '{"strong": ["loan_number"]}', ARRAY['loan.outstanding_balance_eur', 'loan.outstanding_balance_asof']),
('DOC_RENOVATION', 'UNIT', ARRAY['doc_date'], '{"weak": ["address", "unit_code"]}', ARRAY[]::TEXT[]),
('DOC_PROPERTY_TAX', 'PROPERTY', ARRAY['doc_date', 'period'], '{"weak": ["address", "year"]}', ARRAY[]::TEXT[]),
('DOC_NK_STATEMENT', 'PROPERTY', ARRAY['doc_date', 'period'], '{"weak": ["address", "year", "settlement_total"]}', ARRAY['nk.last_settlement_date', 'nk.last_settlement_balance_eur']),
('DOC_HEATING_STATEMENT', 'PROPERTY', ARRAY['doc_date', 'period'], '{"weak": ["address", "year"]}', ARRAY[]::TEXT[])
ON CONFLICT (doc_type) DO NOTHING;