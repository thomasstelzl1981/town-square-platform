
-- BUG 1: Add missing columns for DMS file linking
ALTER TABLE storage_nodes
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT;

-- BUG 3: Fix module_code from underscore to hyphen
UPDATE storage_nodes SET module_code = 'MOD-13' WHERE module_code = 'MOD_13';
