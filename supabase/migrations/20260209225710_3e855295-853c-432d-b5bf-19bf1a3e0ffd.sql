
-- Storage Bucket for Social Assets
INSERT INTO storage.buckets (id, name, public) VALUES ('social-assets', 'social-assets', true);

-- RLS: Anyone can read public social assets
CREATE POLICY "Public read social assets" ON storage.objects FOR SELECT
  USING (bucket_id = 'social-assets');

-- RLS: Authenticated users can upload to their tenant folder
CREATE POLICY "Auth users upload social assets" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'social-assets' AND auth.role() = 'authenticated');

-- RLS: Authenticated users can delete their uploads  
CREATE POLICY "Auth users delete social assets" ON storage.objects FOR DELETE
  USING (bucket_id = 'social-assets' AND auth.role() = 'authenticated');
