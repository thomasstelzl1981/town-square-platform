
-- =====================================================
-- STORAGE CLEANUP: Duplikate entfernen, Struktur fixen
-- Alle UUIDs live verifiziert am 2026-02-09
-- =====================================================

-- STEP 1: Delete grandchildren of orphaned BT dossiers (depth 2)
-- Using recursive CTE for safety
WITH RECURSIVE orphan_tree AS (
  SELECT id FROM storage_nodes WHERE id IN (
    '45e4d0d1-d91a-4cf0-a44f-6005f021cc1c', -- BT-2026-001 orphan 1
    '96c0f37e-5f4b-412f-ad63-7838e5d6e6dc', -- BT-2026-001 orphan 2
    '9efb52bf-0271-4929-92f7-00539ed2b39f', -- BT-2026-002 orphan 1
    'c681b089-d91d-46f3-98d0-5a0dc8faa311'  -- BT-2026-002 orphan 2
  )
  UNION ALL
  SELECT sn.id FROM storage_nodes sn JOIN orphan_tree ot ON sn.parent_id = ot.id
)
DELETE FROM storage_nodes WHERE id IN (SELECT id FROM orphan_tree);

-- STEP 2: Delete 7 empty backfill duplicate roots (16:48, 0 children each)
DELETE FROM storage_nodes WHERE id IN (
  'c8ca13c4-490f-4ae8-9aa3-67eb272c313f', -- MOD_02 dupe
  '5daa71d5-602c-4bc4-abfe-674511d806df', -- MOD_03 dupe
  '49db5aa8-3192-4a93-93b1-4f0bd532e689', -- MOD_04 dupe
  '6b956c32-40a5-4582-a073-4de079ccd8b4', -- MOD_05 dupe
  '6404b6ad-006e-4bbb-bc97-7919b7f559b6', -- MOD_06 dupe
  'aac99988-8881-44c8-a643-a5a5ba346d6a', -- MOD_07 dupe
  '17693dc0-b029-4b48-9eb9-bb76a46ed9c1'  -- MOD_08 dupe
);

-- STEP 3: Delete MOD_17 backfill dupe (0 children)
DELETE FROM storage_nodes WHERE id = '683413ac-411e-4b8e-92f0-6ddeab323bbb';

-- STEP 4: Delete SYSTEM Papierkorb dupe
DELETE FROM storage_nodes WHERE id = '0cba7668-dc00-4ab2-b36c-aff0b88b4486';

-- STEP 5: Delete MOD_16 "Services" dupe (keep "Sanierung" and rename)
DELETE FROM storage_nodes WHERE id = 'a2c923a2-2c48-4f82-bc18-afe5d19671d6';

-- STEP 6: Delete MOD_13 Projekte dupe (keep original 4e5900e9)
DELETE FROM storage_nodes WHERE id = '064c2c35-e429-4142-8212-a0279f4d5105';

-- STEP 7: Reparent valid BT-2026-001 dossier under Projekte root
UPDATE storage_nodes 
SET parent_id = '4e5900e9-95d7-4373-81c4-f312b2e8964e'
WHERE id = 'a33c4587-8b18-4cb2-be8c-495c19000026';

-- STEP 8: Rename MOD_16 "Sanierung" → "Services"
UPDATE storage_nodes 
SET name = 'Services'
WHERE id = '284d458b-133a-4fa2-add3-966d24b6bfa7';

-- STEP 9: Create UNIQUE partial index for root nodes
CREATE UNIQUE INDEX IF NOT EXISTS idx_storage_nodes_unique_root
  ON storage_nodes (tenant_id, module_code, template_id)
  WHERE parent_id IS NULL AND template_id IS NOT NULL;

-- STEP 10: Create UNIQUE partial index for child nodes
CREATE UNIQUE INDEX IF NOT EXISTS idx_storage_nodes_unique_child
  ON storage_nodes (tenant_id, parent_id, name)
  WHERE parent_id IS NOT NULL;
