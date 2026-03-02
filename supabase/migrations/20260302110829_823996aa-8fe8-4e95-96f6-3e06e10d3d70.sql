
-- ============================================================
-- PHASE 1: SECURITY HARDENING — Fix overly permissive RLS policies
-- ============================================================

-- 1. brand_articles: Restrict write access to platform admins only
DROP POLICY IF EXISTS "Authenticated users can insert articles" ON public.brand_articles;
DROP POLICY IF EXISTS "Authenticated users can update articles" ON public.brand_articles;
DROP POLICY IF EXISTS "Authenticated users can delete articles" ON public.brand_articles;

CREATE POLICY "Admins can insert articles"
ON public.brand_articles FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'platform_admin'));

CREATE POLICY "Admins can update articles"
ON public.brand_articles FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'));

CREATE POLICY "Admins can delete articles"
ON public.brand_articles FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'));

-- 2. property_expenses: Add tenant_id isolation
DROP POLICY IF EXISTS "property_expenses_update" ON public.property_expenses;
DROP POLICY IF EXISTS "property_expenses_delete" ON public.property_expenses;

CREATE POLICY "property_expenses_update_tenant"
ON public.property_expenses FOR UPDATE TO authenticated
USING (tenant_id IN (
  SELECT m.tenant_id FROM public.memberships m WHERE m.user_id = auth.uid()
));

CREATE POLICY "property_expenses_delete_tenant"
ON public.property_expenses FOR DELETE TO authenticated
USING (tenant_id IN (
  SELECT m.tenant_id FROM public.memberships m WHERE m.user_id = auth.uid()
));

-- 3. zone3_website_settings: Restrict to platform admins only
DROP POLICY IF EXISTS "zone3_ws_insert_auth" ON public.zone3_website_settings;
DROP POLICY IF EXISTS "zone3_ws_update_auth" ON public.zone3_website_settings;

CREATE POLICY "zone3_ws_insert_admin"
ON public.zone3_website_settings FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'platform_admin'));

CREATE POLICY "zone3_ws_update_admin"
ON public.zone3_website_settings FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'));

-- 4. armstrong_inbound_tasks: Fix role from public to service_role
DROP POLICY IF EXISTS "Service role can insert armstrong tasks" ON public.armstrong_inbound_tasks;
DROP POLICY IF EXISTS "Service role can update armstrong tasks" ON public.armstrong_inbound_tasks;

CREATE POLICY "Service role can insert armstrong tasks"
ON public.armstrong_inbound_tasks FOR INSERT TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update armstrong tasks"
ON public.armstrong_inbound_tasks FOR UPDATE TO service_role
USING (true);
