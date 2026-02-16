
-- Beamten-Felder in household_persons
ALTER TABLE public.household_persons
  ADD COLUMN IF NOT EXISTS besoldungsgruppe text,
  ADD COLUMN IF NOT EXISTS erfahrungsstufe integer,
  ADD COLUMN IF NOT EXISTS dienstherr text,
  ADD COLUMN IF NOT EXISTS verbeamtung_date date,
  ADD COLUMN IF NOT EXISTS ruhegehaltfaehiges_grundgehalt numeric,
  ADD COLUMN IF NOT EXISTS ruhegehaltfaehige_dienstjahre numeric,
  ADD COLUMN IF NOT EXISTS planned_retirement_date date;

-- Pension type in pension_records
ALTER TABLE public.pension_records
  ADD COLUMN IF NOT EXISTS pension_type text DEFAULT 'drv';
