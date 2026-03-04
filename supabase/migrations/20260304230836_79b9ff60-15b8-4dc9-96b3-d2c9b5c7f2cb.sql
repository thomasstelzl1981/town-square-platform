
-- Add project_id to armstrong_chat_sessions for project-session linking
ALTER TABLE public.armstrong_chat_sessions 
  ADD COLUMN project_id UUID REFERENCES public.armstrong_projects(id) ON DELETE SET NULL;

CREATE INDEX idx_armstrong_chat_sessions_project ON public.armstrong_chat_sessions(project_id);
