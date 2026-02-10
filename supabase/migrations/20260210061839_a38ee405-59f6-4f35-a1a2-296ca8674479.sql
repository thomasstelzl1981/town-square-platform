
-- ============================================
-- MOD-14: Serien-E-Mail Tables
-- ============================================

-- 1. mail_campaigns
CREATE TABLE public.mail_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  subject_template TEXT NOT NULL DEFAULT '',
  body_template TEXT NOT NULL DEFAULT '',
  include_signature BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'draft',
  recipients_count INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX idx_mail_campaigns_user ON public.mail_campaigns(user_id);
CREATE INDEX idx_mail_campaigns_status ON public.mail_campaigns(status);

ALTER TABLE public.mail_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own campaigns"
  ON public.mail_campaigns FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own campaigns"
  ON public.mail_campaigns FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own campaigns"
  ON public.mail_campaigns FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own campaigns"
  ON public.mail_campaigns FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role full access on mail_campaigns"
  ON public.mail_campaigns FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 2. mail_campaign_recipients
CREATE TABLE public.mail_campaign_recipients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.mail_campaigns(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  city TEXT,
  delivery_status TEXT NOT NULL DEFAULT 'queued',
  sent_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mcr_campaign ON public.mail_campaign_recipients(campaign_id);
CREATE INDEX idx_mcr_status ON public.mail_campaign_recipients(delivery_status);

ALTER TABLE public.mail_campaign_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own campaign recipients"
  ON public.mail_campaign_recipients FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.mail_campaigns mc WHERE mc.id = campaign_id AND mc.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own campaign recipients"
  ON public.mail_campaign_recipients FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.mail_campaigns mc WHERE mc.id = campaign_id AND mc.user_id = auth.uid()
  ));

CREATE POLICY "Users can update own campaign recipients"
  ON public.mail_campaign_recipients FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.mail_campaigns mc WHERE mc.id = campaign_id AND mc.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own campaign recipients"
  ON public.mail_campaign_recipients FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.mail_campaigns mc WHERE mc.id = campaign_id AND mc.user_id = auth.uid()
  ));

CREATE POLICY "Service role full access on mail_campaign_recipients"
  ON public.mail_campaign_recipients FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- 3. mail_campaign_attachments
CREATE TABLE public.mail_campaign_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.mail_campaigns(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  size_bytes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_mca_campaign ON public.mail_campaign_attachments(campaign_id);

ALTER TABLE public.mail_campaign_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own campaign attachments"
  ON public.mail_campaign_attachments FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.mail_campaigns mc WHERE mc.id = campaign_id AND mc.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert own campaign attachments"
  ON public.mail_campaign_attachments FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.mail_campaigns mc WHERE mc.id = campaign_id AND mc.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete own campaign attachments"
  ON public.mail_campaign_attachments FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.mail_campaigns mc WHERE mc.id = campaign_id AND mc.user_id = auth.uid()
  ));

CREATE POLICY "Service role full access on mail_campaign_attachments"
  ON public.mail_campaign_attachments FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Updated_at trigger for mail_campaigns
CREATE TRIGGER update_mail_campaigns_updated_at
  BEFORE UPDATE ON public.mail_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
