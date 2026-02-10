
-- 1) Add ai_extraction_enabled to organizations
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS ai_extraction_enabled boolean NOT NULL DEFAULT false;

-- 2) inbox_sort_containers
CREATE TABLE public.inbox_sort_containers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inbox_sort_containers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select" ON public.inbox_sort_containers FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid()));
CREATE POLICY "tenant_insert" ON public.inbox_sort_containers FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid()));
CREATE POLICY "tenant_update" ON public.inbox_sort_containers FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid()));
CREATE POLICY "tenant_delete" ON public.inbox_sort_containers FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid()));

-- 3) inbox_sort_rules
CREATE TABLE public.inbox_sort_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  container_id uuid NOT NULL REFERENCES public.inbox_sort_containers(id) ON DELETE CASCADE,
  field text NOT NULL CHECK (field IN ('subject', 'from', 'to')),
  operator text NOT NULL DEFAULT 'contains' CHECK (operator IN ('contains')),
  keywords_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inbox_sort_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select" ON public.inbox_sort_rules FOR SELECT TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid()));
CREATE POLICY "tenant_insert" ON public.inbox_sort_rules FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid()));
CREATE POLICY "tenant_update" ON public.inbox_sort_rules FOR UPDATE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid()));
CREATE POLICY "tenant_delete" ON public.inbox_sort_rules FOR DELETE TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid()));

-- 4) updated_at trigger for containers
CREATE TRIGGER update_inbox_sort_containers_updated_at
  BEFORE UPDATE ON public.inbox_sort_containers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
