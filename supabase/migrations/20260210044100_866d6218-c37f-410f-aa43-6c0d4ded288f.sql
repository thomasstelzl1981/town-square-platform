
-- RECHERCHEMODUL: All tables + RLS + IPFI + Indexes

-- 1. research_sessions
CREATE TABLE public.research_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  mode text NOT NULL CHECK (mode IN ('free','pro_contacts')),
  query_text text NOT NULL,
  query_json jsonb DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.research_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own tenant research sessions" ON public.research_sessions FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can insert own tenant research sessions" ON public.research_sessions FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id() AND created_by = auth.uid());
CREATE INDEX idx_research_sessions_tenant ON public.research_sessions(tenant_id);

-- 2. research_results
CREATE TABLE public.research_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.research_sessions(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title text,
  summary_md text,
  sources_json jsonb DEFAULT '[]',
  entities_json jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.research_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own tenant research results" ON public.research_results FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can insert own tenant research results" ON public.research_results FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id());
CREATE INDEX idx_research_results_session ON public.research_results(session_id);

-- 3. contact_candidates
CREATE TABLE public.contact_candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.research_sessions(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  full_name text,
  first_name text,
  last_name text,
  role text,
  company text,
  domain text,
  location text,
  email text,
  phone text,
  source_json jsonb DEFAULT '{}',
  confidence numeric(3,2) DEFAULT 0,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewed','imported','rejected')),
  imported_contact_id uuid REFERENCES public.contacts(id),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.contact_candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own tenant contact candidates" ON public.contact_candidates FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can insert own tenant contact candidates" ON public.contact_candidates FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users can update own tenant contact candidates" ON public.contact_candidates FOR UPDATE USING (tenant_id = public.get_user_tenant_id());
CREATE INDEX idx_contact_candidates_session ON public.contact_candidates(session_id);
CREATE INDEX idx_contact_candidates_tenant ON public.contact_candidates(tenant_id);

-- 4. credit_ledger
CREATE TABLE public.credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  kind text NOT NULL,
  amount integer NOT NULL,
  ref_type text,
  ref_id uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own tenant credit ledger" ON public.credit_ledger FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE INDEX idx_credit_ledger_tenant ON public.credit_ledger(tenant_id);

-- 5. IPFI Integration
INSERT INTO public.integration_registry (code, name, type, status, description)
VALUES ('IPFI', 'IPFI Recherche', 'integration', 'pending_setup', 'Auxiliary research provider');
