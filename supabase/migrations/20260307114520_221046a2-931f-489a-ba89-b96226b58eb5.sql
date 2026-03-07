
-- Drop old RLS policies on storage.objects for acq-documents bucket
DROP POLICY IF EXISTS "acq_docs_insert" ON storage.objects;
DROP POLICY IF EXISTS "acq_docs_select" ON storage.objects;
DROP POLICY IF EXISTS "acq_docs_admin" ON storage.objects;
DROP POLICY IF EXISTS "tenant_member_upload_manual" ON storage.objects;
DROP POLICY IF EXISTS "tenant_member_read_acq_documents" ON storage.objects;

-- New unified RLS: tenant members can INSERT files under their tenant_id prefix
CREATE POLICY "acq_docs_tenant_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'acq-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT m.tenant_id::text 
    FROM public.memberships m 
    WHERE m.user_id = auth.uid()
  )
);

-- New unified RLS: tenant members can SELECT/read files under their tenant_id prefix
CREATE POLICY "acq_docs_tenant_select"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'acq-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT m.tenant_id::text 
    FROM public.memberships m 
    WHERE m.user_id = auth.uid()
  )
);

-- Platform admin full access
CREATE POLICY "acq_docs_platform_admin"
ON storage.objects FOR ALL
USING (
  bucket_id = 'acq-documents'
  AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'platform_admin')
);
