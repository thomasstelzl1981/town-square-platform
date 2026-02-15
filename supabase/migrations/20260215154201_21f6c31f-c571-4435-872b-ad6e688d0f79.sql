-- ERA-004: Add service-role-only policy to rate_limit_counters
CREATE POLICY "service_role_only" ON public.rate_limit_counters
  FOR ALL USING (auth.role() = 'service_role');