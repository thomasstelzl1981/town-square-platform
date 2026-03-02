
-- Create process_health_log table for unified TLC/SLC monitoring
CREATE TABLE public.process_health_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  system text NOT NULL CHECK (system IN ('tlc', 'slc')),
  run_date date NOT NULL,
  tenant_id text NULL,
  cases_checked integer NOT NULL DEFAULT 0,
  issues_found integer NOT NULL DEFAULT 0,
  events_created integer NOT NULL DEFAULT 0,
  ai_summary text NULL,
  details jsonb NULL,
  status text NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'error', 'skipped')),
  error_message text NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.process_health_log ENABLE ROW LEVEL SECURITY;

-- RLS: platform_admin can read
CREATE POLICY "Admins can read process health logs"
ON public.process_health_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'platform_admin'));

-- Index for efficient queries
CREATE INDEX idx_process_health_log_system_date ON public.process_health_log (system, run_date DESC);
