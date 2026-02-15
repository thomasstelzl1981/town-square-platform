
-- Demo-Seed: NK-Perioden, Cost Items, Dokumente, Document Links

-- ==================== NK PERIODS ====================
INSERT INTO nk_periods (id, tenant_id, property_id, period_start, period_end, status, allocation_key_default)
VALUES
  ('e0000000-0000-4000-a000-000000000001', 'a0000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000001', '2025-01-01', '2025-12-31', 'confirmed', 'mea'),
  ('e0000000-0000-4000-a000-000000000002', 'a0000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000002', '2025-01-01', '2025-12-31', 'confirmed', 'mea'),
  ('e0000000-0000-4000-a000-000000000003', 'a0000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000003', '2025-01-01', '2025-12-31', 'confirmed', 'mea')
ON CONFLICT (id) DO NOTHING;

-- ==================== NK COST ITEMS — BER-01 ====================
INSERT INTO nk_cost_items (tenant_id, nk_period_id, category_code, label_raw, label_display, amount_total_house, amount_unit, key_type, key_basis_unit, key_basis_total, is_apportionable, mapping_confidence, mapping_source, sort_order)
VALUES
  ('a0000000-0000-4000-a000-000000000001', 'e0000000-0000-4000-a000-000000000001', 'grundsteuer', 'Grundsteuer', 'Grundsteuer', 2400, 205.20, 'mea', 85.5, 1000, true, 1.0, 'manual', 1),
  ('a0000000-0000-4000-a000-000000000001', 'e0000000-0000-4000-a000-000000000001', 'wasser', 'Wasserversorgung', 'Wasserversorgung', 3200, 360.00, 'persons', 2, 8, true, 1.0, 'manual', 2),
  ('a0000000-0000-4000-a000-000000000001', 'e0000000-0000-4000-a000-000000000001', 'abwasser', 'Entwässerung', 'Entwässerung', 1800, 202.50, 'persons', 2, 8, true, 1.0, 'manual', 3),
  ('a0000000-0000-4000-a000-000000000001', 'e0000000-0000-4000-a000-000000000001', 'muell', 'Müllbeseitigung', 'Müllbeseitigung', 1600, 180.00, 'persons', 2, 8, true, 1.0, 'manual', 4),
  ('a0000000-0000-4000-a000-000000000001', 'e0000000-0000-4000-a000-000000000001', 'strassenreinigung', 'Straßenreinigung', 'Straßenreinigung', 950, 85.00, 'area_sqm', 85, 950, true, 1.0, 'manual', 5),
  ('a0000000-0000-4000-a000-000000000001', 'e0000000-0000-4000-a000-000000000001', 'gebaeudereinigung', 'Gebäudereinigung', 'Gebäudereinigung', 2400, 204.00, 'area_sqm', 85, 1000, true, 1.0, 'manual', 6),
  ('a0000000-0000-4000-a000-000000000001', 'e0000000-0000-4000-a000-000000000001', 'sachversicherung', 'Gebäudeversicherung', 'Gebäudeversicherung', 3000, 255.00, 'mea', 85.5, 1000, true, 1.0, 'manual', 7),
  ('a0000000-0000-4000-a000-000000000001', 'e0000000-0000-4000-a000-000000000001', 'schornsteinfeger', 'Schornsteinfeger', 'Schornsteinfeger', 1100, 95.00, 'unit_count', 1, 12, true, 1.0, 'manual', 8),
  ('a0000000-0000-4000-a000-000000000001', 'e0000000-0000-4000-a000-000000000001', 'beleuchtung', 'Allgemeinstrom', 'Allgemeinstrom', 1200, 102.00, 'mea', 85.5, 1000, true, 1.0, 'manual', 9),
  ('a0000000-0000-4000-a000-000000000001', 'e0000000-0000-4000-a000-000000000001', 'verwaltung', 'Verwaltungskosten', 'Verwaltungskosten', 3600, 306.00, 'mea', 85.5, 1000, false, 1.0, 'manual', 10),
  ('a0000000-0000-4000-a000-000000000001', 'e0000000-0000-4000-a000-000000000001', 'ruecklage', 'Instandhaltungsrücklage', 'Instandhaltungsrücklage', 4800, 408.00, 'mea', 85.5, 1000, false, 1.0, 'manual', 11);

-- ==================== NK COST ITEMS — MUC-01 ====================
INSERT INTO nk_cost_items (tenant_id, nk_period_id, category_code, label_raw, label_display, amount_total_house, amount_unit, key_type, key_basis_unit, key_basis_total, is_apportionable, mapping_confidence, mapping_source, sort_order)
VALUES
  ('a0000000-0000-4000-a000-000000000001', 'e0000000-0000-4000-a000-000000000002', 'grundsteuer', 'Grundsteuer', 'Grundsteuer', 2800, 201.60, 'mea', 72.0, 1000, true, 1.0, 'manual', 1),
  ('a0000000-0000-4000-a000-000000000001', 'e0000000-0000-4000-a000-000000000002', 'wasser', 'Wasserversorgung', 'Wasserversorgung', 2800, 280.00, 'persons', 1, 10, true, 1.0, 'manual', 2),
  ('a0000000-0000-4000-a000-000000000001', 'e0000000-0000-4000-a000-000000000002', 'abwasser', 'Entwässerung', 'Entwässerung', 1500, 150.00, 'persons', 1, 10, true, 1.0, 'manual', 3),
  ('a0000000-0000-4000-a000-000000000001', 'e0000000-0000-4000-a000-000000000002', 'muell', 'Müllbeseitigung', 'Müllbeseitigung', 1400, 140.00, 'persons', 1, 10, true, 1.0, 'manual', 4),
  ('a0000000-0000-4000-a000-000000000001', 'e0000000-0000-4000-a000-000000000002', 'strassenreinigung', 'Straßenreinigung', 'Straßenreinigung', 800, 57.60, 'area_sqm', 72, 1000, true, 1.0, 'manual', 5),
  ('a0000000-0000-4000-a000-000000000001', 'e0000000-0000-4000-a000-000000000002', 'gebaeudereinigung', 'Gebäudereinigung', 'Gebäudereinigung', 2000, 144.00, 'area_sqm', 72, 1000, true, 1.0, 'manual', 6),
  ('a0000000-0000-4000-a000-000000000001', 'e0000000-0000-4000-a000-000000000002', 'sachversicherung', 'Gebäudeversicherung', 'Gebäudeversicherung', 3500, 252.00, 'mea', 72.0, 1000, true, 1.0, 'manual', 7),
  ('a0000000-0000-4000-a000-000000000001', 'e0000000-0000-4000-a000-000000000002', 'schornsteinfeger', 'Schornsteinfeger', 'Schornsteinfeger', 900, 75.00, 'unit_count', 1, 12, true, 1.0, 'manual', 8),
  ('a0000000-0000-4000-a000-000000000001', 'e0000000-0000-4000-a000-000000000002', 'beleuchtung', 'Allgemeinstrom', 'Allgemeinstrom', 1000, 72.00, 'mea', 72.0, 1000, true, 1.0, 'manual', 9),
  ('a0000000-0000-4000-a000-000000000001', 'e0000000-0000-4000-a000-000000000002', 'verwaltung', 'Verwaltungskosten', 'Verwaltungskosten', 3200, 230.40, 'mea', 72.0, 1000, false, 1.0, 'manual', 10),
  ('a0000000-0000-4000-a000-000000000001', 'e0000000-0000-4000-a000-000000000002', 'ruecklage', 'Instandhaltungsrücklage', 'Instandhaltungsrücklage', 4200, 302.40, 'mea', 72.0, 1000, false, 1.0, 'manual', 11);

-- ==================== NK COST ITEMS — HH-01 ====================
INSERT INTO nk_cost_items (tenant_id, nk_period_id, category_code, label_raw, label_display, amount_total_house, amount_unit, key_type, key_basis_unit, key_basis_total, is_apportionable, mapping_confidence, mapping_source, sort_order)
VALUES
  ('a0000000-0000-4000-a000-000000000001', 'e0000000-0000-4000-a000-000000000003', 'grundsteuer', 'Grundsteuer', 'Grundsteuer', 1800, 81.00, 'mea', 45.0, 1000, true, 1.0, 'manual', 1),
  ('a0000000-0000-4000-a000-000000000001', 'e0000000-0000-4000-a000-000000000003', 'wasser', 'Wasserversorgung', 'Wasserversorgung', 2000, 200.00, 'persons', 1, 10, true, 1.0, 'manual', 2),
  ('a0000000-0000-4000-a000-000000000001', 'e0000000-0000-4000-a000-000000000003', 'abwasser', 'Entwässerung', 'Entwässerung', 1200, 120.00, 'persons', 1, 10, true, 1.0, 'manual', 3),
  ('a0000000-0000-4000-a000-000000000001', 'e0000000-0000-4000-a000-000000000003', 'muell', 'Müllbeseitigung', 'Müllbeseitigung', 1000, 100.00, 'persons', 1, 10, true, 1.0, 'manual', 4),
  ('a0000000-0000-4000-a000-000000000001', 'e0000000-0000-4000-a000-000000000003', 'strassenreinigung', 'Straßenreinigung', 'Straßenreinigung', 600, 27.00, 'area_sqm', 45, 1000, true, 1.0, 'manual', 5),
  ('a0000000-0000-4000-a000-000000000001', 'e0000000-0000-4000-a000-000000000003', 'gebaeudereinigung', 'Gebäudereinigung', 'Gebäudereinigung', 1500, 67.50, 'area_sqm', 45, 1000, true, 1.0, 'manual', 6),
  ('a0000000-0000-4000-a000-000000000001', 'e0000000-0000-4000-a000-000000000003', 'sachversicherung', 'Gebäudeversicherung', 'Gebäudeversicherung', 2200, 99.00, 'mea', 45.0, 1000, true, 1.0, 'manual', 7),
  ('a0000000-0000-4000-a000-000000000001', 'e0000000-0000-4000-a000-000000000003', 'schornsteinfeger', 'Schornsteinfeger', 'Schornsteinfeger', 700, 58.33, 'unit_count', 1, 12, true, 1.0, 'manual', 8),
  ('a0000000-0000-4000-a000-000000000001', 'e0000000-0000-4000-a000-000000000003', 'beleuchtung', 'Allgemeinstrom', 'Allgemeinstrom', 800, 36.00, 'mea', 45.0, 1000, true, 1.0, 'manual', 9),
  ('a0000000-0000-4000-a000-000000000001', 'e0000000-0000-4000-a000-000000000003', 'verwaltung', 'Verwaltungskosten', 'Verwaltungskosten', 2400, 108.00, 'mea', 45.0, 1000, false, 1.0, 'manual', 10),
  ('a0000000-0000-4000-a000-000000000001', 'e0000000-0000-4000-a000-000000000003', 'ruecklage', 'Instandhaltungsrücklage', 'Instandhaltungsrücklage', 3200, 144.00, 'mea', 45.0, 1000, false, 1.0, 'manual', 11);

-- ==================== DEMO DOCUMENTS (6) ====================
INSERT INTO documents (id, tenant_id, name, doc_type, extraction_status, review_state, mime_type, file_path, source, size_bytes)
VALUES
  ('f0000000-0000-4000-a000-000000000001', 'a0000000-0000-4000-a000-000000000001', 'WEG-Jahresabrechnung BER-01 2025', 'WEG_JAHRESABRECHNUNG', 'done', 'approved', 'application/pdf', '/demo/weg-ber01-2025.pdf', 'import', 0),
  ('f0000000-0000-4000-a000-000000000002', 'a0000000-0000-4000-a000-000000000001', 'WEG-Jahresabrechnung MUC-01 2025', 'WEG_JAHRESABRECHNUNG', 'done', 'approved', 'application/pdf', '/demo/weg-muc01-2025.pdf', 'import', 0),
  ('f0000000-0000-4000-a000-000000000003', 'a0000000-0000-4000-a000-000000000001', 'WEG-Jahresabrechnung HH-01 2025', 'WEG_JAHRESABRECHNUNG', 'done', 'approved', 'application/pdf', '/demo/weg-hh01-2025.pdf', 'import', 0),
  ('f0000000-0000-4000-a000-000000000004', 'a0000000-0000-4000-a000-000000000001', 'Grundsteuerbescheid BER-01 2025', 'GRUNDSTEUER_BESCHEID', 'done', 'approved', 'application/pdf', '/demo/gst-ber01-2025.pdf', 'import', 0),
  ('f0000000-0000-4000-a000-000000000005', 'a0000000-0000-4000-a000-000000000001', 'Grundsteuerbescheid MUC-01 2025', 'GRUNDSTEUER_BESCHEID', 'done', 'approved', 'application/pdf', '/demo/gst-muc01-2025.pdf', 'import', 0),
  ('f0000000-0000-4000-a000-000000000006', 'a0000000-0000-4000-a000-000000000001', 'Grundsteuerbescheid HH-01 2025', 'GRUNDSTEUER_BESCHEID', 'done', 'approved', 'application/pdf', '/demo/gst-hh01-2025.pdf', 'import', 0)
ON CONFLICT (id) DO NOTHING;

-- ==================== DOCUMENT LINKS (6) ====================
INSERT INTO document_links (id, tenant_id, document_id, object_id, object_type, link_status)
VALUES
  ('f1000000-0000-4000-a000-000000000001', 'a0000000-0000-4000-a000-000000000001', 'f0000000-0000-4000-a000-000000000001', 'd0000000-0000-4000-a000-000000000001', 'property', 'linked'),
  ('f1000000-0000-4000-a000-000000000002', 'a0000000-0000-4000-a000-000000000001', 'f0000000-0000-4000-a000-000000000002', 'd0000000-0000-4000-a000-000000000002', 'property', 'linked'),
  ('f1000000-0000-4000-a000-000000000003', 'a0000000-0000-4000-a000-000000000001', 'f0000000-0000-4000-a000-000000000003', 'd0000000-0000-4000-a000-000000000003', 'property', 'linked'),
  ('f1000000-0000-4000-a000-000000000004', 'a0000000-0000-4000-a000-000000000001', 'f0000000-0000-4000-a000-000000000004', 'd0000000-0000-4000-a000-000000000001', 'property', 'linked'),
  ('f1000000-0000-4000-a000-000000000005', 'a0000000-0000-4000-a000-000000000001', 'f0000000-0000-4000-a000-000000000005', 'd0000000-0000-4000-a000-000000000002', 'property', 'linked'),
  ('f1000000-0000-4000-a000-000000000006', 'a0000000-0000-4000-a000-000000000001', 'f0000000-0000-4000-a000-000000000006', 'd0000000-0000-4000-a000-000000000003', 'property', 'linked')
ON CONFLICT (id) DO NOTHING;
