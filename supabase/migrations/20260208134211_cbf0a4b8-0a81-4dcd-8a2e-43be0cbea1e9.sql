-- Fix RLS recursion: Create SECURITY DEFINER function to check Kaufy image access
-- This breaks the circular dependency between documents and document_links policies

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
      AND lp.channel = 'kaufy'
      AND lp.status = 'active'
  )
$$;

-- Drop potentially recursive policies first
DROP POLICY IF EXISTS "public_read_kaufy_images" ON public.documents;
DROP POLICY IF EXISTS "public_read_kaufy_image_links" ON public.document_links;

-- Create new non-recursive policy for documents using the function
CREATE POLICY "public_read_kaufy_images_v2"
ON public.documents
FOR SELECT
TO anon, authenticated
USING (
  public.is_kaufy_public_image_document(id)
);

-- Create new non-recursive policy for document_links
CREATE POLICY "public_read_kaufy_image_links_v2"
ON public.document_links
FOR SELECT
TO anon, authenticated
USING (
  object_type = 'property'
  AND public.is_kaufy_public_image_document(document_id)
);