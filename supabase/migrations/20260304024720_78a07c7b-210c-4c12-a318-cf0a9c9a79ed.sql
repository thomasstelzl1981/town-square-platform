
-- Add tenant_id to cameras
ALTER TABLE cameras ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES organizations(id);

-- Backfill existing cameras from profiles
UPDATE cameras c
SET tenant_id = p.active_tenant_id
FROM profiles p
WHERE c.user_id = p.id AND c.tenant_id IS NULL;

-- Make tenant_id NOT NULL after backfill
ALTER TABLE cameras ALTER COLUMN tenant_id SET NOT NULL;

-- Drop old user-only policies
DROP POLICY IF EXISTS cameras_select_own ON cameras;
DROP POLICY IF EXISTS cameras_insert_own ON cameras;
DROP POLICY IF EXISTS cameras_update_own ON cameras;
DROP POLICY IF EXISTS cameras_delete_own ON cameras;

-- New tenant-scoped policies
CREATE POLICY cameras_tenant_select ON cameras FOR SELECT TO authenticated
  USING (tenant_id = (SELECT active_tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY cameras_tenant_insert ON cameras FOR INSERT TO authenticated
  WITH CHECK (tenant_id = (SELECT active_tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY cameras_tenant_update ON cameras FOR UPDATE TO authenticated
  USING (tenant_id = (SELECT active_tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY cameras_tenant_delete ON cameras FOR DELETE TO authenticated
  USING (tenant_id = (SELECT active_tenant_id FROM profiles WHERE id = auth.uid()));
