
-- Fix the create_listing_folder_on_activation trigger function
-- The bug: it inserts into document_links without setting document_id (NOT NULL)
-- Fix: use a proper document_id from the storage_nodes' linked documents, or skip the link
CREATE OR REPLACE FUNCTION create_listing_folder_on_activation()
RETURNS TRIGGER AS $$
DECLARE
  mod06_root_id uuid;
  listing_folder_id uuid;
  listing_label text;
BEGIN
  -- Only trigger when status changes to 'active'
  IF NEW.status = 'active' AND (OLD IS NULL OR OLD.status IS DISTINCT FROM 'active') THEN
    
    -- Build listing label
    listing_label := 'Listing ' || COALESCE(NEW.public_id, NEW.id::text);
    
    -- 1. Find or create MOD-06 Root folder
    SELECT id INTO mod06_root_id FROM storage_nodes
    WHERE tenant_id = NEW.tenant_id AND template_id = 'MOD_06_ROOT';
    
    IF mod06_root_id IS NULL THEN
      INSERT INTO storage_nodes (tenant_id, name, node_type, template_id, module_code, auto_created)
      VALUES (NEW.tenant_id, 'Verkauf', 'folder', 'MOD_06_ROOT', 'MOD_06', true)
      RETURNING id INTO mod06_root_id;
    END IF;
    
    -- 2. Create Listing folder under MOD-06 Root
    INSERT INTO storage_nodes (
      tenant_id, parent_id, name, node_type, 
      template_id, module_code, auto_created
    )
    VALUES (
      NEW.tenant_id, mod06_root_id, listing_label, 'folder',
      'LISTING_DOSSIER_V1', 'MOD_06', true
    )
    RETURNING id INTO listing_folder_id;
    
    -- 3. Link property photo documents to the listing (skip if no photos exist)
    IF NEW.property_id IS NOT NULL THEN
      INSERT INTO document_links (tenant_id, document_id, node_id, object_type, object_id, link_status)
      SELECT DISTINCT
        NEW.tenant_id, 
        dl.document_id,
        listing_folder_id, 
        'listing', 
        NEW.id, 
        'active'
      FROM storage_nodes sn
      JOIN document_links dl ON dl.node_id = sn.id
      WHERE sn.property_id = NEW.property_id 
        AND sn.template_id = '11_Fotos'
        AND dl.document_id IS NOT NULL
      LIMIT 5;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
