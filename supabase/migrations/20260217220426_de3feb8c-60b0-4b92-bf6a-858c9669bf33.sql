
-- =============================================
-- 1. New table: pet_z1_pets (Tier-Daten für Z1-Kunden)
-- =============================================
CREATE TABLE public.pet_z1_pets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  z1_customer_id uuid NOT NULL REFERENCES public.pet_z1_customers(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.organizations(id),
  name text NOT NULL,
  species public.pet_species NOT NULL DEFAULT 'dog',
  breed text,
  gender public.pet_gender DEFAULT 'unknown',
  birth_date date,
  weight_kg numeric,
  chip_number text,
  neutered boolean NOT NULL DEFAULT false,
  allergies text[],
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_pet_z1_pets_z1_customer ON public.pet_z1_pets(z1_customer_id);
CREATE INDEX idx_pet_z1_pets_tenant ON public.pet_z1_pets(tenant_id, created_at);

-- Trigger for updated_at
CREATE TRIGGER update_pet_z1_pets_updated_at
  BEFORE UPDATE ON public.pet_z1_pets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 2. Extend pet_z1_customers with city + postal_code
-- =============================================
ALTER TABLE public.pet_z1_customers
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS postal_code text;

-- =============================================
-- 3. RLS for pet_z1_pets
-- =============================================
ALTER TABLE public.pet_z1_pets ENABLE ROW LEVEL SECURITY;

-- Platform admins can do everything
CREATE POLICY "Platform admins full access on pet_z1_pets"
  ON public.pet_z1_pets FOR ALL
  USING (public.is_platform_admin(auth.uid()));

-- Authenticated users can SELECT their own pets via z1_customer_id
CREATE POLICY "Users can view own z1 pets"
  ON public.pet_z1_pets FOR SELECT
  TO authenticated
  USING (
    z1_customer_id IN (
      SELECT id FROM public.pet_z1_customers WHERE user_id = auth.uid()
    )
  );

-- Authenticated users can INSERT pets for their own z1 customer
CREATE POLICY "Users can insert own z1 pets"
  ON public.pet_z1_pets FOR INSERT
  TO authenticated
  WITH CHECK (
    z1_customer_id IN (
      SELECT id FROM public.pet_z1_customers WHERE user_id = auth.uid()
    )
  );

-- Authenticated users can UPDATE their own pets
CREATE POLICY "Users can update own z1 pets"
  ON public.pet_z1_pets FOR UPDATE
  TO authenticated
  USING (
    z1_customer_id IN (
      SELECT id FROM public.pet_z1_customers WHERE user_id = auth.uid()
    )
  );

-- Authenticated users can DELETE their own pets
CREATE POLICY "Users can delete own z1 pets"
  ON public.pet_z1_pets FOR DELETE
  TO authenticated
  USING (
    z1_customer_id IN (
      SELECT id FROM public.pet_z1_customers WHERE user_id = auth.uid()
    )
  );

-- =============================================
-- 4. Additional RLS on pet_z1_customers for self-service
-- =============================================
-- Users can read their own customer profile
CREATE POLICY "Users can view own z1 customer profile"
  ON public.pet_z1_customers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can update their own customer profile
CREATE POLICY "Users can update own z1 customer profile"
  ON public.pet_z1_customers FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own customer profile (signup)
CREATE POLICY "Users can insert own z1 customer profile"
  ON public.pet_z1_customers FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
