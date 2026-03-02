-- F1: Add audit columns + idempotency to sales_lifecycle_events
ALTER TABLE public.sales_lifecycle_events
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS event_source TEXT,
  ADD COLUMN IF NOT EXISTS actor_type TEXT DEFAULT 'user' CHECK (actor_type IN ('user', 'system', 'cron', 'edge_fn')),
  ADD COLUMN IF NOT EXISTS correlation_key TEXT;

-- F1: Unique partial index for idempotency
CREATE UNIQUE INDEX IF NOT EXISTS idx_sle_idempotency
  ON public.sales_lifecycle_events (case_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- F1: Timeline index for phase-change queries
CREATE INDEX IF NOT EXISTS idx_sle_phase_change
  ON public.sales_lifecycle_events (case_id, created_at DESC)
  WHERE phase_before IS DISTINCT FROM phase_after;

-- F5: Unique constraint on sales_settlements per case (prevent double-billing)
CREATE UNIQUE INDEX IF NOT EXISTS idx_settlements_case_unique
  ON public.sales_settlements (case_id, reservation_id)
  WHERE status NOT IN ('cancelled', 'voided');