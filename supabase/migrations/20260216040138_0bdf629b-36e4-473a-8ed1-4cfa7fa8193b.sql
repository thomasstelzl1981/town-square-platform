
-- 1) Extend miety_homes with building details
ALTER TABLE public.miety_homes
  ADD COLUMN IF NOT EXISTS construction_year integer,
  ADD COLUMN IF NOT EXISTS market_value numeric,
  ADD COLUMN IF NOT EXISTS floor_count integer,
  ADD COLUMN IF NOT EXISTS bathrooms_count numeric,
  ADD COLUMN IF NOT EXISTS heating_type text,
  ADD COLUMN IF NOT EXISTS has_garage boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_garden boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS has_basement boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_renovation_year integer,
  ADD COLUMN IF NOT EXISTS plot_area_sqm numeric;

-- 2) Create miety_loans table
CREATE TABLE public.miety_loans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id uuid NOT NULL REFERENCES public.miety_homes(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.organizations(id),
  bank_name text,
  loan_amount numeric,
  interest_rate numeric,
  monthly_rate numeric,
  start_date date,
  end_date date,
  remaining_balance numeric,
  loan_type text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.miety_loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own loans" ON public.miety_loans
  FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can insert own loans" ON public.miety_loans
  FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can update own loans" ON public.miety_loans
  FOR UPDATE USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can delete own loans" ON public.miety_loans
  FOR DELETE USING (tenant_id = public.get_user_tenant_id());

-- 3) Create miety_tenancies table
CREATE TABLE public.miety_tenancies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  home_id uuid NOT NULL REFERENCES public.miety_homes(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.organizations(id),
  landlord_name text,
  landlord_contact text,
  base_rent numeric,
  additional_costs numeric,
  total_rent numeric,
  deposit_amount numeric,
  lease_start date,
  lease_end date,
  cancellation_period text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.miety_tenancies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenancies" ON public.miety_tenancies
  FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can insert own tenancies" ON public.miety_tenancies
  FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can update own tenancies" ON public.miety_tenancies
  FOR UPDATE USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can delete own tenancies" ON public.miety_tenancies
  FOR DELETE USING (tenant_id = public.get_user_tenant_id());
