
-- postservice_mandates + ALTER tables

CREATE TABLE public.postservice_mandates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  requested_by_user_id UUID NOT NULL,
  type TEXT NOT NULL DEFAULT 'postservice_forwarding',
  status TEXT NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'setup_in_progress', 'active', 'paused', 'cancelled')),
  contract_terms JSONB NOT NULL DEFAULT '{"duration_months": 12, "monthly_credits": 30, "billing_mode": "annual_prepay"}'::jsonb,
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_postservice_mandates_tenant ON public.postservice_mandates(tenant_id);
CREATE INDEX idx_postservice_mandates_status ON public.postservice_mandates(status);

ALTER TABLE public.postservice_mandates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins full access on postservice_mandates"
  ON public.postservice_mandates FOR ALL
  USING (EXISTS (SELECT 1 FROM public.memberships m WHERE m.user_id = auth.uid() AND m.role = 'platform_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.memberships m WHERE m.user_id = auth.uid() AND m.role = 'platform_admin'));

CREATE POLICY "Users can view own tenant mandates"
  ON public.postservice_mandates FOR SELECT
  USING (tenant_id IN (SELECT m.tenant_id FROM public.memberships m WHERE m.user_id = auth.uid()));

CREATE POLICY "Users can create mandates for own tenant"
  ON public.postservice_mandates FOR INSERT
  WITH CHECK (
    requested_by_user_id = auth.uid()
    AND tenant_id IN (SELECT m.tenant_id FROM public.memberships m WHERE m.user_id = auth.uid())
  );

CREATE TRIGGER update_postservice_mandates_updated_at
  BEFORE UPDATE ON public.postservice_mandates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ALTER inbound_routing_rules
ALTER TABLE public.inbound_routing_rules
  ADD COLUMN mandate_id UUID REFERENCES public.postservice_mandates(id),
  ADD COLUMN target_tenant_id UUID REFERENCES public.organizations(id),
  ADD COLUMN target_module TEXT DEFAULT 'MOD-03';

-- ALTER inbound_items
ALTER TABLE public.inbound_items
  ADD COLUMN mandate_id UUID REFERENCES public.postservice_mandates(id),
  ADD COLUMN routed_to_zone2_at TIMESTAMPTZ;
