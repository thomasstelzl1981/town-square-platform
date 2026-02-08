-- MOD-13: Add DMS integration and Marketing fields
-- Phase 1: DMS Integration

-- Add dev_project_id to storage_nodes for project folder linking
ALTER TABLE storage_nodes ADD COLUMN IF NOT EXISTS dev_project_id UUID REFERENCES dev_projects(id) ON DELETE SET NULL;
ALTER TABLE storage_nodes ADD COLUMN IF NOT EXISTS dev_project_unit_id UUID REFERENCES dev_project_units(id) ON DELETE SET NULL;

-- Create index for project folder lookup
CREATE INDEX IF NOT EXISTS idx_storage_nodes_dev_project_id ON storage_nodes(dev_project_id) WHERE dev_project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_storage_nodes_dev_project_unit_id ON storage_nodes(dev_project_unit_id) WHERE dev_project_unit_id IS NOT NULL;

-- Phase 2: Marketing fields for dev_projects
ALTER TABLE dev_projects ADD COLUMN IF NOT EXISTS kaufy_listed BOOLEAN DEFAULT false;
ALTER TABLE dev_projects ADD COLUMN IF NOT EXISTS kaufy_featured BOOLEAN DEFAULT false;
ALTER TABLE dev_projects ADD COLUMN IF NOT EXISTS landingpage_slug VARCHAR(100);
ALTER TABLE dev_projects ADD COLUMN IF NOT EXISTS landingpage_enabled BOOLEAN DEFAULT false;

-- Create unique index for landingpage slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_dev_projects_landingpage_slug 
  ON dev_projects(landingpage_slug) WHERE landingpage_slug IS NOT NULL;

-- Phase 3: Add commission_amount to dev_project_units for tracking
ALTER TABLE dev_project_units ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(12,2);

-- Phase 4: Create function to auto-create DMS structure on project creation
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
    is_system,
    display_order,
    dev_project_id
  ) VALUES (
    NEW.tenant_id,
    NEW.project_code,
    'folder',
    false,
    0,
    NEW.id
  ) RETURNING id INTO root_folder_id;

  -- Create Allgemein folder
  INSERT INTO storage_nodes (
    tenant_id,
    parent_id,
    name,
    node_type,
    is_system,
    display_order,
    dev_project_id
  ) VALUES (
    NEW.tenant_id,
    root_folder_id,
    'Allgemein',
    'folder',
    false,
    1,
    NEW.id
  ) RETURNING id INTO allgemein_folder_id;

  -- Create sub-folders under Allgemein
  INSERT INTO storage_nodes (tenant_id, parent_id, name, node_type, is_system, display_order, dev_project_id)
  VALUES 
    (NEW.tenant_id, allgemein_folder_id, 'Exposé', 'folder', false, 1, NEW.id),
    (NEW.tenant_id, allgemein_folder_id, 'Grundbuch', 'folder', false, 2, NEW.id),
    (NEW.tenant_id, allgemein_folder_id, 'Teilungserklärung', 'folder', false, 3, NEW.id),
    (NEW.tenant_id, allgemein_folder_id, 'Energieausweis', 'folder', false, 4, NEW.id),
    (NEW.tenant_id, allgemein_folder_id, 'Fotos', 'folder', false, 5, NEW.id);

  -- Create Einheiten folder
  INSERT INTO storage_nodes (
    tenant_id,
    parent_id,
    name,
    node_type,
    is_system,
    display_order,
    dev_project_id
  ) VALUES (
    NEW.tenant_id,
    root_folder_id,
    'Einheiten',
    'folder',
    false,
    2,
    NEW.id
  ) RETURNING id INTO einheiten_folder_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic DMS folder creation
DROP TRIGGER IF EXISTS trg_create_project_dms ON dev_projects;
CREATE TRIGGER trg_create_project_dms
  AFTER INSERT ON dev_projects
  FOR EACH ROW
  EXECUTE FUNCTION create_project_dms_structure();

-- Phase 5: Create function to add unit folder when unit is created
CREATE OR REPLACE FUNCTION create_unit_dms_folder()
RETURNS TRIGGER AS $$
DECLARE
  einheiten_folder_id UUID;
  unit_folder_id UUID;
BEGIN
  -- Find the Einheiten folder for this project
  SELECT id INTO einheiten_folder_id
  FROM storage_nodes
  WHERE dev_project_id = NEW.project_id
    AND name = 'Einheiten'
    AND node_type = 'folder'
  LIMIT 1;

  IF einheiten_folder_id IS NOT NULL THEN
    -- Create unit folder
    INSERT INTO storage_nodes (
      tenant_id,
      parent_id,
      name,
      node_type,
      is_system,
      display_order,
      dev_project_id,
      dev_project_unit_id
    ) VALUES (
      NEW.tenant_id,
      einheiten_folder_id,
      'WE-' || NEW.unit_number,
      'folder',
      false,
      0,
      NEW.project_id,
      NEW.id
    ) RETURNING id INTO unit_folder_id;

    -- Create sub-folders for unit
    INSERT INTO storage_nodes (tenant_id, parent_id, name, node_type, is_system, display_order, dev_project_id, dev_project_unit_id)
    VALUES 
      (NEW.tenant_id, unit_folder_id, 'Grundriss', 'folder', false, 1, NEW.project_id, NEW.id),
      (NEW.tenant_id, unit_folder_id, 'Mietvertrag', 'folder', false, 2, NEW.project_id, NEW.id),
      (NEW.tenant_id, unit_folder_id, 'Kaufvertrag', 'folder', false, 3, NEW.project_id, NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for unit folder creation
DROP TRIGGER IF EXISTS trg_create_unit_dms ON dev_project_units;
CREATE TRIGGER trg_create_unit_dms
  AFTER INSERT ON dev_project_units
  FOR EACH ROW
  EXECUTE FUNCTION create_unit_dms_folder();