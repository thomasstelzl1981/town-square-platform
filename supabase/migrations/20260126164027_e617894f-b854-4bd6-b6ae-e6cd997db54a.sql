-- =============================================
-- MOD-04 Immobilien: Erweiterte Tabellen
-- =============================================

-- 1. Landlord Contexts (Vermieter-Kontexte)
CREATE TABLE IF NOT EXISTS public.landlord_contexts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  public_id text NOT NULL UNIQUE DEFAULT 'CTX-' || substr(gen_random_uuid()::text, 1, 8),
  name text NOT NULL,
  context_type text NOT NULL DEFAULT 'BUSINESS' CHECK (context_type IN ('PRIVATE', 'BUSINESS')),
  tax_regime text DEFAULT 'FIBU' CHECK (tax_regime IN ('FIBU', 'EÜR', 'VERMÖGENSVERWALTUNG')),
  is_default boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for landlord_contexts
ALTER TABLE public.landlord_contexts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's contexts"
  ON public.landlord_contexts FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can insert contexts for their organization"
  ON public.landlord_contexts FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their organization's contexts"
  ON public.landlord_contexts FOR UPDATE
  USING (tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid()));

-- 2. Context Property Assignment (Kontext-Objekt-Zuordnung)
CREATE TABLE IF NOT EXISTS public.context_property_assignment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  context_id uuid NOT NULL REFERENCES landlord_contexts(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  assigned_by uuid REFERENCES profiles(id),
  UNIQUE(tenant_id, property_id)
);

ALTER TABLE public.context_property_assignment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's assignments"
  ON public.context_property_assignment FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their organization's assignments"
  ON public.context_property_assignment FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid()));

-- 3. Property Valuations (Bewertungsergebnisse)
CREATE TABLE IF NOT EXISTS public.property_valuations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  public_id text NOT NULL UNIQUE DEFAULT 'VAL-' || substr(gen_random_uuid()::text, 1, 8),
  provider text NOT NULL DEFAULT 'sprengnetter',
  job_id text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  market_value numeric,
  land_value numeric,
  building_value numeric,
  valuation_date timestamptz,
  report_document_id uuid REFERENCES documents(id),
  input_data jsonb DEFAULT '{}',
  result_data jsonb DEFAULT '{}',
  credits_used integer DEFAULT 1,
  consent_id uuid REFERENCES user_consents(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  error_message text
);

ALTER TABLE public.property_valuations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's valuations"
  ON public.property_valuations FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can create valuations for their organization"
  ON public.property_valuations FOR INSERT
  WITH CHECK (tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their organization's valuations"
  ON public.property_valuations FOR UPDATE
  USING (tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid()));

-- 4. Service Cases (Sanierungsvorgänge)
CREATE TABLE IF NOT EXISTS public.service_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  public_id text NOT NULL UNIQUE DEFAULT 'TND-' || substr(gen_random_uuid()::text, 1, 8),
  category text NOT NULL CHECK (category IN ('sanitaer', 'elektro', 'maler', 'dach', 'fenster', 'heizung', 'sonstige')),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'offers_received', 'decision_pending', 'awarded', 'completed', 'cancelled')),
  budget_estimate numeric,
  awarded_amount numeric,
  awarded_to_contact_id uuid REFERENCES contacts(id),
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

ALTER TABLE public.service_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's service cases"
  ON public.service_cases FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their organization's service cases"
  ON public.service_cases FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid()));

-- 5. Service Case Outbound (Versendete Ausschreibungen)
CREATE TABLE IF NOT EXISTS public.service_case_outbound (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  service_case_id uuid NOT NULL REFERENCES service_cases(id) ON DELETE CASCADE,
  recipient_contact_id uuid REFERENCES contacts(id),
  recipient_email text,
  sent_at timestamptz,
  sent_by uuid REFERENCES profiles(id),
  email_template text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_case_outbound ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's outbound"
  ON public.service_case_outbound FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their organization's outbound"
  ON public.service_case_outbound FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid()));

-- 6. Service Case Offers (Eingegangene Angebote)
CREATE TABLE IF NOT EXISTS public.service_case_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  service_case_id uuid NOT NULL REFERENCES service_cases(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES contacts(id),
  offer_amount numeric,
  offer_date timestamptz,
  valid_until timestamptz,
  document_id uuid REFERENCES documents(id),
  notes text,
  is_selected boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.service_case_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's offers"
  ON public.service_case_offers FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their organization's offers"
  ON public.service_case_offers FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid()));

-- 7. Add utility_prepayment to properties if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'utility_prepayment') THEN
    ALTER TABLE properties ADD COLUMN utility_prepayment numeric;
  END IF;
END $$;

-- 8. Valuation Credits Table (für Credit-System)
CREATE TABLE IF NOT EXISTS public.valuation_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  credits_purchased integer NOT NULL DEFAULT 0,
  credits_used integer NOT NULL DEFAULT 0,
  purchased_at timestamptz,
  expires_at timestamptz,
  invoice_id uuid REFERENCES invoices(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.valuation_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization's credits"
  ON public.valuation_credits FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their organization's credits"
  ON public.valuation_credits FOR ALL
  USING (tenant_id IN (SELECT tenant_id FROM memberships WHERE user_id = auth.uid()));