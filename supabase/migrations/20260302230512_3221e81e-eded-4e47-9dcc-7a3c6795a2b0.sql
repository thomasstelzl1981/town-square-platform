-- Alignment #1: Add idempotency_key to tenancy_tasks + partial unique index
-- This harmonizes TLC with FDC's "unique open" pattern

ALTER TABLE public.tenancy_tasks
ADD COLUMN IF NOT EXISTS idempotency_key text;

-- Partial unique index: only one open/in_progress task per idempotency_key per tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_tenancy_tasks_open_idempotency
ON public.tenancy_tasks (tenant_id, idempotency_key)
WHERE idempotency_key IS NOT NULL AND status IN ('open', 'in_progress');

COMMENT ON COLUMN public.tenancy_tasks.idempotency_key IS 'Optional dedup key following TLC_IDEMPOTENCY_KEYS patterns. Partial unique on open/in_progress tasks.';