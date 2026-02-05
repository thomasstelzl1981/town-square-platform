-- ================================================================================
-- D2 + D4a + D4b: Cleanup Function, Finance Trigger, Backfill (FIXED)
-- Golden Path v4 Repair - Priority 0
-- ================================================================================

-- ============================================================
-- D2: SAFE CLEANUP FUNCTION (FK-safe, scoped to demo tenant)
-- ============================================================

CREATE OR REPLACE FUNCTION public.cleanup_golden_path_data()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t_id uuid := 'a0000000-0000-4000-a000-000000000001'::uuid;
  counts jsonb := '{}'::jsonb;
  deleted_count integer;
BEGIN
  -- 1. document_links (depends on documents)
  DELETE FROM document_links WHERE tenant_id = t_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  counts := counts || jsonb_build_object('document_links', deleted_count);

  -- 2. documents
  DELETE FROM documents WHERE tenant_id = t_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  counts := counts || jsonb_build_object('documents', deleted_count);

  -- 3. listing_publications (depends on listings)
  DELETE FROM listing_publications WHERE listing_id IN (
    SELECT id FROM listings WHERE tenant_id = t_id
  );
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  counts := counts || jsonb_build_object('listing_publications', deleted_count);

  -- 4. listings
  DELETE FROM listings WHERE tenant_id = t_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  counts := counts || jsonb_build_object('listings', deleted_count);

  -- 5. finance_mandates (depends on finance_requests)
  DELETE FROM finance_mandates WHERE tenant_id = t_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  counts := counts || jsonb_build_object('finance_mandates', deleted_count);

  -- 6. finance_requests (depends on applicant_profiles via FK, but profiles reference requests)
  DELETE FROM finance_requests WHERE tenant_id = t_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  counts := counts || jsonb_build_object('finance_requests', deleted_count);

  -- 7. applicant_profiles
  DELETE FROM applicant_profiles WHERE tenant_id = t_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  counts := counts || jsonb_build_object('applicant_profiles', deleted_count);

  -- 8. leases (depends on units + contacts)
  DELETE FROM leases WHERE tenant_id = t_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  counts := counts || jsonb_build_object('leases', deleted_count);

  -- 9. loans (depends on properties)
  DELETE FROM loans WHERE tenant_id = t_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  counts := counts || jsonb_build_object('loans', deleted_count);

  -- 10. units (depends on properties)
  DELETE FROM units WHERE tenant_id = t_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  counts := counts || jsonb_build_object('units', deleted_count);

  -- 11. storage_nodes (auto-created only, scoped to tenant)
  DELETE FROM storage_nodes WHERE tenant_id = t_id AND auto_created = true;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  counts := counts || jsonb_build_object('storage_nodes', deleted_count);

  -- 12. properties
  DELETE FROM properties WHERE tenant_id = t_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  counts := counts || jsonb_build_object('properties', deleted_count);

  -- 13. context_members (depends on landlord_contexts)
  DELETE FROM context_members WHERE tenant_id = t_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  counts := counts || jsonb_build_object('context_members', deleted_count);

  -- 14. landlord_contexts
  DELETE FROM landlord_contexts WHERE tenant_id = t_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  counts := counts || jsonb_build_object('landlord_contexts', deleted_count);

  -- 15. contacts
  DELETE FROM contacts WHERE tenant_id = t_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  counts := counts || jsonb_build_object('contacts', deleted_count);

  -- 16. module_activations (optional)
  DELETE FROM tenant_tile_activation WHERE tenant_id = t_id;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  counts := counts || jsonb_build_object('module_activations', deleted_count);

  RETURN jsonb_build_object('success', true, 'cleanup_counts', counts);
END;
$$;

-- ============================================================
-- D4a: REGISTER FINANCE REQUEST FOLDERS TRIGGER
-- Uses existing columns only: tenant_id, parent_id, name, node_type, auto_created, template_id, scope_hint, doc_type_hint
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_finance_request_folders()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  root_id uuid;
  privat_id uuid;
  firma_id uuid;
BEGIN
  -- Idempotency: Skip if already has folder
  IF NEW.storage_folder_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Create root folder for Finance Request (using only existing columns)
  INSERT INTO storage_nodes (
    tenant_id, 
    name, 
    node_type, 
    auto_created,
    template_id,
    scope_hint
  )
  VALUES (
    NEW.tenant_id, 
    'Finanzierung ' || COALESCE(NEW.public_id, 'FIN-' || substring(NEW.id::text, 1, 8)), 
    'folder', 
    true, 
    'FINANCE_REQUEST_V1',
    'FINANCE'
  )
  RETURNING id INTO root_id;
  
  -- Set storage_folder_id on the NEW row
  NEW.storage_folder_id := root_id;
  
  -- Create Privat folder
  INSERT INTO storage_nodes (tenant_id, parent_id, name, node_type, auto_created, scope_hint)
  VALUES (NEW.tenant_id, root_id, 'Privat', 'folder', true, 'FINANCE')
  RETURNING id INTO privat_id;
  
  -- Create Privat subfolders
  INSERT INTO storage_nodes (tenant_id, parent_id, name, node_type, auto_created, scope_hint, doc_type_hint) VALUES 
    (NEW.tenant_id, privat_id, 'Identität', 'folder', true, 'FINANCE', 'DOC_ID_CARD'),
    (NEW.tenant_id, privat_id, 'Einkommen', 'folder', true, 'FINANCE', 'DOC_PAYSLIP'),
    (NEW.tenant_id, privat_id, 'Vermögen', 'folder', true, 'FINANCE', 'DOC_BANK_STATEMENT'),
    (NEW.tenant_id, privat_id, 'Verpflichtungen', 'folder', true, 'FINANCE', 'DOC_LOAN_STATEMENT');
  
  -- Create Firma folder
  INSERT INTO storage_nodes (tenant_id, parent_id, name, node_type, auto_created, scope_hint)
  VALUES (NEW.tenant_id, root_id, 'Firma', 'folder', true, 'FINANCE')
  RETURNING id INTO firma_id;
  
  -- Create Firma subfolders
  INSERT INTO storage_nodes (tenant_id, parent_id, name, node_type, auto_created, scope_hint, doc_type_hint) VALUES 
    (NEW.tenant_id, firma_id, 'BWA-SuSa', 'folder', true, 'FINANCE', 'DOC_BWA'),
    (NEW.tenant_id, firma_id, 'Steuern', 'folder', true, 'FINANCE', 'DOC_TAX_ASSESSMENT');
  
  -- Create Objektunterlagen folder
  INSERT INTO storage_nodes (tenant_id, parent_id, name, node_type, auto_created, scope_hint, doc_type_hint)
  VALUES (NEW.tenant_id, root_id, 'Objektunterlagen', 'folder', true, 'FINANCE', 'DOC_EXPOSE_BUY');
  
  RETURN NEW;
END;
$$;

-- Drop and recreate trigger to ensure it's registered
DROP TRIGGER IF EXISTS trg_create_finance_request_folders ON finance_requests;
CREATE TRIGGER trg_create_finance_request_folders
  BEFORE INSERT ON finance_requests
  FOR EACH ROW EXECUTE FUNCTION create_finance_request_folders();

-- ============================================================
-- D4b: BACKFILL storage_folder_id for existing finance_requests
-- ============================================================

DO $$
DECLARE
  rec RECORD;
  root_id uuid;
  privat_id uuid;
  firma_id uuid;
BEGIN
  FOR rec IN 
    SELECT id, tenant_id, public_id 
    FROM finance_requests 
    WHERE storage_folder_id IS NULL
  LOOP
    -- Create root folder (using only existing columns)
    INSERT INTO storage_nodes (
      tenant_id, 
      name, 
      node_type, 
      auto_created,
      template_id,
      scope_hint
    )
    VALUES (
      rec.tenant_id, 
      'Finanzierung ' || COALESCE(rec.public_id, 'FIN-' || substring(rec.id::text, 1, 8)), 
      'folder', 
      true, 
      'FINANCE_REQUEST_V1',
      'FINANCE'
    )
    RETURNING id INTO root_id;
    
    -- Update finance_request with folder reference
    UPDATE finance_requests SET storage_folder_id = root_id WHERE id = rec.id;
    
    -- Create Privat folder
    INSERT INTO storage_nodes (tenant_id, parent_id, name, node_type, auto_created, scope_hint)
    VALUES (rec.tenant_id, root_id, 'Privat', 'folder', true, 'FINANCE')
    RETURNING id INTO privat_id;
    
    -- Create Privat subfolders
    INSERT INTO storage_nodes (tenant_id, parent_id, name, node_type, auto_created, scope_hint, doc_type_hint) VALUES 
      (rec.tenant_id, privat_id, 'Identität', 'folder', true, 'FINANCE', 'DOC_ID_CARD'),
      (rec.tenant_id, privat_id, 'Einkommen', 'folder', true, 'FINANCE', 'DOC_PAYSLIP'),
      (rec.tenant_id, privat_id, 'Vermögen', 'folder', true, 'FINANCE', 'DOC_BANK_STATEMENT'),
      (rec.tenant_id, privat_id, 'Verpflichtungen', 'folder', true, 'FINANCE', 'DOC_LOAN_STATEMENT');
    
    -- Create Firma folder
    INSERT INTO storage_nodes (tenant_id, parent_id, name, node_type, auto_created, scope_hint)
    VALUES (rec.tenant_id, root_id, 'Firma', 'folder', true, 'FINANCE')
    RETURNING id INTO firma_id;
    
    -- Create Firma subfolders
    INSERT INTO storage_nodes (tenant_id, parent_id, name, node_type, auto_created, scope_hint, doc_type_hint) VALUES 
      (rec.tenant_id, firma_id, 'BWA-SuSa', 'folder', true, 'FINANCE', 'DOC_BWA'),
      (rec.tenant_id, firma_id, 'Steuern', 'folder', true, 'FINANCE', 'DOC_TAX_ASSESSMENT');
    
    -- Create Objektunterlagen folder
    INSERT INTO storage_nodes (tenant_id, parent_id, name, node_type, auto_created, scope_hint, doc_type_hint)
    VALUES (rec.tenant_id, root_id, 'Objektunterlagen', 'folder', true, 'FINANCE', 'DOC_EXPOSE_BUY');
  END LOOP;
END $$;