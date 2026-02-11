-- Schritt 2: tenant_mode ENUM + Spalte + get_active_tenant_mode() RPC
-- Golden Tenant & Data Hygiene Hardening

-- 1. Create ENUM type
DO $$ BEGIN
  CREATE TYPE public.tenant_mode AS ENUM ('reference', 'sandbox', 'demo', 'production');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add column to organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS tenant_mode public.tenant_mode DEFAULT 'production';

-- 3. Set Dev-Tenant to sandbox
UPDATE public.organizations
  SET tenant_mode = 'sandbox'
  WHERE id = 'a0000000-0000-4000-a000-000000000001';

-- 4. S1: Runtime resolution function
CREATE OR REPLACE FUNCTION public.get_active_tenant_mode()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  SELECT COALESCE(o.tenant_mode::text, 'production')
  FROM profiles p
  JOIN organizations o ON o.id = p.active_tenant_id
  WHERE p.id = auth.uid()
$$;

GRANT EXECUTE ON FUNCTION public.get_active_tenant_mode() TO authenticated;

-- 5. Schritt 6: Orphan Checker
CREATE OR REPLACE FUNCTION public.check_data_orphans(p_tenant_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'extractions_without_document', (
      SELECT count(*) FROM extractions e 
      LEFT JOIN documents d ON e.document_id = d.id 
      WHERE e.tenant_id = p_tenant_id AND d.id IS NULL
    ),
    'chunks_without_document', (
      SELECT count(*) FROM document_chunks dc 
      LEFT JOIN documents d ON dc.document_id = d.id 
      WHERE dc.tenant_id = p_tenant_id AND d.id IS NULL
    ),
    'links_without_document', (
      SELECT count(*) FROM document_links dl 
      LEFT JOIN documents d ON dl.document_id = d.id 
      WHERE dl.tenant_id = p_tenant_id AND d.id IS NULL
    )
  ) INTO result;
  RETURN result;
END $$;

GRANT EXECUTE ON FUNCTION public.check_data_orphans(UUID) TO authenticated;

-- 6. Schritt 7: Reset Sandbox Tenant (dynamic, schema-robust)
CREATE OR REPLACE FUNCTION public.reset_sandbox_tenant(p_tenant_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_mode text;
  v_table text;
  v_deleted int;
  v_total_deleted int := 0;
  v_result jsonb := '{}'::jsonb;
  v_keep_list text[] := ARRAY[
    'memberships', 'organizations', 'profiles', 'user_roles',
    'subscriptions', 'tenant_tile_activation',
    'tenant_extraction_settings', 'storage_nodes',
    'whatsapp_accounts', 'whatsapp_user_settings',
    'mail_accounts', 'inbound_mailboxes',
    'widget_preferences', 'task_widgets',
    'miety_contracts', 'integration_registry',
    'msv_templates', 'msv_communication_prefs',
    'tile_catalog', 'dp_catalog', 'doc_type_catalog',
    'consent_templates', 'agreement_templates',
    'armstrong_policies', 'armstrong_knowledge_items',
    'armstrong_action_overrides'
  ];
BEGIN
  -- Gate: tenant_mode = 'sandbox'
  SELECT tenant_mode::text INTO v_mode FROM organizations WHERE id = p_tenant_id;
  IF v_mode IS DISTINCT FROM 'sandbox' THEN
    RAISE EXCEPTION 'Reset nur fuer sandbox-Tenants erlaubt. Aktuell: %', COALESCE(v_mode, 'NULL');
  END IF;

  -- Gate: caller must be platform_admin
  IF NOT is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Reset erfordert platform_admin Berechtigung.';
  END IF;

  -- Dynamically find all tables with tenant_id, minus keep_list
  FOR v_table IN
    SELECT DISTINCT c.table_name
    FROM information_schema.columns c
    WHERE c.table_schema = 'public' 
      AND c.column_name = 'tenant_id'
      AND c.table_name != ALL(v_keep_list)
    ORDER BY c.table_name
  LOOP
    BEGIN
      EXECUTE format('DELETE FROM %I WHERE tenant_id = $1', v_table) USING p_tenant_id;
      GET DIAGNOSTICS v_deleted = ROW_COUNT;
      IF v_deleted > 0 THEN
        v_result := v_result || jsonb_build_object(v_table, v_deleted);
        v_total_deleted := v_total_deleted + v_deleted;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- Log but continue (FK violations from ordering)
      v_result := v_result || jsonb_build_object(v_table || '_error', SQLERRM);
    END;
  END LOOP;

  -- Storage-Nodes: keep root folders (parent_id IS NULL), delete children
  DELETE FROM storage_nodes WHERE tenant_id = p_tenant_id AND parent_id IS NOT NULL;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  v_result := v_result || jsonb_build_object('storage_nodes_children', v_deleted);

  v_result := jsonb_build_object(
    'success', true,
    'tenant_id', p_tenant_id,
    'total_deleted', v_total_deleted,
    'details', v_result
  );

  RETURN v_result;
END $$;

GRANT EXECUTE ON FUNCTION public.reset_sandbox_tenant(UUID) TO authenticated;