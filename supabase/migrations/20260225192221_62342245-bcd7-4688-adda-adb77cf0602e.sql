
-- Phase 1: Projekt-Parameter für AfA und Grund & Boden
ALTER TABLE public.dev_projects ADD COLUMN IF NOT EXISTS afa_rate_percent numeric DEFAULT 2.0;
ALTER TABLE public.dev_projects ADD COLUMN IF NOT EXISTS afa_model text DEFAULT 'linear';
ALTER TABLE public.dev_projects ADD COLUMN IF NOT EXISTS land_share_percent numeric DEFAULT 20.0;

-- Phase 2: Hausgeld pro Einheit
ALTER TABLE public.dev_project_units ADD COLUMN IF NOT EXISTS hausgeld numeric;
