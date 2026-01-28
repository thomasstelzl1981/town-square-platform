-- Update tile_catalog for MOD-09 with 4 tiles
UPDATE tile_catalog SET sub_tiles = '[
  {"route": "/portal/vertriebspartner/katalog", "title": "Katalog"},
  {"route": "/portal/vertriebspartner/beratung", "title": "Beratung"},
  {"route": "/portal/vertriebspartner/kunden", "title": "Kunden"},
  {"route": "/portal/vertriebspartner/network", "title": "Network"}
]'::jsonb WHERE tile_code = 'MOD-09';

-- Create partner_listing_selections table (heart toggle persistence)
CREATE TABLE IF NOT EXISTS public.partner_listing_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  partner_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  selected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, listing_id, partner_user_id)
);

-- Create customer_projects table (Kundenakte)
CREATE TABLE IF NOT EXISTS public.customer_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'running', 'archived')),
  property_interests UUID[] DEFAULT '{}',
  investment_profile_id UUID REFERENCES investment_profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partner_listing_selections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_projects ENABLE ROW LEVEL SECURITY;

-- RLS policies for partner_listing_selections
CREATE POLICY "Users can view their own selections"
  ON public.partner_listing_selections FOR SELECT
  USING (auth.uid() = partner_user_id);

CREATE POLICY "Users can insert their own selections"
  ON public.partner_listing_selections FOR INSERT
  WITH CHECK (auth.uid() = partner_user_id);

CREATE POLICY "Users can update their own selections"
  ON public.partner_listing_selections FOR UPDATE
  USING (auth.uid() = partner_user_id);

CREATE POLICY "Users can delete their own selections"
  ON public.partner_listing_selections FOR DELETE
  USING (auth.uid() = partner_user_id);

-- RLS policies for customer_projects (using memberships table)
CREATE POLICY "Users can view customer projects in their tenant"
  ON public.customer_projects FOR SELECT
  USING (tenant_id IN (
    SELECT tenant_id FROM memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can insert customer projects in their tenant"
  ON public.customer_projects FOR INSERT
  WITH CHECK (tenant_id IN (
    SELECT tenant_id FROM memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update customer projects in their tenant"
  ON public.customer_projects FOR UPDATE
  USING (tenant_id IN (
    SELECT tenant_id FROM memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete customer projects in their tenant"
  ON public.customer_projects FOR DELETE
  USING (tenant_id IN (
    SELECT tenant_id FROM memberships WHERE user_id = auth.uid()
  ));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_partner_selections_tenant ON partner_listing_selections(tenant_id);
CREATE INDEX IF NOT EXISTS idx_partner_selections_listing ON partner_listing_selections(listing_id);
CREATE INDEX IF NOT EXISTS idx_partner_selections_user ON partner_listing_selections(partner_user_id);
CREATE INDEX IF NOT EXISTS idx_customer_projects_tenant ON customer_projects(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customer_projects_contact ON customer_projects(contact_id);
CREATE INDEX IF NOT EXISTS idx_customer_projects_status ON customer_projects(status);