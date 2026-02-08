-- Add structured managing director and registry fields for business landlord contexts
ALTER TABLE landlord_contexts
  ADD COLUMN md_salutation TEXT,
  ADD COLUMN md_first_name TEXT,
  ADD COLUMN md_last_name TEXT,
  ADD COLUMN tax_number TEXT,
  ADD COLUMN registry_court TEXT;