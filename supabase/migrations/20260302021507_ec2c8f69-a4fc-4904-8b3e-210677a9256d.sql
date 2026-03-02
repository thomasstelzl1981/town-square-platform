-- Phase 1 / B-001: Add PERMISSIVE CRUD policies for 3 tenancy tables
-- These tables currently only have RESTRICTIVE policies (which block all access without a matching PERMISSIVE policy)

-- tenancy_deadlines: PERMISSIVE CRUD
CREATE POLICY "Users can view their org deadlines"
  ON public.tenancy_deadlines FOR SELECT
  USING (tenant_id IN (SELECT m.tenant_id FROM memberships m WHERE m.user_id = auth.uid()));

CREATE POLICY "Users can create deadlines for their org"
  ON public.tenancy_deadlines FOR INSERT
  WITH CHECK (tenant_id IN (SELECT m.tenant_id FROM memberships m WHERE m.user_id = auth.uid()));

CREATE POLICY "Users can update their org deadlines"
  ON public.tenancy_deadlines FOR UPDATE
  USING (tenant_id IN (SELECT m.tenant_id FROM memberships m WHERE m.user_id = auth.uid()));

CREATE POLICY "Users can delete their org deadlines"
  ON public.tenancy_deadlines FOR DELETE
  USING (tenant_id IN (SELECT m.tenant_id FROM memberships m WHERE m.user_id = auth.uid()));

-- tenancy_payment_plans: PERMISSIVE CRUD
CREATE POLICY "Users can view their org payment plans"
  ON public.tenancy_payment_plans FOR SELECT
  USING (tenant_id IN (SELECT m.tenant_id FROM memberships m WHERE m.user_id = auth.uid()));

CREATE POLICY "Users can create payment plans for their org"
  ON public.tenancy_payment_plans FOR INSERT
  WITH CHECK (tenant_id IN (SELECT m.tenant_id FROM memberships m WHERE m.user_id = auth.uid()));

CREATE POLICY "Users can update their org payment plans"
  ON public.tenancy_payment_plans FOR UPDATE
  USING (tenant_id IN (SELECT m.tenant_id FROM memberships m WHERE m.user_id = auth.uid()));

CREATE POLICY "Users can delete their org payment plans"
  ON public.tenancy_payment_plans FOR DELETE
  USING (tenant_id IN (SELECT m.tenant_id FROM memberships m WHERE m.user_id = auth.uid()));

-- tenancy_rent_reductions: PERMISSIVE CRUD
CREATE POLICY "Users can view their org rent reductions"
  ON public.tenancy_rent_reductions FOR SELECT
  USING (tenant_id IN (SELECT m.tenant_id FROM memberships m WHERE m.user_id = auth.uid()));

CREATE POLICY "Users can create rent reductions for their org"
  ON public.tenancy_rent_reductions FOR INSERT
  WITH CHECK (tenant_id IN (SELECT m.tenant_id FROM memberships m WHERE m.user_id = auth.uid()));

CREATE POLICY "Users can update their org rent reductions"
  ON public.tenancy_rent_reductions FOR UPDATE
  USING (tenant_id IN (SELECT m.tenant_id FROM memberships m WHERE m.user_id = auth.uid()));

CREATE POLICY "Users can delete their org rent reductions"
  ON public.tenancy_rent_reductions FOR DELETE
  USING (tenant_id IN (SELECT m.tenant_id FROM memberships m WHERE m.user_id = auth.uid()));
