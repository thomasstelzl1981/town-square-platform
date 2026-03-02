
-- property_expenses: Manuelle und bank-verknüpfte Ausgaben pro Immobilie
CREATE TABLE public.property_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  user_id UUID NOT NULL,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES public.units(id) ON DELETE SET NULL,
  lease_id UUID REFERENCES public.leases(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN (
    'instandhaltung','handwerker','versicherung','verwalterkosten',
    'rechtsberatung','fahrtkosten','bankgebuehren','weg_hausgeld',
    'grundsteuer','sonstige'
  )),
  amount NUMERIC(12,2) NOT NULL,
  tax_deductible BOOLEAN NOT NULL DEFAULT true,
  is_apportionable BOOLEAN NOT NULL DEFAULT false,
  label TEXT NOT NULL,
  description TEXT,
  expense_date DATE NOT NULL,
  period_from DATE,
  period_to DATE,
  bank_transaction_id UUID REFERENCES public.bank_transactions(id) ON DELETE SET NULL,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'bank_matched')),
  receipt_storage_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_property_expenses_tenant ON public.property_expenses(tenant_id);
CREATE INDEX idx_property_expenses_property ON public.property_expenses(property_id);
CREATE INDEX idx_property_expenses_category ON public.property_expenses(tenant_id, property_id, category);
CREATE INDEX idx_property_expenses_date ON public.property_expenses(tenant_id, property_id, expense_date);
CREATE INDEX idx_property_expenses_bank_tx ON public.property_expenses(bank_transaction_id) WHERE bank_transaction_id IS NOT NULL;

ALTER TABLE public.property_expenses ENABLE ROW LEVEL SECURITY;

-- RESTRICTIVE tenant isolation
CREATE POLICY "property_expenses_tenant_isolation"
  ON public.property_expenses AS RESTRICTIVE FOR ALL TO authenticated
  USING (tenant_id = public.get_user_tenant_id() OR public.is_platform_admin(auth.uid()));

-- PERMISSIVE CRUD
CREATE POLICY "property_expenses_select"
  ON public.property_expenses FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "property_expenses_insert"
  ON public.property_expenses FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "property_expenses_update"
  ON public.property_expenses FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "property_expenses_delete"
  ON public.property_expenses FOR DELETE TO authenticated
  USING (true);

CREATE TRIGGER update_property_expenses_updated_at
  BEFORE UPDATE ON public.property_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
