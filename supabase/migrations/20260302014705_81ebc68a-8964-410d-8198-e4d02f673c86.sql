
-- ═══ Ratenplan-Management (Feld 13) ═══
CREATE TABLE public.tenancy_payment_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  lease_id UUID NOT NULL,
  unit_id UUID,
  created_by UUID,
  status TEXT NOT NULL DEFAULT 'active',
  total_arrears_eur NUMERIC(12,2) NOT NULL,
  monthly_installment_eur NUMERIC(12,2) NOT NULL,
  installments_count INTEGER NOT NULL,
  installments_paid INTEGER NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tenancy_payment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_payment_plans" ON public.tenancy_payment_plans
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE POLICY "crud_payment_plans" ON public.tenancy_payment_plans
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ═══ Mietminderung (Feld 24) ═══
CREATE TABLE public.tenancy_rent_reductions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  lease_id UUID NOT NULL,
  unit_id UUID,
  task_id UUID,
  reason TEXT NOT NULL,
  reduction_percent NUMERIC(5,2) NOT NULL,
  effective_from DATE NOT NULL,
  effective_until DATE,
  status TEXT NOT NULL DEFAULT 'active',
  legal_basis TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tenancy_rent_reductions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_rent_reductions" ON public.tenancy_rent_reductions
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE POLICY "crud_rent_reductions" ON public.tenancy_rent_reductions
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- ═══ Fristen-Tracking (Feld 28 enhancement) ═══
CREATE TABLE public.tenancy_deadlines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  lease_id UUID,
  unit_id UUID,
  property_id UUID,
  deadline_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  remind_days_before INTEGER DEFAULT 14,
  reminded_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tenancy_deadlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation_deadlines" ON public.tenancy_deadlines
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (tenant_id IN (SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE POLICY "crud_deadlines" ON public.tenancy_deadlines
  FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.tenancy_deadlines;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tenancy_rent_reductions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tenancy_payment_plans;
