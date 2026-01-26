-- =====================================================
-- PHASE 1: ENUMS + CORE TABLES WITH PROPER CONSTRAINTS
-- =====================================================

-- 1. ENUMS
DO $$ BEGIN
  CREATE TYPE listing_status AS ENUM ('draft', 'internal_review', 'active', 'reserved', 'sold', 'withdrawn');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE lead_status AS ENUM ('new', 'contacted', 'qualified', 'converted', 'lost');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE deal_stage AS ENUM ('lead', 'qualified', 'proposal', 'negotiation', 'reservation', 'closing', 'won', 'lost');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE finance_case_status AS ENUM ('draft', 'collecting', 'ready', 'blocked', 'exported', 'submitted', 'acknowledged', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE partner_verification_status AS ENUM ('pending', 'documents_submitted', 'under_review', 'approved', 'rejected', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE publication_channel AS ENUM ('kaufy', 'scout24', 'kleinanzeigen', 'partner_network');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE publication_status AS ENUM ('pending', 'active', 'paused', 'expired', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE lead_source AS ENUM ('zone1_pool', 'meta_self', 'meta_property', 'referral', 'manual', 'kaufy_website');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. LISTINGS TABLE (primary table for MOD-06)
CREATE TABLE IF NOT EXISTS public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id),
  property_id UUID NOT NULL,
  public_id TEXT UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  asking_price NUMERIC,
  commission_rate NUMERIC CHECK (commission_rate >= 0 AND commission_rate <= 100),
  status listing_status DEFAULT 'draft',
  partner_visibility TEXT DEFAULT 'none',
  expose_document_id UUID REFERENCES documents(id),
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT listings_tenant_property_fk 
    FOREIGN KEY (tenant_id, property_id) 
    REFERENCES properties(tenant_id, id),
  CONSTRAINT listings_tenant_id_unique UNIQUE (tenant_id, id)
);

-- 3. FINANCE CASES (MOD-07) - standalone, no child tables yet
CREATE TABLE IF NOT EXISTS public.finance_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id),
  public_id TEXT UNIQUE,
  case_code TEXT,
  scope_type TEXT DEFAULT 'property',
  primary_property_id UUID,
  included_property_ids UUID[],
  purpose TEXT,
  status finance_case_status DEFAULT 'draft',
  responsible_user_id UUID,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT finance_cases_tenant_id_unique UNIQUE (tenant_id, id)
);

-- 4. LEADS (MOD-10)
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES organizations(id),
  public_id TEXT UNIQUE,
  source lead_source NOT NULL,
  source_campaign_id UUID,
  contact_id UUID REFERENCES contacts(id),
  assigned_partner_id UUID REFERENCES organizations(id),
  status lead_status DEFAULT 'new',
  interest_type TEXT,
  property_interest_id UUID,
  budget_min NUMERIC,
  budget_max NUMERIC,
  notes TEXT,
  zone1_pool BOOLEAN DEFAULT false,
  assigned_at TIMESTAMPTZ,
  assigned_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. SCRAPER PROVIDERS (MOD-08 - global registry)
CREATE TABLE IF NOT EXISTS public.scraper_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  provider_type TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. PARTNER VERIFICATIONS (MOD-09 - Zone 1 managed)
CREATE TABLE IF NOT EXISTS public.partner_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_org_id UUID NOT NULL REFERENCES organizations(id),
  status partner_verification_status DEFAULT 'pending',
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  documents JSONB DEFAULT '[]',
  notes TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. AD CAMPAIGNS (MOD-10)
CREATE TABLE IF NOT EXISTS public.ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id),
  name TEXT NOT NULL,
  platform TEXT DEFAULT 'meta',
  campaign_type TEXT,
  status TEXT DEFAULT 'draft',
  budget_cents INTEGER,
  external_campaign_id TEXT,
  property_id UUID,
  targeting JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. PARTNER DEALS (MOD-10)
CREATE TABLE IF NOT EXISTS public.partner_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id),
  lead_id UUID REFERENCES leads(id),
  contact_id UUID REFERENCES contacts(id),
  property_id UUID,
  stage deal_stage DEFAULT 'lead',
  deal_value NUMERIC,
  expected_close_date DATE,
  actual_close_date DATE,
  commission_rate NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on core tables
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_deals ENABLE ROW LEVEL SECURITY;

-- Indexes for core tables
CREATE INDEX IF NOT EXISTS idx_listings_tenant ON listings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_finance_cases_tenant ON finance_cases(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_tenant ON leads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_zone1_pool ON leads(zone1_pool) WHERE zone1_pool = true;
CREATE INDEX IF NOT EXISTS idx_deals_tenant ON partner_deals(tenant_id);

-- RLS POLICIES FOR CORE TABLES

-- LISTINGS
CREATE POLICY "listings_select_member" ON listings FOR SELECT
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = listings.tenant_id));
CREATE POLICY "listings_select_platform_admin" ON listings FOR SELECT USING (is_platform_admin());
CREATE POLICY "listings_insert_member" ON listings FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = listings.tenant_id AND m.role IN ('org_admin', 'internal_ops')));
CREATE POLICY "listings_insert_platform_admin" ON listings FOR INSERT WITH CHECK (is_platform_admin());
CREATE POLICY "listings_update_member" ON listings FOR UPDATE
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = listings.tenant_id AND m.role IN ('org_admin', 'internal_ops')));
CREATE POLICY "listings_update_platform_admin" ON listings FOR UPDATE USING (is_platform_admin());
CREATE POLICY "listings_delete_admin" ON listings FOR DELETE
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = listings.tenant_id AND m.role = 'org_admin'));
CREATE POLICY "listings_delete_platform_admin" ON listings FOR DELETE USING (is_platform_admin());

-- FINANCE CASES
CREATE POLICY "fc_select_member" ON finance_cases FOR SELECT
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = finance_cases.tenant_id));
CREATE POLICY "fc_select_platform_admin" ON finance_cases FOR SELECT USING (is_platform_admin());
CREATE POLICY "fc_insert_member" ON finance_cases FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = finance_cases.tenant_id AND m.role IN ('org_admin', 'internal_ops')));
CREATE POLICY "fc_insert_platform_admin" ON finance_cases FOR INSERT WITH CHECK (is_platform_admin());
CREATE POLICY "fc_update_member" ON finance_cases FOR UPDATE
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = finance_cases.tenant_id AND m.role IN ('org_admin', 'internal_ops')));
CREATE POLICY "fc_update_platform_admin" ON finance_cases FOR UPDATE USING (is_platform_admin());

-- LEADS
CREATE POLICY "leads_select_member" ON leads FOR SELECT
  USING (tenant_id IS NOT NULL AND EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = leads.tenant_id));
CREATE POLICY "leads_select_platform_admin" ON leads FOR SELECT USING (is_platform_admin());
CREATE POLICY "leads_insert_platform_admin" ON leads FOR INSERT WITH CHECK (is_platform_admin());
CREATE POLICY "leads_update_member" ON leads FOR UPDATE
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = leads.tenant_id AND m.role IN ('org_admin', 'internal_ops', 'sales_partner')));
CREATE POLICY "leads_update_platform_admin" ON leads FOR UPDATE USING (is_platform_admin());

-- PARTNER VERIFICATIONS (Zone 1 only)
CREATE POLICY "pv_select_platform_admin" ON partner_verifications FOR SELECT USING (is_platform_admin());
CREATE POLICY "pv_insert_platform_admin" ON partner_verifications FOR INSERT WITH CHECK (is_platform_admin());
CREATE POLICY "pv_update_platform_admin" ON partner_verifications FOR UPDATE USING (is_platform_admin());
CREATE POLICY "pv_select_own" ON partner_verifications FOR SELECT
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = partner_verifications.partner_org_id));

-- PARTNER DEALS
CREATE POLICY "pd_select_member" ON partner_deals FOR SELECT
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = partner_deals.tenant_id));
CREATE POLICY "pd_select_platform_admin" ON partner_deals FOR SELECT USING (is_platform_admin());
CREATE POLICY "pd_insert_member" ON partner_deals FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = partner_deals.tenant_id AND m.role IN ('org_admin', 'internal_ops', 'sales_partner')));
CREATE POLICY "pd_insert_platform_admin" ON partner_deals FOR INSERT WITH CHECK (is_platform_admin());
CREATE POLICY "pd_update_member" ON partner_deals FOR UPDATE
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = partner_deals.tenant_id AND m.role IN ('org_admin', 'internal_ops', 'sales_partner')));
CREATE POLICY "pd_update_platform_admin" ON partner_deals FOR UPDATE USING (is_platform_admin());

-- AD CAMPAIGNS
CREATE POLICY "ac_select_member" ON ad_campaigns FOR SELECT
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = ad_campaigns.tenant_id));
CREATE POLICY "ac_select_platform_admin" ON ad_campaigns FOR SELECT USING (is_platform_admin());
CREATE POLICY "ac_insert_member" ON ad_campaigns FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = ad_campaigns.tenant_id AND m.role IN ('org_admin', 'internal_ops', 'sales_partner')));
CREATE POLICY "ac_update_member" ON ad_campaigns FOR UPDATE
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = ad_campaigns.tenant_id AND m.role IN ('org_admin', 'internal_ops', 'sales_partner')));

-- SCRAPER PROVIDERS (global)
CREATE POLICY "sp_select_active" ON scraper_providers FOR SELECT USING (is_active = true);
CREATE POLICY "sp_all_platform_admin" ON scraper_providers FOR ALL USING (is_platform_admin());