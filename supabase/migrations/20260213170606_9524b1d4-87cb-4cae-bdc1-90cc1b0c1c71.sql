
-- ============================================================
-- MOD-14 Recherche Redesign v1.0
-- 3 neue Tabellen: research_orders, research_order_results, research_billing_log
-- ============================================================

-- 1) research_orders
CREATE TABLE public.research_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.organizations(id),
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  title text,
  intent_text text NOT NULL DEFAULT '',
  icp_json jsonb NOT NULL DEFAULT '{}',
  output_type text NOT NULL DEFAULT 'contacts',
  provider_plan_json jsonb NOT NULL DEFAULT '{}',
  max_results int NOT NULL DEFAULT 25,
  cost_estimate numeric NOT NULL DEFAULT 0,
  cost_cap numeric NOT NULL DEFAULT 0,
  cost_spent numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  results_count int NOT NULL DEFAULT 0,
  consent_confirmed boolean NOT NULL DEFAULT false,
  ai_summary_md text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2) research_order_results
CREATE TABLE public.research_order_results (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.research_orders(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.organizations(id),
  entity_type text NOT NULL DEFAULT 'person',
  full_name text,
  first_name text,
  last_name text,
  role text,
  seniority text,
  company_name text,
  domain text,
  location text,
  email text,
  phone text,
  linkedin_url text,
  source_provider text NOT NULL DEFAULT 'manual',
  source_refs_json jsonb NOT NULL DEFAULT '{}',
  confidence_score int NOT NULL DEFAULT 0,
  raw_json jsonb,
  status text NOT NULL DEFAULT 'candidate',
  imported_contact_id uuid REFERENCES public.contacts(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3) research_billing_log
CREATE TABLE public.research_billing_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.research_orders(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.organizations(id),
  provider text NOT NULL,
  units int NOT NULL DEFAULT 1,
  cost numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_research_orders_tenant ON public.research_orders(tenant_id);
CREATE INDEX idx_research_orders_status ON public.research_orders(status);
CREATE INDEX idx_research_order_results_order ON public.research_order_results(order_id);
CREATE INDEX idx_research_order_results_tenant ON public.research_order_results(tenant_id);
CREATE INDEX idx_research_billing_log_order ON public.research_billing_log(order_id);

-- updated_at trigger
CREATE TRIGGER update_research_orders_updated_at
  BEFORE UPDATE ON public.research_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.research_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_order_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.research_billing_log ENABLE ROW LEVEL SECURITY;

-- research_orders policies (using get_user_tenant_id pattern)
CREATE POLICY "research_orders_select" ON public.research_orders
  FOR SELECT USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "research_orders_insert" ON public.research_orders
  FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id() AND created_by = auth.uid());

CREATE POLICY "research_orders_update" ON public.research_orders
  FOR UPDATE USING (tenant_id = public.get_user_tenant_id());

-- research_order_results policies
CREATE POLICY "research_order_results_select" ON public.research_order_results
  FOR SELECT USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "research_order_results_insert" ON public.research_order_results
  FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "research_order_results_update" ON public.research_order_results
  FOR UPDATE USING (tenant_id = public.get_user_tenant_id());

-- research_billing_log policies (read-only for users)
CREATE POLICY "research_billing_log_select" ON public.research_billing_log
  FOR SELECT USING (tenant_id = public.get_user_tenant_id());

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.research_orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.research_order_results;
