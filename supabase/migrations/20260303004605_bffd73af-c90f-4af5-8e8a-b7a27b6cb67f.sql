
-- ═══ WAVE E: Add z3_owner_id to pets for Zone 3 ownership ═══

ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS z3_owner_id UUID;

-- Index for Z3 pet lookups
CREATE INDEX IF NOT EXISTS idx_pets_z3_owner ON public.pets (z3_owner_id) WHERE z3_owner_id IS NOT NULL;

-- Comment for clarity
COMMENT ON COLUMN public.pets.z3_owner_id IS 'References pet_z1_customers.id for Zone 3 pet owners (non-auth users)';
