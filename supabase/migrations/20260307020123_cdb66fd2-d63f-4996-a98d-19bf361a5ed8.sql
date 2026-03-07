-- DB Hardening: Update is_kaufy_public_image_document to filter on link_status='linked'
-- This prevents archived/unlinked document_links from leaking through RLS policies

CREATE OR REPLACE FUNCTION public.is_kaufy_public_image_document(doc_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM documents d
    JOIN document_links dl ON dl.document_id = d.id
    JOIN listings l ON dl.object_id = l.property_id AND dl.object_type = 'property'
    JOIN listing_publications lp ON lp.listing_id = l.id
    WHERE d.id = doc_id
      AND d.mime_type LIKE 'image/%'
      AND dl.link_status = 'linked'
      AND lp.channel = 'kaufy'
      AND lp.status = 'active'
  )
$$;