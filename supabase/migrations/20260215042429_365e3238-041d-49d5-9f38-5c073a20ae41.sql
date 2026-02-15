
-- Add unique constraint for upsert support
CREATE UNIQUE INDEX legal_documents_tenant_type_user_idx 
  ON public.legal_documents (tenant_id, document_type, user_id);
