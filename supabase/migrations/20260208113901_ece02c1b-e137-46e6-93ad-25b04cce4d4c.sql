-- 1. Öffentlicher Lesezugriff auf aktive Kaufy-Publikationen
CREATE POLICY "public_read_kaufy_publications"
  ON public.listing_publications FOR SELECT
  USING (channel = 'kaufy' AND status = 'active');

-- 2. Öffentlicher Lesezugriff auf Listings mit Kaufy-Publikation
CREATE POLICY "public_read_kaufy_listings"
  ON public.listings FOR SELECT
  USING (
    status IN ('active', 'reserved') AND
    EXISTS (
      SELECT 1 FROM listing_publications lp
      WHERE lp.listing_id = listings.id
        AND lp.channel = 'kaufy'
        AND lp.status = 'active'
    )
  );

-- 3. Öffentlicher Lesezugriff auf verknüpfte Properties
CREATE POLICY "public_read_kaufy_properties"
  ON public.properties FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM listings l
      JOIN listing_publications lp ON lp.listing_id = l.id
      WHERE l.property_id = properties.id
        AND lp.channel = 'kaufy'
        AND lp.status = 'active'
    )
  );