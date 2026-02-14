-- BL-000001 (P0): Set annual_income on demo properties
UPDATE properties SET annual_income = 13800 WHERE id = 'd0000000-0000-4000-a000-000000000001';
UPDATE properties SET annual_income = 18960 WHERE id = 'd0000000-0000-4000-a000-000000000002';
UPDATE properties SET annual_income = 9000 WHERE id = 'd0000000-0000-4000-a000-000000000003';

-- BL-000002 (P1): Recreate v_public_listings with annual_income and unit_count
DROP VIEW IF EXISTS v_public_listings;

CREATE VIEW v_public_listings
WITH (security_invoker = off) AS
SELECT
  l.public_id,
  l.title,
  l.description,
  l.asking_price,
  p.city,
  p.postal_code,
  p.property_type,
  p.total_area_sqm,
  p.year_built,
  p.annual_income,
  lp.published_at,
  lp.channel
FROM listings l
JOIN properties p ON l.property_id = p.id AND l.tenant_id = p.tenant_id
JOIN listing_publications lp ON l.id = lp.listing_id AND l.tenant_id = lp.tenant_id
WHERE l.status = 'active'
  AND lp.status = 'active'
  AND lp.channel = 'kaufy';