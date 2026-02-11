
-- Add columns needed for offer comparison feature
ALTER TABLE public.service_case_offers ADD COLUMN IF NOT EXISTS file_path text;
ALTER TABLE public.service_case_offers ADD COLUMN IF NOT EXISTS file_name text;
ALTER TABLE public.service_case_offers ADD COLUMN IF NOT EXISTS positions jsonb DEFAULT '[]';
ALTER TABLE public.service_case_offers ADD COLUMN IF NOT EXISTS conditions text;
ALTER TABLE public.service_case_offers ADD COLUMN IF NOT EXISTS extracted_at timestamptz;
ALTER TABLE public.service_case_offers ADD COLUMN IF NOT EXISTS total_net integer;
ALTER TABLE public.service_case_offers ADD COLUMN IF NOT EXISTS total_gross integer;
