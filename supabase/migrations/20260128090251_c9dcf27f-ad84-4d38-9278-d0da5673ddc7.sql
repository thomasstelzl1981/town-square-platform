-- B3: Backfill - Create system folders for existing tenants
-- Use node_type = 'folder' (the only allowed value) but with special names

INSERT INTO storage_nodes (tenant_id, name, node_type, sort_index, auto_created)
SELECT o.id, 'Posteingang', 'folder', 0, true
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM storage_nodes sn 
  WHERE sn.tenant_id = o.id AND sn.name = 'Posteingang'
);

INSERT INTO storage_nodes (tenant_id, name, node_type, sort_index, auto_created)
SELECT o.id, 'Bonitätsunterlagen', 'folder', 1, true
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM storage_nodes sn 
  WHERE sn.tenant_id = o.id AND sn.name = 'Bonitätsunterlagen'
);