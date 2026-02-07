-- Add display_order and is_title_image columns to document_links
ALTER TABLE document_links 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

ALTER TABLE document_links 
ADD COLUMN IF NOT EXISTS is_title_image BOOLEAN DEFAULT false;

-- Index for sorting by object and display_order
CREATE INDEX IF NOT EXISTS idx_document_links_display_order 
ON document_links(object_id, display_order);

-- Unique partial index: Only one title image per object
CREATE UNIQUE INDEX IF NOT EXISTS idx_document_links_title_image 
ON document_links(object_id, object_type) 
WHERE is_title_image = true;