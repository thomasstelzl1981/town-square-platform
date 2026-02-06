-- ============================================================================
-- Erweiterung landlord_contexts: Steuersatz + Geschäftsführer
-- ============================================================================

ALTER TABLE landlord_contexts
  ADD COLUMN IF NOT EXISTS tax_rate_percent NUMERIC DEFAULT 30.0,
  ADD COLUMN IF NOT EXISTS managing_director TEXT;

COMMENT ON COLUMN landlord_contexts.tax_rate_percent IS 
  'Fester Steuersatz in %. Standardwert 30%. Keine automatische Berechnung über Splitting-Tabelle.';
COMMENT ON COLUMN landlord_contexts.managing_director IS 
  'Geschäftsführer bei BUSINESS-Kontexten';

-- ============================================================================
-- Erweiterung context_members: Persönliche Daten + Kontaktdaten
-- ============================================================================

ALTER TABLE context_members
  ADD COLUMN IF NOT EXISTS birth_name TEXT,
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS street TEXT,
  ADD COLUMN IF NOT EXISTS house_number TEXT,
  ADD COLUMN IF NOT EXISTS postal_code TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Deutschland',
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- ============================================================================
-- Seed-Daten aktualisieren: Familie Mustermann
-- ============================================================================

UPDATE context_members SET
  birth_date = '1980-05-01',
  street = 'Musterstraße',
  house_number = '15',
  postal_code = '04103',
  city = 'Leipzig',
  email = 'max@mustermann.de',
  phone = '+49 341 1234567'
WHERE first_name = 'Max' AND last_name = 'Mustermann';

UPDATE context_members SET
  birth_name = 'Schmidt',
  birth_date = '1982-08-15',
  street = 'Musterstraße',
  house_number = '15',
  postal_code = '04103',
  city = 'Leipzig',
  email = 'lisa@mustermann.de',
  phone = '+49 341 7654321'
WHERE first_name = 'Lisa' AND last_name = 'Mustermann';