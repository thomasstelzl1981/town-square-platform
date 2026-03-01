
-- Fix SECURITY DEFINER on the view by recreating with SECURITY INVOKER
DROP VIEW IF EXISTS public.phone_usage_monthly;
CREATE VIEW public.phone_usage_monthly WITH (security_invoker = true) AS
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
