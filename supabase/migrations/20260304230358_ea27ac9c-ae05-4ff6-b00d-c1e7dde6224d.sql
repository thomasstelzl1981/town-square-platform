
-- Armstrong Projects table for workspace
CREATE TABLE public.armstrong_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  goal TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
  linked_entities JSONB DEFAULT '{}',
  memory_snippets JSONB DEFAULT '[]',
  task_list JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_armstrong_projects_user ON public.armstrong_projects(user_id);
CREATE INDEX idx_armstrong_projects_tenant ON public.armstrong_projects(tenant_id);

-- RLS
ALTER TABLE public.armstrong_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON public.armstrong_projects FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own projects"
  ON public.armstrong_projects FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own projects"
  ON public.armstrong_projects FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own projects"
  ON public.armstrong_projects FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());
