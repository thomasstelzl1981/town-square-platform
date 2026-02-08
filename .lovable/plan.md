
# Phase 6 — Armstrong Zone 1 Governance Suite
## Fortsetzung der Implementierung (Phasen 6.1–6.5)

---

## Aktueller Stand (abgeschlossen)

| Phase | Status | Dateien |
|-------|--------|---------|
| 6.0 Schema | Fertig | `src/types/armstrong.ts`, `src/manifests/armstrongManifest.ts` |
| 6.2 Constitution | Fertig | `docs/architecture/ARMSTRONG_CONSTITUTION.md` |
| 6.3 KB Taxonomy | Fertig | `src/constants/armstrongKBTaxonomy.ts` |
| UI Fix | Fertig | `ActionCard.tsx`, `ArmstrongActions.tsx` (execution_mode) |

---

## Verbleibende Aufgaben

### Phase 6.1: Action Overrides Layer

**DB-Migration:** `armstrong_action_overrides`

```sql
CREATE TABLE armstrong_action_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_code TEXT NOT NULL,
  scope_type TEXT NOT NULL CHECK (scope_type IN ('global', 'org')) DEFAULT 'global',
  org_id UUID REFERENCES organizations(id),
  status_override TEXT NOT NULL CHECK (status_override IN ('active', 'restricted', 'disabled')),
  restricted_reason TEXT,
  disabled_until TIMESTAMPTZ,
  updated_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  CONSTRAINT unique_override_scope UNIQUE (action_code, scope_type, org_id)
);

-- RLS: Nur platform_admin darf schreiben
ALTER TABLE armstrong_action_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admin full access"
  ON armstrong_action_overrides FOR ALL
  USING (is_platform_admin());

CREATE POLICY "Authenticated read active"
  ON armstrong_action_overrides FOR SELECT
  USING (auth.role() = 'authenticated');
```

**Hook:** `src/hooks/useArmstrongActions.ts`
- Liest Manifest + Overrides aus DB
- Berechnet `effective_status` (global override > org override > manifest status)

**UI Update:** `ArmstrongActions.tsx`
- Zeigt Override-Badge wenn aktiv
- Admin kann Overrides setzen (platform_admin only)

---

### Phase 6.2: Policies DB Integration

**DB-Migration:** `armstrong_policies`

```sql
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
```

**UI Update:** `ArmstrongPolicies.tsx`
- Tab "Constitution" zeigt Markdown read-only (aus Repo oder API-Endpoint)
- Tabs "System-Prompts", "Guardrails", "Security" laden aus DB
- Approval-Flow sichtbar (draft → active)

---

### Phase 6.3: Knowledge Base DB Integration

**DB-Migration:** `armstrong_knowledge_items`

```sql
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
  org_id UUID REFERENCES organizations(id),
  status TEXT NOT NULL CHECK (status IN ('draft', 'review', 'published', 'deprecated')) DEFAULT 'draft',
  created_by UUID REFERENCES profiles(id),
  reviewed_by UUID REFERENCES profiles(id),
  published_at TIMESTAMPTZ,
  version TEXT DEFAULT '1.0.0',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE armstrong_knowledge_items ENABLE ROW LEVEL SECURITY;

-- Global published: alle lesen
CREATE POLICY "Read published global items"
  ON armstrong_knowledge_items FOR SELECT
  USING (scope = 'global' AND status = 'published');

-- Review items: nur platform_admin
CREATE POLICY "Platform admin sees review items"
  ON armstrong_knowledge_items FOR SELECT
  USING (status = 'review' AND is_platform_admin());

-- Platform admin: full access
CREATE POLICY "Platform admin full access"
  ON armstrong_knowledge_items FOR ALL
  USING (is_platform_admin());

-- Tenant-scoped: org_admin kann schreiben
CREATE POLICY "Org admin manages tenant items"
  ON armstrong_knowledge_items FOR ALL
  USING (
    scope = 'tenant' 
    AND org_id IN (
      SELECT om.org_id FROM org_memberships om 
      WHERE om.user_id = auth.uid() AND om.role = 'org_admin'
    )
  )
  WITH CHECK (
    scope = 'tenant'
    AND org_id IN (
      SELECT om.org_id FROM org_memberships om 
      WHERE om.user_id = auth.uid() AND om.role = 'org_admin'
    )
  );
```

**UI Update:** `ArmstrongKnowledge.tsx`
- 7 Kategorien aus `armstrongKBTaxonomy.ts` + Counts aus DB
- Suche + Filter + Status-Badges
- Review-Tab für status='review' Items
- Markdown-Detail-Ansicht

---

### Phase 6.4: Research Memo Workflow

**Manifest Action:** `ARM.KB.CREATE_RESEARCH_MEMO` bereits hinzugefügt

**UI Updates:**
- Review-Tab in Knowledge UI
- Publish/Reject Buttons
- Reviewer-Kommentar + reviewed_by/published_at

**KB Research Agent Konzept dokumentieren:**
- In Constitution ergänzen: Rolle `knowledge_curator_agent`
- Darf: Drafts erstellen via RPC
- Darf nicht: publishen, Policies ändern

---

### Phase 6.5: Logs & Billing DB Integration

**DB-Migration:** `armstrong_action_runs`

```sql
CREATE TABLE armstrong_action_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_code TEXT NOT NULL,
  zone TEXT NOT NULL CHECK (zone IN ('Z2', 'Z3')),
  org_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES profiles(id),
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

ALTER TABLE armstrong_action_runs ENABLE ROW LEVEL SECURITY;

-- KEIN INSERT Policy für normale User! Server-only writes via service_role
CREATE POLICY "Platform admin reads all"
  ON armstrong_action_runs FOR SELECT
  USING (is_platform_admin());

CREATE POLICY "Org admin reads own tenant"
  ON armstrong_action_runs FOR SELECT
  USING (
    org_id IN (
      SELECT om.org_id FROM org_memberships om 
      WHERE om.user_id = auth.uid() AND om.role = 'org_admin'
    )
  );
```

**DB-Migration:** `armstrong_billing_events`

```sql
CREATE TABLE armstrong_billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_run_id UUID REFERENCES armstrong_action_runs(id),
  org_id UUID REFERENCES organizations(id) NOT NULL,
  action_code TEXT NOT NULL,
  cost_model TEXT NOT NULL CHECK (cost_model IN ('free', 'metered', 'premium')),
  cost_cents INT DEFAULT 0,
  credits_charged INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_billing_org_month ON armstrong_billing_events(org_id, created_at);

ALTER TABLE armstrong_billing_events ENABLE ROW LEVEL SECURITY;

-- Server-only writes, platform_admin reads
CREATE POLICY "Platform admin reads billing"
  ON armstrong_billing_events FOR SELECT
  USING (is_platform_admin());
```

**Views für KPIs:**

```sql
CREATE VIEW v_armstrong_costs_daily AS
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

CREATE VIEW v_armstrong_dashboard_kpis AS
SELECT
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as actions_24h,
  SUM(cost_cents) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as costs_30d_cents,
  (COUNT(*) FILTER (WHERE status = 'failed' AND created_at > NOW() - INTERVAL '7 days')::FLOAT / 
   NULLIF(COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days'), 0) * 100)::DECIMAL(5,2) as error_rate_7d,
  AVG(duration_ms) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours')::INT as avg_response_ms_24h
FROM armstrong_action_runs;
```

**Server-Side Logging RPC:**

```sql
CREATE OR REPLACE FUNCTION rpc_armstrong_log_action_run(
  p_action_code TEXT,
  p_zone TEXT,
  p_org_id UUID,
  p_user_id UUID,
  p_session_id TEXT,
  p_correlation_id TEXT,
  p_status TEXT,
  p_input_context JSONB,
  p_output_result JSONB,
  p_error_message TEXT,
  p_tokens_used INT,
  p_cost_cents INT,
  p_duration_ms INT,
  p_pii_present BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
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
  
  -- Determine cost_model (simplified)
  v_cost_model := CASE 
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
```

**UI Updates:**

1. `ArmstrongLogs.tsx`: Mock-Daten durch Query ersetzen
2. `ArmstrongBilling.tsx`: Rollup-Views nutzen
3. `ArmstrongDashboard.tsx`: KPI-Query aus `v_armstrong_dashboard_kpis`

---

## Implementierungsreihenfolge

```text
1. DB-Migrationen erstellen (alle 5 Tabellen + Views + RPC)
   ├── armstrong_action_overrides
   ├── armstrong_policies
   ├── armstrong_knowledge_items
   ├── armstrong_action_runs
   ├── armstrong_billing_events
   ├── v_armstrong_costs_daily
   ├── v_armstrong_dashboard_kpis
   └── rpc_armstrong_log_action_run

2. UI-Integration Phase 6.1-6.2
   ├── useArmstrongActions.ts Hook
   ├── ArmstrongActions.tsx (Overrides anzeigen)
   └── ArmstrongPolicies.tsx (DB-Integration + Constitution Tab)

3. UI-Integration Phase 6.3-6.4
   ├── ArmstrongKnowledge.tsx (7 Kategorien + Review Tab)
   └── Research Memo Workflow

4. UI-Integration Phase 6.5
   ├── ArmstrongLogs.tsx (echte Daten)
   ├── ArmstrongBilling.tsx (Rollups)
   └── ArmstrongDashboard.tsx (KPI Views)
```

---

## Dateien die erstellt/geändert werden

| Datei | Aktion |
|-------|--------|
| `supabase/migrations/xxx_armstrong_governance.sql` | NEU (alle Tabellen + Views + RPC) |
| `src/hooks/useArmstrongActions.ts` | NEU |
| `src/hooks/useArmstrongPolicies.ts` | NEU |
| `src/hooks/useArmstrongKnowledge.ts` | NEU |
| `src/hooks/useArmstrongLogs.ts` | NEU |
| `src/hooks/useArmstrongDashboard.ts` | NEU |
| `src/pages/admin/armstrong/ArmstrongActions.tsx` | ERWEITERT (Overrides) |
| `src/pages/admin/armstrong/ArmstrongPolicies.tsx` | KOMPLETT ÜBERARBEITET |
| `src/pages/admin/armstrong/ArmstrongKnowledge.tsx` | KOMPLETT ÜBERARBEITET |
| `src/pages/admin/armstrong/ArmstrongLogs.tsx` | ERWEITERT (DB statt Mock) |
| `src/pages/admin/armstrong/ArmstrongBilling.tsx` | ERWEITERT (DB statt Mock) |
| `src/pages/admin/armstrong/ArmstrongDashboard.tsx` | ERWEITERT (DB statt Mock) |

---

## Zeitschätzung

| Phase | Tasks | Geschätzt |
|-------|-------|-----------|
| DB-Migrationen | 5 Tabellen + Views + RPC | 1 Durchgang |
| Phase 6.1 | Overrides Hook + UI | 1 Durchgang |
| Phase 6.2 | Policies UI + Constitution | 1 Durchgang |
| Phase 6.3-6.4 | KB + Research Memos | 1 Durchgang |
| Phase 6.5 | Logs + Billing + Dashboard | 1 Durchgang |

**Gesamt: 5 Durchgänge für vollständige Implementierung**

---

## Risiken & Mitigation

| Risiko | Mitigation |
|--------|------------|
| RLS zu restriktiv | Views als Fallback für aggregierte Daten |
| Server-only writes | RPC mit SECURITY DEFINER |
| Constitution Sync | Fetch von Repo oder statischer Import |
| Performance bei Logs | Indexes + Pagination + Retention Policy |
