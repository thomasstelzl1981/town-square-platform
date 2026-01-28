-- ============================================================================
-- PHASE 1B: FINANZIERUNGSMODUL - TABELLEN
-- ============================================================================

-- 1. FINANCE REQUESTS (Zone 2 Draft - Kunde)
-- ============================================================================
CREATE TABLE public.finance_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  public_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'collecting', 'ready', 'submitted')),
  
  -- Objektquelle
  object_source TEXT CHECK (object_source IN ('mod04_property', 'mod08_favorite', 'custom')),
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  listing_id UUID,
  custom_object_data JSONB,
  
  -- Bonitätsordner
  storage_folder_id UUID REFERENCES storage_nodes(id) ON DELETE SET NULL,
  
  -- Meta
  created_by UUID,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger für public_id
CREATE OR REPLACE FUNCTION public.set_finance_request_public_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.public_id IS NULL THEN
    NEW.public_id := generate_public_id('FR');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_finance_request_public_id
  BEFORE INSERT ON finance_requests
  FOR EACH ROW EXECUTE FUNCTION set_finance_request_public_id();

CREATE TRIGGER trg_finance_requests_updated
  BEFORE UPDATE ON finance_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. APPLICANT PROFILES (Selbstauskunft)
-- ============================================================================
CREATE TABLE public.applicant_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  finance_request_id UUID REFERENCES finance_requests(id) ON DELETE CASCADE,
  
  -- Typ
  profile_type TEXT NOT NULL DEFAULT 'private' CHECK (profile_type IN ('private', 'entrepreneur')),
  party_role TEXT NOT NULL DEFAULT 'primary' CHECK (party_role IN ('primary', 'co_applicant')),
  
  -- Person: Identität
  first_name TEXT,
  last_name TEXT,
  birth_date DATE,
  birth_place TEXT,
  nationality TEXT,
  marital_status TEXT,
  address_street TEXT,
  address_postal_code TEXT,
  address_city TEXT,
  phone TEXT,
  email TEXT,
  id_document_type TEXT CHECK (id_document_type IN ('PA', 'RP')),
  id_document_number TEXT,
  id_document_valid_until DATE,
  tax_id TEXT,
  iban TEXT,
  
  -- Haushalt
  adults_count INT,
  children_count INT,
  children_ages TEXT,
  child_support_obligation BOOLEAN DEFAULT false,
  child_support_amount_monthly NUMERIC(12,2),
  child_benefit_monthly NUMERIC(12,2),
  other_regular_income_monthly NUMERIC(12,2),
  other_income_description TEXT,
  
  -- Beschäftigung (Privat)
  employer_name TEXT,
  employer_location TEXT,
  employer_industry TEXT,
  employment_type TEXT CHECK (employment_type IN ('unbefristet', 'befristet', 'beamter', 'selbststaendig', 'rente', 'sonstiges')),
  position TEXT,
  employed_since DATE,
  probation_until DATE,
  net_income_monthly NUMERIC(12,2),
  bonus_yearly NUMERIC(12,2),
  
  -- Unternehmer-Erweiterung
  company_name TEXT,
  company_legal_form TEXT,
  company_address TEXT,
  company_founded DATE,
  company_register_number TEXT,
  company_vat_id TEXT,
  company_industry TEXT,
  company_employees INT,
  company_ownership_percent NUMERIC(5,2),
  company_managing_director BOOLEAN,
  
  -- Ausgaben
  current_rent_monthly NUMERIC(12,2),
  living_expenses_monthly NUMERIC(12,2),
  car_leasing_monthly NUMERIC(12,2),
  health_insurance_monthly NUMERIC(12,2),
  other_fixed_costs_monthly NUMERIC(12,2),
  
  -- Vermögen
  bank_savings NUMERIC(14,2),
  securities_value NUMERIC(14,2),
  building_society_value NUMERIC(14,2),
  life_insurance_value NUMERIC(14,2),
  other_assets_value NUMERIC(14,2),
  other_assets_description TEXT,
  
  -- Finanzierungswunsch
  purpose TEXT CHECK (purpose IN ('eigennutzung', 'kapitalanlage', 'neubau', 'modernisierung', 'umschuldung', 'betrieblich', 'liquiditaet', 'sonstiges')),
  object_address TEXT,
  object_type TEXT,
  purchase_price NUMERIC(14,2),
  ancillary_costs NUMERIC(14,2),
  modernization_costs NUMERIC(14,2),
  planned_rent_monthly NUMERIC(12,2),
  rental_status TEXT CHECK (rental_status IN ('vermietet', 'leer', 'teil')),
  equity_amount NUMERIC(14,2),
  equity_source TEXT,
  loan_amount_requested NUMERIC(14,2),
  fixed_rate_period_years INT,
  repayment_rate_percent NUMERIC(5,2),
  max_monthly_rate NUMERIC(12,2),
  
  -- Selbsterklärungen
  schufa_consent BOOLEAN DEFAULT false,
  no_insolvency BOOLEAN DEFAULT false,
  no_tax_arrears BOOLEAN DEFAULT false,
  data_correct_confirmed BOOLEAN DEFAULT false,
  
  -- Meta
  completion_score INT DEFAULT 0,
  last_synced_from_finapi_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_applicant_profiles_updated
  BEFORE UPDATE ON applicant_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. FINANCE MANDATES (Zone 1 Inbox nach Einreichung)
-- ============================================================================
CREATE TABLE public.finance_mandates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  finance_request_id UUID UNIQUE NOT NULL REFERENCES finance_requests(id) ON DELETE CASCADE,
  public_id TEXT UNIQUE,
  
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'triage', 'delegated', 'accepted', 'rejected')),
  priority INT DEFAULT 0,
  
  -- Delegation
  assigned_manager_id UUID,
  delegated_at TIMESTAMPTZ,
  delegated_by UUID,
  accepted_at TIMESTAMPTZ,
  
  -- Audit
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.set_finance_mandate_public_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.public_id IS NULL THEN
    NEW.public_id := generate_public_id('FM');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_finance_mandate_public_id
  BEFORE INSERT ON finance_mandates
  FOR EACH ROW EXECUTE FUNCTION set_finance_mandate_public_id();

CREATE TRIGGER trg_finance_mandates_updated
  BEFORE UPDATE ON finance_mandates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. FUTURE ROOM CASES (Zone 2 MOD-11 nach Manager-Annahme)
-- ============================================================================
CREATE TABLE public.future_room_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  manager_tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  finance_mandate_id UUID UNIQUE NOT NULL REFERENCES finance_mandates(id) ON DELETE CASCADE,
  
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'missing_docs', 'ready_to_submit', 'submitted', 'closed')),
  
  -- Bank-Einreichung
  target_bank_id UUID,
  submitted_to_bank_at TIMESTAMPTZ,
  bank_response TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_future_room_cases_updated
  BEFORE UPDATE ON future_room_cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. CREDIBILITY FLAGS (Mismatch/Missing-Warnungen)
-- ============================================================================
CREATE TABLE public.credibility_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  applicant_profile_id UUID NOT NULL REFERENCES applicant_profiles(id) ON DELETE CASCADE,
  
  flag_type TEXT NOT NULL CHECK (flag_type IN ('income_mismatch', 'missing_doc', 'expired_doc', 'period_gap', 'employer_mismatch', 'address_mismatch', 'other')),
  severity TEXT NOT NULL DEFAULT 'warn' CHECK (severity IN ('info', 'warn', 'block')),
  
  field_name TEXT,
  declared_value TEXT,
  detected_value TEXT,
  source_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  resolution_note TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. FINANCE BANK CONTACTS (Zone 1 Bankenordner)
-- ============================================================================
CREATE TABLE public.finance_bank_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  public_id TEXT UNIQUE,
  
  bank_name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  portal_url TEXT,
  notes TEXT,
  
  is_active BOOLEAN DEFAULT true,
  preferred_regions TEXT[],
  preferred_loan_types TEXT[],
  min_loan_amount NUMERIC(14,2),
  max_loan_amount NUMERIC(14,2),
  
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.set_finance_bank_contact_public_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.public_id IS NULL THEN
    NEW.public_id := generate_public_id('FB');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_finance_bank_contact_public_id
  BEFORE INSERT ON finance_bank_contacts
  FOR EACH ROW EXECUTE FUNCTION set_finance_bank_contact_public_id();

CREATE TRIGGER trg_finance_bank_contacts_updated
  BEFORE UPDATE ON finance_bank_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. STORAGE TRIGGER: Bonitätsordner-Struktur bei Finance-Request
-- ============================================================================
CREATE OR REPLACE FUNCTION public.create_finance_request_folders()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  root_id uuid;
  privat_id uuid;
  firma_id uuid;
BEGIN
  -- Haupt-Ordner für Finanzierung
  INSERT INTO storage_nodes (tenant_id, name, node_type, auto_created)
  VALUES (NEW.tenant_id, 'Finanzierung ' || COALESCE(NEW.public_id, NEW.id::text), 'folder', true)
  RETURNING id INTO root_id;
  
  -- Verknüpfe mit Finance Request
  NEW.storage_folder_id := root_id;
  
  -- Privat-Ordner
  INSERT INTO storage_nodes (tenant_id, parent_id, name, node_type, auto_created)
  VALUES (NEW.tenant_id, root_id, 'Privat', 'folder', true)
  RETURNING id INTO privat_id;
  
  -- Privat-Unterordner
  INSERT INTO storage_nodes (tenant_id, parent_id, name, node_type, auto_created)
  VALUES 
    (NEW.tenant_id, privat_id, 'Identität', 'folder', true),
    (NEW.tenant_id, privat_id, 'Einkommen', 'folder', true),
    (NEW.tenant_id, privat_id, 'Vermögen', 'folder', true),
    (NEW.tenant_id, privat_id, 'Verpflichtungen', 'folder', true),
    (NEW.tenant_id, privat_id, 'Sonstiges', 'folder', true);
  
  -- Firma-Ordner
  INSERT INTO storage_nodes (tenant_id, parent_id, name, node_type, auto_created)
  VALUES (NEW.tenant_id, root_id, 'Firma', 'folder', true)
  RETURNING id INTO firma_id;
  
  -- Firma-Unterordner
  INSERT INTO storage_nodes (tenant_id, parent_id, name, node_type, auto_created)
  VALUES 
    (NEW.tenant_id, firma_id, 'BWA-SuSa', 'folder', true),
    (NEW.tenant_id, firma_id, 'Jahresabschlüsse', 'folder', true),
    (NEW.tenant_id, firma_id, 'Steuern', 'folder', true);
  
  -- Objekt-Ordner
  INSERT INTO storage_nodes (tenant_id, parent_id, name, node_type, auto_created)
  VALUES (NEW.tenant_id, root_id, 'Objektunterlagen', 'folder', true);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_create_finance_request_folders
  BEFORE INSERT ON finance_requests
  FOR EACH ROW EXECUTE FUNCTION create_finance_request_folders();

-- 8. INDEXES
-- ============================================================================
CREATE INDEX idx_finance_requests_tenant ON finance_requests(tenant_id);
CREATE INDEX idx_finance_requests_status ON finance_requests(status);
CREATE INDEX idx_applicant_profiles_finance_request ON applicant_profiles(finance_request_id);
CREATE INDEX idx_applicant_profiles_tenant ON applicant_profiles(tenant_id);
CREATE INDEX idx_finance_mandates_tenant ON finance_mandates(tenant_id);
CREATE INDEX idx_finance_mandates_status ON finance_mandates(status);
CREATE INDEX idx_finance_mandates_manager ON finance_mandates(assigned_manager_id);
CREATE INDEX idx_future_room_cases_manager ON future_room_cases(manager_tenant_id);
CREATE INDEX idx_future_room_cases_status ON future_room_cases(status);
CREATE INDEX idx_credibility_flags_profile ON credibility_flags(applicant_profile_id);
CREATE INDEX idx_credibility_flags_resolved ON credibility_flags(resolved) WHERE resolved = false;

-- 9. RLS POLICIES
-- ============================================================================

-- finance_requests
ALTER TABLE finance_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant finance_requests"
  ON finance_requests FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));

CREATE POLICY "Users can create finance_requests in own tenant"
  ON finance_requests FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));

CREATE POLICY "Users can update own tenant finance_requests"
  ON finance_requests FOR UPDATE
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));

-- applicant_profiles
ALTER TABLE applicant_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant applicant_profiles"
  ON applicant_profiles FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));

CREATE POLICY "Users can create applicant_profiles in own tenant"
  ON applicant_profiles FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));

CREATE POLICY "Users can update own tenant applicant_profiles"
  ON applicant_profiles FOR UPDATE
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));

-- finance_mandates (Zone 1 - platform_admin or finance_manager only)
ALTER TABLE finance_mandates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can view all finance_mandates"
  ON finance_mandates FOR SELECT
  TO authenticated
  USING (is_platform_admin());

CREATE POLICY "Finance managers can view assigned mandates"
  ON finance_mandates FOR SELECT
  TO authenticated
  USING (assigned_manager_id = auth.uid());

CREATE POLICY "Platform admins can manage finance_mandates"
  ON finance_mandates FOR ALL
  TO authenticated
  USING (is_platform_admin());

-- future_room_cases (Zone 2 MOD-11 - finance_manager only)
ALTER TABLE future_room_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Finance managers can view own cases"
  ON future_room_cases FOR SELECT
  TO authenticated
  USING (
    manager_tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid()) WHERE role = 'finance_manager')
    OR is_platform_admin()
  );

CREATE POLICY "Finance managers can manage own cases"
  ON future_room_cases FOR ALL
  TO authenticated
  USING (
    manager_tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid()) WHERE role = 'finance_manager')
    OR is_platform_admin()
  );

-- credibility_flags
ALTER TABLE credibility_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant credibility_flags"
  ON credibility_flags FOR SELECT
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));

CREATE POLICY "System can create credibility_flags"
  ON credibility_flags FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));

CREATE POLICY "Users can update own tenant credibility_flags"
  ON credibility_flags FOR UPDATE
  TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));

-- finance_bank_contacts (Zone 1 - platform_admin read/write, finance_manager read)
ALTER TABLE finance_bank_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can manage finance_bank_contacts"
  ON finance_bank_contacts FOR ALL
  TO authenticated
  USING (is_platform_admin());

CREATE POLICY "Finance managers can view finance_bank_contacts"
  ON finance_bank_contacts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM get_user_memberships(auth.uid())
      WHERE role = 'finance_manager'
    )
  );