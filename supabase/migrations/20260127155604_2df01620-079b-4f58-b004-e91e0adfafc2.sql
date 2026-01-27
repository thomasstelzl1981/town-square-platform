-- =============================================
-- PHASE 1: MOD-06 Verkauf - DB-Schema (korrigierte Spaltennamen)
-- =============================================

-- 1. Neue Enums erstellen (nur die fehlenden)
DO $$ BEGIN
  CREATE TYPE public.inquiry_source AS ENUM ('website', 'partner', 'direct', 'referral');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.inquiry_status AS ENUM ('new', 'contacted', 'qualified', 'scheduled', 'won', 'lost');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.reservation_status AS ENUM ('pending_owner', 'pending_buyer', 'confirmed', 'cancelled', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.sale_transaction_status AS ENUM ('pending', 'notarized', 'bnl_received', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. listings-Tabelle erweitern
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS min_price numeric,
ADD COLUMN IF NOT EXISTS sales_mandate_consent_id uuid REFERENCES public.user_consents(id),
ADD COLUMN IF NOT EXISTS published_at timestamptz,
ADD COLUMN IF NOT EXISTS reserved_at timestamptz,
ADD COLUMN IF NOT EXISTS sold_at timestamptz,
ADD COLUMN IF NOT EXISTS withdrawn_at timestamptz;

-- 3. listing_publications - Kanal-Status pro Listing
CREATE TABLE IF NOT EXISTS public.listing_publications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.organizations(id),
  listing_id uuid NOT NULL,
  channel public.publication_channel NOT NULL,
  status public.publication_status NOT NULL DEFAULT 'pending',
  external_url text,
  external_id text,
  published_at timestamptz,
  removed_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT listing_pub_tenant_listing_fk FOREIGN KEY (tenant_id, listing_id) REFERENCES public.listings(tenant_id, id),
  CONSTRAINT listing_pub_unique_channel UNIQUE (listing_id, channel)
);

ALTER TABLE public.listing_publications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant members can view listing publications" ON public.listing_publications;
CREATE POLICY "Tenant members can view listing publications"
ON public.listing_publications FOR SELECT
USING (tenant_id IN (SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Tenant members can manage listing publications" ON public.listing_publications;
CREATE POLICY "Tenant members can manage listing publications"
ON public.listing_publications FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()));

-- 4. listing_partner_terms - Provisionen + Consent-Gates
CREATE TABLE IF NOT EXISTS public.listing_partner_terms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.organizations(id),
  listing_id uuid NOT NULL,
  partner_commission_rate numeric NOT NULL CHECK (partner_commission_rate >= 0 AND partner_commission_rate <= 20),
  finance_distribution_enabled boolean NOT NULL DEFAULT false,
  global_release boolean NOT NULL DEFAULT false,
  partner_release_consent_id uuid REFERENCES public.user_consents(id),
  system_fee_consent_id uuid REFERENCES public.user_consents(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT listing_terms_tenant_listing_fk FOREIGN KEY (tenant_id, listing_id) REFERENCES public.listings(tenant_id, id),
  CONSTRAINT listing_terms_unique UNIQUE (listing_id)
);

ALTER TABLE public.listing_partner_terms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant members can view listing terms" ON public.listing_partner_terms;
CREATE POLICY "Tenant members can view listing terms"
ON public.listing_partner_terms FOR SELECT
USING (tenant_id IN (SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Tenant members can manage listing terms" ON public.listing_partner_terms;
CREATE POLICY "Tenant members can manage listing terms"
ON public.listing_partner_terms FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()));

-- 5. listing_inquiries - Anfragen-Management
CREATE TABLE IF NOT EXISTS public.listing_inquiries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.organizations(id),
  listing_id uuid NOT NULL,
  contact_id uuid REFERENCES public.contacts(id),
  source public.inquiry_source NOT NULL DEFAULT 'website',
  status public.inquiry_status NOT NULL DEFAULT 'new',
  contact_name text,
  contact_email text,
  contact_phone text,
  message text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  qualified_at timestamptz,
  qualified_by uuid REFERENCES public.profiles(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT listing_inq_tenant_listing_fk FOREIGN KEY (tenant_id, listing_id) REFERENCES public.listings(tenant_id, id)
);

ALTER TABLE public.listing_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant members can view listing inquiries" ON public.listing_inquiries;
CREATE POLICY "Tenant members can view listing inquiries"
ON public.listing_inquiries FOR SELECT
USING (tenant_id IN (SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Tenant members can manage listing inquiries" ON public.listing_inquiries;
CREATE POLICY "Tenant members can manage listing inquiries"
ON public.listing_inquiries FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()));

-- 6. reservations - Reservierungs-Workflow
CREATE TABLE IF NOT EXISTS public.reservations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.organizations(id),
  listing_id uuid NOT NULL,
  buyer_contact_id uuid REFERENCES public.contacts(id),
  inquiry_id uuid REFERENCES public.listing_inquiries(id),
  status public.reservation_status NOT NULL DEFAULT 'pending_owner',
  reserved_price numeric,
  notary_date date,
  owner_confirmed_at timestamptz,
  buyer_confirmed_at timestamptz,
  cancelled_at timestamptz,
  cancelled_reason text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reserv_tenant_listing_fk FOREIGN KEY (tenant_id, listing_id) REFERENCES public.listings(tenant_id, id)
);

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant members can view reservations" ON public.reservations;
CREATE POLICY "Tenant members can view reservations"
ON public.reservations FOR SELECT
USING (tenant_id IN (SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Tenant members can manage reservations" ON public.reservations;
CREATE POLICY "Tenant members can manage reservations"
ON public.reservations FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()));

-- 7. sale_transactions - Abschlüsse
CREATE TABLE IF NOT EXISTS public.sale_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.organizations(id),
  reservation_id uuid REFERENCES public.reservations(id),
  listing_id uuid NOT NULL,
  buyer_contact_id uuid REFERENCES public.contacts(id),
  status public.sale_transaction_status NOT NULL DEFAULT 'pending',
  final_price numeric NOT NULL,
  notary_date date,
  bnl_date date,
  handover_date date,
  commission_amount numeric,
  system_fee_amount numeric,
  commission_approved_at timestamptz,
  commission_approved_by uuid REFERENCES public.profiles(id),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT trans_tenant_listing_fk FOREIGN KEY (tenant_id, listing_id) REFERENCES public.listings(tenant_id, id)
);

ALTER TABLE public.sale_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant members can view sale transactions" ON public.sale_transactions;
CREATE POLICY "Tenant members can view sale transactions"
ON public.sale_transactions FOR SELECT
USING (tenant_id IN (SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Tenant members can manage sale transactions" ON public.sale_transactions;
CREATE POLICY "Tenant members can manage sale transactions"
ON public.sale_transactions FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()));

-- 8. listing_activities - Timeline/Audit-Stream
CREATE TABLE IF NOT EXISTS public.listing_activities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.organizations(id),
  listing_id uuid NOT NULL,
  activity_type text NOT NULL,
  description text,
  performed_by uuid REFERENCES public.profiles(id),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT listing_act_tenant_listing_fk FOREIGN KEY (tenant_id, listing_id) REFERENCES public.listings(tenant_id, id)
);

ALTER TABLE public.listing_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant members can view listing activities" ON public.listing_activities;
CREATE POLICY "Tenant members can view listing activities"
ON public.listing_activities FOR SELECT
USING (tenant_id IN (SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Tenant members can insert listing activities" ON public.listing_activities;
CREATE POLICY "Tenant members can insert listing activities"
ON public.listing_activities FOR INSERT
WITH CHECK (tenant_id IN (SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()));

-- 9. Trigger für updated_at
DROP TRIGGER IF EXISTS update_listing_publications_updated_at ON public.listing_publications;
CREATE TRIGGER update_listing_publications_updated_at
BEFORE UPDATE ON public.listing_publications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_listing_partner_terms_updated_at ON public.listing_partner_terms;
CREATE TRIGGER update_listing_partner_terms_updated_at
BEFORE UPDATE ON public.listing_partner_terms
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_listing_inquiries_updated_at ON public.listing_inquiries;
CREATE TRIGGER update_listing_inquiries_updated_at
BEFORE UPDATE ON public.listing_inquiries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_reservations_updated_at ON public.reservations;
CREATE TRIGGER update_reservations_updated_at
BEFORE UPDATE ON public.reservations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_sale_transactions_updated_at ON public.sale_transactions;
CREATE TRIGGER update_sale_transactions_updated_at
BEFORE UPDATE ON public.sale_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. v_public_listings View für Zone 3 (öffentlich, read-only)
CREATE OR REPLACE VIEW public.v_public_listings AS
SELECT 
  l.public_id,
  l.title,
  l.description,
  l.asking_price,
  p.city,
  p.postal_code,
  p.property_type,
  p.total_area_sqm,
  p.year_built,
  lp.published_at,
  lp.channel
FROM public.listings l
JOIN public.properties p ON l.property_id = p.id AND l.tenant_id = p.tenant_id
JOIN public.listing_publications lp ON l.id = lp.listing_id AND l.tenant_id = lp.tenant_id
WHERE l.status = 'active' 
  AND lp.status = 'active'
  AND lp.channel = 'kaufy';

-- Grant read access to anon for public listings
GRANT SELECT ON public.v_public_listings TO anon;

-- 11. Indizes für Performance
CREATE INDEX IF NOT EXISTS idx_listing_publications_listing ON public.listing_publications(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_publications_status ON public.listing_publications(status);
CREATE INDEX IF NOT EXISTS idx_listing_inquiries_listing ON public.listing_inquiries(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_inquiries_status ON public.listing_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_reservations_listing ON public.reservations(listing_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON public.reservations(status);
CREATE INDEX IF NOT EXISTS idx_sale_transactions_listing ON public.sale_transactions(listing_id);
CREATE INDEX IF NOT EXISTS idx_sale_transactions_status ON public.sale_transactions(status);
CREATE INDEX IF NOT EXISTS idx_listing_activities_listing ON public.listing_activities(listing_id);