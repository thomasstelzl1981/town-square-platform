
-- =============================================
-- landing_pages: Stores generated project websites
-- =============================================
CREATE TABLE public.landing_pages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid NOT NULL REFERENCES public.dev_projects(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  slug text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  developer_website_url text,
  hero_headline text,
  hero_subheadline text,
  location_description text,
  about_text text,
  contact_email text,
  contact_phone text,
  published_at timestamptz,
  preview_expires_at timestamptz,
  locked_at timestamptz,
  booked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid,
  CONSTRAINT landing_pages_slug_unique UNIQUE (slug)
);

-- Validation trigger for status values
CREATE OR REPLACE FUNCTION public.validate_landing_page_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status NOT IN ('draft', 'preview', 'active', 'locked') THEN
    RAISE EXCEPTION 'Invalid landing page status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_validate_landing_page_status
  BEFORE INSERT OR UPDATE ON public.landing_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_landing_page_status();

-- Auto-update updated_at
CREATE TRIGGER update_landing_pages_updated_at
  BEFORE UPDATE ON public.landing_pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes
CREATE INDEX idx_landing_pages_project_id ON public.landing_pages(project_id);
CREATE INDEX idx_landing_pages_organization_id ON public.landing_pages(organization_id);
CREATE INDEX idx_landing_pages_slug ON public.landing_pages(slug);
CREATE INDEX idx_landing_pages_status ON public.landing_pages(status);

-- Enable RLS
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

-- RLS: Anon can read published/active pages by slug (public website access)
CREATE POLICY "Public can view active landing pages"
  ON public.landing_pages
  FOR SELECT
  USING (status IN ('preview', 'active'));

-- RLS: Authenticated org members can read their own org's landing pages (incl. drafts)
CREATE POLICY "Org members can read own landing pages"
  ON public.landing_pages
  FOR SELECT
  USING (
    organization_id IN (
      SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

-- RLS: Authenticated org members can insert landing pages for their org
CREATE POLICY "Org members can insert landing pages"
  ON public.landing_pages
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

-- RLS: Authenticated org members can update their org's landing pages
CREATE POLICY "Org members can update landing pages"
  ON public.landing_pages
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

-- RLS: Platform admins can do everything (via user_roles)
CREATE POLICY "Admins can manage all landing pages"
  ON public.landing_pages
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'platform_admin'
    )
  );
