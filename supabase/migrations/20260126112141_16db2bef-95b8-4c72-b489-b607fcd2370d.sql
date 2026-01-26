-- Create DMS storage bucket for tenant documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tenant-documents',
  'tenant-documents',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
);

-- RLS policies for tenant-documents bucket
-- Users can only access files in their tenant's folder
CREATE POLICY "Users can upload to their tenant folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tenant-documents'
  AND (storage.foldername(name))[1] = (
    SELECT active_tenant_id::text 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can view their tenant files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'tenant-documents'
  AND (storage.foldername(name))[1] = (
    SELECT active_tenant_id::text 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update their tenant files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'tenant-documents'
  AND (storage.foldername(name))[1] = (
    SELECT active_tenant_id::text 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can delete their tenant files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'tenant-documents'
  AND (storage.foldername(name))[1] = (
    SELECT active_tenant_id::text 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
);