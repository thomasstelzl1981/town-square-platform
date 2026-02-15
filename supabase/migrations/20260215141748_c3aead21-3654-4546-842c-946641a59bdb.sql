
-- NK-Abrechnung Engine: nk_cost_items + nk_tenant_settlements

-- 1. nk_cost_items
CREATE TABLE public.nk_cost_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  nk_period_id UUID NOT NULL REFERENCES public.nk_periods(id) ON DELETE CASCADE,
  category_code TEXT NOT NULL,
  label_raw TEXT,
  label_display TEXT,
  amount_total_house NUMERIC,
  amount_unit NUMERIC,
  key_type TEXT DEFAULT 'mea',
  key_basis_unit NUMERIC,
  key_basis_total NUMERIC,
  is_apportionable BOOLEAN NOT NULL DEFAULT true,
  reason_code TEXT,
  mapping_confidence NUMERIC DEFAULT 0,
  mapping_source TEXT DEFAULT 'rule',
  source_document_id UUID REFERENCES public.documents(id),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.nk_cost_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nk_cost_items_select" ON public.nk_cost_items FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));
CREATE POLICY "nk_cost_items_insert" ON public.nk_cost_items FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));
CREATE POLICY "nk_cost_items_update" ON public.nk_cost_items FOR UPDATE
  USING (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));
CREATE POLICY "nk_cost_items_delete" ON public.nk_cost_items FOR DELETE
  USING (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));

-- 2. nk_tenant_settlements
CREATE TABLE public.nk_tenant_settlements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  nk_period_id UUID REFERENCES public.nk_periods(id),
  property_id UUID NOT NULL REFERENCES public.properties(id),
  unit_id UUID NOT NULL REFERENCES public.units(id),
  lease_id UUID NOT NULL,
  renter_contact_id UUID REFERENCES public.contacts(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  lease_days_in_period INTEGER,
  total_days_in_period INTEGER,
  total_apportionable NUMERIC,
  total_heating NUMERIC,
  total_prepaid_nk NUMERIC,
  total_prepaid_heating NUMERIC,
  balance NUMERIC,
  status TEXT NOT NULL DEFAULT 'draft',
  calculation_json JSONB,
  validation_warnings JSONB,
  exported_pdf_path TEXT,
  calculated_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  confirmed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.nk_tenant_settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nk_tenant_settlements_select" ON public.nk_tenant_settlements FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));
CREATE POLICY "nk_tenant_settlements_insert" ON public.nk_tenant_settlements FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));
CREATE POLICY "nk_tenant_settlements_update" ON public.nk_tenant_settlements FOR UPDATE
  USING (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));
CREATE POLICY "nk_tenant_settlements_delete" ON public.nk_tenant_settlements FOR DELETE
  USING (tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid())));

-- Indexes
CREATE INDEX idx_nk_cost_items_period ON public.nk_cost_items(nk_period_id);
CREATE INDEX idx_nk_cost_items_tenant ON public.nk_cost_items(tenant_id);
CREATE INDEX idx_nk_tenant_settlements_property ON public.nk_tenant_settlements(property_id);
CREATE INDEX idx_nk_tenant_settlements_lease ON public.nk_tenant_settlements(lease_id);
CREATE INDEX idx_nk_tenant_settlements_tenant ON public.nk_tenant_settlements(tenant_id);

-- Updated_at triggers
CREATE TRIGGER update_nk_cost_items_updated_at
  BEFORE UPDATE ON public.nk_cost_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nk_tenant_settlements_updated_at
  BEFORE UPDATE ON public.nk_tenant_settlements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
