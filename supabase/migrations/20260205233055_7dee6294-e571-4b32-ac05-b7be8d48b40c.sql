-- =============================================================================
-- SEED: property_accounting + context_property_assignment für Demo-Property
-- =============================================================================
-- 
-- Ergänzt die Golden Path Seed-Daten um:
-- 1. AfA-Basiswerte für die Leipzig-Property (property_accounting)
-- 2. Verknüpfung der Property mit dem Kontext "Familie Mustermann"
--
-- Demo-Tenant: a0000000-0000-4000-a000-000000000001
-- Demo-Property: 00000000-0000-4000-a000-000000000001
-- Demo-Context: 00000000-0000-4000-a000-000000000110 (Familie Mustermann)
-- =============================================================================

-- 1. property_accounting Seed (AfA-Basiswerte)
INSERT INTO property_accounting (
  id,
  tenant_id,
  property_id,
  land_share_percent,
  building_share_percent,
  book_value_eur,
  afa_rate_percent,
  afa_method,
  afa_start_date,
  remaining_useful_life_years,
  coa_version,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-4000-a000-000000000130',
  'a0000000-0000-4000-a000-000000000001',
  '00000000-0000-4000-a000-000000000001',
  20.0,    -- 20% Grundstücksanteil (nicht abschreibbar)
  80.0,    -- 80% Gebäudeanteil (AfA-Basis)
  144000,  -- Buchwert = Kaufpreis 180k × 80% = 144.000€
  2.0,     -- 2% lineare AfA (Altbau vor 2023)
  'linear',
  '2020-01-15', -- AfA-Beginn = Kaufdatum
  48,      -- Restnutzungsdauer: 50 Jahre - 2 Jahre seit Kauf
  'SKR04_STARTER',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  land_share_percent = EXCLUDED.land_share_percent,
  building_share_percent = EXCLUDED.building_share_percent,
  book_value_eur = EXCLUDED.book_value_eur,
  afa_rate_percent = EXCLUDED.afa_rate_percent,
  afa_method = EXCLUDED.afa_method,
  afa_start_date = EXCLUDED.afa_start_date,
  remaining_useful_life_years = EXCLUDED.remaining_useful_life_years,
  updated_at = NOW();

-- 2. context_property_assignment Seed (Property → Kontext Verknüpfung)
INSERT INTO context_property_assignment (
  id,
  tenant_id,
  context_id,
  property_id,
  assigned_at
) VALUES (
  '00000000-0000-4000-a000-000000000120',
  'a0000000-0000-4000-a000-000000000001',
  '00000000-0000-4000-a000-000000000110',  -- Familie Mustermann
  '00000000-0000-4000-a000-000000000001',  -- Leipzig Property
  NOW()
) ON CONFLICT (id) DO NOTHING;