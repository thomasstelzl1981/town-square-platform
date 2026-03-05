
-- Allow authenticated users to upload to acq-documents bucket under their tenant folder
CREATE POLICY "tenant_member_upload_manual"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'acq-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT m.tenant_id::text 
    FROM public.memberships m 
    WHERE m.user_id = auth.uid()
  )
);

-- Allow authenticated tenant members to read their uploaded files
CREATE POLICY "tenant_member_read_acq_documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'acq-documents'
  AND (storage.foldername(name))[1] IN (
    SELECT m.tenant_id::text 
    FROM public.memberships m 
    WHERE m.user_id = auth.uid()
  )
);
