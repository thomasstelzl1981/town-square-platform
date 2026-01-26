-- =============================================================================
-- Fix: RLS Infinite Recursion on memberships/organizations
-- =============================================================================
-- Problem: RLS policies on memberships query memberships → infinite recursion
-- Solution: SECURITY DEFINER function to bypass RLS when checking memberships
-- =============================================================================

-- 1. Create SECURITY DEFINER helper function (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_user_memberships(p_user_id uuid)
RETURNS TABLE(tenant_id uuid, role membership_role)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT m.tenant_id, m.role
  FROM public.memberships m
  WHERE m.user_id = p_user_id
$$;

-- 2. Update is_platform_admin() to use the new function
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.get_user_memberships(auth.uid())
    WHERE role = 'platform_admin'
  )
$$;

-- 3. Drop and recreate memberships SELECT policies
DROP POLICY IF EXISTS membership_select_org_admin ON memberships;
DROP POLICY IF EXISTS membership_select_platform_admin ON memberships;

CREATE POLICY membership_select_org_admin ON memberships
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.get_user_memberships(auth.uid()) um
      WHERE um.tenant_id = memberships.tenant_id
        AND um.role = 'org_admin'
    )
    OR EXISTS (
      SELECT 1 
      FROM public.get_user_memberships(auth.uid()) um
      JOIN organizations my_org ON um.tenant_id = my_org.id
      JOIN organizations target_org ON target_org.id = memberships.tenant_id
      WHERE um.role = 'org_admin'
        AND target_org.materialized_path LIKE my_org.materialized_path || '%'
        AND target_org.id <> my_org.id
        AND NOT target_org.parent_access_blocked
    )
  );

CREATE POLICY membership_select_platform_admin ON memberships
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.get_user_memberships(auth.uid())
      WHERE role = 'platform_admin'
    )
  );

-- 4. Drop and recreate organizations SELECT policies
DROP POLICY IF EXISTS org_select_member ON organizations;
DROP POLICY IF EXISTS org_select_platform_admin ON organizations;

CREATE POLICY org_select_member ON organizations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.get_user_memberships(auth.uid()) um
      WHERE um.tenant_id = organizations.id
    )
    OR (
      NOT parent_access_blocked
      AND EXISTS (
        SELECT 1 
        FROM public.get_user_memberships(auth.uid()) um
        JOIN org_delegations d ON d.delegate_org_id = um.tenant_id
        WHERE d.target_org_id = organizations.id
          AND d.status = 'active'
          AND (d.expires_at IS NULL OR d.expires_at > now())
      )
    )
    OR (
      NOT parent_access_blocked
      AND EXISTS (
        SELECT 1 
        FROM public.get_user_memberships(auth.uid()) um
        JOIN organizations parent_org ON um.tenant_id = parent_org.id
        WHERE um.role = 'org_admin'
          AND organizations.materialized_path LIKE parent_org.materialized_path || '%'
          AND organizations.id <> parent_org.id
      )
    )
  );

CREATE POLICY org_select_platform_admin ON organizations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.get_user_memberships(auth.uid())
      WHERE role = 'platform_admin'
    )
  );

-- 5. Drop and recreate memberships INSERT policies
DROP POLICY IF EXISTS membership_insert_org_admin ON memberships;
DROP POLICY IF EXISTS membership_insert_platform_admin ON memberships;

CREATE POLICY membership_insert_org_admin ON memberships
  FOR INSERT
  WITH CHECK (
    role <> 'platform_admin'
    AND (
      EXISTS (
        SELECT 1 FROM public.get_user_memberships(auth.uid()) um
        WHERE um.tenant_id = memberships.tenant_id
          AND um.role = 'org_admin'
      )
      OR EXISTS (
        SELECT 1 
        FROM public.get_user_memberships(auth.uid()) um
        JOIN organizations my_org ON um.tenant_id = my_org.id
        JOIN organizations target_org ON target_org.id = memberships.tenant_id
        WHERE um.role = 'org_admin'
          AND target_org.materialized_path LIKE my_org.materialized_path || '%'
          AND target_org.id <> my_org.id
          AND NOT target_org.parent_access_blocked
      )
    )
  );

CREATE POLICY membership_insert_platform_admin ON memberships
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.get_user_memberships(auth.uid())
      WHERE role = 'platform_admin'
    )
  );

-- 6. Drop and recreate memberships UPDATE policies
DROP POLICY IF EXISTS membership_update_org_admin ON memberships;
DROP POLICY IF EXISTS membership_update_platform_admin ON memberships;

CREATE POLICY membership_update_org_admin ON memberships
  FOR UPDATE
  USING (
    role <> 'platform_admin'
    AND (
      EXISTS (
        SELECT 1 FROM public.get_user_memberships(auth.uid()) um
        WHERE um.tenant_id = memberships.tenant_id
          AND um.role = 'org_admin'
      )
      OR EXISTS (
        SELECT 1 
        FROM public.get_user_memberships(auth.uid()) um
        JOIN organizations my_org ON um.tenant_id = my_org.id
        JOIN organizations target_org ON target_org.id = memberships.tenant_id
        WHERE um.role = 'org_admin'
          AND target_org.materialized_path LIKE my_org.materialized_path || '%'
          AND target_org.id <> my_org.id
          AND NOT target_org.parent_access_blocked
      )
    )
  );

CREATE POLICY membership_update_platform_admin ON memberships
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.get_user_memberships(auth.uid())
      WHERE role = 'platform_admin'
    )
  );

-- 7. Drop and recreate memberships DELETE policies
DROP POLICY IF EXISTS membership_delete_org_admin ON memberships;
DROP POLICY IF EXISTS membership_delete_platform_admin ON memberships;

CREATE POLICY membership_delete_org_admin ON memberships
  FOR DELETE
  USING (
    role <> 'platform_admin'
    AND (
      EXISTS (
        SELECT 1 FROM public.get_user_memberships(auth.uid()) um
        WHERE um.tenant_id = memberships.tenant_id
          AND um.role = 'org_admin'
      )
      OR EXISTS (
        SELECT 1 
        FROM public.get_user_memberships(auth.uid()) um
        JOIN organizations my_org ON um.tenant_id = my_org.id
        JOIN organizations target_org ON target_org.id = memberships.tenant_id
        WHERE um.role = 'org_admin'
          AND target_org.materialized_path LIKE my_org.materialized_path || '%'
          AND target_org.id <> my_org.id
          AND NOT target_org.parent_access_blocked
      )
    )
  );

CREATE POLICY membership_delete_platform_admin ON memberships
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.get_user_memberships(auth.uid())
      WHERE role = 'platform_admin'
    )
  );