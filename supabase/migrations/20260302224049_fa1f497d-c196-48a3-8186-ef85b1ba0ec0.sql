
-- ============================================================
-- FDC (Finance Data Controller) — Wave 1 DB Schema
-- 3 tables: finance_data_registry, finance_entity_links, finance_repair_actions
-- ============================================================

-- 1) finance_data_registry — Index aller Finanzobjekte (KEINE sensiblen Payloads)
CREATE TABLE public.finance_data_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  source_module text NOT NULL DEFAULT 'MOD18',
  owner_person_id uuid NULL,
  household_id uuid NULL,
  linked_account_id uuid NULL,
  linked_property_id uuid NULL,
  status text NOT NULL DEFAULT 'active',
  confidence int NULL,
  last_verified_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Prevent duplicate registry rows for same SSOT object
CREATE UNIQUE INDEX idx_fdc_registry_unique ON public.finance_data_registry (tenant_id, entity_type, entity_id);

-- Performance index
CREATE INDEX idx_fdc_registry_tenant ON public.finance_data_registry (tenant_id, status);
CREATE INDEX idx_fdc_registry_entity ON public.finance_data_registry (entity_type, entity_id);

-- RLS
ALTER TABLE public.finance_data_registry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_restrictive" ON public.finance_data_registry
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (tenant_id = public.get_user_tenant_id() OR public.is_platform_admin(auth.uid()))
  WITH CHECK (tenant_id = public.get_user_tenant_id() OR public.is_platform_admin(auth.uid()));

-- 2) finance_entity_links — Graph der Beziehungen
CREATE TABLE public.finance_entity_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  from_type text NOT NULL,
  from_id uuid NOT NULL,
  to_type text NOT NULL,
  to_id uuid NOT NULL,
  link_type text NOT NULL,
  confidence int NULL,
  created_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Prevent duplicate links
CREATE UNIQUE INDEX idx_fdc_links_unique ON public.finance_entity_links (tenant_id, from_type, from_id, to_type, to_id, link_type);

-- Performance
CREATE INDEX idx_fdc_links_tenant ON public.finance_entity_links (tenant_id);
CREATE INDEX idx_fdc_links_from ON public.finance_entity_links (from_type, from_id);
CREATE INDEX idx_fdc_links_to ON public.finance_entity_links (to_type, to_id);

-- RLS
ALTER TABLE public.finance_entity_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_restrictive" ON public.finance_entity_links
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (tenant_id = public.get_user_tenant_id() OR public.is_platform_admin(auth.uid()))
  WITH CHECK (tenant_id = public.get_user_tenant_id() OR public.is_platform_admin(auth.uid()));

-- 3) finance_repair_actions — Befunde + Aufgaben (actions-only MVP)
CREATE TABLE public.finance_repair_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  severity text NOT NULL DEFAULT 'info',
  code text NOT NULL,
  scope_key text NOT NULL DEFAULT '',
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  owner_role text NOT NULL DEFAULT 'user',
  due_at timestamptz NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  resolved_at timestamptz NULL,
  resolved_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Idempotent: only one open action per code+entity+scope
CREATE UNIQUE INDEX idx_fdc_actions_open_unique ON public.finance_repair_actions (tenant_id, code, entity_type, entity_id, scope_key)
  WHERE status = 'open';

-- Performance
CREATE INDEX idx_fdc_actions_tenant_status ON public.finance_repair_actions (tenant_id, status);
CREATE INDEX idx_fdc_actions_entity ON public.finance_repair_actions (entity_type, entity_id);

-- RLS
ALTER TABLE public.finance_repair_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation_restrictive" ON public.finance_repair_actions
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (tenant_id = public.get_user_tenant_id() OR public.is_platform_admin(auth.uid()))
  WITH CHECK (tenant_id = public.get_user_tenant_id() OR public.is_platform_admin(auth.uid()));

-- Auto-update updated_at on registry
CREATE TRIGGER update_finance_data_registry_updated_at
  BEFORE UPDATE ON public.finance_data_registry
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
