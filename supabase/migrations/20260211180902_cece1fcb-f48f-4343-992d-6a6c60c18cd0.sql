
-- ============================================================================
-- STORAGE HARDENING: Steps 1, 2, 3 — Bucket Policy Isolation
-- ============================================================================

-- ==========================================================================
-- STEP 1: Freeze legacy `documents` bucket (SBC-R08)
-- Remove INSERT policy, keep SELECT for backward compatibility
-- ==========================================================================
DROP POLICY IF EXISTS "docs_storage_insert_authenticated" ON storage.objects;
-- SELECT policy "docs_storage_select_authenticated" stays for read access

-- ==========================================================================
-- STEP 2: Harden `project-documents` bucket — add tenant isolation
-- Replace permissive auth-only policies with tenant-scoped ones
-- ==========================================================================

-- Remove old overly-permissive policies
DROP POLICY IF EXISTS "Users can view project documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload project documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their project documents" ON storage.objects;

-- New tenant-scoped policies for project-documents
CREATE POLICY "Tenant members can view project documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'project-documents'
  AND (storage.foldername(name))[1] = (
    SELECT active_tenant_id::text FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Tenant members can upload project documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'project-documents'
  AND (storage.foldername(name))[1] = (
    SELECT active_tenant_id::text FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Tenant members can delete project documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'project-documents'
  AND (storage.foldername(name))[1] = (
    SELECT active_tenant_id::text FROM profiles WHERE id = auth.uid()
  )
);

-- ==========================================================================
-- STEP 3: Harden `social-assets` bucket — tenant-scoped writes (SBC-R07)
-- Read stays public, writes are tenant-scoped
-- ==========================================================================

-- Remove old overly-permissive write policies
DROP POLICY IF EXISTS "Auth users upload social assets" ON storage.objects;
DROP POLICY IF EXISTS "Auth users delete social assets" ON storage.objects;

-- New tenant-scoped write policies
CREATE POLICY "Tenant members can upload social assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'social-assets'
  AND (storage.foldername(name))[1] = (
    SELECT active_tenant_id::text FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Tenant members can delete social assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'social-assets'
  AND (storage.foldername(name))[1] = (
    SELECT active_tenant_id::text FROM profiles WHERE id = auth.uid()
  )
);

-- Public read policy "Public read social assets" stays unchanged
