-- Fix acq_offers: Replace mandate-assignment-based policy with tenant-based policy
-- Current policy blocks INSERT when no mandate_id is provided
DROP POLICY IF EXISTS "AkquiseManagers access own mandate offers" ON acq_offers;
CREATE POLICY "Tenant users manage acq_offers" ON acq_offers
FOR ALL TO authenticated
USING (
  tenant_id = get_user_tenant_id() OR is_platform_admin(auth.uid())
)
WITH CHECK (
  tenant_id = get_user_tenant_id() OR is_platform_admin(auth.uid())
);

-- Fix acq_offer_documents: Replace offer-via-mandate policy with tenant-based policy
DROP POLICY IF EXISTS "Access via offer ownership" ON acq_offer_documents;
CREATE POLICY "Tenant users manage acq_offer_documents" ON acq_offer_documents
FOR ALL TO authenticated
USING (
  tenant_id = get_user_tenant_id() OR is_platform_admin(auth.uid())
)
WITH CHECK (
  tenant_id = get_user_tenant_id() OR is_platform_admin(auth.uid())
);