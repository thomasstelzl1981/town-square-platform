-- Add missing index on documents.file_path to fix storage RLS timeout
-- The storage policies partner_read_network_listing_documents and public_read_kaufy_listing_images
-- both use d.file_path = objects.name which causes full table scans without this index
CREATE INDEX IF NOT EXISTS idx_documents_file_path ON public.documents USING btree (file_path);

-- Also add a composite index for the common join pattern in storage policies
CREATE INDEX IF NOT EXISTS idx_document_links_object_type_object_id ON public.document_links USING btree (object_type, object_id) WHERE (object_type = 'property');