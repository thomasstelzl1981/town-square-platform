-- Golden Path Seed v3: Complete with 12 documents + document_links
CREATE OR REPLACE FUNCTION public.seed_golden_path_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t_id uuid := 'a0000000-0000-4000-a000-000000000001'::uuid;
  prop_id uuid := '00000000-0000-4000-a000-000000000001'::uuid;
  unit_id uuid := '00000000-0000-4000-a000-000000000002'::uuid;
  result jsonb;
BEGIN
  -- 1. CONTACTS (5)
  INSERT INTO contacts (id, tenant_id, public_id, first_name, last_name, email, phone, company, notes) VALUES 
    ('00000000-0000-4000-a000-000000000101', t_id, 'SOT-K-MAXMUSTER', 'Max', 'Mustermann', 'max@mustermann.de', '0170 1234567', NULL, 'Eigentümer'),
    ('00000000-0000-4000-a000-000000000102', t_id, 'SOT-K-LISAMUST', 'Lisa', 'Mustermann', 'lisa@mustermann.de', '0170 2345678', NULL, 'Ehepartnerin'),
    ('00000000-0000-4000-a000-000000000103', t_id, 'SOT-K-BERGMANN', 'Thomas', 'Bergmann', 't.bergmann@email.de', '0151 9876543', NULL, 'Mieter'),
    ('00000000-0000-4000-a000-000000000104', t_id, 'SOT-K-HOFFMANN', 'Sandra', 'Hoffmann', 's.hoffmann@immo-hv.de', '0221 4567890', 'Immo-HV GmbH', 'Hausverwaltung'),
    ('00000000-0000-4000-a000-000000000105', t_id, 'SOT-K-WEBER', 'Michael', 'Weber', 'm.weber@sparkasse.de', '069 1234000', 'Sparkasse Leipzig', 'Bankberater')
  ON CONFLICT (id) DO UPDATE SET first_name = EXCLUDED.first_name, updated_at = now();

  -- 2. LANDLORD CONTEXT (1 + 2 members)
  INSERT INTO landlord_contexts (id, tenant_id, name, context_type, tax_regime, taxable_income_yearly, marginal_tax_rate, solidarity_surcharge, church_tax, children_count, child_allowance, notes)
  VALUES ('00000000-0000-4000-a000-000000000110', t_id, 'Familie Mustermann', 'PRIVATE', 'VERMÖGENSVERWALTUNG', 98000, 42.00, true, false, 1, true, 'Zusammenveranlagung')
  ON CONFLICT (id) DO UPDATE SET taxable_income_yearly = EXCLUDED.taxable_income_yearly, updated_at = now();

  INSERT INTO context_members (id, context_id, tenant_id, first_name, last_name, ownership_share, profession, gross_income_yearly, tax_class, church_tax) VALUES 
    ('00000000-0000-4000-a000-000000000111', '00000000-0000-4000-a000-000000000110', t_id, 'Max', 'Mustermann', 50.00, 'Softwareentwickler', 72000, 'III', false),
    ('00000000-0000-4000-a000-000000000112', '00000000-0000-4000-a000-000000000110', t_id, 'Lisa', 'Mustermann', 50.00, 'Marketing-Managerin', 54000, 'V', false)
  ON CONFLICT (id) DO UPDATE SET gross_income_yearly = EXCLUDED.gross_income_yearly, updated_at = now();

  -- 3. PROPERTY + UNIT
  INSERT INTO properties (id, tenant_id, public_id, code, property_type, postal_code, city, address, year_built, total_area_sqm, usage_type, annual_income, market_value, purchase_price, status, weg_flag, owner_context_id)
  VALUES (prop_id, t_id, 'SOT-I-DEMO001', 'DEMO-001', 'ETW', '04109', 'Leipzig', 'Leipziger Straße 42', 1998, 62, 'residential', 8184, 220000, 200000, 'active', true, '00000000-0000-4000-a000-000000000110')
  ON CONFLICT (id) DO UPDATE SET annual_income = EXCLUDED.annual_income, updated_at = now();

  INSERT INTO units (id, tenant_id, public_id, property_id, unit_number, code, area_sqm, current_monthly_rent, usage_type, floor, rooms)
  VALUES (unit_id, t_id, 'SOT-E-DEMO001M', prop_id, 'MAIN', 'WE 42', 62, 682, 'residential', 3, 2)
  ON CONFLICT (id) DO UPDATE SET current_monthly_rent = EXCLUDED.current_monthly_rent, updated_at = now();

  -- 4. LEASE (1 active)
  INSERT INTO leases (id, tenant_id, unit_id, tenant_contact_id, start_date, monthly_rent, rent_cold_eur, nk_advance_eur, deposit_amount_eur, payment_due_day, status)
  VALUES ('00000000-0000-4000-a000-000000000120', t_id, unit_id, '00000000-0000-4000-a000-000000000103', '2022-06-01', 837, 682, 155, 2046, 3, 'active')
  ON CONFLICT (id) DO UPDATE SET monthly_rent = EXCLUDED.monthly_rent, updated_at = now();

  -- 5. LOAN (1)
  INSERT INTO loans (id, tenant_id, property_id, scope, bank_name, loan_number, start_date, maturity_date, interest_rate_percent, annuity_monthly_eur, repayment_rate_percent, outstanding_balance_eur, outstanding_balance_asof)
  VALUES ('00000000-0000-4000-a000-000000000003', t_id, prop_id, 'property', 'Sparkasse Leipzig', 'SPK-2022-123456', '2022-03-15', '2042-03-15', 3.60, 747, 2.00, 152000, '2026-01-01')
  ON CONFLICT (id) DO UPDATE SET outstanding_balance_eur = EXCLUDED.outstanding_balance_eur, updated_at = now();

  -- 6. DOCUMENTS (12)
  INSERT INTO documents (id, tenant_id, public_id, name, file_path, mime_type, size_bytes, doc_type, scope, source) VALUES 
    ('00000000-0000-4000-a000-000000000201', t_id, 'SOT-D-000201', 'Exposé.pdf', 'demo/01/Expose.pdf', 'application/pdf', 150000, 'expose_buy', 'property', 'import'),
    ('00000000-0000-4000-a000-000000000202', t_id, 'SOT-D-000202', 'Grundbuch.pdf', 'demo/03/Grundbuch.pdf', 'application/pdf', 200000, 'land_register', 'property', 'import'),
    ('00000000-0000-4000-a000-000000000203', t_id, 'SOT-D-000203', 'Teilungserklärung.pdf', 'demo/04/TE.pdf', 'application/pdf', 350000, 'division_declaration', 'property', 'import'),
    ('00000000-0000-4000-a000-000000000204', t_id, 'SOT-D-000204', 'Grundriss.pdf', 'demo/05/Grundriss.pdf', 'application/pdf', 120000, 'floor_plan', 'property', 'import'),
    ('00000000-0000-4000-a000-000000000205', t_id, 'SOT-D-000205', 'Kaufvertrag.pdf', 'demo/02/Kaufvertrag.pdf', 'application/pdf', 400000, 'purchase_contract', 'property', 'import'),
    ('00000000-0000-4000-a000-000000000206', t_id, 'SOT-D-000206', 'Mietvertrag.pdf', 'demo/08/Mietvertrag.pdf', 'application/pdf', 180000, 'lease_contract', 'property', 'import'),
    ('00000000-0000-4000-a000-000000000207', t_id, 'SOT-D-000207', 'Wirtschaftsplan.pdf', 'demo/09/WiPlan.pdf', 'application/pdf', 220000, 'business_plan', 'property', 'import'),
    ('00000000-0000-4000-a000-000000000208', t_id, 'SOT-D-000208', 'Gebäudeversicherung.pdf', 'demo/11/Versicherung.pdf', 'application/pdf', 95000, 'insurance', 'property', 'import'),
    ('00000000-0000-4000-a000-000000000209', t_id, 'SOT-D-000209', 'Darlehensvertrag.pdf', 'demo/15/Darlehen.pdf', 'application/pdf', 280000, 'loan_contract', 'property', 'import'),
    ('00000000-0000-4000-a000-000000000210', t_id, 'SOT-D-000210', 'Energieausweis.pdf', 'demo/07/Energie.pdf', 'application/pdf', 140000, 'energy_certificate', 'property', 'import'),
    ('00000000-0000-4000-a000-000000000211', t_id, 'SOT-D-000211', 'ESt-Bescheid.pdf', 'demo/fin/EstBescheid.pdf', 'application/pdf', 160000, 'tax_assessment', 'applicant', 'import'),
    ('00000000-0000-4000-a000-000000000212', t_id, 'SOT-D-000212', 'Gehaltsabrechnung.pdf', 'demo/fin/Lohn.pdf', 'application/pdf', 90000, 'payslip', 'applicant', 'import')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = now();

  -- 7. DOCUMENT LINKS (map to storage folders)
  INSERT INTO document_links (id, tenant_id, document_id, object_type, object_id, link_status) VALUES
    ('00000000-0000-4000-a000-000000000301', t_id, '00000000-0000-4000-a000-000000000201', 'property', prop_id, 'active'),
    ('00000000-0000-4000-a000-000000000302', t_id, '00000000-0000-4000-a000-000000000202', 'property', prop_id, 'active'),
    ('00000000-0000-4000-a000-000000000303', t_id, '00000000-0000-4000-a000-000000000203', 'property', prop_id, 'active'),
    ('00000000-0000-4000-a000-000000000304', t_id, '00000000-0000-4000-a000-000000000204', 'property', prop_id, 'active'),
    ('00000000-0000-4000-a000-000000000305', t_id, '00000000-0000-4000-a000-000000000205', 'property', prop_id, 'active'),
    ('00000000-0000-4000-a000-000000000306', t_id, '00000000-0000-4000-a000-000000000206', 'unit', unit_id, 'active'),
    ('00000000-0000-4000-a000-000000000307', t_id, '00000000-0000-4000-a000-000000000207', 'property', prop_id, 'active'),
    ('00000000-0000-4000-a000-000000000308', t_id, '00000000-0000-4000-a000-000000000208', 'property', prop_id, 'active'),
    ('00000000-0000-4000-a000-000000000309', t_id, '00000000-0000-4000-a000-000000000209', 'property', prop_id, 'active'),
    ('00000000-0000-4000-a000-000000000310', t_id, '00000000-0000-4000-a000-000000000210', 'property', prop_id, 'active'),
    ('00000000-0000-4000-a000-000000000311', t_id, '00000000-0000-4000-a000-000000000211', 'applicant', '00000000-0000-4000-a000-000000000005', 'active'),
    ('00000000-0000-4000-a000-000000000312', t_id, '00000000-0000-4000-a000-000000000212', 'applicant', '00000000-0000-4000-a000-000000000005', 'active')
  ON CONFLICT (id) DO UPDATE SET link_status = EXCLUDED.link_status;

  -- 8. FINANCE REQUEST + APPLICANT PROFILE
  INSERT INTO finance_requests (id, tenant_id, public_id, property_id, status, object_source)
  VALUES ('00000000-0000-4000-a000-000000000004', t_id, 'SOT-F-DEMO001', prop_id, 'draft', 'portfolio')
  ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, updated_at = now();

  INSERT INTO applicant_profiles (id, tenant_id, finance_request_id, party_role, profile_type, first_name, last_name, email, phone, birth_date, nationality, marital_status, address_street, address_postal_code, address_city, employment_type, employer_name, employer_location, net_income_monthly, bonus_yearly, bank_savings, securities_value, purchase_price, loan_amount_requested, equity_amount, purpose, completion_score)
  VALUES ('00000000-0000-4000-a000-000000000005', t_id, '00000000-0000-4000-a000-000000000004', 'applicant', 'private', 'Max', 'Mustermann', 'max@mustermann.de', '0170 1234567', '1985-06-15', 'DE', 'married', 'Musterstraße 1', '04109', 'Leipzig', 'employed', 'TechCorp GmbH', 'Leipzig', 4800, 6000, 35000, 15000, 220000, 176000, 44000, 'investment', 85)
  ON CONFLICT (id) DO UPDATE SET completion_score = EXCLUDED.completion_score, updated_at = now();

  -- 9. MODULE ACTIVATIONS
  INSERT INTO tenant_tile_activation (tenant_id, tile_code, status, activated_at)
  VALUES (t_id, 'MOD-01', 'active', now()), (t_id, 'MOD-02', 'active', now()), (t_id, 'MOD-03', 'active', now()), (t_id, 'MOD-04', 'active', now()), (t_id, 'MOD-05', 'active', now()), (t_id, 'MOD-06', 'active', now()), (t_id, 'MOD-07', 'active', now()), (t_id, 'MOD-08', 'active', now()), (t_id, 'MOD-09', 'active', now()), (t_id, 'MOD-10', 'active', now()), (t_id, 'MOD-11', 'active', now()), (t_id, 'MOD-12', 'active', now()), (t_id, 'MOD-13', 'active', now()), (t_id, 'MOD-14', 'active', now()), (t_id, 'MOD-15', 'active', now()), (t_id, 'MOD-16', 'active', now()), (t_id, 'MOD-17', 'active', now()), (t_id, 'MOD-18', 'active', now()), (t_id, 'MOD-19', 'active', now()), (t_id, 'MOD-20', 'active', now())
  ON CONFLICT (tenant_id, tile_code) DO UPDATE SET status = 'active';

  -- Return counts
  SELECT jsonb_build_object(
    'success', true,
    'contacts', (SELECT count(*) FROM contacts WHERE tenant_id = t_id),
    'context_members', (SELECT count(*) FROM context_members WHERE tenant_id = t_id),
    'properties', (SELECT count(*) FROM properties WHERE tenant_id = t_id),
    'units', (SELECT count(*) FROM units WHERE tenant_id = t_id),
    'leases', (SELECT count(*) FROM leases WHERE tenant_id = t_id),
    'loans', (SELECT count(*) FROM loans WHERE tenant_id = t_id),
    'documents', (SELECT count(*) FROM documents WHERE tenant_id = t_id),
    'document_links', (SELECT count(*) FROM document_links WHERE tenant_id = t_id),
    'finance_requests', (SELECT count(*) FROM finance_requests WHERE tenant_id = t_id),
    'applicant_profiles', (SELECT count(*) FROM applicant_profiles WHERE tenant_id = t_id)
  ) INTO result;
  
  RETURN result;
END;
$$;