-- P0-1 FIX: Add dev-mode SELECT policies for unauthenticated preview access
-- These policies allow SELECT when auth.uid() IS NULL (dev mode)
-- but still require tenant_id to match an existing organization

-- Properties: dev mode read
CREATE POLICY "prop_select_dev_mode" ON properties
FOR SELECT
USING (
  auth.uid() IS NULL 
  AND tenant_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM organizations o WHERE o.id = properties.tenant_id
  )
);

-- Units: dev mode read
CREATE POLICY "units_select_dev_mode" ON units
FOR SELECT
USING (
  auth.uid() IS NULL 
  AND tenant_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM organizations o WHERE o.id = units.tenant_id
  )
);

-- Leases: dev mode read (also needed for portfolio aggregation)
CREATE POLICY "leases_select_dev_mode" ON leases
FOR SELECT
USING (
  auth.uid() IS NULL 
  AND tenant_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM organizations o WHERE o.id = leases.tenant_id
  )
);

-- Property Financing: dev mode read (needed for portfolio aggregation)
CREATE POLICY "property_financing_select_dev_mode" ON property_financing
FOR SELECT
USING (
  auth.uid() IS NULL 
  AND tenant_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM organizations o WHERE o.id = property_financing.tenant_id
  )
);

-- Contacts: dev mode read (needed for lease tenant names)
CREATE POLICY "contacts_select_dev_mode" ON contacts
FOR SELECT
USING (
  auth.uid() IS NULL 
  AND tenant_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM organizations o WHERE o.id = contacts.tenant_id
  )
);

-- Documents: dev mode read (for DMS)
CREATE POLICY "documents_select_dev_mode" ON documents
FOR SELECT
USING (
  auth.uid() IS NULL 
  AND tenant_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM organizations o WHERE o.id = documents.tenant_id
  )
);

-- Storage Nodes: dev mode read (for DMS tree)
CREATE POLICY "storage_nodes_select_dev_mode" ON storage_nodes
FOR SELECT
USING (
  auth.uid() IS NULL 
  AND tenant_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM organizations o WHERE o.id = storage_nodes.tenant_id
  )
);

-- Document Links: dev mode read (for DMS)
CREATE POLICY "document_links_select_dev_mode" ON document_links
FOR SELECT
USING (
  auth.uid() IS NULL 
  AND tenant_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM organizations o WHERE o.id = document_links.tenant_id
  )
);

-- Landlord Contexts: dev mode read (for context filtering)
CREATE POLICY "landlord_contexts_select_dev_mode" ON landlord_contexts
FOR SELECT
USING (
  auth.uid() IS NULL 
  AND tenant_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM organizations o WHERE o.id = landlord_contexts.tenant_id
  )
);

-- Context Members: dev mode read (for context filtering)
CREATE POLICY "context_members_select_dev_mode" ON context_members
FOR SELECT
USING (
  auth.uid() IS NULL 
  AND tenant_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM organizations o WHERE o.id = context_members.tenant_id
  )
);

-- Finance Requests: dev mode read (for MOD-07/MOD-11)
CREATE POLICY "finance_requests_select_dev_mode" ON finance_requests
FOR SELECT
USING (
  auth.uid() IS NULL 
  AND tenant_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM organizations o WHERE o.id = finance_requests.tenant_id
  )
);

-- Applicant Profiles: dev mode read (for MOD-07/MOD-11)
CREATE POLICY "applicant_profiles_select_dev_mode" ON applicant_profiles
FOR SELECT
USING (
  auth.uid() IS NULL 
  AND tenant_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM organizations o WHERE o.id = applicant_profiles.tenant_id
  )
);

-- Loans: dev mode read (for portfolio financing data)
CREATE POLICY "loans_select_dev_mode" ON loans
FOR SELECT
USING (
  auth.uid() IS NULL 
  AND tenant_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM organizations o WHERE o.id = loans.tenant_id
  )
);