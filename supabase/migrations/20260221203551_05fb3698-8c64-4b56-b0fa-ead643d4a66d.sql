
-- =============================================
-- MOD-21: KI-Browser — 5 Tabellen + RLS + Indexes + Realtime
-- =============================================

-- 1. ki_browser_policies (ZUERST, da FK-Ziel)
CREATE TABLE public.ki_browser_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  json_rules JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ki_browser_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view policies"
  ON public.ki_browser_policies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Platform admins can insert policies"
  ON public.ki_browser_policies FOR INSERT
  TO authenticated
  WITH CHECK (public.is_platform_admin());

CREATE POLICY "Platform admins can update policies"
  ON public.ki_browser_policies FOR UPDATE
  TO authenticated
  USING (public.is_platform_admin());

CREATE POLICY "Platform admins can delete policies"
  ON public.ki_browser_policies FOR DELETE
  TO authenticated
  USING (public.is_platform_admin());

-- 2. ki_browser_domain_rules
CREATE TABLE public.ki_browser_domain_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES public.ki_browser_policies(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL,
  pattern TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ki_browser_domain_rules_policy ON public.ki_browser_domain_rules (policy_id);

ALTER TABLE public.ki_browser_domain_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view domain rules"
  ON public.ki_browser_domain_rules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Platform admins can insert domain rules"
  ON public.ki_browser_domain_rules FOR INSERT
  TO authenticated
  WITH CHECK (public.is_platform_admin());

CREATE POLICY "Platform admins can update domain rules"
  ON public.ki_browser_domain_rules FOR UPDATE
  TO authenticated
  USING (public.is_platform_admin());

CREATE POLICY "Platform admins can delete domain rules"
  ON public.ki_browser_domain_rules FOR DELETE
  TO authenticated
  USING (public.is_platform_admin());

-- 3. ki_browser_sessions
CREATE TABLE public.ki_browser_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  user_id UUID NOT NULL,
  policy_profile_id UUID REFERENCES public.ki_browser_policies(id),
  purpose TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  step_count INTEGER NOT NULL DEFAULT 0,
  max_steps INTEGER NOT NULL DEFAULT 50,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ki_browser_sessions_tenant ON public.ki_browser_sessions (tenant_id);
CREATE INDEX idx_ki_browser_sessions_tenant_created ON public.ki_browser_sessions (tenant_id, created_at);
CREATE INDEX idx_ki_browser_sessions_tenant_status ON public.ki_browser_sessions (tenant_id, status);
CREATE INDEX idx_ki_browser_sessions_user ON public.ki_browser_sessions (user_id);
CREATE INDEX idx_ki_browser_sessions_policy ON public.ki_browser_sessions (policy_profile_id);

ALTER TABLE public.ki_browser_sessions ENABLE ROW LEVEL SECURITY;

-- Permissive: tenant users
CREATE POLICY "Tenant users can view own sessions"
  ON public.ki_browser_sessions FOR SELECT
  TO authenticated
  USING (tenant_id = (SELECT public.get_user_tenant_id()) OR public.is_platform_admin());

CREATE POLICY "Tenant users can create sessions"
  ON public.ki_browser_sessions FOR INSERT
  TO authenticated
  WITH CHECK (tenant_id = (SELECT public.get_user_tenant_id()) OR public.is_platform_admin());

CREATE POLICY "Tenant users can update own sessions"
  ON public.ki_browser_sessions FOR UPDATE
  TO authenticated
  USING (tenant_id = (SELECT public.get_user_tenant_id()) OR public.is_platform_admin());

CREATE POLICY "Tenant users can delete own sessions"
  ON public.ki_browser_sessions FOR DELETE
  TO authenticated
  USING (tenant_id = (SELECT public.get_user_tenant_id()) OR public.is_platform_admin());

-- Double Safety Belt: Restrictive tenant isolation
CREATE POLICY "tenant_isolation_restrictive"
  ON public.ki_browser_sessions
  AS RESTRICTIVE
  FOR ALL
  TO authenticated
  USING (tenant_id = (SELECT public.get_user_tenant_id()) OR public.is_platform_admin());

-- 4. ki_browser_steps
CREATE TABLE public.ki_browser_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.ki_browser_sessions(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  kind TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'proposed',
  risk_level TEXT NOT NULL DEFAULT 'confirm_needed',
  payload_json JSONB DEFAULT '{}',
  result_json JSONB,
  rationale TEXT,
  proposed_by TEXT DEFAULT 'armstrong',
  approved_by UUID,
  blocked_reason TEXT,
  url_before TEXT,
  url_after TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ki_browser_steps_session ON public.ki_browser_steps (session_id);
CREATE INDEX idx_ki_browser_steps_session_number ON public.ki_browser_steps (session_id, step_number);

ALTER TABLE public.ki_browser_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view steps via session"
  ON public.ki_browser_steps FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ki_browser_sessions s
      WHERE s.id = session_id
      AND (s.tenant_id = (SELECT public.get_user_tenant_id()) OR public.is_platform_admin())
    )
  );

CREATE POLICY "Tenant users can insert steps via session"
  ON public.ki_browser_steps FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ki_browser_sessions s
      WHERE s.id = session_id
      AND (s.tenant_id = (SELECT public.get_user_tenant_id()) OR public.is_platform_admin())
    )
  );

CREATE POLICY "Tenant users can update steps via session"
  ON public.ki_browser_steps FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ki_browser_sessions s
      WHERE s.id = session_id
      AND (s.tenant_id = (SELECT public.get_user_tenant_id()) OR public.is_platform_admin())
    )
  );

CREATE POLICY "Tenant users can delete steps via session"
  ON public.ki_browser_steps FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ki_browser_sessions s
      WHERE s.id = session_id
      AND (s.tenant_id = (SELECT public.get_user_tenant_id()) OR public.is_platform_admin())
    )
  );

-- 5. ki_browser_artifacts
CREATE TABLE public.ki_browser_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.ki_browser_sessions(id) ON DELETE CASCADE,
  step_id UUID REFERENCES public.ki_browser_steps(id),
  artifact_type TEXT NOT NULL,
  storage_ref TEXT,
  content_hash TEXT,
  meta_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ki_browser_artifacts_session ON public.ki_browser_artifacts (session_id);
CREATE INDEX idx_ki_browser_artifacts_session_type ON public.ki_browser_artifacts (session_id, artifact_type);
CREATE INDEX idx_ki_browser_artifacts_step ON public.ki_browser_artifacts (step_id);

ALTER TABLE public.ki_browser_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant users can view artifacts via session"
  ON public.ki_browser_artifacts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ki_browser_sessions s
      WHERE s.id = session_id
      AND (s.tenant_id = (SELECT public.get_user_tenant_id()) OR public.is_platform_admin())
    )
  );

CREATE POLICY "Tenant users can insert artifacts via session"
  ON public.ki_browser_artifacts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ki_browser_sessions s
      WHERE s.id = session_id
      AND (s.tenant_id = (SELECT public.get_user_tenant_id()) OR public.is_platform_admin())
    )
  );

CREATE POLICY "Tenant users can update artifacts via session"
  ON public.ki_browser_artifacts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ki_browser_sessions s
      WHERE s.id = session_id
      AND (s.tenant_id = (SELECT public.get_user_tenant_id()) OR public.is_platform_admin())
    )
  );

CREATE POLICY "Tenant users can delete artifacts via session"
  ON public.ki_browser_artifacts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.ki_browser_sessions s
      WHERE s.id = session_id
      AND (s.tenant_id = (SELECT public.get_user_tenant_id()) OR public.is_platform_admin())
    )
  );

-- updated_at trigger for sessions
CREATE TRIGGER update_ki_browser_sessions_updated_at
  BEFORE UPDATE ON public.ki_browser_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- updated_at trigger for policies
CREATE TRIGGER update_ki_browser_policies_updated_at
  BEFORE UPDATE ON public.ki_browser_policies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.ki_browser_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ki_browser_steps;
