
ALTER TABLE compliance_company_profile
  ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS legal_notes TEXT;

-- Set existing row to 'sot' as default
UPDATE compliance_company_profile SET slug = 'sot' WHERE slug IS NULL;
