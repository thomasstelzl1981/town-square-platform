
-- Step 1: Add generic entity columns to storage_nodes
ALTER TABLE public.storage_nodes
  ADD COLUMN IF NOT EXISTS entity_type TEXT,
  ADD COLUMN IF NOT EXISTS entity_id UUID;

CREATE INDEX IF NOT EXISTS idx_storage_nodes_entity
  ON public.storage_nodes (tenant_id, entity_type, entity_id)
  WHERE entity_type IS NOT NULL;

-- Step 2: Add generic entity columns to inbox_sort_containers
ALTER TABLE public.inbox_sort_containers
  ADD COLUMN IF NOT EXISTS entity_type TEXT,
  ADD COLUMN IF NOT EXISTS entity_id UUID;

CREATE INDEX IF NOT EXISTS idx_sort_containers_entity
  ON public.inbox_sort_containers (tenant_id, entity_type, entity_id)
  WHERE entity_type IS NOT NULL;
