
-- ============================================================
-- TENANCY LIFECYCLE CONTROLLER (TLC) — Foundation Tables
-- ============================================================

-- 1. tenancy_lifecycle_events — Audit-Trail / Event-Log pro Mietverhältnis
CREATE TABLE public.tenancy_lifecycle_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lease_id UUID NOT NULL REFERENCES public.leases(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  phase TEXT NOT NULL DEFAULT 'active',
  severity TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  description TEXT,
  payload JSONB DEFAULT '{}',
  triggered_by TEXT NOT NULL DEFAULT 'system',
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tle_tenant_lease ON public.tenancy_lifecycle_events(tenant_id, lease_id);
CREATE INDEX idx_tle_event_type ON public.tenancy_lifecycle_events(event_type);
CREATE INDEX idx_tle_phase ON public.tenancy_lifecycle_events(phase);
CREATE INDEX idx_tle_unresolved ON public.tenancy_lifecycle_events(tenant_id, lease_id) WHERE resolved_at IS NULL;

ALTER TABLE public.tenancy_lifecycle_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org lifecycle events"
  ON public.tenancy_lifecycle_events FOR SELECT
  USING (tenant_id IN (SELECT m.tenant_id FROM public.memberships m WHERE m.user_id = auth.uid()));

CREATE POLICY "Users can create lifecycle events for their org"
  ON public.tenancy_lifecycle_events FOR INSERT
  WITH CHECK (tenant_id IN (SELECT m.tenant_id FROM public.memberships m WHERE m.user_id = auth.uid()));

CREATE POLICY "Users can update lifecycle events for their org"
  ON public.tenancy_lifecycle_events FOR UPDATE
  USING (tenant_id IN (SELECT m.tenant_id FROM public.memberships m WHERE m.user_id = auth.uid()));

-- 2. tenancy_dunning_configs — Konfigurierbare Mahnstufen pro Tenant
CREATE TABLE public.tenancy_dunning_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 1,
  label TEXT NOT NULL,
  days_after_due INTEGER NOT NULL DEFAULT 7,
  template_code TEXT,
  send_channel TEXT NOT NULL DEFAULT 'email',
  fee_eur NUMERIC(8,2) DEFAULT 0,
  auto_send BOOLEAN NOT NULL DEFAULT false,
  escalation_target TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, level)
);

ALTER TABLE public.tenancy_dunning_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their org dunning configs"
  ON public.tenancy_dunning_configs FOR ALL
  USING (tenant_id IN (SELECT m.tenant_id FROM public.memberships m WHERE m.user_id = auth.uid()));

-- 3. tenancy_tasks — Universelle Aufgaben/Tickets pro Mietverhältnis
CREATE TABLE public.tenancy_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  lease_id UUID REFERENCES public.leases(id) ON DELETE SET NULL,
  property_id UUID,
  unit_id UUID,
  task_type TEXT NOT NULL DEFAULT 'task',
  category TEXT,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'open',
  assigned_to UUID,
  assigned_contact_id UUID,
  due_date DATE,
  sla_deadline TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,
  metadata JSONB DEFAULT '{}',
  parent_task_id UUID REFERENCES public.tenancy_tasks(id) ON DELETE SET NULL,
  lifecycle_event_id UUID REFERENCES public.tenancy_lifecycle_events(id) ON DELETE SET NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tt_tenant ON public.tenancy_tasks(tenant_id);
CREATE INDEX idx_tt_lease ON public.tenancy_tasks(tenant_id, lease_id);
CREATE INDEX idx_tt_status ON public.tenancy_tasks(status) WHERE status NOT IN ('closed', 'cancelled');
CREATE INDEX idx_tt_type ON public.tenancy_tasks(task_type);
CREATE INDEX idx_tt_due ON public.tenancy_tasks(due_date) WHERE status NOT IN ('closed', 'cancelled');

ALTER TABLE public.tenancy_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their org tenancy tasks"
  ON public.tenancy_tasks FOR ALL
  USING (tenant_id IN (SELECT m.tenant_id FROM public.memberships m WHERE m.user_id = auth.uid()));

-- Add TLC phase tracking to leases
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS tlc_phase TEXT NOT NULL DEFAULT 'active';
ALTER TABLE public.leases ADD COLUMN IF NOT EXISTS tlc_last_check TIMESTAMPTZ;

-- Trigger for updated_at
CREATE TRIGGER update_tenancy_tasks_updated_at
  BEFORE UPDATE ON public.tenancy_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenancy_dunning_configs_updated_at
  BEFORE UPDATE ON public.tenancy_dunning_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for live dashboard updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.tenancy_lifecycle_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tenancy_tasks;
