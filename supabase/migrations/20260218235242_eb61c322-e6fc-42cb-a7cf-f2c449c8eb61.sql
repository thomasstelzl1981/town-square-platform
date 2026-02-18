ALTER TABLE public.social_mandates
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.dev_projects(id);
CREATE INDEX IF NOT EXISTS idx_social_mandates_project ON public.social_mandates(project_id);