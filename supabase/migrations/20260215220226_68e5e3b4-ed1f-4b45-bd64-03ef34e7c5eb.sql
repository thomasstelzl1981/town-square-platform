
-- Fix: Recreate view with SECURITY INVOKER to use querying user's permissions
DROP VIEW IF EXISTS public.v_platform_cost_summary;

CREATE VIEW public.v_platform_cost_summary
WITH (security_invoker = true)
AS
SELECT
  r.action_code,
  COUNT(*) AS total_runs,
  COUNT(*) FILTER (WHERE r.status = 'completed') AS completed_runs,
  COUNT(*) FILTER (WHERE r.status = 'failed') AS failed_runs,
  COALESCE(SUM(r.cost_cents), 0) AS total_cost_cents,
  COALESCE(AVG(r.cost_cents) FILTER (WHERE r.cost_cents > 0), 0) AS avg_cost_cents,
  COALESCE(SUM(r.tokens_used), 0) AS total_tokens,
  COALESCE(AVG(r.tokens_used) FILTER (WHERE r.tokens_used > 0), 0) AS avg_tokens,
  COALESCE(AVG(r.duration_ms) FILTER (WHERE r.duration_ms > 0), 0) AS avg_duration_ms,
  COALESCE(SUM(b.credits_charged), 0) AS total_credits_charged,
  COALESCE(SUM(b.credits_charged) * 50, 0) AS theoretical_revenue_cents,
  COALESCE(SUM(b.credits_charged) * 50, 0) - COALESCE(SUM(r.cost_cents), 0) AS margin_cents,
  MIN(r.created_at) AS first_run_at,
  MAX(r.created_at) AS last_run_at
FROM armstrong_action_runs r
LEFT JOIN armstrong_billing_events b ON b.action_run_id = r.id
GROUP BY r.action_code;
