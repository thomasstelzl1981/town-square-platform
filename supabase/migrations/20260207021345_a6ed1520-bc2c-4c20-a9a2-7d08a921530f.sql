-- ============================================================
-- CAR MANAGEMENT DEMO DATA (IDEMPOTENT)
-- 1) Extend object_type constraint to allow 'vehicle' and 'insurance'
-- 2) Insert 2 Vehicles: Porsche 911 (B-P911) + BMW M5 (M-M5005)
-- + Financing + Insurance + DMS Trees + Sample Documents
-- ============================================================

-- First, drop and recreate the object_type check constraint to include 'vehicle' and 'insurance'
ALTER TABLE document_links DROP CONSTRAINT IF EXISTS document_links_object_type_check;
ALTER TABLE document_links ADD CONSTRAINT document_links_object_type_check 
  CHECK (object_type = ANY (ARRAY['property'::text, 'unit'::text, 'contact'::text, 'finance_case'::text, 'service_case'::text, 'vehicle'::text, 'insurance'::text, 'lease'::text]));

-- Now insert the demo data
DO $$
DECLARE
  t_id uuid := 'a0000000-0000-4000-a000-000000000001'::uuid;
  
  -- Vehicle IDs
  v1_id uuid := '00000000-0000-4000-a000-000000000301'::uuid;
  v2_id uuid := '00000000-0000-4000-a000-000000000302'::uuid;
  
  -- Financing IDs
  f1_id uuid := '00000000-0000-4000-a000-000000000311'::uuid;
  f2_id uuid := '00000000-0000-4000-a000-000000000312'::uuid;
  
  -- Insurance IDs
  i1_id uuid := '00000000-0000-4000-a000-000000000321'::uuid;
  i2_id uuid := '00000000-0000-4000-a000-000000000322'::uuid;
  
  -- DMS Root IDs
  root_car_id uuid := '00000000-0000-4000-a000-000000000350'::uuid;
  root_vehicles_id uuid := '00000000-0000-4000-a000-000000000351'::uuid;
  
  -- Porsche folder IDs
  p1_root_id uuid := '00000000-0000-4000-a000-000000000360'::uuid;
  p1_01_id uuid := '00000000-0000-4000-a000-000000000361'::uuid;
  p1_02_id uuid := '00000000-0000-4000-a000-000000000362'::uuid;
  p1_03_id uuid := '00000000-0000-4000-a000-000000000363'::uuid;
  p1_04_id uuid := '00000000-0000-4000-a000-000000000364'::uuid;
  p1_05_id uuid := '00000000-0000-4000-a000-000000000365'::uuid;
  p1_06_id uuid := '00000000-0000-4000-a000-000000000366'::uuid;
  p1_99_id uuid := '00000000-0000-4000-a000-000000000367'::uuid;
  
  -- BMW folder IDs
  p2_root_id uuid := '00000000-0000-4000-a000-000000000370'::uuid;
  p2_01_id uuid := '00000000-0000-4000-a000-000000000371'::uuid;
  p2_02_id uuid := '00000000-0000-4000-a000-000000000372'::uuid;
  p2_03_id uuid := '00000000-0000-4000-a000-000000000373'::uuid;
  p2_04_id uuid := '00000000-0000-4000-a000-000000000374'::uuid;
  p2_05_id uuid := '00000000-0000-4000-a000-000000000375'::uuid;
  p2_06_id uuid := '00000000-0000-4000-a000-000000000376'::uuid;
  p2_99_id uuid := '00000000-0000-4000-a000-000000000377'::uuid;
  
  -- Document IDs
  doc_p1_schein uuid := '00000000-0000-4000-a000-000000000380'::uuid;
  doc_p1_vertrag uuid := '00000000-0000-4000-a000-000000000381'::uuid;
  doc_p1_police uuid := '00000000-0000-4000-a000-000000000382'::uuid;
  doc_p2_schein uuid := '00000000-0000-4000-a000-000000000383'::uuid;
  doc_p2_vertrag uuid := '00000000-0000-4000-a000-000000000384'::uuid;
  doc_p2_police uuid := '00000000-0000-4000-a000-000000000385'::uuid;
  
BEGIN
  -- ==========================================================
  -- 1) CLEANUP (Idempotent)
  -- ==========================================================
  DELETE FROM document_links WHERE document_id IN (doc_p1_schein, doc_p1_vertrag, doc_p1_police, doc_p2_schein, doc_p2_vertrag, doc_p2_police);
  DELETE FROM documents WHERE id IN (doc_p1_schein, doc_p1_vertrag, doc_p1_police, doc_p2_schein, doc_p2_vertrag, doc_p2_police);
  DELETE FROM storage_nodes WHERE id IN (
    root_car_id, root_vehicles_id,
    p1_root_id, p1_01_id, p1_02_id, p1_03_id, p1_04_id, p1_05_id, p1_06_id, p1_99_id,
    p2_root_id, p2_01_id, p2_02_id, p2_03_id, p2_04_id, p2_05_id, p2_06_id, p2_99_id
  );
  DELETE FROM cars_insurances WHERE id IN (i1_id, i2_id);
  DELETE FROM cars_financing WHERE id IN (f1_id, f2_id);
  DELETE FROM cars_vehicles WHERE id IN (v1_id, v2_id);

  -- ==========================================================
  -- 2) VEHICLES
  -- ==========================================================
  
  INSERT INTO cars_vehicles (
    id, tenant_id, public_id, license_plate, vin, make, model, variant,
    first_registration_date, power_kw, engine_ccm, fuel_type, co2_g_km,
    seats, weight_kg, current_mileage_km, mileage_updated_at,
    holder_name, status, notes
  ) VALUES (
    v1_id, t_id, 'SOT-V-PORSCHE911', 'B-P911', 'WP0ZZZ99ZTS911001',
    'Porsche', '911', 'Carrera',
    '2021-06-01', 283, 2981, 'petrol', 205,
    4, 1510, 24500, NOW(),
    'Musterfirma GmbH', 'active', 'Demo vehicle Porsche 911'
  );
  
  INSERT INTO cars_vehicles (
    id, tenant_id, public_id, license_plate, vin, make, model, variant,
    first_registration_date, power_kw, engine_ccm, fuel_type, co2_g_km,
    seats, weight_kg, current_mileage_km, mileage_updated_at,
    holder_name, status, notes
  ) VALUES (
    v2_id, t_id, 'SOT-V-BMWM5', 'M-M5005', 'WBSZZZ99ZTM500002',
    'BMW', 'M5', 'Competition',
    '2020-03-15', 460, 4395, 'petrol', 250,
    5, 1970, 38900, NOW(),
    'Musterfirma GmbH', 'active', 'Demo vehicle BMW M5'
  );

  -- ==========================================================
  -- 3) FINANCING
  -- ==========================================================
  
  INSERT INTO cars_financing (
    id, tenant_id, vehicle_id, finance_type, provider_name, contract_number,
    start_date, end_date, monthly_rate_cents, currency,
    down_payment_cents, residual_value_cents, status, notes
  ) VALUES (
    f1_id, t_id, v1_id, 'leased', 'Porsche Financial Services (Demo)', 'LEASE-911-2021-0001',
    '2021-06-15', '2025-06-14', 149900, 'EUR',
    1500000, 6500000, 'active', 'Demo leasing'
  );
  
  INSERT INTO cars_financing (
    id, tenant_id, vehicle_id, finance_type, provider_name, contract_number,
    start_date, end_date, monthly_rate_cents, currency,
    remaining_debt_cents, interest_rate_percent, status, notes
  ) VALUES (
    f2_id, t_id, v2_id, 'financed', 'Musterbank AG (Demo)', 'FIN-M5-2020-0002',
    '2020-04-01', '2028-03-31', 99900, 'EUR',
    4200000, 3.49, 'active', 'Demo financing'
  );

  -- ==========================================================
  -- 4) INSURANCES
  -- ==========================================================
  
  INSERT INTO cars_insurances (
    id, tenant_id, vehicle_id, insurer_name, policy_number, coverage_type,
    sf_liability, sf_full_casco, deductible_partial_cents, deductible_full_cents,
    annual_premium_cents, currency, term_start, term_end, status, notes
  ) VALUES (
    i1_id, t_id, v1_id, 'Hector (planned)', 'HEC-911-0001', 'liability_vk',
    10, 8, 15000, 50000,
    189900, 'EUR', '2025-01-01', '2025-12-31', 'active', 'Demo insurance'
  );
  
  INSERT INTO cars_insurances (
    id, tenant_id, vehicle_id, insurer_name, policy_number, coverage_type,
    sf_liability, sf_full_casco, deductible_partial_cents, deductible_full_cents,
    annual_premium_cents, currency, term_start, term_end, status, notes
  ) VALUES (
    i2_id, t_id, v2_id, 'Hector (planned)', 'HEC-M5-0002', 'liability_tk',
    12, NULL, 15000, NULL,
    129900, 'EUR', '2025-01-01', '2025-12-31', 'active', 'Demo insurance'
  );

  -- ==========================================================
  -- 5) DMS FOLDER STRUCTURE
  -- ==========================================================
  
  INSERT INTO storage_nodes (id, tenant_id, parent_id, name, node_type, auto_created, template_id, sort_index)
  VALUES (root_car_id, t_id, NULL, 'Car-Management', 'folder', true, 'CAR_ROOT', 100);
  
  INSERT INTO storage_nodes (id, tenant_id, parent_id, name, node_type, auto_created, template_id, sort_index)
  VALUES (root_vehicles_id, t_id, root_car_id, 'Fahrzeuge', 'folder', true, 'CAR_VEHICLES', 10);
  
  INSERT INTO storage_nodes (id, tenant_id, parent_id, name, node_type, auto_created, template_id, sort_index) VALUES
    (p1_root_id, t_id, root_vehicles_id, 'B-P911', 'folder', true, 'VEHICLE_DOSSIER_V1', 10),
    (p1_01_id, t_id, p1_root_id, '01_Fahrzeugschein', 'folder', true, NULL, 1),
    (p1_02_id, t_id, p1_root_id, '02_Finanzierung_Leasing', 'folder', true, NULL, 2),
    (p1_03_id, t_id, p1_root_id, '03_Versicherung', 'folder', true, NULL, 3),
    (p1_04_id, t_id, p1_root_id, '04_Schaeden', 'folder', true, NULL, 4),
    (p1_05_id, t_id, p1_root_id, '05_Service_Rechnungen', 'folder', true, NULL, 5),
    (p1_06_id, t_id, p1_root_id, '06_Fahrtenbuch_Exports', 'folder', true, NULL, 6),
    (p1_99_id, t_id, p1_root_id, '99_Sonstiges', 'folder', true, NULL, 99);
  
  INSERT INTO storage_nodes (id, tenant_id, parent_id, name, node_type, auto_created, template_id, sort_index) VALUES
    (p2_root_id, t_id, root_vehicles_id, 'M-M5005', 'folder', true, 'VEHICLE_DOSSIER_V1', 20),
    (p2_01_id, t_id, p2_root_id, '01_Fahrzeugschein', 'folder', true, NULL, 1),
    (p2_02_id, t_id, p2_root_id, '02_Finanzierung_Leasing', 'folder', true, NULL, 2),
    (p2_03_id, t_id, p2_root_id, '03_Versicherung', 'folder', true, NULL, 3),
    (p2_04_id, t_id, p2_root_id, '04_Schaeden', 'folder', true, NULL, 4),
    (p2_05_id, t_id, p2_root_id, '05_Service_Rechnungen', 'folder', true, NULL, 5),
    (p2_06_id, t_id, p2_root_id, '06_Fahrtenbuch_Exports', 'folder', true, NULL, 6),
    (p2_99_id, t_id, p2_root_id, '99_Sonstiges', 'folder', true, NULL, 99);

  UPDATE cars_vehicles SET dms_folder_id = p1_root_id WHERE id = v1_id;
  UPDATE cars_vehicles SET dms_folder_id = p2_root_id WHERE id = v2_id;

  -- ==========================================================
  -- 6) DEMO DOCUMENTS
  -- ==========================================================
  
  INSERT INTO documents (id, tenant_id, public_id, name, file_path, mime_type, size_bytes, doc_type, scope, source) VALUES
    (doc_p1_schein, t_id, 'SOT-D-V911SCH', 'Fahrzeugschein_B-P911.pdf', 'demo/cars/porsche/Fahrzeugschein.pdf', 'application/pdf', 95000, 'vehicle_registration', 'vehicle', 'import'),
    (doc_p1_vertrag, t_id, 'SOT-D-V911VER', 'Leasingvertrag_B-P911.pdf', 'demo/cars/porsche/Leasingvertrag.pdf', 'application/pdf', 185000, 'leasing_contract', 'vehicle', 'import'),
    (doc_p1_police, t_id, 'SOT-D-V911POL', 'Police_HEC-911-0001.pdf', 'demo/cars/porsche/Police.pdf', 'application/pdf', 120000, 'insurance_policy', 'vehicle', 'import');
  
  INSERT INTO documents (id, tenant_id, public_id, name, file_path, mime_type, size_bytes, doc_type, scope, source) VALUES
    (doc_p2_schein, t_id, 'SOT-D-VM5SCH', 'Fahrzeugschein_M-M5005.pdf', 'demo/cars/bmw/Fahrzeugschein.pdf', 'application/pdf', 95000, 'vehicle_registration', 'vehicle', 'import'),
    (doc_p2_vertrag, t_id, 'SOT-D-VM5VER', 'Finanzierungsvertrag_M-M5005.pdf', 'demo/cars/bmw/Finanzierungsvertrag.pdf', 'application/pdf', 210000, 'financing_contract', 'vehicle', 'import'),
    (doc_p2_police, t_id, 'SOT-D-VM5POL', 'Police_HEC-M5-0002.pdf', 'demo/cars/bmw/Police.pdf', 'application/pdf', 115000, 'insurance_policy', 'vehicle', 'import');
  
  -- Document Links (connect docs to vehicles and folders)
  INSERT INTO document_links (document_id, tenant_id, node_id, object_type, object_id, link_status) VALUES
    (doc_p1_schein, t_id, p1_01_id, 'vehicle', v1_id, 'linked'),
    (doc_p1_vertrag, t_id, p1_02_id, 'vehicle', v1_id, 'linked'),
    (doc_p1_police, t_id, p1_03_id, 'insurance', i1_id, 'linked'),
    (doc_p2_schein, t_id, p2_01_id, 'vehicle', v2_id, 'linked'),
    (doc_p2_vertrag, t_id, p2_02_id, 'vehicle', v2_id, 'linked'),
    (doc_p2_police, t_id, p2_03_id, 'insurance', i2_id, 'linked');

END $$;