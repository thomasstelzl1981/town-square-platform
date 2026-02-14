
-- Rate Limit Counters table for tenant-scoped rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limit_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  counter_key TEXT NOT NULL,
  tenant_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID,
  function_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast lookups + cleanup
CREATE INDEX IF NOT EXISTS idx_rate_limit_counters_key_created ON public.rate_limit_counters (counter_key, created_at);
CREATE INDEX IF NOT EXISTS idx_rate_limit_counters_tenant ON public.rate_limit_counters (tenant_id);
CREATE INDEX IF NOT EXISTS idx_rate_limit_counters_created ON public.rate_limit_counters (created_at);

-- RLS: service-role only (edge functions use admin client)
ALTER TABLE public.rate_limit_counters ENABLE ROW LEVEL SECURITY;

-- No user-facing policies — only service_role can read/write
-- This table is managed exclusively by edge functions via service_role

-- Auto-cleanup: delete counters older than 1 hour (keep table small)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_counters()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limit_counters
  WHERE created_at < now() - interval '1 hour';
END;
$$;

-- Enable pg_cron and pg_net extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule rate_limit cleanup every 15 minutes
SELECT cron.schedule(
  'cleanup-rate-limit-counters',
  '*/15 * * * *',
  $$SELECT public.cleanup_rate_limit_counters();$$
);
