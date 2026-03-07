
-- ARCH-DMS-01: Move Storage File (atomic: document_links.node_id + storage_nodes.parent_id)
CREATE OR REPLACE FUNCTION public.move_storage_file(
  p_document_id uuid,
  p_new_folder_id uuid,
  p_tenant_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doc record;
  v_target record;
  v_links_updated integer;
  v_nodes_updated integer;
BEGIN
  -- 1. Validate document exists and belongs to tenant
  SELECT id, name, file_path
  INTO v_doc
  FROM documents
  WHERE id = p_document_id AND tenant_id = p_tenant_id AND deleted_at IS NULL;

  IF v_doc IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'document_not_found', 'message', 'Dokument nicht gefunden');
  END IF;

  -- 2. Validate target folder exists, is a folder, and belongs to tenant
  SELECT id, name, node_type
  INTO v_target
  FROM storage_nodes
  WHERE id = p_new_folder_id AND tenant_id = p_tenant_id;

  IF v_target IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'target_not_found', 'message', 'Zielordner nicht gefunden');
  END IF;

  IF v_target.node_type != 'folder' THEN
    RETURN jsonb_build_object('success', false, 'error', 'target_not_folder', 'message', 'Ziel ist kein Ordner');
  END IF;

  -- 3. Update document_links.node_id → new folder
  UPDATE document_links
  SET node_id = p_new_folder_id
  WHERE document_id = p_document_id AND tenant_id = p_tenant_id;
  GET DIAGNOSTICS v_links_updated = ROW_COUNT;

  -- 4. Update storage_nodes.parent_id for file-type nodes
  UPDATE storage_nodes
  SET parent_id = p_new_folder_id
  WHERE tenant_id = p_tenant_id AND node_type = 'file' AND storage_path = v_doc.file_path;
  GET DIAGNOSTICS v_nodes_updated = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'message', format('"%s" nach "%s" verschoben', v_doc.name, v_target.name),
    'links_updated', v_links_updated,
    'nodes_updated', v_nodes_updated
  );
END;
$$;

-- ARCH-DMS-01: Move Storage Folder (with circularity guard)
CREATE OR REPLACE FUNCTION public.move_storage_folder(
  p_folder_id uuid,
  p_new_parent_id uuid,
  p_tenant_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_folder record;
  v_target record;
  v_check_id uuid;
BEGIN
  -- 1. Validate folder exists and belongs to tenant
  SELECT id, name, node_type, template_id, parent_id
  INTO v_folder
  FROM storage_nodes
  WHERE id = p_folder_id AND tenant_id = p_tenant_id;

  IF v_folder IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'folder_not_found', 'message', 'Ordner nicht gefunden');
  END IF;

  IF v_folder.node_type != 'folder' THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_a_folder', 'message', 'Nur Ordner können verschoben werden');
  END IF;

  -- 2. Guard: System folders cannot be moved
  IF v_folder.template_id IS NOT NULL AND v_folder.template_id LIKE '%_ROOT' THEN
    RETURN jsonb_build_object('success', false, 'error', 'system_folder', 'message', 'Systemordner können nicht verschoben werden');
  END IF;

  -- 3. Guard: Cannot move to self
  IF p_folder_id = p_new_parent_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'self_reference', 'message', 'Ordner kann nicht in sich selbst verschoben werden');
  END IF;

  -- 4. Validate target exists and is a folder
  SELECT id, name, node_type
  INTO v_target
  FROM storage_nodes
  WHERE id = p_new_parent_id AND tenant_id = p_tenant_id;

  IF v_target IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'target_not_found', 'message', 'Zielordner nicht gefunden');
  END IF;

  IF v_target.node_type != 'folder' THEN
    RETURN jsonb_build_object('success', false, 'error', 'target_not_folder', 'message', 'Ziel ist kein Ordner');
  END IF;

  -- 5. Guard: Circularity check — walk up from target, must not hit p_folder_id
  v_check_id := p_new_parent_id;
  WHILE v_check_id IS NOT NULL LOOP
    IF v_check_id = p_folder_id THEN
      RETURN jsonb_build_object('success', false, 'error', 'circular_reference', 'message', 'Zielordner ist ein Unterordner des zu verschiebenden Ordners');
    END IF;
    SELECT parent_id INTO v_check_id
    FROM storage_nodes
    WHERE id = v_check_id AND tenant_id = p_tenant_id;
  END LOOP;

  -- 6. Guard: No-op if already there
  IF v_folder.parent_id = p_new_parent_id THEN
    RETURN jsonb_build_object('success', true, 'message', 'Ordner ist bereits im Zielordner', 'noop', true);
  END IF;

  -- 7. Perform the move
  UPDATE storage_nodes
  SET parent_id = p_new_parent_id
  WHERE id = p_folder_id AND tenant_id = p_tenant_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', format('"%s" nach "%s" verschoben', v_folder.name, v_target.name)
  );
END;
$$;
