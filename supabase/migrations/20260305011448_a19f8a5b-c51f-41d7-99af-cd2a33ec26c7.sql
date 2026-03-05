-- Fix RLS: Allow super_manager and project_manager to INSERT/UPDATE/DELETE properties
DROP POLICY IF EXISTS prop_insert_member ON properties;
CREATE POLICY prop_insert_member ON properties FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.user_id = auth.uid()
      AND m.tenant_id = properties.tenant_id
      AND m.role IN ('org_admin', 'internal_ops', 'super_manager', 'project_manager')
  )
);

DROP POLICY IF EXISTS prop_update_member ON properties;
CREATE POLICY prop_update_member ON properties FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.user_id = auth.uid()
      AND m.tenant_id = properties.tenant_id
      AND m.role IN ('org_admin', 'internal_ops', 'super_manager', 'project_manager')
  )
);

DROP POLICY IF EXISTS prop_delete_member ON properties;
CREATE POLICY prop_delete_member ON properties FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.user_id = auth.uid()
      AND m.tenant_id = properties.tenant_id
      AND m.role IN ('org_admin', 'internal_ops', 'super_manager', 'project_manager')
  )
);

-- Fix RLS: Allow super_manager and project_manager to INSERT/UPDATE/DELETE listings
DROP POLICY IF EXISTS listings_insert_member ON listings;
CREATE POLICY listings_insert_member ON listings FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.user_id = auth.uid()
      AND m.tenant_id = listings.tenant_id
      AND m.role IN ('org_admin', 'internal_ops', 'super_manager', 'project_manager')
  )
);

DROP POLICY IF EXISTS listings_update_member ON listings;
CREATE POLICY listings_update_member ON listings FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.user_id = auth.uid()
      AND m.tenant_id = listings.tenant_id
      AND m.role IN ('org_admin', 'internal_ops', 'super_manager', 'project_manager')
  )
);

DROP POLICY IF EXISTS listings_delete_admin ON listings;
CREATE POLICY listings_delete_admin ON listings FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.user_id = auth.uid()
      AND m.tenant_id = listings.tenant_id
      AND m.role IN ('org_admin', 'internal_ops', 'super_manager', 'project_manager')
  )
);