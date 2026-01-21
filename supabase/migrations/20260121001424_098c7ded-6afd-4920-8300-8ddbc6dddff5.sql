-- ============================================================================
-- PHASE 1.2.x: CHILD PRIVACY LOCKDOWN (PARENT ACCESS CONTROL)
-- ============================================================================

-- S1: Add parent_access_blocked column to organizations
ALTER TABLE public.organizations
ADD COLUMN parent_access_blocked BOOLEAN NOT NULL DEFAULT FALSE;

-- S2: Create audit_events table
CREATE TABLE public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID NOT NULL,
  target_org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for audit_events
CREATE INDEX idx_audit_events_target_org ON public.audit_events(target_org_id, created_at DESC);
CREATE INDEX idx_audit_events_actor ON public.audit_events(actor_user_id, created_at DESC);
CREATE INDEX idx_audit_events_type ON public.audit_events(event_type, created_at DESC);

-- Enable RLS on audit_events
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- Audit events policies: platform_admin sees all, org members see their org's events
CREATE POLICY audit_select_platform_admin ON public.audit_events
  FOR SELECT USING (public.is_platform_admin());

CREATE POLICY audit_select_org_member ON public.audit_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.tenant_id = audit_events.target_org_id
    )
  );

-- INSERT: Authenticated users can insert audit events for their own actions
CREATE POLICY audit_insert_authenticated ON public.audit_events
  FOR INSERT WITH CHECK (
    actor_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.tenant_id = audit_events.target_org_id
    )
  );

-- platform_admin can insert any audit event
CREATE POLICY audit_insert_platform_admin ON public.audit_events
  FOR INSERT WITH CHECK (public.is_platform_admin());

-- No UPDATE or DELETE on audit_events (immutable)

-- ============================================================================
-- RLS POLICY UPDATES: ADD LOCKDOWN CHECKS
-- ============================================================================

-- Helper function to check if target org has lockdown enabled and user is accessing via parent
-- Returns TRUE if access should be BLOCKED (lockdown is active and user is parent-derived)
-- Returns FALSE if access is OK (no lockdown, or user is direct member, or platform_admin)
CREATE OR REPLACE FUNCTION public.is_parent_access_blocked(target_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT parent_access_blocked FROM public.organizations WHERE id = target_org_id),
    FALSE
  )
$$;

-- ============================================================================
-- ORGANIZATIONS POLICIES UPDATE
-- ============================================================================

-- Drop and recreate org_select_member to include lockdown check
DROP POLICY IF EXISTS org_select_member ON public.organizations;

CREATE POLICY org_select_member ON public.organizations
  FOR SELECT USING (
    -- Direct membership (always allowed regardless of lockdown)
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.tenant_id = organizations.id
    )
    OR
    -- Delegation-based access (blocked if lockdown enabled)
    (
      NOT organizations.parent_access_blocked
      AND EXISTS (
        SELECT 1 
        FROM public.memberships m
        JOIN public.org_delegations d ON d.delegate_org_id = m.tenant_id
        WHERE m.user_id = auth.uid()
          AND d.target_org_id = organizations.id
          AND d.status = 'active'
          AND (d.expires_at IS NULL OR d.expires_at > now())
      )
    )
    OR
    -- Parent hierarchy access (blocked if lockdown enabled)
    (
      NOT organizations.parent_access_blocked
      AND EXISTS (
        SELECT 1 FROM public.memberships m
        JOIN public.organizations parent_org ON m.tenant_id = parent_org.id
        WHERE m.user_id = auth.uid()
          AND m.role = 'org_admin'
          AND organizations.materialized_path LIKE parent_org.materialized_path || '%'
          AND organizations.id != parent_org.id
      )
    )
  );

-- Add org_update_org_admin policy for org admins to update their own org (including lockdown toggle)
CREATE POLICY org_update_org_admin ON public.organizations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.tenant_id = organizations.id
        AND m.role = 'org_admin'
    )
  );

-- ============================================================================
-- MEMBERSHIPS POLICIES UPDATE
-- ============================================================================

-- org_admin: can only manage memberships in orgs where NOT blocked (if accessing via parent)
DROP POLICY IF EXISTS membership_select_org_admin ON public.memberships;
CREATE POLICY membership_select_org_admin ON public.memberships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.tenant_id = memberships.tenant_id
        AND m.role = 'org_admin'
    )
    OR
    -- Parent-derived access (blocked if child has lockdown)
    (
      EXISTS (
        SELECT 1 
        FROM public.memberships m
        JOIN public.organizations my_org ON m.tenant_id = my_org.id
        JOIN public.organizations target_org ON target_org.id = memberships.tenant_id
        WHERE m.user_id = auth.uid()
          AND m.role = 'org_admin'
          AND target_org.materialized_path LIKE my_org.materialized_path || '%'
          AND target_org.id != my_org.id
          AND NOT target_org.parent_access_blocked
      )
    )
  );

DROP POLICY IF EXISTS membership_insert_org_admin ON public.memberships;
CREATE POLICY membership_insert_org_admin ON public.memberships
  FOR INSERT WITH CHECK (
    role <> 'platform_admin'
    AND (
      -- Direct membership in same org
      EXISTS (
        SELECT 1 FROM public.memberships m
        WHERE m.user_id = auth.uid()
          AND m.tenant_id = memberships.tenant_id
          AND m.role = 'org_admin'
      )
      OR
      -- Parent-derived (blocked if child has lockdown)
      EXISTS (
        SELECT 1 
        FROM public.memberships m
        JOIN public.organizations my_org ON m.tenant_id = my_org.id
        JOIN public.organizations target_org ON target_org.id = memberships.tenant_id
        WHERE m.user_id = auth.uid()
          AND m.role = 'org_admin'
          AND target_org.materialized_path LIKE my_org.materialized_path || '%'
          AND target_org.id != my_org.id
          AND NOT target_org.parent_access_blocked
      )
    )
  );

DROP POLICY IF EXISTS membership_update_org_admin ON public.memberships;
CREATE POLICY membership_update_org_admin ON public.memberships
  FOR UPDATE USING (
    role <> 'platform_admin'
    AND (
      EXISTS (
        SELECT 1 FROM public.memberships m
        WHERE m.user_id = auth.uid()
          AND m.tenant_id = memberships.tenant_id
          AND m.role = 'org_admin'
      )
      OR
      EXISTS (
        SELECT 1 
        FROM public.memberships m
        JOIN public.organizations my_org ON m.tenant_id = my_org.id
        JOIN public.organizations target_org ON target_org.id = memberships.tenant_id
        WHERE m.user_id = auth.uid()
          AND m.role = 'org_admin'
          AND target_org.materialized_path LIKE my_org.materialized_path || '%'
          AND target_org.id != my_org.id
          AND NOT target_org.parent_access_blocked
      )
    )
  );

DROP POLICY IF EXISTS membership_delete_org_admin ON public.memberships;
CREATE POLICY membership_delete_org_admin ON public.memberships
  FOR DELETE USING (
    role <> 'platform_admin'
    AND (
      EXISTS (
        SELECT 1 FROM public.memberships m
        WHERE m.user_id = auth.uid()
          AND m.tenant_id = memberships.tenant_id
          AND m.role = 'org_admin'
      )
      OR
      EXISTS (
        SELECT 1 
        FROM public.memberships m
        JOIN public.organizations my_org ON m.tenant_id = my_org.id
        JOIN public.organizations target_org ON target_org.id = memberships.tenant_id
        WHERE m.user_id = auth.uid()
          AND m.role = 'org_admin'
          AND target_org.materialized_path LIKE my_org.materialized_path || '%'
          AND target_org.id != my_org.id
          AND NOT target_org.parent_access_blocked
      )
    )
  );

-- ============================================================================
-- ORG_DELEGATIONS POLICIES UPDATE
-- ============================================================================

DROP POLICY IF EXISTS delegation_select_member ON public.org_delegations;
CREATE POLICY delegation_select_member ON public.org_delegations
  FOR SELECT USING (
    -- Direct member of delegate or target org
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.tenant_id IN (org_delegations.delegate_org_id, org_delegations.target_org_id)
    )
    OR
    -- Parent-derived access to target org (blocked if target has lockdown)
    (
      EXISTS (
        SELECT 1 
        FROM public.memberships m
        JOIN public.organizations my_org ON m.tenant_id = my_org.id
        JOIN public.organizations target_org ON target_org.id = org_delegations.target_org_id
        WHERE m.user_id = auth.uid()
          AND m.role = 'org_admin'
          AND target_org.materialized_path LIKE my_org.materialized_path || '%'
          AND target_org.id != my_org.id
          AND NOT target_org.parent_access_blocked
      )
    )
  );

DROP POLICY IF EXISTS delegation_update_target_admin ON public.org_delegations;
CREATE POLICY delegation_update_target_admin ON public.org_delegations
  FOR UPDATE USING (
    -- Direct admin of target org
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.tenant_id = org_delegations.target_org_id
        AND m.role = 'org_admin'
    )
    OR
    -- Parent-derived admin (blocked if target has lockdown)
    (
      EXISTS (
        SELECT 1 
        FROM public.memberships m
        JOIN public.organizations my_org ON m.tenant_id = my_org.id
        JOIN public.organizations target_org ON target_org.id = org_delegations.target_org_id
        WHERE m.user_id = auth.uid()
          AND m.role = 'org_admin'
          AND target_org.materialized_path LIKE my_org.materialized_path || '%'
          AND target_org.id != my_org.id
          AND NOT target_org.parent_access_blocked
      )
    )
  );

DROP POLICY IF EXISTS delegation_insert_target_admin ON public.org_delegations;
CREATE POLICY delegation_insert_target_admin ON public.org_delegations
  FOR INSERT WITH CHECK (
    granted_by = auth.uid()
    AND (
      -- Direct admin of target org
      EXISTS (
        SELECT 1 FROM public.memberships m
        WHERE m.user_id = auth.uid()
          AND m.tenant_id = org_delegations.target_org_id
          AND m.role = 'org_admin'
      )
      OR
      -- Parent-derived admin (blocked if target has lockdown)
      EXISTS (
        SELECT 1 
        FROM public.memberships m
        JOIN public.organizations my_org ON m.tenant_id = my_org.id
        JOIN public.organizations target_org ON target_org.id = org_delegations.target_org_id
        WHERE m.user_id = auth.uid()
          AND m.role = 'org_admin'
          AND target_org.materialized_path LIKE my_org.materialized_path || '%'
          AND target_org.id != my_org.id
          AND NOT target_org.parent_access_blocked
      )
    )
  );

-- ============================================================================
-- AUDIT TRIGGER FOR parent_access_blocked CHANGES
-- ============================================================================

CREATE OR REPLACE FUNCTION public.audit_parent_access_blocked_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF OLD.parent_access_blocked IS DISTINCT FROM NEW.parent_access_blocked THEN
    INSERT INTO public.audit_events (
      actor_user_id,
      target_org_id,
      event_type,
      payload
    ) VALUES (
      auth.uid(),
      NEW.id,
      'parent_access_blocked_changed',
      jsonb_build_object(
        'old_value', OLD.parent_access_blocked,
        'new_value', NEW.parent_access_blocked,
        'org_name', NEW.name
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_audit_parent_access_blocked
  AFTER UPDATE OF parent_access_blocked ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_parent_access_blocked_change();