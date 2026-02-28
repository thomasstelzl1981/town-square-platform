
-- Add brand_key to commpro_phone_assistants for Zone 1 brand-scoped assistants
ALTER TABLE public.commpro_phone_assistants
  ADD COLUMN IF NOT EXISTS brand_key TEXT NULL;

-- Unique constraint: only one assistant per brand
CREATE UNIQUE INDEX IF NOT EXISTS idx_commpro_phone_assistants_brand_key
  ON public.commpro_phone_assistants (brand_key)
  WHERE brand_key IS NOT NULL;

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_commpro_phone_assistants_brand_key_lookup
  ON public.commpro_phone_assistants (brand_key)
  WHERE brand_key IS NOT NULL;

-- RLS policy: allow authenticated users to manage brand assistants (Zone 1 admin)
-- The existing user_id-based policies handle Zone 2. For Zone 1 brand assistants,
-- we need a policy that allows admins to manage them.
CREATE POLICY "Admins can manage brand assistants"
  ON public.commpro_phone_assistants
  FOR ALL
  USING (brand_key IS NOT NULL)
  WITH CHECK (brand_key IS NOT NULL);
