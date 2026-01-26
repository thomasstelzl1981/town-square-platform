-- =====================================================
-- MASTER AUDIT MIGRATION: Phase 5, 6, 7 (FIXED)
-- =====================================================

-- PHASE 5: API Registry Ergänzung (ohne ON CONFLICT)
INSERT INTO integration_registry (code, name, description, type, status, config_schema, public_id, created_at, updated_at)
SELECT 'SPRENGNETTER', 'Sprengnetter', 'Immobilienbewertung API für Verkehrswert-Ermittlung', 'integration', 'pending_setup', 
   '{"fields": ["api_key", "customer_id"]}', 'int_' || gen_random_uuid(), now(), now()
WHERE NOT EXISTS (SELECT 1 FROM integration_registry WHERE code = 'SPRENGNETTER');

INSERT INTO integration_registry (code, name, description, type, status, config_schema, public_id, created_at, updated_at)
SELECT 'GOOGLE_MAPS', 'Google Maps', 'Kartenansicht für Exposés und Objektstandorte', 'integration', 'pending_setup',
   '{"fields": ["api_key"]}', 'int_' || gen_random_uuid(), now(), now()
WHERE NOT EXISTS (SELECT 1 FROM integration_registry WHERE code = 'GOOGLE_MAPS');

INSERT INTO integration_registry (code, name, description, type, status, config_schema, public_id, created_at, updated_at)
SELECT 'GOOGLE_PLACES', 'Google Places', 'Handwerkersuche für Sanierungsmodul', 'integration', 'pending_setup',
   '{"fields": ["api_key"]}', 'int_' || gen_random_uuid(), now(), now()
WHERE NOT EXISTS (SELECT 1 FROM integration_registry WHERE code = 'GOOGLE_PLACES');

INSERT INTO integration_registry (code, name, description, type, status, config_schema, public_id, created_at, updated_at)
SELECT 'MICROSOFT_OAUTH', 'Microsoft OAuth', 'Outlook/Exchange E-Mail Integration', 'connector', 'pending_setup',
   '{"fields": ["client_id", "client_secret", "tenant_id"]}', 'int_' || gen_random_uuid(), now(), now()
WHERE NOT EXISTS (SELECT 1 FROM integration_registry WHERE code = 'MICROSOFT_OAUTH');

INSERT INTO integration_registry (code, name, description, type, status, config_schema, public_id, created_at, updated_at)
SELECT 'GMAIL_OAUTH', 'Gmail OAuth', 'Gmail E-Mail Integration via Google OAuth', 'connector', 'pending_setup',
   '{"fields": ["client_id", "client_secret"]}', 'int_' || gen_random_uuid(), now(), now()
WHERE NOT EXISTS (SELECT 1 FROM integration_registry WHERE code = 'GMAIL_OAUTH');

INSERT INTO integration_registry (code, name, description, type, status, config_schema, public_id, created_at, updated_at)
SELECT 'SIMPLEFAX', 'SimpleFax', 'Fax-Versand für Briefgenerator', 'integration', 'pending_setup',
   '{"fields": ["api_key"]}', 'int_' || gen_random_uuid(), now(), now()
WHERE NOT EXISTS (SELECT 1 FROM integration_registry WHERE code = 'SIMPLEFAX');

INSERT INTO integration_registry (code, name, description, type, status, config_schema, public_id, created_at, updated_at)
SELECT 'BRIEFDIENST', 'Briefdienst', 'Post-Versand für Briefgenerator', 'integration', 'pending_setup',
   '{"fields": ["api_key"]}', 'int_' || gen_random_uuid(), now(), now()
WHERE NOT EXISTS (SELECT 1 FROM integration_registry WHERE code = 'BRIEFDIENST');

-- PHASE 6: tile_catalog Schema erweitern
ALTER TABLE tile_catalog 
  ADD COLUMN IF NOT EXISTS internal_apis text[],
  ADD COLUMN IF NOT EXISTS external_api_refs text[];

-- Update tile_catalog with API references
UPDATE tile_catalog SET 
  internal_apis = ARRAY[]::text[],
  external_api_refs = ARRAY[]::text[]
WHERE tile_code = 'MOD-01';

UPDATE tile_catalog SET 
  internal_apis = ARRAY['sot-letter-generate'],
  external_api_refs = ARRAY['RESEND', 'GMAIL_OAUTH', 'MICROSOFT_OAUTH', 'SIMPLEFAX', 'BRIEFDIENST']
WHERE tile_code = 'MOD-02';

UPDATE tile_catalog SET 
  internal_apis = ARRAY['sot-dms-upload-url', 'sot-dms-download-url'],
  external_api_refs = ARRAY['CAYA']
WHERE tile_code = 'MOD-03';

UPDATE tile_catalog SET 
  internal_apis = ARRAY['sot-property-crud', 'sot-expose-description'],
  external_api_refs = ARRAY['SPRENGNETTER', 'GOOGLE_MAPS', 'GOOGLE_PLACES', 'RESEND']
WHERE tile_code = 'MOD-04';

UPDATE tile_catalog SET 
  internal_apis = ARRAY['sot-msv-reminder-check', 'sot-msv-rent-report', 'sot-listing-publish', 'sot-expose-description'],
  external_api_refs = ARRAY['RESEND', 'scout24']
WHERE tile_code = 'MOD-05';

UPDATE tile_catalog SET 
  internal_apis = ARRAY['sot-listing-publish'],
  external_api_refs = ARRAY['scout24', 'RESEND']
WHERE tile_code = 'MOD-06';

UPDATE tile_catalog SET 
  internal_apis = ARRAY[]::text[],
  external_api_refs = ARRAY['FUTURE_ROOM']
WHERE tile_code = 'MOD-07';

UPDATE tile_catalog SET 
  internal_apis = ARRAY['sot-investment-engine'],
  external_api_refs = ARRAY['apify']
WHERE tile_code = 'MOD-08';

UPDATE tile_catalog SET 
  internal_apis = ARRAY[]::text[],
  external_api_refs = ARRAY[]::text[]
WHERE tile_code = 'MOD-09';

UPDATE tile_catalog SET 
  internal_apis = ARRAY['sot-lead-inbox'],
  external_api_refs = ARRAY['meta_ads', 'RESEND']
WHERE tile_code = 'MOD-10';

-- Update MOD-01 sub_tiles: "Firma" -> "Personen"
UPDATE tile_catalog 
SET sub_tiles = jsonb_set(
  sub_tiles::jsonb, 
  '{1}', 
  '{"title": "Personen", "route": "/portal/stammdaten/personen", "icon_key": "users"}'::jsonb
)
WHERE tile_code = 'MOD-01';

-- PHASE 7: profiles Tabelle erweitern
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS street text,
  ADD COLUMN IF NOT EXISTS house_number text,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'DE',
  ADD COLUMN IF NOT EXISTS phone_landline text,
  ADD COLUMN IF NOT EXISTS phone_mobile text,
  ADD COLUMN IF NOT EXISTS phone_whatsapp text,
  ADD COLUMN IF NOT EXISTS tax_number text,
  ADD COLUMN IF NOT EXISTS tax_id text,
  ADD COLUMN IF NOT EXISTS spouse_profile_id uuid,
  ADD COLUMN IF NOT EXISTS is_business boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS person_mode text DEFAULT 'personal';