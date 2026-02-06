-- ============================================================================
-- ACQ PHASE 3-6: Contact Staging, Outbound/Inbound, Offers, Analysis
-- ============================================================================

-- ==========================
-- CONTACT STAGING (Apollo, Apify, Firecrawl, Manual)
-- ==========================
CREATE TABLE public.contact_staging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  mandate_id uuid REFERENCES public.acq_mandates(id) ON DELETE SET NULL,
  
  -- Source
  source text NOT NULL CHECK (source IN ('apollo', 'apify', 'firecrawl', 'manual', 'geomap')),
  source_id text,
  source_url text,
  
  -- Contact Data
  company_name text,
  first_name text,
  last_name text,
  email text,
  phone text,
  website_url text,
  
  -- Enrichment
  role_guess text,
  service_area text,
  quality_score numeric DEFAULT 0,
  dedupe_key text,
  enrichment_data jsonb DEFAULT '{}'::jsonb,
  
  -- Approval workflow
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'merged')),
  approved_at timestamptz,
  approved_by uuid REFERENCES auth.users(id),
  merged_contact_id uuid REFERENCES public.contacts(id),
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_contact_staging_tenant ON public.contact_staging(tenant_id);
CREATE INDEX idx_contact_staging_mandate ON public.contact_staging(mandate_id);
CREATE INDEX idx_contact_staging_status ON public.contact_staging(status);
CREATE INDEX idx_contact_staging_dedupe ON public.contact_staging(dedupe_key);
CREATE INDEX idx_contact_staging_email ON public.contact_staging(email);

-- Dedupe key auto-generation
CREATE OR REPLACE FUNCTION generate_contact_dedupe_key()
RETURNS TRIGGER AS $$
BEGIN
  NEW.dedupe_key := LOWER(COALESCE(NEW.email, '') || '|' || COALESCE(NEW.company_name, '') || '|' || COALESCE(NEW.phone, ''));
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_contact_staging_dedupe
  BEFORE INSERT OR UPDATE ON public.contact_staging
  FOR EACH ROW EXECUTE FUNCTION generate_contact_dedupe_key();

-- RLS
ALTER TABLE public.contact_staging ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins full access on contact_staging"
  ON public.contact_staging FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
  );

CREATE POLICY "AkquiseManagers access own mandate staging"
  ON public.contact_staging FOR ALL
  USING (
    mandate_id IN (
      SELECT id FROM public.acq_mandates 
      WHERE assigned_manager_user_id = auth.uid()
    )
  );

-- ==========================
-- USER-CONTACT LINKS (Manager's contact book)
-- ==========================
CREATE TABLE public.user_contact_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  mandate_id uuid REFERENCES public.acq_mandates(id) ON DELETE SET NULL,
  folder text,
  in_outreach_queue boolean DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, contact_id)
);

CREATE INDEX idx_user_contact_links_user ON public.user_contact_links(user_id);
CREATE INDEX idx_user_contact_links_contact ON public.user_contact_links(contact_id);
CREATE INDEX idx_user_contact_links_mandate ON public.user_contact_links(mandate_id);
CREATE INDEX idx_user_contact_links_outreach ON public.user_contact_links(in_outreach_queue) WHERE in_outreach_queue = true;

ALTER TABLE public.user_contact_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own contact links"
  ON public.user_contact_links FOR ALL
  USING (user_id = auth.uid());

-- ==========================
-- ACQ OUTBOUND MESSAGES (Resend API)
-- ==========================
CREATE TYPE acq_outbound_status AS ENUM ('queued', 'sending', 'sent', 'delivered', 'opened', 'bounced', 'replied', 'failed');

CREATE TABLE public.acq_outbound_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id uuid NOT NULL REFERENCES public.acq_mandates(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  
  -- Resend integration
  resend_message_id text,
  template_code text NOT NULL,
  subject text NOT NULL,
  body_html text,
  body_text text,
  
  -- Status tracking
  status acq_outbound_status NOT NULL DEFAULT 'queued',
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  bounced_at timestamptz,
  replied_at timestamptz,
  
  -- Routing token for inbound matching
  routing_token text UNIQUE,
  
  -- Error info
  error_message text,
  
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_acq_outbound_mandate ON public.acq_outbound_messages(mandate_id);
CREATE INDEX idx_acq_outbound_contact ON public.acq_outbound_messages(contact_id);
CREATE INDEX idx_acq_outbound_status ON public.acq_outbound_messages(status);
CREATE INDEX idx_acq_outbound_routing ON public.acq_outbound_messages(routing_token);

-- Auto-generate routing token
CREATE OR REPLACE FUNCTION generate_acq_routing_token()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.routing_token IS NULL THEN
    NEW.routing_token := encode(gen_random_bytes(16), 'hex');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_acq_outbound_routing
  BEFORE INSERT ON public.acq_outbound_messages
  FOR EACH ROW EXECUTE FUNCTION generate_acq_routing_token();

ALTER TABLE public.acq_outbound_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "AkquiseManagers access own mandate outbound"
  ON public.acq_outbound_messages FOR ALL
  USING (
    mandate_id IN (
      SELECT id FROM public.acq_mandates 
      WHERE assigned_manager_user_id = auth.uid()
    )
  );

CREATE POLICY "Platform admins full access on acq_outbound"
  ON public.acq_outbound_messages FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
  );

-- ==========================
-- ACQ INBOUND MESSAGES (Resend Webhook)
-- ==========================
CREATE TYPE acq_routing_method AS ENUM ('token', 'email_match', 'thread', 'ai_fallback', 'manual');

CREATE TABLE public.acq_inbound_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id uuid REFERENCES public.acq_mandates(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  
  -- Resend webhook data
  resend_inbound_id text,
  from_email text NOT NULL,
  to_email text,
  subject text,
  body_text text,
  body_html text,
  attachments jsonb DEFAULT '[]'::jsonb,
  
  -- Routing
  routing_method acq_routing_method,
  routing_confidence numeric DEFAULT 0,
  needs_routing boolean DEFAULT true,
  routed_at timestamptz,
  routed_by uuid REFERENCES auth.users(id),
  
  -- Related outbound (for thread matching)
  in_reply_to_message_id uuid REFERENCES public.acq_outbound_messages(id),
  
  received_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_acq_inbound_mandate ON public.acq_inbound_messages(mandate_id);
CREATE INDEX idx_acq_inbound_contact ON public.acq_inbound_messages(contact_id);
CREATE INDEX idx_acq_inbound_needs_routing ON public.acq_inbound_messages(needs_routing) WHERE needs_routing = true;
CREATE INDEX idx_acq_inbound_from_email ON public.acq_inbound_messages(from_email);

ALTER TABLE public.acq_inbound_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "AkquiseManagers access own mandate inbound"
  ON public.acq_inbound_messages FOR ALL
  USING (
    mandate_id IN (
      SELECT id FROM public.acq_mandates 
      WHERE assigned_manager_user_id = auth.uid()
    )
  );

CREATE POLICY "Platform admins full access on acq_inbound"
  ON public.acq_inbound_messages FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
  );

-- ==========================
-- ACQ OFFERS (Exposés/Angebote)
-- ==========================
CREATE TYPE acq_offer_source AS ENUM ('inbound_email', 'upload', 'manual', 'portal_scrape', 'firecrawl');
CREATE TYPE acq_offer_status AS ENUM ('new', 'analyzing', 'analyzed', 'presented', 'accepted', 'rejected', 'archived');

CREATE TABLE public.acq_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mandate_id uuid NOT NULL REFERENCES public.acq_mandates(id) ON DELETE CASCADE,
  
  -- Source tracking
  source_type acq_offer_source NOT NULL DEFAULT 'manual',
  source_contact_id uuid REFERENCES public.contacts(id),
  source_inbound_id uuid REFERENCES public.acq_inbound_messages(id),
  source_url text,
  
  -- Property data
  title text,
  address text,
  postal_code text,
  city text,
  
  -- Financial data
  price_asking numeric,
  yield_indicated numeric,
  noi_indicated numeric,
  units_count integer,
  area_sqm numeric,
  year_built integer,
  
  -- Status
  status acq_offer_status NOT NULL DEFAULT 'new',
  notes text,
  
  -- AI extraction
  extracted_data jsonb DEFAULT '{}'::jsonb,
  extraction_confidence numeric,
  
  -- Analysis results
  analysis_summary jsonb DEFAULT '{}'::jsonb,
  geomap_data jsonb DEFAULT '{}'::jsonb,
  calc_bestand jsonb DEFAULT '{}'::jsonb,
  calc_aufteiler jsonb DEFAULT '{}'::jsonb,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_acq_offers_mandate ON public.acq_offers(mandate_id);
CREATE INDEX idx_acq_offers_status ON public.acq_offers(status);
CREATE INDEX idx_acq_offers_source_contact ON public.acq_offers(source_contact_id);

CREATE TRIGGER update_acq_offers_updated_at
  BEFORE UPDATE ON public.acq_offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE public.acq_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "AkquiseManagers access own mandate offers"
  ON public.acq_offers FOR ALL
  USING (
    mandate_id IN (
      SELECT id FROM public.acq_mandates 
      WHERE assigned_manager_user_id = auth.uid()
    )
  );

CREATE POLICY "Platform admins full access on acq_offers"
  ON public.acq_offers FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
  );

-- ==========================
-- ACQ OFFER DOCUMENTS
-- ==========================
CREATE TABLE public.acq_offer_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.acq_offers(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('expose', 'photos', 'grundbuch', 'teilungserklaerung', 'mietvertrag', 'wirtschaftsplan', 'other')),
  file_name text NOT NULL,
  storage_path text NOT NULL,
  mime_type text,
  file_size integer,
  extracted_text text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_acq_offer_docs_offer ON public.acq_offer_documents(offer_id);

ALTER TABLE public.acq_offer_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Access via offer ownership"
  ON public.acq_offer_documents FOR ALL
  USING (
    offer_id IN (
      SELECT o.id FROM public.acq_offers o
      JOIN public.acq_mandates m ON o.mandate_id = m.id
      WHERE m.assigned_manager_user_id = auth.uid()
    )
  );

CREATE POLICY "Platform admins full access on offer_documents"
  ON public.acq_offer_documents FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
  );

-- ==========================
-- ACQ ANALYSIS RUNS (KI Research, GeoMap, Calculator)
-- ==========================
CREATE TYPE acq_analysis_type AS ENUM ('ai_research', 'geomap', 'calc_bestand', 'calc_aufteiler', 'enrichment', 'extraction');
CREATE TYPE acq_analysis_status AS ENUM ('pending', 'running', 'completed', 'failed');

CREATE TABLE public.acq_analysis_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid REFERENCES public.acq_offers(id) ON DELETE CASCADE,
  contact_staging_id uuid REFERENCES public.contact_staging(id) ON DELETE CASCADE,
  mandate_id uuid REFERENCES public.acq_mandates(id) ON DELETE CASCADE,
  
  run_type acq_analysis_type NOT NULL,
  status acq_analysis_status NOT NULL DEFAULT 'pending',
  
  -- Input/Output
  input_data jsonb DEFAULT '{}'::jsonb,
  output_data jsonb DEFAULT '{}'::jsonb,
  error_message text,
  
  -- Versioning
  engine_version text,
  model_used text,
  tokens_used integer,
  
  -- Timing
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_acq_analysis_offer ON public.acq_analysis_runs(offer_id);
CREATE INDEX idx_acq_analysis_mandate ON public.acq_analysis_runs(mandate_id);
CREATE INDEX idx_acq_analysis_type ON public.acq_analysis_runs(run_type);
CREATE INDEX idx_acq_analysis_status ON public.acq_analysis_runs(status);

ALTER TABLE public.acq_analysis_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "AkquiseManagers access own analysis runs"
  ON public.acq_analysis_runs FOR ALL
  USING (
    mandate_id IN (
      SELECT id FROM public.acq_mandates 
      WHERE assigned_manager_user_id = auth.uid()
    )
  );

CREATE POLICY "Platform admins full access on analysis_runs"
  ON public.acq_analysis_runs FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
  );

-- ==========================
-- ACQ EMAIL TEMPLATES
-- ==========================
CREATE TABLE public.acq_email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  subject_template text NOT NULL,
  body_html_template text NOT NULL,
  body_text_template text,
  category text DEFAULT 'outreach',
  is_active boolean DEFAULT true,
  variables jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Insert default templates
INSERT INTO public.acq_email_templates (code, name, subject_template, body_html_template, body_text_template, category, variables) VALUES
('INITIAL_OUTREACH', 'Erstansprache Makler', 
 'Ankaufsprofil: {{assetTypes}} im Raum {{region}}',
 '<p>Sehr geehrte Damen und Herren,</p><p>wir suchen aktiv Investitionsobjekte mit folgendem Profil:</p><ul><li>Objekttypen: {{assetTypes}}</li><li>Region: {{region}}</li><li>Preisrahmen: {{priceRange}}</li><li>Zielrendite: ab {{yieldTarget}}%</li></ul><p>Haben Sie aktuell passende Objekte im Portfolio?</p><p>Mit freundlichen Grüßen</p>',
 'Sehr geehrte Damen und Herren,\n\nwir suchen aktiv Investitionsobjekte mit folgendem Profil:\n- Objekttypen: {{assetTypes}}\n- Region: {{region}}\n- Preisrahmen: {{priceRange}}\n- Zielrendite: ab {{yieldTarget}}%\n\nHaben Sie aktuell passende Objekte im Portfolio?\n\nMit freundlichen Grüßen',
 'outreach',
 '["assetTypes", "region", "priceRange", "yieldTarget"]'::jsonb),

('FOLLOW_UP', 'Nachfassen',
 'Nachfrage: Investitionsobjekte {{region}}',
 '<p>Sehr geehrte Damen und Herren,</p><p>vor einigen Tagen hatte ich Sie bezüglich unseres Ankaufsprofils kontaktiert. Darf ich nachfragen, ob Sie inzwischen passende Objekte identifizieren konnten?</p><p>Mit freundlichen Grüßen</p>',
 'Sehr geehrte Damen und Herren,\n\nvor einigen Tagen hatte ich Sie bezüglich unseres Ankaufsprofils kontaktiert. Darf ich nachfragen, ob Sie inzwischen passende Objekte identifizieren konnten?\n\nMit freundlichen Grüßen',
 'outreach',
 '["region"]'::jsonb),

('THANK_YOU_EXPOSE', 'Dank für Exposé',
 'Vielen Dank für das Exposé: {{objectTitle}}',
 '<p>Vielen Dank für die Zusendung des Exposés zu {{objectTitle}}.</p><p>Wir werden das Objekt umgehend prüfen und melden uns zeitnah bei Ihnen.</p><p>Mit freundlichen Grüßen</p>',
 'Vielen Dank für die Zusendung des Exposés zu {{objectTitle}}.\n\nWir werden das Objekt umgehend prüfen und melden uns zeitnah bei Ihnen.\n\nMit freundlichen Grüßen',
 'response',
 '["objectTitle"]'::jsonb);

ALTER TABLE public.acq_email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins manage templates"
  ON public.acq_email_templates FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
  );

CREATE POLICY "All authenticated users can read templates"
  ON public.acq_email_templates FOR SELECT
  USING (is_active = true);

-- ==========================
-- STORAGE BUCKET FOR ACQ DOCUMENTS
-- ==========================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'acq-documents',
  'acq-documents',
  false,
  52428800, -- 50MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Managers can upload to their mandate folders"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'acq-documents' AND
    (storage.foldername(name))[1] IN (
      SELECT m.id::text FROM public.acq_mandates m
      WHERE m.assigned_manager_user_id = auth.uid()
    )
  );

CREATE POLICY "Managers can read from their mandate folders"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'acq-documents' AND
    (storage.foldername(name))[1] IN (
      SELECT m.id::text FROM public.acq_mandates m
      WHERE m.assigned_manager_user_id = auth.uid()
    )
  );

CREATE POLICY "Platform admins full storage access"
  ON storage.objects FOR ALL
  USING (
    bucket_id = 'acq-documents' AND
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
  );