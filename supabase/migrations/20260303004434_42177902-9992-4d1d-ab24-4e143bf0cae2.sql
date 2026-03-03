
-- ============================================================
-- PSLC REPAIR MIGRATION — Waves A, B, C, E combined
-- ============================================================

-- ═══ WAVE A: Remove insecure Z3 anon RLS policies ═══

-- Drop all anon Z3 policies on pet_service_cases
DROP POLICY IF EXISTS "Z3 customers can create cases" ON public.pet_service_cases;
DROP POLICY IF EXISTS "Z3 customers can view their cases" ON public.pet_service_cases;

-- Drop all anon Z3 policies on pet_lifecycle_events
DROP POLICY IF EXISTS "Z3 customers can insert events" ON public.pet_lifecycle_events;
DROP POLICY IF EXISTS "Z3 customers can view events" ON public.pet_lifecycle_events;

-- ═══ WAVE B: Controller Pattern compliance columns ═══

-- Add event_source, idempotency_key, correlation_key to pet_lifecycle_events
ALTER TABLE public.pet_lifecycle_events
  ADD COLUMN IF NOT EXISTS event_source TEXT NOT NULL DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS correlation_key TEXT;

-- Partial unique index for idempotency (only where key is set)
CREATE UNIQUE INDEX IF NOT EXISTS idx_pet_lifecycle_events_idempotency
  ON public.pet_lifecycle_events (case_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- ═══ WAVE C: Pricing SSOT columns on pet_service_cases ═══

ALTER TABLE public.pet_service_cases
  ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.pet_services(id),
  ADD COLUMN IF NOT EXISTS platform_fee_pct NUMERIC NOT NULL DEFAULT 7.5,
  ADD COLUMN IF NOT EXISTS pricing_snapshot_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS pricing_snapshot JSONB;

-- ═══ WAVE E: pet_customer_id linkage ═══

ALTER TABLE public.pet_service_cases
  ADD COLUMN IF NOT EXISTS pet_customer_id UUID REFERENCES public.pet_customers(id);
