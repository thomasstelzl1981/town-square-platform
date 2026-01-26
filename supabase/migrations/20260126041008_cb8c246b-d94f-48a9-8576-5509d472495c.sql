-- =====================================================
-- PHASE 2A: FIX CONSTRAINTS + REMAINING CHILD TABLES
-- =====================================================

-- Add UNIQUE constraint to investment_profiles for composite FK
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'investment_profiles_tenant_id_unique') THEN
    ALTER TABLE investment_profiles ADD CONSTRAINT investment_profiles_tenant_id_unique UNIQUE (tenant_id, id);
  END IF;
END $$;

-- Add UNIQUE constraint to leases for composite FK
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leases_tenant_id_unique') THEN
    ALTER TABLE leases ADD CONSTRAINT leases_tenant_id_unique UNIQUE (tenant_id, id);
  END IF;
END $$;

-- 11. INVESTMENT FAVORITES (depends on investment_profiles)
CREATE TABLE IF NOT EXISTS public.investment_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id),
  investment_profile_id UUID NOT NULL,
  external_listing_url TEXT,
  external_listing_id TEXT,
  source TEXT,
  title TEXT,
  price NUMERIC,
  location TEXT,
  property_data JSONB DEFAULT '{}',
  notes TEXT,
  status TEXT DEFAULT 'active',
  synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT if_tenant_profile_fk FOREIGN KEY (tenant_id, investment_profile_id) REFERENCES investment_profiles(tenant_id, id)
);

-- 12. INVESTMENT SEARCHES (depends on investment_profiles)
CREATE TABLE IF NOT EXISTS public.investment_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id),
  investment_profile_id UUID NOT NULL,
  name TEXT NOT NULL,
  search_criteria JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  result_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT is_tenant_profile_fk FOREIGN KEY (tenant_id, investment_profile_id) REFERENCES investment_profiles(tenant_id, id)
);

-- 13. SCRAPER JOBS (depends on scraper_providers)
CREATE TABLE IF NOT EXISTS public.scraper_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id),
  provider_id UUID NOT NULL REFERENCES scraper_providers(id),
  investment_search_id UUID,
  status TEXT DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  result_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 14. SCRAPER RESULTS (depends on scraper_jobs)
CREATE TABLE IF NOT EXISTS public.scraper_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id),
  job_id UUID NOT NULL REFERENCES scraper_jobs(id),
  external_id TEXT,
  source_url TEXT,
  data JSONB NOT NULL DEFAULT '{}',
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 15. LEAD ASSIGNMENTS (depends on leads)
CREATE TABLE IF NOT EXISTS public.lead_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id),
  partner_org_id UUID NOT NULL REFERENCES organizations(id),
  status TEXT DEFAULT 'pending',
  offered_at TIMESTAMPTZ DEFAULT now(),
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 16. LEAD ACTIVITIES (depends on leads and partner_deals)
CREATE TABLE IF NOT EXISTS public.lead_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id),
  lead_id UUID REFERENCES leads(id),
  deal_id UUID REFERENCES partner_deals(id),
  activity_type TEXT NOT NULL,
  description TEXT,
  performed_by UUID,
  performed_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}'
);

-- 17. AD CAMPAIGN LEADS (depends on ad_campaigns and leads)
CREATE TABLE IF NOT EXISTS public.ad_campaign_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES ad_campaigns(id),
  lead_id UUID NOT NULL REFERENCES leads(id),
  cost_cents INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 18. MSV TABLES (MOD-05)
CREATE TABLE IF NOT EXISTS public.rent_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id),
  lease_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  payment_method TEXT,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT rp_tenant_lease_fk FOREIGN KEY (tenant_id, lease_id) REFERENCES leases(tenant_id, id)
);

CREATE TABLE IF NOT EXISTS public.rent_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id),
  lease_id UUID NOT NULL,
  payment_id UUID REFERENCES rent_payments(id),
  reminder_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ,
  channel TEXT DEFAULT 'email',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT rr_tenant_lease_fk FOREIGN KEY (tenant_id, lease_id) REFERENCES leases(tenant_id, id)
);

CREATE TABLE IF NOT EXISTS public.msv_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES organizations(id),
  property_id UUID NOT NULL,
  status TEXT DEFAULT 'active',
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  enrolled_by UUID,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT me_tenant_property_fk FOREIGN KEY (tenant_id, property_id) REFERENCES properties(tenant_id, id)
);

-- ENABLE RLS
ALTER TABLE investment_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE investment_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scraper_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_campaign_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE rent_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rent_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE msv_enrollments ENABLE ROW LEVEL SECURITY;

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_investment_favorites_tenant ON investment_favorites(tenant_id);
CREATE INDEX IF NOT EXISTS idx_investment_searches_tenant ON investment_searches(tenant_id);

-- RLS POLICIES

-- Investment Favorites
CREATE POLICY "if_select_member" ON investment_favorites FOR SELECT
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = investment_favorites.tenant_id));
CREATE POLICY "if_insert_member" ON investment_favorites FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = investment_favorites.tenant_id));
CREATE POLICY "if_update_member" ON investment_favorites FOR UPDATE
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = investment_favorites.tenant_id));
CREATE POLICY "if_delete_member" ON investment_favorites FOR DELETE
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = investment_favorites.tenant_id));

-- Investment Searches
CREATE POLICY "is_select_member" ON investment_searches FOR SELECT
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = investment_searches.tenant_id));
CREATE POLICY "is_insert_member" ON investment_searches FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = investment_searches.tenant_id));
CREATE POLICY "is_update_member" ON investment_searches FOR UPDATE
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = investment_searches.tenant_id));

-- Scraper Jobs
CREATE POLICY "sj_select_member" ON scraper_jobs FOR SELECT
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = scraper_jobs.tenant_id));
CREATE POLICY "sj_insert_platform_admin" ON scraper_jobs FOR INSERT WITH CHECK (is_platform_admin());

-- Scraper Results
CREATE POLICY "sr_select_member" ON scraper_results FOR SELECT
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = scraper_results.tenant_id));

-- Lead Assignments
CREATE POLICY "la_select_platform_admin" ON lead_assignments FOR SELECT USING (is_platform_admin());
CREATE POLICY "la_select_partner" ON lead_assignments FOR SELECT
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = lead_assignments.partner_org_id));
CREATE POLICY "la_insert_platform_admin" ON lead_assignments FOR INSERT WITH CHECK (is_platform_admin());
CREATE POLICY "la_update_partner" ON lead_assignments FOR UPDATE
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = lead_assignments.partner_org_id));

-- Lead Activities
CREATE POLICY "lact_select_member" ON lead_activities FOR SELECT
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = lead_activities.tenant_id));
CREATE POLICY "lact_insert_member" ON lead_activities FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = lead_activities.tenant_id));

-- Ad Campaign Leads
CREATE POLICY "acl_select_platform_admin" ON ad_campaign_leads FOR SELECT USING (is_platform_admin());
CREATE POLICY "acl_insert_platform_admin" ON ad_campaign_leads FOR INSERT WITH CHECK (is_platform_admin());

-- MSV Tables
CREATE POLICY "rp_select_member" ON rent_payments FOR SELECT
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = rent_payments.tenant_id));
CREATE POLICY "rp_insert_member" ON rent_payments FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = rent_payments.tenant_id AND m.role IN ('org_admin', 'internal_ops')));
CREATE POLICY "rp_update_member" ON rent_payments FOR UPDATE
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = rent_payments.tenant_id AND m.role IN ('org_admin', 'internal_ops')));

CREATE POLICY "rr_select_member" ON rent_reminders FOR SELECT
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = rent_reminders.tenant_id));
CREATE POLICY "rr_insert_member" ON rent_reminders FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = rent_reminders.tenant_id AND m.role IN ('org_admin', 'internal_ops')));

CREATE POLICY "me_select_member" ON msv_enrollments FOR SELECT
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = msv_enrollments.tenant_id));
CREATE POLICY "me_insert_member" ON msv_enrollments FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = msv_enrollments.tenant_id AND m.role IN ('org_admin', 'internal_ops')));
CREATE POLICY "me_update_member" ON msv_enrollments FOR UPDATE
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = msv_enrollments.tenant_id AND m.role IN ('org_admin', 'internal_ops')));