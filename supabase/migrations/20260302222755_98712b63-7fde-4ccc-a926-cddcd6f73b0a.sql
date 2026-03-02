
-- F1: Add audit columns to tenancy_lifecycle_events
ALTER TABLE public.tenancy_lifecycle_events
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
  ADD COLUMN IF NOT EXISTS event_source TEXT,
  ADD COLUMN IF NOT EXISTS actor_type TEXT DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS correlation_key TEXT;

-- Unique partial index for idempotency
CREATE UNIQUE INDEX IF NOT EXISTS idx_tlc_events_idempotency
  ON public.tenancy_lifecycle_events (lease_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Performance index for event_source queries
CREATE INDEX IF NOT EXISTS idx_tlc_events_source
  ON public.tenancy_lifecycle_events (event_source)
  WHERE event_source IS NOT NULL;

COMMENT ON COLUMN public.tenancy_lifecycle_events.idempotency_key IS 'Unique key per lease for at-most-once event creation. Pattern: <event_category>:<qualifier>:<date>';
COMMENT ON COLUMN public.tenancy_lifecycle_events.event_source IS 'Origin of the event, e.g. cron:sot-tenancy-lifecycle, mod04:tenancy_tab, zone1:property_desk';
COMMENT ON COLUMN public.tenancy_lifecycle_events.actor_type IS 'Type of actor: user, system, cron, ai, edge_fn';
COMMENT ON COLUMN public.tenancy_lifecycle_events.correlation_key IS 'Links related events across systems (e.g. cron run ID)';
