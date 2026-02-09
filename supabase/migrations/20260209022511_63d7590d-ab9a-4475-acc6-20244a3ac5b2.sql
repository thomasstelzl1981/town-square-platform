-- Create storage bucket for project documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-documents',
  'project-documents',
  false,
  20971520, -- 20MB limit
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv', 'image/jpeg', 'image/png']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for project documents
CREATE POLICY "Users can upload project documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-documents' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view project documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'project-documents'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their project documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'project-documents'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Service role full access to project documents"
ON storage.objects FOR ALL
USING (bucket_id = 'project-documents')
WITH CHECK (bucket_id = 'project-documents');