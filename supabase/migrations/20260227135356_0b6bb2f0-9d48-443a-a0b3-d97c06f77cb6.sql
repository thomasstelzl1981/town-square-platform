
-- Fix: super_manager darf organizations updaten (zusätzlich zu org_admin)
DROP POLICY IF EXISTS org_update_org_admin ON organizations;
CREATE POLICY "org_update_org_admin" ON organizations FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.user_id = auth.uid()
      AND m.tenant_id = organizations.id
      AND m.role IN ('org_admin', 'super_manager')
  )
);
