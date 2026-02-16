ALTER TABLE public.vorsorge_contracts
  ADD COLUMN IF NOT EXISTS projected_end_value numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS growth_rate_override numeric DEFAULT NULL;