
-- ═══════════════════════════════════════════════════════════════
-- FLC Wave 1: finance_lifecycle_events + commission default fix
-- ═══════════════════════════════════════════════════════════════

-- 1) Append-only Eventlog for Financing Lifecycle
CREATE TABLE public.finance_lifecycle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  finance_request_id UUID NOT NULL REFERENCES public.finance_requests(id) ON DELETE CASCADE,
  finance_mandate_id UUID REFERENCES public.finance_mandates(id) ON DELETE SET NULL,
  future_room_case_id UUID REFERENCES public.future_room_cases(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  phase TEXT,
  actor_id UUID,
  actor_type TEXT NOT NULL DEFAULT 'system',
  event_source TEXT,
  idempotency_key TEXT,
  correlation_key TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_fle_request_created ON public.finance_lifecycle_events(finance_request_id, created_at DESC);
CREATE INDEX idx_fle_event_type ON public.finance_lifecycle_events(event_type, created_at DESC);
CREATE UNIQUE INDEX idx_fle_idempotency ON public.finance_lifecycle_events(finance_request_id, idempotency_key) WHERE idempotency_key IS NOT NULL;

-- RLS
ALTER TABLE public.finance_lifecycle_events ENABLE ROW LEVEL SECURITY;

-- Policy: service role (edge functions) can insert
CREATE POLICY "Service role full access on finance_lifecycle_events"
ON public.finance_lifecycle_events
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy: authenticated users can read events for their tenant's requests
CREATE POLICY "Tenant users can read finance lifecycle events"
ON public.finance_lifecycle_events
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.finance_requests fr
    JOIN public.memberships m ON m.tenant_id = fr.tenant_id AND m.user_id = auth.uid()
    WHERE fr.id = finance_lifecycle_events.finance_request_id
  )
);

-- 2) Fix commissions.platform_share_pct default from 30 to 25
ALTER TABLE public.commissions ALTER COLUMN platform_share_pct SET DEFAULT 25;

-- Correct existing pending/approved finance commissions
UPDATE public.commissions
SET platform_share_pct = 25
WHERE platform_share_pct = 30
  AND reference_type IN ('finance_mandate', 'finance_request')
  AND status IN ('pending', 'approved');
