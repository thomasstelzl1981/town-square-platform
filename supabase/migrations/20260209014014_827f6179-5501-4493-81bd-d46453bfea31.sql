-- Schritt 1: Neue Spalten zur integration_registry hinzufügen
ALTER TABLE public.integration_registry
  ADD COLUMN IF NOT EXISTS base_url TEXT,
  ADD COLUMN IF NOT EXISTS auth_type TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS data_scope TEXT,
  ADD COLUMN IF NOT EXISTS caching_policy_min INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rate_limit_notes TEXT,
  ADD COLUMN IF NOT EXISTS cost_model TEXT DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS cost_hint TEXT,
  ADD COLUMN IF NOT EXISTS owner TEXT DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS risks TEXT,
  ADD COLUMN IF NOT EXISTS guardrails TEXT,
  ADD COLUMN IF NOT EXISTS widget_code TEXT,
  ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMPTZ;