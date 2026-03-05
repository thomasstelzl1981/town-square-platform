ALTER TABLE public.document_chunks 
ADD COLUMN IF NOT EXISTS extraction_depth text NOT NULL DEFAULT 'full' 
CHECK (extraction_depth IN ('metadata', 'light', 'full'));