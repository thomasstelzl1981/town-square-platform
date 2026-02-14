
-- ============================================================
-- MOD-18 Rework: household_persons + pension_records
-- Zentrale Personen-SSOT (wiederverwendbar in MOD-11)
-- ============================================================

-- 1) household_persons
CREATE TABLE public.household_persons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'hauptperson' CHECK (role IN ('hauptperson', 'partner', 'kind', 'weitere')),
  salutation TEXT,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  birth_date DATE,
  email TEXT,
  phone TEXT,
  street TEXT,
  house_number TEXT,
  zip TEXT,
  city TEXT,
  marital_status TEXT,
  employment_status TEXT,
  employer_name TEXT,
  net_income_range TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_household_persons_tenant ON public.household_persons(tenant_id);
CREATE INDEX idx_household_persons_user ON public.household_persons(user_id);

ALTER TABLE public.household_persons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "household_persons_select" ON public.household_persons
  FOR SELECT USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "household_persons_insert" ON public.household_persons
  FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "household_persons_update" ON public.household_persons
  FOR UPDATE USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "household_persons_delete" ON public.household_persons
  FOR DELETE USING (tenant_id = public.get_user_tenant_id());

-- 2) pension_records
CREATE TABLE public.pension_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  person_id UUID NOT NULL REFERENCES public.household_persons(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  info_date DATE,
  current_pension NUMERIC,
  projected_pension NUMERIC,
  disability_pension NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pension_records_person ON public.pension_records(person_id);
CREATE INDEX idx_pension_records_tenant ON public.pension_records(tenant_id);

ALTER TABLE public.pension_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pension_records_select" ON public.pension_records
  FOR SELECT USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "pension_records_insert" ON public.pension_records
  FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "pension_records_update" ON public.pension_records
  FOR UPDATE USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "pension_records_delete" ON public.pension_records
  FOR DELETE USING (tenant_id = public.get_user_tenant_id());

-- 3) updated_at triggers
CREATE TRIGGER update_household_persons_updated_at
  BEFORE UPDATE ON public.household_persons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pension_records_updated_at
  BEFORE UPDATE ON public.pension_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
