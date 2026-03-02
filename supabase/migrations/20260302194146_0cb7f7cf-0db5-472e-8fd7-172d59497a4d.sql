-- B2: Add RESTRICTIVE tenant isolation policies on 4 SLC tables
-- Ensures tenant_id is always enforced even if permissive policies combine

CREATE POLICY "tenant_isolation_restrictive" ON public.sales_cases
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id() OR is_platform_admin(auth.uid()))
  WITH CHECK (tenant_id = get_user_tenant_id() OR is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.sales_lifecycle_events
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id() OR is_platform_admin(auth.uid()))
  WITH CHECK (tenant_id = get_user_tenant_id() OR is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.sales_reservations
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id() OR is_platform_admin(auth.uid()))
  WITH CHECK (tenant_id = get_user_tenant_id() OR is_platform_admin(auth.uid()));

CREATE POLICY "tenant_isolation_restrictive" ON public.sales_settlements
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id() OR is_platform_admin(auth.uid()))
  WITH CHECK (tenant_id = get_user_tenant_id() OR is_platform_admin(auth.uid()));