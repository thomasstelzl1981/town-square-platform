
-- =============================================
-- finapi_depot_accounts + finapi_depot_positions
-- =============================================

CREATE TABLE public.finapi_depot_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.organizations(id),
  person_id uuid REFERENCES public.household_persons(id) ON DELETE SET NULL,
  account_name text,
  depot_number text,
  bank_name text,
  finapi_account_id text,
  connection_id uuid REFERENCES public.finapi_connections(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.finapi_depot_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select" ON public.finapi_depot_accounts
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "tenant_insert" ON public.finapi_depot_accounts
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "tenant_update" ON public.finapi_depot_accounts
  FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "tenant_delete" ON public.finapi_depot_accounts
  FOR DELETE TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "tenant_isolation_restrictive" ON public.finapi_depot_accounts
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (tenant_id = public.get_user_tenant_id() OR public.is_platform_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_finapi_depot_accounts_updated_at
  BEFORE UPDATE ON public.finapi_depot_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── Positions ───

CREATE TABLE public.finapi_depot_positions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  depot_account_id uuid NOT NULL REFERENCES public.finapi_depot_accounts(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.organizations(id),
  finapi_security_id text,
  isin text,
  wkn text,
  name text,
  quantity numeric,
  quantity_nominal numeric,
  current_value numeric,
  purchase_value numeric,
  currency text NOT NULL DEFAULT 'EUR',
  entry_quote numeric,
  current_quote numeric,
  profit_or_loss numeric,
  last_updated timestamptz DEFAULT now()
);

ALTER TABLE public.finapi_depot_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select" ON public.finapi_depot_positions
  FOR SELECT TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "tenant_insert" ON public.finapi_depot_positions
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "tenant_update" ON public.finapi_depot_positions
  FOR UPDATE TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "tenant_delete" ON public.finapi_depot_positions
  FOR DELETE TO authenticated
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "tenant_isolation_restrictive" ON public.finapi_depot_positions
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (tenant_id = public.get_user_tenant_id() OR public.is_platform_admin(auth.uid()));

-- Unique constraint for upsert on finapi_security_id per depot
CREATE UNIQUE INDEX idx_finapi_depot_positions_security
  ON public.finapi_depot_positions (depot_account_id, finapi_security_id)
  WHERE finapi_security_id IS NOT NULL;
