-- ============================================================
-- PHASE 1.1 FOUNDATION — v1.2.0 FINAL
-- System of a Town
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE org_type AS ENUM ('internal', 'partner', 'sub_partner', 'client');
CREATE TYPE membership_role AS ENUM ('platform_admin', 'org_admin', 'internal_ops', 'sales_partner');
CREATE TYPE delegation_status AS ENUM ('active', 'revoked', 'expired');

-- ============================================================
-- TABLES
-- ============================================================

-- ORGANIZATIONS
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  org_type org_type NOT NULL,
  parent_id UUID REFERENCES public.organizations(id) ON DELETE RESTRICT,
  depth INTEGER NOT NULL DEFAULT 0,
  materialized_path TEXT NOT NULL DEFAULT '/',
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_materialized_path CHECK (
    materialized_path = '/' OR 
    materialized_path ~ '^/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/)+$'
  ),
  CONSTRAINT valid_depth CHECK (depth >= 0),
  CONSTRAINT root_has_no_parent CHECK (
    (parent_id IS NULL AND depth = 0) OR (parent_id IS NOT NULL AND depth > 0)
  )
);

CREATE INDEX idx_organizations_parent ON public.organizations(parent_id);
CREATE INDEX idx_organizations_org_type ON public.organizations(org_type);
CREATE INDEX idx_organizations_path ON public.organizations USING gist (materialized_path gist_trgm_ops);

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  active_tenant_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_active_tenant ON public.profiles(active_tenant_id);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- MEMBERSHIPS
CREATE TABLE public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role membership_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_tenant UNIQUE (user_id, tenant_id)
);

CREATE INDEX idx_memberships_user_tenant ON public.memberships(user_id, tenant_id);
CREATE INDEX idx_memberships_tenant_user ON public.memberships(tenant_id, user_id);
CREATE INDEX idx_memberships_role ON public.memberships(role);

-- ORG_DELEGATIONS
CREATE TABLE public.org_delegations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delegate_org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  target_org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  scopes JSONB NOT NULL DEFAULT '[]'::jsonb,
  status delegation_status NOT NULL DEFAULT 'active',
  granted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_by UUID REFERENCES auth.users(id) ON DELETE RESTRICT,
  revoked_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_self_delegation CHECK (delegate_org_id <> target_org_id),
  CONSTRAINT revocation_consistency CHECK (
    (status = 'revoked' AND revoked_by IS NOT NULL AND revoked_at IS NOT NULL) OR
    (status <> 'revoked')
  )
);

CREATE UNIQUE INDEX idx_delegations_active_unique 
  ON public.org_delegations(delegate_org_id, target_org_id) 
  WHERE status = 'active';
CREATE INDEX idx_delegations_target_status ON public.org_delegations(target_org_id, status);
CREATE INDEX idx_delegations_delegate ON public.org_delegations(delegate_org_id);
CREATE INDEX idx_delegations_scopes ON public.org_delegations USING gin(scopes);

-- ============================================================
-- HELPER FUNCTION: is_platform_admin (SECURITY INVOKER)
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.memberships
    WHERE user_id = auth.uid()
      AND role = 'platform_admin'
  )
$$;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Organizations: immutable hierarchy
CREATE OR REPLACE FUNCTION public.enforce_org_hierarchy_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF OLD.org_type IS DISTINCT FROM NEW.org_type THEN
    RAISE EXCEPTION 'org_type is immutable after creation';
  END IF;
  IF OLD.parent_id IS DISTINCT FROM NEW.parent_id THEN
    RAISE EXCEPTION 'parent_id is immutable after creation';
  END IF;
  IF OLD.depth IS DISTINCT FROM NEW.depth THEN
    RAISE EXCEPTION 'depth is immutable after creation';
  END IF;
  IF OLD.materialized_path IS DISTINCT FROM NEW.materialized_path THEN
    RAISE EXCEPTION 'materialized_path is immutable after creation';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_org_hierarchy_immutability
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_org_hierarchy_immutability();

-- Org_delegations: immutable identity + revocation logic
CREATE OR REPLACE FUNCTION public.enforce_delegation_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  -- Identity columns are always immutable
  IF OLD.delegate_org_id IS DISTINCT FROM NEW.delegate_org_id THEN
    RAISE EXCEPTION 'delegate_org_id is immutable';
  END IF;
  IF OLD.target_org_id IS DISTINCT FROM NEW.target_org_id THEN
    RAISE EXCEPTION 'target_org_id is immutable';
  END IF;
  IF OLD.granted_by IS DISTINCT FROM NEW.granted_by THEN
    RAISE EXCEPTION 'granted_by is immutable';
  END IF;
  IF OLD.granted_at IS DISTINCT FROM NEW.granted_at THEN
    RAISE EXCEPTION 'granted_at is immutable';
  END IF;
  IF OLD.created_at IS DISTINCT FROM NEW.created_at THEN
    RAISE EXCEPTION 'created_at is immutable';
  END IF;

  -- Cannot reactivate revoked/expired
  IF OLD.status IN ('revoked', 'expired') AND NEW.status = 'active' THEN
    RAISE EXCEPTION 'Cannot reactivate a revoked or expired delegation';
  END IF;

  -- On revocation: enforce revoked_by and auto-fill revoked_at
  IF OLD.status = 'active' AND NEW.status IN ('revoked', 'expired') THEN
    IF NEW.revoked_by IS NULL THEN
      RAISE EXCEPTION 'revoked_by must be set when revoking';
    END IF;
    IF NEW.revoked_at IS NULL THEN
      NEW.revoked_at := now();
    END IF;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_delegation_immutability
  BEFORE UPDATE ON public.org_delegations
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_delegation_immutability();

-- Profiles/Memberships: auto-update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER trg_memberships_updated_at
  BEFORE UPDATE ON public.memberships
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- ============================================================
-- RLS: ORGANIZATIONS
-- ============================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- platform_admin: full access
CREATE POLICY org_select_platform_admin ON public.organizations
  FOR SELECT USING (public.is_platform_admin());

CREATE POLICY org_insert_platform_admin ON public.organizations
  FOR INSERT WITH CHECK (public.is_platform_admin());

CREATE POLICY org_update_platform_admin ON public.organizations
  FOR UPDATE USING (public.is_platform_admin());

-- Regular users: see orgs they're members of + delegated orgs
CREATE POLICY org_select_member ON public.organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid() AND m.tenant_id = organizations.id
    )
    OR EXISTS (
      SELECT 1 FROM public.memberships m
      JOIN public.org_delegations d ON d.delegate_org_id = m.tenant_id
      WHERE m.user_id = auth.uid()
        AND d.target_org_id = organizations.id
        AND d.status = 'active'
        AND (d.expires_at IS NULL OR d.expires_at > now())
    )
  );

-- ============================================================
-- RLS: PROFILES
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- platform_admin: full access to all profiles
CREATE POLICY profile_select_platform_admin ON public.profiles
  FOR SELECT USING (public.is_platform_admin());

CREATE POLICY profile_update_platform_admin ON public.profiles
  FOR UPDATE USING (public.is_platform_admin());

-- Self-access
CREATE POLICY profile_select_self ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY profile_insert_self ON public.profiles
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY profile_update_self ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- ============================================================
-- RLS: MEMBERSHIPS
-- ============================================================

ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- platform_admin: unrestricted access (GOD MODE)
CREATE POLICY membership_select_platform_admin ON public.memberships
  FOR SELECT USING (public.is_platform_admin());

CREATE POLICY membership_insert_platform_admin ON public.memberships
  FOR INSERT WITH CHECK (public.is_platform_admin());

CREATE POLICY membership_update_platform_admin ON public.memberships
  FOR UPDATE USING (public.is_platform_admin());

CREATE POLICY membership_delete_platform_admin ON public.memberships
  FOR DELETE USING (public.is_platform_admin());

-- Users see their own memberships
CREATE POLICY membership_select_self ON public.memberships
  FOR SELECT USING (user_id = auth.uid());

-- org_admin: manage memberships in their tenant (EXCEPT platform_admin)
CREATE POLICY membership_select_org_admin ON public.memberships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.tenant_id = memberships.tenant_id
        AND m.role = 'org_admin'
    )
  );

CREATE POLICY membership_insert_org_admin ON public.memberships
  FOR INSERT WITH CHECK (
    memberships.role <> 'platform_admin'
    AND EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.tenant_id = memberships.tenant_id
        AND m.role = 'org_admin'
    )
  );

CREATE POLICY membership_update_org_admin ON public.memberships
  FOR UPDATE USING (
    memberships.role <> 'platform_admin'
    AND EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.tenant_id = memberships.tenant_id
        AND m.role = 'org_admin'
    )
  );

CREATE POLICY membership_delete_org_admin ON public.memberships
  FOR DELETE USING (
    memberships.role <> 'platform_admin'
    AND EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.tenant_id = memberships.tenant_id
        AND m.role = 'org_admin'
    )
  );

-- ============================================================
-- RLS: ORG_DELEGATIONS
-- ============================================================

ALTER TABLE public.org_delegations ENABLE ROW LEVEL SECURITY;

-- platform_admin: full access
CREATE POLICY delegation_select_platform_admin ON public.org_delegations
  FOR SELECT USING (public.is_platform_admin());

CREATE POLICY delegation_insert_platform_admin ON public.org_delegations
  FOR INSERT WITH CHECK (public.is_platform_admin());

CREATE POLICY delegation_update_platform_admin ON public.org_delegations
  FOR UPDATE USING (public.is_platform_admin());

-- Members of involved orgs can view
CREATE POLICY delegation_select_member ON public.org_delegations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.tenant_id IN (org_delegations.delegate_org_id, org_delegations.target_org_id)
    )
  );

-- org_admin of target org can create delegations
CREATE POLICY delegation_insert_target_admin ON public.org_delegations
  FOR INSERT WITH CHECK (
    org_delegations.granted_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.tenant_id = org_delegations.target_org_id
        AND m.role = 'org_admin'
    )
  );

-- org_admin of target org can revoke (update status)
CREATE POLICY delegation_update_target_admin ON public.org_delegations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid()
        AND m.tenant_id = org_delegations.target_org_id
        AND m.role = 'org_admin'
    )
  );

-- NO DELETE POLICY (immutable history)

-- ============================================================
-- END PHASE 1.1 FOUNDATION v1.2.0
-- ============================================================