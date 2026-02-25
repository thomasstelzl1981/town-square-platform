
-- ============================================================================
-- FIX-002: Cross-Tenant READ access for partner_network listings
-- Partner-Tenants können Listings lesen, die über partner_network publiziert sind
-- ============================================================================

-- 1. Allow any authenticated user to read listing_publications with channel=partner_network
CREATE POLICY "public_read_partner_network_publications"
ON public.listing_publications
FOR SELECT
TO authenticated
USING (
  channel = 'partner_network' 
  AND status = 'active'
);

-- 2. Allow any authenticated user to read listings that have active partner_network publication
CREATE POLICY "public_read_partner_network_listings"
ON public.listings
FOR SELECT
TO authenticated
USING (
  status IN ('active', 'reserved')
  AND EXISTS (
    SELECT 1 FROM public.listing_publications lp
    WHERE lp.listing_id = id
    AND lp.channel = 'partner_network'
    AND lp.status = 'active'
  )
);

-- 3. Allow any authenticated user to read properties linked to partner_network listings
CREATE POLICY "public_read_partner_network_properties"
ON public.properties
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.listings l
    JOIN public.listing_publications lp ON lp.listing_id = l.id
    WHERE l.property_id = properties.id
    AND lp.channel = 'partner_network'
    AND lp.status = 'active'
    AND l.status IN ('active', 'reserved')
  )
);
