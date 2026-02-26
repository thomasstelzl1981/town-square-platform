
-- Schritt 1: SECURITY DEFINER Wrapper-Funktionen

CREATE OR REPLACE FUNCTION public.is_kaufy_storage_object(object_name text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM documents d
    JOIN document_links dl ON d.id = dl.document_id
    JOIN listings l ON dl.object_id = l.property_id
      AND dl.object_type = 'property'
    JOIN listing_publications lp ON lp.listing_id = l.id
    WHERE d.file_path = object_name
      AND d.mime_type LIKE 'image/%'
      AND lp.channel = 'kaufy'
      AND lp.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_partner_network_storage_object(object_name text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM documents d
    JOIN document_links dl ON d.id = dl.document_id
    JOIN listings l ON dl.object_id = l.property_id
      AND dl.object_type = 'property'
    JOIN listing_publications lp ON lp.listing_id = l.id
    WHERE d.file_path = object_name
      AND lp.channel = 'partner_network'
      AND lp.status = 'active'
  );
$$;

-- Schritt 2: Storage-Policies auf Funktionsaufrufe umstellen

DROP POLICY IF EXISTS "public_read_kaufy_listing_images" ON storage.objects;
CREATE POLICY "public_read_kaufy_listing_images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'tenant-documents'
  AND public.is_kaufy_storage_object(name)
);

DROP POLICY IF EXISTS "partner_read_network_listing_documents" ON storage.objects;
CREATE POLICY "partner_read_network_listing_documents" ON storage.objects
FOR SELECT TO authenticated USING (
  bucket_id = 'tenant-documents'
  AND public.is_partner_network_storage_object(name)
);

-- Schritt 3: Performance-Indizes

CREATE INDEX IF NOT EXISTS idx_profiles_id_active_tenant
  ON profiles (id, active_tenant_id);

CREATE INDEX IF NOT EXISTS idx_document_links_object_type_property
  ON document_links (object_id, document_id)
  WHERE object_type = 'property';

CREATE INDEX IF NOT EXISTS idx_listing_publications_channel_status
  ON listing_publications (listing_id, channel, status)
  WHERE status = 'active';
