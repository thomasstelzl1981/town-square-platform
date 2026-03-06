
-- Add SSOT-Final Mode columns to valuation_cases
ALTER TABLE public.valuation_cases 
  ADD COLUMN IF NOT EXISTS source_mode TEXT NOT NULL DEFAULT 'DRAFT_INTAKE',
  ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS draft_source_ref UUID;

-- Add index for property_id lookups
CREATE INDEX IF NOT EXISTS idx_valuation_cases_property_id ON public.valuation_cases(property_id) WHERE property_id IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN public.valuation_cases.source_mode IS 'SSOT_FINAL (MOD-04 with full property data) or DRAFT_INTAKE (expose-based extraction)';
COMMENT ON COLUMN public.valuation_cases.property_id IS 'Link to MOD-04 property for SSOT_FINAL mode';
COMMENT ON COLUMN public.valuation_cases.draft_source_ref IS 'Reference to original expose/inbox item for DRAFT_INTAKE mode';
