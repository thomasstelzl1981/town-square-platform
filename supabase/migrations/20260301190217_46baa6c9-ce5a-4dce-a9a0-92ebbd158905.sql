
-- 1. Add tenant_id to commpro_phone_assistants
ALTER TABLE public.commpro_phone_assistants 
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES public.organizations(id);

-- Backfill tenant_id from user memberships
UPDATE public.commpro_phone_assistants a
SET tenant_id = (
  SELECT m.tenant_id 
  FROM public.memberships m 
  WHERE m.user_id = a.user_id 
  LIMIT 1
)
WHERE a.tenant_id IS NULL AND a.user_id IS NOT NULL;

-- 2. Create phone_usage_log table
CREATE TABLE public.phone_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.organizations(id),
  assistant_id uuid NOT NULL REFERENCES public.commpro_phone_assistants(id),
  call_session_id uuid REFERENCES public.commpro_phone_call_sessions(id),
  user_id uuid REFERENCES auth.users(id),
  duration_sec integer NOT NULL DEFAULT 0,
  credits_charged integer NOT NULL DEFAULT 0,
  provider text NOT NULL DEFAULT 'elevenlabs',
  provider_cost_cents integer,
  billing_period text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.phone_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "phone_usage_log_tenant_select" ON public.phone_usage_log
  FOR SELECT TO authenticated
  USING (tenant_id IN (
    SELECT m.tenant_id FROM public.memberships m WHERE m.user_id = auth.uid()
  ));

CREATE POLICY "phone_usage_log_tenant_insert" ON public.phone_usage_log
  FOR INSERT TO authenticated
  WITH CHECK (tenant_id IN (
    SELECT m.tenant_id FROM public.memberships m WHERE m.user_id = auth.uid()
  ));

CREATE INDEX idx_phone_usage_tenant_period 
  ON public.phone_usage_log(tenant_id, billing_period);

-- 3. Create phone_subscription_log table
CREATE TABLE public.phone_subscription_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.organizations(id),
  assistant_id uuid NOT NULL REFERENCES public.commpro_phone_assistants(id),
  billing_period text NOT NULL,
  credits_charged integer NOT NULL DEFAULT 15,
  twilio_number_sid text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(assistant_id, billing_period)
);

ALTER TABLE public.phone_subscription_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "phone_sub_log_tenant_select" ON public.phone_subscription_log
  FOR SELECT TO authenticated
  USING (tenant_id IN (
    SELECT m.tenant_id FROM public.memberships m WHERE m.user_id = auth.uid()
  ));

CREATE INDEX idx_phone_sub_tenant_period 
  ON public.phone_subscription_log(tenant_id, billing_period);

-- 4. Create phone_usage_monthly view
CREATE OR REPLACE VIEW public.phone_usage_monthly AS
SELECT 
  u.tenant_id,
  u.billing_period,
  COUNT(*) as total_calls,
  SUM(u.duration_sec) as total_seconds,
  SUM(u.credits_charged) as total_call_credits,
  COALESCE((
    SELECT SUM(s.credits_charged) 
    FROM public.phone_subscription_log s 
    WHERE s.tenant_id = u.tenant_id AND s.billing_period = u.billing_period
  ), 0) as subscription_credits
FROM public.phone_usage_log u
GROUP BY u.tenant_id, u.billing_period;
