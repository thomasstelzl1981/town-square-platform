-- ============================================
-- GOLDEN PATH V4: FINAL (alle Spalten korrekt)
-- ============================================

DO $$ 
DECLARE
  v_tenant_id UUID := 'a0000000-0000-4000-a000-000000000001';
  v_context_id UUID := 'b0000000-0000-4000-b000-000000000001';
  v_property_id UUID := 'c0000000-0000-4000-c000-000000000001';
  v_unit_id UUID;
  v_contact_mieter UUID := 'd0000000-0000-4000-d000-000000000001';
  v_contact_hv UUID := 'd0000000-0000-4000-d000-000000000002';
  v_contact_bank UUID := 'd0000000-0000-4000-d000-000000000003';
BEGIN
  -- PHASE 1: LÖSCHUNG
  DELETE FROM document_links WHERE tenant_id = v_tenant_id;
  DELETE FROM documents WHERE tenant_id = v_tenant_id;
  DELETE FROM leases WHERE tenant_id = v_tenant_id;
  DELETE FROM loans WHERE tenant_id = v_tenant_id;
  DELETE FROM units WHERE tenant_id = v_tenant_id;
  DELETE FROM context_property_assignment WHERE tenant_id = v_tenant_id;
  DELETE FROM properties WHERE tenant_id = v_tenant_id;
  DELETE FROM context_members WHERE tenant_id = v_tenant_id;
  DELETE FROM landlord_contexts WHERE tenant_id = v_tenant_id;
  DELETE FROM contacts WHERE tenant_id = v_tenant_id;
  DELETE FROM storage_nodes WHERE tenant_id = v_tenant_id;
  DELETE FROM tenant_tile_activation WHERE tenant_id = v_tenant_id;

  -- Landlord Context
  INSERT INTO landlord_contexts (
    id, tenant_id, name, context_type, tax_regime, 
    taxable_income_yearly, marginal_tax_rate, is_default
  ) VALUES (
    v_context_id, v_tenant_id, 'Familie Mustermann', 'PRIVATE', 'VERMÖGENSVERWALTUNG',
    98000, 0.42, true
  );

  -- Context Members
  INSERT INTO context_members (id, context_id, tenant_id, first_name, last_name, ownership_share, gross_income_yearly, profession, tax_class, church_tax)
  VALUES 
  ('e0000000-0000-4000-e000-000000000001', v_context_id, v_tenant_id, 'Max', 'Mustermann', 50, 72000, 'Softwareentwickler', 'III', false),
  ('e0000000-0000-4000-e000-000000000002', v_context_id, v_tenant_id, 'Lisa', 'Mustermann', 50, 54000, 'Marketing-Managerin', 'V', false);

  -- Kontakte
  INSERT INTO contacts (id, tenant_id, first_name, last_name, email, company, notes, public_id)
  VALUES 
  (v_contact_mieter, v_tenant_id, 'Thomas', 'Bergmann', 't.bergmann@email.de', NULL, 'Mieter seit 2022', 'CON-001'),
  (v_contact_hv, v_tenant_id, 'Sandra', 'Hoffmann', 's.hoffmann@immo-hv.de', 'Immo-HV GmbH', 'Hausverwaltung WEG', 'CON-002'),
  (v_contact_bank, v_tenant_id, 'Michael', 'Weber', 'm.weber@sparkasse.de', 'Sparkasse Leipzig', 'Bankberater Finanzierung', 'CON-003');

  -- Property
  INSERT INTO properties (id, tenant_id, code, city, address, postal_code, country, property_type, year_built, purchase_price, market_value, owner_context_id)
  VALUES (v_property_id, v_tenant_id, 'DEMO-001', 'Leipzig', 'Leipziger Str. 42', '04109', 'DE', 'ETW', 1998, 200000, 220000, v_context_id);

  -- MAIN-Unit holen
  SELECT id INTO v_unit_id FROM units WHERE property_id = v_property_id AND unit_number = 'MAIN';
  IF v_unit_id IS NULL THEN RAISE EXCEPTION 'MAIN-Unit fehlt!'; END IF;
  
  -- MAIN-Unit aktualisieren
  UPDATE units SET area_sqm = 62, rooms = 3, floor = 3, current_monthly_rent = 682 WHERE id = v_unit_id;

  -- Lease
  INSERT INTO leases (id, unit_id, tenant_id, tenant_contact_id, monthly_rent, rent_cold_eur, nk_advance_eur, start_date, status)
  VALUES ('f0000000-0000-4000-f000-000000000001', v_unit_id, v_tenant_id, v_contact_mieter, 837, 682, 155, '2022-06-01', 'active');

  -- Loan
  INSERT INTO loans (id, property_id, tenant_id, scope, bank_name, loan_number, original_amount, outstanding_balance_eur, interest_rate_percent, start_date, fixed_interest_end_date, annuity_monthly_eur)
  VALUES ('f0000000-0000-4000-f000-000000000002', v_property_id, v_tenant_id, 'property', 'Sparkasse Leipzig', 'SPK-2020-12345', 160000, 152000, 3.25, '2020-03-01', '2030-03-01', 620);

  -- Module (korrigiert: tile_code + status statt tile_id + enabled)
  INSERT INTO tenant_tile_activation (tenant_id, tile_code, status, activated_at)
  VALUES 
    (v_tenant_id, 'MOD-01', 'active', now()),
    (v_tenant_id, 'MOD-02', 'active', now()),
    (v_tenant_id, 'MOD-03', 'active', now()),
    (v_tenant_id, 'MOD-04', 'active', now()),
    (v_tenant_id, 'MOD-05', 'active', now()),
    (v_tenant_id, 'MOD-06', 'active', now()),
    (v_tenant_id, 'MOD-07', 'active', now()),
    (v_tenant_id, 'MOD-08', 'active', now()),
    (v_tenant_id, 'MOD-09', 'active', now()),
    (v_tenant_id, 'MOD-10', 'active', now());

END $$;