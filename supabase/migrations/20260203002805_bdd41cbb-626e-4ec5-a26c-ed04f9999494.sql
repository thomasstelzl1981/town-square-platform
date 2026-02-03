-- Create context_members table (for Partner in Ehepaar-Kontext)
CREATE TABLE IF NOT EXISTS context_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  context_id UUID NOT NULL REFERENCES landlord_contexts(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  ownership_share NUMERIC(5,2) DEFAULT 50.00,
  profession TEXT,
  gross_income_yearly NUMERIC(12,2),
  tax_class TEXT,
  church_tax BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE context_members ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Tenant isolation for context_members" ON context_members
  FOR ALL USING (
    tenant_id IN (SELECT tenant_id FROM get_user_memberships(auth.uid()))
    OR public.is_platform_admin()
  );

-- Trigger for updated_at
CREATE TRIGGER update_context_members_updated_at
  BEFORE UPDATE ON context_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add columns to properties and leases if missing
ALTER TABLE properties ADD COLUMN IF NOT EXISTS owner_context_id UUID REFERENCES landlord_contexts(id);
ALTER TABLE leases ADD COLUMN IF NOT EXISTS tenant_contact_id UUID REFERENCES contacts(id);