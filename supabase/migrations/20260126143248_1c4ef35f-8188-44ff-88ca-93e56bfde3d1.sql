-- =============================================================================
-- Hotfix: Remove organizations self-joins in RLS policies to stop recursion
-- =============================================================================
-- Symptom (client): GET /organizations?id=eq.<uuid> → 500, code 42P17
-- Cause: organizations SELECT policy queries organizations again (self-join)
-- Fix: simplify org_admin/child-org logic to avoid querying organizations inside
--       organizations policies (and avoid org joins inside memberships policies).
-- =============================================================================

-- Ensure helper is callable for authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_memberships(uuid) TO authenticated;

-- -----------------------------------------------------------------------------
-- memberships: drop & recreate org_admin policies WITHOUT joins to organizations
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS membership_select_org_admin ON public.memberships;
CREATE POLICY membership_select_org_admin ON public.memberships
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.get_user_memberships(auth.uid()) um
      WHERE um.tenant_id = memberships.tenant_id
        AND um.role = 'org_admin'
    )
  );

DROP POLICY IF EXISTS membership_insert_org_admin ON public.memberships;
CREATE POLICY membership_insert_org_admin ON public.memberships
  FOR INSERT
  WITH CHECK (
    role <> 'platform_admin'
    AND EXISTS (
      SELECT 1
      FROM public.get_user_memberships(auth.uid()) um
      WHERE um.tenant_id = memberships.tenant_id
        AND um.role = 'org_admin'
    )
  );

DROP POLICY IF EXISTS membership_update_org_admin ON public.memberships;
CREATE POLICY membership_update_org_admin ON public.memberships
  FOR UPDATE
  USING (
    role <> 'platform_admin'
    AND EXISTS (
      SELECT 1
      FROM public.get_user_memberships(auth.uid()) um
      WHERE um.tenant_id = memberships.tenant_id
        AND um.role = 'org_admin'
    )
  );

DROP POLICY IF EXISTS membership_delete_org_admin ON public.memberships;
CREATE POLICY membership_delete_org_admin ON public.memberships
  FOR DELETE
  USING (
    role <> 'platform_admin'
    AND EXISTS (
      SELECT 1
      FROM public.get_user_memberships(auth.uid()) um
      WHERE um.tenant_id = memberships.tenant_id
        AND um.role = 'org_admin'
    )
  );

-- -----------------------------------------------------------------------------
-- organizations: drop & recreate member policy WITHOUT referencing organizations
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS org_select_member ON public.organizations;
CREATE POLICY org_select_member ON public.organizations
  FOR SELECT
  USING (
    -- Direct membership
    EXISTS (
      SELECT 1
      FROM public.get_user_memberships(auth.uid()) um
      WHERE um.tenant_id = organizations.id
    )
    -- Delegation
    OR (
      NOT organizations.parent_access_blocked
      AND EXISTS (
        SELECT 1
        FROM public.get_user_memberships(auth.uid()) um
        JOIN public.org_delegations d
          ON d.delegate_org_id = um.tenant_id
        WHERE d.target_org_id = organizations.id
          AND d.status = 'active'
          AND (d.expires_at IS NULL OR d.expires_at > now())
      )
    )
  );
