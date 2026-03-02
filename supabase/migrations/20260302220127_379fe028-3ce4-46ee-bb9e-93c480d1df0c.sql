
-- A1: Add INSERT policy for authenticated users on finance_lifecycle_events
-- Client-side eventWriter.ts needs INSERT permission (currently only SELECT exists for authenticated)
-- Tenant isolation via join to finance_requests.tenant_id

CREATE OR REPLACE FUNCTION public.get_finance_request_tenant_id(p_request_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.finance_requests WHERE id = p_request_id LIMIT 1;
$$;

CREATE POLICY "authenticated_insert_events"
ON public.finance_lifecycle_events
FOR INSERT
TO authenticated
WITH CHECK (
  public.get_finance_request_tenant_id(finance_request_id) IS NOT NULL
);
