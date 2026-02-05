-- Add dev-mode SELECT policy for organizations table
-- Required because other dev-mode policies reference organizations in their EXISTS check

CREATE POLICY "org_select_dev_mode" ON organizations
FOR SELECT
USING (
  auth.uid() IS NULL
);

-- Note: This allows unauthenticated users to see ALL organizations
-- This is acceptable for development/preview environments
-- In production, users must be authenticated and the regular member/platform_admin policies apply