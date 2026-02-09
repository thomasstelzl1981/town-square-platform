-- Fix the project DMS structure trigger to use existing columns
CREATE OR REPLACE FUNCTION create_project_dms_structure()
RETURNS TRIGGER AS $$
DECLARE
  root_folder_id UUID;
  allgemein_folder_id UUID;
  einheiten_folder_id UUID;
BEGIN
  -- Create root project folder under DMS
  INSERT INTO storage_nodes (
    tenant_id,
    name,
    node_type,
    auto_created,
    sort_index,
    dev_project_id,
    module_code
  ) VALUES (
    NEW.tenant_id,
    NEW.project_code,
    'folder',
    true,
    0,
    NEW.id,
    'MOD-13'
  ) RETURNING id INTO root_folder_id;

  -- Create Allgemein folder
  INSERT INTO storage_nodes (
    tenant_id,
    parent_id,
    name,
    node_type,
    auto_created,
    sort_index,
    dev_project_id,
    module_code
  ) VALUES (
    NEW.tenant_id,
    root_folder_id,
    'Allgemein',
    'folder',
    true,
    1,
    NEW.id,
    'MOD-13'
  ) RETURNING id INTO allgemein_folder_id;

  -- Create sub-folders under Allgemein
  INSERT INTO storage_nodes (tenant_id, parent_id, name, node_type, auto_created, sort_index, dev_project_id, module_code)
  VALUES 
    (NEW.tenant_id, allgemein_folder_id, 'Exposé', 'folder', true, 1, NEW.id, 'MOD-13'),
    (NEW.tenant_id, allgemein_folder_id, 'Grundbuch', 'folder', true, 2, NEW.id, 'MOD-13'),
    (NEW.tenant_id, allgemein_folder_id, 'Teilungserklärung', 'folder', true, 3, NEW.id, 'MOD-13'),
    (NEW.tenant_id, allgemein_folder_id, 'Energieausweis', 'folder', true, 4, NEW.id, 'MOD-13'),
    (NEW.tenant_id, allgemein_folder_id, 'Fotos', 'folder', true, 5, NEW.id, 'MOD-13');

  -- Create Einheiten folder
  INSERT INTO storage_nodes (
    tenant_id,
    parent_id,
    name,
    node_type,
    auto_created,
    sort_index,
    dev_project_id,
    module_code
  ) VALUES (
    NEW.tenant_id,
    root_folder_id,
    'Einheiten',
    'folder',
    true,
    2,
    NEW.id,
    'MOD-13'
  ) RETURNING id INTO einheiten_folder_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;