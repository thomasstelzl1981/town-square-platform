
-- Security definer function to check if a tenant is in demo mode
CREATE OR REPLACE FUNCTION public.is_demo_tenant(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = p_tenant_id
    AND tenant_mode = 'demo'
  );
$$;

-- Text overload for process_health_log
CREATE OR REPLACE FUNCTION public.is_demo_tenant(p_tenant_id text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE 
    WHEN p_tenant_id IS NULL THEN false
    ELSE EXISTS (
      SELECT 1 FROM public.organizations
      WHERE id = p_tenant_id::uuid
      AND tenant_mode = 'demo'
    )
  END;
$$;

-- Apply RESTRICTIVE write-block policy to ALL tables that have tenant_id
DO $$
DECLARE
  tbl text;
  policy_name text;
BEGIN
  FOR tbl IN
    SELECT DISTINCT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables t ON t.table_name = c.table_name AND t.table_schema = c.table_schema
    WHERE c.table_schema = 'public'
      AND c.column_name = 'tenant_id'
      AND t.table_type = 'BASE TABLE'
    ORDER BY c.table_name
  LOOP
    policy_name := 'demo_write_block_' || tbl;
    
    -- Drop if exists (idempotent)
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_name, tbl);
    
    -- Create RESTRICTIVE policy: blocks INSERT/UPDATE/DELETE when tenant_mode = 'demo'
    EXECUTE format(
      'CREATE POLICY %I ON public.%I AS RESTRICTIVE FOR ALL TO authenticated USING (true) WITH CHECK (NOT public.is_demo_tenant(%I.tenant_id))',
      policy_name, tbl, tbl
    );
  END LOOP;
END;
$$;
