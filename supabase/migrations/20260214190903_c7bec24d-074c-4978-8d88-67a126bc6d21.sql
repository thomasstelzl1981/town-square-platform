
-- =====================================================
-- MOD-11 Finanzierungsmanager: 7 neue Tabellen (tenant_id = UUID)
-- =====================================================

-- 1) Enums
CREATE TYPE public.insurance_category AS ENUM (
  'haftpflicht', 'hausrat', 'wohngebaeude', 'rechtsschutz', 'kfz', 'unfall', 'berufsunfaehigkeit', 'sonstige'
);
CREATE TYPE public.insurance_status AS ENUM ('aktiv', 'gekuendigt', 'ruhend', 'auslaufend');
CREATE TYPE public.payment_interval AS ENUM ('monatlich', 'vierteljaehrlich', 'halbjaehrlich', 'jaehrlich', 'einmalig');
CREATE TYPE public.subscription_category AS ENUM (
  'streaming_video', 'streaming_music', 'cloud_storage', 'software_saas', 'news_media',
  'ecommerce_membership', 'telecom_mobile', 'internet', 'utilities_energy', 'mobility', 'fitness', 'other'
);
CREATE TYPE public.scan_status AS ENUM ('pending', 'running', 'completed', 'failed');
CREATE TYPE public.candidate_status AS ENUM ('pending', 'accepted_subscription', 'accepted_insurance', 'accepted_vorsorge', 'ignored', 'merged');
CREATE TYPE public.bank_account_category AS ENUM ('privat', 'vermietung', 'tagesgeld', 'pv', 'sonstiges');

-- 2) insurance_contracts
CREATE TABLE public.insurance_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category public.insurance_category NOT NULL,
  insurer TEXT,
  policy_no TEXT,
  policyholder TEXT,
  start_date DATE,
  end_date DATE,
  cancellation_deadline TEXT,
  premium NUMERIC(12,2),
  payment_interval public.payment_interval DEFAULT 'monatlich',
  status public.insurance_status DEFAULT 'aktiv',
  details JSONB DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.insurance_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own tenant insurance" ON public.insurance_contracts FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users insert own tenant insurance" ON public.insurance_contracts FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users update own tenant insurance" ON public.insurance_contracts FOR UPDATE USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users delete own tenant insurance" ON public.insurance_contracts FOR DELETE USING (tenant_id = public.get_user_tenant_id());

-- 3) insurance_contract_links
CREATE TABLE public.insurance_contract_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.insurance_contracts(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  tenant_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.insurance_contract_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own tenant links" ON public.insurance_contract_links FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users insert own tenant links" ON public.insurance_contract_links FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users delete own tenant links" ON public.insurance_contract_links FOR DELETE USING (tenant_id = public.get_user_tenant_id());

-- 4) vorsorge_contracts
CREATE TABLE public.vorsorge_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  person_id UUID REFERENCES public.household_persons(id) ON DELETE SET NULL,
  provider TEXT,
  contract_no TEXT,
  contract_type TEXT,
  start_date DATE,
  premium NUMERIC(12,2),
  payment_interval public.payment_interval DEFAULT 'monatlich',
  status TEXT DEFAULT 'aktiv',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vorsorge_contracts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own tenant vorsorge" ON public.vorsorge_contracts FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users insert own tenant vorsorge" ON public.vorsorge_contracts FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users update own tenant vorsorge" ON public.vorsorge_contracts FOR UPDATE USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users delete own tenant vorsorge" ON public.vorsorge_contracts FOR DELETE USING (tenant_id = public.get_user_tenant_id());

-- 5) user_subscriptions
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  custom_name TEXT,
  merchant TEXT,
  category public.subscription_category DEFAULT 'other',
  frequency TEXT DEFAULT 'monatlich',
  amount NUMERIC(10,2),
  amount_max NUMERIC(10,2),
  payment_source_account_id UUID,
  estimated_start DATE,
  estimated_renewal DATE,
  last_payment_date DATE,
  status TEXT DEFAULT 'aktiv',
  auto_renew BOOLEAN DEFAULT true,
  confidence NUMERIC(3,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own tenant subs" ON public.user_subscriptions FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users insert own tenant subs" ON public.user_subscriptions FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users update own tenant subs" ON public.user_subscriptions FOR UPDATE USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users delete own tenant subs" ON public.user_subscriptions FOR DELETE USING (tenant_id = public.get_user_tenant_id());

-- 6) bank_account_meta
CREATE TABLE public.bank_account_meta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.msv_bank_accounts(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  custom_name TEXT,
  category public.bank_account_category DEFAULT 'privat',
  org_unit TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(account_id)
);
ALTER TABLE public.bank_account_meta ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own tenant meta" ON public.bank_account_meta FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users insert own tenant meta" ON public.bank_account_meta FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users update own tenant meta" ON public.bank_account_meta FOR UPDATE USING (tenant_id = public.get_user_tenant_id());

-- 7) scan_runs
CREATE TABLE public.scan_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status public.scan_status DEFAULT 'pending',
  account_ids UUID[] DEFAULT '{}',
  results_summary JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.scan_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own tenant scans" ON public.scan_runs FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users insert own tenant scans" ON public.scan_runs FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users update own tenant scans" ON public.scan_runs FOR UPDATE USING (tenant_id = public.get_user_tenant_id());

-- 8) contract_candidates
CREATE TABLE public.contract_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_run_id UUID NOT NULL REFERENCES public.scan_runs(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  merchant TEXT,
  amount_min NUMERIC(10,2),
  amount_max NUMERIC(10,2),
  frequency TEXT,
  category_suggestion TEXT,
  confidence NUMERIC(3,2),
  reasoning TEXT,
  status public.candidate_status DEFAULT 'pending',
  accepted_entity_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.contract_candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own tenant candidates" ON public.contract_candidates FOR SELECT USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "Users update own tenant candidates" ON public.contract_candidates FOR UPDATE USING (tenant_id = public.get_user_tenant_id());

-- Indexes
CREATE INDEX idx_insurance_contracts_tenant ON public.insurance_contracts(tenant_id);
CREATE INDEX idx_vorsorge_contracts_tenant ON public.vorsorge_contracts(tenant_id);
CREATE INDEX idx_user_subscriptions_tenant ON public.user_subscriptions(tenant_id);
CREATE INDEX idx_bank_account_meta_account ON public.bank_account_meta(account_id);
CREATE INDEX idx_scan_runs_tenant ON public.scan_runs(tenant_id);
CREATE INDEX idx_contract_candidates_scan ON public.contract_candidates(scan_run_id);

-- Updated_at triggers
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.insurance_contracts FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.vorsorge_contracts FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.user_subscriptions FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.bank_account_meta FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();
