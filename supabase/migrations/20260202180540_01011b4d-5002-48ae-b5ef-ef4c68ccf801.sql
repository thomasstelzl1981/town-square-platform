-- MOD-04 Immobilienakte SSOT Migration
-- Add missing columns to properties, units, leases, loans, nk_periods
-- Create property_accounting table for AfA/Accounting Block

-- ============================================
-- BLOCK A: Properties - Missing Columns
-- ============================================
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS category text DEFAULT 'einzelobjekt',
ADD COLUMN IF NOT EXISTS sale_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS rental_managed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS reporting_regime text DEFAULT 'VuV',
ADD COLUMN IF NOT EXISTS location_label text,
ADD COLUMN IF NOT EXISTS location_notes text,
ADD COLUMN IF NOT EXISTS latitude numeric(10, 7),
ADD COLUMN IF NOT EXISTS longitude numeric(10, 7),
ADD COLUMN IF NOT EXISTS acquisition_costs numeric(12, 2),
ADD COLUMN IF NOT EXISTS landlord_context_id uuid REFERENCES public.landlord_contexts(id),
ADD COLUMN IF NOT EXISTS allocation_key text DEFAULT 'SQM',
ADD COLUMN IF NOT EXISTS te_number text;

-- ============================================
-- BLOCK C: Units - Missing Columns
-- ============================================
ALTER TABLE public.units
ADD COLUMN IF NOT EXISTS area_usable_sqm numeric(10, 2),
ADD COLUMN IF NOT EXISTS mea_share numeric(8, 4),
ADD COLUMN IF NOT EXISTS hausgeld_monthly numeric(10, 2),
ADD COLUMN IF NOT EXISTS vacancy_days integer DEFAULT 0;

-- ============================================
-- BLOCK F: Leases - Missing Columns
-- ============================================
ALTER TABLE public.leases
ADD COLUMN IF NOT EXISTS lease_type text DEFAULT 'unbefristet';

-- ============================================
-- BLOCK H: Loans - Missing Columns
-- ============================================
ALTER TABLE public.loans
ADD COLUMN IF NOT EXISTS original_amount numeric(14, 2);

-- ============================================
-- BLOCK G: NK Periods - Missing Columns
-- ============================================
ALTER TABLE public.nk_periods
ADD COLUMN IF NOT EXISTS allocatable_eur numeric(12, 2),
ADD COLUMN IF NOT EXISTS non_allocatable_eur numeric(12, 2),
ADD COLUMN IF NOT EXISTS status text DEFAULT 'laufend',
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ============================================
-- BLOCK I: Property Accounting (NEW TABLE)
-- ============================================
CREATE TABLE IF NOT EXISTS public.property_accounting (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.organizations(id),
  property_id uuid NOT NULL REFERENCES public.properties(id),
  
  -- AfA / Depreciation Data
  land_share_percent numeric(5, 2),
  building_share_percent numeric(5, 2),
  book_value_eur numeric(14, 2),
  afa_rate_percent numeric(5, 2) DEFAULT 2.0,
  afa_start_date date,
  afa_method text DEFAULT 'linear',
  remaining_useful_life_years integer,
  modernization_costs_eur numeric(12, 2),
  modernization_year integer,
  
  -- Chart of Accounts / Classification
  coa_version text DEFAULT 'SKR04_Starter',
  account_mappings jsonb DEFAULT '{}',
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Unique constraint: one accounting record per property per tenant
  UNIQUE(tenant_id, property_id)
);

-- Enable RLS
ALTER TABLE public.property_accounting ENABLE ROW LEVEL SECURITY;

-- RLS Policies for property_accounting
CREATE POLICY "property_accounting_select" ON public.property_accounting
  FOR SELECT USING (tenant_id IN (
    SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "property_accounting_insert" ON public.property_accounting
  FOR INSERT WITH CHECK (tenant_id IN (
    SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "property_accounting_update" ON public.property_accounting
  FOR UPDATE USING (tenant_id IN (
    SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "property_accounting_delete" ON public.property_accounting
  FOR DELETE USING (tenant_id IN (
    SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()
  ));

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_property_accounting_property 
  ON public.property_accounting(property_id);
CREATE INDEX IF NOT EXISTS idx_property_accounting_tenant 
  ON public.property_accounting(tenant_id);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_property_accounting_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_property_accounting_updated_at ON public.property_accounting;
CREATE TRIGGER trg_property_accounting_updated_at
  BEFORE UPDATE ON public.property_accounting
  FOR EACH ROW
  EXECUTE FUNCTION public.update_property_accounting_updated_at();