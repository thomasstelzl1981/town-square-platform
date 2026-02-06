-- ============================================================================
-- SERVICE CASE INBOUND: Eingehende E-Mails/Angebote
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.service_case_inbound (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  service_case_id uuid REFERENCES service_cases(id) ON DELETE SET NULL,
  
  -- Sender info
  sender_email text NOT NULL,
  sender_name text,
  sender_phone text,
  sender_company text,
  
  -- Message content
  subject text,
  body_text text,
  body_html text,
  received_at timestamptz NOT NULL DEFAULT now(),
  
  -- Attachments (stored in DMS)
  attachments jsonb DEFAULT '[]',
  
  -- Matching
  matched_tender_id text,
  match_confidence text DEFAULT 'none' CHECK (match_confidence IN ('none', 'low', 'medium', 'high', 'exact')),
  match_method text,
  
  -- Offer details (parsed or manual)
  offer_amount_cents integer,
  offer_valid_until date,
  offer_notes text,
  
  -- Status
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'rejected', 'accepted', 'archived')),
  processed_at timestamptz,
  processed_by uuid REFERENCES auth.users(id),
  
  -- Metadata
  raw_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sci_tenant ON service_case_inbound(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sci_service_case ON service_case_inbound(service_case_id);
CREATE INDEX IF NOT EXISTS idx_sci_status ON service_case_inbound(status);
CREATE INDEX IF NOT EXISTS idx_sci_matched_tender ON service_case_inbound(matched_tender_id);
CREATE INDEX IF NOT EXISTS idx_sci_received ON service_case_inbound(received_at DESC);

-- RLS
ALTER TABLE public.service_case_inbound ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view inbound"
  ON public.service_case_inbound FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Tenant members can update inbound"
  ON public.service_case_inbound FOR UPDATE
  USING (
    tenant_id IN (
      SELECT tenant_id FROM memberships WHERE user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_service_case_inbound_updated_at
  BEFORE UPDATE ON public.service_case_inbound
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- SERVICE CASE PROVIDERS: Tracking angeschriebener Dienstleister
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.service_case_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  service_case_id uuid NOT NULL REFERENCES service_cases(id) ON DELETE CASCADE,
  
  -- Provider info
  provider_name text NOT NULL,
  provider_email text,
  provider_phone text,
  provider_address text,
  provider_website text,
  place_id text,
  
  -- Outbound tracking
  email_sent_at timestamptz,
  email_subject text,
  email_status text DEFAULT 'pending' CHECK (email_status IN ('pending', 'sent', 'delivered', 'bounced', 'failed')),
  
  -- Response tracking
  response_received boolean DEFAULT false,
  response_inbound_id uuid REFERENCES service_case_inbound(id),
  
  -- Offer details
  offer_amount_cents integer,
  offer_valid_until date,
  offer_notes text,
  
  -- Award
  is_awarded boolean DEFAULT false,
  awarded_at timestamptz,
  award_notes text,
  
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  UNIQUE(service_case_id, provider_email)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scp_tenant ON service_case_providers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_scp_service_case ON service_case_providers(service_case_id);
CREATE INDEX IF NOT EXISTS idx_scp_awarded ON service_case_providers(is_awarded) WHERE is_awarded = true;

-- RLS
ALTER TABLE public.service_case_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view providers"
  ON public.service_case_providers FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Tenant members can manage providers"
  ON public.service_case_providers FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM memberships WHERE user_id = auth.uid()
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_service_case_providers_updated_at
  BEFORE UPDATE ON public.service_case_providers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();