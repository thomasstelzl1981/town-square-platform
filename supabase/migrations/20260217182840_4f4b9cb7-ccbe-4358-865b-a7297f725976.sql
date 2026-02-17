-- Phase 1: Kapazitätsfelder auf pet_providers
ALTER TABLE public.pet_providers
  ADD COLUMN IF NOT EXISTS max_daily_capacity integer NOT NULL DEFAULT 12,
  ADD COLUMN IF NOT EXISTS facility_type text NOT NULL DEFAULT 'daycare';

-- Lennox & Friends aktualisieren
UPDATE public.pet_providers
SET max_daily_capacity = 12, facility_type = 'daycare'
WHERE id = 'd0000000-0000-4000-a000-000000000050';