-- =====================================================
-- MOD-03 DMS VERVOLLSTÄNDIGUNG: document_chunks für RAG
-- Pattern: memberships-basierte RLS (wie documents)
-- =====================================================

-- 1) document_chunks Tabelle für semantische Suche / Armstrong
CREATE TABLE IF NOT EXISTS public.document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL DEFAULT 0,
  text TEXT NOT NULL,
  page_number INTEGER,
  char_start INTEGER,
  char_end INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT unique_document_chunk UNIQUE (document_id, chunk_index)
);

-- 2) Indizes für schnelle Suche
CREATE INDEX IF NOT EXISTS idx_document_chunks_tenant ON public.document_chunks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_document ON public.document_chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_document_chunks_text_search ON public.document_chunks USING gin(to_tsvector('german', text));

-- 3) RLS aktivieren
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

-- 4) RLS Policies für document_chunks (memberships-Pattern)
CREATE POLICY "chunks_select_member"
  ON public.document_chunks
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid() 
      AND m.tenant_id = document_chunks.tenant_id
    )
  );

CREATE POLICY "chunks_insert_member"
  ON public.document_chunks
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid() 
      AND m.tenant_id = document_chunks.tenant_id
    )
  );

CREATE POLICY "chunks_delete_member"
  ON public.document_chunks
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.user_id = auth.uid() 
      AND m.tenant_id = document_chunks.tenant_id
      AND m.role = 'org_admin'
    )
  );

-- 5) Platform Admin Bypass
CREATE POLICY "chunks_all_platform_admin"
  ON public.document_chunks
  FOR ALL
  USING (public.is_platform_admin());

-- 6) Extraction-Tabelle erweitern (falls Spalten fehlen)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'extractions' 
                 AND column_name = 'consent_mode') THEN
    ALTER TABLE public.extractions ADD COLUMN consent_mode TEXT DEFAULT 'single';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'extractions' 
                 AND column_name = 'consent_given_at') THEN
    ALTER TABLE public.extractions ADD COLUMN consent_given_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'extractions' 
                 AND column_name = 'estimated_cost') THEN
    ALTER TABLE public.extractions ADD COLUMN estimated_cost DECIMAL(10,4);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'extractions' 
                 AND column_name = 'actual_cost') THEN
    ALTER TABLE public.extractions ADD COLUMN actual_cost DECIMAL(10,4);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'extractions' 
                 AND column_name = 'chunks_count') THEN
    ALTER TABLE public.extractions ADD COLUMN chunks_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- 7) Funktion für Volltextsuche in Chunks (Armstrong)
CREATE OR REPLACE FUNCTION public.search_document_chunks(
  p_tenant_id UUID,
  p_query TEXT,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  document_id UUID,
  chunk_id UUID,
  chunk_text TEXT,
  page_number INTEGER,
  rank REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dc.document_id,
    dc.id AS chunk_id,
    dc.text AS chunk_text,
    dc.page_number,
    ts_rank(to_tsvector('german', dc.text), plainto_tsquery('german', p_query)) AS rank
  FROM public.document_chunks dc
  WHERE dc.tenant_id = p_tenant_id
    AND to_tsvector('german', dc.text) @@ plainto_tsquery('german', p_query)
  ORDER BY rank DESC
  LIMIT p_limit;
END;
$$;

-- 8) Kommentare für Dokumentation
COMMENT ON TABLE public.document_chunks IS 'Chunked document content for RAG/Armstrong AI search. Each chunk represents a segment of extracted document text.';
COMMENT ON FUNCTION public.search_document_chunks IS 'Full-text search across document chunks for Armstrong AI integration.';