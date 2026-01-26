-- MOD-04 Immobilien: Storage-Nodes + Document Links + Property Folder Trigger
-- =============================================================================

-- 1. storage_nodes Tabelle erstellen (DMS Ordnerstruktur)
CREATE TABLE IF NOT EXISTS storage_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES storage_nodes(id) ON DELETE CASCADE,
  name text NOT NULL,
  node_type text NOT NULL DEFAULT 'folder' CHECK (node_type IN ('folder', 'file')),
  property_id uuid REFERENCES properties(id) ON DELETE SET NULL,
  unit_id uuid REFERENCES units(id) ON DELETE SET NULL,
  auto_created boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS für storage_nodes
ALTER TABLE storage_nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON storage_nodes
  FOR ALL USING (tenant_id = (
    SELECT active_tenant_id FROM profiles WHERE id = auth.uid()
  ));

-- Indizes für storage_nodes
CREATE INDEX IF NOT EXISTS idx_storage_nodes_tenant ON storage_nodes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_storage_nodes_parent ON storage_nodes(parent_id);
CREATE INDEX IF NOT EXISTS idx_storage_nodes_property ON storage_nodes(property_id) WHERE property_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_storage_nodes_unit ON storage_nodes(unit_id) WHERE unit_id IS NOT NULL;

-- 2. document_links Tabelle für Object-Verknüpfung
CREATE TABLE IF NOT EXISTS document_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  node_id uuid REFERENCES storage_nodes(id) ON DELETE SET NULL,
  object_id uuid,
  object_type text CHECK (object_type IN ('property', 'unit', 'contact', 'finance_case', 'service_case')),
  unit_id uuid REFERENCES units(id) ON DELETE SET NULL,
  link_status text DEFAULT 'linked' CHECK (link_status IN ('linked', 'pending', 'archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS für document_links
ALTER TABLE document_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation" ON document_links
  FOR ALL USING (tenant_id = (
    SELECT active_tenant_id FROM profiles WHERE id = auth.uid()
  ));

-- Indizes für document_links
CREATE INDEX IF NOT EXISTS idx_document_links_object ON document_links(object_id, object_type);
CREATE INDEX IF NOT EXISTS idx_document_links_document ON document_links(document_id);
CREATE INDEX IF NOT EXISTS idx_document_links_node ON document_links(node_id);

-- 3. Automatische Property-Ordnerstruktur Trigger
CREATE OR REPLACE FUNCTION create_property_folder_structure()
RETURNS TRIGGER AS $$
DECLARE
  root_node_id uuid;
  allgemein_id uuid;
  einheiten_id uuid;
  prop_label text;
BEGIN
  -- Label für Ordner: Code oder Adresse
  prop_label := COALESCE(NEW.code, '') || CASE WHEN NEW.code IS NOT NULL THEN ' - ' ELSE '' END || NEW.address;
  
  -- Erstelle Haupt-Ordner für Property
  INSERT INTO storage_nodes (tenant_id, parent_id, name, node_type, property_id, auto_created)
  VALUES (NEW.tenant_id, NULL, prop_label, 'folder', NEW.id, true)
  RETURNING id INTO root_node_id;
  
  -- Erstelle Unterordner "Allgemein"
  INSERT INTO storage_nodes (tenant_id, parent_id, name, node_type, property_id, auto_created)
  VALUES (NEW.tenant_id, root_node_id, 'Allgemein', 'folder', NEW.id, true)
  RETURNING id INTO allgemein_id;
  
  -- Weitere Standard-Unterordner
  INSERT INTO storage_nodes (tenant_id, parent_id, name, node_type, property_id, auto_created)
  VALUES 
    (NEW.tenant_id, allgemein_id, 'Grundbuch', 'folder', NEW.id, true),
    (NEW.tenant_id, allgemein_id, 'Finanzierung', 'folder', NEW.id, true),
    (NEW.tenant_id, allgemein_id, 'Versicherung', 'folder', NEW.id, true),
    (NEW.tenant_id, allgemein_id, 'Sonstiges', 'folder', NEW.id, true);
  
  -- Erstelle "Einheiten" Container
  INSERT INTO storage_nodes (tenant_id, parent_id, name, node_type, property_id, auto_created)
  VALUES (NEW.tenant_id, root_node_id, 'Einheiten', 'folder', NEW.id, true)
  RETURNING id INTO einheiten_id;
  
  -- Erstelle "Sanierung" Container
  INSERT INTO storage_nodes (tenant_id, parent_id, name, node_type, property_id, auto_created)
  VALUES (NEW.tenant_id, root_node_id, 'Sanierung', 'folder', NEW.id, true);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if exists, then create
DROP TRIGGER IF EXISTS property_folder_structure ON properties;
CREATE TRIGGER property_folder_structure
  AFTER INSERT ON properties
  FOR EACH ROW EXECUTE FUNCTION create_property_folder_structure();

-- 4. Automatische Unit-Ordner Trigger
CREATE OR REPLACE FUNCTION create_unit_folder()
RETURNS TRIGGER AS $$
DECLARE
  einheiten_parent_id uuid;
  unit_folder_id uuid;
BEGIN
  -- Finde "Einheiten"-Ordner des Properties
  SELECT id INTO einheiten_parent_id 
  FROM storage_nodes 
  WHERE property_id = NEW.property_id 
    AND name = 'Einheiten' 
    AND node_type = 'folder'
  LIMIT 1;
  
  IF einheiten_parent_id IS NOT NULL THEN
    -- Erstelle Ordner für diese Einheit
    INSERT INTO storage_nodes (tenant_id, parent_id, name, node_type, property_id, unit_id, auto_created)
    VALUES (NEW.tenant_id, einheiten_parent_id, NEW.unit_number, 'folder', NEW.property_id, NEW.id, true)
    RETURNING id INTO unit_folder_id;
    
    -- Standard-Unterordner für Einheit
    INSERT INTO storage_nodes (tenant_id, parent_id, name, node_type, property_id, unit_id, auto_created)
    VALUES 
      (NEW.tenant_id, unit_folder_id, 'Mietvertrag', 'folder', NEW.property_id, NEW.id, true),
      (NEW.tenant_id, unit_folder_id, 'Protokolle', 'folder', NEW.property_id, NEW.id, true),
      (NEW.tenant_id, unit_folder_id, 'Korrespondenz', 'folder', NEW.property_id, NEW.id, true);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if exists, then create
DROP TRIGGER IF EXISTS unit_folder_create ON units;
CREATE TRIGGER unit_folder_create
  AFTER INSERT ON units
  FOR EACH ROW EXECUTE FUNCTION create_unit_folder();