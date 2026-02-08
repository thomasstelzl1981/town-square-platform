-- ============================================
-- ARMSTRONG GOVERNANCE SUITE - Phase 6
-- Tables, Views, RPC for Zone 1 Admin Console
-- ============================================

-- 1. ACTION OVERRIDES
-- Allows platform_admin to override action status globally or per-org
CREATE TABLE armstrong_action_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_code TEXT NOT NULL,
  scope_type TEXT NOT NULL CHECK (scope_type IN ('global', 'org')) DEFAULT 'global',
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  status_override TEXT NOT NULL CHECK (status_override IN ('active', 'restricted', 'disabled')),
  restricted_reason TEXT,
  disabled_until TIMESTAMPTZ,
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_override_scope UNIQUE (action_code, scope_type, org_id)
);

ALTER TABLE armstrong_action_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admin full access on overrides"
  ON armstrong_action_overrides FOR ALL
  USING (is_platform_admin());

CREATE POLICY "Authenticated read overrides"
  ON armstrong_action_overrides FOR SELECT
  USING (auth.role() = 'authenticated');

-- Trigger for updated_at
CREATE TRIGGER update_armstrong_action_overrides_updated_at
  BEFORE UPDATE ON armstrong_action_overrides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 2. POLICIES
-- Versioned policies for system prompts, guardrails, security rules
CREATE TABLE armstrong_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_code TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('system_prompt', 'guardrail', 'security')),
  title_de TEXT NOT NULL,
  content TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0.0',
  status TEXT NOT NULL CHECK (status IN ('draft', 'active', 'deprecated')) DEFAULT 'draft',
  created_by UUID REFERENCES profiles(id),
  approved_by UUID REFERENCES profiles(id),
  approved_at TIMESTAMPTZ,
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE armstrong_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admin manages policies"
  ON armstrong_policies FOR ALL
  USING (is_platform_admin());

CREATE POLICY "Authenticated read active policies"
  ON armstrong_policies FOR SELECT
  USING (status = 'active' AND auth.role() = 'authenticated');

CREATE TRIGGER update_armstrong_policies_updated_at
  BEFORE UPDATE ON armstrong_policies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 3. KNOWLEDGE ITEMS
-- Curated knowledge base for German real estate domain
CREATE TABLE armstrong_knowledge_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_code TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'system', 'real_estate', 'tax_legal', 'finance', 'sales', 'templates', 'research'
  )),
  subcategory TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN (
    'article', 'playbook', 'checklist', 'script', 'faq', 'research_memo'
  )),
  title_de TEXT NOT NULL,
  summary_de TEXT,
  content TEXT NOT NULL,
  sources JSONB DEFAULT '[]',
  confidence TEXT CHECK (confidence IN ('verified', 'high', 'medium', 'low')) DEFAULT 'medium',
  valid_until TIMESTAMPTZ,
  scope TEXT NOT NULL CHECK (scope IN ('global', 'tenant')) DEFAULT 'global',
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('draft', 'review', 'published', 'deprecated')) DEFAULT 'draft',
  created_by UUID REFERENCES profiles(id),
  reviewed_by UUID REFERENCES profiles(id),
  published_at TIMESTAMPTZ,
  version TEXT DEFAULT '1.0.0',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_knowledge_items_category ON armstrong_knowledge_items(category);
CREATE INDEX idx_knowledge_items_status ON armstrong_knowledge_items(status);
CREATE INDEX idx_knowledge_items_org ON armstrong_knowledge_items(org_id) WHERE org_id IS NOT NULL;

ALTER TABLE armstrong_knowledge_items ENABLE ROW LEVEL SECURITY;

-- Global published: everyone can read
CREATE POLICY "Read published global knowledge"
  ON armstrong_knowledge_items FOR SELECT
  USING (scope = 'global' AND status = 'published');

-- Review items: platform_admin only
CREATE POLICY "Platform admin sees review items"
  ON armstrong_knowledge_items FOR SELECT
  USING (status = 'review' AND is_platform_admin());

-- Platform admin: full access
CREATE POLICY "Platform admin full access on knowledge"
  ON armstrong_knowledge_items FOR ALL
  USING (is_platform_admin());

-- Tenant-scoped: org_admin can manage
CREATE POLICY "Org admin manages tenant knowledge"
  ON armstrong_knowledge_items FOR ALL
  USING (
    scope = 'tenant' 
    AND org_id IN (
      SELECT tenant_id FROM memberships 
      WHERE user_id = auth.uid() AND role = 'org_admin'
    )
  )
  WITH CHECK (
    scope = 'tenant'
    AND org_id IN (
      SELECT tenant_id FROM memberships 
      WHERE user_id = auth.uid() AND role = 'org_admin'
    )
  );

CREATE TRIGGER update_armstrong_knowledge_items_updated_at
  BEFORE UPDATE ON armstrong_knowledge_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 4. ACTION RUNS (Audit Log)
-- Server-only writes for tamper-proof logging
CREATE TABLE armstrong_action_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_code TEXT NOT NULL,
  zone TEXT NOT NULL CHECK (zone IN ('Z1', 'Z2', 'Z3')),
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id TEXT,
  correlation_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  
  -- Redacted context (whitelist-based)
  input_context JSONB DEFAULT '{}',
  output_result JSONB DEFAULT '{}',
  error_message TEXT,
  
  -- Metrics
  tokens_used INT DEFAULT 0,
  cost_cents INT DEFAULT 0,
  duration_ms INT DEFAULT 0,
  
  -- PII/Retention metadata
  payload_hash TEXT,
  payload_size_bytes INT,
  pii_present BOOLEAN DEFAULT false,
  retention_days INT DEFAULT 90,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_action_runs_org ON armstrong_action_runs(org_id);
CREATE INDEX idx_action_runs_created ON armstrong_action_runs(created_at DESC);
CREATE INDEX idx_action_runs_action ON armstrong_action_runs(action_code);
CREATE INDEX idx_action_runs_status ON armstrong_action_runs(status);

ALTER TABLE armstrong_action_runs ENABLE ROW LEVEL SECURITY;

-- NO INSERT policy for regular users! Server-only writes via service_role
CREATE POLICY "Platform admin reads all action runs"
  ON armstrong_action_runs FOR SELECT
  USING (is_platform_admin());

CREATE POLICY "Org admin reads own tenant runs"
  ON armstrong_action_runs FOR SELECT
  USING (
    org_id IN (
      SELECT tenant_id FROM memberships 
      WHERE user_id = auth.uid() AND role = 'org_admin'
    )
  );

-- 5. BILLING EVENTS
-- Cost tracking per action run
CREATE TABLE armstrong_billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_run_id UUID REFERENCES armstrong_action_runs(id) ON DELETE CASCADE,
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL NOT NULL,
  action_code TEXT NOT NULL,
  cost_model TEXT NOT NULL CHECK (cost_model IN ('free', 'metered', 'premium')),
  cost_cents INT DEFAULT 0,
  credits_charged INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_billing_org_month ON armstrong_billing_events(org_id, created_at);
CREATE INDEX idx_billing_action ON armstrong_billing_events(action_code);

ALTER TABLE armstrong_billing_events ENABLE ROW LEVEL SECURITY;

-- Server-only writes, platform_admin reads
CREATE POLICY "Platform admin reads billing"
  ON armstrong_billing_events FOR SELECT
  USING (is_platform_admin());

CREATE POLICY "Org admin reads own billing"
  ON armstrong_billing_events FOR SELECT
  USING (
    org_id IN (
      SELECT tenant_id FROM memberships 
      WHERE user_id = auth.uid() AND role = 'org_admin'
    )
  );

-- 6. VIEWS FOR KPIs

-- Daily cost aggregation
CREATE OR REPLACE VIEW v_armstrong_costs_daily AS
SELECT 
  action_code,
  DATE(created_at) as date,
  org_id,
  COUNT(*) as run_count,
  SUM(cost_cents) as total_cost_cents,
  SUM(tokens_used) as total_tokens,
  AVG(duration_ms)::INT as avg_duration_ms,
  COUNT(*) FILTER (WHERE status = 'failed') as failure_count
FROM armstrong_action_runs
GROUP BY action_code, DATE(created_at), org_id;

-- Dashboard KPIs
CREATE OR REPLACE VIEW v_armstrong_dashboard_kpis AS
SELECT
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as actions_24h,
  COALESCE(SUM(cost_cents) FILTER (WHERE created_at > NOW() - INTERVAL '30 days'), 0) as costs_30d_cents,
  COALESCE(
    (COUNT(*) FILTER (WHERE status = 'failed' AND created_at > NOW() - INTERVAL '7 days')::FLOAT / 
     NULLIF(COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days'), 0) * 100)::DECIMAL(5,2),
    0
  ) as error_rate_7d,
  COALESCE(AVG(duration_ms) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours')::INT, 0) as avg_response_ms_24h,
  (SELECT COUNT(*) FROM armstrong_knowledge_items WHERE status = 'published') as knowledge_items_count,
  (SELECT COUNT(*) FROM armstrong_policies WHERE status = 'active') as active_policies_count
FROM armstrong_action_runs;

-- 7. SERVER-SIDE LOGGING RPC
-- SECURITY DEFINER ensures only server can write to action_runs
CREATE OR REPLACE FUNCTION rpc_armstrong_log_action_run(
  p_action_code TEXT,
  p_zone TEXT,
  p_org_id UUID,
  p_user_id UUID,
  p_session_id TEXT,
  p_correlation_id TEXT,
  p_status TEXT,
  p_input_context JSONB DEFAULT '{}',
  p_output_result JSONB DEFAULT '{}',
  p_error_message TEXT DEFAULT NULL,
  p_tokens_used INT DEFAULT 0,
  p_cost_cents INT DEFAULT 0,
  p_duration_ms INT DEFAULT 0,
  p_pii_present BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_run_id UUID;
  v_cost_model TEXT;
BEGIN
  -- Insert action run
  INSERT INTO armstrong_action_runs (
    action_code, zone, org_id, user_id, session_id, correlation_id,
    status, input_context, output_result, error_message,
    tokens_used, cost_cents, duration_ms, pii_present
  ) VALUES (
    p_action_code, p_zone, p_org_id, p_user_id, p_session_id, p_correlation_id,
    p_status, p_input_context, p_output_result, p_error_message,
    p_tokens_used, p_cost_cents, p_duration_ms, p_pii_present
  ) RETURNING id INTO v_run_id;
  
  -- Determine cost_model based on cost
  v_cost_model := CASE 
    WHEN p_cost_cents > 100 THEN 'premium'
    WHEN p_cost_cents > 0 THEN 'metered'
    ELSE 'free'
  END;
  
  -- Insert billing event if org_id exists
  IF p_org_id IS NOT NULL THEN
    INSERT INTO armstrong_billing_events (
      action_run_id, org_id, action_code, cost_model, cost_cents, credits_charged
    ) VALUES (
      v_run_id, p_org_id, p_action_code, v_cost_model, p_cost_cents, CEIL(p_cost_cents / 10.0)::INT
    );
  END IF;
  
  RETURN v_run_id;
END;
$$;