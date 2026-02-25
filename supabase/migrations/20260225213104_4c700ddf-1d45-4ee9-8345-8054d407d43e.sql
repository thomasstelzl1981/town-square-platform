-- F4: Add construction_year and total_area_sqm columns to dev_projects
ALTER TABLE public.dev_projects ADD COLUMN IF NOT EXISTS construction_year INTEGER;
ALTER TABLE public.dev_projects ADD COLUMN IF NOT EXISTS total_area_sqm NUMERIC;