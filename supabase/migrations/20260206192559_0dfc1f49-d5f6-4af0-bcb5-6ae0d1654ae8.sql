-- ============================================================================
-- Phase 1: MOD-04 Sanierung — Service Cases Schema Erweiterung
-- ============================================================================

-- 1. Neue Spalten für service_cases hinzufügen
ALTER TABLE service_cases ADD COLUMN IF NOT EXISTS unit_id uuid REFERENCES units(id) ON DELETE SET NULL;
ALTER TABLE service_cases ADD COLUMN IF NOT EXISTS tender_id text UNIQUE;

-- Scope Definition (Schritt 2)
ALTER TABLE service_cases ADD COLUMN IF NOT EXISTS scope_status text DEFAULT 'pending' 
  CHECK (scope_status IN ('pending', 'ai_analyzing', 'draft', 'finalized'));
ALTER TABLE service_cases ADD COLUMN IF NOT EXISTS scope_source text DEFAULT 'none' 
  CHECK (scope_source IN ('none', 'ai_generated', 'external_lv', 'manual'));
ALTER TABLE service_cases ADD COLUMN IF NOT EXISTS scope_description text;
ALTER TABLE service_cases ADD COLUMN IF NOT EXISTS scope_line_items jsonb DEFAULT '[]';
ALTER TABLE service_cases ADD COLUMN IF NOT EXISTS scope_attachments jsonb DEFAULT '[]';
ALTER TABLE service_cases ADD COLUMN IF NOT EXISTS external_lv_document_id uuid REFERENCES documents(id) ON DELETE SET NULL;

-- KI-Analyse Daten
ALTER TABLE service_cases ADD COLUMN IF NOT EXISTS ai_analysis_data jsonb;
ALTER TABLE service_cases ADD COLUMN IF NOT EXISTS room_analysis jsonb;

-- Kostenschätzung (in Cent für präzise Berechnung)
ALTER TABLE service_cases ADD COLUMN IF NOT EXISTS cost_estimate_min integer;
ALTER TABLE service_cases ADD COLUMN IF NOT EXISTS cost_estimate_max integer;
ALTER TABLE service_cases ADD COLUMN IF NOT EXISTS cost_estimate_mid integer;
ALTER TABLE service_cases ADD COLUMN IF NOT EXISTS cost_estimate_generated_at timestamptz;

-- Fristen
ALTER TABLE service_cases ADD COLUMN IF NOT EXISTS deadline_offers date;
ALTER TABLE service_cases ADD COLUMN IF NOT EXISTS deadline_execution_start date;
ALTER TABLE service_cases ADD COLUMN IF NOT EXISTS deadline_execution_end date;

-- Kundenkontaktdaten für Ausschreibungs-E-Mails
ALTER TABLE service_cases ADD COLUMN IF NOT EXISTS contact_name text;
ALTER TABLE service_cases ADD COLUMN IF NOT EXISTS contact_phone text;
ALTER TABLE service_cases ADD COLUMN IF NOT EXISTS contact_email text;
ALTER TABLE service_cases ADD COLUMN IF NOT EXISTS contact_whatsapp text;

-- Vergabe-Tracking
ALTER TABLE service_cases ADD COLUMN IF NOT EXISTS award_sent_at timestamptz;
ALTER TABLE service_cases ADD COLUMN IF NOT EXISTS award_confirmed_at timestamptz;

-- DMS Folder Referenz
ALTER TABLE service_cases ADD COLUMN IF NOT EXISTS dms_folder_id uuid REFERENCES storage_nodes(id) ON DELETE SET NULL;

-- 2. Sequenz für Tender-ID
CREATE SEQUENCE IF NOT EXISTS service_case_tender_seq START WITH 1;

-- 3. Funktion zur Generierung der Tender-ID
-- Format: TND-{ORG_PUBLIC_ID}-{YYMMDD}-{SEQ}
CREATE OR REPLACE FUNCTION generate_service_case_tender_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
DECLARE
  org_public_id text;
  date_part text;
  seq_num integer;
BEGIN
  -- Organisation public_id holen
  SELECT public_id INTO org_public_id 
  FROM organizations 
  WHERE id = NEW.tenant_id;
  
  -- Fallback wenn keine public_id
  IF org_public_id IS NULL THEN
    org_public_id := substring(NEW.tenant_id::text, 1, 8);
  ELSE
    -- Nur die ID-Teil nach dem Prefix extrahieren (z.B. SOT-T-XXXXXXXX -> XXXXXXXX)
    org_public_id := substring(org_public_id FROM 7 FOR 8);
  END IF;
  
  -- Datums-Teil (YYMMDD)
  date_part := to_char(CURRENT_DATE, 'YYMMDD');
  
  -- Sequenznummer
  seq_num := nextval('service_case_tender_seq');
  
  -- Tender-ID generieren
  NEW.tender_id := 'TND-' || org_public_id || '-' || date_part || '-' || lpad(seq_num::text, 4, '0');
  
  RETURN NEW;
END;
$$;

-- 4. Trigger für automatische Tender-ID
DROP TRIGGER IF EXISTS trg_generate_tender_id ON service_cases;
CREATE TRIGGER trg_generate_tender_id
  BEFORE INSERT ON service_cases
  FOR EACH ROW
  WHEN (NEW.tender_id IS NULL)
  EXECUTE FUNCTION generate_service_case_tender_id();

-- 5. Index für schnelle Tender-ID Lookups
CREATE INDEX IF NOT EXISTS idx_service_cases_tender_id ON service_cases(tender_id);
CREATE INDEX IF NOT EXISTS idx_service_cases_tenant_status ON service_cases(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_service_cases_scope_status ON service_cases(tenant_id, scope_status);

-- 6. Erweitere service_case_outbound für detailliertere E-Mail-Daten
ALTER TABLE service_case_outbound ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft' 
  CHECK (status IN ('draft', 'pending_confirmation', 'sending', 'sent', 'failed'));
ALTER TABLE service_case_outbound ADD COLUMN IF NOT EXISTS subject text;
ALTER TABLE service_case_outbound ADD COLUMN IF NOT EXISTS body_html text;
ALTER TABLE service_case_outbound ADD COLUMN IF NOT EXISTS resend_message_id text;
ALTER TABLE service_case_outbound ADD COLUMN IF NOT EXISTS routing_token text UNIQUE;
ALTER TABLE service_case_outbound ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;
ALTER TABLE service_case_outbound ADD COLUMN IF NOT EXISTS confirmed_by uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE service_case_outbound ADD COLUMN IF NOT EXISTS recipient_name text;
ALTER TABLE service_case_outbound ADD COLUMN IF NOT EXISTS recipient_phone text;
ALTER TABLE service_case_outbound ADD COLUMN IF NOT EXISTS is_award_mail boolean DEFAULT false;
ALTER TABLE service_case_outbound ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]';
ALTER TABLE service_case_outbound ADD COLUMN IF NOT EXISTS dms_share_link text;

-- Trigger für routing_token
CREATE OR REPLACE FUNCTION generate_outbound_routing_token()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.routing_token IS NULL THEN
    NEW.routing_token := 'tnd-' || substr(gen_random_uuid()::text, 1, 12);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_generate_routing_token ON service_case_outbound;
CREATE TRIGGER trg_generate_routing_token
  BEFORE INSERT ON service_case_outbound
  FOR EACH ROW
  WHEN (NEW.routing_token IS NULL)
  EXECUTE FUNCTION generate_outbound_routing_token();

-- 7. Erweitere service_case_offers für bessere Anbieter-Daten
ALTER TABLE service_case_offers ADD COLUMN IF NOT EXISTS status text DEFAULT 'received' 
  CHECK (status IN ('received', 'under_review', 'accepted', 'rejected'));
ALTER TABLE service_case_offers ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual' 
  CHECK (source IN ('manual', 'email_inbound', 'upload'));
ALTER TABLE service_case_offers ADD COLUMN IF NOT EXISTS inbound_email_id uuid;
ALTER TABLE service_case_offers ADD COLUMN IF NOT EXISTS provider_name text;
ALTER TABLE service_case_offers ADD COLUMN IF NOT EXISTS provider_email text;
ALTER TABLE service_case_offers ADD COLUMN IF NOT EXISTS provider_phone text;
ALTER TABLE service_case_offers ADD COLUMN IF NOT EXISTS provider_mobile text;
ALTER TABLE service_case_offers ADD COLUMN IF NOT EXISTS provider_contact_person text;
ALTER TABLE service_case_offers ADD COLUMN IF NOT EXISTS offer_amount_net integer;
ALTER TABLE service_case_offers ADD COLUMN IF NOT EXISTS offer_amount_gross integer;
ALTER TABLE service_case_offers ADD COLUMN IF NOT EXISTS execution_start date;
ALTER TABLE service_case_offers ADD COLUMN IF NOT EXISTS execution_end date;
ALTER TABLE service_case_offers ADD COLUMN IF NOT EXISTS execution_duration_days integer;
ALTER TABLE service_case_offers ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE service_case_offers ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE service_case_offers ADD COLUMN IF NOT EXISTS rejection_reason text;

-- 8. Status-Check Constraint für service_cases erweitern
-- Erst alten Constraint entfernen (falls vorhanden), dann neu anlegen
ALTER TABLE service_cases DROP CONSTRAINT IF EXISTS service_cases_status_check;
ALTER TABLE service_cases ADD CONSTRAINT service_cases_status_check 
  CHECK (status IN (
    'draft', 
    'scope_pending', 
    'scope_draft', 
    'scope_finalized',
    'ready_to_send',
    'sent', 
    'offers_received',
    'under_review',
    'awarded', 
    'in_progress',
    'completed', 
    'cancelled'
  ));