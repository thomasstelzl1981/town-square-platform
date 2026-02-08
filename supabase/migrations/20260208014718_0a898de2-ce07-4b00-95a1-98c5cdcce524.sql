-- ============================================================
-- Admin E-Mail Tables for Zone 1 Resend-based email system
-- ============================================================

-- Table for outbound emails sent via Resend
CREATE TABLE public.admin_outbound_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  to_email TEXT NOT NULL,
  to_name TEXT,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  body_html TEXT,
  body_text TEXT,
  resend_message_id TEXT,
  routing_token TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'sent', 'delivered', 'opened', 'replied', 'bounced', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  opened_at TIMESTAMP WITH TIME ZONE,
  replied_at TIMESTAMP WITH TIME ZONE,
  bounced_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for inbound emails received via Resend webhook
CREATE TABLE public.admin_inbound_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resend_inbound_id TEXT,
  from_email TEXT NOT NULL,
  from_name TEXT,
  to_email TEXT,
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  in_reply_to_id UUID REFERENCES public.admin_outbound_emails(id) ON DELETE SET NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_admin_outbound_status ON public.admin_outbound_emails(status);
CREATE INDEX idx_admin_outbound_contact ON public.admin_outbound_emails(contact_id);
CREATE INDEX idx_admin_outbound_created ON public.admin_outbound_emails(created_at DESC);
CREATE INDEX idx_admin_outbound_routing ON public.admin_outbound_emails(routing_token);

CREATE INDEX idx_admin_inbound_contact ON public.admin_inbound_emails(contact_id);
CREATE INDEX idx_admin_inbound_reply ON public.admin_inbound_emails(in_reply_to_id);
CREATE INDEX idx_admin_inbound_read ON public.admin_inbound_emails(is_read);
CREATE INDEX idx_admin_inbound_received ON public.admin_inbound_emails(received_at DESC);

-- Enable RLS
ALTER TABLE public.admin_outbound_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_inbound_emails ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only platform_admin can access
CREATE POLICY "Platform admins can manage outbound emails"
ON public.admin_outbound_emails
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.memberships 
    WHERE memberships.user_id = auth.uid() 
    AND memberships.role = 'platform_admin'
  )
);

CREATE POLICY "Platform admins can manage inbound emails"
ON public.admin_inbound_emails
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.memberships 
    WHERE memberships.user_id = auth.uid() 
    AND memberships.role = 'platform_admin'
  )
);