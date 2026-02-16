
-- ============================================================
-- RLS HARDENING: Re-scope member policies from {public} to {authenticated}
-- Affects: documents, properties, listings, document_links
-- Purpose: Defense-in-depth — member checks already require auth.uid(),
--          but targeting {public} is unnecessarily broad.
-- ============================================================

-- ==================== DOCUMENTS ====================

-- SELECT member
DROP POLICY IF EXISTS "docs_select_member" ON public.documents;
CREATE POLICY "docs_select_member" ON public.documents
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.user_id = auth.uid() AND m.tenant_id = documents.tenant_id
  ));

-- SELECT via grant
DROP POLICY IF EXISTS "docs_select_via_grant" ON public.documents;
CREATE POLICY "docs_select_via_grant" ON public.documents
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM access_grants ag
    JOIN memberships m ON m.tenant_id = ag.subject_id
    WHERE ag.scope_type = 'document' AND ag.scope_id = documents.id
      AND ag.subject_type = 'organization' AND ag.status = 'active'
      AND ag.can_view = true
      AND (ag.expires_at IS NULL OR ag.expires_at > now())
      AND m.user_id = auth.uid()
  ));

-- SELECT partner network
DROP POLICY IF EXISTS "partner_read_network_documents" ON public.documents;
CREATE POLICY "partner_read_network_documents" ON public.documents
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM document_links dl
    JOIN listings l ON dl.object_id = l.property_id
    JOIN listing_publications lp ON lp.listing_id = l.id
    WHERE dl.document_id = documents.id
      AND dl.object_type = 'property'
      AND lp.channel = 'partner_network'
      AND lp.status = 'active'
  ));

-- SELECT platform admin
DROP POLICY IF EXISTS "docs_select_platform_admin" ON public.documents;
CREATE POLICY "docs_select_platform_admin" ON public.documents
  FOR SELECT TO authenticated
  USING (is_platform_admin());

-- INSERT member
DROP POLICY IF EXISTS "docs_insert_member" ON public.documents;
CREATE POLICY "docs_insert_member" ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.user_id = auth.uid() AND m.tenant_id = documents.tenant_id
      AND m.role IN ('org_admin', 'internal_ops')
  ));

-- INSERT contract member
DROP POLICY IF EXISTS "docs_insert_contract_member" ON public.documents;
CREATE POLICY "docs_insert_contract_member" ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (doc_type = 'contract' AND uploaded_by = auth.uid() AND EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.user_id = auth.uid() AND m.tenant_id = documents.tenant_id
  ));

-- INSERT platform admin
DROP POLICY IF EXISTS "docs_insert_platform_admin" ON public.documents;
CREATE POLICY "docs_insert_platform_admin" ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (is_platform_admin());

-- UPDATE member
DROP POLICY IF EXISTS "docs_update_member" ON public.documents;
CREATE POLICY "docs_update_member" ON public.documents
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.user_id = auth.uid() AND m.tenant_id = documents.tenant_id
      AND m.role IN ('org_admin', 'internal_ops')
  ));

-- UPDATE platform admin
DROP POLICY IF EXISTS "docs_update_platform_admin" ON public.documents;
CREATE POLICY "docs_update_platform_admin" ON public.documents
  FOR UPDATE TO authenticated
  USING (is_platform_admin());

-- DELETE member
DROP POLICY IF EXISTS "docs_delete_member" ON public.documents;
CREATE POLICY "docs_delete_member" ON public.documents
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.user_id = auth.uid() AND m.tenant_id = documents.tenant_id
      AND m.role = 'org_admin'
  ));

-- DELETE platform admin
DROP POLICY IF EXISTS "docs_delete_platform_admin" ON public.documents;
CREATE POLICY "docs_delete_platform_admin" ON public.documents
  FOR DELETE TO authenticated
  USING (is_platform_admin());

-- ==================== PROPERTIES ====================

DROP POLICY IF EXISTS "prop_select_member" ON public.properties;
CREATE POLICY "prop_select_member" ON public.properties
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.user_id = auth.uid() AND m.tenant_id = properties.tenant_id
  ));

DROP POLICY IF EXISTS "prop_select_platform_admin" ON public.properties;
CREATE POLICY "prop_select_platform_admin" ON public.properties
  FOR SELECT TO authenticated
  USING (is_platform_admin());

DROP POLICY IF EXISTS "prop_insert_member" ON public.properties;
CREATE POLICY "prop_insert_member" ON public.properties
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.user_id = auth.uid() AND m.tenant_id = properties.tenant_id
      AND m.role IN ('org_admin', 'internal_ops')
  ));

DROP POLICY IF EXISTS "prop_insert_platform_admin" ON public.properties;
CREATE POLICY "prop_insert_platform_admin" ON public.properties
  FOR INSERT TO authenticated
  WITH CHECK (is_platform_admin());

DROP POLICY IF EXISTS "prop_update_member" ON public.properties;
CREATE POLICY "prop_update_member" ON public.properties
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.user_id = auth.uid() AND m.tenant_id = properties.tenant_id
      AND m.role IN ('org_admin', 'internal_ops')
  ));

DROP POLICY IF EXISTS "prop_update_platform_admin" ON public.properties;
CREATE POLICY "prop_update_platform_admin" ON public.properties
  FOR UPDATE TO authenticated
  USING (is_platform_admin());

DROP POLICY IF EXISTS "prop_delete_member" ON public.properties;
CREATE POLICY "prop_delete_member" ON public.properties
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.user_id = auth.uid() AND m.tenant_id = properties.tenant_id
      AND m.role = 'org_admin'
  ));

DROP POLICY IF EXISTS "prop_delete_platform_admin" ON public.properties;
CREATE POLICY "prop_delete_platform_admin" ON public.properties
  FOR DELETE TO authenticated
  USING (is_platform_admin());

-- ==================== LISTINGS ====================

DROP POLICY IF EXISTS "listings_select_member" ON public.listings;
CREATE POLICY "listings_select_member" ON public.listings
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.user_id = auth.uid() AND m.tenant_id = listings.tenant_id
  ));

DROP POLICY IF EXISTS "listings_select_platform_admin" ON public.listings;
CREATE POLICY "listings_select_platform_admin" ON public.listings
  FOR SELECT TO authenticated
  USING (is_platform_admin());

DROP POLICY IF EXISTS "listings_insert_member" ON public.listings;
CREATE POLICY "listings_insert_member" ON public.listings
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.user_id = auth.uid() AND m.tenant_id = listings.tenant_id
      AND m.role IN ('org_admin', 'internal_ops')
  ));

DROP POLICY IF EXISTS "listings_insert_platform_admin" ON public.listings;
CREATE POLICY "listings_insert_platform_admin" ON public.listings
  FOR INSERT TO authenticated
  WITH CHECK (is_platform_admin());

DROP POLICY IF EXISTS "listings_update_member" ON public.listings;
CREATE POLICY "listings_update_member" ON public.listings
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.user_id = auth.uid() AND m.tenant_id = listings.tenant_id
      AND m.role IN ('org_admin', 'internal_ops')
  ));

DROP POLICY IF EXISTS "listings_update_platform_admin" ON public.listings;
CREATE POLICY "listings_update_platform_admin" ON public.listings
  FOR UPDATE TO authenticated
  USING (is_platform_admin());

DROP POLICY IF EXISTS "listings_delete_admin" ON public.listings;
CREATE POLICY "listings_delete_admin" ON public.listings
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM memberships m
    WHERE m.user_id = auth.uid() AND m.tenant_id = listings.tenant_id
      AND m.role = 'org_admin'
  ));

DROP POLICY IF EXISTS "listings_delete_platform_admin" ON public.listings;
CREATE POLICY "listings_delete_platform_admin" ON public.listings
  FOR DELETE TO authenticated
  USING (is_platform_admin());

-- ==================== DOCUMENT_LINKS ====================

DROP POLICY IF EXISTS "Tenant isolation" ON public.document_links;
CREATE POLICY "Tenant isolation" ON public.document_links
  FOR ALL TO authenticated
  USING (tenant_id = get_user_tenant_id() OR is_platform_admin(auth.uid()))
  WITH CHECK (tenant_id = get_user_tenant_id() OR is_platform_admin(auth.uid()));

-- Partner network read stays authenticated
DROP POLICY IF EXISTS "partner_read_network_document_links" ON public.document_links;
CREATE POLICY "partner_read_network_document_links" ON public.document_links
  FOR SELECT TO authenticated
  USING (auth.uid() IS NOT NULL AND object_type = 'property' AND EXISTS (
    SELECT 1 FROM listings l
    JOIN listing_publications lp ON lp.listing_id = l.id
    WHERE document_links.object_id = l.property_id
      AND lp.channel = 'partner_network'
      AND lp.status = 'active'
  ));

-- NOTE: public_read_kaufy_image_links_v2 remains for {anon,authenticated} — intentional for KAUFY Zone 3
-- NOTE: public_read_kaufy_images_v2 on documents remains for {anon,authenticated} — intentional for KAUFY Zone 3
-- NOTE: public_read_kaufy_listings on listings remains for {public} — intentional for KAUFY Zone 3
-- NOTE: public_read_kaufy_properties on properties remains for {public} — intentional for KAUFY Zone 3
