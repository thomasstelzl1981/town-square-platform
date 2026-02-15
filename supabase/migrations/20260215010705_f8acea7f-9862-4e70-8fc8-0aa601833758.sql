
-- =============================================================================
-- Dossier Auto-Research Jobs — tracks Armstrong's automatic research per entity
-- =============================================================================

CREATE TABLE public.dossier_research_jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.organizations(id),
  user_id uuid NOT NULL,
  entity_type text NOT NULL, -- 'vehicle', 'insurance', 'pv_plant'
  entity_id uuid NOT NULL,
  search_query text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
  result_storage_path text, -- path in tenant-documents bucket
  result_json jsonb, -- cached JSON knowledge for Armstrong
  error_message text,
  perplexity_model text DEFAULT 'sonar',
  tokens_used integer,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dossier_research_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own tenant research jobs"
  ON public.dossier_research_jobs FOR SELECT
  USING (tenant_id = (SELECT get_user_tenant_id()));

CREATE POLICY "Users can insert own tenant research jobs"
  ON public.dossier_research_jobs FOR INSERT
  WITH CHECK (tenant_id = (SELECT get_user_tenant_id()));

CREATE POLICY "Users can update own tenant research jobs"
  ON public.dossier_research_jobs FOR UPDATE
  USING (tenant_id = (SELECT get_user_tenant_id()));

-- Index for quick entity lookup
CREATE INDEX idx_dossier_jobs_entity ON public.dossier_research_jobs(entity_type, entity_id);
CREATE INDEX idx_dossier_jobs_tenant ON public.dossier_research_jobs(tenant_id);

-- Enable Realtime for status updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.dossier_research_jobs;
