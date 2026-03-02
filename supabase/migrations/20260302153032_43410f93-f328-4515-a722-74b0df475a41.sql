
-- Unified Sales Reservations table
-- Merges: reservations (MOD-04/Bestand) + dev_project_reservations (MOD-13/Projekte)
CREATE TABLE public.sales_reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID REFERENCES public.sales_cases(id),
  
  -- Asset references (legacy bridge)
  listing_id UUID REFERENCES public.listings(id),
  project_id UUID REFERENCES public.dev_projects(id),
  unit_id UUID REFERENCES public.dev_project_units(id),
  inquiry_id UUID REFERENCES public.listing_inquiries(id),
  
  -- Buyer
  buyer_contact_id UUID REFERENCES public.contacts(id),
  
  -- Partner (from dev_project_reservations)
  partner_org_id UUID REFERENCES public.organizations(id),
  partner_user_id UUID,
  
  -- Pricing
  reserved_price NUMERIC,
  commission_amount NUMERIC,
  commission_rate NUMERIC,
  
  -- Dates
  reservation_date TIMESTAMPTZ DEFAULT now(),
  expiry_date TIMESTAMPTZ,
  notary_date TIMESTAMPTZ,
  confirmation_date TIMESTAMPTZ,
  completion_date TIMESTAMPTZ,
  cancellation_date TIMESTAMPTZ,
  
  -- Confirmations (from reservations)
  owner_confirmed_at TIMESTAMPTZ,
  buyer_confirmed_at TIMESTAMPTZ,
  
  -- Status & Meta
  status TEXT NOT NULL DEFAULT 'pending',
  cancellation_reason TEXT,
  notes TEXT,
  created_by UUID,
  
  -- Tenant
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view own sales reservations"
  ON public.sales_reservations FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE POLICY "Tenant users can insert sales reservations"
  ON public.sales_reservations FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE POLICY "Tenant users can update own sales reservations"
  ON public.sales_reservations FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE POLICY "Tenant users can delete own sales reservations"
  ON public.sales_reservations FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE INDEX idx_sales_reservations_case ON public.sales_reservations(case_id);
CREATE INDEX idx_sales_reservations_tenant ON public.sales_reservations(tenant_id);
CREATE INDEX idx_sales_reservations_status ON public.sales_reservations(status);
CREATE INDEX idx_sales_reservations_listing ON public.sales_reservations(listing_id);
CREATE INDEX idx_sales_reservations_project ON public.sales_reservations(project_id);

-- Updated_at trigger
CREATE TRIGGER update_sales_reservations_updated_at
  BEFORE UPDATE ON public.sales_reservations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Views for backward compatibility
CREATE OR REPLACE VIEW public.v_reservations_legacy AS
  SELECT 
    id, listing_id, buyer_contact_id, inquiry_id,
    reserved_price, notary_date, notes, status,
    owner_confirmed_at, buyer_confirmed_at,
    cancellation_date AS cancelled_at, cancellation_reason AS cancelled_reason,
    tenant_id, created_at, updated_at
  FROM public.sales_reservations
  WHERE listing_id IS NOT NULL;

CREATE OR REPLACE VIEW public.v_dev_project_reservations_legacy AS
  SELECT 
    id, project_id, unit_id, buyer_contact_id, partner_org_id, partner_user_id,
    reserved_price, commission_amount, notary_date, reservation_date,
    confirmation_date, completion_date, expiry_date,
    cancellation_date, cancellation_reason, notes, status, created_by,
    tenant_id, created_at, updated_at
  FROM public.sales_reservations
  WHERE project_id IS NOT NULL;
