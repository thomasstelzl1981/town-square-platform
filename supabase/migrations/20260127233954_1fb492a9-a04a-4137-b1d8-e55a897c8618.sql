-- ========================================
-- UPLOAD-PIPELINE: Erweiterte Dokumenten-Struktur + Billing
-- ========================================

-- 1. DOCUMENTS TABELLE ERWEITERN
-- ========================================
ALTER TABLE documents ADD COLUMN IF NOT EXISTS 
  extracted_json_path TEXT;

ALTER TABLE documents ADD COLUMN IF NOT EXISTS 
  extraction_status TEXT DEFAULT 'pending';

ALTER TABLE documents ADD COLUMN IF NOT EXISTS 
  source TEXT DEFAULT 'upload';

ALTER TABLE documents ADD COLUMN IF NOT EXISTS 
  ai_summary TEXT;

ALTER TABLE documents ADD COLUMN IF NOT EXISTS 
  detected_type TEXT;

-- Constraint für extraction_status (als CHECK)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'documents_extraction_status_check'
  ) THEN
    ALTER TABLE documents ADD CONSTRAINT documents_extraction_status_check 
      CHECK (extraction_status IN ('pending', 'processing', 'done', 'failed', 'skipped'));
  END IF;
END $$;

-- Constraint für source
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'documents_source_check'
  ) THEN
    ALTER TABLE documents ADD CONSTRAINT documents_source_check 
      CHECK (source IN ('upload', 'resend', 'caya', 'dropbox', 'onedrive', 'gdrive', 'import'));
  END IF;
END $$;

-- Index für Suche nach Status
CREATE INDEX IF NOT EXISTS idx_documents_extraction_status 
  ON documents(extraction_status);

CREATE INDEX IF NOT EXISTS idx_documents_source 
  ON documents(source);


-- 2. BILLING_USAGE TABELLE (Seiten-Counter pro Tenant/Monat)
-- ========================================
CREATE TABLE IF NOT EXISTS billing_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Abrechnungsperiode
  period_start date NOT NULL,
  period_end date NOT NULL,
  
  -- Storage-Nutzung
  storage_bytes_used bigint DEFAULT 0,
  document_count int DEFAULT 0,
  
  -- Extraction-Nutzung (SEITEN-BASIERT für Unstructured.io)
  extraction_pages_fast int DEFAULT 0,
  extraction_pages_hires int DEFAULT 0,
  extraction_cost_cents int DEFAULT 0,
  
  -- Lovable AI Nutzung (für manuelle Uploads)
  lovable_ai_calls int DEFAULT 0,
  lovable_ai_tokens int DEFAULT 0,
  
  -- Source-Breakdown (für Reporting)
  pages_from_resend int DEFAULT 0,
  pages_from_caya int DEFAULT 0,
  pages_from_dropbox int DEFAULT 0,
  pages_from_onedrive int DEFAULT 0,
  pages_from_gdrive int DEFAULT 0,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE(tenant_id, period_start)
);

-- RLS für billing_usage
ALTER TABLE billing_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view own usage"
ON billing_usage FOR SELECT
USING (tenant_id IN (
  SELECT m.tenant_id FROM memberships m WHERE m.user_id = auth.uid()
));

-- Trigger für automatisches Timestamp-Update
CREATE OR REPLACE FUNCTION update_billing_usage_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS billing_usage_updated ON billing_usage;
CREATE TRIGGER billing_usage_updated
BEFORE UPDATE ON billing_usage
FOR EACH ROW
EXECUTE FUNCTION update_billing_usage_timestamp();


-- 3. EXTRACTIONS TABELLE (Einzelne Parsing-Jobs)
-- ========================================
CREATE TABLE IF NOT EXISTS extractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  
  -- Engine-Auswahl
  engine text NOT NULL,
  
  -- Quelle (für Billing-Breakdown)
  source text NOT NULL,
  
  -- Status
  status text NOT NULL DEFAULT 'queued',
  
  -- Consent (nur für kostenpflichtige Extractions)
  consent_given_at timestamptz,
  consent_given_by uuid,
  
  -- Kosten-Tracking
  estimated_pages int,
  estimated_cost_cents int,
  actual_pages int,
  actual_cost_cents int,
  
  -- Ergebnis
  result_json jsonb,
  error_message text,
  
  -- Timestamps
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  CONSTRAINT extractions_engine_check CHECK (engine IN ('unstructured_fast', 'unstructured_hires', 'lovable_ai')),
  CONSTRAINT extractions_source_check CHECK (source IN ('upload', 'resend', 'caya', 'dropbox', 'onedrive', 'gdrive', 'import')),
  CONSTRAINT extractions_status_check CHECK (status IN ('queued', 'running', 'done', 'failed', 'cancelled'))
);

-- RLS für extractions
ALTER TABLE extractions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view own extractions"
ON extractions FOR SELECT
USING (tenant_id IN (
  SELECT m.tenant_id FROM memberships m WHERE m.user_id = auth.uid()
));

CREATE POLICY "Tenant members can insert extractions"
ON extractions FOR INSERT
WITH CHECK (tenant_id IN (
  SELECT m.tenant_id FROM memberships m WHERE m.user_id = auth.uid()
));

-- Index für Billing-Queries
CREATE INDEX IF NOT EXISTS idx_extractions_billing 
ON extractions(tenant_id, source, created_at) 
WHERE status = 'done';


-- 4. TENANT_EXTRACTION_SETTINGS (Auto-Extraction Einstellungen)
-- ========================================
CREATE TABLE IF NOT EXISTS tenant_extraction_settings (
  tenant_id uuid PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Automatische Extraction aktiviert?
  auto_extract_resend boolean DEFAULT false,
  auto_extract_caya boolean DEFAULT true,
  auto_extract_connectors boolean DEFAULT false,
  
  -- Bevorzugte Engine
  default_engine text DEFAULT 'unstructured_fast',
  
  -- Monatliches Limit (Cents) - Default 50€
  monthly_limit_cents int DEFAULT 5000,
  
  -- Notifications
  notify_at_percent int DEFAULT 80,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT tes_engine_check CHECK (default_engine IN ('unstructured_fast', 'unstructured_hires'))
);

-- RLS für tenant_extraction_settings
ALTER TABLE tenant_extraction_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant members can view own settings"
ON tenant_extraction_settings FOR SELECT
USING (tenant_id IN (
  SELECT m.tenant_id FROM memberships m WHERE m.user_id = auth.uid()
));

CREATE POLICY "Org admins can update settings"
ON tenant_extraction_settings FOR UPDATE
USING (tenant_id IN (
  SELECT m.tenant_id FROM memberships m 
  WHERE m.user_id = auth.uid() AND m.role IN ('org_admin', 'platform_admin')
));

CREATE POLICY "Org admins can insert settings"
ON tenant_extraction_settings FOR INSERT
WITH CHECK (tenant_id IN (
  SELECT m.tenant_id FROM memberships m 
  WHERE m.user_id = auth.uid() AND m.role IN ('org_admin', 'platform_admin')
));


-- 5. RPC FUNCTION: Billing-Usage inkrementieren
-- ========================================
CREATE OR REPLACE FUNCTION increment_billing_usage(
  p_tenant_id uuid,
  p_period_start date,
  p_period_end date,
  p_pages int,
  p_engine text,
  p_source text,
  p_cost_cents int
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO billing_usage (
    tenant_id, period_start, period_end,
    extraction_pages_fast, extraction_pages_hires, extraction_cost_cents,
    pages_from_resend, pages_from_caya, pages_from_dropbox, pages_from_onedrive, pages_from_gdrive
  )
  VALUES (
    p_tenant_id, p_period_start, p_period_end,
    CASE WHEN p_engine = 'unstructured_fast' THEN p_pages ELSE 0 END,
    CASE WHEN p_engine = 'unstructured_hires' THEN p_pages ELSE 0 END,
    p_cost_cents,
    CASE WHEN p_source = 'resend' THEN p_pages ELSE 0 END,
    CASE WHEN p_source = 'caya' THEN p_pages ELSE 0 END,
    CASE WHEN p_source = 'dropbox' THEN p_pages ELSE 0 END,
    CASE WHEN p_source = 'onedrive' THEN p_pages ELSE 0 END,
    CASE WHEN p_source = 'gdrive' THEN p_pages ELSE 0 END
  )
  ON CONFLICT (tenant_id, period_start) DO UPDATE SET
    extraction_pages_fast = billing_usage.extraction_pages_fast + 
      CASE WHEN p_engine = 'unstructured_fast' THEN p_pages ELSE 0 END,
    extraction_pages_hires = billing_usage.extraction_pages_hires + 
      CASE WHEN p_engine = 'unstructured_hires' THEN p_pages ELSE 0 END,
    extraction_cost_cents = billing_usage.extraction_cost_cents + p_cost_cents,
    pages_from_resend = billing_usage.pages_from_resend + 
      CASE WHEN p_source = 'resend' THEN p_pages ELSE 0 END,
    pages_from_caya = billing_usage.pages_from_caya + 
      CASE WHEN p_source = 'caya' THEN p_pages ELSE 0 END,
    pages_from_dropbox = billing_usage.pages_from_dropbox + 
      CASE WHEN p_source = 'dropbox' THEN p_pages ELSE 0 END,
    pages_from_onedrive = billing_usage.pages_from_onedrive + 
      CASE WHEN p_source = 'onedrive' THEN p_pages ELSE 0 END,
    pages_from_gdrive = billing_usage.pages_from_gdrive + 
      CASE WHEN p_source = 'gdrive' THEN p_pages ELSE 0 END,
    updated_at = now();
END;
$$;


-- 6. RPC FUNCTION: Lovable AI Usage inkrementieren
-- ========================================
CREATE OR REPLACE FUNCTION increment_lovable_ai_usage(
  p_tenant_id uuid,
  p_period_start date,
  p_period_end date,
  p_calls int DEFAULT 1,
  p_tokens int DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO billing_usage (
    tenant_id, period_start, period_end,
    lovable_ai_calls, lovable_ai_tokens
  )
  VALUES (
    p_tenant_id, p_period_start, p_period_end,
    p_calls, p_tokens
  )
  ON CONFLICT (tenant_id, period_start) DO UPDATE SET
    lovable_ai_calls = billing_usage.lovable_ai_calls + p_calls,
    lovable_ai_tokens = billing_usage.lovable_ai_tokens + p_tokens,
    updated_at = now();
END;
$$;