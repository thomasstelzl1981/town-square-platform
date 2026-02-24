-- Fix: docs_insert_member soll für ALLE Tenant-Mitglieder gelten, nicht nur org_admin/internal_ops
DROP POLICY "docs_insert_member" ON public.documents;

CREATE POLICY "docs_insert_member" ON public.documents
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.user_id = auth.uid()
    AND m.tenant_id = documents.tenant_id
  )
);