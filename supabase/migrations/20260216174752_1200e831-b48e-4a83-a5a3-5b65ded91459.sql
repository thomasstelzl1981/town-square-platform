
-- =============================================================================
-- Phase 2: Buchungssystem-Tabellen (PET-010 bis PET-012)
-- =============================================================================

-- Booking status enum
CREATE TYPE public.pet_booking_status AS ENUM (
  'requested', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'
);

-- ─── 1. pet_bookings ────────────────────────────────────────────────────────────
CREATE TABLE public.pet_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.pet_services(id),
  provider_id UUID NOT NULL REFERENCES public.pet_providers(id),
  client_user_id UUID REFERENCES public.profiles(id),
  status public.pet_booking_status NOT NULL DEFAULT 'requested',
  scheduled_date DATE NOT NULL,
  scheduled_time_start TIME,
  scheduled_time_end TIME,
  duration_minutes INTEGER,
  price_cents INTEGER DEFAULT 0,
  client_notes TEXT,
  provider_notes TEXT,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID,
  cancellation_reason TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pet_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pet_book_select_own_tenant" ON public.pet_bookings FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "pet_book_insert_own_tenant" ON public.pet_bookings FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id());
CREATE POLICY "pet_book_update_own_tenant" ON public.pet_bookings FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "pet_book_delete_own_tenant" ON public.pet_bookings FOR DELETE
  USING (tenant_id = public.get_user_tenant_id());

CREATE INDEX idx_pet_book_tenant_created ON public.pet_bookings (tenant_id, created_at);
CREATE INDEX idx_pet_book_provider ON public.pet_bookings (provider_id);
CREATE INDEX idx_pet_book_pet ON public.pet_bookings (pet_id);
CREATE INDEX idx_pet_book_date ON public.pet_bookings (scheduled_date);
CREATE INDEX idx_pet_book_status ON public.pet_bookings (status);

-- ─── 2. pet_provider_availability ───────────────────────────────────────────────
CREATE TABLE public.pet_provider_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.pet_providers(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_bookings INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pet_provider_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pet_avail_select_own_tenant" ON public.pet_provider_availability FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "pet_avail_insert_own_tenant" ON public.pet_provider_availability FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id());
CREATE POLICY "pet_avail_update_own_tenant" ON public.pet_provider_availability FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "pet_avail_delete_own_tenant" ON public.pet_provider_availability FOR DELETE
  USING (tenant_id = public.get_user_tenant_id());

CREATE INDEX idx_pet_avail_tenant_created ON public.pet_provider_availability (tenant_id, created_at);
CREATE INDEX idx_pet_avail_provider ON public.pet_provider_availability (provider_id);

-- ─── 3. pet_provider_blocked_dates ──────────────────────────────────────────────
CREATE TABLE public.pet_provider_blocked_dates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.pet_providers(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  blocked_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pet_provider_blocked_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pet_blocked_select_own_tenant" ON public.pet_provider_blocked_dates FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "pet_blocked_insert_own_tenant" ON public.pet_provider_blocked_dates FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id());
CREATE POLICY "pet_blocked_update_own_tenant" ON public.pet_provider_blocked_dates FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id());
CREATE POLICY "pet_blocked_delete_own_tenant" ON public.pet_provider_blocked_dates FOR DELETE
  USING (tenant_id = public.get_user_tenant_id());

CREATE INDEX idx_pet_blocked_tenant_created ON public.pet_provider_blocked_dates (tenant_id, created_at);
CREATE INDEX idx_pet_blocked_provider_date ON public.pet_provider_blocked_dates (provider_id, blocked_date);

-- Triggers for updated_at
CREATE TRIGGER trg_pet_bookings_updated_at BEFORE UPDATE ON public.pet_bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_pet_updated_at();
CREATE TRIGGER trg_pet_avail_updated_at BEFORE UPDATE ON public.pet_provider_availability
  FOR EACH ROW EXECUTE FUNCTION public.update_pet_updated_at();
