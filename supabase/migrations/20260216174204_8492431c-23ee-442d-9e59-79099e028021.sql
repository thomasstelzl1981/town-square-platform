
-- =============================================================================
-- Phase 1: PET-Vertical Kerntabellen (PET-001 bis PET-004)
-- =============================================================================

-- Enums
CREATE TYPE public.pet_species AS ENUM ('dog', 'cat', 'bird', 'rabbit', 'hamster', 'fish', 'reptile', 'horse', 'other');
CREATE TYPE public.pet_gender AS ENUM ('male', 'female', 'unknown');
CREATE TYPE public.pet_provider_type AS ENUM ('grooming', 'boarding', 'walking', 'training', 'veterinary', 'sitting', 'daycare', 'transport', 'other');
CREATE TYPE public.pet_provider_status AS ENUM ('pending', 'active', 'suspended');
CREATE TYPE public.pet_service_category AS ENUM ('grooming', 'boarding', 'walking', 'training', 'veterinary', 'sitting', 'daycare', 'transport', 'nutrition', 'other');
CREATE TYPE public.pet_price_type AS ENUM ('fixed', 'hourly', 'daily', 'per_session', 'on_request');

-- ─── 1. pets ────────────────────────────────────────────────────────────────────
CREATE TABLE public.pets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  owner_user_id UUID REFERENCES public.profiles(id),
  name TEXT NOT NULL,
  species public.pet_species NOT NULL DEFAULT 'dog',
  breed TEXT,
  gender public.pet_gender DEFAULT 'unknown',
  birth_date DATE,
  weight_kg NUMERIC(5,1),
  chip_number TEXT,
  photo_url TEXT,
  allergies TEXT[] DEFAULT '{}',
  neutered BOOLEAN DEFAULT false,
  vet_name TEXT,
  insurance_provider TEXT,
  insurance_policy_no TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pets_select_own_tenant" ON public.pets FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "pets_insert_own_tenant" ON public.pets FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id());
CREATE POLICY "pets_update_own_tenant" ON public.pets FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "pets_delete_own_tenant" ON public.pets FOR DELETE
  USING (tenant_id = public.get_user_tenant_id());

CREATE INDEX idx_pets_tenant_created ON public.pets (tenant_id, created_at);
CREATE INDEX idx_pets_owner ON public.pets (owner_user_id);

-- ─── 2. pet_vaccinations ────────────────────────────────────────────────────────
CREATE TABLE public.pet_vaccinations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  vaccination_type TEXT NOT NULL,
  vaccine_name TEXT,
  administered_at DATE NOT NULL,
  next_due_at DATE,
  vet_name TEXT,
  batch_number TEXT,
  document_node_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pet_vaccinations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pet_vacc_select_own_tenant" ON public.pet_vaccinations FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "pet_vacc_insert_own_tenant" ON public.pet_vaccinations FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id());
CREATE POLICY "pet_vacc_update_own_tenant" ON public.pet_vaccinations FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "pet_vacc_delete_own_tenant" ON public.pet_vaccinations FOR DELETE
  USING (tenant_id = public.get_user_tenant_id());

CREATE INDEX idx_pet_vacc_tenant_created ON public.pet_vaccinations (tenant_id, created_at);
CREATE INDEX idx_pet_vacc_pet ON public.pet_vaccinations (pet_id);

-- ─── 3. pet_providers ───────────────────────────────────────────────────────────
CREATE TABLE public.pet_providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  user_id UUID REFERENCES public.profiles(id),
  company_name TEXT NOT NULL,
  provider_type public.pet_provider_type NOT NULL DEFAULT 'other',
  status public.pet_provider_status NOT NULL DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  rating_avg NUMERIC(2,1) DEFAULT 0,
  bio TEXT,
  operating_hours JSONB DEFAULT '{}',
  phone TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pet_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pet_prov_select_own_tenant" ON public.pet_providers FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "pet_prov_insert_own_tenant" ON public.pet_providers FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id());
CREATE POLICY "pet_prov_update_own_tenant" ON public.pet_providers FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "pet_prov_delete_own_tenant" ON public.pet_providers FOR DELETE
  USING (tenant_id = public.get_user_tenant_id());

CREATE INDEX idx_pet_prov_tenant_created ON public.pet_providers (tenant_id, created_at);
CREATE INDEX idx_pet_prov_user ON public.pet_providers (user_id);

-- ─── 4. pet_services ────────────────────────────────────────────────────────────
CREATE TABLE public.pet_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.pet_providers(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  title TEXT NOT NULL,
  description TEXT,
  category public.pet_service_category NOT NULL DEFAULT 'other',
  duration_minutes INTEGER DEFAULT 60,
  price_cents INTEGER DEFAULT 0,
  price_type public.pet_price_type NOT NULL DEFAULT 'fixed',
  species_allowed TEXT[] DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pet_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pet_svc_select_own_tenant" ON public.pet_services FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "pet_svc_insert_own_tenant" ON public.pet_services FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id());
CREATE POLICY "pet_svc_update_own_tenant" ON public.pet_services FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "pet_svc_delete_own_tenant" ON public.pet_services FOR DELETE
  USING (tenant_id = public.get_user_tenant_id());

CREATE INDEX idx_pet_svc_tenant_created ON public.pet_services (tenant_id, created_at);
CREATE INDEX idx_pet_svc_provider ON public.pet_services (provider_id);

-- ─── Updated-at Trigger ─────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_pet_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_pets_updated_at BEFORE UPDATE ON public.pets
  FOR EACH ROW EXECUTE FUNCTION public.update_pet_updated_at();
CREATE TRIGGER trg_pet_vaccinations_updated_at BEFORE UPDATE ON public.pet_vaccinations
  FOR EACH ROW EXECUTE FUNCTION public.update_pet_updated_at();
CREATE TRIGGER trg_pet_providers_updated_at BEFORE UPDATE ON public.pet_providers
  FOR EACH ROW EXECUTE FUNCTION public.update_pet_updated_at();
CREATE TRIGGER trg_pet_services_updated_at BEFORE UPDATE ON public.pet_services
  FOR EACH ROW EXECUTE FUNCTION public.update_pet_updated_at();
