
-- Phase 3: RESTRICTIVE Policies für Tabellen mit org_id/manager_tenant_id statt tenant_id

-- future_room_cases: Isolation über manager_tenant_id
CREATE POLICY "tenant_isolation_restrictive" ON public.future_room_cases
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (manager_tenant_id = public.get_user_tenant_id() OR public.is_platform_admin(auth.uid()));

-- armstrong_action_runs: Isolation über org_id  
CREATE POLICY "tenant_isolation_restrictive" ON public.armstrong_action_runs
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (org_id = public.get_user_tenant_id() OR public.is_platform_admin(auth.uid()));

-- armstrong_billing_events: Isolation über org_id
CREATE POLICY "tenant_isolation_restrictive" ON public.armstrong_billing_events
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (org_id = public.get_user_tenant_id() OR public.is_platform_admin(auth.uid()));

-- armstrong_action_overrides: Isolation über org_id (nullable - globale Overrides erlaubt)
CREATE POLICY "tenant_isolation_restrictive" ON public.armstrong_action_overrides
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (org_id IS NULL OR org_id = public.get_user_tenant_id() OR public.is_platform_admin(auth.uid()));

-- mail_campaigns: Isolation über org_id
CREATE POLICY "tenant_isolation_restrictive" ON public.mail_campaigns
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (org_id = public.get_user_tenant_id() OR public.is_platform_admin(auth.uid()));

-- org_policies: Isolation über org_id
CREATE POLICY "tenant_isolation_restrictive" ON public.org_policies
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (org_id = public.get_user_tenant_id() OR public.is_platform_admin(auth.uid()));

-- widget_preferences: Isolation über user_id (user kann nur eigene sehen)
CREATE POLICY "tenant_isolation_restrictive" ON public.widget_preferences
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_platform_admin(auth.uid()));

-- user_outbound_identities: Isolation über user_id
CREATE POLICY "tenant_isolation_restrictive" ON public.user_outbound_identities
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_platform_admin(auth.uid()));

-- commpro_phone_assistants: Isolation über user_id
CREATE POLICY "tenant_isolation_restrictive" ON public.commpro_phone_assistants
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_platform_admin(auth.uid()));

-- commpro_phone_call_sessions: Isolation über user_id
CREATE POLICY "tenant_isolation_restrictive" ON public.commpro_phone_call_sessions
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (user_id = auth.uid() OR public.is_platform_admin(auth.uid()));
