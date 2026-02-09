
-- ============================================================
-- MOD-03 DMS: Inbound PDF MVP — 3 new tables + RLS + auto-provisioning
-- ============================================================

-- A) inbound_mailboxes
CREATE TABLE public.inbound_mailboxes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  address_local_part text NOT NULL,
  address_domain text NOT NULL DEFAULT 'inbound.systemofatown.com',
  provider text NOT NULL DEFAULT 'resend',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (address_local_part, address_domain)
);

ALTER TABLE public.inbound_mailboxes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view their mailboxes"
  ON public.inbound_mailboxes FOR SELECT
  USING (tenant_id IN (
    SELECT active_tenant_id FROM public.profiles WHERE id = auth.uid()
  ));

CREATE POLICY "Tenant members can update their mailboxes"
  ON public.inbound_mailboxes FOR UPDATE
  USING (tenant_id IN (
    SELECT active_tenant_id FROM public.profiles WHERE id = auth.uid()
  ));

-- B) inbound_emails (metadata only, no body)
CREATE TABLE public.inbound_emails (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  mailbox_id uuid NOT NULL REFERENCES public.inbound_mailboxes(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'resend',
  provider_email_id text NOT NULL,
  from_email text NOT NULL,
  to_email text NOT NULL,
  subject text,
  received_at timestamptz NOT NULL DEFAULT now(),
  attachment_count int NOT NULL DEFAULT 0,
  pdf_count int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'received',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_email_id)
);

ALTER TABLE public.inbound_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view their inbound emails"
  ON public.inbound_emails FOR SELECT
  USING (tenant_id IN (
    SELECT active_tenant_id FROM public.profiles WHERE id = auth.uid()
  ));

-- C) inbound_attachments
CREATE TABLE public.inbound_attachments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inbound_email_id uuid NOT NULL REFERENCES public.inbound_emails(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  filename text NOT NULL,
  mime_type text NOT NULL DEFAULT 'application/octet-stream',
  size_bytes int,
  is_pdf boolean NOT NULL DEFAULT false,
  storage_path text,
  document_id uuid REFERENCES public.documents(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.inbound_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view their inbound attachments"
  ON public.inbound_attachments FOR SELECT
  USING (tenant_id IN (
    SELECT active_tenant_id FROM public.profiles WHERE id = auth.uid()
  ));

-- Auto-provisioning trigger: create mailbox when org is created
CREATE OR REPLACE FUNCTION public.provision_inbound_mailbox()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.inbound_mailboxes (tenant_id, address_local_part, address_domain, provider)
  VALUES (NEW.id, NEW.slug, 'inbound.systemofatown.com', 'resend')
  ON CONFLICT (address_local_part, address_domain) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_provision_inbound_mailbox
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.provision_inbound_mailbox();

-- Backfill: provision mailboxes for all existing organizations
INSERT INTO public.inbound_mailboxes (tenant_id, address_local_part, address_domain, provider)
SELECT id, slug, 'inbound.systemofatown.com', 'resend'
FROM public.organizations
ON CONFLICT (address_local_part, address_domain) DO NOTHING;

-- Indexes for performance
CREATE INDEX idx_inbound_emails_tenant_id ON public.inbound_emails(tenant_id);
CREATE INDEX idx_inbound_emails_status ON public.inbound_emails(status);
CREATE INDEX idx_inbound_attachments_email_id ON public.inbound_attachments(inbound_email_id);
CREATE INDEX idx_inbound_mailboxes_address ON public.inbound_mailboxes(address_local_part, address_domain);
