-- =====================================================
-- RLS-Policies für öffentlichen Bilder-Zugriff (Kaufy) 
-- und Partner-Zugriff auf Dokumente
-- =====================================================

-- 1. Öffentlicher Lesezugriff auf BILDER von aktiven Kaufy-Listings
CREATE POLICY "public_read_kaufy_images"
  ON public.documents FOR SELECT
  USING (
    mime_type LIKE 'image/%'
    AND EXISTS (
      SELECT 1 FROM document_links dl
      JOIN listings l ON dl.object_id = l.property_id
      JOIN listing_publications lp ON lp.listing_id = l.id
      WHERE dl.document_id = documents.id
        AND dl.object_type = 'property'
        AND lp.channel = 'kaufy'
        AND lp.status = 'active'
    )
  );

-- 2. Passende Policy für document_links (Bilder von Kaufy-Listings)
CREATE POLICY "public_read_kaufy_image_links"
  ON public.document_links FOR SELECT
  USING (
    object_type = 'property'
    AND EXISTS (
      SELECT 1 FROM documents d
      JOIN listings l ON document_links.object_id = l.property_id
      JOIN listing_publications lp ON lp.listing_id = l.id
      WHERE d.id = document_links.document_id
        AND d.mime_type LIKE 'image/%'
        AND lp.channel = 'kaufy'
        AND lp.status = 'active'
    )
  );

-- 3. Partner können ALLE Dokumente von Partner-Netzwerk-Listings sehen (inkl. PDFs)
-- Diese Policy gilt nur für eingeloggte Benutzer
CREATE POLICY "partner_read_network_documents"
  ON public.documents FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM document_links dl
      JOIN listings l ON dl.object_id = l.property_id
      JOIN listing_publications lp ON lp.listing_id = l.id
      WHERE dl.document_id = documents.id
        AND dl.object_type = 'property'
        AND lp.channel = 'partner_network'
        AND lp.status = 'active'
    )
  );

-- 4. Partner können document_links für Partner-Netzwerk-Listings sehen
CREATE POLICY "partner_read_network_document_links"
  ON public.document_links FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND object_type = 'property'
    AND EXISTS (
      SELECT 1 FROM listings l
      JOIN listing_publications lp ON lp.listing_id = l.id
      WHERE document_links.object_id = l.property_id
        AND lp.channel = 'partner_network'
        AND lp.status = 'active'
    )
  );