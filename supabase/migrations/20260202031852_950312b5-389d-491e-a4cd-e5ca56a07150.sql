-- ============================================================
-- PHASE 1: ORG/TENANT HIERARCHY SCHEMA (CORRECTED)
-- Uses correct membership_role enum values: org_admin, platform_admin
-- ============================================================

-- 1. ORG_LINKS: Partner/Client relationship tracking
CREATE TABLE IF NOT EXISTS public.org_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    to_org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    link_type TEXT NOT NULL CHECK (link_type IN ('manages', 'refers', 'collaborates', 'delegates_to')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'revoked')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    CONSTRAINT org_links_no_self_link CHECK (from_org_id <> to_org_id),
    CONSTRAINT org_links_unique_pair UNIQUE (from_org_id, to_org_id, link_type)
);

-- 2. ORG_POLICIES: Delegation rules and limits
CREATE TABLE IF NOT EXISTS public.org_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    policy_type TEXT NOT NULL CHECK (policy_type IN ('delegation', 'access', 'visibility', 'feature_gate')),
    policy_key TEXT NOT NULL,
    policy_value JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    CONSTRAINT org_policies_unique_key UNIQUE (org_id, policy_type, policy_key)
);

-- 3. Enable RLS
ALTER TABLE public.org_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_policies ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for org_links (using correct enum values)
CREATE POLICY "Users can view org_links for their organizations"
ON public.org_links FOR SELECT
USING (
    from_org_id IN (
        SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()
    ) OR to_org_id IN (
        SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage org_links for their organizations"
ON public.org_links FOR ALL
USING (
    from_org_id IN (
        SELECT tenant_id FROM public.memberships 
        WHERE user_id = auth.uid() AND role IN ('org_admin', 'platform_admin')
    )
);

-- 5. RLS Policies for org_policies
CREATE POLICY "Users can view policies for their organizations"
ON public.org_policies FOR SELECT
USING (
    org_id IN (
        SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()
    )
);

CREATE POLICY "Admins can manage policies for their organizations"
ON public.org_policies FOR ALL
USING (
    org_id IN (
        SELECT tenant_id FROM public.memberships 
        WHERE user_id = auth.uid() AND role IN ('org_admin', 'platform_admin')
    )
);

-- 6. Recursive scope function for RLS
CREATE OR REPLACE FUNCTION public.my_scope_org_ids(active_org_id UUID)
RETURNS UUID[] 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    result UUID[];
BEGIN
    WITH RECURSIVE descendants AS (
        SELECT id FROM organizations WHERE parent_id = active_org_id
        UNION ALL
        SELECT o.id FROM organizations o
        INNER JOIN descendants d ON o.parent_id = d.id
    )
    SELECT array_agg(id) INTO result FROM (
        SELECT active_org_id AS id
        UNION
        SELECT id FROM descendants
        UNION
        SELECT to_org_id AS id FROM org_links 
        WHERE from_org_id = active_org_id 
        AND link_type IN ('manages', 'delegates_to')
        AND status = 'active'
    ) all_orgs;
    
    RETURN COALESCE(result, ARRAY[active_org_id]);
END;
$$;

-- 7. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_org_links_from_org ON public.org_links(from_org_id);
CREATE INDEX IF NOT EXISTS idx_org_links_to_org ON public.org_links(to_org_id);
CREATE INDEX IF NOT EXISTS idx_org_links_type ON public.org_links(link_type);
CREATE INDEX IF NOT EXISTS idx_org_policies_org ON public.org_policies(org_id);
CREATE INDEX IF NOT EXISTS idx_org_policies_type ON public.org_policies(policy_type);

-- 8. Timestamp triggers
CREATE OR REPLACE TRIGGER update_org_links_updated_at
BEFORE UPDATE ON public.org_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER update_org_policies_updated_at
BEFORE UPDATE ON public.org_policies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();