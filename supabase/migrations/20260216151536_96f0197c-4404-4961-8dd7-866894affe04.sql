
ALTER TABLE public.vorsorge_contracts ADD COLUMN IF NOT EXISTS end_date date;
ALTER TABLE public.vorsorge_contracts ADD COLUMN IF NOT EXISTS monthly_benefit numeric;
ALTER TABLE public.vorsorge_contracts ADD COLUMN IF NOT EXISTS insured_sum numeric;
ALTER TABLE public.vorsorge_contracts ADD COLUMN IF NOT EXISTS dynamics_percent numeric;
