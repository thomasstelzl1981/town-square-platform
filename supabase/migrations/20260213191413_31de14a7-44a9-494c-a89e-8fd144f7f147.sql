
-- ============================================================================
-- MOD-21 WEBSITE BUILDER — Database Schema
-- 5 Tables: tenant_websites, website_pages, website_sections, website_versions, hosting_contracts
-- ============================================================================

-- 1. tenant_websites
CREATE TABLE public.tenant_websites (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.organizations(id),
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  industry text,
  target_audience text,
  goal text NOT NULL DEFAULT 'branding',
  branding_json jsonb NOT NULL DEFAULT '{}',
  seo_json jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.tenant_websites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tw_select" ON public.tenant_websites FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "tw_insert" ON public.tenant_websites FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id() AND created_by = auth.uid());

CREATE POLICY "tw_update" ON public.tenant_websites FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "tw_delete" ON public.tenant_websites FOR DELETE
  USING (tenant_id = public.get_user_tenant_id());

-- Public read for Zone 3 renderer (by slug, only published)
CREATE POLICY "tw_public_read" ON public.tenant_websites FOR SELECT
  USING (status = 'published');

CREATE TRIGGER update_tenant_websites_updated_at
  BEFORE UPDATE ON public.tenant_websites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. website_pages
CREATE TABLE public.website_pages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  website_id uuid NOT NULL REFERENCES public.tenant_websites(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.organizations(id),
  slug text NOT NULL DEFAULT 'home',
  title text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.website_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wp_select" ON public.website_pages FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "wp_insert" ON public.website_pages FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "wp_update" ON public.website_pages FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "wp_delete" ON public.website_pages FOR DELETE
  USING (tenant_id = public.get_user_tenant_id());

-- 3. website_sections
CREATE TABLE public.website_sections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id uuid NOT NULL REFERENCES public.website_pages(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.organizations(id),
  section_type text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  content_json jsonb NOT NULL DEFAULT '{}',
  design_json jsonb NOT NULL DEFAULT '{}',
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.website_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ws_select" ON public.website_sections FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "ws_insert" ON public.website_sections FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "ws_update" ON public.website_sections FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "ws_delete" ON public.website_sections FOR DELETE
  USING (tenant_id = public.get_user_tenant_id());

CREATE TRIGGER update_website_sections_updated_at
  BEFORE UPDATE ON public.website_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. website_versions (publish snapshots)
CREATE TABLE public.website_versions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  website_id uuid NOT NULL REFERENCES public.tenant_websites(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.organizations(id),
  snapshot_json jsonb NOT NULL,
  version_number int NOT NULL,
  published_by uuid NOT NULL REFERENCES public.profiles(id),
  published_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.website_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "wv_select" ON public.website_versions FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "wv_insert" ON public.website_versions FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id());

-- Public read for Zone 3 renderer
CREATE POLICY "wv_public_read" ON public.website_versions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.tenant_websites tw 
    WHERE tw.id = website_versions.website_id 
    AND tw.status = 'published'
  ));

-- 5. hosting_contracts
CREATE TABLE public.hosting_contracts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.organizations(id),
  website_id uuid NOT NULL REFERENCES public.tenant_websites(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'basic',
  price_cents int NOT NULL DEFAULT 5000,
  currency text NOT NULL DEFAULT 'EUR',
  status text NOT NULL DEFAULT 'pending',
  stripe_subscription_id text,
  stripe_customer_id text,
  accepted_terms_at timestamptz,
  content_responsibility_confirmed boolean NOT NULL DEFAULT false,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hosting_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hc_select" ON public.hosting_contracts FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "hc_insert" ON public.hosting_contracts FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "hc_update" ON public.hosting_contracts FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id());

-- Admin policy for webhook/Zone 1 updates
CREATE POLICY "hc_admin" ON public.hosting_contracts FOR ALL
  USING (public.is_platform_admin());

CREATE TRIGGER update_hosting_contracts_updated_at
  BEFORE UPDATE ON public.hosting_contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_tenant_websites_tenant ON public.tenant_websites(tenant_id);
CREATE INDEX idx_tenant_websites_slug ON public.tenant_websites(slug);
CREATE INDEX idx_website_pages_website ON public.website_pages(website_id);
CREATE INDEX idx_website_sections_page ON public.website_sections(page_id);
CREATE INDEX idx_website_versions_website ON public.website_versions(website_id);
CREATE INDEX idx_hosting_contracts_tenant ON public.hosting_contracts(tenant_id);
CREATE INDEX idx_hosting_contracts_website ON public.hosting_contracts(website_id);
CREATE INDEX idx_hosting_contracts_stripe ON public.hosting_contracts(stripe_subscription_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.tenant_websites;
ALTER PUBLICATION supabase_realtime ADD TABLE public.website_sections;

-- Storage bucket for website assets
INSERT INTO storage.buckets (id, name, public) VALUES ('website-assets', 'website-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "wa_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'website-assets');

CREATE POLICY "wa_tenant_upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'website-assets' AND auth.uid() IS NOT NULL);

CREATE POLICY "wa_tenant_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'website-assets' AND auth.uid() IS NOT NULL);

CREATE POLICY "wa_tenant_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'website-assets' AND auth.uid() IS NOT NULL);
