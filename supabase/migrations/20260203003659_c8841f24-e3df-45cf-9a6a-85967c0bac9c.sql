-- Add tax-relevant fields to landlord_contexts for investment calculations
ALTER TABLE public.landlord_contexts
ADD COLUMN IF NOT EXISTS taxable_income_yearly numeric(12,2),
ADD COLUMN IF NOT EXISTS marginal_tax_rate numeric(5,2),
ADD COLUMN IF NOT EXISTS solidarity_surcharge boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS church_tax boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS church_tax_rate numeric(5,2),
ADD COLUMN IF NOT EXISTS children_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS child_allowance boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS notes text;

-- Update seed function with correct column list
CREATE OR REPLACE FUNCTION public.seed_golden_path_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tenant_id uuid := 'a0000000-0000-4000-a000-000000000001'::uuid;
  result jsonb;
BEGIN
  -- ============ 1. CONTACTS (5) ============
  INSERT INTO contacts (id, tenant_id, public_id, first_name, last_name, email, phone, company, notes)
  VALUES 
    ('00000000-0000-4000-a000-000000000101', tenant_id, 'SOT-K-MAXMUSTER', 'Max', 'Mustermann', 'max@mustermann.de', '0170 1234567', NULL, 'Eigentümer/Power-User - Dev Account Owner'),
    ('00000000-0000-4000-a000-000000000102', tenant_id, 'SOT-K-LISAMUST', 'Lisa', 'Mustermann', 'lisa@mustermann.de', '0170 2345678', NULL, 'Ehepartnerin von Max Mustermann'),
    ('00000000-0000-4000-a000-000000000103', tenant_id, 'SOT-K-BERGMANN', 'Thomas', 'Bergmann', 't.bergmann@email.de', '0151 9876543', NULL, 'Mieter der Demo-Wohnung DEMO-001'),
    ('00000000-0000-4000-a000-000000000104', tenant_id, 'SOT-K-HOFFMANN', 'Sandra', 'Hoffmann', 's.hoffmann@immo-hv.de', '0221 4567890', 'Immo-HV GmbH', 'Hausverwaltung für WEG Leipziger Straße'),
    ('00000000-0000-4000-a000-000000000105', tenant_id, 'SOT-K-WEBER', 'Michael', 'Weber', 'm.weber@sparkasse.de', '069 1234000', 'Sparkasse Leipzig', 'Bankberater für Finanzierung DEMO-001')
  ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    company = EXCLUDED.company,
    notes = EXCLUDED.notes,
    updated_at = now();

  -- ============ 2. LANDLORD CONTEXT (with tax data) ============
  INSERT INTO landlord_contexts (id, tenant_id, name, context_type, tax_regime, taxable_income_yearly, marginal_tax_rate, solidarity_surcharge, church_tax, church_tax_rate, children_count, child_allowance, notes)
  VALUES 
    ('00000000-0000-4000-a000-000000000110', tenant_id, 'Familie Mustermann', 'married_couple', 'III/V', 98000, 42.00, true, false, NULL, 1, true, 'Zusammenveranlagung Ehepaar')
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    context_type = EXCLUDED.context_type,
    taxable_income_yearly = EXCLUDED.taxable_income_yearly,
    marginal_tax_rate = EXCLUDED.marginal_tax_rate,
    updated_at = now();

  -- ============ 3. CONTEXT MEMBERS ============
  INSERT INTO context_members (id, context_id, tenant_id, first_name, last_name, ownership_share, profession, gross_income_yearly, tax_class, church_tax)
  VALUES 
    ('00000000-0000-4000-a000-000000000111', '00000000-0000-4000-a000-000000000110', tenant_id, 'Max', 'Mustermann', 50.00, 'Softwareentwickler', 72000, 'III', false),
    ('00000000-0000-4000-a000-000000000112', '00000000-0000-4000-a000-000000000110', tenant_id, 'Lisa', 'Mustermann', 50.00, 'Marketing-Managerin', 54000, 'V', false)
  ON CONFLICT (id) DO UPDATE SET
    ownership_share = EXCLUDED.ownership_share,
    gross_income_yearly = EXCLUDED.gross_income_yearly,
    updated_at = now();

  -- ============ 4. PROPERTY ============
  INSERT INTO properties (id, tenant_id, public_id, code, property_type, postal_code, city, address, year_built, total_area_sqm, usage_type, annual_income, market_value, purchase_price, land_register_court, land_register_sheet, parcel_number, status, energy_source, heating_type, weg_flag, mea_total, is_public_listing, owner_context_id)
  VALUES 
    ('00000000-0000-4000-a000-000000000001', tenant_id, 'SOT-I-DEMO001', 'DEMO-001', 'ETW', '04109', 'Leipzig', 'Leipziger Straße 42', 1998, 62, 'residential', 8184, 220000, 200000, 'AG Leipzig', 'Blatt 12345', 'Flurstück 42/5', 'active', 'Fernwärme', 'Zentralheizung', true, 62, false, '00000000-0000-4000-a000-000000000110')
  ON CONFLICT (id) DO UPDATE SET
    code = EXCLUDED.code,
    address = EXCLUDED.address,
    annual_income = EXCLUDED.annual_income,
    market_value = EXCLUDED.market_value,
    owner_context_id = EXCLUDED.owner_context_id,
    updated_at = now();

  -- ============ 5. UNIT ============
  INSERT INTO units (id, tenant_id, public_id, property_id, unit_number, code, area_sqm, current_monthly_rent, usage_type, floor, rooms)
  VALUES 
    ('00000000-0000-4000-a000-000000000002', tenant_id, 'SOT-E-DEMO001M', '00000000-0000-4000-a000-000000000001', 'MAIN', 'WE 42', 62, 682, 'residential', 3, 2)
  ON CONFLICT (id) DO UPDATE SET
    current_monthly_rent = EXCLUDED.current_monthly_rent,
    updated_at = now();

  -- ============ 6. LEASE ============
  INSERT INTO leases (id, tenant_id, unit_id, tenant_contact_id, tenant_name, start_date, end_date, monthly_rent, nk_advance, deposit_eur, payment_day, status, notes)
  VALUES 
    ('00000000-0000-4000-a000-000000000120', tenant_id, '00000000-0000-4000-a000-000000000002', '00000000-0000-4000-a000-000000000103', 'Thomas Bergmann', '2022-06-01', NULL, 682, 155, 2046, 3, 'active', 'Unbefristeter Mietvertrag seit 01.06.2022')
  ON CONFLICT (id) DO UPDATE SET
    monthly_rent = EXCLUDED.monthly_rent,
    nk_advance = EXCLUDED.nk_advance,
    updated_at = now();

  -- ============ 7. LOAN ============
  INSERT INTO loans (id, tenant_id, property_id, scope, bank_name, loan_number, start_date, maturity_date, interest_rate_percent, fixed_interest_end_date, annuity_monthly_eur, repayment_rate_percent, outstanding_balance_eur, outstanding_balance_asof, special_repayment_right_eur_per_year)
  VALUES 
    ('00000000-0000-4000-a000-000000000003', tenant_id, '00000000-0000-4000-a000-000000000001', 'property', 'Sparkasse Leipzig', 'SPK-2022-123456', '2022-03-15', '2042-03-15', 3.60, '2032-03-15', 747, 2.00, 152000, '2026-01-01', 8000)
  ON CONFLICT (id) DO UPDATE SET
    outstanding_balance_eur = EXCLUDED.outstanding_balance_eur,
    outstanding_balance_asof = EXCLUDED.outstanding_balance_asof,
    updated_at = now();

  -- ============ 8. DOCUMENTS (12) ============
  INSERT INTO documents (id, tenant_id, public_id, name, file_path, mime_type, size_bytes, doc_type, scope, source)
  VALUES 
    ('00000000-0000-4000-a000-000000000201', tenant_id, 'SOT-D-000201', 'Exposé_Ankauf_2022.pdf', 'a0000000-0000-4000-a000-000000000001/demo/01_Exposee/Expose.pdf', 'application/pdf', 150000, 'expose_buy', 'property', 'golden_path_seed'),
    ('00000000-0000-4000-a000-000000000202', tenant_id, 'SOT-D-000202', 'Grundbuchauszug_Leipzig.pdf', 'a0000000-0000-4000-a000-000000000001/demo/03_Grundbuch/Grundbuch.pdf', 'application/pdf', 200000, 'land_register', 'property', 'golden_path_seed'),
    ('00000000-0000-4000-a000-000000000203', tenant_id, 'SOT-D-000203', 'Teilungserklaerung_WEG.pdf', 'a0000000-0000-4000-a000-000000000001/demo/04_Teilung/Teilung.pdf', 'application/pdf', 350000, 'division_declaration', 'property', 'golden_path_seed'),
    ('00000000-0000-4000-a000-000000000204', tenant_id, 'SOT-D-000204', 'Grundriss_62qm.pdf', 'a0000000-0000-4000-a000-000000000001/demo/05_Grundriss/Grundriss.pdf', 'application/pdf', 80000, 'floorplan', 'property', 'golden_path_seed'),
    ('00000000-0000-4000-a000-000000000205', tenant_id, 'SOT-D-000205', 'Kaufvertrag_2022.pdf', 'a0000000-0000-4000-a000-000000000001/demo/07_Kaufvertrag/Kaufvertrag.pdf', 'application/pdf', 450000, 'purchase_contract', 'property', 'golden_path_seed'),
    ('00000000-0000-4000-a000-000000000206', tenant_id, 'SOT-D-000206', 'Mietvertrag_Bergmann.pdf', 'a0000000-0000-4000-a000-000000000001/demo/08_Mietvertrag/Mietvertrag.pdf', 'application/pdf', 180000, 'lease_contract', 'property', 'golden_path_seed'),
    ('00000000-0000-4000-a000-000000000207', tenant_id, 'SOT-D-000207', 'WEG_Wirtschaftsplan_2024.pdf', 'a0000000-0000-4000-a000-000000000001/demo/10_WEG/Wirtschaftsplan.pdf', 'application/pdf', 120000, 'weg_plan', 'property', 'golden_path_seed'),
    ('00000000-0000-4000-a000-000000000208', tenant_id, 'SOT-D-000208', 'Versicherungspolice_2024.pdf', 'a0000000-0000-4000-a000-000000000001/demo/13_Versicherung/Versicherung.pdf', 'application/pdf', 95000, 'insurance', 'property', 'golden_path_seed'),
    ('00000000-0000-4000-a000-000000000209', tenant_id, 'SOT-D-000209', 'Darlehensvertrag_Sparkasse.pdf', 'a0000000-0000-4000-a000-000000000001/demo/15_Finanzierung/Darlehen.pdf', 'application/pdf', 280000, 'loan_contract', 'property', 'golden_path_seed'),
    ('00000000-0000-4000-a000-000000000210', tenant_id, 'SOT-D-000210', 'Energieausweis_2022.pdf', 'a0000000-0000-4000-a000-000000000001/demo/12_Energie/Energieausweis.pdf', 'application/pdf', 110000, 'energy_cert', 'property', 'golden_path_seed'),
    ('00000000-0000-4000-a000-000000000211', tenant_id, 'SOT-D-000211', 'Einkommensteuerbescheid_2023.pdf', 'a0000000-0000-4000-a000-000000000001/demo/Stammdaten/ESt.pdf', 'application/pdf', 160000, 'tax_assessment', 'applicant', 'golden_path_seed'),
    ('00000000-0000-4000-a000-000000000212', tenant_id, 'SOT-D-000212', 'Lohnsteuerbescheinigung_2024.pdf', 'a0000000-0000-4000-a000-000000000001/demo/Stammdaten/Lohnsteuer.pdf', 'application/pdf', 75000, 'income_proof', 'applicant', 'golden_path_seed')
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    doc_type = EXCLUDED.doc_type,
    updated_at = now();

  -- ============ 9. MODULE ACTIVATION ============
  INSERT INTO tenant_tile_activation (tenant_id, tile_code, is_active, activated_at)
  SELECT tenant_id, unnest(ARRAY['MOD-01','MOD-02','MOD-03','MOD-04','MOD-05','MOD-06','MOD-07','MOD-08','MOD-09','MOD-10','MOD-11','MOD-12','MOD-13','MOD-14','MOD-15','MOD-16','MOD-17','MOD-18','MOD-19','MOD-20']), true, now()
  ON CONFLICT (tenant_id, tile_code) DO UPDATE SET
    is_active = true,
    activated_at = now();

  -- ============ 10. FINANCE REQUEST ============
  INSERT INTO finance_requests (id, tenant_id, public_id, status, object_source, property_id)
  VALUES 
    ('00000000-0000-4000-a000-000000000004', tenant_id, 'SOT-FR-DEMO001', 'draft', 'mod04_property', '00000000-0000-4000-a000-000000000001')
  ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    updated_at = now();

  -- ============ 11. APPLICANT PROFILE ============
  INSERT INTO applicant_profiles (id, tenant_id, finance_request_id, profile_type, party_role, first_name, last_name, birth_date, birth_place, nationality, marital_status, address_street, address_postal_code, address_city, phone, email, tax_id, adults_count, children_count, children_ages, employment_type, employer_name, employer_location, employer_industry, position, employed_since, net_income_monthly, bonus_yearly, current_rent_monthly, living_expenses_monthly, bank_savings, securities_value, purpose, completion_score)
  VALUES 
    ('00000000-0000-4000-a000-000000000005', tenant_id, '00000000-0000-4000-a000-000000000004', 'private', 'primary', 'Max', 'Mustermann', '1985-08-15', 'München', 'deutsch', 'verheiratet', 'Hauptstraße 10', '04109', 'Leipzig', '0170 1234567', 'max@mustermann.de', '12 345 678 901', 2, 1, '7', 'unbefristet', 'TechCorp GmbH', 'Leipzig', 'IT/Software', 'Senior Developer', '2018-01-15', 4200, 6000, 0, 1200, 35000, 18000, 'refinanzierung', 85)
  ON CONFLICT (id) DO UPDATE SET
    net_income_monthly = EXCLUDED.net_income_monthly,
    completion_score = EXCLUDED.completion_score,
    updated_at = now();

  -- Build result
  SELECT jsonb_build_object(
    'success', true,
    'contacts', (SELECT count(*) FROM contacts WHERE tenant_id = 'a0000000-0000-4000-a000-000000000001'),
    'properties', (SELECT count(*) FROM properties WHERE tenant_id = 'a0000000-0000-4000-a000-000000000001'),
    'units', (SELECT count(*) FROM units WHERE tenant_id = 'a0000000-0000-4000-a000-000000000001'),
    'leases', (SELECT count(*) FROM leases WHERE tenant_id = 'a0000000-0000-4000-a000-000000000001'),
    'loans', (SELECT count(*) FROM loans WHERE tenant_id = 'a0000000-0000-4000-a000-000000000001'),
    'documents', (SELECT count(*) FROM documents WHERE tenant_id = 'a0000000-0000-4000-a000-000000000001'),
    'landlord_contexts', (SELECT count(*) FROM landlord_contexts WHERE tenant_id = 'a0000000-0000-4000-a000-000000000001'),
    'context_members', (SELECT count(*) FROM context_members WHERE tenant_id = 'a0000000-0000-4000-a000-000000000001'),
    'tile_activations', (SELECT count(*) FROM tenant_tile_activation WHERE tenant_id = 'a0000000-0000-4000-a000-000000000001'),
    'finance_requests', (SELECT count(*) FROM finance_requests WHERE tenant_id = 'a0000000-0000-4000-a000-000000000001'),
    'applicant_profiles', (SELECT count(*) FROM applicant_profiles WHERE tenant_id = 'a0000000-0000-4000-a000-000000000001')
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant execute
GRANT EXECUTE ON FUNCTION public.seed_golden_path_data() TO anon;
GRANT EXECUTE ON FUNCTION public.seed_golden_path_data() TO authenticated;