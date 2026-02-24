
-- Add missing contact fields to soat_search_results
ALTER TABLE public.soat_search_results
  ADD COLUMN IF NOT EXISTS salutation text,
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text;

-- Add missing fields to contact_staging
ALTER TABLE public.contact_staging
  ADD COLUMN IF NOT EXISTS salutation text,
  ADD COLUMN IF NOT EXISTS category text;
