
-- ============================================================================
-- FIX-002b: Update RESTRICTIVE policies to allow cross-tenant read for published listings
-- The restrictive policies currently block ALL cross-tenant reads.
-- We need to exempt partner_network and kaufy published data from isolation.
-- ============================================================================

-- 1. listing_publications: Allow cross-tenant read for kaufy + partner_network
DROP POLICY "tenant_isolation_restrictive" ON public.listing_publications;
CREATE POLICY "tenant_isolation_restrictive" ON public.listing_publications
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (
  tenant_id = get_user_tenant_id()
  OR is_platform_admin(auth.uid())
  -- Allow cross-tenant SELECT for published channels
  OR (
    channel IN ('partner_network', 'kaufy')
    AND status = 'active'
    AND current_setting('request.method', true) IS DISTINCT FROM 'DELETE'
  )
);

-- 2. listings: Allow cross-tenant read for listings with active publications
DROP POLICY "tenant_isolation_restrictive" ON public.listings;
CREATE POLICY "tenant_isolation_restrictive" ON public.listings
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (
  tenant_id = get_user_tenant_id()
  OR is_platform_admin(auth.uid())
  -- Allow cross-tenant SELECT for published listings
  OR (
    status IN ('active', 'reserved')
    AND EXISTS (
      SELECT 1 FROM public.listing_publications lp
      WHERE lp.listing_id = listings.id
      AND lp.channel IN ('partner_network', 'kaufy')
      AND lp.status = 'active'
    )
  )
);

-- 3. properties: Allow cross-tenant read for properties linked to published listings  
DROP POLICY "tenant_isolation_restrictive" ON public.properties;
CREATE POLICY "tenant_isolation_restrictive" ON public.properties
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (
  tenant_id = get_user_tenant_id()
  OR is_platform_admin(auth.uid())
  -- Allow cross-tenant SELECT for properties linked to published listings
  OR (
    EXISTS (
      SELECT 1 FROM public.listings l
      JOIN public.listing_publications lp ON lp.listing_id = l.id
      WHERE l.property_id = properties.id
      AND lp.channel IN ('partner_network', 'kaufy')
      AND lp.status = 'active'
      AND l.status IN ('active', 'reserved')
    )
  )
);
