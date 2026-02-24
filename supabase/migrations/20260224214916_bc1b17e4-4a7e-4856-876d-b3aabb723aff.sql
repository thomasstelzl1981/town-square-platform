
-- ============================================
-- Cross-Tenant Discovery for Pet Providers/Services
-- Split restrictive ALL policy into granular policies
-- allowing SELECT on published+active providers
-- ============================================

-- === pet_providers ===
DROP POLICY IF EXISTS tenant_isolation_restrictive ON pet_providers;

CREATE POLICY tenant_isolation_restrictive_write ON pet_providers
  AS RESTRICTIVE FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id() OR is_platform_admin(auth.uid()));

CREATE POLICY tenant_isolation_restrictive_update ON pet_providers
  AS RESTRICTIVE FOR UPDATE
  USING (tenant_id = get_user_tenant_id() OR is_platform_admin(auth.uid()));

CREATE POLICY tenant_isolation_restrictive_delete ON pet_providers
  AS RESTRICTIVE FOR DELETE
  USING (tenant_id = get_user_tenant_id() OR is_platform_admin(auth.uid()));

CREATE POLICY tenant_isolation_restrictive_select ON pet_providers
  AS RESTRICTIVE FOR SELECT
  USING (
    tenant_id = get_user_tenant_id()
    OR is_platform_admin(auth.uid())
    OR (is_published = true AND status = 'active')
  );

-- === pet_services ===
DROP POLICY IF EXISTS tenant_isolation_restrictive ON pet_services;

CREATE POLICY tenant_isolation_restrictive_write ON pet_services
  AS RESTRICTIVE FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id() OR is_platform_admin(auth.uid()));

CREATE POLICY tenant_isolation_restrictive_update ON pet_services
  AS RESTRICTIVE FOR UPDATE
  USING (tenant_id = get_user_tenant_id() OR is_platform_admin(auth.uid()));

CREATE POLICY tenant_isolation_restrictive_delete ON pet_services
  AS RESTRICTIVE FOR DELETE
  USING (tenant_id = get_user_tenant_id() OR is_platform_admin(auth.uid()));

CREATE POLICY tenant_isolation_restrictive_select ON pet_services
  AS RESTRICTIVE FOR SELECT
  USING (
    tenant_id = get_user_tenant_id()
    OR is_platform_admin(auth.uid())
    OR (is_active = true AND EXISTS (
      SELECT 1 FROM pet_providers pp
      WHERE pp.id = pet_services.provider_id
        AND pp.is_published = true
        AND pp.status = 'active'
    ))
  );
