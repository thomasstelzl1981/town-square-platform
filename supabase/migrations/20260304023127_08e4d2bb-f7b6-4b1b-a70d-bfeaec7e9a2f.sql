ALTER TABLE public.miety_contracts 
  ADD COLUMN IF NOT EXISTS meter_number TEXT,
  ADD COLUMN IF NOT EXISTS previous_consumption NUMERIC;