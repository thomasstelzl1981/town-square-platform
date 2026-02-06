-- =============================================================================
-- MOD-07 FINANZIERUNG: Phase 1 - Datenbank-Erweiterung (korrigiert)
-- =============================================================================

-- 1. APPLICANT_PROFILES: Neue Personendaten (aus PDF selbstauskunft.pdf)
-- -----------------------------------------------------------------------------
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS salutation text;
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS birth_name text;
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS birth_country text DEFAULT 'DE';
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS address_since date;
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS previous_address_street text;
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS previous_address_postal_code text;
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS previous_address_city text;
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS phone_mobile text;
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS property_separation boolean DEFAULT false;
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS children_birth_dates text;
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS bic text;

-- 2. APPLICANT_PROFILES: Erweiterte Beschäftigung
-- -----------------------------------------------------------------------------
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS contract_type text;
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS employer_in_germany boolean DEFAULT true;
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS salary_currency text DEFAULT 'EUR';
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS salary_payments_per_year integer DEFAULT 12;
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS has_side_job boolean DEFAULT false;
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS side_job_type text;
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS side_job_since date;
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS side_job_income_monthly numeric(12,2);
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS vehicles_count integer DEFAULT 0;

-- 3. APPLICANT_PROFILES: Rente
-- -----------------------------------------------------------------------------
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS retirement_date date;
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS pension_state_monthly numeric(12,2);
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS pension_private_monthly numeric(12,2);

-- 4. APPLICANT_PROFILES: Erweiterte Einnahmen
-- -----------------------------------------------------------------------------
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS self_employed_income_monthly numeric(12,2);
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS rental_income_monthly numeric(12,2);
ALTER TABLE applicant_profiles ADD COLUMN IF NOT EXISTS alimony_income_monthly numeric(12,2);

-- 5. NEUE TABELLE: applicant_liabilities (Verbindlichkeiten 1:N)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS applicant_liabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  applicant_profile_id uuid NOT NULL REFERENCES applicant_profiles(id) ON DELETE CASCADE,
  liability_type text NOT NULL CHECK (liability_type IN ('immobiliendarlehen', 'ratenkredit', 'leasing', 'sonstige')),
  creditor_name text,
  original_amount numeric(12,2),
  remaining_balance numeric(12,2),
  monthly_rate numeric(12,2),
  interest_rate_fixed_until date,
  end_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS für applicant_liabilities (korrektes Pattern wie finance_packages)
ALTER TABLE applicant_liabilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "al_select_member" ON applicant_liabilities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.user_id = auth.uid() AND m.tenant_id = applicant_liabilities.tenant_id
    )
  );

CREATE POLICY "al_select_platform_admin" ON applicant_liabilities
  FOR SELECT USING (is_platform_admin());

CREATE POLICY "al_insert_member" ON applicant_liabilities
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.user_id = auth.uid() AND m.tenant_id = applicant_liabilities.tenant_id
    )
  );

CREATE POLICY "al_insert_platform_admin" ON applicant_liabilities
  FOR INSERT WITH CHECK (is_platform_admin());

CREATE POLICY "al_update_member" ON applicant_liabilities
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.user_id = auth.uid() 
        AND m.tenant_id = applicant_liabilities.tenant_id
        AND m.role IN ('org_admin', 'internal_ops')
    )
  );

CREATE POLICY "al_update_platform_admin" ON applicant_liabilities
  FOR UPDATE USING (is_platform_admin());

CREATE POLICY "al_delete_admin" ON applicant_liabilities
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.user_id = auth.uid() 
        AND m.tenant_id = applicant_liabilities.tenant_id
        AND m.role = 'org_admin'
    )
  );

CREATE POLICY "al_delete_platform_admin" ON applicant_liabilities
  FOR DELETE USING (is_platform_admin());

-- 6. FINANCE_REQUESTS: Objektdaten (gehören zum ANTRAG, nicht zur Person!)
-- -----------------------------------------------------------------------------
ALTER TABLE finance_requests ADD COLUMN IF NOT EXISTS purpose text;
ALTER TABLE finance_requests ADD COLUMN IF NOT EXISTS object_address text;
ALTER TABLE finance_requests ADD COLUMN IF NOT EXISTS object_type text;
ALTER TABLE finance_requests ADD COLUMN IF NOT EXISTS object_construction_year integer;
ALTER TABLE finance_requests ADD COLUMN IF NOT EXISTS object_living_area_sqm numeric(10,2);
ALTER TABLE finance_requests ADD COLUMN IF NOT EXISTS object_land_area_sqm numeric(10,2);
ALTER TABLE finance_requests ADD COLUMN IF NOT EXISTS object_equipment_level text;
ALTER TABLE finance_requests ADD COLUMN IF NOT EXISTS object_location_quality text;

-- 7. FINANCE_REQUESTS: Kostenaufstellung
-- -----------------------------------------------------------------------------
ALTER TABLE finance_requests ADD COLUMN IF NOT EXISTS purchase_price numeric(12,2);
ALTER TABLE finance_requests ADD COLUMN IF NOT EXISTS modernization_costs numeric(12,2);
ALTER TABLE finance_requests ADD COLUMN IF NOT EXISTS notary_costs numeric(12,2);
ALTER TABLE finance_requests ADD COLUMN IF NOT EXISTS transfer_tax numeric(12,2);
ALTER TABLE finance_requests ADD COLUMN IF NOT EXISTS broker_fee numeric(12,2);

-- 8. FINANCE_REQUESTS: Finanzierungsplan
-- -----------------------------------------------------------------------------
ALTER TABLE finance_requests ADD COLUMN IF NOT EXISTS equity_amount numeric(12,2);
ALTER TABLE finance_requests ADD COLUMN IF NOT EXISTS loan_amount_requested numeric(12,2);
ALTER TABLE finance_requests ADD COLUMN IF NOT EXISTS fixed_rate_period_years integer;
ALTER TABLE finance_requests ADD COLUMN IF NOT EXISTS repayment_rate_percent numeric(5,2);
ALTER TABLE finance_requests ADD COLUMN IF NOT EXISTS max_monthly_rate numeric(12,2);

-- 9. Trigger für updated_at
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_applicant_liabilities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_applicant_liabilities_updated_at ON applicant_liabilities;
CREATE TRIGGER update_applicant_liabilities_updated_at
  BEFORE UPDATE ON applicant_liabilities
  FOR EACH ROW
  EXECUTE FUNCTION update_applicant_liabilities_updated_at();