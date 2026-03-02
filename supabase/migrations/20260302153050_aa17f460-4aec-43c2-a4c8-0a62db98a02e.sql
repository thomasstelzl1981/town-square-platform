
-- Fix security definer views by setting them to SECURITY INVOKER
ALTER VIEW public.v_reservations_legacy SET (security_invoker = on);
ALTER VIEW public.v_dev_project_reservations_legacy SET (security_invoker = on);
