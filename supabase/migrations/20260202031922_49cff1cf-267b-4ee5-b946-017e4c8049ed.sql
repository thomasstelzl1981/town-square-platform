-- ============================================================
-- PHASE 2: CASE/EVENT TABLES FOR CAMUNDA READINESS
-- Workflow cases + event log for future Camunda integration
-- ============================================================

-- 1. CASES: Workflow instances (Camunda process instances)
CREATE TABLE IF NOT EXISTS public.cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    
    -- Case identification
    case_type TEXT NOT NULL, -- e.g., 'sanierung', 'finanzierung', 'verkauf', 'vermietung'
    case_code TEXT, -- Human-readable: FIN-2026-001, SAL-2026-042
    public_id TEXT UNIQUE DEFAULT 'CASE-' || substring(gen_random_uuid()::text, 1, 8),
    
    -- Camunda correlation
    correlation_key TEXT, -- Format: {entityType}_{entityId}_{timestamp}
    process_definition_key TEXT, -- BPMN process ID
    process_instance_id TEXT, -- Zeebe process instance ID (filled when started)
    
    -- Entity references (polymorphic)
    entity_type TEXT, -- 'property', 'finance_request', 'listing', etc.
    entity_id UUID,
    
    -- State
    status TEXT NOT NULL DEFAULT 'created' CHECK (status IN (
        'created', 'pending', 'active', 'waiting', 'completed', 'cancelled', 'error'
    )),
    current_step TEXT, -- Current BPMN task/activity ID
    
    -- Ownership
    assigned_to UUID REFERENCES auth.users(id),
    created_by UUID REFERENCES auth.users(id),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    priority INTEGER DEFAULT 0,
    due_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. CASE_EVENTS: Event log for case lifecycle
CREATE TABLE IF NOT EXISTS public.case_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    
    -- Event details
    event_type TEXT NOT NULL, -- 'created', 'started', 'task_completed', 'error', 'cancelled', etc.
    event_source TEXT NOT NULL DEFAULT 'ui', -- 'ui', 'camunda', 'api', 'system'
    
    -- BPMN correlation
    task_id TEXT, -- BPMN task ID if applicable
    task_name TEXT,
    
    -- Actor
    actor_user_id UUID REFERENCES auth.users(id),
    actor_type TEXT DEFAULT 'user', -- 'user', 'system', 'camunda_worker'
    
    -- Payload
    payload JSONB DEFAULT '{}',
    previous_status TEXT,
    new_status TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_events ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for cases
CREATE POLICY "Users can view cases for their organizations"
ON public.cases FOR SELECT
USING (
    tenant_id IN (
        SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can create cases for their organizations"
ON public.cases FOR INSERT
WITH CHECK (
    tenant_id IN (
        SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Assigned users and admins can update cases"
ON public.cases FOR UPDATE
USING (
    assigned_to = auth.uid() OR
    tenant_id IN (
        SELECT tenant_id FROM public.memberships 
        WHERE user_id = auth.uid() AND role IN ('org_admin', 'platform_admin')
    )
);

-- 5. RLS Policies for case_events
CREATE POLICY "Users can view events for their organizations"
ON public.case_events FOR SELECT
USING (
    tenant_id IN (
        SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Users can create events for their cases"
ON public.case_events FOR INSERT
WITH CHECK (
    tenant_id IN (
        SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()
    )
);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_cases_tenant ON public.cases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON public.cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_type ON public.cases(case_type);
CREATE INDEX IF NOT EXISTS idx_cases_correlation ON public.cases(correlation_key);
CREATE INDEX IF NOT EXISTS idx_cases_entity ON public.cases(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_cases_assigned ON public.cases(assigned_to);
CREATE INDEX IF NOT EXISTS idx_case_events_case ON public.case_events(case_id);
CREATE INDEX IF NOT EXISTS idx_case_events_tenant ON public.case_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_case_events_type ON public.case_events(event_type);

-- 7. Timestamp trigger
CREATE OR REPLACE TRIGGER update_cases_updated_at
BEFORE UPDATE ON public.cases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Helper function to generate correlation keys
CREATE OR REPLACE FUNCTION public.generate_correlation_key(
    p_entity_type TEXT,
    p_entity_id UUID
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    RETURN p_entity_type || '_' || p_entity_id::text || '_' || extract(epoch from now())::bigint::text;
END;
$$;