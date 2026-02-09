-- Phase 1: Create SECURITY DEFINER function to bypass RLS on profiles table
-- This function safely retrieves the user's active_tenant_id without RLS recursion issues

CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT active_tenant_id FROM profiles WHERE id = auth.uid()
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_tenant_id() TO authenticated;

-- Update dev_projects RLS policy to use the new function
DROP POLICY IF EXISTS "dev_projects_tenant_access" ON dev_projects;
DROP POLICY IF EXISTS "Users can view dev_projects in their tenant" ON dev_projects;
DROP POLICY IF EXISTS "Users can create dev_projects in their tenant" ON dev_projects;
DROP POLICY IF EXISTS "Users can update dev_projects in their tenant" ON dev_projects;
DROP POLICY IF EXISTS "Users can delete dev_projects in their tenant" ON dev_projects;

-- Create unified policy using the SECURITY DEFINER function
CREATE POLICY "dev_projects_tenant_access" ON dev_projects
  FOR ALL
  USING (tenant_id = public.get_user_tenant_id())
  WITH CHECK (tenant_id = public.get_user_tenant_id());