ALTER TABLE public.dev_projects
ADD COLUMN IF NOT EXISTS invest_engine_analyzed BOOLEAN DEFAULT false;