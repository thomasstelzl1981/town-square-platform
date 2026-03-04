
-- Add Mietvertrag-specific fields to miety_contracts
ALTER TABLE miety_contracts ADD COLUMN IF NOT EXISTS kaltmiete NUMERIC;
ALTER TABLE miety_contracts ADD COLUMN IF NOT EXISTS nebenkosten_vorauszahlung NUMERIC;
ALTER TABLE miety_contracts ADD COLUMN IF NOT EXISTS kaution NUMERIC;
ALTER TABLE miety_contracts ADD COLUMN IF NOT EXISTS kuendigungsfrist TEXT;
ALTER TABLE miety_contracts ADD COLUMN IF NOT EXISTS vermieter_name TEXT;
ALTER TABLE miety_contracts ADD COLUMN IF NOT EXISTS vermieter_kontakt TEXT;
