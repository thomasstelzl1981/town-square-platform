
-- ============================================================================
-- Migration: Add public_id to 5 tables + linked_primary_profile_id
-- Tables: dev_projects (BT), dev_project_units (BE), applicant_profiles (AP),
--         pv_plants (PV), leases (MV)
-- Note: self_disclosures already exists but needs public_id check
-- ============================================================================

-- 1. Add public_id columns (nullable first, then backfill)

ALTER TABLE public.dev_projects 
  ADD COLUMN IF NOT EXISTS public_id text;

ALTER TABLE public.dev_project_units 
  ADD COLUMN IF NOT EXISTS public_id text;

ALTER TABLE public.applicant_profiles 
  ADD COLUMN IF NOT EXISTS public_id text;

ALTER TABLE public.pv_plants 
  ADD COLUMN IF NOT EXISTS public_id text;

ALTER TABLE public.leases 
  ADD COLUMN IF NOT EXISTS public_id text;

-- 2. Add linked_primary_profile_id for co-applicant support
ALTER TABLE public.applicant_profiles
  ADD COLUMN IF NOT EXISTS linked_primary_profile_id uuid REFERENCES public.applicant_profiles(id);

-- 3. Create trigger functions for auto-generating public_id

CREATE OR REPLACE FUNCTION public.set_dev_projects_public_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.public_id IS NULL THEN
    NEW.public_id := generate_public_id('BT');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.set_dev_project_units_public_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.public_id IS NULL THEN
    NEW.public_id := generate_public_id('BE');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.set_applicant_profiles_public_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.public_id IS NULL THEN
    NEW.public_id := generate_public_id('AP');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.set_pv_plants_public_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.public_id IS NULL THEN
    NEW.public_id := generate_public_id('PV');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.set_leases_public_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.public_id IS NULL THEN
    NEW.public_id := generate_public_id('MV');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Create triggers

DROP TRIGGER IF EXISTS trg_dev_projects_public_id ON public.dev_projects;
CREATE TRIGGER trg_dev_projects_public_id
  BEFORE INSERT ON public.dev_projects
  FOR EACH ROW EXECUTE FUNCTION public.set_dev_projects_public_id();

DROP TRIGGER IF EXISTS trg_dev_project_units_public_id ON public.dev_project_units;
CREATE TRIGGER trg_dev_project_units_public_id
  BEFORE INSERT ON public.dev_project_units
  FOR EACH ROW EXECUTE FUNCTION public.set_dev_project_units_public_id();

DROP TRIGGER IF EXISTS trg_applicant_profiles_public_id ON public.applicant_profiles;
CREATE TRIGGER trg_applicant_profiles_public_id
  BEFORE INSERT ON public.applicant_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_applicant_profiles_public_id();

DROP TRIGGER IF EXISTS trg_pv_plants_public_id ON public.pv_plants;
CREATE TRIGGER trg_pv_plants_public_id
  BEFORE INSERT ON public.pv_plants
  FOR EACH ROW EXECUTE FUNCTION public.set_pv_plants_public_id();

DROP TRIGGER IF EXISTS trg_leases_public_id ON public.leases;
CREATE TRIGGER trg_leases_public_id
  BEFORE INSERT ON public.leases
  FOR EACH ROW EXECUTE FUNCTION public.set_leases_public_id();

-- 5. Backfill existing rows

UPDATE public.dev_projects SET public_id = generate_public_id('BT') WHERE public_id IS NULL;
UPDATE public.dev_project_units SET public_id = generate_public_id('BE') WHERE public_id IS NULL;
UPDATE public.applicant_profiles SET public_id = generate_public_id('AP') WHERE public_id IS NULL;
UPDATE public.pv_plants SET public_id = generate_public_id('PV') WHERE public_id IS NULL;
UPDATE public.leases SET public_id = generate_public_id('MV') WHERE public_id IS NULL;

-- 6. Add UNIQUE constraints after backfill

CREATE UNIQUE INDEX IF NOT EXISTS idx_dev_projects_public_id ON public.dev_projects(public_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_dev_project_units_public_id ON public.dev_project_units(public_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_applicant_profiles_public_id ON public.applicant_profiles(public_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_pv_plants_public_id ON public.pv_plants(public_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_leases_public_id ON public.leases(public_id);
