-- Fix overly permissive RLS policy on pet_z3_sessions
-- The tenant_isolation_restrictive policy already limits to own tenant,
-- but the permissive policy should also be scoped properly instead of USING (true)

DROP POLICY IF EXISTS "authenticated_full_access" ON public.pet_z3_sessions;

-- Replace with tenant-scoped permissive policy
CREATE POLICY "authenticated_tenant_access" ON public.pet_z3_sessions
  FOR ALL
  TO authenticated
  USING (tenant_id = get_user_tenant_id())
  WITH CHECK (tenant_id = get_user_tenant_id());