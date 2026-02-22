
-- 1. Compliance Documents: anon darf website_* Dokumente lesen
CREATE POLICY "cd_select_anon_website"
  ON compliance_documents
  FOR SELECT
  TO anon
  USING (doc_key LIKE 'website_%');

-- 2. Compliance Document Versions: anon darf aktive Versionen lesen
CREATE POLICY "cdv_select_anon_active"
  ON compliance_document_versions
  FOR SELECT
  TO anon
  USING (
    status = 'active'
    AND document_id IN (
      SELECT id FROM compliance_documents WHERE doc_key LIKE 'website_%'
    )
  );

-- 3. Company Profile: anon darf alle Profile lesen (oeffentliche Firmendaten)
CREATE POLICY "ccp_select_anon"
  ON compliance_company_profile
  FOR SELECT
  TO anon
  USING (true);
