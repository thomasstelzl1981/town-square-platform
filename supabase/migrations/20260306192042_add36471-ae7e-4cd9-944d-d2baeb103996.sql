
-- Server-side folder delete RPC with full guards
CREATE OR REPLACE FUNCTION public.delete_storage_folder(
  p_folder_id uuid,
  p_tenant_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_node record;
  v_child_folders_count integer;
  v_files_in_subtree integer;
  v_dangling_links integer;
BEGIN
  -- 1. Check folder exists and belongs to tenant
  SELECT id, name, template_id, node_type
  INTO v_node
  FROM storage_nodes
  WHERE id = p_folder_id AND tenant_id = p_tenant_id;
  
  IF v_node IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'folder_not_found', 'message', 'Ordner nicht gefunden');
  END IF;
  
  IF v_node.node_type != 'folder' THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_a_folder', 'message', 'Nur Ordner können gelöscht werden');
  END IF;
  
  -- 2. Guard: System folder (template_id ending with _ROOT)
  IF v_node.template_id IS NOT NULL AND v_node.template_id LIKE '%_ROOT' THEN
    RETURN jsonb_build_object('success', false, 'error', 'system_folder', 'message', 'Systemordner können nicht gelöscht werden');
  END IF;
  
  -- 3. Guard: Child folders
  SELECT count(*) INTO v_child_folders_count
  FROM storage_nodes
  WHERE parent_id = p_folder_id AND tenant_id = p_tenant_id AND node_type = 'folder';
  
  IF v_child_folders_count > 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'has_child_folders', 'message', 
      format('Ordner enthält %s Unterordner — bitte zuerst leeren', v_child_folders_count));
  END IF;
  
  -- 4. Guard: Files in subtree (file-type storage_nodes OR document_links pointing here)
  SELECT count(*) INTO v_files_in_subtree
  FROM storage_nodes
  WHERE parent_id = p_folder_id AND tenant_id = p_tenant_id AND node_type = 'file';
  
  IF v_files_in_subtree = 0 THEN
    -- Also check document_links
    SELECT count(*) INTO v_files_in_subtree
    FROM document_links
    WHERE node_id = p_folder_id AND tenant_id = p_tenant_id;
  END IF;
  
  IF v_files_in_subtree > 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'has_files', 'message', 
      format('Ordner enthält %s Dateien — bitte zuerst leeren', v_files_in_subtree));
  END IF;
  
  -- 5. Guard: Dangling/broken references
  SELECT count(*) INTO v_dangling_links
  FROM document_links
  WHERE node_id = p_folder_id AND tenant_id = p_tenant_id;
  
  IF v_dangling_links > 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'dangling_links', 'message', 
      format('Ordner hat %s verknüpfte Dokumente — bitte zuerst entfernen', v_dangling_links));
  END IF;
  
  -- 6. Safe to delete
  DELETE FROM storage_nodes WHERE id = p_folder_id AND tenant_id = p_tenant_id;
  
  RETURN jsonb_build_object('success', true, 'message', format('Ordner "%s" gelöscht', v_node.name));
END;
$$;

-- Server-side file delete RPC with full cleanup
CREATE OR REPLACE FUNCTION public.delete_storage_file(
  p_document_id uuid,
  p_tenant_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doc record;
  v_links_deleted integer;
  v_nodes_deleted integer;
BEGIN
  -- 1. Check document exists
  SELECT id, name, file_path
  INTO v_doc
  FROM documents
  WHERE id = p_document_id AND tenant_id = p_tenant_id AND deleted_at IS NULL;
  
  IF v_doc IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'document_not_found', 'message', 'Dokument nicht gefunden');
  END IF;
  
  -- 2. Delete document_links
  DELETE FROM document_links
  WHERE document_id = p_document_id AND tenant_id = p_tenant_id;
  GET DIAGNOSTICS v_links_deleted = ROW_COUNT;
  
  -- 3. Delete storage_nodes file-nodes
  DELETE FROM storage_nodes
  WHERE tenant_id = p_tenant_id AND node_type = 'file' AND storage_path = v_doc.file_path;
  GET DIAGNOSTICS v_nodes_deleted = ROW_COUNT;
  
  -- 4. Soft-delete document record
  UPDATE documents
  SET deleted_at = now()
  WHERE id = p_document_id AND tenant_id = p_tenant_id;
  
  -- 5. Return file_path for client-side blob cleanup
  RETURN jsonb_build_object(
    'success', true,
    'message', format('"%s" gelöscht', v_doc.name),
    'file_path', v_doc.file_path,
    'links_deleted', v_links_deleted,
    'nodes_deleted', v_nodes_deleted
  );
END;
$$;
