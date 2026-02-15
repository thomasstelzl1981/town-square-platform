
-- 1. Add missing tax fields to properties (already applied by partial migration)
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS tax_reference_number text;
ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS ownership_share_percent numeric DEFAULT 100;

-- 2. Create vv_annual_data table for yearly manual tax entries
CREATE TABLE IF NOT EXISTS public.vv_annual_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.organizations(id),
  property_id uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  tax_year integer NOT NULL,
  
  income_other numeric DEFAULT 0,
  income_insurance_payout numeric DEFAULT 0,
  
  cost_disagio numeric DEFAULT 0,
  cost_financing_fees numeric DEFAULT 0,
  
  cost_maintenance numeric DEFAULT 0,
  cost_management_fee numeric DEFAULT 0,
  cost_legal_advisory numeric DEFAULT 0,
  cost_insurance_non_recoverable numeric DEFAULT 0,
  cost_travel numeric DEFAULT 0,
  cost_bank_fees numeric DEFAULT 0,
  cost_other numeric DEFAULT 0,
  
  vacancy_days integer DEFAULT 0,
  vacancy_intent_confirmed boolean DEFAULT true,
  relative_rental boolean DEFAULT false,
  heritage_afa_amount numeric DEFAULT 0,
  special_afa_amount numeric DEFAULT 0,
  
  confirmed boolean DEFAULT false,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'locked')),
  notes text,
  locked_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(tenant_id, property_id, tax_year)
);

-- Enable RLS
ALTER TABLE public.vv_annual_data ENABLE ROW LEVEL SECURITY;

-- RLS policies using memberships table
CREATE POLICY "Users can view own tenant vv_annual_data"
  ON public.vv_annual_data FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own tenant vv_annual_data"
  ON public.vv_annual_data FOR INSERT
  WITH CHECK (tenant_id IN (
    SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update own tenant vv_annual_data"
  ON public.vv_annual_data FOR UPDATE
  USING (tenant_id IN (
    SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own tenant vv_annual_data"
  ON public.vv_annual_data FOR DELETE
  USING (tenant_id IN (
    SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()
  ));

-- Timestamp trigger
CREATE TRIGGER update_vv_annual_data_updated_at
  BEFORE UPDATE ON public.vv_annual_data
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
