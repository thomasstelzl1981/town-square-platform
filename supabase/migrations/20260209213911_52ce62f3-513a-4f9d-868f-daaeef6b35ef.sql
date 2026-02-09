
-- task_widgets table for Armstrong-created widgets
CREATE TABLE public.task_widgets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.organizations(id),
  user_id uuid NOT NULL,
  type text NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending',
  risk_level text NOT NULL DEFAULT 'low',
  cost_model text NOT NULL DEFAULT 'free',
  action_code text,
  parameters jsonb,
  source text NOT NULL DEFAULT 'system',
  source_ref uuid,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indices
CREATE INDEX idx_task_widgets_tenant ON public.task_widgets(tenant_id);
CREATE INDEX idx_task_widgets_user ON public.task_widgets(user_id);
CREATE INDEX idx_task_widgets_status ON public.task_widgets(status);

-- RLS
ALTER TABLE public.task_widgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for task_widgets"
  ON public.task_widgets FOR SELECT
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can insert own task_widgets"
  ON public.task_widgets FOR INSERT
  WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can update own task_widgets"
  ON public.task_widgets FOR UPDATE
  USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Users can delete own task_widgets"
  ON public.task_widgets FOR DELETE
  USING (tenant_id = public.get_user_tenant_id());

-- Service role policy for edge functions (webhook creates widgets)
CREATE POLICY "Service role full access on task_widgets"
  ON public.task_widgets FOR ALL
  USING (true)
  WITH CHECK (true);

-- Updated_at trigger
CREATE TRIGGER update_task_widgets_updated_at
  BEFORE UPDATE ON public.task_widgets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.task_widgets;

-- Increment unread RPC for WhatsApp
CREATE OR REPLACE FUNCTION public.increment_unread(conversation_uuid uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE whatsapp_conversations
  SET unread_count = COALESCE(unread_count, 0) + 1
  WHERE id = conversation_uuid;
$$;
