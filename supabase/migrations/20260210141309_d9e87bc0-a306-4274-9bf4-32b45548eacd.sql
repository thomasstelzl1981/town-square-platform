
-- K1: RLS policy for commissions INSERT via TermsGate (members or liable user)
CREATE POLICY "com_insert_via_terms_gate" ON public.commissions
  FOR INSERT TO authenticated
  WITH CHECK (
    liable_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.user_id = auth.uid()
        AND m.tenant_id = commissions.tenant_id
    )
  );

-- K2: RLS policy for documents INSERT for contract docs by members
CREATE POLICY "docs_insert_contract_member" ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (
    doc_type = 'CONTRACT'
    AND uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.user_id = auth.uid()
        AND m.tenant_id = documents.tenant_id
    )
  );

-- K3: Create storage bucket "documents" if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents bucket
CREATE POLICY "docs_storage_insert_authenticated" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "docs_storage_select_authenticated" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'documents');
