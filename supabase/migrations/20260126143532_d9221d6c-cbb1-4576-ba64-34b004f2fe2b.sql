-- =============================================================================
-- Fix: Stop infinite recursion on organizations SELECT (remove delegation join)
-- =============================================================================
-- Root cause:
--   organizations.org_select_member joins org_delegations
--   org_delegations RLS joins organizations -> recursion
-- Minimal unblock:
--   org_select_member only checks direct membership (self membership rows)
-- =============================================================================

DROP POLICY IF EXISTS org_select_member ON public.organizations;

CREATE POLICY org_select_member ON public.organizations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.tenant_id = organizations.id
    )
  );
