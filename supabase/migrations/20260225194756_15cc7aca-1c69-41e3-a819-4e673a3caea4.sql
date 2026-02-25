-- Add extended exposé extraction fields to dev_projects
ALTER TABLE public.dev_projects
  ADD COLUMN IF NOT EXISTS full_description text,
  ADD COLUMN IF NOT EXISTS location_description text,
  ADD COLUMN IF NOT EXISTS features jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS energy_cert_type text,
  ADD COLUMN IF NOT EXISTS energy_cert_value numeric,
  ADD COLUMN IF NOT EXISTS energy_class text,
  ADD COLUMN IF NOT EXISTS heating_type text,
  ADD COLUMN IF NOT EXISTS energy_source text,
  ADD COLUMN IF NOT EXISTS renovation_year integer,
  ADD COLUMN IF NOT EXISTS parking_type text,
  ADD COLUMN IF NOT EXISTS parking_price numeric;