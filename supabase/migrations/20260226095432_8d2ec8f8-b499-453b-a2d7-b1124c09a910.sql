-- Migration: Add slot_key to document_links for image slot mapping
ALTER TABLE public.document_links
  ADD COLUMN IF NOT EXISTS slot_key TEXT;

-- Index for performant slot-based queries
CREATE INDEX IF NOT EXISTS idx_document_links_slot_key
  ON public.document_links (tenant_id, object_id, object_type, slot_key);