
-- ═══════════════════════════════════════════════════════════════
-- ENG-PLC: Pet Service Lifecycle Controller — DB Tables
-- ═══════════════════════════════════════════════════════════════

-- Phase enum for pet service cases
CREATE TYPE public.plc_phase AS ENUM (
  'search_initiated',
  'provider_selected',
  'deposit_requested',
  'deposit_paid',
  'provider_confirmed',
  'provider_declined',
  'checked_in',
  'checked_out',
  'settlement',
  'closed_completed',
  'closed_cancelled'
);

-- Service type enum
CREATE TYPE public.plc_service_type AS ENUM (
  'pension', 'grooming', 'walking', 'daycare', 'training', 'veterinary', 'other'
);

-- ─── pet_service_cases ────────────────────────────────────────
CREATE TABLE public.pet_service_cases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_email TEXT,
  customer_name TEXT,
  provider_id UUID NOT NULL REFERENCES public.pet_providers(id) ON DELETE CASCADE,
  service_type public.plc_service_type NOT NULL DEFAULT 'pension',
  pet_id UUID REFERENCES public.pets(id) ON DELETE SET NULL,
  current_phase public.plc_phase NOT NULL DEFAULT 'search_initiated',
  phase_entered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_price_cents INTEGER NOT NULL DEFAULT 0,
  deposit_cents INTEGER NOT NULL DEFAULT 0,
  deposit_paid_at TIMESTAMPTZ,
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  scheduled_start DATE,
  scheduled_end DATE,
  provider_notes TEXT,
  customer_notes TEXT,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_pet_service_cases_provider ON public.pet_service_cases(provider_id);
CREATE INDEX idx_pet_service_cases_customer ON public.pet_service_cases(customer_user_id);
CREATE INDEX idx_pet_service_cases_phase ON public.pet_service_cases(current_phase);
CREATE INDEX idx_pet_service_cases_tenant ON public.pet_service_cases(tenant_id);

-- RLS
ALTER TABLE public.pet_service_cases ENABLE ROW LEVEL SECURITY;

-- Providers can see cases assigned to their provider_id
CREATE POLICY "Providers can view their cases"
  ON public.pet_service_cases FOR SELECT
  TO authenticated
  USING (
    provider_id IN (
      SELECT id FROM public.pet_providers WHERE user_id = auth.uid()
    )
    OR customer_user_id = auth.uid()
    OR tenant_id IN (
      SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

-- Customers can create cases (via booking flow)
CREATE POLICY "Authenticated users can create cases"
  ON public.pet_service_cases FOR INSERT
  TO authenticated
  WITH CHECK (customer_user_id = auth.uid());

-- Providers can update their own cases (confirm, check-in, check-out)
CREATE POLICY "Providers can update their cases"
  ON public.pet_service_cases FOR UPDATE
  TO authenticated
  USING (
    provider_id IN (
      SELECT id FROM public.pet_providers WHERE user_id = auth.uid()
    )
    OR customer_user_id = auth.uid()
  );

-- ─── pet_lifecycle_events ─────────────────────────────────────
CREATE TABLE public.pet_lifecycle_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  case_id UUID NOT NULL REFERENCES public.pet_service_cases(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  phase_before TEXT,
  phase_after TEXT,
  actor_id UUID,
  actor_type TEXT NOT NULL DEFAULT 'system',
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_pet_lifecycle_events_case ON public.pet_lifecycle_events(case_id);
CREATE INDEX idx_pet_lifecycle_events_type ON public.pet_lifecycle_events(event_type);

-- RLS
ALTER TABLE public.pet_lifecycle_events ENABLE ROW LEVEL SECURITY;

-- Events are readable if you can read the case
CREATE POLICY "Users can view events for their cases"
  ON public.pet_lifecycle_events FOR SELECT
  TO authenticated
  USING (
    case_id IN (
      SELECT id FROM public.pet_service_cases
      WHERE provider_id IN (SELECT id FROM public.pet_providers WHERE user_id = auth.uid())
         OR customer_user_id = auth.uid()
         OR tenant_id IN (SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid())
    )
  );

-- System and authenticated users can insert events
CREATE POLICY "Authenticated users can insert events"
  ON public.pet_lifecycle_events FOR INSERT
  TO authenticated
  WITH CHECK (
    case_id IN (
      SELECT id FROM public.pet_service_cases
      WHERE provider_id IN (SELECT id FROM public.pet_providers WHERE user_id = auth.uid())
         OR customer_user_id = auth.uid()
    )
  );
