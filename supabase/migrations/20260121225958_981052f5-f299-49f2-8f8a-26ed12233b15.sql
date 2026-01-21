-- ============================================================
-- ETAPPE 3: SALES & FINANCING DB MIGRATION
-- Tables: partner_pipelines, investment_profiles, commissions,
--         finance_packages, self_disclosures, finance_documents
-- Properties Extension: is_public_listing, approved_at/by
-- ============================================================

-- 1. ENUMS
-- --------------------------------------------------------
CREATE TYPE public.pipeline_stage AS ENUM (
  'lead',
  'qualified',
  'proposal',
  'negotiation',
  'reservation',
  'closing',
  'won',
  'lost'
);

CREATE TYPE public.commission_status AS ENUM (
  'pending',
  'approved',
  'invoiced',
  'paid',
  'cancelled'
);

CREATE TYPE public.finance_package_status AS ENUM (
  'draft',
  'incomplete',
  'complete',
  'ready_for_handoff'
);

-- 2. SALES PARTNER TABLES
-- --------------------------------------------------------

-- Partner Pipelines (Deal Tracking)
CREATE TABLE public.partner_pipelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  property_id UUID REFERENCES public.properties(id),
  contact_id UUID REFERENCES public.contacts(id),
  stage public.pipeline_stage NOT NULL DEFAULT 'lead',
  deal_value NUMERIC,
  notes TEXT,
  expected_close_date DATE,
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pipelines_tenant ON public.partner_pipelines(tenant_id);
CREATE INDEX idx_pipelines_stage ON public.partner_pipelines(stage);
CREATE INDEX idx_pipelines_property ON public.partner_pipelines(property_id);

-- Investment Profiles (Investor Search Criteria)
CREATE TABLE public.investment_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  contact_id UUID NOT NULL REFERENCES public.contacts(id),
  min_investment NUMERIC,
  max_investment NUMERIC,
  preferred_cities TEXT[],
  preferred_property_types TEXT[],
  min_yield NUMERIC,
  max_yield NUMERIC,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_investment_profiles_tenant ON public.investment_profiles(tenant_id);
CREATE INDEX idx_investment_profiles_contact ON public.investment_profiles(contact_id);

-- Commissions (linked to user_consents for legal proof)
CREATE TABLE public.commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  pipeline_id UUID NOT NULL REFERENCES public.partner_pipelines(id),
  contact_id UUID REFERENCES public.contacts(id),
  agreement_consent_id UUID REFERENCES public.user_consents(id),
  amount NUMERIC NOT NULL,
  percentage NUMERIC,
  status public.commission_status NOT NULL DEFAULT 'pending',
  invoiced_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_commissions_tenant ON public.commissions(tenant_id);
CREATE INDEX idx_commissions_pipeline ON public.commissions(pipeline_id);
CREATE INDEX idx_commissions_status ON public.commissions(status);

-- 3. FINANCING TABLES
-- --------------------------------------------------------

-- Finance Packages (Core: links contact + property + data room)
CREATE TABLE public.finance_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  property_id UUID NOT NULL REFERENCES public.properties(id),
  contact_id UUID NOT NULL REFERENCES public.contacts(id),
  data_room_id UUID,
  summary_document_id UUID,
  status public.finance_package_status NOT NULL DEFAULT 'draft',
  requested_amount NUMERIC,
  notes TEXT,
  -- Export/Handoff fields
  exported_at TIMESTAMPTZ,
  exported_by UUID REFERENCES auth.users(id),
  external_reference TEXT,
  -- Consent check (DATA_SHARING_FUTURE_ROOM)
  data_sharing_consent_id UUID REFERENCES public.user_consents(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_finance_packages_tenant ON public.finance_packages(tenant_id);
CREATE INDEX idx_finance_packages_property ON public.finance_packages(property_id);
CREATE INDEX idx_finance_packages_status ON public.finance_packages(status);

-- Self Disclosures (JSONB data for flexibility)
CREATE TABLE public.self_disclosures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  finance_package_id UUID NOT NULL REFERENCES public.finance_packages(id),
  disclosure_data JSONB NOT NULL DEFAULT '{}',
  submitted_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_self_disclosures_package ON public.self_disclosures(finance_package_id);

-- Finance Documents (linking documents to packages)
CREATE TABLE public.finance_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  finance_package_id UUID NOT NULL REFERENCES public.finance_packages(id),
  document_id UUID NOT NULL REFERENCES public.documents(id),
  document_type TEXT NOT NULL,
  is_required BOOLEAN NOT NULL DEFAULT false,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_finance_documents_package ON public.finance_documents(finance_package_id);
CREATE UNIQUE INDEX idx_finance_documents_unique ON public.finance_documents(finance_package_id, document_id);

-- 4. PROPERTIES EXTENSION
-- --------------------------------------------------------
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS is_public_listing BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS public_listing_approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS public_listing_approved_by UUID REFERENCES auth.users(id);

CREATE INDEX idx_properties_public_listing ON public.properties(is_public_listing) WHERE is_public_listing = true;

-- 5. RLS POLICIES
-- --------------------------------------------------------

-- Enable RLS on all new tables
ALTER TABLE public.partner_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investment_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.self_disclosures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_documents ENABLE ROW LEVEL SECURITY;

-- Partner Pipelines: tenant-scoped + platform_admin
CREATE POLICY "pp_select_member" ON public.partner_pipelines FOR SELECT
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = partner_pipelines.tenant_id));
CREATE POLICY "pp_select_platform_admin" ON public.partner_pipelines FOR SELECT
  USING (is_platform_admin());
CREATE POLICY "pp_insert_member" ON public.partner_pipelines FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = partner_pipelines.tenant_id AND m.role IN ('org_admin', 'internal_ops', 'sales_partner')));
CREATE POLICY "pp_insert_platform_admin" ON public.partner_pipelines FOR INSERT
  WITH CHECK (is_platform_admin());
CREATE POLICY "pp_update_member" ON public.partner_pipelines FOR UPDATE
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = partner_pipelines.tenant_id AND m.role IN ('org_admin', 'internal_ops', 'sales_partner')));
CREATE POLICY "pp_update_platform_admin" ON public.partner_pipelines FOR UPDATE
  USING (is_platform_admin());
CREATE POLICY "pp_delete_admin" ON public.partner_pipelines FOR DELETE
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = partner_pipelines.tenant_id AND m.role = 'org_admin'));
CREATE POLICY "pp_delete_platform_admin" ON public.partner_pipelines FOR DELETE
  USING (is_platform_admin());

-- Investment Profiles: tenant-scoped + platform_admin
CREATE POLICY "ip_select_member" ON public.investment_profiles FOR SELECT
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = investment_profiles.tenant_id));
CREATE POLICY "ip_select_platform_admin" ON public.investment_profiles FOR SELECT
  USING (is_platform_admin());
CREATE POLICY "ip_insert_member" ON public.investment_profiles FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = investment_profiles.tenant_id AND m.role IN ('org_admin', 'internal_ops', 'sales_partner')));
CREATE POLICY "ip_insert_platform_admin" ON public.investment_profiles FOR INSERT
  WITH CHECK (is_platform_admin());
CREATE POLICY "ip_update_member" ON public.investment_profiles FOR UPDATE
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = investment_profiles.tenant_id AND m.role IN ('org_admin', 'internal_ops', 'sales_partner')));
CREATE POLICY "ip_update_platform_admin" ON public.investment_profiles FOR UPDATE
  USING (is_platform_admin());
CREATE POLICY "ip_delete_admin" ON public.investment_profiles FOR DELETE
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = investment_profiles.tenant_id AND m.role = 'org_admin'));
CREATE POLICY "ip_delete_platform_admin" ON public.investment_profiles FOR DELETE
  USING (is_platform_admin());

-- Commissions: platform_admin only for CUD (sensitive), tenant-scoped for SELECT
CREATE POLICY "com_select_member" ON public.commissions FOR SELECT
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = commissions.tenant_id));
CREATE POLICY "com_select_platform_admin" ON public.commissions FOR SELECT
  USING (is_platform_admin());
CREATE POLICY "com_insert_platform_admin" ON public.commissions FOR INSERT
  WITH CHECK (is_platform_admin());
CREATE POLICY "com_update_platform_admin" ON public.commissions FOR UPDATE
  USING (is_platform_admin());
CREATE POLICY "com_delete_platform_admin" ON public.commissions FOR DELETE
  USING (is_platform_admin());

-- Finance Packages: tenant-scoped + platform_admin
CREATE POLICY "fp_select_member" ON public.finance_packages FOR SELECT
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = finance_packages.tenant_id));
CREATE POLICY "fp_select_platform_admin" ON public.finance_packages FOR SELECT
  USING (is_platform_admin());
CREATE POLICY "fp_insert_member" ON public.finance_packages FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = finance_packages.tenant_id AND m.role IN ('org_admin', 'internal_ops')));
CREATE POLICY "fp_insert_platform_admin" ON public.finance_packages FOR INSERT
  WITH CHECK (is_platform_admin());
CREATE POLICY "fp_update_member" ON public.finance_packages FOR UPDATE
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = finance_packages.tenant_id AND m.role IN ('org_admin', 'internal_ops')));
CREATE POLICY "fp_update_platform_admin" ON public.finance_packages FOR UPDATE
  USING (is_platform_admin());
CREATE POLICY "fp_delete_admin" ON public.finance_packages FOR DELETE
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = finance_packages.tenant_id AND m.role = 'org_admin'));
CREATE POLICY "fp_delete_platform_admin" ON public.finance_packages FOR DELETE
  USING (is_platform_admin());

-- Self Disclosures: tenant-scoped + platform_admin
CREATE POLICY "sd_select_member" ON public.self_disclosures FOR SELECT
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = self_disclosures.tenant_id));
CREATE POLICY "sd_select_platform_admin" ON public.self_disclosures FOR SELECT
  USING (is_platform_admin());
CREATE POLICY "sd_insert_member" ON public.self_disclosures FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = self_disclosures.tenant_id));
CREATE POLICY "sd_insert_platform_admin" ON public.self_disclosures FOR INSERT
  WITH CHECK (is_platform_admin());
CREATE POLICY "sd_update_member" ON public.self_disclosures FOR UPDATE
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = self_disclosures.tenant_id));
CREATE POLICY "sd_update_platform_admin" ON public.self_disclosures FOR UPDATE
  USING (is_platform_admin());
CREATE POLICY "sd_delete_admin" ON public.self_disclosures FOR DELETE
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = self_disclosures.tenant_id AND m.role = 'org_admin'));
CREATE POLICY "sd_delete_platform_admin" ON public.self_disclosures FOR DELETE
  USING (is_platform_admin());

-- Finance Documents: tenant-scoped + platform_admin
CREATE POLICY "fd_select_member" ON public.finance_documents FOR SELECT
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = finance_documents.tenant_id));
CREATE POLICY "fd_select_platform_admin" ON public.finance_documents FOR SELECT
  USING (is_platform_admin());
CREATE POLICY "fd_insert_member" ON public.finance_documents FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = finance_documents.tenant_id AND m.role IN ('org_admin', 'internal_ops')));
CREATE POLICY "fd_insert_platform_admin" ON public.finance_documents FOR INSERT
  WITH CHECK (is_platform_admin());
CREATE POLICY "fd_update_member" ON public.finance_documents FOR UPDATE
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = finance_documents.tenant_id AND m.role IN ('org_admin', 'internal_ops')));
CREATE POLICY "fd_update_platform_admin" ON public.finance_documents FOR UPDATE
  USING (is_platform_admin());
CREATE POLICY "fd_delete_admin" ON public.finance_documents FOR DELETE
  USING (EXISTS (SELECT 1 FROM memberships m WHERE m.user_id = auth.uid() AND m.tenant_id = finance_documents.tenant_id AND m.role = 'org_admin'));
CREATE POLICY "fd_delete_platform_admin" ON public.finance_documents FOR DELETE
  USING (is_platform_admin());