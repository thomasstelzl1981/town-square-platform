-- =============================================================================
-- PHASE 3: Kaufy Kaufpreis-Fixierung bei Verkaufsauftrag
-- =============================================================================
ALTER TABLE listings ADD COLUMN IF NOT EXISTS sale_price_fixed NUMERIC(12,2);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS sale_price_fixed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS sale_price_fixed_by UUID REFERENCES auth.users(id);

COMMENT ON COLUMN listings.sale_price_fixed IS 'Fixierter Verkaufspreis zum Zeitpunkt der Auftragserteilung';
COMMENT ON COLUMN listings.sale_price_fixed_at IS 'Zeitpunkt der Preisfixierung';
COMMENT ON COLUMN listings.sale_price_fixed_by IS 'User der den Preis fixiert hat';

-- =============================================================================
-- PHASE 4: DMS Papierkorb-System (Soft-Delete)
-- =============================================================================
ALTER TABLE documents ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);
ALTER TABLE documents ADD COLUMN IF NOT EXISTS original_node_id UUID;

COMMENT ON COLUMN documents.deleted_at IS 'Zeitstempel für Soft-Delete (Papierkorb)';
COMMENT ON COLUMN documents.deleted_by IS 'User der das Dokument gelöscht hat';
COMMENT ON COLUMN documents.original_node_id IS 'Ursprünglicher Ordner vor dem Löschen';

-- Create index for efficient trash queries
CREATE INDEX IF NOT EXISTS idx_documents_deleted_at ON documents(deleted_at) WHERE deleted_at IS NOT NULL;

-- =============================================================================
-- PHASE 7: RLS & Function Search Path Fixes
-- =============================================================================

-- Fix get_user_tenant_id function with proper search_path
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT active_tenant_id FROM profiles WHERE id = auth.uid()
$$;

-- Fix is_platform_admin function if it exists
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'platform_admin'
  )
$$;

-- =============================================================================
-- PHASE 5: Ensure all module root folders exist (system-level)
-- This ensures the DMS has proper module-based hierarchy
-- =============================================================================

-- Create a function to ensure module roots exist for a tenant
CREATE OR REPLACE FUNCTION public.ensure_module_root_folders(p_tenant_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_module_roots text[][] := ARRAY[
    ARRAY['MOD_02_ROOT', 'KI Office', 'MOD_02'],
    ARRAY['MOD_03_ROOT', 'DMS', 'MOD_03'],
    ARRAY['MOD_04_ROOT', 'Immobilien', 'MOD_04'],
    ARRAY['MOD_05_ROOT', 'MSV', 'MOD_05'],
    ARRAY['MOD_06_ROOT', 'Verkauf', 'MOD_06'],
    ARRAY['MOD_07_ROOT', 'Finanzierung', 'MOD_07'],
    ARRAY['MOD_08_ROOT', 'Investments', 'MOD_08'],
    ARRAY['MOD_13_ROOT', 'Projekte', 'MOD_13'],
    ARRAY['MOD_16_ROOT', 'Sanierung', 'MOD_16'],
    ARRAY['MOD_17_ROOT', 'Car-Management', 'MOD_17'],
    ARRAY['TRASH_ROOT', 'Papierkorb', 'SYSTEM']
  ];
  v_root text[];
BEGIN
  FOREACH v_root SLICE 1 IN ARRAY v_module_roots
  LOOP
    INSERT INTO storage_nodes (tenant_id, parent_id, name, node_type, template_id, module_code)
    VALUES (p_tenant_id, NULL, v_root[2], 'folder', v_root[1], v_root[3])
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;