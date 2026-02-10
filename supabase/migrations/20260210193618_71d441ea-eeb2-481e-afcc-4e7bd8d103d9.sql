
-- P1: SSOT Mapping + Sales Desk Integration

-- 1. Add SSOT mapping columns to dev_project_units
ALTER TABLE dev_project_units 
  ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES properties(id),
  ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES units(id);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_dev_project_units_property ON dev_project_units(property_id) WHERE property_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dev_project_units_unit ON dev_project_units(unit_id) WHERE unit_id IS NOT NULL;

-- 2. Sales Desk Requests table (Zone 2 → Zone 1 workflow)
CREATE TABLE IF NOT EXISTS sales_desk_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(id),
  project_id uuid NOT NULL REFERENCES dev_projects(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  requested_by uuid NOT NULL,
  reviewed_by uuid,
  review_notes text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  commission_agreement jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE sales_desk_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant sales requests"
  ON sales_desk_requests FOR SELECT
  USING (tenant_id = (SELECT active_tenant_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can create sales requests for own tenant"
  ON sales_desk_requests FOR INSERT
  WITH CHECK (
    tenant_id = (SELECT active_tenant_id FROM profiles WHERE id = auth.uid())
    AND requested_by = auth.uid()
  );

CREATE POLICY "Users can update own tenant sales requests"
  ON sales_desk_requests FOR UPDATE
  USING (tenant_id = (SELECT active_tenant_id FROM profiles WHERE id = auth.uid()));

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sales_desk_requests_project ON sales_desk_requests(project_id);
CREATE INDEX IF NOT EXISTS idx_sales_desk_requests_tenant_status ON sales_desk_requests(tenant_id, status);
