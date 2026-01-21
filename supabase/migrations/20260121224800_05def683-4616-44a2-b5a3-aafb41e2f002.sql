-- =====================================================
-- ETAPPE 2: BACKBONE MIGRATION
-- Billing, Agreements, Inbox
-- =====================================================

-- =====================================================
-- PART 1: ENUMS
-- =====================================================

CREATE TYPE public.plan_interval AS ENUM ('monthly', 'yearly');
CREATE TYPE public.subscription_status AS ENUM ('active', 'cancelled', 'past_due', 'trialing');
CREATE TYPE public.invoice_status AS ENUM ('draft', 'pending', 'paid', 'overdue', 'cancelled');
CREATE TYPE public.consent_status AS ENUM ('accepted', 'declined', 'withdrawn');
CREATE TYPE public.inbound_item_status AS ENUM ('pending', 'assigned', 'archived', 'rejected');
CREATE TYPE public.inbound_source AS ENUM ('caya', 'email', 'upload', 'api');

-- =====================================================
-- PART 2: BILLING TABLES
-- =====================================================

-- Plans (Platform-wide, managed by platform_admin)
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  interval plan_interval NOT NULL DEFAULT 'monthly',
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  stripe_price_id TEXT,
  stripe_product_id TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Subscriptions (Tenant → Plan mapping)
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE RESTRICT,
  status subscription_status NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  cancelled_at TIMESTAMPTZ,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id)
);

-- Invoices
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status invoice_status NOT NULL DEFAULT 'draft',
  issued_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  stripe_invoice_id TEXT,
  pdf_url TEXT,
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- PART 3: AGREEMENTS TABLES
-- =====================================================

-- Agreement Templates (Platform-wide)
CREATE TABLE public.agreement_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  requires_consent BOOLEAN NOT NULL DEFAULT true,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User Consents (Audit-trail, INSERT-only for users)
CREATE TABLE public.user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tenant_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  template_id UUID NOT NULL REFERENCES public.agreement_templates(id) ON DELETE RESTRICT,
  template_version INTEGER NOT NULL,
  status consent_status NOT NULL DEFAULT 'accepted',
  consented_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- PART 4: INBOX TABLES
-- =====================================================

-- Inbound Items (Documents from Caya, Email, etc.)
CREATE TABLE public.inbound_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source inbound_source NOT NULL,
  external_id TEXT,
  sender_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  recipient_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  file_path TEXT,
  file_name TEXT,
  mime_type TEXT,
  file_size_bytes BIGINT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  status inbound_item_status NOT NULL DEFAULT 'pending',
  assigned_tenant_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  assigned_contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  assigned_property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  assigned_by UUID,
  assigned_at TIMESTAMPTZ,
  processed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Routing Rules (for automatic assignment)
CREATE TABLE public.inbound_routing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0,
  match_conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  action_type TEXT NOT NULL DEFAULT 'assign_tenant',
  action_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- PART 5: INDEXES
-- =====================================================

CREATE INDEX idx_subscriptions_tenant ON public.subscriptions(tenant_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_invoices_tenant ON public.invoices(tenant_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_issued_at ON public.invoices(issued_at DESC);
CREATE INDEX idx_user_consents_user ON public.user_consents(user_id);
CREATE INDEX idx_user_consents_template ON public.user_consents(template_id);
CREATE INDEX idx_user_consents_tenant ON public.user_consents(tenant_id);
CREATE INDEX idx_inbound_items_status ON public.inbound_items(status);
CREATE INDEX idx_inbound_items_source ON public.inbound_items(source);
CREATE INDEX idx_inbound_items_assigned_tenant ON public.inbound_items(assigned_tenant_id);
CREATE INDEX idx_inbound_items_created ON public.inbound_items(created_at DESC);
CREATE INDEX idx_routing_rules_priority ON public.inbound_routing_rules(priority DESC, is_active);

-- =====================================================
-- PART 6: RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agreement_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbound_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inbound_routing_rules ENABLE ROW LEVEL SECURITY;

-- PLANS (Platform-wide, read by all authenticated, managed by platform_admin)
CREATE POLICY "plans_select_authenticated" ON public.plans
  FOR SELECT USING (true);

CREATE POLICY "plans_insert_platform_admin" ON public.plans
  FOR INSERT WITH CHECK (is_platform_admin());

CREATE POLICY "plans_update_platform_admin" ON public.plans
  FOR UPDATE USING (is_platform_admin());

CREATE POLICY "plans_delete_platform_admin" ON public.plans
  FOR DELETE USING (is_platform_admin());

-- SUBSCRIPTIONS
CREATE POLICY "sub_select_platform_admin" ON public.subscriptions
  FOR SELECT USING (is_platform_admin());

CREATE POLICY "sub_select_org_admin" ON public.subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.user_id = auth.uid()
        AND m.tenant_id = subscriptions.tenant_id
        AND m.role = 'org_admin'
    )
  );

CREATE POLICY "sub_insert_platform_admin" ON public.subscriptions
  FOR INSERT WITH CHECK (is_platform_admin());

CREATE POLICY "sub_update_platform_admin" ON public.subscriptions
  FOR UPDATE USING (is_platform_admin());

CREATE POLICY "sub_delete_platform_admin" ON public.subscriptions
  FOR DELETE USING (is_platform_admin());

-- INVOICES
CREATE POLICY "inv_select_platform_admin" ON public.invoices
  FOR SELECT USING (is_platform_admin());

CREATE POLICY "inv_select_org_admin" ON public.invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.user_id = auth.uid()
        AND m.tenant_id = invoices.tenant_id
        AND m.role = 'org_admin'
    )
  );

CREATE POLICY "inv_insert_platform_admin" ON public.invoices
  FOR INSERT WITH CHECK (is_platform_admin());

CREATE POLICY "inv_update_platform_admin" ON public.invoices
  FOR UPDATE USING (is_platform_admin());

CREATE POLICY "inv_delete_platform_admin" ON public.invoices
  FOR DELETE USING (is_platform_admin());

-- AGREEMENT TEMPLATES (Platform-wide, read by all authenticated)
CREATE POLICY "tpl_select_authenticated" ON public.agreement_templates
  FOR SELECT USING (true);

CREATE POLICY "tpl_insert_platform_admin" ON public.agreement_templates
  FOR INSERT WITH CHECK (is_platform_admin());

CREATE POLICY "tpl_update_platform_admin" ON public.agreement_templates
  FOR UPDATE USING (is_platform_admin());

CREATE POLICY "tpl_delete_platform_admin" ON public.agreement_templates
  FOR DELETE USING (is_platform_admin());

-- USER CONSENTS (INSERT by self, SELECT by self or platform_admin)
CREATE POLICY "consent_select_platform_admin" ON public.user_consents
  FOR SELECT USING (is_platform_admin());

CREATE POLICY "consent_select_self" ON public.user_consents
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "consent_insert_self" ON public.user_consents
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- No UPDATE/DELETE for user_consents (immutable audit trail)

-- INBOUND ITEMS (Platform admin only for now, tenant assignment later)
CREATE POLICY "inbound_select_platform_admin" ON public.inbound_items
  FOR SELECT USING (is_platform_admin());

CREATE POLICY "inbound_insert_platform_admin" ON public.inbound_items
  FOR INSERT WITH CHECK (is_platform_admin());

CREATE POLICY "inbound_update_platform_admin" ON public.inbound_items
  FOR UPDATE USING (is_platform_admin());

CREATE POLICY "inbound_delete_platform_admin" ON public.inbound_items
  FOR DELETE USING (is_platform_admin());

-- ROUTING RULES (Platform admin only)
CREATE POLICY "routing_select_platform_admin" ON public.inbound_routing_rules
  FOR SELECT USING (is_platform_admin());

CREATE POLICY "routing_insert_platform_admin" ON public.inbound_routing_rules
  FOR INSERT WITH CHECK (is_platform_admin());

CREATE POLICY "routing_update_platform_admin" ON public.inbound_routing_rules
  FOR UPDATE USING (is_platform_admin());

CREATE POLICY "routing_delete_platform_admin" ON public.inbound_routing_rules
  FOR DELETE USING (is_platform_admin());

-- =====================================================
-- PART 7: TRIGGERS
-- =====================================================

CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_agreement_templates_updated_at
  BEFORE UPDATE ON public.agreement_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_inbound_items_updated_at
  BEFORE UPDATE ON public.inbound_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_routing_rules_updated_at
  BEFORE UPDATE ON public.inbound_routing_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();