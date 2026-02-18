
-- Create extraction_jobs table for Storage Extraction Engine (ENG-STOREX)
CREATE TABLE public.extraction_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'paused', 'completed', 'failed', 'cancelled')),
  folder_id UUID REFERENCES public.storage_nodes(id) ON DELETE SET NULL,
  total_files INT NOT NULL DEFAULT 0,
  processed_files INT NOT NULL DEFAULT 0,
  failed_files INT NOT NULL DEFAULT 0,
  skipped_files INT NOT NULL DEFAULT 0,
  credits_reserved INT NOT NULL DEFAULT 0,
  credits_used INT NOT NULL DEFAULT 0,
  batch_size INT NOT NULL DEFAULT 10,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_log JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.extraction_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Tenant isolation
CREATE POLICY "Users can view own tenant extraction jobs"
  ON public.extraction_jobs FOR SELECT
  USING (tenant_id = (SELECT get_user_tenant_id()));

CREATE POLICY "Users can create extraction jobs for own tenant"
  ON public.extraction_jobs FOR INSERT
  WITH CHECK (tenant_id = (SELECT get_user_tenant_id()));

CREATE POLICY "Users can update own tenant extraction jobs"
  ON public.extraction_jobs FOR UPDATE
  USING (tenant_id = (SELECT get_user_tenant_id()));

-- Performance indexes
CREATE INDEX idx_extraction_jobs_tenant_status ON public.extraction_jobs(tenant_id, status);
CREATE INDEX idx_extraction_jobs_tenant_created ON public.extraction_jobs(tenant_id, created_at);

-- Trigger for updated_at
CREATE TRIGGER update_extraction_jobs_updated_at
  BEFORE UPDATE ON public.extraction_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
