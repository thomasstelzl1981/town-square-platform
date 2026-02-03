-- Fix: rename variable to avoid ambiguity
CREATE OR REPLACE FUNCTION public.seed_golden_path_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t_id uuid := 'a0000000-0000-4000-a000-000000000001'::uuid;
  result jsonb;
BEGIN
  INSERT INTO contacts (id, tenant_id, public_id, first_name, last_name, email, phone, company, notes) VALUES 
    ('00000000-0000-4000-a000-000000000101', t_id, 'SOT-K-MAXMUSTER', 'Max', 'Mustermann', 'max@mustermann.de', '0170 1234567', NULL, 'Eigentümer'),
    ('00000000-0000-4000-a000-000000000102', t_id, 'SOT-K-LISAMUST', 'Lisa', 'Mustermann', 'lisa@mustermann.de', '0170 2345678', NULL, 'Ehepartnerin'),
    ('00000000-0000-4000-a000-000000000103', t_id, 'SOT-K-BERGMANN', 'Thomas', 'Bergmann', 't.bergmann@email.de', '0151 9876543', NULL, 'Mieter'),
    ('00000000-0000-4000-a000-000000000104', t_id, 'SOT-K-HOFFMANN', 'Sandra', 'Hoffmann', 's.hoffmann@immo-hv.de', '0221 4567890', 'Immo-HV GmbH', 'Hausverwaltung'),
    ('00000000-0000-4000-a000-000000000105', t_id, 'SOT-K-WEBER', 'Michael', 'Weber', 'm.weber@sparkasse.de', '069 1234000', 'Sparkasse Leipzig', 'Bankberater')
  ON CONFLICT (id) DO UPDATE SET first_name = EXCLUDED.first_name, updated_at = now();

  INSERT INTO landlord_contexts (id, tenant_id, name, context_type, tax_regime, taxable_income_yearly, marginal_tax_rate, solidarity_surcharge, church_tax, children_count, child_allowance, notes)
  VALUES ('00000000-0000-4000-a000-000000000110', t_id, 'Familie Mustermann', 'PRIVATE', 'VERMÖGENSVERWALTUNG', 98000, 42.00, true, false, 1, true, 'Zusammenveranlagung')
  ON CONFLICT (id) DO UPDATE SET taxable_income_yearly = EXCLUDED.taxable_income_yearly, updated_at = now();

  INSERT INTO context_members (id, context_id, tenant_id, first_name, last_name, ownership_share, profession, gross_income_yearly, tax_class, church_tax) VALUES 
    ('00000000-0000-4000-a000-000000000111', '00000000-0000-4000-a000-000000000110', t_id, 'Max', 'Mustermann', 50.00, 'Softwareentwickler', 72000, 'III', false),
    ('00000000-0000-4000-a000-000000000112', '00000000-0000-4000-a000-000000000110', t_id, 'Lisa', 'Mustermann', 50.00, 'Marketing-Managerin', 54000, 'V', false)
  ON CONFLICT (id) DO UPDATE SET gross_income_yearly = EXCLUDED.gross_income_yearly, updated_at = now();

  INSERT INTO properties (id, tenant_id, public_id, code, property_type, postal_code, city, address, year_built, total_area_sqm, usage_type, annual_income, market_value, purchase_price, status, weg_flag, owner_context_id)
  VALUES ('00000000-0000-4000-a000-000000000001', t_id, 'SOT-I-DEMO001', 'DEMO-001', 'ETW', '04109', 'Leipzig', 'Leipziger Straße 42', 1998, 62, 'residential', 8184, 220000, 200000, 'active', true, '00000000-0000-4000-a000-000000000110')
  ON CONFLICT (id) DO UPDATE SET annual_income = EXCLUDED.annual_income, updated_at = now();

  INSERT INTO units (id, tenant_id, public_id, property_id, unit_number, code, area_sqm, current_monthly_rent, usage_type, floor, rooms)
  VALUES ('00000000-0000-4000-a000-000000000002', t_id, 'SOT-E-DEMO001M', '00000000-0000-4000-a000-000000000001', 'MAIN', 'WE 42', 62, 682, 'residential', 3, 2)
  ON CONFLICT (id) DO UPDATE SET current_monthly_rent = EXCLUDED.current_monthly_rent, updated_at = now();

  INSERT INTO leases (id, tenant_id, unit_id, tenant_contact_id, start_date, monthly_rent, rent_cold_eur, nk_advance_eur, deposit_amount_eur, payment_due_day, status)
  VALUES ('00000000-0000-4000-a000-000000000120', t_id, '00000000-0000-4000-a000-000000000002', '00000000-0000-4000-a000-000000000103', '2022-06-01', 837, 682, 155, 2046, 3, 'active')
  ON CONFLICT (id) DO UPDATE SET monthly_rent = EXCLUDED.monthly_rent, updated_at = now();

  INSERT INTO loans (id, tenant_id, property_id, scope, bank_name, loan_number, start_date, maturity_date, interest_rate_percent, annuity_monthly_eur, repayment_rate_percent, outstanding_balance_eur, outstanding_balance_asof)
  VALUES ('00000000-0000-4000-a000-000000000003', t_id, '00000000-0000-4000-a000-000000000001', 'property', 'Sparkasse Leipzig', 'SPK-2022-123456', '2022-03-15', '2042-03-15', 3.60, 747, 2.00, 152000, '2026-01-01')
  ON CONFLICT (id) DO UPDATE SET outstanding_balance_eur = EXCLUDED.outstanding_balance_eur, updated_at = now();

  INSERT INTO documents (id, tenant_id, public_id, name, file_path, mime_type, size_bytes, doc_type, scope, source) VALUES 
    ('00000000-0000-4000-a000-000000000201', t_id, 'SOT-D-000201', 'Exposé.pdf', 'demo/01/Expose.pdf', 'application/pdf', 150000, 'expose_buy', 'property', 'import'),
    ('00000000-0000-4000-a000-000000000202', t_id, 'SOT-D-000202', 'Grundbuch.pdf', 'demo/03/Grundbuch.pdf', 'application/pdf', 200000, 'land_register', 'property', 'import'),
    ('00000000-0000-4000-a000-000000000206', t_id, 'SOT-D-000206', 'Mietvertrag.pdf', 'demo/08/Mietvertrag.pdf', 'application/pdf', 180000, 'lease_contract', 'property', 'import'),
    ('00000000-0000-4000-a000-000000000209', t_id, 'SOT-D-000209', 'Darlehen.pdf', 'demo/15/Darlehen.pdf', 'application/pdf', 280000, 'loan_contract', 'property', 'import')
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = now();

  INSERT INTO tenant_tile_activation (tenant_id, tile_code, status, activated_at)
  VALUES (t_id, 'MOD-01', 'active', now()), (t_id, 'MOD-02', 'active', now()), (t_id, 'MOD-03', 'active', now()), (t_id, 'MOD-04', 'active', now()), (t_id, 'MOD-05', 'active', now()), (t_id, 'MOD-06', 'active', now()), (t_id, 'MOD-07', 'active', now()), (t_id, 'MOD-08', 'active', now()), (t_id, 'MOD-09', 'active', now()), (t_id, 'MOD-10', 'active', now())
  ON CONFLICT (tenant_id, tile_code) DO UPDATE SET status = 'active';

  SELECT jsonb_build_object('success', true, 'contacts', (SELECT count(*) FROM contacts WHERE tenant_id = t_id), 'properties', (SELECT count(*) FROM properties WHERE tenant_id = t_id), 'documents', (SELECT count(*) FROM documents WHERE tenant_id = t_id)) INTO result;
  RETURN result;
END;
$$;