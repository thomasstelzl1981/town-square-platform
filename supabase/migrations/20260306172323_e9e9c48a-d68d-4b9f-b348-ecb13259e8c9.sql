ALTER TABLE public.valuation_results 
  ADD COLUMN IF NOT EXISTS gemini_research jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS beleihungswert jsonb DEFAULT NULL;