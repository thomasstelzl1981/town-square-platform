-- P1: Fix doc_type case in RLS policy from 'CONTRACT' to 'contract'
DROP POLICY IF EXISTS "docs_insert_contract_member" ON public.documents;

CREATE POLICY "docs_insert_contract_member" ON public.documents
  FOR INSERT
  WITH CHECK (
    doc_type = 'contract'
    AND uploaded_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM memberships m
      WHERE m.user_id = auth.uid()
        AND m.tenant_id = documents.tenant_id
    )
  );