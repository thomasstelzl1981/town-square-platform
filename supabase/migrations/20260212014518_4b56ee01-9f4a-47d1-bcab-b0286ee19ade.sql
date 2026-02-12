
-- Add has_rental_properties to applicant_profiles
ALTER TABLE public.applicant_profiles
  ADD COLUMN IF NOT EXISTS has_rental_properties boolean NOT NULL DEFAULT false;

-- Create applicant_property_assets table
CREATE TABLE public.applicant_property_assets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  applicant_profile_id uuid NOT NULL REFERENCES public.applicant_profiles(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.organizations(id),
  property_index int NOT NULL DEFAULT 1,
  property_type text,
  address text,
  living_area_sqm numeric,
  rented_area_sqm numeric,
  commercial_area_sqm numeric,
  construction_year int,
  purchase_price numeric,
  estimated_value numeric,
  net_rent_monthly numeric,
  units_count int,
  loan1_lender text,
  loan1_balance numeric,
  loan1_rate_monthly numeric,
  loan1_interest_rate numeric,
  loan2_lender text,
  loan2_balance numeric,
  loan2_rate_monthly numeric,
  loan2_interest_rate numeric,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.applicant_property_assets ENABLE ROW LEVEL SECURITY;

-- RLS (same pattern as applicant_liabilities using memberships)
CREATE POLICY "pa_select_member" ON applicant_property_assets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = applicant_property_assets.tenant_id)
  );
CREATE POLICY "pa_select_platform_admin" ON applicant_property_assets
  FOR SELECT USING (is_platform_admin());

CREATE POLICY "pa_insert_member" ON applicant_property_assets
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = applicant_property_assets.tenant_id)
  );
CREATE POLICY "pa_insert_platform_admin" ON applicant_property_assets
  FOR INSERT WITH CHECK (is_platform_admin());

CREATE POLICY "pa_update_member" ON applicant_property_assets
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = applicant_property_assets.tenant_id AND m.role IN ('org_admin', 'internal_ops'))
  );
CREATE POLICY "pa_update_platform_admin" ON applicant_property_assets
  FOR UPDATE USING (is_platform_admin());

CREATE POLICY "pa_delete_admin" ON applicant_property_assets
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = applicant_property_assets.tenant_id AND m.role = 'org_admin')
  );
CREATE POLICY "pa_delete_platform_admin" ON applicant_property_assets
  FOR DELETE USING (is_platform_admin());

-- Trigger for updated_at
CREATE TRIGGER update_applicant_property_assets_updated_at
  BEFORE UPDATE ON public.applicant_property_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
