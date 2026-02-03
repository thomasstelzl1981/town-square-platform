-- Create a public bucket for documentation exports
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'docs-export',
  'docs-export',
  true,
  52428800, -- 50MB limit
  ARRAY['application/zip', 'application/x-zip-compressed']
)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read from the bucket (public download links)
CREATE POLICY "Public read access for docs-export"
ON storage.objects FOR SELECT
USING (bucket_id = 'docs-export');

-- Only authenticated admins can upload/delete
CREATE POLICY "Admin upload to docs-export"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'docs-export'
  AND auth.role() = 'authenticated'
  AND public.is_platform_admin()
);

CREATE POLICY "Admin delete from docs-export"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'docs-export'
  AND public.is_platform_admin()
);