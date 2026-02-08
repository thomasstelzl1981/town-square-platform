-- Add scope column to contacts table for Zone 1/Zone 2 separation
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS scope TEXT DEFAULT 'zone2_tenant';

-- Update existing contacts to have the default scope
UPDATE contacts SET scope = 'zone2_tenant' WHERE scope IS NULL;

-- Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_contacts_scope ON contacts(scope);

-- Add RLS policy for Zone 1 admin contacts (uses memberships table for role check)
CREATE POLICY "Zone 1 admins can manage admin contacts"
ON contacts
FOR ALL
USING (
  scope = 'zone1_admin' 
  AND EXISTS (
    SELECT 1 FROM memberships 
    WHERE memberships.user_id = auth.uid() 
    AND memberships.role = 'platform_admin'
  )
)
WITH CHECK (
  scope = 'zone1_admin' 
  AND EXISTS (
    SELECT 1 FROM memberships 
    WHERE memberships.user_id = auth.uid() 
    AND memberships.role = 'platform_admin'
  )
);