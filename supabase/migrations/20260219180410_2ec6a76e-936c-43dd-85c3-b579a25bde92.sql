
-- Fix: Set v_all_transactions to SECURITY INVOKER (default, but explicit)
ALTER VIEW public.v_all_transactions SET (security_invoker = on);
