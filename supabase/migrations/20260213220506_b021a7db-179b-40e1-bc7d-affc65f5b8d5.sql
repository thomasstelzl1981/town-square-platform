
-- Phase 3: Delete legacy seed data (Leipzig property + Familie Mustermann context)

-- 0a. Delete listing_publications for listings on demo unit
DELETE FROM listing_publications WHERE listing_id IN (
  SELECT id FROM listings WHERE unit_id = '00000000-0000-4000-a000-000000000002'
);

-- 0b. Delete listings referencing the demo unit
DELETE FROM listings WHERE unit_id = '00000000-0000-4000-a000-000000000002';

-- 1. Delete leases
DELETE FROM leases WHERE unit_id = '00000000-0000-4000-a000-000000000002';

-- 2. Delete service_cases
DELETE FROM service_cases WHERE property_id = '00000000-0000-4000-a000-000000000001';

-- 3. Delete storage_nodes
DELETE FROM storage_nodes WHERE property_id = '00000000-0000-4000-a000-000000000001';

-- 4. Delete property_accounting
DELETE FROM property_accounting WHERE property_id = '00000000-0000-4000-a000-000000000001';

-- 5. Delete loans
DELETE FROM loans WHERE property_id = '00000000-0000-4000-a000-000000000001';

-- 6. Delete units
DELETE FROM units WHERE property_id = '00000000-0000-4000-a000-000000000001';

-- 7. Delete context_property_assignment
DELETE FROM context_property_assignment 
WHERE property_id = '00000000-0000-4000-a000-000000000001' 
   OR context_id = '00000000-0000-4000-a000-000000000110';

-- 8. Delete property
DELETE FROM properties WHERE id = '00000000-0000-4000-a000-000000000001';

-- 9. Delete landlord context
DELETE FROM landlord_contexts WHERE id = '00000000-0000-4000-a000-000000000110';
