-- ============================================================
-- ADR-036: Public ID System Migration
-- Format: SOT-{PREFIX}-{BASE32_8CHARS}
-- Prefixes: T=Tenant, I=Property, E=Unit, K=Contact, D=Document, F=Finance
-- ============================================================

-- 1. Create Base32 generation function
CREATE OR REPLACE FUNCTION public.generate_public_id(prefix text)
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  base32_chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- No I, O, 0, 1 for readability
  result text := '';
  i integer;
BEGIN
  -- Generate 8 random base32 characters
  FOR i IN 1..8 LOOP
    result := result || substr(base32_chars, floor(random() * 32 + 1)::integer, 1);
  END LOOP;
  RETURN 'SOT-' || prefix || '-' || result;
END;
$$;

-- 2. Add public_id columns to all tables

-- Organizations (Prefix: T for Tenant)
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS public_id text;

-- Properties (Prefix: I for Immobilie)
ALTER TABLE public.properties 
ADD COLUMN IF NOT EXISTS public_id text;

-- Units (Prefix: E for Einheit)
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS public_id text;

-- Contacts (Prefix: K for Kontakt)
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS public_id text;

-- Documents (Prefix: D for Dokument)
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS public_id text;

-- Finance Packages (Prefix: F for Finanzierung)
ALTER TABLE public.finance_packages 
ADD COLUMN IF NOT EXISTS public_id text;

-- 3. Create trigger functions for each table

CREATE OR REPLACE FUNCTION public.set_organization_public_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.public_id IS NULL THEN
    NEW.public_id := generate_public_id('T');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_property_public_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.public_id IS NULL THEN
    NEW.public_id := generate_public_id('I');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_unit_public_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.public_id IS NULL THEN
    NEW.public_id := generate_public_id('E');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_contact_public_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.public_id IS NULL THEN
    NEW.public_id := generate_public_id('K');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_document_public_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.public_id IS NULL THEN
    NEW.public_id := generate_public_id('D');
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_finance_package_public_id()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.public_id IS NULL THEN
    NEW.public_id := generate_public_id('F');
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Create triggers

DROP TRIGGER IF EXISTS trg_set_organization_public_id ON public.organizations;
CREATE TRIGGER trg_set_organization_public_id
  BEFORE INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_organization_public_id();

DROP TRIGGER IF EXISTS trg_set_property_public_id ON public.properties;
CREATE TRIGGER trg_set_property_public_id
  BEFORE INSERT ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION public.set_property_public_id();

DROP TRIGGER IF EXISTS trg_set_unit_public_id ON public.units;
CREATE TRIGGER trg_set_unit_public_id
  BEFORE INSERT ON public.units
  FOR EACH ROW
  EXECUTE FUNCTION public.set_unit_public_id();

DROP TRIGGER IF EXISTS trg_set_contact_public_id ON public.contacts;
CREATE TRIGGER trg_set_contact_public_id
  BEFORE INSERT ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_contact_public_id();

DROP TRIGGER IF EXISTS trg_set_document_public_id ON public.documents;
CREATE TRIGGER trg_set_document_public_id
  BEFORE INSERT ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.set_document_public_id();

DROP TRIGGER IF EXISTS trg_set_finance_package_public_id ON public.finance_packages;
CREATE TRIGGER trg_set_finance_package_public_id
  BEFORE INSERT ON public.finance_packages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_finance_package_public_id();

-- 5. Backfill existing rows with public_id

UPDATE public.organizations SET public_id = generate_public_id('T') WHERE public_id IS NULL;
UPDATE public.properties SET public_id = generate_public_id('I') WHERE public_id IS NULL;
UPDATE public.units SET public_id = generate_public_id('E') WHERE public_id IS NULL;
UPDATE public.contacts SET public_id = generate_public_id('K') WHERE public_id IS NULL;
UPDATE public.documents SET public_id = generate_public_id('D') WHERE public_id IS NULL;
UPDATE public.finance_packages SET public_id = generate_public_id('F') WHERE public_id IS NULL;

-- 6. Add UNIQUE constraints and NOT NULL after backfill

ALTER TABLE public.organizations ALTER COLUMN public_id SET NOT NULL;
ALTER TABLE public.properties ALTER COLUMN public_id SET NOT NULL;
ALTER TABLE public.units ALTER COLUMN public_id SET NOT NULL;
ALTER TABLE public.contacts ALTER COLUMN public_id SET NOT NULL;
ALTER TABLE public.documents ALTER COLUMN public_id SET NOT NULL;
ALTER TABLE public.finance_packages ALTER COLUMN public_id SET NOT NULL;

-- Add unique indexes for efficient lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_public_id ON public.organizations(public_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_public_id ON public.properties(public_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_units_public_id ON public.units(public_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_public_id ON public.contacts(public_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_documents_public_id ON public.documents(public_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_finance_packages_public_id ON public.finance_packages(public_id);