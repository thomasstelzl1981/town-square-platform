
-- Phase 2: pet_z3_sessions — tenant_id + Policies (Tabelle ist jetzt leer)

ALTER TABLE public.pet_z3_sessions ADD COLUMN tenant_id uuid NOT NULL REFERENCES public.organizations(id);

CREATE POLICY "tenant_isolation_restrictive" ON public.pet_z3_sessions
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (tenant_id = public.get_user_tenant_id() OR public.is_platform_admin(auth.uid()));

CREATE POLICY "anon_can_read_own_session" ON public.pet_z3_sessions
  FOR SELECT TO anon
  USING (expires_at > now());

CREATE POLICY "authenticated_full_access" ON public.pet_z3_sessions
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
