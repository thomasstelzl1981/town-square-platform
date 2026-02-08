-- ============================================================================
-- Storage RLS: Public read access to images of active Kaufy listings
-- ============================================================================

-- Policy: Anonymous users can read images from tenant-documents bucket
-- if the image is linked to a property with an active "kaufy" publication
CREATE POLICY "public_read_kaufy_listing_images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'tenant-documents'
  AND (
    name LIKE '%.jpg' 
    OR name LIKE '%.jpeg' 
    OR name LIKE '%.png'
    OR name LIKE '%.webp'
  )
  AND EXISTS (
    SELECT 1 
    FROM public.documents d
    JOIN public.document_links dl ON d.id = dl.document_id
    JOIN public.listings l ON dl.object_id = l.property_id
    JOIN public.listing_publications lp ON lp.listing_id = l.id
    WHERE d.file_path = storage.objects.name
      AND dl.object_type = 'property'
      AND lp.channel = 'kaufy'
      AND lp.status = 'active'
  )
);

-- Policy: Authenticated partners can read ALL documents (including PDFs)
-- from properties with active partner_network publications
CREATE POLICY "partner_read_network_listing_documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'tenant-documents'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 
    FROM public.documents d
    JOIN public.document_links dl ON d.id = dl.document_id
    JOIN public.listings l ON dl.object_id = l.property_id
    JOIN public.listing_publications lp ON lp.listing_id = l.id
    WHERE d.file_path = storage.objects.name
      AND dl.object_type = 'property'
      AND lp.channel = 'partner_network'
      AND lp.status = 'active'
  )
);