ALTER TABLE user_consents
  ADD COLUMN IF NOT EXISTS compliance_doc_id UUID REFERENCES compliance_documents(id),
  ADD COLUMN IF NOT EXISTS compliance_version INT;