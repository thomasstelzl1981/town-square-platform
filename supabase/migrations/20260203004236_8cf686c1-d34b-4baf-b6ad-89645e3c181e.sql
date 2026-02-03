-- Fix seed function: correct column name for tenant_tile_activation
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
  -- 1. CONTACTS
  INSERT INTO contacts (id, tenant_id, public_id, first_name, last_name, email, phone, company, notes)
  VALUES 
    ('00000000-0000-4000-a000-000000000101', tenant_id, 'SOT-K-MAXMUSTER', 'Max', 'Mustermann', 'max@mustermann.de', '0170 1234567', NULL, 'Eigentümer'),
    ('00000000-0000-4000-a000-000000000102', tenant_id, 'SOT-K-LISAMUST', 'Lisa', 'Mustermann', 'lisa@mustermann.de', '0170 2345678', NULL, 'Ehepartnerin'),
    ('00000000-0000-4000-a000-000000000103', tenant_id, 'SOT-K-BERGMANN', 'Thomas', 'Bergmann', 't.bergmann@email.de', '0151 9876543', NULL, 'Mieter'),
    ('00000000-0000-4000-a000-000000000104', tenant_id, 'SOT-K-HOFFMANN', 'Sandra', 'Hoffmann', 's.hoffmann@immo-hv.de', '0221 4567890', 'Immo-HV GmbH', 'Hausverwaltung'),
    ('00000000-0000-4000-a000-000000000105', tenant_id, 'SOT-K-WEBER', 'Michael', 'Weber', 'm.weber@sparkasse.de', '069 1234000', 'Sparkasse Leipzig', 'Bankberater')
  ON CONFLICT (id) DO UPDATE SET first_name = EXCLUDED.first_name, updated_at = now();

  -- 2. LANDLORD CONTEXT
  INSERT INTO landlord_contexts (id, tenant_id, name, context_type, tax_regime, taxable_income_yearly, marginal_tax_rate, solidarity_surcharge, church_tax, children_count, child_allowance, notes)
  VALUES ('00000000-0000-4000-a000-000000000110', tenant_id, 'Familie Mustermann', 'PRIVATE', 'VERMÖGENSVERWALTUNG', 98000, 42.00, true, false, 1, true, 'Zusammenveranlagung')
  ON CONFLICT (id) DO UPDATE SET taxable_income_yearly = EXCLUDED.taxable_income_yearly, updated_at = now();

  -- 3. CONTEXT MEMBERS
  INSERT INTO context_members (id, context_id, tenant_id, first_name, last_name, ownership_share, profession, gross_income_yearly, tax_class, church_tax)
  VALUES 
    ('00000000-0000-4000-a000-000000000111', '00000000-0000-4000-a000-000000000110', tenant_id, 'Max', 'Mustermann', 50.00, 'Softwareentwickler', 72000, 'III', false),
    ('00000000-0000-4000-a000-000000000112', '00000000-0000-4000-a000-000000000110', tenant_id, 'Lisa', 'Mustermann', 50.00, 'Marketing-Managerin', 54000, 'V', false)
  ON CONFLICT (id) DO UPDATE SET gross_income_yearly = EXCLUDED.gross_income_yearly, updated_at = now();

  -- 4. PROPERTY
  INSERT INTO properties (id, tenant_id, public_id, code, property_type, postal_code, city, address, year_built, total_area_sqm, usage_type, annual_income, market_value, purchase_price, status, weg_flag, owner_context_id)
  VALUES ('00000000-0000-4000-a000-000000000001', tenant_id, 'SOT-I-DEMO001', 'DEMO-001', 'ETW', '04109', 'Leipzig', 'Leipziger Straße 42', 1998, 62, 'residential', 8184, 220000, 200000, 'active', true, '00000000-0000-4000-a000-000000000110')
  ON CONFLICT (id) DO UPDATE SET annual_income = EXCLUDED.annual_income, updated_at = now();

  -- 5. UNIT
  INSERT INTO units (id, tenant_id, public_id, property_id, unit_number, code, area_sqm, current_monthly_rent, usage_type, floor, rooms)
  VALUES ('00000000-0000-4000-a000-000000000002', tenant_id, 'SOT-E-DEMO001M', '00000000-0000-4000-a000-000000000001', 'MAIN', 'WE 42', 62, 682, 'residential', 3, 2)
  ON CONFLICT (id) DO UPDATE SET current_monthly_rent = EXCLUDED.current_monthly_rent, updated_at = now();

  -- 6. LEASE
  INSERT INTO leases (id, tenant_id, unit_id, tenant_contact_id, start_date, monthly_rent, rent_cold_eur, nk_advance_eur, deposit_amount_eur, payment_due_day, status)
  VALUES ('00000000-0000-4000-a000-000000000120', tenant_id, '00000000-0000-4000-a000-000000000002', '00000000-0000-4000-a000-000000000103', '2022-06-01', 837, 682, 155, 2046, 3, 'active')
  ON CONFLICT (id) DO UPDATE SET monthly_rent = EXCLUDED.monthly_rent, updated_at = now();

  -- 7. LOAN
  INSERT INTO loans (id, tenant_id, property_id, scope, bank_name, loan_number, start_date, maturity_date, interest_rate_percent, annuity_monthly_eur, repayment_rate_percent, outstanding_balance_eur, outstanding_balance_asof)
  VALUES ('00000000-0000-4000-a000-000000000003', tenant_id, '00000000-0000-4000-a000-000000000001', 'property', 'Sparkasse Leipzig', 'SPK-2022-123456', '2022-03-15', '2042-03-15', 3.60, 747, 2.00, 152000, '2026-01-01')
  ON CONFLICT (id) DO UPDATE SET outstanding_balance_eur = EXCLUDED.outstanding_balance_eur, updated_at = now();

  -- 8. DOCUMENTS
  INSERT INTO documents (id, tenant_id, public_id, name, file_path, mime_type, size_bytes, doc_type, scope, source)
  VALUES 
    ('00000000-0000-4000-a000-000000000201', tenant_id, 'SOT-D-000201', 'Exposé.pdf', 'demo/01/Expose.pdf', 'application/pdf', 150000, 'expose_buy', 'property', 'import'),
    ('00000000-0000-4000-a000-000000000202', tenant_id, 'SOT-D-000202', 'Grundbuch.pdf', 'demo/03/Grundbuch.pdf', 'application/pdf', 200000, 'land_register', 'property', 'import'),
    ('00000000-0000-4000-a000-000000000203', tenant_id, 'SOT-D-000203', 'Teilung.pdf', 'demo/04/Teilung.pdf', 'application/pdf', 350000, 'division_declaration', 'property', 'import'),
    ('00000000-0000-4000-a000-000000000204', tenant_id, 'SOT-D-000204', 'Grundriss.pdf', 'demo/05/Grundriss.pdf', 'application/pdf', 80000, 'floorplan', 'property', 'import'),
    ('00000000-0000-4000-a000-000000000205', tenant_id, 'SOT-D-000205', 'Kaufvertrag.pdf', 'demo/07/Kaufvertrag.pdf', 'application/pdf', 450000, 'purchase_contract', 'property', 'import'),
    ('00000000-0000-4000-a000-000000000206', tenant_id, 'SOT-D-000206', 'Mietvertrag.pdf', 'demo/08/Mietvertrag.pdf', 'application/pdf', 180000, 'lease_contract', 'property', 'import'),
    ('00000000-0000-4000-a000-000000000207', tenant_id, 'SOT-D-000207', 'Wirtschaftsplan.pdf', 'demo/10/WEG.pdf', 'application/pdf', 120000, 'weg_plan', 'property', 'import'),
    ('00000000-0000-4000-a000-000000000208', tenant_id, 'SOT-D-000208', 'Versicherung.pdf', 'demo/13/Versicherung.pdf', 'application/pdf', 95000, 'insurance', 'property', 'import'),
    ('00000000-0000-4000-a000-000000000209', tenant_id, 'SOT-D-000209', 'Darlehen.pdf', 'demo/15/Darlehen.pdf', 'application/pdf', 280000, 'loan_contract', 'property', 'import'),
    ('00000000-0000-4000-a000-000000000210', tenant_id, 'SOT-D-000210', 'Energieausweis.pdf', 'demo/12/Energie.pdf', 'application/pdf', 110000, 'energy_cert', 'property', 'import'),
    ('00000000-0000-4000-a000-000000000211', tenant_id, 'SOT-D-000211', 'ESt_Bescheid.pdf', 'demo/SD/ESt.pdf', 'application/pdf', 160000, 'tax_assessment', 'applicant', 'import'),
    ('00000000-0000-4000-a000-000000000212', tenant_id, 'SOT-D-000212', 'Lohnsteuer.pdf', 'demo/SD/Lohnst.pdf', 'application/pdf', 75000, 'income_proof', 'applicant', 'import')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = now();

  -- 9. MODULE ACTIVATION (using correct 'status' column)
  INSERT INTO tenant_tile_activation (tenant_id, tile_code, status, activated_at)
  SELECT tenant_id, unnest(ARRAY['MOD-01','MOD-02','MOD-03','MOD-04','MOD-05','MOD-06','MOD-07','MOD-08','MOD-09','MOD-10','MOD-11','MOD-12','MOD-13','MOD-14','MOD-15','MOD-16','MOD-17','MOD-18','MOD-19','MOD-20']), 'active', now()
  ON CONFLICT (tenant_id, tile_code) DO UPDATE SET status = 'active', activated_at = now();

  -- 10. FINANCE REQUEST
  INSERT INTO finance_requests (id, tenant_id, public_id, status, object_source, property_id)
  VALUES ('00000000-0000-4000-a000-000000000004', tenant_id, 'SOT-FR-DEMO001', 'draft', 'mod04_property', '00000000-0000-4000-a000-000000000001')
  ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, updated_at = now();

  -- 11. APPLICANT PROFILE
  INSERT INTO applicant_profiles (id, tenant_id, finance_request_id, profile_type, party_role, first_name, last_name, birth_date, nationality, marital_status, address_street, address_postal_code, address_city, phone, email, employment_type, employer_name, net_income_monthly, bank_savings, purpose, completion_score)
  VALUES ('00000000-0000-4000-a000-000000000005', tenant_id, '00000000-0000-4000-a000-000000000004', 'private', 'primary', 'Max', 'Mustermann', '1985-08-15', 'deutsch', 'verheiratet', 'Hauptstraße 10', '04109', 'Leipzig', '0170 1234567', 'max@mustermann.de', 'unbefristet', 'TechCorp GmbH', 4200, 35000, 'refinanzierung', 85)
  ON CONFLICT (id) DO UPDATE SET completion_score = EXCLUDED.completion_score, updated_at = now();

  -- Result
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
    'tile_activations', (SELECT count(*) FROM tenant_tile_activation WHERE tenant_id = 'a0000000-0000-4000-a000-000000000001')
  ) INTO result;
  RETURN result;
END;
$$;