
-- SLC Phase Enum
CREATE TYPE public.slc_phase AS ENUM (
  'mandate_active',
  'published',
  'inquiry',
  'reserved',
  'contract_draft',
  'notary_scheduled',
  'notary_completed',
  'handover',
  'settlement',
  'closed_won',
  'closed_lost'
);

-- Sales Cases
CREATE TABLE public.sales_cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('property_unit', 'project_unit')),
  asset_id UUID NOT NULL,
  property_id UUID REFERENCES public.properties(id),
  project_id UUID REFERENCES public.dev_projects(id),
  listing_id UUID REFERENCES public.listings(id),
  current_phase public.slc_phase NOT NULL DEFAULT 'mandate_active',
  deal_contact_id UUID REFERENCES public.contacts(id),
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  close_reason TEXT CHECK (close_reason IN ('won', 'lost', 'withdrawn')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view own sales cases"
  ON public.sales_cases FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE POLICY "Tenant users can insert sales cases"
  ON public.sales_cases FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE POLICY "Tenant users can update own sales cases"
  ON public.sales_cases FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE INDEX idx_sales_cases_tenant ON public.sales_cases(tenant_id);
CREATE INDEX idx_sales_cases_asset ON public.sales_cases(asset_type, asset_id);
CREATE INDEX idx_sales_cases_phase ON public.sales_cases(current_phase);

-- Sales Lifecycle Events
CREATE TABLE public.sales_lifecycle_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.sales_cases(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error')),
  phase_before public.slc_phase,
  phase_after public.slc_phase,
  actor_id UUID,
  payload JSONB DEFAULT '{}'::jsonb,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_lifecycle_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view own sales events"
  ON public.sales_lifecycle_events FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE POLICY "Tenant users can insert sales events"
  ON public.sales_lifecycle_events FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE INDEX idx_sales_events_case ON public.sales_lifecycle_events(case_id);
CREATE INDEX idx_sales_events_type ON public.sales_lifecycle_events(event_type);
CREATE INDEX idx_sales_events_tenant ON public.sales_lifecycle_events(tenant_id);

-- Extend listing_publications for drift detection
ALTER TABLE public.listing_publications
  ADD COLUMN IF NOT EXISTS expected_hash TEXT,
  ADD COLUMN IF NOT EXISTS last_synced_hash TEXT,
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- Updated_at trigger for sales_cases
CREATE TRIGGER update_sales_cases_updated_at
  BEFORE UPDATE ON public.sales_cases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for sales_lifecycle_events
ALTER PUBLICATION supabase_realtime ADD TABLE public.sales_lifecycle_events;
