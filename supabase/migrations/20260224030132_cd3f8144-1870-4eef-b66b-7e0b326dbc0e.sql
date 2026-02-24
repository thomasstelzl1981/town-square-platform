
-- ═══════════════════════════════════════════════════════════════
-- Discovery Scheduler: Region Queue + Run Log + Dedupe Hash
-- ═══════════════════════════════════════════════════════════════

-- 1. Discovery Region Queue
CREATE TABLE public.discovery_region_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  region_name TEXT NOT NULL,
  postal_code_prefix TEXT NOT NULL,
  population INTEGER NOT NULL DEFAULT 0,
  last_scanned_at TIMESTAMPTZ,
  cooldown_until TIMESTAMPTZ,
  total_contacts INTEGER NOT NULL DEFAULT 0,
  approved_contacts INTEGER NOT NULL DEFAULT 0,
  last_category_index INTEGER NOT NULL DEFAULT 0,
  priority_score NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, region_name)
);

ALTER TABLE public.discovery_region_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant can view own region queue"
  ON public.discovery_region_queue FOR SELECT
  USING (tenant_id = (SELECT active_tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant can manage own region queue"
  ON public.discovery_region_queue FOR ALL
  USING (tenant_id = (SELECT active_tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE INDEX idx_discovery_region_queue_tenant_priority
  ON public.discovery_region_queue(tenant_id, priority_score DESC);

-- 2. Discovery Run Log
CREATE TABLE public.discovery_run_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  run_date DATE NOT NULL DEFAULT CURRENT_DATE,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  region_name TEXT NOT NULL,
  category_code TEXT NOT NULL,
  raw_found INTEGER NOT NULL DEFAULT 0,
  duplicates_skipped INTEGER NOT NULL DEFAULT 0,
  approved_count INTEGER NOT NULL DEFAULT 0,
  credits_used INTEGER NOT NULL DEFAULT 0,
  cost_eur NUMERIC(10,2) NOT NULL DEFAULT 0,
  provider_calls_json JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.discovery_run_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant can view own run logs"
  ON public.discovery_run_log FOR SELECT
  USING (tenant_id = (SELECT active_tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant can insert own run logs"
  ON public.discovery_run_log FOR INSERT
  WITH CHECK (tenant_id = (SELECT active_tenant_id FROM public.profiles WHERE id = auth.uid()));

CREATE INDEX idx_discovery_run_log_tenant_date
  ON public.discovery_run_log(tenant_id, run_date DESC);

-- 3. Dedupe hash on soat_search_results
ALTER TABLE public.soat_search_results
  ADD COLUMN IF NOT EXISTS dedupe_hash TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_soat_search_results_dedupe_hash
  ON public.soat_search_results(dedupe_hash)
  WHERE dedupe_hash IS NOT NULL;
