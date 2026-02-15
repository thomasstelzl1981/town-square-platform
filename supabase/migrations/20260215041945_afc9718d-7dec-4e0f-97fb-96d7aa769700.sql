
-- Legal documents table for Patientenverfügung, Vorsorgevollmacht, Testament
CREATE TABLE public.legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  document_type TEXT NOT NULL,
  person_id UUID REFERENCES public.household_persons(id) ON DELETE SET NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  storage_node_id UUID REFERENCES public.storage_nodes(id) ON DELETE SET NULL,
  form_data JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "legal_docs_select" ON public.legal_documents
  FOR SELECT USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "legal_docs_insert" ON public.legal_documents
  FOR INSERT WITH CHECK (tenant_id = public.get_user_tenant_id());

CREATE POLICY "legal_docs_update" ON public.legal_documents
  FOR UPDATE USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "legal_docs_delete" ON public.legal_documents
  FOR DELETE USING (tenant_id = public.get_user_tenant_id());

-- updated_at trigger
CREATE TRIGGER update_legal_documents_updated_at
  BEFORE UPDATE ON public.legal_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
