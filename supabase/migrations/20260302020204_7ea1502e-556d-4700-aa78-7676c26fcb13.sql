
-- FIX: Remove overly permissive "true" policies on tenancy tables
-- These policies allow ANY authenticated user full access, bypassing tenant isolation

DROP POLICY IF EXISTS "crud_deadlines" ON public.tenancy_deadlines;
DROP POLICY IF EXISTS "crud_payment_plans" ON public.tenancy_payment_plans;
DROP POLICY IF EXISTS "crud_rent_reductions" ON public.tenancy_rent_reductions;
