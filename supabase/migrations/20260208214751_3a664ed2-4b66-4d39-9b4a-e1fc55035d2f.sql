-- Dokumenten-Freigabe für Exposés
ALTER TABLE document_links 
ADD COLUMN IF NOT EXISTS expose_visibility TEXT DEFAULT 'internal';

-- Constraint für gültige Werte
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'document_links_expose_visibility_check'
  ) THEN
    ALTER TABLE document_links 
    ADD CONSTRAINT document_links_expose_visibility_check 
    CHECK (expose_visibility IN ('internal', 'partner', 'public'));
  END IF;
END $$;

-- Index für schnelle Abfragen
CREATE INDEX IF NOT EXISTS idx_document_links_expose_visibility 
ON document_links(expose_visibility) 
WHERE expose_visibility != 'internal';

-- Kommentar
COMMENT ON COLUMN document_links.expose_visibility IS 'Sichtbarkeit im Exposé: internal (nur intern), partner (Partner-Netzwerk), public (KAUFY/öffentlich)';