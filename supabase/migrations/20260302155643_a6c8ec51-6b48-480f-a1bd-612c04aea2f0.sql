CREATE TABLE public.sales_settlements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.sales_cases(id) ON DELETE CASCADE,
  reservation_id UUID REFERENCES public.sales_reservations(id),
  deal_value NUMERIC NOT NULL DEFAULT 0,
  buyer_commission_netto NUMERIC NOT NULL DEFAULT 0,
  seller_commission_netto NUMERIC NOT NULL DEFAULT 0,
  total_commission_netto NUMERIC NOT NULL DEFAULT 0,
  total_commission_brutto NUMERIC NOT NULL DEFAULT 0,
  vat_amount NUMERIC NOT NULL DEFAULT 0,
  platform_share_pct NUMERIC NOT NULL DEFAULT 25,
  platform_share_amount NUMERIC NOT NULL DEFAULT 0,
  manager_netto_amount NUMERIC NOT NULL DEFAULT 0,
  partner_org_id UUID REFERENCES public.organizations(id),
  partner_share_pct NUMERIC,
  partner_share_amount NUMERIC,
  house_share_amount NUMERIC,
  status TEXT NOT NULL DEFAULT 'draft',
  calculated_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  invoiced_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  created_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view settlements for their org"
  ON public.sales_settlements FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert settlements for their org"
  ON public.sales_settlements FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can update settlements for their org"
  ON public.sales_settlements FOR UPDATE
  USING (tenant_id IN (SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE INDEX idx_sales_settlements_case_id ON public.sales_settlements(case_id);
CREATE INDEX idx_sales_settlements_tenant_id ON public.sales_settlements(tenant_id);
CREATE INDEX idx_sales_settlements_status ON public.sales_settlements(status);

CREATE TRIGGER update_sales_settlements_updated_at
  BEFORE UPDATE ON public.sales_settlements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();