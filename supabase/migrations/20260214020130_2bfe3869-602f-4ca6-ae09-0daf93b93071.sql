
-- =============================================
-- SOAT Search Engine Tables + Compliance Columns
-- =============================================

-- 1) soat_search_orders
CREATE TABLE public.soat_search_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID,
  title TEXT NOT NULL,
  intent TEXT,
  target_count INT DEFAULT 25,
  status TEXT NOT NULL DEFAULT 'draft',
  phase TEXT DEFAULT 'strategy',
  progress_percent INT DEFAULT 0,
  counters_json JSONB DEFAULT '{"firms_found":0,"contacts_extracted":0,"emails_found":0,"phones_found":0,"validated":0,"suppressed":0}'::jsonb,
  provider_plan_json JSONB,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  last_heartbeat_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.soat_search_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can manage soat_search_orders"
  ON public.soat_search_orders FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND role = 'platform_admin')
  );

-- 2) soat_search_results
CREATE TABLE public.soat_search_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.soat_search_orders(id) ON DELETE CASCADE,
  entity_type TEXT DEFAULT 'company',
  company_name TEXT,
  category TEXT,
  address_line TEXT,
  postal_code TEXT,
  city TEXT,
  country TEXT DEFAULT 'DE',
  phone TEXT,
  email TEXT,
  website_url TEXT,
  contact_person_name TEXT,
  contact_person_role TEXT,
  source_refs_json JSONB,
  confidence_score INT DEFAULT 0,
  validation_state TEXT DEFAULT 'candidate',
  suppression_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.soat_search_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Platform admins can manage soat_search_results"
  ON public.soat_search_results FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.memberships WHERE user_id = auth.uid() AND role = 'platform_admin')
  );

-- Enable realtime for live results feed
ALTER PUBLICATION supabase_realtime ADD TABLE public.soat_search_results;

-- 3) Compliance columns on contacts table
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS permission_status TEXT DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS legal_basis TEXT,
  ADD COLUMN IF NOT EXISTS unsubscribe_token TEXT,
  ADD COLUMN IF NOT EXISTS do_not_contact BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_contacts_permission_status ON public.contacts(permission_status);
CREATE INDEX IF NOT EXISTS idx_soat_results_order_id ON public.soat_search_results(order_id);
CREATE INDEX IF NOT EXISTS idx_soat_orders_status ON public.soat_search_orders(status);
