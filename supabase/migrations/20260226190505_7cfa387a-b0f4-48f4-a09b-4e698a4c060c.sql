
-- Add setup wizard fields to cameras table
ALTER TABLE public.cameras
  ADD COLUMN IF NOT EXISTS vendor text DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS model text,
  ADD COLUMN IF NOT EXISTS connection_type text DEFAULT 'poe',
  ADD COLUMN IF NOT EXISTS local_ip text,
  ADD COLUMN IF NOT EXISTS internal_port integer DEFAULT 80,
  ADD COLUMN IF NOT EXISTS external_domain text,
  ADD COLUMN IF NOT EXISTS external_port integer;
