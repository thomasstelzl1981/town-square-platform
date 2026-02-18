
-- Neue Tabelle für wiederkehrende Service-Subscriptions (z.B. Kontaktanreicherung 20 Cr/Monat)
CREATE TABLE public.tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  service_code TEXT NOT NULL,
  credits_per_month INTEGER NOT NULL DEFAULT 20,
  price_cents INTEGER NOT NULL DEFAULT 500,
  is_active BOOLEAN NOT NULL DEFAULT false,
  activated_at TIMESTAMPTZ,
  next_billing TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, service_code)
);

-- RLS aktivieren
ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;

-- Tenant kann eigene Subscriptions lesen
CREATE POLICY "Tenants can view own subscriptions"
  ON public.tenant_subscriptions FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

-- Tenant kann eigene Subscriptions aktivieren/deaktivieren
CREATE POLICY "Tenants can update own subscriptions"
  ON public.tenant_subscriptions FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id());

-- Tenant kann eigene Subscriptions erstellen
CREATE POLICY "Tenants can insert own subscriptions"
  ON public.tenant_subscriptions FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id());

-- Restrictive tenant isolation policy
CREATE POLICY "tenant_isolation_restrictive"
  ON public.tenant_subscriptions AS RESTRICTIVE FOR ALL
  USING (tenant_id = public.get_user_tenant_id());

-- Index für schnelle Abfragen
CREATE INDEX idx_tenant_subscriptions_tenant_service
  ON public.tenant_subscriptions(tenant_id, service_code);

CREATE INDEX idx_tenant_subscriptions_tenant_created
  ON public.tenant_subscriptions(tenant_id, created_at);

-- updated_at Trigger
CREATE TRIGGER update_tenant_subscriptions_updated_at
  BEFORE UPDATE ON public.tenant_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
