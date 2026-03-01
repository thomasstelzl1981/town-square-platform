
-- Create mail_compose_templates table for Zone 2 user email templates
CREATE TABLE public.mail_compose_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'allgemein',
  subject_template TEXT NOT NULL DEFAULT '',
  body_template TEXT NOT NULL DEFAULT '',
  placeholders JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.mail_compose_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant templates"
  ON public.mail_compose_templates FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create templates"
  ON public.mail_compose_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own templates"
  ON public.mail_compose_templates FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()
    )
    AND (user_id = auth.uid() OR user_id IS NULL)
  );

CREATE POLICY "Users can delete own templates"
  ON public.mail_compose_templates FOR DELETE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM public.memberships WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

CREATE INDEX idx_mail_compose_templates_tenant ON public.mail_compose_templates (tenant_id, is_active);

CREATE TRIGGER update_mail_compose_templates_updated_at
  BEFORE UPDATE ON public.mail_compose_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
