
-- ============================================================
-- MIETY TABLES: miety_homes, miety_contracts, miety_meter_readings
-- ============================================================

-- 1) miety_homes
CREATE TABLE public.miety_homes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.organizations(id),
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'Mein Zuhause',
  address text,
  address_house_no text,
  zip text,
  city text,
  ownership_type text NOT NULL DEFAULT 'eigentum',
  property_type text NOT NULL DEFAULT 'wohnung',
  area_sqm numeric,
  rooms_count numeric,
  move_in_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.miety_homes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON public.miety_homes FOR ALL
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (tenant_id = public.get_user_tenant_id());

-- 2) miety_contracts
CREATE TABLE public.miety_contracts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id uuid NOT NULL REFERENCES public.miety_homes(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.organizations(id),
  category text NOT NULL DEFAULT 'sonstige',
  provider_name text,
  contract_number text,
  monthly_cost numeric,
  start_date date,
  end_date date,
  cancellation_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.miety_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON public.miety_contracts FOR ALL
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (tenant_id = public.get_user_tenant_id());

-- 3) miety_meter_readings
CREATE TABLE public.miety_meter_readings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id uuid NOT NULL REFERENCES public.miety_homes(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.organizations(id),
  meter_type text NOT NULL DEFAULT 'strom',
  reading_value numeric NOT NULL,
  reading_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.miety_meter_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON public.miety_meter_readings FOR ALL
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (tenant_id = public.get_user_tenant_id());

-- updated_at trigger for miety_homes
CREATE TRIGGER update_miety_homes_updated_at
  BEFORE UPDATE ON public.miety_homes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
