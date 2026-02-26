-- Admin INSERT policy for tenant-documents bucket
-- Allows platform_admin to upload with any path prefix (e.g. platform/brand-templates/...)
CREATE POLICY "platform_admin_insert_tenant_documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tenant-documents'
  AND EXISTS (
    SELECT 1 FROM public.memberships m
    WHERE m.user_id = auth.uid()
      AND m.role = 'platform_admin'
  )
);