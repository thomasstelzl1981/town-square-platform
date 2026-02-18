
-- ============================================================
-- Phase 2 — Document Intelligence Engine: Full DB Setup
-- ============================================================

-- ── P2.2: NK-Beleg-Extractions ──
CREATE TABLE IF NOT EXISTS public.nk_beleg_extractions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id),
  unit_id UUID REFERENCES public.units(id),
  
  -- Extracted fields
  provider_name TEXT,
  provider_type TEXT, -- strom, gas, wasser, heizung, muell, versicherung, grundsteuer, sonstige
  billing_period_start DATE,
  billing_period_end DATE,
  total_amount NUMERIC(12,2),
  prepayment_amount NUMERIC(12,2),
  balance_amount NUMERIC(12,2), -- Nachzahlung (+) oder Guthaben (-)
  cost_category TEXT, -- maps to NK-Abrechnung position
  meter_number TEXT,
  meter_reading_start NUMERIC(12,2),
  meter_reading_end NUMERIC(12,2),
  consumption_value NUMERIC(12,4),
  consumption_unit TEXT, -- kWh, m³, etc.
  
  -- Data Provenance (DPR-01)
  confidence FLOAT NOT NULL DEFAULT 0.0,
  needs_review BOOLEAN NOT NULL DEFAULT true,
  extractor_version TEXT DEFAULT '1.0',
  extracted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.nk_beleg_extractions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for nk_beleg_extractions"
  ON public.nk_beleg_extractions FOR ALL
  USING (tenant_id IN (SELECT unnest(public.my_scope_org_ids(
    (SELECT active_tenant_id FROM public.profiles WHERE id = auth.uid())
  ))));

CREATE INDEX idx_nk_beleg_tenant_created ON public.nk_beleg_extractions (tenant_id, created_at DESC);
CREATE INDEX idx_nk_beleg_document ON public.nk_beleg_extractions (document_id);
CREATE INDEX idx_nk_beleg_property ON public.nk_beleg_extractions (property_id);

-- ── P2.3/P2.4: Cloud Sync Connectors ──
CREATE TABLE IF NOT EXISTS public.cloud_sync_connectors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  provider TEXT NOT NULL CHECK (provider IN ('google_drive', 'dropbox', 'onedrive')),
  status TEXT NOT NULL DEFAULT 'not_connected' CHECK (status IN ('not_connected', 'connected', 'syncing', 'error', 'revoked')),
  
  -- OAuth tokens (encrypted at rest by Supabase)
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  
  -- Sync config
  remote_folder_id TEXT,
  remote_folder_name TEXT,
  last_sync_at TIMESTAMPTZ,
  last_sync_files_count INTEGER DEFAULT 0,
  sync_interval_minutes INTEGER DEFAULT 60,
  auto_extract BOOLEAN DEFAULT true,
  
  -- Metadata
  account_email TEXT,
  account_name TEXT,
  error_message TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(tenant_id, provider)
);

ALTER TABLE public.cloud_sync_connectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for cloud_sync_connectors"
  ON public.cloud_sync_connectors FOR ALL
  USING (tenant_id IN (SELECT unnest(public.my_scope_org_ids(
    (SELECT active_tenant_id FROM public.profiles WHERE id = auth.uid())
  ))));

CREATE INDEX idx_cloud_sync_tenant ON public.cloud_sync_connectors (tenant_id);

-- Cloud Sync Log
CREATE TABLE IF NOT EXISTS public.cloud_sync_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  connector_id UUID NOT NULL REFERENCES public.cloud_sync_connectors(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'error')),
  files_synced INTEGER DEFAULT 0,
  files_extracted INTEGER DEFAULT 0,
  credits_used INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.cloud_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for cloud_sync_log"
  ON public.cloud_sync_log FOR ALL
  USING (tenant_id IN (SELECT unnest(public.my_scope_org_ids(
    (SELECT active_tenant_id FROM public.profiles WHERE id = auth.uid())
  ))));

CREATE INDEX idx_cloud_sync_log_tenant ON public.cloud_sync_log (tenant_id, started_at DESC);

-- ── P2.5: FinAPI Connections ──
CREATE TABLE IF NOT EXISTS public.finapi_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  status TEXT NOT NULL DEFAULT 'not_connected' CHECK (status IN ('not_connected', 'pending', 'connected', 'error', 'revoked')),
  
  -- FinAPI identifiers
  finapi_user_id TEXT,
  finapi_connection_id TEXT,
  bank_name TEXT,
  bank_bic TEXT,
  iban_masked TEXT,
  
  -- Sync state
  last_sync_at TIMESTAMPTZ,
  last_sync_transactions INTEGER DEFAULT 0,
  sync_from_date DATE,
  auto_match BOOLEAN DEFAULT true,
  
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.finapi_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for finapi_connections"
  ON public.finapi_connections FOR ALL
  USING (tenant_id IN (SELECT unnest(public.my_scope_org_ids(
    (SELECT active_tenant_id FROM public.profiles WHERE id = auth.uid())
  ))));

CREATE INDEX idx_finapi_conn_tenant ON public.finapi_connections (tenant_id);

-- FinAPI Transactions (imported)
CREATE TABLE IF NOT EXISTS public.finapi_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.organizations(id),
  connection_id UUID NOT NULL REFERENCES public.finapi_connections(id) ON DELETE CASCADE,
  
  -- Transaction data
  finapi_transaction_id TEXT,
  booking_date DATE NOT NULL,
  value_date DATE,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  counterpart_name TEXT,
  counterpart_iban TEXT,
  purpose TEXT,
  bank_booking_key TEXT,
  
  -- Matching
  matched_contract_id UUID, -- FK to leases, loans, etc.
  matched_contract_type TEXT, -- 'lease', 'loan', 'insurance'
  match_confidence FLOAT,
  match_status TEXT DEFAULT 'unmatched' CHECK (match_status IN ('unmatched', 'auto_matched', 'confirmed', 'rejected')),
  matched_at TIMESTAMPTZ,
  matched_by UUID,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.finapi_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation for finapi_transactions"
  ON public.finapi_transactions FOR ALL
  USING (tenant_id IN (SELECT unnest(public.my_scope_org_ids(
    (SELECT active_tenant_id FROM public.profiles WHERE id = auth.uid())
  ))));

CREATE INDEX idx_finapi_tx_tenant_date ON public.finapi_transactions (tenant_id, booking_date DESC);
CREATE INDEX idx_finapi_tx_connection ON public.finapi_transactions (connection_id);
CREATE INDEX idx_finapi_tx_match ON public.finapi_transactions (tenant_id, match_status);

-- ── P2.6: pgvector for RAG ──
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to document_chunks
ALTER TABLE public.document_chunks 
  ADD COLUMN IF NOT EXISTS embedding vector(768);

-- Hybrid search RPC: TSVector + Vector similarity
CREATE OR REPLACE FUNCTION public.hybrid_search_documents(
  p_tenant_id UUID,
  p_query TEXT,
  p_query_embedding vector(768) DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_vector_weight FLOAT DEFAULT 0.5
)
RETURNS TABLE (
  document_id UUID,
  chunk_id UUID,
  chunk_text TEXT,
  page_number INTEGER,
  ts_rank REAL,
  vector_similarity FLOAT,
  combined_score FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH ts_results AS (
    SELECT 
      dc.document_id,
      dc.id AS chunk_id,
      dc.text AS chunk_text,
      dc.page_number,
      ts_rank(to_tsvector('german', dc.text), plainto_tsquery('german', p_query)) AS ts_score
    FROM public.document_chunks dc
    WHERE dc.tenant_id = p_tenant_id
      AND to_tsvector('german', dc.text) @@ plainto_tsquery('german', p_query)
  ),
  vec_results AS (
    SELECT 
      dc.document_id,
      dc.id AS chunk_id,
      dc.text AS chunk_text,
      dc.page_number,
      1 - (dc.embedding <=> p_query_embedding) AS vec_score
    FROM public.document_chunks dc
    WHERE dc.tenant_id = p_tenant_id
      AND dc.embedding IS NOT NULL
      AND p_query_embedding IS NOT NULL
  ),
  combined AS (
    SELECT 
      COALESCE(t.document_id, v.document_id) AS document_id,
      COALESCE(t.chunk_id, v.chunk_id) AS chunk_id,
      COALESCE(t.chunk_text, v.chunk_text) AS chunk_text,
      COALESCE(t.page_number, v.page_number) AS page_number,
      COALESCE(t.ts_score, 0)::REAL AS ts_rank,
      COALESCE(v.vec_score, 0)::FLOAT AS vector_similarity,
      (
        (1 - p_vector_weight) * COALESCE(t.ts_score, 0) +
        p_vector_weight * COALESCE(v.vec_score, 0)
      )::FLOAT AS combined_score
    FROM ts_results t
    FULL OUTER JOIN vec_results v ON t.chunk_id = v.chunk_id
  )
  SELECT * FROM combined
  ORDER BY combined_score DESC
  LIMIT p_limit;
END;
$$;

-- Index for vector similarity search
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding 
  ON public.document_chunks 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Trigger for updated_at
CREATE TRIGGER update_nk_beleg_extractions_updated_at
  BEFORE UPDATE ON public.nk_beleg_extractions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cloud_sync_connectors_updated_at
  BEFORE UPDATE ON public.cloud_sync_connectors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_finapi_connections_updated_at
  BEFORE UPDATE ON public.finapi_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
